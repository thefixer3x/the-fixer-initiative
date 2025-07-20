# Client Integration Guide - Fixer Initiative API

## Overview
The Fixer Initiative provides unified access to payment services (Paystack) and money transfer services (Sayswitch) through a single API gateway with complete vendor abstraction.

## Base URL
```
https://[your-supabase-project].supabase.co/functions/v1/
```

## Authentication
All API calls require vendor authentication using your assigned API key:

```http
Authorization: Bearer pk_live_VENDOR_keyid.sk_live_secret
```

Alternative header:
```http
x-vendor-key: pk_live_VENDOR_keyid.sk_live_secret
```

## Available Services

### 1. Paystack Integration (Payment Processing)

#### Initialize Payment
```http
POST /paystack-integration/initialize
Content-Type: application/json

{
  "email": "customer@example.com",
  "amount": 5000,
  "currency": "NGN",
  "reference": "your-ref-123",
  "callback_url": "https://your-site.com/callback",
  "metadata": {
    "custom_field": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "rk_live_...",
    "reference": "VENDOR_1234567890_abc123def"
  },
  "vendor_metadata": {
    "vendor_code": "YOUR_VENDOR_CODE",
    "processing_time_ms": 245
  }
}
```

#### Verify Payment
```http
GET /paystack-integration/verify/{reference}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "success",
    "reference": "VENDOR_1234567890_abc123def",
    "amount": 5000,
    "currency": "NGN",
    "transaction_date": "2024-01-15T10:30:00Z",
    "customer": {
      "email": "customer@example.com"
    }
  }
}
```

#### List Transactions
```http
GET /paystack-integration/transactions?page=1&limit=50&status=success
```

### 2. Sayswitch Integration (Money Transfers)

#### Initiate Transfer
```http
POST /sayswitch-integration/transfer
Content-Type: application/json

{
  "amount": 10000,
  "account_number": "0123456789",
  "bank_code": "044",
  "account_name": "John Doe",
  "reference": "transfer-ref-123",
  "narration": "Payment for services",
  "currency": "NGN"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reference": "VENDOR_TXF_1234567890_abc123def",
    "external_reference": "sayswitch_ref_xyz",
    "status": "pending",
    "amount": 10000,
    "account_number": "0123456789",
    "bank_code": "044"
  }
}
```

#### Verify Transfer
```http
GET /sayswitch-integration/verify/{reference}
```

#### Get Account Balance
```http
GET /sayswitch-integration/balance
```

#### List Banks
```http
GET /sayswitch-integration/banks
```

#### List Transactions
```http
GET /sayswitch-integration/transactions?page=1&limit=50&status=success&type=transfer
```

## Webhook Handling

### Paystack Webhooks
Configure your webhook URL in Paystack dashboard:
```
https://[your-supabase-project].supabase.co/functions/v1/paystack-integration/webhook
```

### Sayswitch Webhooks
Configure your webhook URL in Sayswitch dashboard:
```
https://[your-supabase-project].supabase.co/functions/v1/sayswitch-integration/webhook
```

## Error Handling

### Common Error Codes
- `AUTH_REQUIRED`: Missing authorization header
- `INVALID_KEY_FORMAT`: Malformed API key
- `INVALID_CREDENTIALS`: Invalid vendor credentials
- `SERVICE_ACCESS_DENIED`: Service not enabled for vendor
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `MISSING_REQUIRED_FIELDS`: Required parameters missing

### Error Response Format
```json
{
  "error": "Service access denied",
  "code": "SERVICE_ACCESS_DENIED",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Rate Limiting
- Default: 1000 requests per minute per vendor
- Rate limit headers included in responses
- Upgrade available for higher limits

## Testing

### Test API Keys
Use test API keys for development:
```
pk_test_VENDOR_keyid.sk_test_secret
```

### Test Endpoints
All endpoints support test mode when using test keys.

## Code Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://your-project.supabase.co/functions/v1/',
  headers: {
    'Authorization': 'Bearer pk_live_VENDOR_keyid.sk_live_secret',
    'Content-Type': 'application/json'
  }
});

// Initialize payment
const payment = await client.post('/paystack-integration/initialize', {
  email: 'customer@example.com',
  amount: 5000,
  currency: 'NGN'
});

// Verify payment
const verification = await client.get(`/paystack-integration/verify/${payment.data.data.reference}`);
```

### Python
```python
import requests

headers = {
    'Authorization': 'Bearer pk_live_VENDOR_keyid.sk_live_secret',
    'Content-Type': 'application/json'
}

# Initialize payment
response = requests.post(
    'https://your-project.supabase.co/functions/v1/paystack-integration/initialize',
    json={
        'email': 'customer@example.com',
        'amount': 5000,
        'currency': 'NGN'
    },
    headers=headers
)
```

### PHP
```php
<?php
$client = new GuzzleHttp\Client([
    'base_uri' => 'https://your-project.supabase.co/functions/v1/',
    'headers' => [
        'Authorization' => 'Bearer pk_live_VENDOR_keyid.sk_live_secret',
        'Content-Type' => 'application/json'
    ]
]);

$response = $client->post('/paystack-integration/initialize', [
    'json' => [
        'email' => 'customer@example.com',
        'amount' => 5000,
        'currency' => 'NGN'
    ]
]);
?>
```

## Support

### Documentation
- API Reference: [Link to full API docs]
- Webhook Guide: [Link to webhook documentation]
- Error Codes: [Link to error code reference]

### Contact
- Technical Support: support@fixer-initiative.com
- Account Management: accounts@fixer-initiative.com
- Emergency Support: +234-XXX-XXXX-XXX

---

**Note**: This integration abstracts away the underlying payment processors (Paystack/Sayswitch) and provides a unified interface. Your clients will never know which specific vendors are being used behind the scenes.