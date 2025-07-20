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
    const sayswitchApiKey = Deno.env.get("SAYSWITCH_API_KEY");
    const sayswitchBaseUrl = Deno.env.get("SAYSWITCH_BASE_URL") || "https://api.sayswitch.com/v1";
    
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

      // Check service permission for Sayswitch
      if (!vendor.allowed_services?.sayswitch) {
        return new Response(
          JSON.stringify({ 
            error: "Sayswitch service access denied for this vendor",
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
    } else if (path.includes('/transfer')) {
      return await initiateTransfer(req, vendor!, supabase, sayswitchApiKey!, sayswitchBaseUrl);
    } else if (path.includes('/verify')) {
      return await verifyTransaction(req, vendor!, supabase, sayswitchApiKey!, sayswitchBaseUrl);
    } else if (path.includes('/balance')) {
      return await getBalance(req, vendor!, supabase, sayswitchApiKey!, sayswitchBaseUrl);
    } else if (path.includes('/banks')) {
      return await getBanks(req, vendor!, supabase, sayswitchApiKey!, sayswitchBaseUrl);
    } else if (path.includes('/transactions')) {
      return await listTransactions(req, vendor!, supabase);
    } else {
      return new Response(
        JSON.stringify({ 
          error: "Endpoint not found",
          available_endpoints: [
            "/sayswitch-integration/transfer",
            "/sayswitch-integration/verify/{reference}",
            "/sayswitch-integration/balance",
            "/sayswitch-integration/banks",
            "/sayswitch-integration/transactions",
            "/sayswitch-integration/webhook"
          ]
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

  } catch (error) {
    console.error("Sayswitch integration error:", error);
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

// Initiate Transfer
async function initiateTransfer(req: Request, vendor: VendorAuthResult, supabase: any, sayswitchApiKey: string, baseUrl: string) {
  const startTime = Date.now();

  const body = await req.json();
  const { 
    amount, 
    account_number, 
    bank_code, 
    account_name,
    reference, 
    narration = "Transfer via Fixer Initiative",
    currency = "NGN"
  } = body;

  if (!amount || !account_number || !bank_code) {
    return new Response(
      JSON.stringify({ 
        error: "Amount, account_number, and bank_code are required",
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
    const transferReference = reference || `${vendor.vendor_code}_TXF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const sayswitchPayload = {
      amount: parseFloat(amount),
      account_number,
      bank_code,
      account_name,
      reference: transferReference,
      narration,
      currency,
      metadata: {
        vendor_org_id: vendor.vendor_org_id,
        vendor_code: vendor.vendor_code,
        client_reference: reference
      }
    };

    const sayswitchResponse = await fetch(`${baseUrl}/transfers`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${sayswitchApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sayswitchPayload)
    });

    const sayswitchData = await sayswitchResponse.json();
    
    if (!sayswitchResponse.ok) {
      throw new Error(sayswitchData.message || "Sayswitch transfer initiation failed");
    }

    // Store transaction for tracking
    await supabase.from('payment_transactions').insert({
      vendor_org_id: vendor.vendor_org_id,
      service: 'sayswitch',
      reference: transferReference,
      external_reference: sayswitchData.data?.reference || transferReference,
      amount: amount,
      currency: currency,
      account_number: account_number,
      bank_code: bank_code,
      status: 'pending',
      transaction_type: 'transfer',
      raw_response: sayswitchData,
      metadata: sayswitchPayload.metadata
    });

    // Log usage
    const processingTime = Date.now() - startTime;
    await logUsage(supabase, vendor, 'sayswitch', 'transfer', processingTime, true);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          reference: transferReference,
          external_reference: sayswitchData.data?.reference,
          status: sayswitchData.data?.status || 'pending',
          amount: amount,
          account_number: account_number,
          bank_code: bank_code
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
    await logUsage(supabase, vendor, 'sayswitch', 'transfer', processingTime, false);
    
    throw error;
  }
}

// Verify Transaction
async function verifyTransaction(req: Request, vendor: VendorAuthResult, supabase: any, sayswitchApiKey: string, baseUrl: string) {
  const startTime = Date.now();
  
  const url = new URL(req.url);
  const reference = url.pathname.split('/').pop();

  if (!reference) {
    return new Response(
      JSON.stringify({ 
        error: "Transaction reference is required",
        code: "MISSING_REFERENCE"
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  try {
    const sayswitchResponse = await fetch(`${baseUrl}/transactions/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${sayswitchApiKey}`,
        "Content-Type": "application/json"
      }
    });

    const sayswitchData = await sayswitchResponse.json();
    
    if (!sayswitchResponse.ok) {
      throw new Error(sayswitchData.message || "Sayswitch verification failed");
    }

    // Update local transaction record
    await supabase.from('payment_transactions')
      .update({
        status: sayswitchData.data?.status || 'unknown',
        raw_response: sayswitchData,
        verified_at: new Date().toISOString()
      })
      .eq('reference', reference)
      .eq('vendor_org_id', vendor.vendor_org_id);

    const processingTime = Date.now() - startTime;
    await logUsage(supabase, vendor, 'sayswitch', 'verify', processingTime, true);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          reference: reference,
          status: sayswitchData.data?.status,
          amount: sayswitchData.data?.amount,
          currency: sayswitchData.data?.currency,
          created_at: sayswitchData.data?.created_at,
          completed_at: sayswitchData.data?.completed_at
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
    await logUsage(supabase, vendor, 'sayswitch', 'verify', processingTime, false);
    
    throw error;
  }
}

// Get Account Balance
async function getBalance(req: Request, vendor: VendorAuthResult, supabase: any, sayswitchApiKey: string, baseUrl: string) {
  const startTime = Date.now();
  
  try {
    const sayswitchResponse = await fetch(`${baseUrl}/balance`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${sayswitchApiKey}`,
        "Content-Type": "application/json"
      }
    });

    const sayswitchData = await sayswitchResponse.json();
    
    if (!sayswitchResponse.ok) {
      throw new Error(sayswitchData.message || "Failed to get balance");
    }

    const processingTime = Date.now() - startTime;
    await logUsage(supabase, vendor, 'sayswitch', 'balance', processingTime, true);

    return new Response(
      JSON.stringify({
        success: true,
        data: sayswitchData.data,
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
    await logUsage(supabase, vendor, 'sayswitch', 'balance', processingTime, false);
    
    throw error;
  }
}

// Get Banks List
async function getBanks(req: Request, vendor: VendorAuthResult, supabase: any, sayswitchApiKey: string, baseUrl: string) {
  const startTime = Date.now();
  
  try {
    const sayswitchResponse = await fetch(`${baseUrl}/banks`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${sayswitchApiKey}`,
        "Content-Type": "application/json"
      }
    });

    const sayswitchData = await sayswitchResponse.json();
    
    if (!sayswitchResponse.ok) {
      throw new Error(sayswitchData.message || "Failed to get banks list");
    }

    const processingTime = Date.now() - startTime;
    await logUsage(supabase, vendor, 'sayswitch', 'banks', processingTime, true);

    return new Response(
      JSON.stringify({
        success: true,
        data: sayswitchData.data,
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
    await logUsage(supabase, vendor, 'sayswitch', 'banks', processingTime, false);
    
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
  const type = url.searchParams.get('type');
  
  try {
    let query = supabase.from('payment_transactions')
      .select('*')
      .eq('vendor_org_id', vendor.vendor_org_id)
      .eq('service', 'sayswitch')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('transaction_type', type);
    }

    const { data: transactions, error } = await query;
    
    if (error) {
      throw new Error(error.message);
    }

    const processingTime = Date.now() - startTime;
    await logUsage(supabase, vendor, 'sayswitch', 'list_transactions', processingTime, true);

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
    await logUsage(supabase, vendor, 'sayswitch', 'list_transactions', processingTime, false);
    
    throw error;
  }
}

// Handle Webhooks
async function handleWebhook(req: Request, supabase: any) {
  const sayswitchWebhookSecret = Deno.env.get("SAYSWITCH_WEBHOOK_SECRET");
  
  const body = await req.text();
  const signature = req.headers.get('x-sayswitch-signature');

  // If webhook secret is configured, verify signature
  if (sayswitchWebhookSecret && signature) {
    const hash = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(sayswitchWebhookSecret),
      { name: "HMAC", hash: "SHA-256" },
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
  }

  try {
    const event = JSON.parse(body);
    console.log(`Received Sayswitch webhook: ${event.event || event.type}`);

    // Update transaction status based on webhook event
    if (event.data?.reference) {
      const reference = event.data.reference;
      const status = event.data.status || 'unknown';

      await supabase.from('payment_transactions')
        .update({
          status: status,
          webhook_received_at: new Date().toISOString(),
          raw_webhook_data: event
        })
        .eq('reference', reference)
        .eq('service', 'sayswitch');

      console.log(`Updated Sayswitch transaction ${reference} status to ${status}`);
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
      p_platform: 'sayswitch-integration',
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