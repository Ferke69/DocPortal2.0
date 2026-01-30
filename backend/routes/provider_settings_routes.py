from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from auth import get_current_provider, get_current_user
from database import provider_settings_collection, users_collection, log_audit
from models import ProviderBusinessSettings, ProviderSettingsUpdate
from services.invoice_validation import (
    validate_invoice_settings,
    get_country_requirements,
    get_all_country_configs
)
from datetime import datetime, timezone
import uuid
import base64
import os

router = APIRouter(prefix="/provider/settings", tags=["Provider Settings"])

@router.get("/business")
async def get_business_settings(current_user: dict = Depends(get_current_provider)):
    """Get provider's business settings for invoicing"""
    provider_id = current_user["userId"]
    
    settings = await provider_settings_collection.find_one(
        {"providerId": provider_id},
        {"_id": 0, "providerId": 0}
    )
    
    if not settings:
        # Return default settings with provider info
        provider = await users_collection.find_one(
            {"user_id": provider_id},
            {"_id": 0, "password": 0}
        )
        
        default_settings = ProviderBusinessSettings(
            businessName=provider.get("name") if provider else None,
            businessEmail=provider.get("email") if provider else None,
            businessPhone=provider.get("phone") if provider else None
        )
        return default_settings.model_dump()
    
    return settings

@router.put("/business")
async def update_business_settings(
    settings: ProviderSettingsUpdate,
    current_user: dict = Depends(get_current_provider)
):
    """Update provider's business settings"""
    provider_id = current_user["userId"]
    
    # Build update dict, excluding None values
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    update_data["providerId"] = provider_id
    update_data["updatedAt"] = datetime.now(timezone.utc)
    
    # Upsert settings
    await provider_settings_collection.update_one(
        {"providerId": provider_id},
        {"$set": update_data},
        upsert=True
    )
    
    await log_audit(provider_id, "update", "provider_settings", provider_id)
    
    # Return updated settings
    updated = await provider_settings_collection.find_one(
        {"providerId": provider_id},
        {"_id": 0, "providerId": 0}
    )
    
    return updated

@router.post("/logo")
async def upload_logo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_provider)
):
    """Upload provider logo for invoices"""
    provider_id = current_user["userId"]
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail="Invalid file type. Allowed: JPEG, PNG, WebP"
        )
    
    # Read and encode file
    contents = await file.read()
    
    # Check file size (max 2MB)
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum 2MB allowed.")
    
    # Convert to base64 data URL
    base64_data = base64.b64encode(contents).decode('utf-8')
    data_url = f"data:{file.content_type};base64,{base64_data}"
    
    # Update settings with logo
    await provider_settings_collection.update_one(
        {"providerId": provider_id},
        {"$set": {
            "logoUrl": data_url,
            "updatedAt": datetime.now(timezone.utc)
        }},
        upsert=True
    )
    
    await log_audit(provider_id, "update", "provider_logo", provider_id)
    
    return {"logoUrl": data_url, "message": "Logo uploaded successfully"}

@router.delete("/logo")
async def delete_logo(current_user: dict = Depends(get_current_provider)):
    """Remove provider logo"""
    provider_id = current_user["userId"]
    
    await provider_settings_collection.update_one(
        {"providerId": provider_id},
        {"$set": {
            "logoUrl": None,
            "updatedAt": datetime.now(timezone.utc)
        }}
    )
    
    await log_audit(provider_id, "delete", "provider_logo", provider_id)
    
    return {"message": "Logo removed successfully"}

@router.get("/invoice-number")
async def get_next_invoice_number(current_user: dict = Depends(get_current_provider)):
    """Get next invoice number and increment counter"""
    provider_id = current_user["userId"]
    
    settings = await provider_settings_collection.find_one({"providerId": provider_id})
    
    prefix = settings.get("invoicePrefix", "INV") if settings else "INV"
    next_number = settings.get("invoiceNextNumber", 1) if settings else 1
    
    # Generate invoice number with year
    year = datetime.now().year
    invoice_number = f"{prefix}-{year}-{next_number:05d}"
    
    # Increment counter
    await provider_settings_collection.update_one(
        {"providerId": provider_id},
        {"$inc": {"invoiceNextNumber": 1}},
        upsert=True
    )
    
    return {"invoiceNumber": invoice_number, "nextNumber": next_number + 1}
