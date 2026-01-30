"""
Background task scheduler for appointment reminders.
Runs every hour to check for appointments happening in ~24 hours.
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from database import appointments_collection, users_collection
from services.email_service import send_appointment_reminder

logger = logging.getLogger(__name__)

# Track sent reminders to avoid duplicates (in-memory, resets on restart)
sent_reminders = set()


async def check_and_send_reminders():
    """
    Check for appointments happening in approximately 24 hours
    and send reminder emails.
    """
    try:
        now = datetime.now(timezone.utc)
        
        # Look for appointments between 23-25 hours from now
        target_date = (now + timedelta(hours=24)).strftime("%Y-%m-%d")
        
        logger.info(f"Checking for appointments on {target_date} to send reminders...")
        
        # Find confirmed appointments for tomorrow
        appointments = await appointments_collection.find({
            "date": target_date,
            "status": {"$in": ["confirmed", "pending"]}
        }).to_list(100)
        
        reminders_sent = 0
        
        for apt in appointments:
            apt_id = str(apt.get("_id", ""))
            
            # Skip if reminder already sent
            if apt_id in sent_reminders:
                continue
            
            try:
                # Get client info
                client = await users_collection.find_one(
                    {"user_id": apt["clientId"]},
                    {"_id": 0, "password": 0}
                )
                
                # Get provider info
                provider = await users_collection.find_one(
                    {"user_id": apt["providerId"]},
                    {"_id": 0, "password": 0}
                )
                
                if client and client.get("email"):
                    await send_appointment_reminder(
                        client_email=client["email"],
                        client_name=client.get("name", "Patient"),
                        provider_name=provider.get("name", "Provider") if provider else "Provider",
                        appointment_type=apt.get("type", "Appointment"),
                        appointment_date=apt.get("date", ""),
                        appointment_time=apt.get("time", ""),
                        video_link=apt.get("videoLink")
                    )
                    
                    sent_reminders.add(apt_id)
                    reminders_sent += 1
                    logger.info(f"Reminder sent for appointment {apt_id} to {client['email']}")
                    
            except Exception as e:
                logger.error(f"Failed to send reminder for appointment {apt_id}: {str(e)}")
        
        if reminders_sent > 0:
            logger.info(f"Sent {reminders_sent} appointment reminders")
        else:
            logger.debug("No reminders to send this cycle")
            
    except Exception as e:
        logger.error(f"Error in reminder check: {str(e)}")


async def reminder_scheduler():
    """
    Background task that runs every hour to check for appointments
    and send reminders.
    """
    logger.info("Appointment reminder scheduler started")
    
    while True:
        try:
            await check_and_send_reminders()
        except Exception as e:
            logger.error(f"Reminder scheduler error: {str(e)}")
        
        # Wait 1 hour before next check
        await asyncio.sleep(3600)


def start_reminder_scheduler():
    """
    Start the reminder scheduler as a background task.
    Call this from server startup.
    """
    asyncio.create_task(reminder_scheduler())
    logger.info("Reminder scheduler task created")
