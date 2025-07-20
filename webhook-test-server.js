#!/usr/bin/env node

/**
 * Simple webhook test server for Paystack webhook testing
 * Runs on localhost:8080 to work with ngrok tunnel
 */

const express = require('express');
const crypto = require('crypto');
const app = express();

// Middleware to capture raw body for webhook signature verification
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Test webhook endpoint
app.post('/webhook/paystack', (req, res) => {
  console.log('\n=== Paystack Webhook Received ===');
  console.log('Headers:', req.headers);
  
  // Log the raw body for debugging
  console.log('Raw Body:', req.body.toString());
  
  try {
    const payload = JSON.parse(req.body.toString());
    console.log('Parsed Payload:', JSON.stringify(payload, null, 2));
    
    // Check for signature if provided
    const signature = req.headers['x-paystack-signature'];
    if (signature) {
      console.log('Signature:', signature);
      
      // For testing, just log the signature verification attempt
      // In production, you'd verify with your webhook secret
      console.log('Signature verification would happen here');
    }
    
    // Log event type
    if (payload.event) {
      console.log('Event Type:', payload.event);
    }
    
    // Log transaction data if present
    if (payload.data) {
      console.log('Transaction Data:', {
        reference: payload.data.reference,
        amount: payload.data.amount,
        status: payload.data.status,
        customer: payload.data.customer?.email
      });
    }
    
    res.status(200).json({ 
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(400).json({ error: 'Invalid JSON payload' });
  }
});

// Test endpoint to verify server is running
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'Webhook Test Server',
    timestamp: new Date().toISOString(),
    ngrok_url: process.env.NGROK_URL || 'Set NGROK_URL environment variable'
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
        <p>This is a test callback page</p>
      </body>
    </html>
  `);
});

// Test endpoint to simulate webhook calls
app.get('/test', (req, res) => {
  res.json({
    message: 'Webhook test server is running',
    endpoints: {
      webhook: '/webhook/paystack',
      callback: '/callback',
      health: '/health'
    },
    instructions: [
      '1. Start ngrok: ngrok http 8080',
      '2. Copy the https URL',
      '3. Use Paystack CLI to test webhooks',
      '4. Monitor this console for webhook events'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Webhook Test Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/webhook/paystack`);
  console.log(`🔙 Callback endpoint: http://localhost:${PORT}/callback`);
  console.log(`\n📋 Next steps:`);
  console.log(`1. Your ngrok tunnel: https://f525e96e43e2.ngrok-free.app`);
  console.log(`2. Full webhook URL: https://f525e96e43e2.ngrok-free.app/webhook/paystack`);
  console.log(`3. Full callback URL: https://f525e96e43e2.ngrok-free.app/callback`);
  console.log(`4. Use Paystack CLI to test webhooks with this URL`);
});