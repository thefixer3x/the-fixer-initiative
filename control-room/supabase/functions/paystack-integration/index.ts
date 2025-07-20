import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-vendor-key",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface VendorAuthResult {
  is_valid: boolean;
  vendor_org_id: string;
  vendor_code: string;
  rate_limit: number;
  allowed_platforms: string[];
  allowed_services: Record<string, boolean>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const path = url.pathname;

    // Vendor Authentication for API calls (not webhooks)
    let vendor: VendorAuthResult | null = null;
    if (!path.includes('/webhook') && req.method !== "GET") {
      const authHeader = req.headers.get("authorization");
      const vendorKeyHeader = req.headers.get("x-vendor-key");
      
      if (!authHeader && !vendorKeyHeader) {
        return new Response(
          JSON.stringify({ 
            error: "Missing authorization header or x-vendor-key",
            code: "AUTH_REQUIRED"
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      // Parse vendor API key
      const apiKey = authHeader?.replace('Bearer ', '') || vendorKeyHeader;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ 
            error: "Invalid API key format",
            code: "INVALID_KEY_FORMAT"
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      const [keyId, keySecret] = apiKey.split('.');
      if (!keyId || !keySecret) {
        return new Response(
          JSON.stringify({ 
            error: "Invalid API key structure",
            code: "INVALID_KEY_STRUCTURE"
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      // Validate vendor API key
      const { data: vendorValidation } = await supabase.rpc('validate_vendor_api_key', {
        p_key_id: keyId,
        p_key_secret: keySecret
      });

      if (!vendorValidation?.[0]?.is_valid) {
        return new Response(
          JSON.stringify({ 
            error: "Invalid vendor credentials",
            code: "INVALID_CREDENTIALS"
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      vendor = vendorValidation[0];

      // Check service permission for Paystack
      if (!vendor.allowed_services?.paystack) {
        return new Response(
          JSON.stringify({ 
            error: "Paystack service access denied for this vendor",
            code: "SERVICE_ACCESS_DENIED"
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    // Route handling
    if (path.includes('/webhook')) {
      return await handleWebhook(req, supabase);
    } else if (path.includes('/initialize')) {
      return await initializePayment(req, vendor!, supabase);
    } else if (path.includes('/verify')) {
      return await verifyPayment(req, vendor!, supabase);
    } else if (path.includes('/transactions')) {
      return await listTransactions(req, vendor!, supabase);
    } else {
      return new Response(
        JSON.stringify({ 
          error: "Endpoint not found",
          available_endpoints: [
            "/paystack-integration/initialize",
            "/paystack-integration/verify/{reference}",
            "/paystack-integration/transactions",
            "/paystack-integration/webhook"
          ]
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

  } catch (error) {
    console.error("Paystack integration error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: error.message,
        code: "INTERNAL_ERROR"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// Initialize Payment
async function initializePayment(req: Request, vendor: VendorAuthResult, supabase: any) {
  const startTime = Date.now();
  const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
  
  if (!paystackSecretKey) {
    throw new Error("Paystack secret key not configured");
  }

  const body = await req.json();
  const { email, amount, currency = "NGN", reference, callback_url, metadata = {} } = body;

  if (!email || !amount) {
    return new Response(
      JSON.stringify({ 
        error: "Email and amount are required",
        code: "MISSING_REQUIRED_FIELDS"
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  try {
    // Generate anonymous reference if not provided
    const paymentReference = reference || `${vendor.vendor_code}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const paystackPayload = {
      email,
      amount: amount * 100, // Convert to kobo
      currency,
      reference: paymentReference,
      callback_url: callback_url || `${Deno.env.get("SUPABASE_URL")}/functions/v1/paystack-integration/webhook`,
      metadata: {
        ...metadata,
        vendor_org_id: vendor.vendor_org_id,
        vendor_code: vendor.vendor_code,
        client_reference: reference
      }
    };

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paystackPayload)
    });

    const paystackData = await paystackResponse.json();
    
    if (!paystackResponse.ok) {
      throw new Error(paystackData.message || "Paystack initialization failed");
    }

    // Store transaction for tracking
    await supabase.from('payment_transactions').insert({
      vendor_org_id: vendor.vendor_org_id,
      service: 'paystack',
      reference: paymentReference,
      external_reference: paymentReference,
      amount: amount,
      currency: currency,
      email: email,
      status: 'initialized',
      raw_response: paystackData,
      metadata: paystackPayload.metadata
    });

    // Log usage
    const processingTime = Date.now() - startTime;
    await logUsage(supabase, vendor, 'paystack', 'initialize', processingTime, true);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          authorization_url: paystackData.data.authorization_url,
          access_code: paystackData.data.access_code,
          reference: paymentReference
        },
        vendor_metadata: {
          vendor_code: vendor.vendor_code,
          processing_time_ms: processingTime
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    await logUsage(supabase, vendor, 'paystack', 'initialize', processingTime, false);
    
    throw error;
  }
}

// Verify Payment
async function verifyPayment(req: Request, vendor: VendorAuthResult, supabase: any) {
  const startTime = Date.now();
  const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
  
  if (!paystackSecretKey) {
    throw new Error("Paystack secret key not configured");
  }

  const url = new URL(req.url);
  const reference = url.pathname.split('/').pop();

  if (!reference) {
    return new Response(
      JSON.stringify({ 
        error: "Payment reference is required",
        code: "MISSING_REFERENCE"
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  try {
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json"
      }
    });

    const paystackData = await paystackResponse.json();
    
    if (!paystackResponse.ok) {
      throw new Error(paystackData.message || "Paystack verification failed");
    }

    // Update local transaction record
    await supabase.from('payment_transactions')
      .update({
        status: paystackData.data.status,
        raw_response: paystackData,
        verified_at: new Date().toISOString()
      })
      .eq('reference', reference)
      .eq('vendor_org_id', vendor.vendor_org_id);

    const processingTime = Date.now() - startTime;
    await logUsage(supabase, vendor, 'paystack', 'verify', processingTime, true);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          status: paystackData.data.status,
          reference: paystackData.data.reference,
          amount: paystackData.data.amount / 100, // Convert from kobo
          currency: paystackData.data.currency,
          transaction_date: paystackData.data.transaction_date,
          customer: paystackData.data.customer
        },
        vendor_metadata: {
          vendor_code: vendor.vendor_code,
          processing_time_ms: processingTime
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    await logUsage(supabase, vendor, 'paystack', 'verify', processingTime, false);
    
    throw error;
  }
}

// List Transactions
async function listTransactions(req: Request, vendor: VendorAuthResult, supabase: any) {
  const startTime = Date.now();
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const status = url.searchParams.get('status');
  
  try {
    let query = supabase.from('payment_transactions')
      .select('*')
      .eq('vendor_org_id', vendor.vendor_org_id)
      .eq('service', 'paystack')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: transactions, error } = await query;
    
    if (error) {
      throw new Error(error.message);
    }

    const processingTime = Date.now() - startTime;
    await logUsage(supabase, vendor, 'paystack', 'list_transactions', processingTime, true);

    return new Response(
      JSON.stringify({
        success: true,
        data: transactions || [],
        pagination: {
          page,
          limit,
          total: transactions?.length || 0
        },
        vendor_metadata: {
          vendor_code: vendor.vendor_code,
          processing_time_ms: processingTime
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    await logUsage(supabase, vendor, 'paystack', 'list_transactions', processingTime, false);
    
    throw error;
  }
}

// Handle Webhooks
async function handleWebhook(req: Request, supabase: any) {
  const paystackWebhookSecret = Deno.env.get("PAYSTACK_WEBHOOK_SECRET");
  
  if (!paystackWebhookSecret) {
    console.error("Paystack webhook secret not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  if (!signature) {
    console.error("Missing Paystack signature");
    return new Response("Missing signature", { status: 400 });
  }

  // Verify webhook signature
  const hash = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(paystackWebhookSecret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign", "verify"]
  );

  const expectedSignature = await crypto.subtle.sign(
    "HMAC",
    hash,
    new TextEncoder().encode(body)
  );

  const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (signature !== expectedSignatureHex) {
    console.error("Invalid webhook signature");
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const event = JSON.parse(body);
    console.log(`Received Paystack webhook: ${event.event}`);

    // Update transaction status based on webhook event
    if (event.event === 'charge.success' || event.event === 'charge.failed') {
      const reference = event.data.reference;
      const status = event.event === 'charge.success' ? 'success' : 'failed';

      await supabase.from('payment_transactions')
        .update({
          status: status,
          webhook_received_at: new Date().toISOString(),
          raw_webhook_data: event
        })
        .eq('reference', reference);

      console.log(`Updated transaction ${reference} status to ${status}`);
    }

    return new Response("Webhook processed successfully", { 
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}

// Log usage for billing
async function logUsage(
  supabase: any, 
  vendor: VendorAuthResult, 
  service: string, 
  endpoint: string, 
  processingTime: number, 
  success: boolean
) {
  try {
    await supabase.rpc('log_vendor_usage', {
      p_vendor_org_id: vendor.vendor_org_id,
      p_api_key_id: null, // Will be populated by the auth middleware if needed
      p_request_id: crypto.randomUUID(),
      p_platform: 'paystack-integration',
      p_service: service,
      p_endpoint: endpoint,
      p_processing_time_ms: processingTime,
      p_tokens_consumed: 0,
      p_status_code: success ? 200 : 500,
      p_success: success
    });
  } catch (error) {
    console.error("Failed to log usage:", error);
  }
}