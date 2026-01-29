from fastapi import APIRouter, HTTPException, Depends, Query
from auth import get_current_provider
from database import pending_items_collection, users_collection, appointments_collection, log_audit
from models import PendingItemCreate, PendingItemUpdate
from datetime import datetime, timezone, timedelta
from typing import Optional, Literal
import uuid

router = APIRouter(prefix="/provider/pending-items", tags=["Pending Items"])


def calculate_urgency(created_at: datetime, status: str) -> str:
    """Calculate urgency based on age and status"""
    if status == 'paid':
        return 'low'
    
    # Ensure created_at has timezone info
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    
    age = datetime.now(timezone.utc) - created_at
    
    if age > timedelta(days=7):
        return 'high'
    elif age > timedelta(days=3):
        return 'medium'
    return 'low'


@router.get("/summary")
async def get_pending_items_summary(current_user: dict = Depends(get_current_provider)):
    """Get summary counts for pending items widget"""
    provider_id = current_user["userId"]
    
    # Count unsettled video sessions (appointments completed but not finalized)
    video_sessions_count = await pending_items_collection.count_documents({
        "providerId": provider_id,
        "type": "video_session",
        "status": {"$ne": "paid"}
    })
    
    # Count pending orders
    orders_count = await pending_items_collection.count_documents({
        "providerId": provider_id,
        "type": "order",
        "status": {"$ne": "paid"}
    })
    
    # Get total counts by status
    open_count = await pending_items_collection.count_documents({
        "providerId": provider_id,
        "status": "open"
    })
    
    paid_count = await pending_items_collection.count_documents({
        "providerId": provider_id,
        "status": "paid"
    })
    
    unpaid_count = await pending_items_collection.count_documents({
        "providerId": provider_id,
        "status": "unpaid"
    })
    
    # Calculate high urgency items
    high_urgency_count = 0
    items = await pending_items_collection.find({
        "providerId": provider_id,
        "status": {"$ne": "paid"}
    }).to_list(None)
    
    for item in items:
        if calculate_urgency(item.get("createdAt", datetime.now(timezone.utc)), item["status"]) == "high":
            high_urgency_count += 1
    
    return {
        "videoSessionsCount": video_sessions_count,
        "ordersCount": orders_count,
        "totalPending": video_sessions_count + orders_count,
        "openCount": open_count,
        "paidCount": paid_count,
        "unpaidCount": unpaid_count,
        "highUrgencyCount": high_urgency_count
    }


@router.get("")
async def get_pending_items(
    status: Optional[str] = Query(None, description="Filter by status: open, paid, unpaid"),
    item_type: Optional[str] = Query(None, alias="type", description="Filter by type: video_session, order"),
    sort_by: str = Query("createdAt", description="Sort by: createdAt, status, amount"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    current_user: dict = Depends(get_current_provider)
):
    """Get all pending items with filtering and sorting"""
    provider_id = current_user["userId"]
    
    # Build query
    query = {"providerId": provider_id}
    
    if status:
        query["status"] = status
    
    if item_type:
        query["type"] = item_type
    
    # Build sort
    sort_direction = -1 if sort_order == "desc" else 1
    sort_field = sort_by if sort_by in ["createdAt", "status", "amount"] else "createdAt"
    
    items = await pending_items_collection.find(
        query,
        {"_id": 0}
    ).sort(sort_field, sort_direction).to_list(100)
    
    # Enrich with client names and urgency
    for item in items:
        # Get client name
        client = await users_collection.find_one(
            {"user_id": item["clientId"]},
            {"name": 1, "_id": 0}
        )
        item["clientName"] = client.get("name", "Unknown") if client else "Unknown"
        
        # Calculate urgency
        created_at = item.get("createdAt", datetime.now(timezone.utc))
        item["urgency"] = calculate_urgency(created_at, item["status"])
        
        # Convert datetime to ISO string
        if "createdAt" in item and isinstance(item["createdAt"], datetime):
            item["createdAt"] = item["createdAt"].isoformat()
        if "updatedAt" in item and isinstance(item["updatedAt"], datetime):
            item["updatedAt"] = item["updatedAt"].isoformat()
    
    return items


@router.post("")
async def create_pending_item(
    item: PendingItemCreate,
    current_user: dict = Depends(get_current_provider)
):
    """Create a new pending item"""
    provider_id = current_user["userId"]
    
    # Ensure providerId matches current user
    if item.providerId != provider_id:
        raise HTTPException(status_code=403, detail="Cannot create items for other providers")
    
    item_dict = item.model_dump()
    item_dict["id"] = str(uuid.uuid4())
    item_dict["createdAt"] = datetime.now(timezone.utc)
    item_dict["updatedAt"] = datetime.now(timezone.utc)
    
    await pending_items_collection.insert_one(item_dict)
    await log_audit(provider_id, "create", "pending_item", item_dict["id"])
    
    return {"message": "Pending item created", "id": item_dict["id"]}


@router.put("/{item_id}")
async def update_pending_item(
    item_id: str,
    update: PendingItemUpdate,
    current_user: dict = Depends(get_current_provider)
):
    """Update a pending item's status or details"""
    provider_id = current_user["userId"]
    
    # Find the item
    item = await pending_items_collection.find_one({
        "id": item_id,
        "providerId": provider_id
    })
    
    if not item:
        raise HTTPException(status_code=404, detail="Pending item not found")
    
    # Build update dict
    update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
    update_dict["updatedAt"] = datetime.now(timezone.utc)
    
    await pending_items_collection.update_one(
        {"id": item_id},
        {"$set": update_dict}
    )
    
    await log_audit(provider_id, "update", "pending_item", item_id, update_dict)
    
    return {"message": "Pending item updated"}


@router.delete("/{item_id}")
async def delete_pending_item(
    item_id: str,
    current_user: dict = Depends(get_current_provider)
):
    """Delete a pending item"""
    provider_id = current_user["userId"]
    
    result = await pending_items_collection.delete_one({
        "id": item_id,
        "providerId": provider_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pending item not found")
    
    await log_audit(provider_id, "delete", "pending_item", item_id)
    
    return {"message": "Pending item deleted"}


@router.post("/{item_id}/mark-paid")
async def mark_item_paid(
    item_id: str,
    current_user: dict = Depends(get_current_provider)
):
    """Quick action to mark an item as paid"""
    provider_id = current_user["userId"]
    
    result = await pending_items_collection.update_one(
        {"id": item_id, "providerId": provider_id},
        {"$set": {"status": "paid", "updatedAt": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pending item not found")
    
    await log_audit(provider_id, "update", "pending_item", item_id, {"status": "paid"})
    
    return {"message": "Item marked as paid"}


@router.post("/{item_id}/mark-unpaid")
async def mark_item_unpaid(
    item_id: str,
    current_user: dict = Depends(get_current_provider)
):
    """Quick action to mark an item as unpaid"""
    provider_id = current_user["userId"]
    
    result = await pending_items_collection.update_one(
        {"id": item_id, "providerId": provider_id},
        {"$set": {"status": "unpaid", "updatedAt": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pending item not found")
    
    await log_audit(provider_id, "update", "pending_item", item_id, {"status": "unpaid"})
    
    return {"message": "Item marked as unpaid"}
