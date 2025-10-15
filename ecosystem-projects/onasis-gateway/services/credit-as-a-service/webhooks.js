const express = require('express');
const router = express.Router();
const CreditAsAServiceClient = require('./client');

const caasClient = new CreditAsAServiceClient();

// Provider webhook endpoint
router.post('/webhooks/credit/provider/:providerId', async (req, res) => {
    try {
        const { providerId } = req.params;
        const { event, data } = req.body;
        
        // Verify provider exists
        const providers = await caasClient.getProviders({ provider_id: providerId });
        if (providers.length === 0) {
            return res.status(404).json({ error: 'Provider not found' });
        }
        
        // Handle different webhook events
        switch (event) {
            case 'bid_accepted':
                // Update bid status
                await caasClient.db.query(
                    'UPDATE credit.bids SET status = $1 WHERE id = $2',
                    ['accepted', data.bid_id]
                );
                break;
                
            case 'disbursement_ready':
                // Create disbursement transaction
                await caasClient.processTransaction({
                    bid_id: data.bid_id,
                    application_id: data.application_id,
                    provider_id: providerId,
                    transaction_type: 'disbursement',
                    amount: data.amount,
                    payment_method: data.payment_method,
                    reference_number: data.reference
                });
                break;
                
            case 'payment_received':
                // Record repayment
                await caasClient.processTransaction({
                    bid_id: data.bid_id,
                    application_id: data.application_id,
                    provider_id: providerId,
                    transaction_type: 'repayment',
                    amount: data.amount,
                    payment_method: data.payment_method,
                    reference_number: data.reference
                });
                break;
                
            default:
                console.log(`Unhandled webhook event: ${event}`);
        }
        
        res.json({ status: 'received' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Application status webhook (for external systems)
router.post('/webhooks/credit/application/:applicationId', async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status, notes } = req.body;
        
        // Update application status
        await caasClient.updateApplicationStatus(applicationId, status, notes);
        
        res.json({ status: 'updated' });
    } catch (error) {
        console.error('Application webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
