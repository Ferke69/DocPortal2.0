# DocPortal Clone - Backend Implementation Contracts

## Overview
This document outlines the API contracts, data models, and integration points for the SimplePractice clone backend implementation.

## Tech Stack
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT + Emergent Google OAuth
- **Payments**: Stripe (Test mode)
- **Video**: Google Meet integration
- **File Storage**: Local/MongoDB GridFS

## API Endpoints

### 1. Authentication Endpoints (`/api/auth`)

#### POST `/api/auth/register`
- Register new user (provider or client)
- **Request**: `{ email, password, name, userType: 'provider'|'client', ...profile }`
- **Response**: `{ token, user }`

#### POST `/api/auth/login`
- Login with email/password
- **Request**: `{ email, password }`
- **Response**: `{ token, user }`

#### POST `/api/auth/google`
- Google OAuth login (Emergent integration)
- **Request**: `{ googleToken }`
- **Response**: `{ token, user }`

#### GET `/api/auth/me`
- Get current user profile
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ user }`

---

### 2. Provider Endpoints (`/api/provider`)

#### GET `/api/provider/dashboard`
- Get provider dashboard stats
- **Response**: Stats from mockDashboardStats.provider

#### GET `/api/provider/clients`
- List all clients of provider
- **Response**: Array of client objects

#### POST `/api/provider/clients`
- Add new client
- **Request**: Client profile data
- **Response**: Created client object

#### GET `/api/provider/appointments`
- Get provider appointments (with filters: date, status)
- **Query**: `?date=YYYY-MM-DD&status=confirmed|pending`
- **Response**: Array of appointments

#### POST `/api/provider/clinical-notes`
- Create clinical note for appointment
- **Request**: `{ appointmentId, type: 'SOAP'|'DAP', content, diagnosis, privateNotes }`
- **Response**: Created note

#### GET `/api/provider/clinical-notes/:appointmentId`
- Get clinical note for appointment
- **Response**: Note object

---

### 3. Client Endpoints (`/api/client`)

#### GET `/api/client/dashboard`
- Get client dashboard stats
- **Response**: Stats from mockDashboardStats.client

#### GET `/api/client/provider`
- Get assigned provider details
- **Response**: Provider object

#### GET `/api/client/appointments`
- Get client appointments
- **Query**: `?status=upcoming|completed`
- **Response**: Array of appointments

#### POST `/api/client/appointments`
- Book new appointment
- **Request**: `{ providerId, date, time, type, duration }`
- **Response**: Created appointment with Google Meet link

---

### 4. Appointments Endpoints (`/api/appointments`)

#### GET `/api/appointments/:id`
- Get appointment details
- **Response**: Appointment object with videoLink

#### PATCH `/api/appointments/:id`
- Update appointment (reschedule, cancel)
- **Request**: `{ date?, time?, status? }`
- **Response**: Updated appointment

#### DELETE `/api/appointments/:id`
- Cancel appointment
- **Response**: Success message

#### POST `/api/appointments/:id/join`
- Generate/retrieve Google Meet link
- **Response**: `{ videoLink }`

---

### 5. Messaging Endpoints (`/api/messages`)

#### GET `/api/messages`
- Get user messages (conversations)
- **Query**: `?conversationWith=userId`
- **Response**: Array of messages

#### POST `/api/messages`
- Send message
- **Request**: `{ receiverId, message }`
- **Response**: Created message

#### PATCH `/api/messages/:id/read`
- Mark message as read
- **Response**: Updated message

---

### 6. Billing/Payments Endpoints (`/api/billing`)

#### GET `/api/billing/invoices`
- Get user invoices
- **Query**: `?status=paid|pending|overdue`
- **Response**: Array of invoices

#### POST `/api/billing/invoices`
- Create invoice (provider only)
- **Request**: `{ clientId, appointmentId, amount, description }`
- **Response**: Created invoice

#### POST `/api/billing/pay`
- Process payment via Stripe
- **Request**: `{ invoiceId, paymentMethod: { cardToken } }`
- **Response**: `{ success, transactionId }`

#### GET `/api/billing/payment-intent`
- Create Stripe payment intent
- **Request**: `{ amount }`
- **Response**: `{ clientSecret }`

---

## Data Models

### User
```python
{
  id: ObjectId,
  email: str,
  password: str (hashed),
  name: str,
  userType: 'provider' | 'client',
  phone: str,
  avatar: str (URL),
  
  # Provider specific
  specialty: str?,
  license: str?,
  bio: str?,
  hourlyRate: float?,
  
  # Client specific
  dateOfBirth: date?,
  address: str?,
  insurance: str?,
  providerId: ObjectId?,
  emergencyContact: {
    name: str,
    phone: str,
    relationship: str
  }?,
  
  createdAt: datetime,
  updatedAt: datetime
}
```

### Appointment
```python
{
  id: ObjectId,
  clientId: ObjectId,
  providerId: ObjectId,
  date: date,
  time: str,
  duration: int (minutes),
  type: str,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  notes: str?,
  videoLink: str (Google Meet),
  amount: float,
  createdAt: datetime,
  updatedAt: datetime
}
```

### Message
```python
{
  id: ObjectId,
  senderId: ObjectId,
  receiverId: ObjectId,
  senderType: 'provider' | 'client',
  message: str (encrypted),
  timestamp: datetime,
  read: bool,
  createdAt: datetime
}
```

### Invoice
```python
{
  id: ObjectId,
  clientId: ObjectId,
  providerId: ObjectId,
  appointmentId: ObjectId?,
  amount: float,
  date: date,
  dueDate: date,
  status: 'pending' | 'paid' | 'overdue',
  description: str,
  paymentMethod: str?,
  transactionId: str?,
  createdAt: datetime,
  updatedAt: datetime
}
```

### ClinicalNote
```python
{
  id: ObjectId,
  appointmentId: ObjectId,
  clientId: ObjectId,
  providerId: ObjectId,
  date: date,
  type: 'SOAP' | 'DAP' | 'Progress',
  content: {
    # For SOAP
    subjective: str?,
    objective: str?,
    assessment: str?,
    plan: str?,
    # For DAP
    data: str?,
    assessment: str?,
    plan: str?
  },
  diagnosis: str?,
  privateNotes: str (provider only),
  createdAt: datetime,
  updatedAt: datetime
}
```

---

## Frontend Integration Plan

### mockData.js → Backend API Migration

1. **Landing Page & Auth**
   - Add login/register forms
   - Integrate auth endpoints
   - Store JWT token in localStorage

2. **Provider Dashboard**
   - Replace `mockDashboardStats.provider` with `/api/provider/dashboard`
   - Replace `mockAppointments` with `/api/provider/appointments`
   - Replace `mockMessages` with `/api/messages`

3. **Client Portal**
   - Replace `mockDashboardStats.client` with `/api/client/dashboard`
   - Replace `mockAppointments` with `/api/client/appointments`
   - Replace `mockProviders` with `/api/client/provider`

4. **Messaging Center**
   - Replace `mockMessages` with `/api/messages` (GET & POST)
   - Add real-time updates (optional: WebSocket)

5. **Appointment Booking**
   - POST to `/api/client/appointments`
   - Integrate Google Meet link generation

6. **Billing & Payments**
   - Replace `mockInvoices` with `/api/billing/invoices`
   - Integrate Stripe payment flow

---

## External Integrations

### 1. Stripe Integration
- **Test Keys**: Provided by user (fake keys for demo)
- **Flow**: 
  1. Create payment intent on backend
  2. Use Stripe.js on frontend for card input
  3. Confirm payment on backend
  4. Update invoice status

### 2. Google Meet Integration
- **Method**: Generate Google Meet link using Google Calendar API or Meet API
- **Alternative**: Use static Meet links with appointment ID
- **Flow**: 
  1. When appointment is confirmed, generate unique Meet link
  2. Store link in appointment record
  3. Send link to both provider and client

### 3. Emergent Google OAuth
- **Flow**:
  1. Frontend initiates Google OAuth
  2. Get Google token
  3. Send to `/api/auth/google`
  4. Backend validates and creates/logs in user
  5. Return JWT token

---

## HIPAA Compliance Features

### 1. Data Encryption
- All messages encrypted at rest (AES-256)
- Use bcrypt for password hashing
- HTTPS only

### 2. Audit Logs
- Log all access to patient data
- Track who viewed what and when
- Store in separate audit collection

### 3. Session Management
- JWT tokens expire after 24 hours
- Secure httpOnly cookies option
- Logout invalidates tokens

### 4. Access Control
- Provider can only access their own clients
- Client can only access their own data
- Strict role-based access

---

## Implementation Priority

1. **Phase 1: Auth & Core Models**
   - Set up MongoDB schemas
   - Implement JWT authentication
   - Create user registration/login

2. **Phase 2: Appointments & Scheduling**
   - Appointment CRUD
   - Google Meet integration
   - Calendar functionality

3. **Phase 3: Messaging**
   - Secure messaging system
   - Encryption implementation
   - Real-time features (optional)

4. **Phase 4: Billing & Payments**
   - Stripe integration
   - Invoice management
   - Payment processing

5. **Phase 5: Clinical Notes & Advanced Features**
   - Clinical notes system
   - Audit logging
   - Advanced HIPAA compliance

---

## Environment Variables Required

```
# MongoDB
MONGO_URL=<existing>
DB_NAME=simplepractice

# JWT
JWT_SECRET=<generate strong secret>
JWT_EXPIRE_HOURS=24

# Stripe (Test)
STRIPE_SECRET_KEY=sk_test_<fake_key>
STRIPE_PUBLISHABLE_KEY=pk_test_<fake_key>

# Google OAuth (Emergent)
GOOGLE_CLIENT_ID=<from Emergent>
GOOGLE_CLIENT_SECRET=<from Emergent>

# Google Meet API (if using)
GOOGLE_API_KEY=<optional>

# Encryption
MESSAGE_ENCRYPTION_KEY=<generate strong key>

# CORS
FRONTEND_URL=<from env>
```

---

## Testing Checklist

- [ ] User registration (provider & client)
- [ ] Login with JWT
- [ ] Google OAuth login
- [ ] Provider dashboard data loading
- [ ] Client dashboard data loading
- [ ] Appointment booking
- [ ] Appointment rescheduling/cancellation
- [ ] Google Meet link generation
- [ ] Sending messages
- [ ] Receiving messages
- [ ] Invoice creation
- [ ] Stripe payment processing
- [ ] Clinical notes creation
- [ ] Role-based access control
- [ ] Message encryption
- [ ] Audit logging

---
