import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface ClientAuthResult {
  is_valid: boolean;
  client_org_id: string;
  client_code: string;
  organization_name: string;
  subscription_tier: string;
  monthly_quota: number;
  api_key_id: string;
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
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const path = url.pathname;

    // Extract client IP and user agent for logging
    const clientIP = req.headers.get("x-forwarded-for") || 
                    req.headers.get("x-real-ip") || 
                    "unknown";
    const userAgent = req.headers.get("user-agent") || "";

    // Generate request ID for tracking
    const requestId = crypto.randomUUID();

    // Authenticate client (skip for webhooks and health checks)
    let client: ClientAuthResult | null = null;
    if (!path.includes('/webhook') && !path.includes('/health')) {
      const authHeader = req.headers.get("authorization");
      const apiKeyHeader = req.headers.get("x-api-key");
      
      if (!authHeader && !apiKeyHeader) {
        return new Response(
          JSON.stringify({ 
            error: "Authentication required",
            message: "Please provide API key in Authorization header or x-api-key header",
            code: "AUTH_REQUIRED"
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      const apiKey = authHeader?.replace('Bearer ', '') || apiKeyHeader;
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
            message: "API key must be in format: keyId.keySecret",
            code: "INVALID_KEY_STRUCTURE"
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      // Validate client API key
      const { data: clientValidation } = await supabase.rpc('validate_client_api_key', {
        p_key_id: keyId,
        p_key_secret: keySecret
      });

      if (!clientValidation?.[0]?.is_valid) {
        return new Response(
          JSON.stringify({ 
            error: "Invalid API credentials",
            code: "INVALID_CREDENTIALS"
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      client = clientValidation[0];
    }

    // Route handling
    if (path.includes('/health')) {
      return handleHealthCheck();
    } else if (path.includes('/payments/initialize')) {
      return await handlePaymentInitialize(req, client!, supabase, requestId, clientIP, userAgent);
    } else if (path.includes('/payments/verify')) {
      return await handlePaymentVerify(req, client!, supabase, requestId, clientIP, userAgent);
    } else if (path.includes('/payments/transactions')) {
      return await handlePaymentTransactions(req, client!, supabase, requestId, clientIP, userAgent);
    } else if (path.includes('/transfers/send')) {
      return await handleTransferSend(req, client!, supabase, requestId, clientIP, userAgent);
    } else if (path.includes('/transfers/verify')) {
      return await handleTransferVerify(req, client!, supabase, requestId, clientIP, userAgent);
    } else if (path.includes('/transfers/banks')) {
      return await handleTransferBanks(req, client!, supabase, requestId, clientIP, userAgent);
    } else if (path.includes('/transfers/transactions')) {
      return await handleTransferTransactions(req, client!, supabase, requestId, clientIP, userAgent);
    } else if (path.includes('/account/usage')) {
      return await handleAccountUsage(req, client!, supabase, requestId, clientIP, userAgent);
    } else if (path.includes('/webhook/payment')) {
      return await handlePaymentWebhook(req, supabase);
    } else if (path.includes('/webhook/transfer')) {
      return await handleTransferWebhook(req, supabase);
    } else {
      return new Response(
        JSON.stringify({ 
          error: "Endpoint not found",
          available_endpoints: [
            "GET /health - Service health check",
            "POST /payments/initialize - Initialize payment",
            "GET /payments/verify/{reference} - Verify payment",
            "GET /payments/transactions - List payment transactions",
            "POST /transfers/send - Send money transfer",
            "GET /transfers/verify/{reference} - Verify transfer",
            "GET /transfers/banks - List available banks",
            "GET /transfers/transactions - List transfer transactions",
            "GET /account/usage - Get usage statistics"
          ]
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

  } catch (error) {
    console.error("Client API error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        message: "An unexpected error occurred",
        code: "INTERNAL_ERROR"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// Health Check
function handleHealthCheck() {
  return new Response(
    JSON.stringify({
      status: "healthy",
      service: "Fixer Initiative Client API",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      endpoints: {
        payments: "Available",
        transfers: "Available",
        webhooks: "Available"
      }
    }),
    { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

// Payment Initialize
async function handlePaymentInitialize(
  req: Request, 
  client: ClientAuthResult, 
  supabase: any, 
  requestId: string,
  clientIP: string,
  userAgent: string
) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { email, amount, currency = "NGN", reference, callback_url, metadata = {} } = body;

    if (!email || !amount) {
      await logClientUsage(supabase, client, requestId, "/payments/initialize", "POST", "payment", 400, Date.now() - startTime, 0, clientIP, userAgent);
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

    // Generate client reference
    const clientReference = reference || `${client.client_code}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Call internal Paystack integration
    const paystackResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/paystack-integration/initialize`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
        "x-vendor-key": Deno.env.get("INTERNAL_VENDOR_API_KEY")!
      },
      body: JSON.stringify({
        email,
        amount,
        currency,
        reference: clientReference,
        callback_url: callback_url || `${Deno.env.get("SUPABASE_URL")}/functions/v1/client-api/webhook/payment`,
        metadata: {
          ...metadata,
          client_org_id: client.client_org_id,
          client_reference: reference
        }
      })
    });

    const paystackData = await paystackResponse.json();
    
    if (!paystackResponse.ok) {
      throw new Error(paystackData.error || "Payment initialization failed");
    }

    // Store in client transactions table
    await supabase.from('client_transactions').insert({
      client_org_id: client.client_org_id,
      client_reference: clientReference,
      internal_reference: paystackData.data.reference,
      service_type: 'payment',
      service_provider: 'paystack',
      amount: amount,
      currency: currency,
      customer_email: email,
      status: 'initialized',
      metadata: { ...metadata, client_reference: reference },
      client_ip: clientIP,
      user_agent: userAgent
    });

    const processingTime = Date.now() - startTime;
    await logClientUsage(supabase, client, requestId, "/payments/initialize", "POST", "payment", 200, processingTime, JSON.stringify(paystackData).length, clientIP, userAgent);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          payment_url: paystackData.data.authorization_url,
          reference: clientReference,
          amount: amount,
          currency: currency
        },
        meta: {
          request_id: requestId,
          processing_time_ms: processingTime
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    await logClientUsage(supabase, client, requestId, "/payments/initialize", "POST", "payment", 500, processingTime, 0, clientIP, userAgent);
    throw error;
  }
}

// Payment Verify
async function handlePaymentVerify(
  req: Request, 
  client: ClientAuthResult, 
  supabase: any, 
  requestId: string,
  clientIP: string,
  userAgent: string
) {
  const startTime = Date.now();
  
  try {
    const url = new URL(req.url);
    const reference = url.pathname.split('/').pop();

    if (!reference) {
      await logClientUsage(supabase, client, requestId, "/payments/verify", "GET", "payment", 400, Date.now() - startTime, 0, clientIP, userAgent);
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

    // Get transaction from client transactions table
    const { data: transaction } = await supabase
      .from('client_transactions')
      .select('*')
      .eq('client_reference', reference)
      .eq('client_org_id', client.client_org_id)
      .eq('service_type', 'payment')
      .single();

    if (!transaction) {
      await logClientUsage(supabase, client, requestId, "/payments/verify", "GET", "payment", 404, Date.now() - startTime, 0, clientIP, userAgent);
      return new Response(
        JSON.stringify({ 
          error: "Transaction not found",
          code: "TRANSACTION_NOT_FOUND"
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Verify with internal Paystack integration
    const paystackResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/paystack-integration/verify/${transaction.internal_reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
        "x-vendor-key": Deno.env.get("INTERNAL_VENDOR_API_KEY")!
      }
    });

    const paystackData = await paystackResponse.json();
    
    if (!paystackResponse.ok) {
      throw new Error(paystackData.error || "Payment verification failed");
    }

    // Update client transaction status
    await supabase
      .from('client_transactions')
      .update({
        status: paystackData.data.status,
        completed_at: paystackData.data.status === 'success' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    const processingTime = Date.now() - startTime;
    await logClientUsage(supabase, client, requestId, "/payments/verify", "GET", "payment", 200, processingTime, JSON.stringify(paystackData).length, clientIP, userAgent);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          reference: reference,
          status: paystackData.data.status,
          amount: paystackData.data.amount / 100, // Convert from kobo
          currency: paystackData.data.currency,
          customer_email: transaction.customer_email,
          transaction_date: paystackData.data.transaction_date,
          completed_at: transaction.completed_at
        },
        meta: {
          request_id: requestId,
          processing_time_ms: processingTime
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    await logClientUsage(supabase, client, requestId, "/payments/verify", "GET", "payment", 500, processingTime, 0, clientIP, userAgent);
    throw error;
  }
}

// Payment Transactions List
async function handlePaymentTransactions(
  req: Request, 
  client: ClientAuthResult, 
  supabase: any, 
  requestId: string,
  clientIP: string,
  userAgent: string
) {
  const startTime = Date.now();
  
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const status = url.searchParams.get('status');
    
    let query = supabase
      .from('client_transactions')
      .select('client_reference, amount, currency, customer_email, status, created_at, completed_at, metadata')
      .eq('client_org_id', client.client_org_id)
      .eq('service_type', 'payment')
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
    await logClientUsage(supabase, client, requestId, "/payments/transactions", "GET", "payment", 200, processingTime, JSON.stringify(transactions).length, clientIP, userAgent);

    return new Response(
      JSON.stringify({
        success: true,
        data: transactions || [],
        pagination: {
          page,
          limit,
          total: transactions?.length || 0
        },
        meta: {
          request_id: requestId,
          processing_time_ms: processingTime
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    await logClientUsage(supabase, client, requestId, "/payments/transactions", "GET", "payment", 500, processingTime, 0, clientIP, userAgent);
    throw error;
  }
}

// Transfer Send
async function handleTransferSend(
  req: Request, 
  client: ClientAuthResult, 
  supabase: any, 
  requestId: string,
  clientIP: string,
  userAgent: string
) {
  const startTime = Date.now();
  
  try {
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
      await logClientUsage(supabase, client, requestId, "/transfers/send", "POST", "transfer", 400, Date.now() - startTime, 0, clientIP, userAgent);
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

    // Generate client reference
    const clientReference = reference || `${client.client_code}_TXF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Call internal Sayswitch integration
    const sayswitchResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/sayswitch-integration/transfer`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
        "x-vendor-key": Deno.env.get("INTERNAL_VENDOR_API_KEY")!
      },
      body: JSON.stringify({
        amount,
        account_number,
        bank_code,
        account_name,
        reference: clientReference,
        narration,
        currency
      })
    });

    const sayswitchData = await sayswitchResponse.json();
    
    if (!sayswitchResponse.ok) {
      throw new Error(sayswitchData.error || "Transfer initiation failed");
    }

    // Store in client transactions table
    await supabase.from('client_transactions').insert({
      client_org_id: client.client_org_id,
      client_reference: clientReference,
      internal_reference: sayswitchData.data.reference,
      service_type: 'transfer',
      service_provider: 'sayswitch',
      amount: amount,
      currency: currency,
      recipient_account: account_number,
      recipient_bank_code: bank_code,
      recipient_name: account_name,
      status: 'pending',
      metadata: { narration, client_reference: reference },
      client_ip: clientIP,
      user_agent: userAgent
    });

    const processingTime = Date.now() - startTime;
    await logClientUsage(supabase, client, requestId, "/transfers/send", "POST", "transfer", 200, processingTime, JSON.stringify(sayswitchData).length, clientIP, userAgent);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          reference: clientReference,
          status: sayswitchData.data.status || 'pending',
          amount: amount,
          recipient_account: account_number,
          recipient_bank_code: bank_code,
          recipient_name: account_name
        },
        meta: {
          request_id: requestId,
          processing_time_ms: processingTime
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    await logClientUsage(supabase, client, requestId, "/transfers/send", "POST", "transfer", 500, processingTime, 0, clientIP, userAgent);
    throw error;
  }
}

// Transfer Verify
async function handleTransferVerify(
  req: Request, 
  client: ClientAuthResult, 
  supabase: any, 
  requestId: string,
  clientIP: string,
  userAgent: string
) {
  const startTime = Date.now();
  
  try {
    const url = new URL(req.url);
    const reference = url.pathname.split('/').pop();

    if (!reference) {
      await logClientUsage(supabase, client, requestId, "/transfers/verify", "GET", "transfer", 400, Date.now() - startTime, 0, clientIP, userAgent);
      return new Response(
        JSON.stringify({ 
          error: "Transfer reference is required",
          code: "MISSING_REFERENCE"
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Get transaction from client transactions table
    const { data: transaction } = await supabase
      .from('client_transactions')
      .select('*')
      .eq('client_reference', reference)
      .eq('client_org_id', client.client_org_id)
      .eq('service_type', 'transfer')
      .single();

    if (!transaction) {
      await logClientUsage(supabase, client, requestId, "/transfers/verify", "GET", "transfer", 404, Date.now() - startTime, 0, clientIP, userAgent);
      return new Response(
        JSON.stringify({ 
          error: "Transaction not found",
          code: "TRANSACTION_NOT_FOUND"
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Verify with internal Sayswitch integration
    const sayswitchResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/sayswitch-integration/verify/${transaction.internal_reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
        "x-vendor-key": Deno.env.get("INTERNAL_VENDOR_API_KEY")!
      }
    });

    const sayswitchData = await sayswitchResponse.json();
    
    if (!sayswitchResponse.ok) {
      throw new Error(sayswitchData.error || "Transfer verification failed");
    }

    // Update client transaction status
    await supabase
      .from('client_transactions')
      .update({
        status: sayswitchData.data.status,
        completed_at: sayswitchData.data.status === 'success' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    const processingTime = Date.now() - startTime;
    await logClientUsage(supabase, client, requestId, "/transfers/verify", "GET", "transfer", 200, processingTime, JSON.stringify(sayswitchData).length, clientIP, userAgent);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          reference: reference,
          status: sayswitchData.data.status,
          amount: sayswitchData.data.amount,
          currency: sayswitchData.data.currency,
          recipient_account: transaction.recipient_account,
          recipient_bank_code: transaction.recipient_bank_code,
          recipient_name: transaction.recipient_name,
          created_at: sayswitchData.data.created_at,
          completed_at: sayswitchData.data.completed_at
        },
        meta: {
          request_id: requestId,
          processing_time_ms: processingTime
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    await logClientUsage(supabase, client, requestId, "/transfers/verify", "GET", "transfer", 500, processingTime, 0, clientIP, userAgent);
    throw error;
  }
}

// Transfer Banks
async function handleTransferBanks(
  req: Request, 
  client: ClientAuthResult, 
  supabase: any, 
  requestId: string,
  clientIP: string,
  userAgent: string
) {
  const startTime = Date.now();
  
  try {
    // Get banks from internal Sayswitch integration
    const sayswitchResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/sayswitch-integration/banks`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": "application/json",
        "x-vendor-key": Deno.env.get("INTERNAL_VENDOR_API_KEY")!
      }
    });

    const sayswitchData = await sayswitchResponse.json();
    
    if (!sayswitchResponse.ok) {
      throw new Error(sayswitchData.error || "Failed to get banks list");
    }

    const processingTime = Date.now() - startTime;
    await logClientUsage(supabase, client, requestId, "/transfers/banks", "GET", "transfer", 200, processingTime, JSON.stringify(sayswitchData).length, clientIP, userAgent);

    return new Response(
      JSON.stringify({
        success: true,
        data: sayswitchData.data,
        meta: {
          request_id: requestId,
          processing_time_ms: processingTime
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    await logClientUsage(supabase, client, requestId, "/transfers/banks", "GET", "transfer", 500, processingTime, 0, clientIP, userAgent);
    throw error;
  }
}

// Transfer Transactions List
async function handleTransferTransactions(
  req: Request, 
  client: ClientAuthResult, 
  supabase: any, 
  requestId: string,
  clientIP: string,
  userAgent: string
) {
  const startTime = Date.now();
  
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const status = url.searchParams.get('status');
    
    let query = supabase
      .from('client_transactions')
      .select('client_reference, amount, currency, recipient_account, recipient_bank_code, recipient_name, status, created_at, completed_at, metadata')
      .eq('client_org_id', client.client_org_id)
      .eq('service_type', 'transfer')
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
    await logClientUsage(supabase, client, requestId, "/transfers/transactions", "GET", "transfer", 200, processingTime, JSON.stringify(transactions).length, clientIP, userAgent);

    return new Response(
      JSON.stringify({
        success: true,
        data: transactions || [],
        pagination: {
          page,
          limit,
          total: transactions?.length || 0
        },
        meta: {
          request_id: requestId,
          processing_time_ms: processingTime
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    await logClientUsage(supabase, client, requestId, "/transfers/transactions", "GET", "transfer", 500, processingTime, 0, clientIP, userAgent);
    throw error;
  }
}

// Account Usage
async function handleAccountUsage(
  req: Request, 
  client: ClientAuthResult, 
  supabase: any, 
  requestId: string,
  clientIP: string,
  userAgent: string
) {
  const startTime = Date.now();
  
  try {
    const url = new URL(req.url);
    const startDate = url.searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = url.searchParams.get('end_date') || new Date().toISOString();

    const { data: usage } = await supabase.rpc('get_client_usage_summary', {
      p_client_org_id: client.client_org_id,
      p_start_date: startDate,
      p_end_date: endDate
    });

    const processingTime = Date.now() - startTime;
    await logClientUsage(supabase, client, requestId, "/account/usage", "GET", "account", 200, processingTime, JSON.stringify(usage).length, clientIP, userAgent);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          period: {
            start_date: startDate,
            end_date: endDate
          },
          usage: usage?.[0] || {},
          account: {
            organization_name: client.organization_name,
            subscription_tier: client.subscription_tier,
            monthly_quota: client.monthly_quota
          }
        },
        meta: {
          request_id: requestId,
          processing_time_ms: processingTime
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    const processingTime = Date.now() - startTime;
    await logClientUsage(supabase, client, requestId, "/account/usage", "GET", "account", 500, processingTime, 0, clientIP, userAgent);
    throw error;
  }
}

// Payment Webhook (proxy to internal)
async function handlePaymentWebhook(req: Request, supabase: any) {
  // Proxy to internal paystack webhook handler
  const webhookResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/paystack-integration/webhook`, {
    method: req.method,
    headers: req.headers,
    body: await req.text()
  });

  return new Response(await webhookResponse.text(), {
    status: webhookResponse.status,
    headers: webhookResponse.headers
  });
}

// Transfer Webhook (proxy to internal)
async function handleTransferWebhook(req: Request, supabase: any) {
  // Proxy to internal sayswitch webhook handler
  const webhookResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/sayswitch-integration/webhook`, {
    method: req.method,
    headers: req.headers,
    body: await req.text()
  });

  return new Response(await webhookResponse.text(), {
    status: webhookResponse.status,
    headers: webhookResponse.headers
  });
}

// Log client usage for billing
async function logClientUsage(
  supabase: any, 
  client: ClientAuthResult, 
  requestId: string,
  endpoint: string,
  method: string,
  serviceType: string,
  statusCode: number,
  processingTime: number,
  responseSize: number,
  clientIP: string,
  userAgent: string
) {
  try {
    await supabase.rpc('log_client_usage', {
      p_client_org_id: client.client_org_id,
      p_api_key_id: client.api_key_id,
      p_request_id: requestId,
      p_endpoint: endpoint,
      p_method: method,
      p_service_type: serviceType,
      p_status_code: statusCode,
      p_processing_time_ms: processingTime,
      p_response_size_bytes: responseSize,
      p_client_ip: clientIP,
      p_user_agent: userAgent
    });
  } catch (error) {
    console.error("Failed to log client usage:", error);
  }
}