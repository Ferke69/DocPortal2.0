from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from auth import get_current_user
from database import messages_collection, users_collection, log_audit
from models import MessageCreate
from datetime import datetime, timezone
from services.email_service import send_new_message_notification, is_email_configured
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/messages", tags=["Messages"])

@router.get("")
async def get_messages(
    conversationWith: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get user messages, optionally filtered by conversation partner"""
    user_id = current_user["userId"]
    
    query = {
        "$or": [
            {"senderId": user_id},
            {"receiverId": user_id}
        ]
    }
    
    if conversationWith:
        query["$or"] = [
            {"senderId": user_id, "receiverId": conversationWith},
            {"senderId": conversationWith, "receiverId": user_id}
        ]
    
    messages = await messages_collection.find(
        query,
        {"_id": 0}
    ).sort("timestamp", 1).to_list(None)
    
    return messages

@router.post("")
async def send_message(
    message: MessageCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Send a message"""
    # Verify sender is current user
    if message.senderId != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Can only send messages as yourself")
    
    # Verify receiver exists
    receiver = await users_collection.find_one({"user_id": message.receiverId})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    # Create message
    message_dict = message.model_dump()
    message_id = str(uuid.uuid4())
    message_dict.update({
        "_id": message_id,
        "read": False,
        "timestamp": datetime.now(timezone.utc),
        "createdAt": datetime.now(timezone.utc)
    })
    
    # In production, encrypt the message here
    # message_dict["message"] = encrypt_message(message_dict["message"])
    
    await messages_collection.insert_one(message_dict)
    await log_audit(current_user["userId"], "create", "message", message_id)
    
    # Send email notification if client is sending to provider
    if message.senderType == 'client' and is_email_configured():
        # Get sender (client) info
        sender = await users_collection.find_one({"user_id": message.senderId})
        client_name = sender.get("name", "A client") if sender else "A client"
        provider_name = receiver.get("name", "Provider")
        provider_email = receiver.get("email")
        
        if provider_email:
            # Add email notification to background tasks (non-blocking)
            background_tasks.add_task(
                send_new_message_notification,
                provider_email=provider_email,
                provider_name=provider_name,
                client_name=client_name,
                message_preview=message.message
            )
            logger.info(f"Email notification queued for provider {provider_email}")
    
    return {
        "message": "Message sent successfully",
        "id": message_id,
        "timestamp": message_dict["timestamp"]
    }

@router.patch("/{message_id}/read")
async def mark_as_read(
    message_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark message as read"""
    message = await messages_collection.find_one({"_id": message_id})
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Verify user is receiver
    if message["receiverId"] != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update message
    await messages_collection.update_one(
        {"_id": message_id},
        {"$set": {"read": True}}
    )
    
    return {"message": "Message marked as read"}
