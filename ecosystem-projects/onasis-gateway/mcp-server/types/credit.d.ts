// Credit-as-a-Service Type Definitions

export interface CreditApplication {
    id: string;
    user_id: string;
    business_id: string;
    amount_requested: number;
    currency: string;
    purpose: string;
    loan_term_months: number;
    status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'completed';
    metadata?: Record<string, any>;
    created_at: string;
    updated_at?: string;
}

export interface CreditProvider {
    id: string;
    provider_code: string;
    company_name: string;
    registration_number: string;
    contact_email: string;
    contact_phone: string;
    address: Address;
    minimum_loan_amount: number;
    maximum_loan_amount: number;
    supported_currencies: string[];
    interest_rate_range: {
        min: number;
        max: number;
    };
    processing_fee_percentage: number;
    api_endpoint?: string;
    webhook_url?: string;
    status: 'pending_verification' | 'active' | 'suspended' | 'inactive';
    metadata?: Record<string, any>;
    created_at: string;
    updated_at?: string;
}

export interface CreditBid {
    id: string;
    application_id: string;
    provider_id: string;
    offered_amount: number;
    interest_rate: number;
    loan_term_months: number;
    processing_fee: number;
    total_repayment: number;
    monthly_repayment: number;
    special_conditions?: Record<string, any>;
    valid_until: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';
    created_at: string;
    updated_at?: string;
}

export interface CreditTransaction {
    id: string;
    bid_id: string;
    application_id: string;
    provider_id: string;
    transaction_type: 'disbursement' | 'repayment' | 'fee' | 'penalty' | 'refund';
    amount: number;
    currency: string;
    payment_method: string;
    reference_number: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'reversed';
    metadata?: Record<string, any>;
    created_at: string;
    processed_at?: string;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    postal_code?: string;
    country: string;
}

export interface CreditScore {
    id: string;
    user_id?: string;
    business_id?: string;
    score: number;
    bureau: string;
    report_data: Record<string, any>;
    created_at: string;
}

export interface CreditAnalytics {
    total_applications: number;
    approved_applications: number;
    total_disbursed: number;
    average_loan_amount: number;
    average_interest_rate: number;
    provider_performance: ProviderPerformance[];
}

export interface ProviderPerformance {
    provider_id: string;
    company_name: string;
    total_bids: number;
    accepted_bids: number;
    avg_interest_rate: number;
    avg_loan_amount: number;
    total_disbursed: number;
}

// MCP Tool Definitions
export interface CreditTools {
    credit_submit_application: (params: {
        user_id: string;
        business_id: string;
        amount_requested: number;
        currency?: string;
        purpose: string;
        loan_term_months: number;
        metadata?: Record<string, any>;
    }) => Promise<CreditApplication>;
    
    credit_get_applications: (params?: {
        user_id?: string;
        business_id?: string;
        status?: string;
    }) => Promise<CreditApplication[]>;
    
    credit_get_application: (params: {
        application_id: string;
    }) => Promise<CreditApplication & { bids: CreditBid[] }>;
    
    credit_update_application_status: (params: {
        application_id: string;
        status: string;
        notes?: string;
    }) => Promise<CreditApplication>;
    
    credit_register_provider: (params: Omit<CreditProvider, 'id' | 'created_at' | 'updated_at' | 'status'>) => Promise<CreditProvider>;
    
    credit_get_providers: (params?: {
        status?: string;
        active_only?: boolean;
    }) => Promise<CreditProvider[]>;
    
    credit_submit_provider_bid: (params: {
        application_id: string;
        provider_id: string;
        offered_amount: number;
        interest_rate: number;
        loan_term_months: number;
        processing_fee: number;
        special_conditions?: Record<string, any>;
        valid_until: string;
    }) => Promise<CreditBid>;
    
    credit_process_transaction: (params: Omit<CreditTransaction, 'id' | 'created_at' | 'processed_at' | 'status'> & {
        status?: string;
    }) => Promise<CreditTransaction>;
    
    credit_perform_credit_check: (params: {
        user_id?: string;
        business_id?: string;
    }) => Promise<CreditScore>;
    
    credit_get_analytics: (params: {
        start_date: string;
        end_date: string;
    }) => Promise<CreditAnalytics>;
    
    credit_provider_performance: (params: {
        provider_id: string;
    }) => Promise<ProviderPerformance>;
    
    credit_health_check: () => Promise<{
        status: string;
        service: string;
        database: string;
        timestamp: string;
    }>;
}
