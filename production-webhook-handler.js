#!/usr/bin/env node

/**
 * Production Webhook Handler for Hostinger VPS
 * Handles Paystack and Sayswitch webhooks with proper security
 */

const express = require('express');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const app = express();

// Environment variables
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
const SAYSWITCH_WEBHOOK_SECRET = process.env.SAYSWITCH_WEBHOOK_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Middleware to capture raw body for signature verification
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// CORS middleware for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-paystack-signature');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Paystack webhook signature verification
function verifyPaystackSignature(payload, signature) {
  if (!PAYSTACK_WEBHOOK_SECRET) {
    console.warn('PAYSTACK_WEBHOOK_SECRET not configured');
    return false;
  }
  
  const hash = crypto
    .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

// Sayswitch webhook signature verification
function verifySayswitchSignature(payload, signature) {
  if (!SAYSWITCH_WEBHOOK_SECRET) {
    console.warn('SAYSWITCH_WEBHOOK_SECRET not configured');
    return false;
  }
  
  const hash = crypto
    .createHmac('sha256', SAYSWITCH_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

// Paystack webhook handler
app.post('/webhook/paystack', async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const payload = req.body;
  
  console.log('\n=== Paystack Webhook Received ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Signature:', signature);
  
  // Verify signature in production
  if (process.env.NODE_ENV === 'production' && !verifyPaystackSignature(payload, signature)) {
    console.error('Invalid Paystack webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  try {
    const event = JSON.parse(payload.toString());
    console.log('Event:', event.event);
    console.log('Data:', JSON.stringify(event.data, null, 2));
    
    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handlePaymentSuccess(event.data);
        break;
      case 'charge.failed':
        await handlePaymentFailed(event.data);
        break;
      case 'transfer.success':
        await handleTransferSuccess(event.data);
        break;
      case 'transfer.failed':
        await handleTransferFailed(event.data);
        break;
      case 'transfer.reversed':
        await handleTransferReversed(event.data);
        break;
      default:
        console.log('Unhandled event type:', event.event);
    }
    
    res.status(200).json({ 
      message: 'Webhook processed successfully',
      event: event.event,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error processing Paystack webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sayswitch webhook handler
app.post('/webhook/sayswitch', async (req, res) => {
  const signature = req.headers['x-sayswitch-signature'];
  const payload = req.body;
  
  console.log('\n=== Sayswitch Webhook Received ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Signature:', signature);
  
  // Verify signature in production
  if (process.env.NODE_ENV === 'production' && !verifySayswitchSignature(payload, signature)) {
    console.error('Invalid Sayswitch webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  try {
    const event = JSON.parse(payload.toString());
    console.log('Event:', event.event);
    console.log('Data:', JSON.stringify(event.data, null, 2));
    
    // Handle different event types
    switch (event.event) {
      case 'transfer.success':
        await handleSayswitchTransferSuccess(event.data);
        break;
      case 'transfer.failed':
        await handleSayswitchTransferFailed(event.data);
        break;
      default:
        console.log('Unhandled Sayswitch event type:', event.event);
    }
    
    res.status(200).json({ 
      message: 'Webhook processed successfully',
      event: event.event,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error processing Sayswitch webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Fixer Initiative Webhook Handler',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Callback endpoint for payment redirects
app.get('/callback', (req, res) => {
  const { status, reference } = req.query;
  
  console.log('\n=== Payment Callback Received ===');
  console.log('Status:', status);
  console.log('Reference:', reference);
  console.log('Full Query:', req.query);
  
  res.send(`
    <html>
      <head><title>Payment ${status || 'Complete'}</title></head>
      <body>
        <h1>Payment ${status || 'Complete'}</h1>
        <p>Reference: ${reference || 'N/A'}</p>
        <p>Status: ${status || 'Unknown'}</p>
        <p>Timestamp: ${new Date().toLocaleString()}</p>
      </body>
    </html>
  `);
});

// Webhook status endpoint
app.get('/webhook/status', (req, res) => {
  res.json({
    webhooks: {
      paystack: {
        endpoint: '/webhook/paystack',
        secret_configured: !!PAYSTACK_WEBHOOK_SECRET
      },
      sayswitch: {
        endpoint: '/webhook/sayswitch',
        secret_configured: !!SAYSWITCH_WEBHOOK_SECRET
      }
    },
    supabase: {
      configured: !!(SUPABASE_URL && SUPABASE_SERVICE_KEY),
      url: SUPABASE_URL ? 'configured' : 'missing'
    },
    callbacks: {
      endpoint: '/callback'
    }
  });
});

// Payment success handler
async function handlePaymentSuccess(data) {
  try {
    // Update client transaction status
    const { error } = await supabase
      .from('client_transactions')
      .update({
        status: 'success',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('internal_reference', data.reference);
    
    if (error) {
      console.error('Error updating payment transaction:', error);
    } else {
      console.log('Payment transaction updated successfully:', data.reference);
    }
    
    // Trigger client webhook if configured
    await triggerClientWebhook(data, 'payment.success');
    
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Payment failed handler
async function handlePaymentFailed(data) {
  try {
    // Update client transaction status
    const { error } = await supabase
      .from('client_transactions')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('internal_reference', data.reference);
    
    if (error) {
      console.error('Error updating failed payment transaction:', error);
    } else {
      console.log('Failed payment transaction updated:', data.reference);
    }
    
    // Trigger client webhook if configured
    await triggerClientWebhook(data, 'payment.failed');
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Transfer success handler
async function handleTransferSuccess(data) {
  try {
    // Update client transaction status
    const { error } = await supabase
      .from('client_transactions')
      .update({
        status: 'success',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('internal_reference', data.reference);
    
    if (error) {
      console.error('Error updating transfer transaction:', error);
    } else {
      console.log('Transfer transaction updated successfully:', data.reference);
    }
    
    // Trigger client webhook if configured
    await triggerClientWebhook(data, 'transfer.success');
    
  } catch (error) {
    console.error('Error handling transfer success:', error);
  }
}

// Transfer failed handler
async function handleTransferFailed(data) {
  try {
    // Update client transaction status
    const { error } = await supabase
      .from('client_transactions')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('internal_reference', data.reference);
    
    if (error) {
      console.error('Error updating failed transfer transaction:', error);
    } else {
      console.log('Failed transfer transaction updated:', data.reference);
    }
    
    // Trigger client webhook if configured
    await triggerClientWebhook(data, 'transfer.failed');
    
  } catch (error) {
    console.error('Error handling transfer failure:', error);
  }
}

// Transfer reversed handler
async function handleTransferReversed(data) {
  try {
    // Update client transaction status
    const { error } = await supabase
      .from('client_transactions')
      .update({
        status: 'reversed',
        updated_at: new Date().toISOString()
      })
      .eq('internal_reference', data.reference);
    
    if (error) {
      console.error('Error updating reversed transfer transaction:', error);
    } else {
      console.log('Reversed transfer transaction updated:', data.reference);
    }
    
    // Trigger client webhook if configured
    await triggerClientWebhook(data, 'transfer.reversed');
    
  } catch (error) {
    console.error('Error handling transfer reversal:', error);
  }
}

// Sayswitch transfer success handler
async function handleSayswitchTransferSuccess(data) {
  try {
    // Update client transaction status
    const { error } = await supabase
      .from('client_transactions')
      .update({
        status: 'success',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('internal_reference', data.reference);
    
    if (error) {
      console.error('Error updating Sayswitch transfer transaction:', error);
    } else {
      console.log('Sayswitch transfer transaction updated successfully:', data.reference);
    }
    
    // Trigger client webhook if configured
    await triggerClientWebhook(data, 'transfer.success');
    
  } catch (error) {
    console.error('Error handling Sayswitch transfer success:', error);
  }
}

// Sayswitch transfer failed handler
async function handleSayswitchTransferFailed(data) {
  try {
    // Update client transaction status
    const { error } = await supabase
      .from('client_transactions')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('internal_reference', data.reference);
    
    if (error) {
      console.error('Error updating failed Sayswitch transfer transaction:', error);
    } else {
      console.log('Failed Sayswitch transfer transaction updated:', data.reference);
    }
    
    // Trigger client webhook if configured
    await triggerClientWebhook(data, 'transfer.failed');
    
  } catch (error) {
    console.error('Error handling Sayswitch transfer failure:', error);
  }
}

// Trigger client webhook
async function triggerClientWebhook(data, eventType) {
  try {
    // Get client organization details for webhook
    const { data: transaction } = await supabase
      .from('client_transactions')
      .select(`
        client_reference,
        client_org_id,
        client_organizations (
          webhook_url,
          client_code,
          organization_name
        )
      `)
      .eq('internal_reference', data.reference)
      .single();
    
    if (transaction?.client_organizations?.webhook_url) {
      const webhookPayload = {
        event: eventType,
        data: {
          reference: transaction.client_reference,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          timestamp: new Date().toISOString()
        },
        client: {
          code: transaction.client_organizations.client_code,
          organization: transaction.client_organizations.organization_name
        }
      };
      
      // Send webhook to client
      const response = await fetch(transaction.client_organizations.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Fixer-Event': eventType,
          'X-Fixer-Signature': crypto
            .createHmac('sha256', 'client_webhook_secret') // Use client-specific secret
            .update(JSON.stringify(webhookPayload))
            .digest('hex')
        },
        body: JSON.stringify(webhookPayload)
      });
      
      console.log('Client webhook sent:', response.status, transaction.client_organizations.webhook_url);
    }
    
  } catch (error) {
    console.error('Error triggering client webhook:', error);
  }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Production Webhook Handler running on port ${PORT}`);
  console.log(`🔗 Paystack webhook: /webhook/paystack`);
  console.log(`🔗 Sayswitch webhook: /webhook/sayswitch`);
  console.log(`🔙 Callback endpoint: /callback`);
  console.log(`📊 Health check: /health`);
  console.log(`📋 Webhook status: /webhook/status`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;