from fastapi import APIRouter, HTTPException, Depends
from auth import get_current_user, get_current_provider
from database import invoices_collection, appointments_collection, log_audit
from models import InvoiceCreate
from datetime import datetime, date, timezone
import uuid
import os

# Stripe integration (using test keys)
try:
    import stripe
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_fake_key_for_demo_purposes_only")
    STRIPE_ENABLED = True
except ImportError:
    STRIPE_ENABLED = False

router = APIRouter(prefix="/billing", tags=["Billing"])

@router.get("/invoices")
async def get_invoices(
    status: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get user invoices"""
    user_id = current_user["userId"]
    user_type = current_user["userType"]
    
    # Build query based on user type
    if user_type == "provider":
        query = {"providerId": user_id}
    else:
        query = {"clientId": user_id}
    
    if status:
        query["status"] = status
    
    invoices = await invoices_collection.find(
        query,
        {"_id": 0}
    ).sort("date", -1).to_list(None)
    
    return invoices

@router.post("/invoices")
async def create_invoice(
    invoice: InvoiceCreate,
    current_user: dict = Depends(get_current_provider)
):
    """Create invoice (provider only)"""
    provider_id = current_user["userId"]
    
    # Verify provider owns the appointment if specified
    if invoice.appointmentId:
        appointment = await appointments_collection.find_one({"_id": invoice.appointmentId})
        if not appointment or appointment["providerId"] != provider_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create invoice
    invoice_dict = invoice.model_dump()
    invoice_id = str(uuid.uuid4())
    
    # Convert date objects to ISO strings for MongoDB compatibility
    if isinstance(invoice_dict.get("dueDate"), date):
        invoice_dict["dueDate"] = invoice_dict["dueDate"].isoformat()
    
    invoice_dict.update({
        "_id": invoice_id,
        "invoiceDate": date.today().isoformat(),
        "status": "pending",
        "paymentMethod": None,
        "transactionId": None,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    })
    
    await invoices_collection.insert_one(invoice_dict)
    await log_audit(provider_id, "create", "invoice", invoice_id)
    
    return {
        "message": "Invoice created successfully",
        "id": invoice_id
    }

@router.post("/payment-intent")
async def create_payment_intent(
    amount: float,
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe payment intent"""
    if not STRIPE_ENABLED:
        # Return mock response for demo
        return {
            "clientSecret": "pi_mock_secret_for_demo_purposes",
            "amount": amount,
            "message": "DEMO MODE: Stripe not configured. Using fake payment intent."
        }
    
    try:
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Convert to cents
            currency="usd",
            metadata={
                "user_id": current_user["userId"],
                "user_type": current_user["userType"]
            }
        )
        
        return {
            "clientSecret": intent.client_secret,
            "amount": amount
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment intent creation failed: {str(e)}")

@router.post("/pay")
async def process_payment(
    invoice_id: str,
    payment_method_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Process payment for invoice"""
    # Get invoice
    invoice = await invoices_collection.find_one({"_id": invoice_id})
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Verify user is the client
    if invoice["clientId"] != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if invoice["status"] == "paid":
        raise HTTPException(status_code=400, detail="Invoice already paid")
    
    # Process payment
    if not STRIPE_ENABLED:
        # Mock payment success
        transaction_id = f"txn_mock_{uuid.uuid4().hex[:12]}"
    else:
        try:
            # Create payment with Stripe
            payment_intent = stripe.PaymentIntent.create(
                amount=int(invoice["amount"] * 100),
                currency="usd",
                payment_method=payment_method_id,
                confirm=True,
                metadata={
                    "invoice_id": invoice_id,
                    "client_id": current_user["userId"]
                }
            )
            transaction_id = payment_intent.id
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=f"Payment failed: {str(e)}")
    
    # Update invoice
    await invoices_collection.update_one(
        {"_id": invoice_id},
        {"$set": {
            "status": "paid",
            "paymentMethod": "card",
            "transactionId": transaction_id,
            "updatedAt": datetime.now(timezone.utc)
        }}
    )
    
    await log_audit(current_user["userId"], "update", "invoice", invoice_id, {"action": "payment"})
    
    return {
        "success": True,
        "message": "Payment processed successfully",
        "transactionId": transaction_id
    }
