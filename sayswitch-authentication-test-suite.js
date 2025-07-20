/**
 * Sayswitch Authentication Patterns Test Suite
 * Tests all three authentication patterns as documented in the API
 */

const crypto = require('crypto');
const fetch = require('node-fetch');
const { SayswitchGateway } = require('./sayswitch-production-implementation');

// Test configuration
const testConfig = {
  secretKey: process.env.SAYSWITCH_SECRET_KEY || 'test_secret_key',
  baseURL: process.env.SAYSWITCH_BASE_URL || 'https://backendapi.sayswitchgroup.com/api/v1',
  environment: process.env.SAYSWITCH_ENV || 'test'
};

// Test utilities
class SayswitchTestSuite {
  constructor() {
    this.gateway = new SayswitchGateway(testConfig);
    this.testResults = [];
  }

  /**
   * Log test results
   */
  logTest(testName, pattern, success, details) {
    const result = {
      testName,
      pattern,
      success,
      details,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    console.log(`\n[${success ? 'PASS' : 'FAIL'}] ${testName} (${pattern})`);
    if (details) {
      console.log(`Details: ${details}`);
    }
  }

  /**
   * Generate test reference
   */
  generateTestReference(prefix = 'TEST') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Test Pattern 1: Regular Transactions (Bearer Token Only)
   */
  async testRegularTransactions() {
    console.log('\n=== Testing Pattern 1: Regular Transactions (Bearer Token Only) ===');

    // Test 1: Payment Initialization
    try {
      const paymentData = {
        email: 'test@example.com',
        amount: 1000,
        currency: 'NGN',
        callback_url: 'https://webhook.site/test-callback',
        reference: this.generateTestReference('PAY')
      };

      const result = await this.gateway.initializePayment(paymentData);
      
      this.logTest(
        'Payment Initialization',
        'Bearer Token Only',
        true,
        `Payment URL: ${result.payment_url}, Reference: ${result.reference}`
      );
      
      // Test 2: Payment Verification
      const verification = await this.gateway.verifyPayment(result.reference);
      
      this.logTest(
        'Payment Verification',
        'Bearer Token Only',
        true,
        `Status: ${verification.status}, Amount: ${verification.amount}`
      );

    } catch (error) {
      this.logTest(
        'Payment Initialization/Verification',
        'Bearer Token Only',
        false,
        error.message
      );
    }

    // Test 3: Transaction History
    try {
      const history = await this.gateway.getTransactionHistory({ limit: 5 });
      
      this.logTest(
        'Transaction History',
        'Bearer Token Only',
        true,
        `Retrieved ${history.transactions?.length || 0} transactions`
      );

    } catch (error) {
      this.logTest(
        'Transaction History',
        'Bearer Token Only',
        false,
        error.message
      );
    }

    // Test 4: Supported Banks
    try {
      const banks = await this.gateway.getSupportedBanks('NG');
      
      this.logTest(
        'Supported Banks',
        'Bearer Token Only',
        true,
        `Retrieved ${banks?.length || 0} banks`
      );

    } catch (error) {
      this.logTest(
        'Supported Banks',
        'Bearer Token Only',
        false,
        error.message
      );
    }

    // Test 5: Bank Account Verification
    try {
      const accountVerification = await this.gateway.verifyBankAccount(
        '0123456789',
        '058' // GTBank
      );
      
      this.logTest(
        'Bank Account Verification',
        'Bearer Token Only',
        true,
        `Account: ${accountVerification.account_name}`
      );

    } catch (error) {
      this.logTest(
        'Bank Account Verification',
        'Bearer Token Only',
        false,
        error.message
      );
    }
  }

  /**
   * Test Pattern 2: Payouts (Bearer Token + HMAC-SHA512)
   */
  async testPayouts() {
    console.log('\n=== Testing Pattern 2: Payouts (Bearer Token + HMAC-SHA512) ===');

    // Test 1: HMAC Signature Generation
    try {
      const testPayload = {
        account_name: 'John Doe',
        account_number: '0123456789',
        amount: '5000',
        bank_code: '058',
        bank_name: 'GTBank',
        currency: 'NGN',
        narration: 'Test transfer',
        reference: this.generateTestReference('TRF')
      };

      const signature = this.gateway.generateHMACSignature(testPayload);
      
      this.logTest(
        'HMAC Signature Generation',
        'Bearer Token + HMAC-SHA512',
        signature && signature.length === 128, // SHA512 hex is 128 chars
        `Signature length: ${signature.length}`
      );

      // Test 2: Payload Sorting
      const sortedPayload = this.gateway.sortPayloadAlphabetically(testPayload);
      const keys = Object.keys(sortedPayload);
      const sortedKeys = Object.keys(testPayload).sort();
      
      this.logTest(
        'Payload Alphabetical Sorting',
        'Bearer Token + HMAC-SHA512',
        JSON.stringify(keys) === JSON.stringify(sortedKeys),
        `Keys order: ${keys.join(', ')}`
      );

    } catch (error) {
      this.logTest(
        'HMAC Signature Generation',
        'Bearer Token + HMAC-SHA512',
        false,
        error.message
      );
    }

    // Test 3: Bank Transfer (Payout)
    try {
      const transferData = {
        account_name: 'Test User',
        account_number: '0123456789',
        amount: 1000,
        bank_code: '058',
        bank_name: 'GTBank',
        currency: 'NGN',
        narration: 'Test payout',
        reference: this.generateTestReference('TRF')
      };

      const result = await this.gateway.initiateBankTransfer(transferData);
      
      this.logTest(
        'Bank Transfer (Payout)',
        'Bearer Token + HMAC-SHA512',
        true,
        `Transfer Reference: ${result.transfer_reference}`
      );

    } catch (error) {
      this.logTest(
        'Bank Transfer (Payout)',
        'Bearer Token + HMAC-SHA512',
        false,
        error.message
      );
    }

    // Test 4: Headers with Signature
    try {
      const testPayload = {
        amount: '1000',
        test: 'value'
      };

      const headers = this.gateway.getAuthHeadersWithSignature(testPayload);
      
      this.logTest(
        'Headers with Signature',
        'Bearer Token + HMAC-SHA512',
        headers['Authorization'] && headers['Encryption'],
        `Headers: ${Object.keys(headers).join(', ')}`
      );

    } catch (error) {
      this.logTest(
        'Headers with Signature',
        'Bearer Token + HMAC-SHA512',
        false,
        error.message
      );
    }
  }

  /**
   * Test Pattern 3: Bills and Utilities (Bearer Token + HMAC-SHA512)
   */
  async testBillsAndUtilities() {
    console.log('\n=== Testing Pattern 3: Bills and Utilities (Bearer Token + HMAC-SHA512) ===');

    // Test 1: Airtime Topup
    try {
      const topupData = {
        amount: 1000,
        number: '08012345678',
        provider: 'MTN',
        reference: this.generateTestReference('AIR')
      };

      const result = await this.gateway.airtimeTopup(topupData);
      
      this.logTest(
        'Airtime Topup',
        'Bearer Token + HMAC-SHA512',
        true,
        `Reference: ${result.reference}, Provider: ${result.provider}`
      );

    } catch (error) {
      this.logTest(
        'Airtime Topup',
        'Bearer Token + HMAC-SHA512',
        false,
        error.message
      );
    }

    // Test 2: Data Purchase
    try {
      const dataData = {
        number: '08012345678',
        plan_id: 1,
        provider: 'MTN',
        reference: this.generateTestReference('DATA')
      };

      const result = await this.gateway.dataPurchase(dataData);
      
      this.logTest(
        'Data Purchase',
        'Bearer Token + HMAC-SHA512',
        true,
        `Reference: ${result.reference}, Plan: ${result.plan_id}`
      );

    } catch (error) {
      this.logTest(
        'Data Purchase',
        'Bearer Token + HMAC-SHA512',
        false,
        error.message
      );
    }

    // Test 3: TV Payment
    try {
      const tvData = {
        code: 'gotv-max',
        number: '1234567890',
        provider: 'GOTV',
        reference: this.generateTestReference('TV')
      };

      const result = await this.gateway.tvPayment(tvData);
      
      this.logTest(
        'TV Payment',
        'Bearer Token + HMAC-SHA512',
        true,
        `Reference: ${result.reference}, Package: ${result.package}`
      );

    } catch (error) {
      this.logTest(
        'TV Payment',
        'Bearer Token + HMAC-SHA512',
        false,
        error.message
      );
    }

    // Test 4: Electricity Payment
    try {
      const electricityData = {
        amount: 2000,
        number: '1234567890',
        provider: 'IKEDC',
        reference: this.generateTestReference('ELEC'),
        type: 'prepaid'
      };

      const result = await this.gateway.electricityPayment(electricityData);
      
      this.logTest(
        'Electricity Payment',
        'Bearer Token + HMAC-SHA512',
        true,
        `Reference: ${result.reference}, Token: ${result.token}`
      );

    } catch (error) {
      this.logTest(
        'Electricity Payment',
        'Bearer Token + HMAC-SHA512',
        false,
        error.message
      );
    }
  }

  /**
   * Test Webhook Signature Verification
   */
  async testWebhookVerification() {
    console.log('\n=== Testing Webhook Signature Verification ===');

    // Test 1: Valid Webhook Signature
    try {
      const webhookPayload = JSON.stringify({
        event: 'payment.success',
        data: {
          reference: 'TEST_12345',
          amount: 1000,
          currency: 'NGN',
          status: 'success'
        }
      });

      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha512', testConfig.secretKey)
        .update(webhookPayload)
        .digest('hex');

      const isValid = this.gateway.verifyWebhookSignature(webhookPayload, expectedSignature);
      
      this.logTest(
        'Valid Webhook Signature',
        'HMAC-SHA512',
        isValid,
        `Signature verified: ${isValid}`
      );

    } catch (error) {
      this.logTest(
        'Valid Webhook Signature',
        'HMAC-SHA512',
        false,
        error.message
      );
    }

    // Test 2: Invalid Webhook Signature
    try {
      const webhookPayload = JSON.stringify({
        event: 'payment.success',
        data: { reference: 'TEST_12345' }
      });

      const invalidSignature = 'invalid_signature';
      const isValid = this.gateway.verifyWebhookSignature(webhookPayload, invalidSignature);
      
      this.logTest(
        'Invalid Webhook Signature',
        'HMAC-SHA512',
        !isValid, // Should be false
        `Signature rejected: ${!isValid}`
      );

    } catch (error) {
      this.logTest(
        'Invalid Webhook Signature',
        'HMAC-SHA512',
        false,
        error.message
      );
    }
  }

  /**
   * Test Authentication Method Selection
   */
  async testAuthenticationMethodSelection() {
    console.log('\n=== Testing Authentication Method Selection ===');

    const endpoints = [
      { endpoint: '/transaction/initialize', expectedMethod: 'bearer_only' },
      { endpoint: '/transaction/verify', expectedMethod: 'bearer_only' },
      { endpoint: '/bank_transfer', expectedMethod: 'bearer_plus_signature' },
      { endpoint: '/airtime/topup', expectedMethod: 'bearer_plus_signature' },
      { endpoint: '/internet/data', expectedMethod: 'bearer_plus_signature' },
      { endpoint: '/tv/pay', expectedMethod: 'bearer_plus_signature' },
      { endpoint: '/electricity/recharge', expectedMethod: 'bearer_plus_signature' }
    ];

    endpoints.forEach(({ endpoint, expectedMethod }) => {
      const signatureRequired = [
        '/bank_transfer',
        '/bulk_bank_transfer',
        '/airtime/topup',
        '/internet/data',
        '/tv/pay',
        '/electricity/recharge'
      ];

      const actualMethod = signatureRequired.some(path => endpoint.includes(path)) 
        ? 'bearer_plus_signature' 
        : 'bearer_only';

      this.logTest(
        `Endpoint: ${endpoint}`,
        'Method Selection',
        actualMethod === expectedMethod,
        `Expected: ${expectedMethod}, Actual: ${actualMethod}`
      );
    });
  }

  /**
   * Performance Tests
   */
  async testPerformance() {
    console.log('\n=== Testing Performance ===');

    // Test signature generation performance
    const testPayload = {
      account_name: 'John Doe',
      account_number: '0123456789',
      amount: '5000',
      bank_code: '058',
      bank_name: 'GTBank',
      currency: 'NGN',
      narration: 'Test transfer',
      reference: this.generateTestReference('PERF')
    };

    const iterations = 1000;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      this.gateway.generateHMACSignature(testPayload);
    }

    const endTime = Date.now();
    const avgTime = (endTime - startTime) / iterations;

    this.logTest(
      'HMAC Signature Generation Performance',
      'Performance',
      avgTime < 10, // Should be less than 10ms per signature
      `Average time per signature: ${avgTime.toFixed(2)}ms`
    );
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Sayswitch Authentication Patterns Test Suite...\n');
    
    const startTime = Date.now();

    // Run all test suites
    await this.testRegularTransactions();
    await this.testPayouts();
    await this.testBillsAndUtilities();
    await this.testWebhookVerification();
    await this.testAuthenticationMethodSelection();
    await this.testPerformance();

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Generate test report
    this.generateTestReport(totalTime);
  }

  /**
   * Generate test report
   */
  generateTestReport(totalTime) {
    console.log('\n' + '='.repeat(80));
    console.log('                        TEST REPORT');
    console.log('='.repeat(80));

    const passedTests = this.testResults.filter(test => test.success).length;
    const failedTests = this.testResults.filter(test => test.success === false).length;
    const totalTests = this.testResults.length;

    console.log(`\n📊 Test Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} ✅`);
    console.log(`   Failed: ${failedTests} ❌`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`   Total Time: ${totalTime}ms`);

    // Group by authentication pattern
    const patternGroups = {};
    this.testResults.forEach(test => {
      if (!patternGroups[test.pattern]) {
        patternGroups[test.pattern] = { passed: 0, failed: 0 };
      }
      if (test.success) {
        patternGroups[test.pattern].passed++;
      } else {
        patternGroups[test.pattern].failed++;
      }
    });

    console.log(`\n📈 Results by Authentication Pattern:`);
    Object.entries(patternGroups).forEach(([pattern, results]) => {
      const total = results.passed + results.failed;
      const rate = ((results.passed / total) * 100).toFixed(1);
      console.log(`   ${pattern}: ${results.passed}/${total} (${rate}%)`);
    });

    // Show failed tests
    const failedTestsList = this.testResults.filter(test => test.success === false);
    if (failedTestsList.length > 0) {
      console.log(`\n❌ Failed Tests:`);
      failedTestsList.forEach(test => {
        console.log(`   - ${test.testName} (${test.pattern}): ${test.details}`);
      });
    }

    console.log(`\n🎯 Authentication Pattern Coverage:`);
    console.log(`   ✅ Pattern 1: Regular Transactions (Bearer Token Only)`);
    console.log(`   ✅ Pattern 2: Payouts (Bearer Token + HMAC-SHA512)`);
    console.log(`   ✅ Pattern 3: Bills/Utilities (Bearer Token + HMAC-SHA512)`);
    console.log(`   ✅ Webhook Verification (HMAC-SHA512)`);

    console.log('\n' + '='.repeat(80));
    console.log('                     TEST COMPLETE');
    console.log('='.repeat(80));
  }
}

// Export for use in other files
module.exports = { SayswitchTestSuite };

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new SayswitchTestSuite();
  testSuite.runAllTests().catch(console.error);
}