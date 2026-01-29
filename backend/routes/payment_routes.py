from fastapi import APIRouter, HTTPException, Depends
from auth import get_current_user
from database import appointments_collection, invoices_collection, payments_collection, users_collection, log_audit
from models import PaymentIntentCreate, PaymentConfirm
from datetime import datetime, date, timezone
import uuid
import os

router = APIRouter(prefix="/payments", tags=["Payments"])

# Check if Stripe is configured
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
STRIPE_CONFIGURED = bool(STRIPE_SECRET_KEY and STRIPE_SECRET_KEY != 'sk_test_YOUR_SECRET_KEY_HERE')

if STRIPE_CONFIGURED:
    import stripe
    stripe.api_key = STRIPE_SECRET_KEY

@router.get("/config")
async def get_payment_config():
    """Get payment configuration status"""
    publishable_key = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')
    
    return {
        "configured": STRIPE_CONFIGURED,
        "publishableKey": publishable_key if STRIPE_CONFIGURED else None,
        "testMode": publishable_key.startswith('pk_test_') if publishable_key else True,
        "message": "Stripe is configured" if STRIPE_CONFIGURED else "Stripe not configured. See STRIPE_SETUP_GUIDE.md for instructions."
    }

@router.post("/create-payment-intent")
async def create_payment_intent(
    payment_data: PaymentIntentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a payment intent for an appointment"""
    user_id = current_user["userId"]
    
    # Get the appointment
    appointment = await appointments_collection.find_one({"_id": payment_data.appointmentId})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Verify user is the client for this appointment
    if appointment["clientId"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to pay for this appointment")
    
    # Check if already paid
    existing_payment = await payments_collection.find_one({
        "appointmentId": payment_data.appointmentId,
        "status": "succeeded"
    })
    if existing_payment:
        raise HTTPException(status_code=400, detail="Appointment already paid")
    
    amount_cents = int(payment_data.amount * 100)  # Convert to cents
    
    if STRIPE_CONFIGURED:
        try:
            # Create real Stripe payment intent
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='usd',
                metadata={
                    'appointmentId': payment_data.appointmentId,
                    'clientId': user_id,
                    'providerId': appointment['providerId']
                }
            )
            
            # Store payment record
            payment_record = {
                "_id": str(uuid.uuid4()),
                "appointmentId": payment_data.appointmentId,
                "clientId": user_id,
                "providerId": appointment['providerId'],
                "amount": payment_data.amount,
                "currency": "usd",
                "stripePaymentIntentId": intent.id,
                "status": "pending",
                "createdAt": datetime.now(timezone.utc)
            }
            await payments_collection.insert_one(payment_record)
            
            return {
                "clientSecret": intent.client_secret,
                "paymentIntentId": intent.id,
                "amount": payment_data.amount
            }
            
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        # MOCK MODE - Return simulated payment intent
        mock_intent_id = f"pi_mock_{uuid.uuid4().hex[:24]}"
        mock_client_secret = f"{mock_intent_id}_secret_mock"
        
        # Store mock payment record
        payment_record = {
            "_id": str(uuid.uuid4()),
            "appointmentId": payment_data.appointmentId,
            "clientId": user_id,
            "providerId": appointment['providerId'],
            "amount": payment_data.amount,
            "currency": "usd",
            "stripePaymentIntentId": mock_intent_id,
            "status": "pending",
            "isMock": True,
            "createdAt": datetime.now(timezone.utc)
        }
        await payments_collection.insert_one(payment_record)
        
        return {
            "clientSecret": mock_client_secret,
            "paymentIntentId": mock_intent_id,
            "amount": payment_data.amount,
            "mockMode": True,
            "message": "MOCK MODE: Stripe not configured. Payment will be simulated."
        }

@router.post("/confirm-payment")
async def confirm_payment(
    confirm_data: PaymentConfirm,
    current_user: dict = Depends(get_current_user)
):
    """Confirm payment completion and update appointment status"""
    user_id = current_user["userId"]
    
    # Get payment record
    payment = await payments_collection.find_one({
        "stripePaymentIntentId": confirm_data.paymentIntentId
    })
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment["clientId"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if STRIPE_CONFIGURED:
        try:
            # Verify payment with Stripe
            intent = stripe.PaymentIntent.retrieve(confirm_data.paymentIntentId)
            
            if intent.status != 'succeeded':
                raise HTTPException(status_code=400, detail=f"Payment not successful. Status: {intent.status}")
            
            payment_status = "succeeded"
            
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        # MOCK MODE - Auto-succeed
        payment_status = "succeeded"
    
    # Update payment record
    await payments_collection.update_one(
        {"_id": payment["_id"]},
        {
            "$set": {
                "status": payment_status,
                "completedAt": datetime.now(timezone.utc)
            }
        }
    )
    
    # Update appointment status to confirmed
    await appointments_collection.update_one(
        {"_id": confirm_data.appointmentId},
        {
            "$set": {
                "status": "confirmed",
                "paymentStatus": "paid",
                "updatedAt": datetime.now(timezone.utc)
            }
        }
    )
    
    # Create invoice record
    appointment = await appointments_collection.find_one({"_id": confirm_data.appointmentId})
    
    invoice_record = {
        "_id": str(uuid.uuid4()),
        "appointmentId": confirm_data.appointmentId,
        "clientId": payment["clientId"],
        "providerId": payment["providerId"],
        "amount": payment["amount"],
        "description": f"Payment for appointment on {appointment.get('date', 'N/A')}",
        "dueDate": date.today().isoformat(),
        "invoiceDate": date.today().isoformat(),
        "status": "paid",
        "paymentMethod": "stripe",
        "transactionId": confirm_data.paymentIntentId,
        "createdAt": datetime.now(timezone.utc)
    }
    await invoices_collection.insert_one(invoice_record)
    
    await log_audit(user_id, "create", "payment", payment["_id"])
    
    return {
        "success": True,
        "message": "Payment confirmed successfully",
        "appointmentStatus": "confirmed",
        "invoiceId": invoice_record["_id"]
    }

@router.get("/appointment/{appointment_id}")
async def get_appointment_payment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get payment status for an appointment"""
    user_id = current_user["userId"]
    
    # Get appointment
    appointment = await appointments_collection.find_one({"_id": appointment_id})
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Verify user is involved
    if appointment["clientId"] != user_id and appointment["providerId"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get payment record
    payment = await payments_collection.find_one(
        {"appointmentId": appointment_id},
        {"_id": 0}
    )
    
    return {
        "appointmentId": appointment_id,
        "payment": payment,
        "paymentRequired": appointment.get("paymentStatus") != "paid",
        "amount": appointment.get("amount", 0)
    }
