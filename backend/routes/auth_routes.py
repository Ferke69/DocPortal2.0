from fastapi import APIRouter, HTTPException, Depends, Response, Request
from fastapi.responses import JSONResponse
from models import UserCreate, UserResponse, Token, LoginRequest, GoogleAuthRequest, TokenData
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from database import users_collection, invite_codes_collection, log_audit
import httpx
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])

# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

async def validate_invite_code(code: str):
    """Validate an invite code and return the associated provider"""
    invite = await invite_codes_collection.find_one({"code": code})
    
    if not invite:
        return None, "Invalid invite code"
    
    if invite.get("used"):
        return None, "This invite code has already been used"
    
    expires_at = invite.get("expiresAt")
    if expires_at:
        # Ensure both datetimes are timezone-aware for comparison
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires_at:
            return None, "This invite code has expired"
    
    return invite, None

@router.post("/register", response_model=dict)
async def register(user: UserCreate):
    """Register new user (provider or client)"""
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # For clients, validate invite code
    provider_id = None
    if user.userType == "client":
        if not user.inviteCode:
            raise HTTPException(status_code=400, detail="Invite code is required for client registration")
        
        invite, error = await validate_invite_code(user.inviteCode)
        if error:
            raise HTTPException(status_code=400, detail=error)
        
        provider_id = invite["providerId"]
        
        # Mark invite code as used
        await invite_codes_collection.update_one(
            {"code": user.inviteCode},
            {"$set": {"used": True, "usedAt": datetime.now(timezone.utc)}}
        )
    
    # Generate custom user_id
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Create user document
    user_dict = user.model_dump(exclude={"password", "inviteCode"})
    
    # Convert date objects to strings for MongoDB compatibility
    if "dateOfBirth" in user_dict and user_dict["dateOfBirth"]:
        user_dict["dateOfBirth"] = user_dict["dateOfBirth"].isoformat()
    
    user_dict.update({
        "user_id": user_id,
        "password": hashed_password,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    })
    
    # Set providerId for clients
    if user.userType == "client" and provider_id:
        user_dict["providerId"] = provider_id
    
    # Insert user
    await users_collection.insert_one(user_dict)
    
    # Create token
    token = create_access_token({
        "sub": user.email,
        "userId": user_id,
        "userType": user.userType
    })
    
    # Get user without password
    user_doc = await users_collection.find_one(
        {"user_id": user_id},
        {"_id": 0, "password": 0}
    )
    
    await log_audit(user_id, "create", "user", user_id, {"action": "register", "userType": user.userType})
    
    return {
        "token": token,
        "user": user_doc
    }

@router.post("/login", response_model=dict)
async def login(credentials: LoginRequest):
    """Login with email/password"""
    # Find user
    user = await users_collection.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    token = create_access_token({
        "sub": user["email"],
        "userId": user["user_id"],
        "userType": user["userType"]
    })
    
    # Get user without password and _id
    user_doc = await users_collection.find_one(
        {"user_id": user["user_id"]},
        {"_id": 0, "password": 0}
    )
    
    await log_audit(user["user_id"], "view", "user", user["user_id"], {"action": "login"})
    
    return {
        "token": token,
        "user": user_doc
    }

@router.post("/google")
async def google_auth(auth_request: GoogleAuthRequest, response: Response):
    """Handle Google OAuth via Emergent Auth"""
    try:
        # Exchange session_id for user data
        async with httpx.AsyncClient() as client:
            headers = {"X-Session-ID": auth_request.googleToken}
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers=headers,
                timeout=10.0
            )
            
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid session ID")
            
            user_data = resp.json()
        
        # Check if user exists
        existing_user = await users_collection.find_one({"email": user_data["email"]})
        
        if existing_user:
            # Update user info
            await users_collection.update_one(
                {"email": user_data["email"]},
                {"$set": {
                    "name": user_data.get("name", existing_user["name"]),
                    "avatar": user_data.get("picture", existing_user.get("avatar")),
                    "updatedAt": datetime.now(timezone.utc)
                }}
            )
            user_id = existing_user["user_id"]
            user_type = existing_user["userType"]
        else:
            # New user registration
            # For clients, validate invite code
            provider_id = None
            if auth_request.userType == "client":
                if not auth_request.inviteCode:
                    raise HTTPException(status_code=400, detail="Invite code is required for client registration")
                
                invite, error = await validate_invite_code(auth_request.inviteCode)
                if error:
                    raise HTTPException(status_code=400, detail=error)
                
                provider_id = invite["providerId"]
                
                # Mark invite code as used
                await invite_codes_collection.update_one(
                    {"code": auth_request.inviteCode},
                    {"$set": {"used": True, "usedAt": datetime.now(timezone.utc)}}
                )
            
            # Create new user with the specified user type
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user_doc = {
                "user_id": user_id,
                "email": user_data["email"],
                "name": user_data.get("name", "User"),
                "avatar": user_data.get("picture"),
                "userType": auth_request.userType,
                "phone": None,
                "password": get_password_hash(str(uuid.uuid4())),  # Random password for OAuth users
                "createdAt": datetime.now(timezone.utc),
                "updatedAt": datetime.now(timezone.utc)
            }
            
            # Add provider-specific fields if userType is provider
            if auth_request.userType == "provider":
                user_doc.update({
                    "specialty": None,
                    "license": None,
                    "bio": None,
                    "hourlyRate": None
                })
            
            # Add providerId for clients
            if auth_request.userType == "client" and provider_id:
                user_doc["providerId"] = provider_id
            
            await users_collection.insert_one(user_doc)
            user_type = auth_request.userType
        
        # Create JWT token
        token = create_access_token({
            "sub": user_data["email"],
            "userId": user_id,
            "userType": user_type
        })
        
        # Set httpOnly cookie
        response.set_cookie(
            key="session_token",
            value=token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7 * 24 * 60 * 60,  # 7 days
            path="/"
        )
        
        # Get user data without password
        user_doc = await users_collection.find_one(
            {"user_id": user_id},
            {"_id": 0, "password": 0}
        )
        
        await log_audit(user_id, "view", "user", user_id, {"action": "google_login", "userType": user_type})
        
        return {
            "token": token,
            "user": user_doc
        }
        
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Auth service timeout")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile - supports both cookie and header auth"""
    user = await users_collection.find_one(
        {"user_id": current_user["userId"]},
        {"_id": 0, "password": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.post("/logout")
async def logout(response: Response):
    """Logout user"""
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}


@router.get("/validate-invite/{code}")
async def validate_invite_code_endpoint(code: str):
    """Validate an invite code and return provider info"""
    invite, error = await validate_invite_code(code)
    
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    # Get provider info
    provider = await users_collection.find_one(
        {"user_id": invite["providerId"]},
        {"_id": 0, "password": 0, "email": 0}
    )
    
    if not provider:
        raise HTTPException(status_code=400, detail="Provider not found")
    
    return {
        "valid": True,
        "provider": {
            "name": provider.get("name"),
            "specialty": provider.get("specialty"),
            "avatar": provider.get("avatar")
        },
        "expiresAt": invite["expiresAt"].isoformat()
    }
