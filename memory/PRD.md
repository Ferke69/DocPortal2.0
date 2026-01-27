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
- [x] Google OAuth with role selection (Provider/Client)
- [x] Dark/Light theme toggle
- [x] i18n support for 8 languages
- [x] Landing page with features section
- [x] Login and Register pages
- [x] Provider Dashboard (mock data)
- [x] Client Portal (mock data)
- [x] Backend API routes for auth, appointments, messages, billing
- [x] Database models for all entities

### Bug Fixes (Jan 27, 2025)
- [x] Fixed dark mode text readability across all pages
- [x] Fixed "Or continue with Google" text in Login page dark mode
- [x] Added ThemeToggle to Register page
- [x] Improved error handling in registration flow

## Current Status
- **Backend**: 100% working (all auth endpoints tested)
- **Frontend**: Pages built, dark mode functional
- **Integration**: Auth flows working end-to-end

## Known Limitations
- **Stripe**: Uses test/placeholder keys
- **Google Meet**: Placeholder links (no real API integration)
- **Dashboard Data**: Some components use mock data

## Pending Tasks (P1)
1. Connect frontend components to live backend APIs (replace mock data)
2. Full EHR/Notes UI implementation
3. Real video call integration

## Future Tasks (P2)
1. Comprehensive unit/integration tests
2. Email notifications integration
3. Production deployment configuration

## Test Credentials
- **Client**: testclient_1769486748@example.com / TestPass123!
- **API URL**: https://careflow-166.preview.emergentagent.com

## Key Files
- `/app/frontend/src/components/` - React components
- `/app/backend/routes/` - FastAPI route handlers
- `/app/backend/models.py` - Pydantic models
- `/app/API_KEYS_GUIDE.md` - Production API key setup
- `/app/test_reports/iteration_1.json` - Latest test results
