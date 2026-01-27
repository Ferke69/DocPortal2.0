from fastapi import APIRouter, HTTPException, Depends
from auth import get_current_client
from database import users_collection, appointments_collection, messages_collection, invoices_collection, log_audit
from models import ClientDashboardStats, AppointmentCreate
from datetime import datetime, date, timezone
import uuid

router = APIRouter(prefix="/client", tags=["Client"])

@router.get("/dashboard", response_model=ClientDashboardStats)
async def get_dashboard(current_user: dict = Depends(get_current_client)):
    """Get client dashboard statistics"""
    client_id = current_user["userId"]
    
    # Get upcoming appointments
    upcoming_appointments = await appointments_collection.count_documents({
        "clientId": client_id,
        "status": {"$in": ["confirmed", "pending"]}
    })
    
    # Get pending payments
    pending_payments = await invoices_collection.count_documents({
        "clientId": client_id,
        "status": {"$in": ["pending", "overdue"]}
    })
    
    # Get unread messages
    unread_messages = await messages_collection.count_documents({
        "receiverId": client_id,
        "read": False
    })
    
    # Get completed sessions
    completed_sessions = await appointments_collection.count_documents({
        "clientId": client_id,
        "status": "completed"
    })
    
    return ClientDashboardStats(
        upcomingAppointments=upcoming_appointments,
        pendingPayments=pending_payments,
        unreadMessages=unread_messages,
        completedSessions=completed_sessions
    )

@router.get("/provider")
async def get_provider(current_user: dict = Depends(get_current_client)):
    """Get assigned provider details"""
    client = await users_collection.find_one(
        {"user_id": current_user["userId"]},
        {"_id": 0}
    )
    
    if not client or not client.get("providerId"):
        raise HTTPException(status_code=404, detail="No provider assigned")
    
    provider = await users_collection.find_one(
        {"user_id": client["providerId"]},
        {"_id": 0, "password": 0}
    )
    
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    return provider

@router.get("/appointments")
async def get_appointments(
    status: str = None,
    current_user: dict = Depends(get_current_client)
):
    """Get client appointments"""
    client_id = current_user["userId"]
    
    query = {"clientId": client_id}
    if status:
        query["status"] = status
    
    appointments = await appointments_collection.find(
        query,
        {"_id": 0}
    ).sort("date", -1).to_list(None)
    
    return appointments
