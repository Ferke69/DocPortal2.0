from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime, date
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# Emergency Contact
class EmergencyContact(BaseModel):
    name: str
    phone: str
    relationship: str

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    userType: Literal['provider', 'client']

class UserCreate(UserBase):
    password: str
    # Provider specific
    specialty: Optional[str] = None
    license: Optional[str] = None
    bio: Optional[str] = None
    hourlyRate: Optional[float] = None
    # Client specific
    dateOfBirth: Optional[date] = None
    address: Optional[str] = None
    insurance: Optional[str] = None
    providerId: Optional[str] = None
    emergencyContact: Optional[EmergencyContact] = None

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    password: str
    # Provider specific
    specialty: Optional[str] = None
    license: Optional[str] = None
    bio: Optional[str] = None
    hourlyRate: Optional[float] = None
    # Client specific
    dateOfBirth: Optional[date] = None
    address: Optional[str] = None
    insurance: Optional[str] = None
    providerId: Optional[str] = None
    emergencyContact: Optional[EmergencyContact] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(UserBase):
    id: str
    specialty: Optional[str] = None
    license: Optional[str] = None
    bio: Optional[str] = None
    hourlyRate: Optional[float] = None
    dateOfBirth: Optional[date] = None
    address: Optional[str] = None
    insurance: Optional[str] = None
    providerId: Optional[str] = None
    emergencyContact: Optional[EmergencyContact] = None
    createdAt: datetime
    updatedAt: datetime

# Appointment Models
class AppointmentBase(BaseModel):
    clientId: str
    providerId: str
    date: date
    time: str
    duration: int  # minutes
    type: str
    notes: Optional[str] = None
    amount: float

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentInDB(AppointmentBase):
    id: str = Field(alias="_id")
    status: Literal['pending', 'confirmed', 'completed', 'cancelled'] = 'pending'
    videoLink: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class AppointmentUpdate(BaseModel):
    date: Optional[date] = None
    time: Optional[str] = None
    status: Optional[Literal['pending', 'confirmed', 'completed', 'cancelled']] = None
    notes: Optional[str] = None

# Message Models
class MessageBase(BaseModel):
    senderId: str
    receiverId: str
    senderType: Literal['provider', 'client']
    message: str

class MessageCreate(MessageBase):
    pass

class MessageInDB(MessageBase):
    id: str = Field(alias="_id")
    read: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Invoice Models
class InvoiceBase(BaseModel):
    clientId: str
    providerId: str
    amount: float
    description: str
    dueDate: date

class InvoiceCreate(InvoiceBase):
    appointmentId: Optional[str] = None

class InvoiceInDB(InvoiceBase):
    id: str = Field(alias="_id")
    appointmentId: Optional[str] = None
    invoiceDate: date = Field(default_factory=date.today)
    status: Literal['pending', 'paid', 'overdue'] = 'pending'
    paymentMethod: Optional[str] = None
    transactionId: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Clinical Note Models
class SOAPContent(BaseModel):
    subjective: str
    objective: str
    assessment: str
    plan: str

class DAPContent(BaseModel):
    data: str
    assessment: str
    plan: str

class ClinicalNoteBase(BaseModel):
    appointmentId: str
    clientId: str
    providerId: str
    type: Literal['SOAP', 'DAP', 'Progress']
    diagnosis: Optional[str] = None
    privateNotes: Optional[str] = None

class ClinicalNoteCreate(ClinicalNoteBase):
    content: dict  # SOAP or DAP content

class ClinicalNoteInDB(ClinicalNoteBase):
    id: str = Field(alias="_id")
    noteDate: date = Field(default_factory=date.today)
    content: dict
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

# Auth Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    userId: Optional[str] = None
    userType: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    googleToken: str

# Dashboard Stats
class ProviderDashboardStats(BaseModel):
    totalIncome: float
    monthlyIncome: float
    appointmentsToday: int
    appointmentsWeek: int
    pendingNotes: int
    activeClients: int
    messagesUnread: int
    upcomingAppointments: int

class ClientDashboardStats(BaseModel):
    upcomingAppointments: int
    pendingPayments: int
    unreadMessages: int
    completedSessions: int
