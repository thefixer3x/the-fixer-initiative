const CreditAsAServiceClient = require('../../../services/credit-as-a-service/client');

const creditClient = new CreditAsAServiceClient();

module.exports = {
    // Application Management Tools
    credit_submit_application: {
        description: 'Submit a new credit application for SME financing',
        parameters: {
            user_id: { type: 'string', required: true },
            business_id: { type: 'string', required: true },
            amount_requested: { type: 'number', required: true },
            currency: { type: 'string', default: 'NGN' },
            purpose: { type: 'string', required: true },
            loan_term_months: { type: 'number', required: true },
            metadata: { type: 'object' }
        },
        handler: async (params) => {
            return await creditClient.submitApplication(params);
        }
    },
    
    credit_get_applications: {
        description: 'Get credit applications with optional filters',
        parameters: {
            user_id: { type: 'string' },
            business_id: { type: 'string' },
            status: { type: 'string' }
        },
        handler: async (params) => {
            return await creditClient.getApplications(params);
        }
    },
    
    credit_get_application: {
        description: 'Get specific credit application details including bids',
        parameters: {
            application_id: { type: 'string', required: true }
        },
        handler: async (params) => {
            return await creditClient.getApplication(params.application_id);
        }
    },
    
    credit_update_application_status: {
        description: 'Update the status of a credit application',
        parameters: {
            application_id: { type: 'string', required: true },
            status: { type: 'string', required: true },
            notes: { type: 'string' }
        },
        handler: async (params) => {
            return await creditClient.updateApplicationStatus(
                params.application_id,
                params.status,
                params.notes
            );
        }
    },
    
    // Provider Management Tools
    credit_register_provider: {
        description: 'Register a new credit provider in the platform',
        parameters: {
            provider_code: { type: 'string', required: true },
            company_name: { type: 'string', required: true },
            registration_number: { type: 'string', required: true },
            contact_email: { type: 'string', required: true },
            contact_phone: { type: 'string', required: true },
            address: { type: 'object', required: true },
            minimum_loan_amount: { type: 'number', required: true },
            maximum_loan_amount: { type: 'number', required: true },
            interest_rate_range: { type: 'object', required: true },
            processing_fee_percentage: { type: 'number', required: true },
            webhook_url: { type: 'string' },
            api_endpoint: { type: 'string' }
        },
        handler: async (params) => {
            return await creditClient.registerProvider(params);
        }
    },
    
    credit_get_providers: {
        description: 'Get list of registered credit providers',
        parameters: {
            status: { type: 'string' },
            active_only: { type: 'boolean' }
        },
        handler: async (params) => {
            return await creditClient.getProviders(params);
        }
    },
    
    credit_submit_provider_bid: {
        description: 'Submit a credit provider bid for an application',
        parameters: {
            application_id: { type: 'string', required: true },
            provider_id: { type: 'string', required: true },
            offered_amount: { type: 'number', required: true },
            interest_rate: { type: 'number', required: true },
            loan_term_months: { type: 'number', required: true },
            processing_fee: { type: 'number', required: true },
            special_conditions: { type: 'object' },
            valid_until: { type: 'string', required: true }
        },
        handler: async (params) => {
            // Calculate repayment details
            const principal = params.offered_amount;
            const monthlyRate = params.interest_rate / 12 / 100;
            const months = params.loan_term_months;
            
            const monthlyPayment = principal * 
                (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                (Math.pow(1 + monthlyRate, months) - 1);
            
            const totalRepayment = monthlyPayment * months;
            
            return await creditClient.submitProviderBid({
                ...params,
                total_repayment: totalRepayment,
                monthly_repayment: monthlyPayment
            });
        }
    },
    
    // Transaction Processing
    credit_process_transaction: {
        description: 'Process a credit transaction (disbursement or repayment)',
        parameters: {
            bid_id: { type: 'string', required: true },
            application_id: { type: 'string', required: true },
            provider_id: { type: 'string', required: true },
            transaction_type: { type: 'string', required: true },
            amount: { type: 'number', required: true },
            currency: { type: 'string', default: 'NGN' },
            payment_method: { type: 'string', required: true },
            reference_number: { type: 'string', required: true },
            metadata: { type: 'object' }
        },
        handler: async (params) => {
            return await creditClient.processTransaction(params);
        }
    },
    
    // Credit Scoring & Analytics
    credit_perform_credit_check: {
        description: 'Perform credit score check for a user or business',
        parameters: {
            user_id: { type: 'string' },
            business_id: { type: 'string' }
        },
        handler: async (params) => {
            return await creditClient.performCreditCheck(
                params.user_id,
                params.business_id
            );
        }
    },
    
    credit_get_analytics: {
        description: 'Get credit platform analytics for a date range',
        parameters: {
            start_date: { type: 'string', required: true },
            end_date: { type: 'string', required: true }
        },
        handler: async (params) => {
            return await creditClient.getAnalytics({
                start: params.start_date,
                end: params.end_date
            });
        }
    },
    
    credit_provider_performance: {
        description: 'Get performance metrics for a specific credit provider',
        parameters: {
            provider_id: { type: 'string', required: true }
        },
        handler: async (params) => {
            return await creditClient.getProviderPerformance(params.provider_id);
        }
    },
    
    // Health Check
    credit_health_check: {
        description: 'Check health status of the credit service',
        parameters: {},
        handler: async () => {
            return await creditClient.healthCheck();
        }
    }
};
