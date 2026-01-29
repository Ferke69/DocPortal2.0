from fastapi import APIRouter, HTTPException, Depends
from auth import get_current_client
from database import users_collection, appointments_collection, messages_collection, invoices_collection, working_hours_collection, log_audit
from models import ClientDashboardStats, AppointmentCreate
from datetime import datetime, date, timezone, timedelta
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


@router.get("/provider/available-slots/{date_str}")
async def get_provider_available_slots(
    date_str: str,
    current_user: dict = Depends(get_current_client)
):
    """Get available time slots from assigned provider for a specific date"""
    client_id = current_user["userId"]
    
    # Get client's provider
    client = await users_collection.find_one({"user_id": client_id})
    if not client or not client.get("providerId"):
        raise HTTPException(status_code=404, detail="No provider assigned")
    
    provider_id = client["providerId"]
    
    # Validate date format
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Don't allow booking in the past
    if target_date < date.today():
        return {"slots": [], "message": "Cannot book appointments in the past"}
    
    # Get provider's working hours
    schedule = await working_hours_collection.find_one({"providerId": provider_id})
    
    if not schedule:
        # Use default schedule (Mon-Fri 9-5)
        schedule = {
            "monday": {"enabled": True, "startTime": "09:00", "endTime": "17:00"},
            "tuesday": {"enabled": True, "startTime": "09:00", "endTime": "17:00"},
            "wednesday": {"enabled": True, "startTime": "09:00", "endTime": "17:00"},
            "thursday": {"enabled": True, "startTime": "09:00", "endTime": "17:00"},
            "friday": {"enabled": True, "startTime": "09:00", "endTime": "17:00"},
            "saturday": {"enabled": False, "startTime": "09:00", "endTime": "17:00"},
            "sunday": {"enabled": False, "startTime": "09:00", "endTime": "17:00"},
            "slotDuration": 60
        }
    
    # Get day of week
    day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    day_name = day_names[target_date.weekday()]
    
    day_schedule = schedule.get(day_name, {})
    
    if not day_schedule.get('enabled', False):
        return {"slots": [], "message": f"Provider is not available on {day_name.capitalize()}"}
    
    # Get slot duration
    slot_duration = schedule.get('slotDuration', 60)
    
    # Generate time slots
    start_time = datetime.strptime(day_schedule['startTime'], "%H:%M")
    end_time = datetime.strptime(day_schedule['endTime'], "%H:%M")
    
    # Get break times if set
    break_start = None
    break_end = None
    if day_schedule.get('breakStart') and day_schedule.get('breakEnd'):
        break_start = datetime.strptime(day_schedule['breakStart'], "%H:%M")
        break_end = datetime.strptime(day_schedule['breakEnd'], "%H:%M")
    
    # Get existing appointments for this date (NOT cancelled)
    existing_appointments = await appointments_collection.find({
        "providerId": provider_id,
        "date": date_str,
        "status": {"$nin": ["cancelled"]}
    }).to_list(None)
    
    booked_times = set()
    for apt in existing_appointments:
        booked_times.add(apt['time'])
    
    # Generate available slots
    slots = []
    current_time = start_time
    
    while current_time + timedelta(minutes=slot_duration) <= end_time:
        time_str = current_time.strftime("%I:%M %p")
        time_24h = current_time.strftime("%H:%M")
        
        # Check if slot is during break
        is_break = False
        if break_start and break_end:
            if break_start <= current_time < break_end:
                is_break = True
        
        # Check if slot is already booked
        is_booked = time_str in booked_times
        
        if not is_break and not is_booked:
            # For today, don't show past times
            if target_date == date.today():
                now = datetime.now()
                slot_datetime = datetime.combine(target_date, current_time.time())
                if slot_datetime > now:
                    slots.append({
                        "time": time_str,
                        "time24h": time_24h,
                        "available": True
                    })
            else:
                slots.append({
                    "time": time_str,
                    "time24h": time_24h,
                    "available": True
                })
        
        current_time += timedelta(minutes=slot_duration)
    
    return {"slots": slots, "slotDuration": slot_duration}
