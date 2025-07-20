/**
 * Sayswitch Production Implementation
 * Based on actual Sayswitch API documentation from Postman collection
 */

const crypto = require('crypto');
const fetch = require('node-fetch');

class SayswitchGateway {
  constructor(config) {
    this.secretKey = config.secretKey;
    this.baseURL = config.baseURL || 'https://backendapi.sayswitchgroup.com/api/v1';
    this.environment = config.environment || 'live';
  }

  /**
   * Generate authentication headers for regular transactions
   */
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.secretKey}`,
      'User-Agent': 'Sayswitch-Node-SDK/1.0.0'
    };
  }

  /**
   * Generate HMAC-SHA512 signature for payouts and bills
   * Payload must be arranged alphabetically as per API documentation
   */
  generateHMACSignature(payload) {
    // Sort payload alphabetically
    const sortedPayload = this.sortPayloadAlphabetically(payload);
    const payloadString = JSON.stringify(sortedPayload);
    
    return crypto
      .createHmac('sha512', this.secretKey)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Sort payload object alphabetically by keys
   */
  sortPayloadAlphabetically(payload) {
    const sorted = {};
    Object.keys(payload).sort().forEach(key => {
      sorted[key] = payload[key];
    });
    return sorted;
  }

  /**
   * Generate authentication headers for payouts and bills (with HMAC signature)
   */
  getAuthHeadersWithSignature(payload) {
    const signature = this.generateHMACSignature(payload);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.secretKey}`,
      'Encryption': signature,
      'User-Agent': 'Sayswitch-Node-SDK/1.0.0'
    };
  }

  /**
   * Generate transaction reference
   */
  generateReference(prefix = 'SSW') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize payment transaction
   */
  async initializePayment(paymentData) {
    try {
      const reference = paymentData.reference || this.generateReference();
      
      const payload = {
        email: paymentData.email,
        amount: paymentData.amount.toString(),
        currency: paymentData.currency || 'NGN',
        callback: paymentData.callback_url,
        reference: reference
      };

      const response = await fetch(`${this.baseURL}/transaction/initialize`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success || result.status === 'success') {
        return {
          gateway: 'sayswitch',
          status: 'success',
          payment_url: result.data.payment_url || result.data.authorization_url,
          reference: result.data.reference || reference,
          access_code: result.data.access_code,
          gateway_reference: result.data.gateway_reference,
          expires_at: result.data.expires_at
        };
      } else {
        throw new Error(result.message || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Sayswitch payment initialization error:', error);
      throw new Error(`Sayswitch payment initialization failed: ${error.message}`);
    }
  }

  /**
   * Verify payment transaction
   */
  async verifyPayment(reference) {
    try {
      const response = await fetch(`${this.baseURL}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (result.success || result.status === 'success') {
        return {
          gateway: 'sayswitch',
          status: result.data.status,
          amount: result.data.amount,
          currency: result.data.currency,
          reference: result.data.reference,
          payment_method: result.data.payment_method,
          gateway_reference: result.data.gateway_reference,
          customer: result.data.customer,
          transaction_date: result.data.transaction_date,
          fees: result.data.fees,
          authorization: result.data.authorization
        };
      } else {
        throw new Error(result.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Sayswitch payment verification error:', error);
      throw new Error(`Sayswitch payment verification failed: ${error.message}`);
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: filters.page || 1,
        limit: filters.limit || 50,
        status: filters.status || 'all',
        currency: filters.currency || 'all',
        from_date: filters.from_date || '',
        to_date: filters.to_date || ''
      }).toString();

      const response = await fetch(`${this.baseURL}/api/${this.version}/transactions?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (result.success || result.status === 'success') {
        return {
          transactions: result.data.transactions || result.data,
          pagination: result.data.pagination || result.pagination
        };
      } else {
        throw new Error(result.message || 'Failed to fetch transaction history');
      }
    } catch (error) {
      console.error('Sayswitch transaction history error:', error);
      throw new Error(`Failed to fetch transaction history: ${error.message}`);
    }
  }

  /**
   * Initiate bank transfer (payout) - requires HMAC signature
   */
  async initiateBankTransfer(transferData) {
    try {
      const payload = {
        account_name: transferData.account_name,
        account_number: transferData.account_number,
        amount: transferData.amount.toString(),
        bank_code: transferData.bank_code,
        bank_name: transferData.bank_name,
        currency: transferData.currency || 'NGN',
        narration: transferData.narration || 'Bank transfer',
        reference: transferData.reference || this.generateReference('TRF')
      };

      const response = await fetch(`${this.baseURL}/bank_transfer`, {
        method: 'POST',
        headers: this.getAuthHeadersWithSignature(payload),
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success || result.status === 'success') {
        return {
          gateway: 'sayswitch',
          status: 'success',
          transfer_reference: result.data.reference || payload.reference,
          amount: result.data.amount,
          recipient: result.data.recipient,
          transfer_code: result.data.transfer_code,
          created_at: result.data.created_at
        };
      } else {
        throw new Error(result.message || 'Bank transfer failed');
      }
    } catch (error) {
      console.error('Sayswitch bank transfer error:', error);
      throw new Error(`Sayswitch bank transfer failed: ${error.message}`);
    }
  }

  /**
   * Airtime topup - requires HMAC signature for bills
   */
  async airtimeTopup(topupData) {
    try {
      const payload = {
        amount: topupData.amount,
        number: topupData.number,
        provider: topupData.provider,
        reference: topupData.reference || this.generateReference('AIR')
      };

      const response = await fetch(`${this.baseURL}/airtime/topup`, {
        method: 'POST',
        headers: this.getAuthHeadersWithSignature(payload),
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success || result.status === 'success') {
        return {
          gateway: 'sayswitch',
          status: 'success',
          reference: result.data.reference || payload.reference,
          amount: result.data.amount,
          provider: result.data.provider,
          number: result.data.number,
          transaction_id: result.data.transaction_id
        };
      } else {
        throw new Error(result.message || 'Airtime topup failed');
      }
    } catch (error) {
      console.error('Sayswitch airtime topup error:', error);
      throw new Error(`Sayswitch airtime topup failed: ${error.message}`);
    }
  }

  /**
   * Data purchase - requires HMAC signature for bills
   */
  async dataPurchase(dataData) {
    try {
      const payload = {
        number: dataData.number,
        plan_id: dataData.plan_id,
        provider: dataData.provider,
        reference: dataData.reference || this.generateReference('DATA')
      };

      const response = await fetch(`${this.baseURL}/internet/data`, {
        method: 'POST',
        headers: this.getAuthHeadersWithSignature(payload),
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success || result.status === 'success') {
        return {
          gateway: 'sayswitch',
          status: 'success',
          reference: result.data.reference || payload.reference,
          plan_id: result.data.plan_id,
          provider: result.data.provider,
          number: result.data.number,
          transaction_id: result.data.transaction_id
        };
      } else {
        throw new Error(result.message || 'Data purchase failed');
      }
    } catch (error) {
      console.error('Sayswitch data purchase error:', error);
      throw new Error(`Sayswitch data purchase failed: ${error.message}`);
    }
  }

  /**
   * TV subscription payment - requires HMAC signature for bills
   */
  async tvPayment(tvData) {
    try {
      const payload = {
        code: tvData.code,
        number: tvData.number,
        provider: tvData.provider,
        reference: tvData.reference || this.generateReference('TV')
      };

      const response = await fetch(`${this.baseURL}/tv/pay`, {
        method: 'POST',
        headers: this.getAuthHeadersWithSignature(payload),
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success || result.status === 'success') {
        return {
          gateway: 'sayswitch',
          status: 'success',
          reference: result.data.reference || payload.reference,
          provider: result.data.provider,
          number: result.data.number,
          package: result.data.package,
          transaction_id: result.data.transaction_id
        };
      } else {
        throw new Error(result.message || 'TV payment failed');
      }
    } catch (error) {
      console.error('Sayswitch TV payment error:', error);
      throw new Error(`Sayswitch TV payment failed: ${error.message}`);
    }
  }

  /**
   * Electricity bill payment - requires HMAC signature for bills
   */
  async electricityPayment(electricityData) {
    try {
      const payload = {
        amount: electricityData.amount,
        number: electricityData.number,
        provider: electricityData.provider,
        reference: electricityData.reference || this.generateReference('ELEC'),
        type: electricityData.type || 'prepaid'
      };

      const response = await fetch(`${this.baseURL}/electricity/recharge`, {
        method: 'POST',
        headers: this.getAuthHeadersWithSignature(payload),
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success || result.status === 'success') {
        return {
          gateway: 'sayswitch',
          status: 'success',
          reference: result.data.reference || payload.reference,
          amount: result.data.amount,
          provider: result.data.provider,
          number: result.data.number,
          type: result.data.type,
          token: result.data.token,
          transaction_id: result.data.transaction_id
        };
      } else {
        throw new Error(result.message || 'Electricity payment failed');
      }
    } catch (error) {
      console.error('Sayswitch electricity payment error:', error);
      throw new Error(`Sayswitch electricity payment failed: ${error.message}`);
    }
  }

  /**
   * Refund transaction
   */
  async refundTransaction(reference, amount = null, reason = '') {
    try {
      const payload = {
        reference: reference,
        amount: amount, // null for full refund
        reason: reason || 'Customer request'
      };

      const response = await fetch(`${this.baseURL}/refund`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success || result.status === 'success') {
        return {
          gateway: 'sayswitch',
          status: 'success',
          refund_reference: result.data.refund_reference,
          amount_refunded: result.data.amount_refunded,
          original_reference: reference
        };
      } else {
        throw new Error(result.message || 'Refund failed');
      }
    } catch (error) {
      console.error('Sayswitch refund error:', error);
      throw new Error(`Sayswitch refund failed: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature for Sayswitch
   * Based on actual API documentation - likely uses HMAC-SHA512 like payout signatures
   */
  verifyWebhookSignature(payload, signature) {
    try {
      // Try HMAC-SHA512 first (consistent with payout signatures)
      const expectedSHA512 = crypto
        .createHmac('sha512', this.secretKey)
        .update(payload)
        .digest('hex');

      if (signature === expectedSHA512 || signature === `sha512=${expectedSHA512}`) {
        return true;
      }

      // Fallback to SHA256 if needed
      const expectedSHA256 = crypto
        .createHmac('sha256', this.secretKey)
        .update(payload)
        .digest('hex');

      return signature === expectedSHA256 || signature === `sha256=${expectedSHA256}`;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Get supported banks
   */
  async getSupportedBanks(country = 'NG') {
    try {
      const response = await fetch(`${this.baseURL}/api/${this.version}/banks?country=${country}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();

      if (result.success || result.status === 'success') {
        return result.data || result.banks;
      } else {
        throw new Error(result.message || 'Failed to fetch banks');
      }
    } catch (error) {
      console.error('Sayswitch banks fetch error:', error);
      throw new Error(`Failed to fetch banks: ${error.message}`);
    }
  }

  /**
   * Verify bank account
   */
  async verifyBankAccount(accountNumber, bankCode) {
    try {
      const response = await fetch(`${this.baseURL}/api/${this.version}/bank/resolve`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          account_number: accountNumber,
          bank_code: bankCode
        })
      });

      const result = await response.json();

      if (result.success || result.status === 'success') {
        return {
          account_name: result.data.account_name,
          account_number: result.data.account_number,
          bank_code: result.data.bank_code,
          bank_name: result.data.bank_name
        };
      } else {
        throw new Error(result.message || 'Account verification failed');
      }
    } catch (error) {
      console.error('Sayswitch account verification error:', error);
      throw new Error(`Account verification failed: ${error.message}`);
    }
  }
}

/**
 * Sayswitch webhook handler
 */
async function handleSayswitchWebhook(req, res) {
  const signature = req.headers['x-sayswitch-signature'] || req.headers['x-signature'];
  const payload = JSON.stringify(req.body);

  try {
    const sayswitch = new SayswitchGateway({
      merchantId: process.env.SAYSWITCH_MERCHANT_ID,
      apiKey: process.env.SAYSWITCH_API_KEY,
      secretKey: process.env.SAYSWITCH_SECRET_KEY,
      baseURL: process.env.SAYSWITCH_BASE_URL,
      environment: process.env.SAYSWITCH_ENV
    });

    // Verify webhook signature
    if (!sayswitch.verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body;
    console.log('Sayswitch webhook event:', event.event_type || event.type);

    // Handle different event types
    switch (event.event_type || event.type) {
      case 'payment.success':
      case 'charge.success':
        await handleSayswitchPaymentSuccess(event.data);
        break;

      case 'payment.failed':
      case 'charge.failed':
        await handleSayswitchPaymentFailed(event.data);
        break;

      case 'payment.pending':
      case 'charge.pending':
        await handleSayswitchPaymentPending(event.data);
        break;

      case 'refund.success':
        await handleSayswitchRefundSuccess(event.data);
        break;

      case 'refund.failed':
        await handleSayswitchRefundFailed(event.data);
        break;

      default:
        console.log('Unknown Sayswitch event:', event.event_type || event.type);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Sayswitch webhook error:', error);
    res.status(400).json({ error: error.message });
  }
}

/**
 * Handle successful payment
 */
async function handleSayswitchPaymentSuccess(data) {
  try {
    console.log('Sayswitch payment success:', data.reference);

    // Update both databases
    await Promise.all([
      updateSupabaseTransaction(data.reference, 'success', data),
      updateNeonTransaction(data.reference, 'success', data)
    ]);

    // Send success notification
    await sendPaymentSuccessNotification(data);

  } catch (error) {
    console.error('Error handling Sayswitch payment success:', error);
  }
}

/**
 * Handle failed payment
 */
async function handleSayswitchPaymentFailed(data) {
  try {
    console.log('Sayswitch payment failed:', data.reference);

    // Update both databases
    await Promise.all([
      updateSupabaseTransaction(data.reference, 'failed', data),
      updateNeonTransaction(data.reference, 'failed', data)
    ]);

    // Send failure notification
    await sendPaymentFailureNotification(data);

  } catch (error) {
    console.error('Error handling Sayswitch payment failure:', error);
  }
}

/**
 * Handle pending payment
 */
async function handleSayswitchPaymentPending(data) {
  try {
    console.log('Sayswitch payment pending:', data.reference);

    // Update both databases
    await Promise.all([
      updateSupabaseTransaction(data.reference, 'pending', data),
      updateNeonTransaction(data.reference, 'pending', data)
    ]);

  } catch (error) {
    console.error('Error handling Sayswitch payment pending:', error);
  }
}

/**
 * Configuration
 */
const sayswitchConfig = {
  merchantId: process.env.SAYSWITCH_MERCHANT_ID,
  apiKey: process.env.SAYSWITCH_API_KEY,
  secretKey: process.env.SAYSWITCH_SECRET_KEY,
  baseURL: process.env.SAYSWITCH_BASE_URL || 'https://api.sayswitch.com',
  environment: process.env.SAYSWITCH_ENV || 'live'
};

// Initialize Sayswitch gateway
const sayswitch = new SayswitchGateway(sayswitchConfig);

module.exports = {
  SayswitchGateway,
  handleSayswitchWebhook,
  handleSayswitchPaymentSuccess,
  handleSayswitchPaymentFailed,
  handleSayswitchPaymentPending,
  sayswitch
};