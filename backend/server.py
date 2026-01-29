from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime
import uvicorn

# Import routes
from routes.auth_routes import router as auth_router
from routes.provider_routes import router as provider_router
from routes.client_routes import router as client_router
from routes.appointment_routes import router as appointment_router
from routes.message_routes import router as message_router
from routes.billing_routes import router as billing_router
from routes.payment_routes import router as payment_router
from routes.pending_items_routes import router as pending_items_router

# Import database initialization
from database import init_db

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'simplepractice')]

# Create the main app without a prefix
app = FastAPI(
    title="DocPortal API",
    description="HIPAA-compliant practice management platform",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check endpoint
@api_router.get("/")
async def root():
    return {
        "message": "DocPortal API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat()
    }

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": datetime.utcnow().isoformat()
    }

# Include all route modules
api_router.include_router(auth_router)
api_router.include_router(provider_router)
api_router.include_router(client_router)
api_router.include_router(appointment_router)
api_router.include_router(message_router)
api_router.include_router(billing_router)
api_router.include_router(payment_router)
api_router.include_router(pending_items_router)

# Include the router in the main app
app.include_router(api_router)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],  # In production, specify exact origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize database indexes on startup"""
    logger.info("Starting DocPortal API...")
    try:
        await init_db()
        logger.info("✓ Database initialized successfully")
        logger.info("✓ DocPortal API is ready")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection on shutdown"""
    logger.info("Shutting down DocPortal API...")
    client.close()
    logger.info("✓ Database connection closed")

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)