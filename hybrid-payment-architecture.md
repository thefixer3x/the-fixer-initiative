# Hybrid Payment Architecture: Multi-Gateway Solution

## Overview

This architecture solves the USD payment limitations by routing payments to different gateways based on currency and region, while maintaining a unified API for clients.

## Payment Routing Strategy

### Currency-Based Routing

```javascript
const PAYMENT_ROUTING = {
  'NGN': {
    primary: 'paystack',
    fallback: 'sayswitch',
    features: ['card', 'bank', 'ussd', 'mobile_money', 'qr'],
    verification: true
  },
  'USD': {
    primary: 'stripe',
    fallback: 'paypal',
    features: ['card', 'bank_transfer', 'apple_pay', 'google_pay'],
    verification: true
  },
  'GHS': {
    primary: 'paystack',
    fallback: 'sayswitch',
    features: ['card', 'mobile_money'],
    verification: true
  },
  'ZAR': {
    primary: 'paystack',
    fallback: 'stripe',
    features: ['card'],
    verification: true
  },
  'KES': {
    primary: 'paystack',
    fallback: 'stripe',
    features: ['card', 'mobile_money'],
    verification: true
  }
};
```

### Gateway Selection Logic

```javascript
async function selectPaymentGateway(amount, currency, customerLocation) {
  const routing = PAYMENT_ROUTING[currency];
  
  if (!routing) {
    throw new Error(`Currency ${currency} not supported`);
  }
  
  // Check if primary gateway is available
  const primaryGateway = routing.primary;
  const primaryStatus = await checkGatewayHealth(primaryGateway);
  
  if (primaryStatus.available) {
    return {
      gateway: primaryGateway,
      features: routing.features,
      verification: routing.verification
    };
  }
  
  // Fallback to secondary gateway
  const fallbackGateway = routing.fallback;
  const fallbackStatus = await checkGatewayHealth(fallbackGateway);
  
  if (fallbackStatus.available) {
    return {
      gateway: fallbackGateway,
      features: routing.features,
      verification: routing.verification
    };
  }
  
  throw new Error(`No available gateway for ${currency}`);
}
```

## Gateway Implementations

### 1. Paystack (African Currencies)

```javascript
class PaystackGateway {
  constructor(config) {
    this.publicKey = config.publicKey;
    this.secretKey = config.secretKey;
    this.baseURL = 'https://api.paystack.co';
  }
  
  async initializePayment(data) {
    const response = await fetch(`${this.baseURL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: data.email,
        amount: data.amount * 100, // Convert to kobo
        currency: data.currency,
        reference: data.reference,
        channels: data.channels || ['card', 'bank', 'ussd', 'qr'],
        callback_url: data.callback_url
      })
    });
    
    const result = await response.json();
    return {
      gateway: 'paystack',
      authorization_url: result.data.authorization_url,
      access_code: result.data.access_code,
      reference: result.data.reference
    };
  }
  
  async verifyPayment(reference) {
    const response = await fetch(`${this.baseURL}/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${this.secretKey}`
      }
    });
    
    const result = await response.json();
    return {
      gateway: 'paystack',
      status: result.data.status,
      amount: result.data.amount / 100,
      currency: result.data.currency,
      reference: result.data.reference,
      customer: result.data.customer,
      authorization: result.data.authorization
    };
  }
}
```

### 2. Stripe (USD and International)

```javascript
class StripeGateway {
  constructor(config) {
    this.publishableKey = config.publishableKey;
    this.secretKey = config.secretKey;
    this.stripe = require('stripe')(this.secretKey);
  }
  
  async initializePayment(data) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: data.amount * 100, // Convert to cents
      currency: data.currency,
      metadata: {
        reference: data.reference,
        customer_email: data.email
      },
      payment_method_types: ['card'],
      receipt_email: data.email
    });
    
    return {
      gateway: 'stripe',
      client_secret: paymentIntent.client_secret,
      reference: data.reference,
      amount: data.amount,
      currency: data.currency
    };
  }
  
  async verifyPayment(paymentIntentId) {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    
    return {
      gateway: 'stripe',
      status: paymentIntent.status === 'succeeded' ? 'success' : 'failed',
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      reference: paymentIntent.metadata.reference,
      customer: {
        email: paymentIntent.metadata.customer_email
      }
    };
  }
}
```

### 3. PayPal (USD Fallback)

```javascript
class PayPalGateway {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.environment = config.environment; // 'sandbox' or 'live'
  }
  
  async initializePayment(data) {
    const order = await this.createOrder(data);
    
    return {
      gateway: 'paypal',
      order_id: order.id,
      reference: data.reference,
      approval_url: order.links.find(link => link.rel === 'approve').href
    };
  }
  
  async createOrder(data) {
    const response = await fetch(`${this.getBaseURL()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getAccessToken()}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: data.currency,
            value: data.amount.toString()
          },
          reference_id: data.reference
        }],
        application_context: {
          return_url: data.callback_url,
          cancel_url: data.callback_url
        }
      })
    });
    
    return await response.json();
  }
}
```

## Unified Payment API

### Payment Initialization

```javascript
// Unified payment endpoint
app.post('/api/payments/initialize', async (req, res) => {
  try {
    const { amount, currency, email, reference, customer_location } = req.body;
    
    // Select appropriate gateway
    const gatewayConfig = await selectPaymentGateway(amount, currency, customer_location);
    
    let gateway;
    switch (gatewayConfig.gateway) {
      case 'paystack':
        gateway = new PaystackGateway(config.paystack);
        break;
      case 'stripe':
        gateway = new StripeGateway(config.stripe);
        break;
      case 'paypal':
        gateway = new PayPalGateway(config.paypal);
        break;
      default:
        throw new Error('Unsupported gateway');
    }
    
    const result = await gateway.initializePayment({
      amount,
      currency,
      email,
      reference,
      callback_url: `${process.env.BASE_URL}/callback`
    });
    
    // Store transaction in both databases
    await Promise.all([
      storeInSupabase(result),
      storeInNeon(result)
    ]);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});
```

### Payment Verification

```javascript
// Unified verification endpoint
app.post('/api/payments/verify', async (req, res) => {
  try {
    const { reference, gateway } = req.body;
    
    let gatewayInstance;
    switch (gateway) {
      case 'paystack':
        gatewayInstance = new PaystackGateway(config.paystack);
        break;
      case 'stripe':
        gatewayInstance = new StripeGateway(config.stripe);
        break;
      case 'paypal':
        gatewayInstance = new PayPalGateway(config.paypal);
        break;
    }
    
    const result = await gatewayInstance.verifyPayment(reference);
    
    // Update both databases
    await Promise.all([
      updateSupabase(reference, result),
      updateNeon(reference, result)
    ]);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});
```

## Multi-Gateway Webhook Handler

```javascript
// Unified webhook handler
app.post('/webhook/:gateway', async (req, res) => {
  const gateway = req.params.gateway;
  const signature = req.headers['x-paystack-signature'] || 
                   req.headers['stripe-signature'] || 
                   req.headers['paypal-transmission-sig'];
  
  try {
    let verified = false;
    let eventData = null;
    
    switch (gateway) {
      case 'paystack':
        verified = verifyPaystackSignature(req.body, signature);
        eventData = JSON.parse(req.body);
        break;
      case 'stripe':
        verified = verifyStripeSignature(req.body, signature);
        eventData = JSON.parse(req.body);
        break;
      case 'paypal':
        verified = await verifyPayPalSignature(req.body, signature);
        eventData = req.body;
        break;
    }
    
    if (!verified) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Process webhook event
    await processWebhookEvent(gateway, eventData);
    
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: error.message });
  }
});
```

## Benefits of This Architecture

### 1. **Solves USD Limitations**
- ✅ True USD payments via Stripe/PayPal
- ✅ No currency conversion for international clients
- ✅ Global payment method support

### 2. **Maintains African Market Strength**
- ✅ Paystack for NGN, GHS, ZAR, KES
- ✅ Local payment methods (USSD, mobile money)
- ✅ Lower fees for African transactions

### 3. **Redundancy and Reliability**
- ✅ Automatic failover between gateways
- ✅ Multiple backup options per currency
- ✅ Health monitoring for all gateways

### 4. **Unified Client Experience**
- ✅ Single API for all payment methods
- ✅ Consistent response format
- ✅ Transparent gateway selection

## Configuration

```javascript
const config = {
  paystack: {
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET
  },
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    environment: process.env.PAYPAL_ENVIRONMENT
  },
  sayswitch: {
    publicKey: process.env.SAYSWITCH_PUBLIC_KEY,
    secretKey: process.env.SAYSWITCH_SECRET_KEY
  }
};
```

## Next Steps

1. **Set up Stripe/PayPal accounts** for USD processing
2. **Implement gateway health monitoring**
3. **Create unified webhook handlers**
4. **Test payment flows for each currency**
5. **Deploy hybrid architecture to production**

This architecture gives you the best of all worlds: Paystack's strength in Africa, Stripe's global USD capabilities, and PayPal as a reliable fallback, all behind a single unified API.