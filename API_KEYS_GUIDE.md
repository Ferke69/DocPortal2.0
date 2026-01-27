# 🔑 API Keys & Configuration Guide

## Overview
This document explains where all test keys are located and how to replace them with real production keys.

---

## 📍 Key Locations

### 1. **Frontend Environment Variables**
**File:** `/app/frontend/.env`

```bash
# =============================================================================
# STRIPE TEST KEYS - REPLACE WITH REAL KEYS FOR PRODUCTION
# =============================================================================
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_fake_key_for_demo_purposes_only
```

**How to get real keys:**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Sign up / Log in to Stripe
3. Get your **Publishable Key** (starts with `pk_live_...` for production)
4. Replace `pk_test_fake_key_for_demo_purposes_only` with your real key

**Used in:** Payment forms, Stripe.js integration

---

### 2. **Backend Environment Variables**
**File:** `/app/backend/.env`

```bash
# =============================================================================
# JWT CONFIGURATION - CHANGE IN PRODUCTION
# =============================================================================
JWT_SECRET="simplepractice-jwt-secret-key-hipaa-compliant-2025-CHANGE-IN-PRODUCTION"
JWT_EXPIRE_HOURS="24"

# =============================================================================
# STRIPE TEST KEYS - REPLACE WITH REAL KEYS FOR PRODUCTION
# =============================================================================
STRIPE_SECRET_KEY="sk_test_fake_key_for_demo_purposes_only"
STRIPE_PUBLISHABLE_KEY="pk_test_fake_key_for_demo_purposes_only"

# =============================================================================
# MESSAGE ENCRYPTION (For HIPAA Compliance)
# =============================================================================
MESSAGE_ENCRYPTION_KEY="simplepractice-message-encryption-key-2025-CHANGE-IN-PRODUCTION"
```

**How to replace:**

#### JWT_SECRET:
```bash
# Generate a new secret:
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy the output and replace JWT_SECRET value
```

#### STRIPE_SECRET_KEY:
1. Go to https://dashboard.stripe.com/apikeys
2. Get your **Secret Key** (starts with `sk_live_...` for production)
3. Replace `sk_test_fake_key_for_demo_purposes_only`

#### MESSAGE_ENCRYPTION_KEY:
```bash
# Generate a new encryption key:
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy the output and replace MESSAGE_ENCRYPTION_KEY value
```

**Used in:** Authentication, payment processing, message encryption

---

## 🔍 Where Keys Are Used

### Stripe Keys

**Frontend (`REACT_APP_STRIPE_PUBLISHABLE_KEY`):**
- File: `/app/frontend/src/components/BillingPayments.jsx`
- Purpose: Client-side Stripe.js integration for card input
- Visibility: Visible in browser, safe to expose

**Backend (`STRIPE_SECRET_KEY`):**
- File: `/app/backend/routes/billing_routes.py`
- Purpose: Server-side payment processing
- Security: **NEVER expose this key in frontend code**

### JWT Secret

**Backend (`JWT_SECRET`):**
- File: `/app/backend/auth.py`
- Purpose: Signing and verifying JWT tokens
- Security: **Keep this secret and rotate regularly**

### Google OAuth

**Status:** ✅ **NO KEYS NEEDED!**
- Handled by Emergent Auth service
- No configuration required
- Works out of the box

---

## 🚀 Deployment Checklist

Before deploying to production:

### Step 1: Generate Secure Secrets
```bash
# JWT Secret
python3 -c "import secrets; print('JWT_SECRET:', secrets.token_urlsafe(32))"

# Message Encryption Key
python3 -c "import secrets; print('MESSAGE_ENCRYPTION_KEY:', secrets.token_urlsafe(32))"
```

### Step 2: Get Real Stripe Keys
1. Go to https://dashboard.stripe.com/
2. Complete Stripe account verification
3. Switch to **Live Mode** (toggle in top right)
4. Go to **Developers → API Keys**
5. Copy both:
   - Publishable key (pk_live_...)
   - Secret key (sk_live_...)

### Step 3: Update Frontend .env
```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_REAL_KEY_HERE
```

### Step 4: Update Backend .env
```bash
JWT_SECRET="YOUR_GENERATED_JWT_SECRET_HERE"
STRIPE_SECRET_KEY="sk_live_YOUR_REAL_SECRET_KEY_HERE"
STRIPE_PUBLISHABLE_KEY="pk_live_YOUR_REAL_PUBLISHABLE_KEY_HERE"
MESSAGE_ENCRYPTION_KEY="YOUR_GENERATED_ENCRYPTION_KEY_HERE"
```

### Step 5: Restart Services
```bash
# Frontend
sudo supervisorctl restart frontend

# Backend
sudo supervisorctl restart backend
```

### Step 6: Test Payment Flow
1. Try creating an invoice
2. Process a payment with a real test card
3. Verify payment appears in Stripe dashboard

---

## 🧪 Testing with Test Keys

You can test the payment flow with Stripe test keys:

### Test Cards (when using test keys):
```
Successful payment:
4242 4242 4242 4242
Expiry: Any future date
CVV: Any 3 digits

Declined payment:
4000 0000 0000 0002
```

More test cards: https://stripe.com/docs/testing

---

## 🔒 Security Best Practices

### DO:
✅ Use environment variables for all secrets
✅ Rotate JWT secret regularly (every 90 days)
✅ Use strong, randomly generated secrets
✅ Keep backend .env file secure (never commit to git)
✅ Use HTTPS in production
✅ Monitor Stripe dashboard for suspicious activity

### DON'T:
❌ Hardcode keys in source code
❌ Commit .env files to git (use .env.example instead)
❌ Share secret keys in chat/email
❌ Use the same key across environments
❌ Expose backend secrets in frontend code

---

## 📝 Key Status Summary

| Key | Location | Status | Action Required |
|-----|----------|--------|-----------------|
| Stripe Publishable (Frontend) | `/app/frontend/.env` | 🟡 Test Key | Replace before production |
| Stripe Secret (Backend) | `/app/backend/.env` | 🟡 Test Key | Replace before production |
| JWT Secret | `/app/backend/.env` | 🟡 Weak | Generate strong secret |
| Encryption Key | `/app/backend/.env` | 🟡 Weak | Generate strong secret |
| Google OAuth | N/A | ✅ Production | No action needed |

---

## 🆘 Troubleshooting

### "Payment processing failed"
- Check if Stripe keys are correct
- Verify keys match (test with test, live with live)
- Check Stripe dashboard for error details

### "Invalid token" errors
- JWT_SECRET may have changed
- Users need to log out and log back in
- Clear localStorage: `localStorage.clear()`

### "Authentication failed"
- Google OAuth issues: Check browser console
- Ensure redirect URLs are not hardcoded
- Verify Emergent Auth service is reachable

---

## 📞 Getting Help

### Stripe Support:
- Dashboard: https://dashboard.stripe.com/
- Docs: https://stripe.com/docs
- Support: https://support.stripe.com/

### Emergent Auth:
- Documentation available in integration playbook
- No API keys needed

---

## 🔄 Quick Reference Commands

```bash
# View current frontend config
cat /app/frontend/.env

# View current backend config (without exposing values)
grep "=" /app/backend/.env | cut -d'=' -f1

# Generate new secrets
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Test backend API
curl http://localhost:8001/api/health

# Restart services after changes
sudo supervisorctl restart all
```

---

**Last Updated:** January 27, 2025  
**Status:** All test keys clearly marked with TODO comments
