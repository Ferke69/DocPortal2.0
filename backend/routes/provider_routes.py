from fastapi import APIRouter, HTTPException, Depends
from auth import get_current_provider
from database import users_collection, appointments_collection, messages_collection, invoices_collection, clinical_notes_collection, invite_codes_collection, working_hours_collection, log_audit
from models import ProviderDashboardStats, ClinicalNoteCreate, ClinicalNoteInDB, InviteCodeCreate, WorkingHours, WorkingHoursUpdate, DaySchedule
from datetime import datetime, date, timezone, timedelta
from bson import ObjectId
import uuid
import secrets
import string

router = APIRouter(prefix="/provider", tags=["Provider"])

def generate_invite_code():
    """Generate a random 8-character invite code"""
    # Use uppercase letters and digits, excluding confusing characters (0, O, I, L)
    chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    return ''.join(secrets.choice(chars) for _ in range(8))

@router.post("/invite-code")
async def create_invite_code(
    code_request: InviteCodeCreate = InviteCodeCreate(),
    current_user: dict = Depends(get_current_provider)
):
    """Generate a new invite code for clients to join"""
    provider_id = current_user["userId"]
    
    # Get provider info
    provider = await users_collection.find_one({"user_id": provider_id})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    # Generate unique code
    code = generate_invite_code()
    
    # Ensure code is unique
    while await invite_codes_collection.find_one({"code": code}):
        code = generate_invite_code()
    
    # Create invite code document
    invite_doc = {
        "code": code,
        "providerId": provider_id,
        "providerName": provider.get("name", "Provider"),
        "createdAt": datetime.now(timezone.utc),
        "expiresAt": datetime.now(timezone.utc) + timedelta(days=code_request.expiresInDays),
        "used": False,
        "usedBy": None,
        "usedAt": None
    }
    
    await invite_codes_collection.insert_one(invite_doc)
    await log_audit(provider_id, "create", "invite_code", code)
    
    return {
        "code": code,
        "expiresAt": invite_doc["expiresAt"].isoformat(),
        "expiresInDays": code_request.expiresInDays
    }

@router.get("/invite-codes")
async def get_invite_codes(current_user: dict = Depends(get_current_provider)):
    """Get all invite codes created by the provider"""
    provider_id = current_user["userId"]
    
    codes = await invite_codes_collection.find(
        {"providerId": provider_id},
        {"_id": 0}
    ).sort("createdAt", -1).to_list(50)
    
    # Convert datetime objects to ISO format strings
    for code in codes:
        if "createdAt" in code:
            code["createdAt"] = code["createdAt"].isoformat()
        if "expiresAt" in code:
            code["expiresAt"] = code["expiresAt"].isoformat()
        if "usedAt" in code and code["usedAt"]:
            code["usedAt"] = code["usedAt"].isoformat()
    
    return codes

@router.delete("/invite-codes/{code}")
async def delete_invite_code(code: str, current_user: dict = Depends(get_current_provider)):
    """Delete an unused invite code"""
    provider_id = current_user["userId"]
    
    invite = await invite_codes_collection.find_one({"code": code, "providerId": provider_id})
    
    if not invite:
        raise HTTPException(status_code=404, detail="Invite code not found")
    
    if invite.get("used"):
        raise HTTPException(status_code=400, detail="Cannot delete a used invite code")
    
    await invite_codes_collection.delete_one({"code": code})
    await log_audit(provider_id, "delete", "invite_code", code)
    
    return {"message": "Invite code deleted successfully"}

@router.get("/dashboard", response_model=ProviderDashboardStats)
async def get_dashboard(current_user: dict = Depends(get_current_provider)):
    """Get provider dashboard statistics"""
    provider_id = current_user["userId"]
    
    # Get active clients
    active_clients = await users_collection.count_documents({
        "userType": "client",
        "providerId": provider_id
    })
    
    # Get today's appointments
    today = date.today()
    today_appointments = await appointments_collection.count_documents({
        "providerId": provider_id,
        "date": today.isoformat(),
        "status": {"$ne": "cancelled"}
    })
    
    # Get week's appointments
    week_appointments = await appointments_collection.count_documents({
        "providerId": provider_id,
        "status": {"$ne": "cancelled"}
    })
    
    # Get unread messages
    unread_messages = await messages_collection.count_documents({
        "receiverId": provider_id,
        "read": False
    })
    
    # Get pending notes (completed appointments without notes)
    completed_appointments = await appointments_collection.find({
        "providerId": provider_id,
        "status": "completed"
    }).to_list(None)
    
    pending_notes = 0
    for apt in completed_appointments:
        note = await clinical_notes_collection.find_one({"appointmentId": apt["_id"]})
        if not note:
            pending_notes += 1
    
    # Calculate income (simplified - from paid invoices)
    paid_invoices = await invoices_collection.find({
        "providerId": provider_id,
        "status": "paid"
    }).to_list(None)
    
    total_income = sum(inv["amount"] for inv in paid_invoices)
    
    # Monthly income (current month)
    current_month = datetime.now(timezone.utc).month
    monthly_invoices = [inv for inv in paid_invoices if datetime.fromisoformat(inv["date"]).month == current_month]
    monthly_income = sum(inv["amount"] for inv in monthly_invoices)
    
    # Upcoming appointments
    upcoming = await appointments_collection.count_documents({
        "providerId": provider_id,
        "status": {"$in": ["confirmed", "pending"]}
    })
    
    return ProviderDashboardStats(
        totalIncome=total_income,
        monthlyIncome=monthly_income,
        appointmentsToday=today_appointments,
        appointmentsWeek=week_appointments,
        pendingNotes=pending_notes,
        activeClients=active_clients,
        messagesUnread=unread_messages,
        upcomingAppointments=upcoming
    )

@router.get("/clients")
async def get_clients(current_user: dict = Depends(get_current_provider)):
    """Get all clients of the provider"""
    provider_id = current_user["userId"]
    
    clients = await users_collection.find(
        {"userType": "client", "providerId": provider_id},
        {"_id": 0, "password": 0}
    ).to_list(None)
    
    await log_audit(provider_id, "view", "clients", provider_id, {"count": len(clients)})
    
    return clients

@router.get("/appointments")
async def get_appointments(
    date: str = None,
    status: str = None,
    current_user: dict = Depends(get_current_provider)
):
    """Get provider appointments with optional filters"""
    provider_id = current_user["userId"]
    
    query = {"providerId": provider_id}
    if date:
        query["date"] = date
    if status:
        query["status"] = status
    
    appointments = await appointments_collection.find(
        query,
        {"_id": 0}
    ).sort("date", -1).to_list(None)
    
    return appointments

@router.post("/clinical-notes")
async def create_clinical_note(
    note: ClinicalNoteCreate,
    current_user: dict = Depends(get_current_provider)
):
    """Create clinical note for an appointment"""
    provider_id = current_user["userId"]
    
    # Verify appointment belongs to provider
    appointment = await appointments_collection.find_one({"_id": ObjectId(note.appointmentId)})
    if not appointment or appointment["providerId"] != provider_id:
        raise HTTPException(status_code=403, detail="Not authorized to create note for this appointment")
    
    # Check if note already exists
    existing_note = await clinical_notes_collection.find_one({"appointmentId": note.appointmentId})
    if existing_note:
        raise HTTPException(status_code=400, detail="Clinical note already exists for this appointment")
    
    # Create note
    note_dict = note.model_dump()
    note_dict.update({
        "_id": str(uuid.uuid4()),
        "date": date.today().isoformat(),
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    })
    
    await clinical_notes_collection.insert_one(note_dict)
    await log_audit(provider_id, "create", "clinical_note", note_dict["_id"])
    
    return {"message": "Clinical note created successfully", "id": note_dict["_id"]}

@router.get("/clinical-notes/{appointment_id}")
async def get_clinical_note(
    appointment_id: str,
    current_user: dict = Depends(get_current_provider)
):
    """Get clinical note for an appointment"""
    provider_id = current_user["userId"]
    
    # Verify appointment belongs to provider
    appointment = await appointments_collection.find_one({"_id": ObjectId(appointment_id)})
    if not appointment or appointment["providerId"] != provider_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    note = await clinical_notes_collection.find_one(
        {"appointmentId": appointment_id},
        {"_id": 0}
    )
    
    if not note:
        raise HTTPException(status_code=404, detail="Clinical note not found")
    
    await log_audit(provider_id, "view", "clinical_note", appointment_id)
    return note
