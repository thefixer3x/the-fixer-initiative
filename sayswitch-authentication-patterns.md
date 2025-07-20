# Sayswitch Authentication Patterns Documentation

## Overview

Based on the official Sayswitch API documentation, there are three distinct authentication patterns used for different types of operations:

1. **Regular Transactions (Transfers In)** - Bearer token only
2. **Payouts (Transfers Out)** - Bearer token + HMAC-SHA512 signature
3. **Bills and Utility Payments** - Bearer token + HMAC-SHA512 signature

## Authentication Pattern Details

### 1. Regular Transactions (Transfers In)

**Used for:**
- Payment initialization (`/transaction/initialize`)
- Payment verification (`/transaction/verify`)
- Transaction history (`/transaction`)
- Customer management (`/customer`)
- Virtual account creation (`/dedicated_virtual_account`)

**Authentication Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${secretKey}`,
  'User-Agent': 'Sayswitch-Node-SDK/1.0.0'
}
```

**Example Implementation:**
```javascript
// Regular transaction - only Bearer token needed
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${this.secretKey}`,
  'User-Agent': 'Sayswitch-Node-SDK/1.0.0'
};

const response = await fetch(`${this.baseURL}/transaction/initialize`, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({
    email: 'user@example.com',
    amount: '1000',
    currency: 'NGN',
    callback: 'https://your-callback-url.com'
  })
});
```

### 2. Payouts (Transfers Out)

**Used for:**
- Bank transfers (`/bank_transfer`)
- Bulk bank transfers (`/bulk_bank_transfer`)

**Authentication Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${secretKey}`,
  'Encryption': '${hmacSha512Signature}',
  'User-Agent': 'Sayswitch-Node-SDK/1.0.0'
}
```

**Signature Generation Process:**
1. Sort payload alphabetically by keys
2. Convert to JSON string
3. Generate HMAC-SHA512 signature using secret key
4. Include signature in `Encryption` header

**Example Implementation:**
```javascript
// Payout - Bearer token + HMAC signature required
const payload = {
  account_name: 'John Doe',
  account_number: '1234567890',
  amount: '5000',
  bank_code: '058',
  bank_name: 'GTBank',
  currency: 'NGN',
  narration: 'Payment for services',
  reference: 'TRF_1234567890'
};

// Sort payload alphabetically
const sortedPayload = {};
Object.keys(payload).sort().forEach(key => {
  sortedPayload[key] = payload[key];
});

// Generate HMAC-SHA512 signature
const signature = crypto
  .createHmac('sha512', this.secretKey)
  .update(JSON.stringify(sortedPayload))
  .digest('hex');

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${this.secretKey}`,
  'Encryption': signature,
  'User-Agent': 'Sayswitch-Node-SDK/1.0.0'
};

const response = await fetch(`${this.baseURL}/bank_transfer`, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(payload)
});
```

### 3. Bills and Utility Payments

**Used for:**
- Airtime topup (`/airtime/topup`)
- Data purchase (`/internet/data`)
- TV payments (`/tv/pay`)
- Electricity payments (`/electricity/recharge`)

**Authentication Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${secretKey}`,
  'Encryption': '${hmacSha512Signature}',
  'User-Agent': 'Sayswitch-Node-SDK/1.0.0'
}
```

**Example Implementation:**
```javascript
// Bills payment - Bearer token + HMAC signature required
const payload = {
  amount: 1000,
  number: '08012345678',
  provider: 'MTN',
  reference: 'AIR_1234567890'
};

// Sort payload alphabetically
const sortedPayload = {};
Object.keys(payload).sort().forEach(key => {
  sortedPayload[key] = payload[key];
});

// Generate HMAC-SHA512 signature
const signature = crypto
  .createHmac('sha512', this.secretKey)
  .update(JSON.stringify(sortedPayload))
  .digest('hex');

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${this.secretKey}`,
  'Encryption': signature,
  'User-Agent': 'Sayswitch-Node-SDK/1.0.0'
};

const response = await fetch(`${this.baseURL}/airtime/topup`, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(payload)
});
```

## HMAC-SHA512 Signature Generation

### Algorithm Details

The HMAC-SHA512 signature is generated using the following process:

1. **Payload Sorting**: Arrange payload alphabetically by keys
2. **JSON Serialization**: Convert sorted object to JSON string
3. **HMAC Generation**: Create HMAC-SHA512 hash using secret key
4. **Hex Encoding**: Convert to hexadecimal string

### Implementation Function

```javascript
generateHMACSignature(payload) {
  // Step 1: Sort payload alphabetically
  const sortedPayload = this.sortPayloadAlphabetically(payload);
  
  // Step 2: Convert to JSON string
  const payloadString = JSON.stringify(sortedPayload);
  
  // Step 3: Generate HMAC-SHA512 signature
  return crypto
    .createHmac('sha512', this.secretKey)
    .update(payloadString)
    .digest('hex');
}

sortPayloadAlphabetically(payload) {
  const sorted = {};
  Object.keys(payload).sort().forEach(key => {
    sorted[key] = payload[key];
  });
  return sorted;
}
```

## Security Considerations

### Why Different Authentication Patterns?

1. **Regular Transactions**: Lower security risk, standard Bearer token sufficient
2. **Payouts**: Higher security risk (money leaving system), requires signature verification
3. **Bills**: Medium security risk, requires signature for integrity verification

### Signature Benefits

- **Integrity**: Ensures payload hasn't been tampered with
- **Authentication**: Verifies request origin using secret key
- **Non-repudiation**: Prevents denial of transaction requests
- **Replay Protection**: When combined with unique references

## Implementation Best Practices

### 1. Method Selection

```javascript
// Determine which authentication method to use
function getAuthenticationMethod(endpoint) {
  const signatureRequired = [
    '/bank_transfer',
    '/bulk_bank_transfer',
    '/airtime/topup',
    '/internet/data',
    '/tv/pay',
    '/electricity/recharge'
  ];
  
  return signatureRequired.some(path => endpoint.includes(path)) 
    ? 'bearer_plus_signature' 
    : 'bearer_only';
}
```

### 2. Header Generation

```javascript
// Generate appropriate headers based on operation type
function getAuthHeaders(payload = null) {
  const baseHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${this.secretKey}`,
    'User-Agent': 'Sayswitch-Node-SDK/1.0.0'
  };
  
  if (payload) {
    // Add signature for payout/bills operations
    baseHeaders['Encryption'] = this.generateHMACSignature(payload);
  }
  
  return baseHeaders;
}
```

### 3. Error Handling

```javascript
// Handle authentication errors
if (response.status === 401) {
  throw new Error('Invalid authentication credentials');
}

if (response.status === 403) {
  throw new Error('Invalid signature or unauthorized operation');
}
```

## Webhook Authentication

Webhooks also use HMAC-SHA512 signatures for verification:

```javascript
verifyWebhookSignature(payload, signature) {
  try {
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex');
    
    // Compare signatures (support different formats)
    return signature === expectedSignature || 
           signature === `sha512=${expectedSignature}`;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}
```

## Testing Authentication Patterns

### 1. Regular Transaction Test

```javascript
// Test regular payment initialization
const regularPayment = await sayswitch.initializePayment({
  email: 'test@example.com',
  amount: 1000,
  currency: 'NGN',
  callback: 'https://your-callback.com'
});
```

### 2. Payout Test

```javascript
// Test bank transfer (payout)
const bankTransfer = await sayswitch.initiateBankTransfer({
  account_name: 'John Doe',
  account_number: '1234567890',
  amount: 5000,
  bank_code: '058',
  bank_name: 'GTBank',
  currency: 'NGN',
  narration: 'Test transfer'
});
```

### 3. Bills Test

```javascript
// Test airtime topup (bills)
const airtimeTopup = await sayswitch.airtimeTopup({
  amount: 1000,
  number: '08012345678',
  provider: 'MTN'
});
```

## Conclusion

The three authentication patterns in Sayswitch provide graduated security based on transaction risk:

- **Bearer only**: For low-risk operations (payment collection)
- **Bearer + Signature**: For high-risk operations (payouts, bills)

This approach balances security with API usability, requiring additional verification only when necessary while maintaining consistent authentication for all operations.