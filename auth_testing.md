# Auth Testing Playbook for SimplePractice

## Step 1: Create Test User & Session

```bash
mongosh --eval "
use('simplepractice');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({
  user_id: userId,
  email: 'test.user.' + Date.now() + '@example.com',
  name: 'Test User',
  userType: 'client',
  avatar: 'https://via.placeholder.com/150',
  password: '$2b$12$fake_hashed_password',
  createdAt: new Date(),
  updatedAt: new Date()
});
print('User ID: ' + userId);
print('Test session token (JWT): Use login endpoint to get real token');
"
```

## Step 2: Test Backend API

### Test Registration
```bash
curl -X POST "http://localhost:8001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testclient@example.com",
    "password": "TestPass123!",
    "name": "Test Client",
    "userType": "client",
    "phone": "(555) 123-4567"
  }'
```

### Test Login
```bash
curl -X POST "http://localhost:8001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testclient@example.com",
    "password": "TestPass123!"
  }'
```

### Test Protected Endpoint
```bash
# Use token from login response
curl -X GET "http://localhost:8001/api/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Client Dashboard
```bash
curl -X GET "http://localhost:8001/api/client/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Provider Dashboard
```bash
# First register a provider
curl -X POST "http://localhost:8001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testprovider@example.com",
    "password": "TestPass123!",
    "name": "Dr. Test Provider",
    "userType": "provider",
    "specialty": "Clinical Psychologist",
    "license": "PSY-12345",
    "hourlyRate": 150
  }'

# Then get dashboard
curl -X GET "http://localhost:8001/api/provider/dashboard" \
  -H "Authorization: Bearer PROVIDER_TOKEN_HERE"
```

## Step 3: Test Google OAuth Flow

1. Frontend initiates OAuth:
```javascript
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const redirectUrl = window.location.origin + '/dashboard';
window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
```

2. After Google auth, exchange session_id:
```bash
curl -X POST "http://localhost:8001/api/auth/google" \
  -H "Content-Type: application/json" \
  -d '{
    "googleToken": "YOUR_SESSION_ID_FROM_URL"
  }'
```

## Step 4: Test Appointments

### Create Appointment
```bash
curl -X POST "http://localhost:8001/api/appointments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "clientId": "client_user_id",
    "providerId": "provider_user_id",
    "date": "2025-02-01",
    "time": "10:00 AM",
    "duration": 60,
    "type": "Initial Consultation",
    "amount": 150
  }'
```

### Get Appointment
```bash
curl -X GET "http://localhost:8001/api/appointments/APPOINTMENT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Join Video Session
```bash
curl -X POST "http://localhost:8001/api/appointments/APPOINTMENT_ID/join" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 5: Test Messaging

### Send Message
```bash
curl -X POST "http://localhost:8001/api/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "senderId": "your_user_id",
    "receiverId": "recipient_user_id",
    "senderType": "client",
    "message": "Hello, I have a question about my appointment."
  }'
```

### Get Messages
```bash
curl -X GET "http://localhost:8001/api/messages?conversationWith=other_user_id" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 6: Test Billing

### Get Invoices
```bash
curl -X GET "http://localhost:8001/api/billing/invoices" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Payment Intent
```bash
curl -X POST "http://localhost:8001/api/billing/payment-intent" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 150
  }'
```

## Step 7: Quick Debug Commands

### Check Database
```bash
mongosh --eval "
use('simplepractice');
print('Users:');
db.users.find({}, {password: 0}).limit(3).pretty();
print('\nAppointments:');
db.appointments.find().limit(3).pretty();
print('\nMessages:');
db.messages.find().limit(3).pretty();
"
```

### Check API Health
```bash
curl http://localhost:8001/api/health
```

### View Audit Logs
```bash
mongosh --eval "
use('simplepractice');
db.audit_logs.find().sort({timestamp: -1}).limit(10).pretty();
"
```

## Step 8: Clean Test Data

```bash
mongosh --eval "
use('simplepractice');
db.users.deleteMany({email: /test/});
db.appointments.deleteMany({});
db.messages.deleteMany({});
db.invoices.deleteMany({});
db.clinical_notes.deleteMany({});
db.audit_logs.deleteMany({});
print('Test data cleaned');
"
```

## Success Checklist

- [ ] Registration works (both provider and client)
- [ ] Login returns valid JWT token
- [ ] /api/auth/me returns user data
- [ ] Google OAuth flow completes
- [ ] Provider dashboard loads with stats
- [ ] Client dashboard loads with stats
- [ ] Appointments can be created
- [ ] Video links are generated
- [ ] Messages can be sent and received
- [ ] Invoices are created
- [ ] Payment intent works (even in demo mode)
- [ ] Audit logs are created
- [ ] Role-based access control works

## Common Issues & Solutions

### Issue: "User not found"
- Check user_id field exists (not _id)
- Verify JWT token contains correct userId

### Issue: "Not authorized"
- Check userType in JWT payload
- Verify role-based middleware is working

### Issue: "Invalid token"
- Check JWT_SECRET in .env matches
- Verify token format: "Bearer YOUR_TOKEN"

### Issue: Database connection failed
- Check MongoDB is running: `sudo systemctl status mongod`
- Verify MONGO_URL in .env

### Issue: CORS errors
- Verify backend CORS_ORIGINS includes frontend URL
- Check credentials: true in requests

---

**Note**: This is a development/testing playbook. In production:
- Use real Stripe keys
- Implement proper message encryption
- Enable rate limiting
- Add request validation
- Implement proper session management
- Add comprehensive error handling
