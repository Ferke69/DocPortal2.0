from fastapi import APIRouter, HTTPException, Depends
from auth import get_current_user, get_current_provider
from database import (
    refund_requests_collection, appointments_collection, 
    payments_collection, invoices_collection, users_collection, log_audit
)
from models import RefundRequestCreate, RefundApproval
from datetime import datetime, timezone, timedelta
from services.email_service import (
    send_refund_requested_notification,
    send_refund_approved_notification,
    send_refund_rejected_notification
)
import uuid
import os
import logging

logger = logging.getLogger(__name__)

# Stripe integration
try:
    import stripe
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_fake_key_for_demo_purposes_only")
    STRIPE_ENABLED = bool(os.getenv("STRIPE_SECRET_KEY"))
except ImportError:
    STRIPE_ENABLED = False

router = APIRouter(prefix="/refunds", tags=["Refunds"])

# Minimum days before appointment for refund eligibility
REFUND_DAYS_BEFORE = 3

@router.post("/request")
async def request_refund(
    request: RefundRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Client requests a refund for an appointment.
    Requirements:
    - Appointment must be at least 3 days in the future
    - Appointment must be paid
    - Client must provide a valid reason
    """
    user_id = current_user["userId"]
    user_type = current_user["userType"]
    
    if user_type != "client":
        raise HTTPException(status_code=403, detail="Only clients can request refunds")
    
    # Validate reason
    if not request.reason or len(request.reason.strip()) < 10:
        raise HTTPException(
            status_code=400, 
            detail="Please provide a valid reason (at least 10 characters)"
        )
    
    # Get appointment
    appointment = await appointments_collection.find_one({"_id": request.appointmentId})
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Verify client owns this appointment
    if appointment["clientId"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to request refund for this appointment")
    
    # Check if appointment is already cancelled
    if appointment.get("status") == "cancelled":
        raise HTTPException(status_code=400, detail="Appointment is already cancelled")
    
    # Check if appointment date is at least 3 days in the future
    appointment_date_str = appointment["date"]
    try:
        appointment_date = datetime.strptime(appointment_date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid appointment date format")
    
    today = datetime.now(timezone.utc).date()
    days_until_appointment = (appointment_date - today).days
    
    if days_until_appointment < REFUND_DAYS_BEFORE:
        raise HTTPException(
            status_code=400, 
            detail=f"Refunds are only available for appointments at least {REFUND_DAYS_BEFORE} days in advance. Your appointment is in {days_until_appointment} day(s)."
        )
    
    # Check if payment exists for this appointment
    payment = await payments_collection.find_one({
        "appointmentId": request.appointmentId,
        "status": "completed"
    })
    
    if not payment:
        raise HTTPException(status_code=400, detail="No completed payment found for this appointment")
    
    # Check if refund request already exists
    existing_request = await refund_requests_collection.find_one({
        "appointmentId": request.appointmentId,
        "status": {"$in": ["pending", "approved"]}
    })
    
    if existing_request:
        raise HTTPException(status_code=400, detail="A refund request already exists for this appointment")
    
    # Create refund request
    refund_id = str(uuid.uuid4())
    refund_doc = {
        "_id": refund_id,
        "appointmentId": request.appointmentId,
        "clientId": user_id,
        "providerId": appointment["providerId"],
        "amount": payment.get("amount", appointment.get("amount", 0)),
        "reason": request.reason.strip(),
        "status": "pending",
        "providerResponse": None,
        "createdAt": datetime.now(timezone.utc),
        "processedAt": None,
        "stripeRefundId": None,
        "paymentIntentId": payment.get("paymentIntentId")
    }
    
    await refund_requests_collection.insert_one(refund_doc)
    await log_audit(user_id, "create", "refund_request", refund_id)
    
    # Send email notification to provider
    try:
        # Get client info
        client = await users_collection.find_one(
            {"user_id": user_id},
            {"_id": 0, "password": 0}
        )
        
        # Get provider info
        provider = await users_collection.find_one(
            {"user_id": appointment["providerId"]},
            {"_id": 0, "password": 0}
        )
        
        if provider and provider.get("email"):
            await send_refund_requested_notification(
                provider_email=provider["email"],
                provider_name=provider.get("name", "Provider"),
                client_name=client.get("name", "Client") if client else "Client",
                appointment_type=appointment.get("type", "Appointment"),
                appointment_date=appointment.get("date", ""),
                appointment_time=appointment.get("time", ""),
                amount=refund_doc["amount"],
                reason=request.reason.strip()
            )
            logger.info(f"Refund request notification sent to provider {provider['email']}")
    except Exception as e:
        logger.error(f"Failed to send refund request notification: {str(e)}")
    
    return {
        "id": refund_id,
        "message": "Refund request submitted successfully. Your provider will review it shortly.",
        "status": "pending"
    }

@router.get("/my-requests")
async def get_my_refund_requests(current_user: dict = Depends(get_current_user)):
    """Get all refund requests for the current user (client or provider)"""
    user_id = current_user["userId"]
    user_type = current_user["userType"]
    
    if user_type == "client":
        query = {"clientId": user_id}
    else:
        query = {"providerId": user_id}
    
    requests = await refund_requests_collection.find(
        query,
        {"_id": 0}
    ).sort("createdAt", -1).to_list(50)
    
    # Add id field and format dates
    for req in requests:
        if "createdAt" in req:
            req["createdAt"] = req["createdAt"].isoformat()
        if "processedAt" in req and req["processedAt"]:
            req["processedAt"] = req["processedAt"].isoformat()
    
    return requests

@router.get("/pending")
async def get_pending_refunds(current_user: dict = Depends(get_current_provider)):
    """Get all pending refund requests for provider to review"""
    provider_id = current_user["userId"]
    
    requests = await refund_requests_collection.find(
        {"providerId": provider_id, "status": "pending"},
        {"_id": 0}
    ).sort("createdAt", -1).to_list(50)
    
    # Enrich with client and appointment info
    enriched_requests = []
    for req in requests:
        # Get client info
        client = await users_collection.find_one(
            {"user_id": req["clientId"]},
            {"_id": 0, "password": 0}
        )
        
        # Get appointment info
        appointment = await appointments_collection.find_one(
            {"_id": req["appointmentId"]},
            {"_id": 0}
        )
        
        req["clientName"] = client.get("name") if client else "Unknown"
        req["clientEmail"] = client.get("email") if client else None
        req["appointmentDate"] = appointment.get("date") if appointment else None
        req["appointmentTime"] = appointment.get("time") if appointment else None
        req["appointmentType"] = appointment.get("type") if appointment else None
        
        if "createdAt" in req:
            req["createdAt"] = req["createdAt"].isoformat()
        
        enriched_requests.append(req)
    
    return enriched_requests

@router.post("/{refund_id}/process")
async def process_refund(
    refund_id: str,
    approval: RefundApproval,
    current_user: dict = Depends(get_current_provider)
):
    """Provider approves or rejects a refund request"""
    provider_id = current_user["userId"]
    
    # Get refund request
    refund_request = await refund_requests_collection.find_one({"_id": refund_id})
    
    if not refund_request:
        raise HTTPException(status_code=404, detail="Refund request not found")
    
    # Verify provider owns this request
    if refund_request["providerId"] != provider_id:
        raise HTTPException(status_code=403, detail="Not authorized to process this refund")
    
    if refund_request["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Refund request is already {refund_request['status']}")
    
    if approval.approved:
        # Process refund through Stripe
        stripe_refund_id = None
        
        if STRIPE_ENABLED and refund_request.get("paymentIntentId"):
            try:
                refund = stripe.Refund.create(
                    payment_intent=refund_request["paymentIntentId"],
                    amount=int(refund_request["amount"] * 100),  # Convert to cents
                    reason="requested_by_customer"
                )
                stripe_refund_id = refund.id
            except stripe.error.StripeError as e:
                raise HTTPException(status_code=400, detail=f"Stripe refund failed: {str(e)}")
        else:
            # Mock refund for demo
            stripe_refund_id = f"re_mock_{uuid.uuid4().hex[:12]}"
        
        # Update refund request
        await refund_requests_collection.update_one(
            {"_id": refund_id},
            {"$set": {
                "status": "approved",
                "providerResponse": approval.providerResponse,
                "processedAt": datetime.now(timezone.utc),
                "stripeRefundId": stripe_refund_id
            }}
        )
        
        # Cancel the appointment
        await appointments_collection.update_one(
            {"_id": refund_request["appointmentId"]},
            {"$set": {
                "status": "cancelled",
                "cancelledAt": datetime.now(timezone.utc),
                "cancellationReason": "Refund approved"
            }}
        )
        
        # Update payment status
        await payments_collection.update_one(
            {"appointmentId": refund_request["appointmentId"]},
            {"$set": {
                "status": "refunded",
                "refundedAt": datetime.now(timezone.utc),
                "refundId": stripe_refund_id
            }}
        )
        
        await log_audit(provider_id, "update", "refund_request", refund_id, {"action": "approved"})
        
        # Send email notification to client
        try:
            client = await users_collection.find_one(
                {"user_id": refund_request["clientId"]},
                {"_id": 0, "password": 0}
            )
            appointment = await appointments_collection.find_one(
                {"_id": refund_request["appointmentId"]},
                {"_id": 0}
            )
            
            if client and client.get("email"):
                await send_refund_approved_notification(
                    client_email=client["email"],
                    client_name=client.get("name", "Client"),
                    appointment_type=appointment.get("type", "Appointment") if appointment else "Appointment",
                    appointment_date=appointment.get("date", "") if appointment else "",
                    amount=refund_request["amount"],
                    provider_response=approval.providerResponse
                )
                logger.info(f"Refund approved notification sent to client {client['email']}")
        except Exception as e:
            logger.error(f"Failed to send refund approved notification: {str(e)}")
        
        return {
            "message": "Refund approved and processed successfully",
            "refundId": stripe_refund_id,
            "status": "approved"
        }
    else:
        # Reject refund
        await refund_requests_collection.update_one(
            {"_id": refund_id},
            {"$set": {
                "status": "rejected",
                "providerResponse": approval.providerResponse or "Refund request rejected",
                "processedAt": datetime.now(timezone.utc)
            }}
        )
        
        await log_audit(provider_id, "update", "refund_request", refund_id, {"action": "rejected"})
        
        return {
            "message": "Refund request rejected",
            "status": "rejected"
        }

@router.get("/{refund_id}")
async def get_refund_details(
    refund_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get details of a specific refund request"""
    user_id = current_user["userId"]
    
    refund = await refund_requests_collection.find_one({"_id": refund_id})
    
    if not refund:
        raise HTTPException(status_code=404, detail="Refund request not found")
    
    # Verify access
    if refund["clientId"] != user_id and refund["providerId"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this refund request")
    
    # Format response
    refund["id"] = refund.pop("_id")
    if "createdAt" in refund:
        refund["createdAt"] = refund["createdAt"].isoformat()
    if "processedAt" in refund and refund["processedAt"]:
        refund["processedAt"] = refund["processedAt"].isoformat()
    
    return refund
