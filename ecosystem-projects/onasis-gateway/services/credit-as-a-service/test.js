const CreditAsAServiceClient = require('./client');

async function testCreditService() {
    const client = new CreditAsAServiceClient();
    
    console.log('Testing Credit-as-a-Service...');
    
    try {
        // Test health check
        const health = await client.healthCheck();
        console.log('Health check:', health);
        
        // Test application submission
        const application = await client.submitApplication({
            user_id: 'test-user-123',
            business_id: 'test-business-456',
            amount_requested: 1000000,
            currency: 'NGN',
            purpose: 'Working capital',
            loan_term_months: 12,
            metadata: {
                business_type: 'retail',
                annual_revenue: 50000000
            }
        });
        console.log('Application submitted:', application);
        
        // Test provider registration
        const provider = await client.registerProvider({
            provider_code: 'TEST_PROVIDER',
            company_name: 'Test Credit Provider Ltd',
            registration_number: 'RC123456',
            contact_email: 'test@provider.com',
            contact_phone: '+2341234567890',
            address: {
                street: '123 Test Street',
                city: 'Lagos',
                state: 'Lagos',
                country: 'Nigeria'
            },
            minimum_loan_amount: 100000,
            maximum_loan_amount: 10000000,
            interest_rate_range: {
                min: 15,
                max: 25
            },
            processing_fee_percentage: 2.5,
            webhook_url: 'https://test-provider.com/webhooks'
        });
        console.log('Provider registered:', provider);
        
        console.log('All tests passed!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run tests if called directly
if (require.main === module) {
    testCreditService();
}

module.exports = testCreditService;
