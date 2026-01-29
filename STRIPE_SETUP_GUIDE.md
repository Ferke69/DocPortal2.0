# Stripe Payment Integration Setup Guide

This guide explains how to configure Stripe payments for the DocPortal application.

## Current Status

The payment system is currently running in **MOCK MODE**. This means:
- Payment flows work without real charges
- No actual money is transferred
- Perfect for testing the application flow

## Setting Up Real Stripe Payments

### Step 1: Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click "Start now" or "Sign up"
3. Complete the registration process
4. Verify your email address

### Step 2: Get Your API Keys

1. Log in to your Stripe Dashboard: [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Click on "Developers" in the left sidebar
3. Click on "API keys"
4. You'll see two types of keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Step 3: Configure Environment Variables

Add these variables to your backend `.env` file:

```bash
# For TEST MODE (recommended for development)
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# For LIVE MODE (production only - real charges!)
# STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
# STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
```

Add this to your frontend `.env` file:

```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

### Step 4: Install Stripe Library

The backend needs the Stripe Python library:

```bash
pip install stripe
```

Add to `requirements.txt`:
```
stripe>=5.0.0
```

### Step 5: Restart the Application

After adding the environment variables, restart your services:

```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

## Test vs Live Mode

### Test Mode (Recommended for Development)
- Keys start with `pk_test_` and `sk_test_`
- No real money is charged
- Use test card numbers:
  - **Success**: `4242 4242 4242 4242`
  - **Declined**: `4000 0000 0000 0002`
  - **Requires Auth**: `4000 0025 0000 3155`
- Any future expiry date and any 3-digit CVC

### Live Mode (Production Only)
- Keys start with `pk_live_` and `sk_live_`
- Real money is charged to real cards
- Requires completed Stripe account verification
- Only use when ready for production!

## Webhook Configuration (Optional but Recommended)

For production, set up webhooks to handle payment events:

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/payments/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the webhook signing secret to your `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
   ```

## Troubleshooting

### "Stripe not configured" message
- Check that both `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` are set
- Ensure keys don't have extra spaces or quotes
- Restart the backend after changing `.env`

### Payment fails immediately
- Verify you're using the correct key pair (test with test, live with live)
- Check the Stripe Dashboard logs for error details

### "Invalid API Key" error
- Double-check you copied the full key
- Make sure test keys aren't mixed with live keys

## Security Notes

⚠️ **IMPORTANT**: 
- Never expose your Secret Key in frontend code
- Never commit API keys to version control
- Use environment variables for all sensitive data
- In production, always use HTTPS

## Support

For Stripe-specific issues, visit:
- Stripe Documentation: [https://stripe.com/docs](https://stripe.com/docs)
- Stripe Support: [https://support.stripe.com](https://support.stripe.com)
