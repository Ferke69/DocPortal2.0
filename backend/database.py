from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ.get('DB_NAME', 'simplepractice')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Collections
users_collection = db['users']
appointments_collection = db['appointments']
messages_collection = db['messages']
invoices_collection = db['invoices']
clinical_notes_collection = db['clinical_notes']
audit_logs_collection = db['audit_logs']
invite_codes_collection = db['invite_codes']

async def init_db():
    """Initialize database indexes for performance and uniqueness"""
    # Users
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("userType")
    await users_collection.create_index("providerId")
    
    # Appointments
    await appointments_collection.create_index([("providerId", 1), ("date", -1)])
    await appointments_collection.create_index([("clientId", 1), ("date", -1)])
    await appointments_collection.create_index("status")
    
    # Messages
    await messages_collection.create_index([("senderId", 1), ("receiverId", 1), ("timestamp", -1)])
    await messages_collection.create_index("read")
    
    # Invoices
    await invoices_collection.create_index([("clientId", 1), ("status", 1)])
    await invoices_collection.create_index([("providerId", 1), ("status", 1)])
    
    # Clinical Notes
    await clinical_notes_collection.create_index("appointmentId", unique=True)
    await clinical_notes_collection.create_index("clientId")
    
    # Audit Logs
    await audit_logs_collection.create_index([("userId", 1), ("timestamp", -1)])
    await audit_logs_collection.create_index("action")
    
    # Invite Codes
    await invite_codes_collection.create_index("code", unique=True)
    await invite_codes_collection.create_index("providerId")
    await invite_codes_collection.create_index("expiresAt")
    
    print("✓ Database indexes created")

async def log_audit(user_id: str, action: str, resource_type: str, resource_id: str, details: dict = None):
    """Log audit trail for HIPAA compliance"""
    from datetime import datetime
    
    audit_entry = {
        "userId": user_id,
        "action": action,  # 'view', 'create', 'update', 'delete'
        "resourceType": resource_type,  # 'user', 'appointment', 'message', 'invoice', 'clinical_note'
        "resourceId": resource_id,
        "details": details or {},
        "timestamp": datetime.utcnow(),
        "ipAddress": None  # Can be added from request
    }
    
    await audit_logs_collection.insert_one(audit_entry)
