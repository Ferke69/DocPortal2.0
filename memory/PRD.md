# DocPortal - Product Requirements Document

## Original Problem Statement
Build a clone of SimplePractice (practice management platform for healthcare professionals), rebranded as "DocPortal".

## Core Requirements
- **Dual Interface**: Provider Dashboard + Client Portal
- **Authentication**: JWT (email/password) + Google OAuth with role selection
- **Core Features**: Appointments, Messaging, Billing (Stripe), Video Consultations
- **Internationalization**: 8 European languages (EN, SL, DE, FR, ES, IT, PT, NL)
- **Theming**: Light/Dark mode toggle
- **HIPAA Compliance**: Basic security features

## Architecture
- **Frontend**: React + Tailwind CSS + shadcn/ui + i18next
- **Backend**: FastAPI + MongoDB (Motor)
- **Auth**: JWT + Google OAuth via Emergent Auth

## What's Been Implemented

### Completed (Jan 27, 2025)
- [x] Application rebranding to "DocPortal"
- [x] JWT authentication (login/register)
- [x] Google OAuth with role selection (Provider/Client) - Updated redirect flow
- [x] Dark/Light theme toggle
- [x] i18n support for 8 languages
- [x] Landing page with features section
- [x] Login and Register pages
- [x] Provider Dashboard - **NOW CONNECTED TO LIVE API**
- [x] Client Portal - **NOW CONNECTED TO LIVE API**
- [x] Backend API routes for auth, appointments, messages, billing
- [x] Database models for all entities
- [x] API service layer (`/app/frontend/src/services/api.js`)

### Bug Fixes (Jan 27, 2025)
- [x] Fixed dark mode text readability across all pages
- [x] Fixed "Or continue with Google" text in Login page dark mode
- [x] Added ThemeToggle to Register page
- [x] Improved error handling in registration flow
- [x] Fixed Google OAuth redirect flow (now redirects to /dashboard)

### Frontend-Backend Integration (Jan 27, 2025)
- [x] Created centralized API service with axios interceptors
- [x] Connected ProviderDashboard to live /api/provider/* endpoints
- [x] Connected ClientPortal to live /api/client/* endpoints
- [x] Connected MessagingCenter to live /api/messages/* endpoints
- [x] Connected AppointmentBooking to live /api/appointments/* and /api/auth/users/providers
- [x] Connected BillingPayments to live /api/billing/* endpoints
- [x] Added loading states and error handling to all dashboard components
- [x] Removed all dependency on mock data
- [x] Dark mode support on all dashboard pages

## Current Status
- **Backend**: 100% working (all endpoints tested)
- **Frontend**: 95% working (minor React key warning)
- **Integration**: All dashboard flows working end-to-end

## Known Limitations
- **Stripe**: Uses test/placeholder keys (MOCKED payment flow - no real charges)
- **Google Meet**: Placeholder links generated (format: meet.google.com/xxx-yyyy-zzz)
- **Google OAuth**: May show 403 on first use (Emergent Auth needs domain registration)

## Pending Tasks (P1)
1. Full EHR/Notes UI implementation
2. Real video call integration (Google Meet API or alternative)

## Future Tasks (P2)
1. Comprehensive unit/integration tests
2. Email notifications integration
3. Production deployment configuration
4. Real Stripe integration with webhook handling

## Test Credentials
- **Client**: testclient_1769486748@example.com / TestPass123!
- **Provider**: testprovider@example.com / TestPass123!
- **API URL**: https://careflow-166.preview.emergentagent.com

## Key Files
- `/app/frontend/src/services/api.js` - Centralized API service
- `/app/frontend/src/components/` - React components
- `/app/backend/routes/` - FastAPI route handlers
- `/app/backend/models.py` - Pydantic models
- `/app/API_KEYS_GUIDE.md` - Production API key setup
- `/app/test_reports/iteration_1.json` - Latest test results
