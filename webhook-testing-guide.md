# Paystack Webhook Testing Guide

## Current Setup
- **ngrok tunnel**: https://f525e96e43e2.ngrok-free.app
- **Local server**: localhost:8080
- **Webhook endpoint**: https://f525e96e43e2.ngrok-free.app/webhook/paystack

## Step 1: Configure Webhook on Paystack Dashboard

1. **Login to Paystack Dashboard**
   - Go to https://dashboard.paystack.com/
   - Login with your credentials

2. **Navigate to Webhooks**
   - Go to Settings → Webhooks
   - Click "Add Webhook"

3. **Configure Webhook Settings**
   - **URL**: `https://f525e96e43e2.ngrok-free.app/webhook/paystack`
   - **Events** (select these):
     - `charge.success` - Payment successful
     - `charge.failed` - Payment failed
     - `transfer.success` - Transfer successful
     - `transfer.failed` - Transfer failed
     - `transfer.reversed` - Transfer reversed
   - **Status**: Active
   - **Save** the webhook

## Step 2: Test Using Paystack CLI

### Option A: Use Paystack CLI Events Command
```bash
# Forward webhook events to your local server
paystack webhook forward --url https://f525e96e43e2.ngrok-free.app/webhook/paystack

# Or test specific events
paystack webhook test --event charge.success --url https://f525e96e43e2.ngrok-free.app/webhook/paystack
```

### Option B: Use Paystack CLI Listen Command
```bash
# Listen for webhook events and forward them
paystack webhook listen --forward-to https://f525e96e43e2.ngrok-free.app/webhook/paystack
```

## Step 3: Test with Real Transactions

### Create Test Payment
```bash
# Use Paystack CLI to create a test payment
paystack payment create --email test@example.com --amount 5000 --currency NGN
```

### Monitor Webhook Events
- Watch the webhook-test-server console
- Check for incoming webhook events
- Verify event data structure

## Step 4: Test Your Client API Integration

### Test Payment Flow
```bash
# Test the client API payment initialization
curl -X POST https://your-supabase-project.supabase.co/functions/v1/client-api/payments/initialize \
  -H "Authorization: Bearer ck_live_CLIENT_001_1642234567_abc123.cs_live_def456ghi789jkl012mno345pqr678st" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "amount": 5000,
    "currency": "NGN",
    "reference": "test_payment_001"
  }'
```

## Step 5: Test Transfer Webhooks

### Create Test Transfer
```bash
# Use Paystack CLI to create a test transfer
paystack transfer create --amount 10000 --recipient_code RCP_xxx --reason "Test transfer"
```

## Expected Webhook Payloads

### Payment Success Event
```json
{
  "event": "charge.success",
  "data": {
    "id": 302961,
    "domain": "live",
    "status": "success",
    "reference": "qTPrJoy9Bx",
    "amount": 5000,
    "currency": "NGN",
    "customer": {
      "email": "test@example.com"
    },
    "authorization": {
      "authorization_code": "AUTH_xxx"
    },
    "transaction_date": "2024-01-15T10:30:00.000Z"
  }
}
```

### Transfer Success Event
```json
{
  "event": "transfer.success",
  "data": {
    "reference": "TRF_xxx",
    "amount": 10000,
    "currency": "NGN",
    "status": "success",
    "recipient": {
      "name": "John Doe",
      "account_number": "0123456789",
      "bank_code": "044"
    },
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

## Troubleshooting

### Common Issues

1. **"Connection not private" error**
   - This is normal for ngrok free tunnels
   - Click "Advanced" → "Proceed to site"
   - Or use ngrok's paid plan for custom domains

2. **Webhook not receiving events**
   - Check ngrok tunnel is active
   - Verify webhook URL in Paystack dashboard
   - Check local server is running on port 8080

3. **Signature verification fails**
   - Get webhook secret from Paystack dashboard
   - Update webhook-test-server.js with proper verification

### Debug Commands

```bash
# Check if ngrok tunnel is working
curl https://f525e96e43e2.ngrok-free.app/health

# Check local server directly
curl http://localhost:8080/health

# Test webhook endpoint directly
curl -X POST https://f525e96e43e2.ngrok-free.app/webhook/paystack \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "data": {"message": "test webhook"}}'
```

## Next Steps After Testing

1. **Update Production Webhook URL**
   - Replace ngrok URL with your VPS endpoint
   - Update Paystack webhook configuration

2. **Implement Proper Signature Verification**
   - Add webhook secret validation
   - Handle webhook replay attacks

3. **Create Client Dashboard**
   - Build transaction monitoring interface
   - Add real-time webhook event display

4. **Deploy to Production**
   - Deploy webhook handlers to your VPS
   - Update client API documentation
   - Set up monitoring and alerts

## Environment Variables for Production

```bash
# Add to your VPS environment
export PAYSTACK_WEBHOOK_SECRET="your_webhook_secret_from_dashboard"
export NGROK_AUTH_TOKEN="your_ngrok_auth_token"
export WEBHOOK_URL="https://your-vps-domain.com/webhook/paystack"
```