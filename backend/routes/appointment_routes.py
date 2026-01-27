from fastapi import APIRouter, HTTPException, Depends
from auth import get_current_user
from database import appointments_collection, users_collection, log_audit
from models import AppointmentCreate, AppointmentUpdate
from datetime import datetime, timezone, date
import uuid
import secrets

router = APIRouter(prefix="/appointments", tags=["Appointments"])

def generate_google_meet_link():
    """Generate a unique Google Meet-style link
    In production, you would integrate with Google Calendar API or Google Meet API
    For now, we'll create a placeholder structure
    """
    # Format: meet.google.com/xxx-yyyy-zzz
    code1 = secrets.token_urlsafe(3)[:3]
    code2 = secrets.token_urlsafe(4)[:4]
    code3 = secrets.token_urlsafe(3)[:3]
    return f"https://meet.google.com/{code1}-{code2}-{code3}"

@router.post("")
async def create_appointment(
    appointment: AppointmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Book new appointment (client action)"""
    # Verify client is booking for themselves
    if current_user["userType"] == "client" and appointment.clientId != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Can only book appointments for yourself")
    
    # Verify provider exists
    provider = await users_collection.find_one({"user_id": appointment.providerId})
    if not provider or provider["userType"] != "provider":
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Generate Google Meet link
    video_link = generate_google_meet_link()
    
    # Create appointment
    appointment_dict = appointment.model_dump()
    appointment_id = str(uuid.uuid4())
    
    # Convert date to string for MongoDB storage
    if isinstance(appointment_dict.get("date"), date):
        appointment_dict["date"] = appointment_dict["date"].isoformat()
    
    appointment_dict.update({
        "_id": appointment_id,
        "status": "pending",
        "videoLink": video_link,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    })
    
    await appointments_collection.insert_one(appointment_dict)
    await log_audit(current_user["userId"], "create", "appointment", appointment_id)
    
    return {
        "message": "Appointment created successfully",
        "id": appointment_id,
        "videoLink": video_link,
        "status": "pending"
    }

@router.get("/{appointment_id}")
async def get_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get appointment details"""
    appointment = await appointments_collection.find_one(
        {"_id": appointment_id},
        {"_id": 0}
    )
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Verify user is involved in appointment
    if current_user["userId"] not in [appointment["clientId"], appointment["providerId"]]:
        raise HTTPException(status_code=403, detail="Not authorized to view this appointment")
    
    await log_audit(current_user["userId"], "view", "appointment", appointment_id)
    return appointment

@router.patch("/{appointment_id}")
async def update_appointment(
    appointment_id: str,
    update: AppointmentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update appointment (reschedule, change status)"""
    appointment = await appointments_collection.find_one({"_id": appointment_id})
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Verify user is involved in appointment
    if current_user["userId"] not in [appointment["clientId"], appointment["providerId"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Build update dict
    update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
    
    # Convert date to string for MongoDB storage
    if isinstance(update_dict.get("date"), date):
        update_dict["date"] = update_dict["date"].isoformat()
    
    update_dict["updatedAt"] = datetime.now(timezone.utc)
    
    # Update appointment
    await appointments_collection.update_one(
        {"_id": appointment_id},
        {"$set": update_dict}
    )
    
    await log_audit(current_user["userId"], "update", "appointment", appointment_id, update_dict)
    
    return {"message": "Appointment updated successfully"}

@router.delete("/{appointment_id}")
async def cancel_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancel appointment"""
    appointment = await appointments_collection.find_one({"_id": appointment_id})
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Verify user is involved in appointment
    if current_user["userId"] not in [appointment["clientId"], appointment["providerId"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update status to cancelled
    await appointments_collection.update_one(
        {"_id": appointment_id},
        {"$set": {"status": "cancelled", "updatedAt": datetime.now(timezone.utc)}}
    )
    
    await log_audit(current_user["userId"], "delete", "appointment", appointment_id)
    
    return {"message": "Appointment cancelled successfully"}

@router.post("/{appointment_id}/join")
async def join_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get video link for appointment"""
    appointment = await appointments_collection.find_one({"_id": appointment_id})
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Verify user is involved in appointment
    if current_user["userId"] not in [appointment["clientId"], appointment["providerId"]]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Return video link
    return {
        "videoLink": appointment.get("videoLink", generate_google_meet_link()),
        "appointmentId": appointment_id,
        "status": appointment["status"]
    }
