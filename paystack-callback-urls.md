# Paystack Callback URLs Configuration

## Webhook URLs vs Callback URLs

### Webhook URLs (Server-to-Server)
- **Purpose**: Payment status updates sent to your server
- **Test URL**: `https://f525e96e43e2.ngrok-free.app/webhook/paystack`
- **Production URL**: `https://connectionpoint.tech/webhook/paystack`

### Callback URLs (Client-Side Redirects)
- **Purpose**: Where users are redirected after payment
- **Test URL**: `https://f525e96e43e2.ngrok-free.app/callback/success`
- **Production URL**: `https://connectionpoint.tech/callback/success`

## Paystack Dashboard Configuration

### Test Environment
**API Keys:**
- Public Key: `pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Secret Key: `sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Webhook Settings:**
- URL: `https://f525e96e43e2.ngrok-free.app/webhook/paystack`
- Events: `charge.success`, `charge.failed`, `transfer.success`, `transfer.failed`, `transfer.reversed`

**Callback Settings:**
- Callback URL: `https://f525e96e43e2.ngrok-free.app/callback`

### Production Environment
**Webhook Settings:**
- URL: `https://connectionpoint.tech/webhook/paystack`
- Events: Same as test

**Callback Settings:**
- Callback URL: `https://connectionpoint.tech/callback`

## Payment Integration Example

```javascript
// Initialize payment with callback URLs
const paymentData = {
  email: 'customer@example.com',
  amount: 50000, // 500 NGN in kobo
  currency: 'NGN',
  reference: 'unique_ref_123',
  callback_url: 'https://f525e96e43e2.ngrok-free.app/callback'
};

// Using Paystack Popup
const handler = PaystackPop.setup({
  key: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  email: paymentData.email,
  amount: paymentData.amount,
  currency: paymentData.currency,
  ref: paymentData.reference,
  callback: function(response) {
    // Payment successful
    window.location.href = paymentData.callback_url + '?status=success&reference=' + response.reference;
  },
  onClose: function() {
    // Payment cancelled
    window.location.href = paymentData.callback_url + '?status=cancelled';
  }
});
```

## URLs Summary

### Test Environment
- **Webhook**: `https://f525e96e43e2.ngrok-free.app/webhook/paystack`
- **Callback**: `https://f525e96e43e2.ngrok-free.app/callback`

### Production Environment
- **Webhook**: `https://connectionpoint.tech/webhook/paystack`
- **Callback**: `https://connectionpoint.tech/callback`

## IP Whitelisting

**Important**: Paystack does NOT require IP whitelisting for webhooks. They use webhook signature verification instead, which is more secure and flexible.

### For Production VPS
- **Your VPS IP**: Get from `curl ifconfig.me` on your Hostinger VPS
- **No whitelisting needed**: Use signature verification instead
- **Webhook Secret**: Available in Paystack dashboard after creating webhook
