# Optimal Payment Routing Strategy

## Architecture Overview

Based on your expertise, the optimal routing strategy is:
- **Sayswitch/Paystack**: Local African payments (NGN, GHS, ZAR, KES)
- **Stripe/PayPal**: International payments (USD, EUR, GBP, etc.)

## Why This Architecture Works Best

### 1. **Local Payments (Sayswitch Primary)**
- ✅ **More flexible** than Paystack for African markets
- ✅ **Better local payment methods** integration
- ✅ **Lower fees** for local transactions
- ✅ **Stronger bank partnerships** in Africa
- ✅ **Better USSD/Mobile Money** support

### 2. **International Payments (Stripe Primary)**
- ✅ **True USD processing** without conversion
- ✅ **Global payment methods** (Apple Pay, Google Pay)
- ✅ **Better international compliance**
- ✅ **Lower international fees**
- ✅ **Superior fraud detection**

## Payment Routing Configuration

```javascript
const OPTIMAL_ROUTING = {
  // Local African Currencies
  'NGN': {
    primary: 'sayswitch',
    fallback: 'paystack',
    features: ['card', 'bank', 'ussd', 'mobile_money', 'qr'],
    advantages: ['Lower fees', 'Better USSD', 'More flexible API']
  },
  'GHS': {
    primary: 'sayswitch',
    fallback: 'paystack',
    features: ['card', 'mobile_money', 'bank'],
    advantages: ['Local partnerships', 'Better mobile money']
  },
  'ZAR': {
    primary: 'sayswitch',
    fallback: 'paystack',
    features: ['card', 'bank'],
    advantages: ['Local processing', 'Better compliance']
  },
  'KES': {
    primary: 'sayswitch',
    fallback: 'paystack',
    features: ['card', 'mobile_money'],
    advantages: ['M-Pesa integration', 'Local expertise']
  },
  
  // International Currencies
  'USD': {
    primary: 'stripe',
    fallback: 'paypal',
    features: ['card', 'bank_transfer', 'apple_pay', 'google_pay'],
    advantages: ['No conversion', 'Global support', 'Lower fees']
  },
  'EUR': {
    primary: 'stripe',
    fallback: 'paypal',
    features: ['card', 'sepa', 'apple_pay', 'google_pay'],
    advantages: ['SEPA support', 'EU compliance']
  },
  'GBP': {
    primary: 'stripe',
    fallback: 'paypal',
    features: ['card', 'bank_transfer', 'apple_pay'],
    advantages: ['UK banking', 'FCA compliance']
  }
};
```

## Enhanced Gateway Selection Logic

```javascript
async function selectOptimalGateway(amount, currency, customerLocation) {
  const routing = OPTIMAL_ROUTING[currency];
  
  if (!routing) {
    throw new Error(`Currency ${currency} not supported`);
  }
  
  // Determine if local or international
  const isLocalCurrency = ['NGN', 'GHS', 'ZAR', 'KES'].includes(currency);
  const isInternationalCurrency = ['USD', 'EUR', 'GBP'].includes(currency);
  
  // Check primary gateway health
  const primaryGateway = routing.primary;
  const primaryHealth = await checkGatewayHealth(primaryGateway);
  
  if (primaryHealth.available) {
    return {
      gateway: primaryGateway,
      type: isLocalCurrency ? 'local' : 'international',
      features: routing.features,
      advantages: routing.advantages,
      fallback_available: routing.fallback
    };
  }
  
  // Fallback to secondary gateway
  const fallbackGateway = routing.fallback;
  const fallbackHealth = await checkGatewayHealth(fallbackGateway);
  
  if (fallbackHealth.available) {
    return {
      gateway: fallbackGateway,
      type: isLocalCurrency ? 'local' : 'international',
      features: routing.features,
      advantages: [`Fallback from ${primaryGateway}`],
      is_fallback: true
    };
  }
  
  throw new Error(`No available gateway for ${currency}`);
}
```

## Sayswitch Gateway Implementation

```javascript
class SayswitchGateway {
  constructor(config) {
    this.merchantId = config.merchantId;
    this.secretKey = config.secretKey;
    this.baseURL = config.baseURL || 'https://api.sayswitch.com';
    this.environment = config.environment || 'live';
  }
  
  async initializePayment(data) {
    const response = await fetch(`${this.baseURL}/api/v1/payments/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
        'X-Merchant-ID': this.merchantId
      },
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency,
        email: data.email,
        reference: data.reference,
        callback_url: data.callback_url,
        payment_methods: data.channels || ['card', 'bank', 'ussd', 'mobile_money'],
        customer: {
          email: data.email,
          phone: data.phone,
          name: data.name
        }
      })
    });
    
    const result = await response.json();
    return {
      gateway: 'sayswitch',
      payment_url: result.data.payment_url,
      reference: result.data.reference,
      access_token: result.data.access_token
    };
  }
  
  async verifyPayment(reference) {
    const response = await fetch(`${this.baseURL}/api/v1/payments/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'X-Merchant-ID': this.merchantId
      }
    });
    
    const result = await response.json();
    return {
      gateway: 'sayswitch',
      status: result.data.status,
      amount: result.data.amount,
      currency: result.data.currency,
      reference: result.data.reference,
      payment_method: result.data.payment_method,
      customer: result.data.customer
    };
  }
}
```

## Updated Unified Payment API

```javascript
// Enhanced payment initialization with optimal routing
app.post('/api/payments/initialize', async (req, res) => {
  try {
    const { amount, currency, email, reference, customer_location, phone, name } = req.body;
    
    // Select optimal gateway based on currency
    const gatewayConfig = await selectOptimalGateway(amount, currency, customer_location);
    
    let gateway;
    switch (gatewayConfig.gateway) {
      case 'sayswitch':
        gateway = new SayswitchGateway(config.sayswitch);
        break;
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
      phone,
      name,
      reference,
      callback_url: `${process.env.BASE_URL}/callback`,
      channels: gatewayConfig.features
    });
    
    // Enhanced logging with gateway selection reason
    console.log(`Payment initialized via ${gatewayConfig.gateway} for ${currency}`, {
      reference,
      amount,
      currency,
      gateway: gatewayConfig.gateway,
      type: gatewayConfig.type,
      advantages: gatewayConfig.advantages,
      is_fallback: gatewayConfig.is_fallback || false
    });
    
    // Store in both databases with gateway info
    await Promise.all([
      storeInSupabase({ ...result, gateway_type: gatewayConfig.type }),
      storeInNeon({ ...result, gateway_type: gatewayConfig.type })
    ]);
    
    res.json({
      success: true,
      data: {
        ...result,
        gateway_info: {
          gateway: gatewayConfig.gateway,
          type: gatewayConfig.type,
          advantages: gatewayConfig.advantages,
          available_features: gatewayConfig.features
        }
      }
    });
    
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});
```

## Fee Structure Optimization

```javascript
const OPTIMAL_FEE_STRUCTURE = {
  // Local African currencies (lower fees via Sayswitch)
  sayswitch: {
    'NGN': { rate: 0.035, fixed: 0 }, // 3.5% (better than Paystack's 4.5%)
    'GHS': { rate: 0.035, fixed: 0 },
    'ZAR': { rate: 0.035, fixed: 0 },
    'KES': { rate: 0.035, fixed: 0 }
  },
  
  // Paystack fallback (higher fees)
  paystack: {
    'NGN': { rate: 0.045, fixed: 100 }, // 4.5% + ₦100
    'GHS': { rate: 0.045, fixed: 0 },
    'ZAR': { rate: 0.045, fixed: 0 },
    'KES': { rate: 0.045, fixed: 0 }
  },
  
  // International currencies (competitive rates)
  stripe: {
    'USD': { rate: 0.029, fixed: 30 }, // 2.9% + $0.30
    'EUR': { rate: 0.029, fixed: 25 }, // 2.9% + €0.25
    'GBP': { rate: 0.029, fixed: 20 }  // 2.9% + £0.20
  },
  
  // PayPal fallback (higher fees)
  paypal: {
    'USD': { rate: 0.034, fixed: 30 }, // 3.4% + $0.30
    'EUR': { rate: 0.034, fixed: 25 },
    'GBP': { rate: 0.034, fixed: 20 }
  }
};

function calculateOptimalFees(amount, currency, gateway) {
  const feeStructure = OPTIMAL_FEE_STRUCTURE[gateway]?.[currency];
  if (!feeStructure) {
    throw new Error(`Fee structure not found for ${gateway}/${currency}`);
  }
  
  const percentageFee = amount * feeStructure.rate;
  const totalFee = percentageFee + feeStructure.fixed;
  
  return {
    percentage_fee: percentageFee,
    fixed_fee: feeStructure.fixed,
    total_fee: totalFee,
    net_amount: amount - totalFee
  };
}
```

## Configuration for All Gateways

```javascript
const config = {
  // Local African payments
  sayswitch: {
    merchantId: process.env.SAYSWITCH_MERCHANT_ID,
    secretKey: process.env.SAYSWITCH_SECRET_KEY,
    baseURL: process.env.SAYSWITCH_BASE_URL,
    environment: process.env.SAYSWITCH_ENV || 'live'
  },
  
  // Local fallback
  paystack: {
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET
  },
  
  // International primary
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  
  // International fallback
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    environment: process.env.PAYPAL_ENVIRONMENT || 'live'
  }
};
```

## Benefits of This Optimal Architecture

### 1. **Cost Efficiency**
- **Lower fees** for local transactions via Sayswitch
- **Competitive international rates** via Stripe
- **Reduced conversion costs** for USD payments

### 2. **Better User Experience**
- **Local payment methods** optimized for each region
- **Faster processing** for local transactions
- **No currency conversion** for international payments

### 3. **Reliability**
- **Multiple fallback options** for each currency
- **Geographic redundancy** across gateways
- **Automatic failover** capabilities

### 4. **Scalability**
- **Easy to add new currencies** and regions
- **Flexible routing rules** based on business needs
- **Future-proof architecture** for expansion

Thank you for the guidance! This optimal routing strategy maximizes both cost efficiency and reliability while providing the best user experience for both local and international payments.