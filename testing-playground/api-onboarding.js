// The Fixer Initiative - API Testing Playground
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class APITestingPlayground {
  constructor() {
    this.app = express();
    this.services = new Map();
    this.testResults = new Map();
    this.setupExpress();
    this.loadTestServices();
  }

  setupExpress() {
    this.app.use(express.json());
    this.app.use(express.static('./testing-playground/dashboard'));

    // API endpoints
    this.app.get('/api/services', (req, res) => {
      res.json(Array.from(this.services.entries()));
    });

    this.app.post('/api/test-service', async (req, res) => {
      const { serviceConfig } = req.body;
      try {
        const results = await this.testService(serviceConfig);
        res.json(results);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/onboard-service', async (req, res) => {
      const { serviceConfig } = req.body;
      try {
        await this.onboardService(serviceConfig);
        res.json({ success: true, message: 'Service onboarded successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/test-results/:serviceId', (req, res) => {
      const results = this.testResults.get(req.params.serviceId);
      res.json(results || { error: 'No test results found' });
    });

    // Quick test endpoints
    this.app.get('/api/quick-test/:url', async (req, res) => {
      const url = decodeURIComponent(req.params.url);
      try {
        const result = await this.quickHealthCheck(url);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  async loadTestServices() {
    // Load existing services for reference
    try {
      const servicesConfig = require('../modules/services/index.json');
      for (const [id, config] of Object.entries(servicesConfig.services)) {
        this.services.set(id, { ...config, status: 'existing' });
      }
    } catch (error) {
      console.log('No existing services found, starting fresh');
    }
  }

  async testService(serviceConfig) {
    const testId = `test-${Date.now()}`;
    const results = {
      id: testId,
      service: serviceConfig,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    console.log(`🧪 Testing service: ${serviceConfig.name}`);

    // Test 1: Basic connectivity
    results.tests.connectivity = await this.testConnectivity(serviceConfig);
    
    // Test 2: Health endpoint
    results.tests.health = await this.testHealthEndpoint(serviceConfig);
    
    // Test 3: API endpoints
    results.tests.endpoints = await this.testAPIEndpoints(serviceConfig);
    
    // Test 4: Response format
    results.tests.responseFormat = await this.testResponseFormat(serviceConfig);
    
    // Test 5: Performance
    results.tests.performance = await this.testPerformance(serviceConfig);

    // Calculate overall score
    results.overallScore = this.calculateScore(results.tests);
    results.recommendation = this.getRecommendation(results);

    // Store results
    this.testResults.set(testId, results);
    
    return results;
  }

  async testConnectivity(service) {
    const test = { name: 'Connectivity', status: 'testing', details: [] };
    
    try {
      const endpoints = service.endpoints || [service.url];
      
      for (const endpoint of endpoints) {
        if (!endpoint) continue;
        
        const startTime = Date.now();
        const response = await axios.get(endpoint, { 
          timeout: 10000,
          validateStatus: () => true // Accept any status
        });
        const responseTime = Date.now() - startTime;

        test.details.push({
          endpoint,
          reachable: true,
          statusCode: response.status,
          responseTime,
          headers: Object.keys(response.headers)
        });
      }
      
      test.status = 'passed';
      test.score = 100;
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      test.score = 0;
    }
    
    return test;
  }

  async testHealthEndpoint(service) {
    const test = { name: 'Health Endpoint', status: 'testing', details: [] };
    
    try {
      const endpoints = service.endpoints || [service.url];
      
      for (const endpoint of endpoints) {
        const healthUrls = [
          `${endpoint}/health`,
          `${endpoint}/api/health`,
          `${endpoint}/api/v1/health`,
          `${endpoint}/healthz`,
          `${endpoint}/_health`
        ];

        for (const healthUrl of healthUrls) {
          try {
            const response = await axios.get(healthUrl, { timeout: 5000 });
            
            test.details.push({
              healthUrl,
              available: true,
              statusCode: response.status,
              responseData: response.data,
              contentType: response.headers['content-type']
            });
            
            test.status = 'passed';
            test.score = 100;
            return test; // Found working health endpoint
          } catch (error) {
            // Try next health URL
          }
        }
      }
      
      test.status = 'warning';
      test.message = 'No standard health endpoint found';
      test.score = 50;
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      test.score = 0;
    }
    
    return test;
  }

  async testAPIEndpoints(service) {
    const test = { name: 'API Endpoints', status: 'testing', details: [] };
    
    try {
      const endpoints = service.endpoints || [service.url];
      
      for (const endpoint of endpoints) {
        // Test common API paths
        const apiPaths = [
          '/',
          '/api',
          '/api/v1',
          '/docs',
          '/swagger',
          '/openapi.json'
        ];

        for (const path of apiPaths) {
          try {
            const url = `${endpoint}${path}`;
            const response = await axios.get(url, { 
              timeout: 5000,
              validateStatus: (status) => status < 500
            });
            
            test.details.push({
              path,
              url,
              statusCode: response.status,
              contentType: response.headers['content-type'],
              hasData: !!response.data,
              dataSize: JSON.stringify(response.data || '').length
            });
          } catch (error) {
            // Path not available, continue
          }
        }
      }
      
      test.status = test.details.length > 0 ? 'passed' : 'warning';
      test.score = Math.min(100, test.details.length * 20);
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      test.score = 0;
    }
    
    return test;
  }

  async testResponseFormat(service) {
    const test = { name: 'Response Format', status: 'testing', details: [] };
    
    try {
      const endpoints = service.endpoints || [service.url];
      
      for (const endpoint of endpoints) {
        const response = await axios.get(endpoint, { 
          timeout: 5000,
          validateStatus: () => true
        });

        const analysis = {
          contentType: response.headers['content-type'],
          isJSON: response.headers['content-type']?.includes('application/json'),
          hasData: !!response.data,
          dataStructure: this.analyzeDataStructure(response.data)
        };

        test.details.push(analysis);
      }
      
      test.status = 'passed';
      test.score = 85;
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      test.score = 0;
    }
    
    return test;
  }

  async testPerformance(service) {
    const test = { name: 'Performance', status: 'testing', details: [] };
    
    try {
      const endpoints = service.endpoints || [service.url];
      const performanceResults = [];
      
      // Run 3 performance tests per endpoint
      for (const endpoint of endpoints) {
        for (let i = 0; i < 3; i++) {
          const startTime = Date.now();
          await axios.get(endpoint, { timeout: 10000, validateStatus: () => true });
          const responseTime = Date.now() - startTime;
          performanceResults.push(responseTime);
        }
      }
      
      const avgResponseTime = performanceResults.reduce((a, b) => a + b, 0) / performanceResults.length;
      const minTime = Math.min(...performanceResults);
      const maxTime = Math.max(...performanceResults);
      
      test.details = {
        averageResponseTime: avgResponseTime,
        minResponseTime: minTime,
        maxResponseTime: maxTime,
        tests: performanceResults.length
      };
      
      // Score based on response time
      if (avgResponseTime < 500) test.score = 100;
      else if (avgResponseTime < 1000) test.score = 80;
      else if (avgResponseTime < 2000) test.score = 60;
      else if (avgResponseTime < 5000) test.score = 40;
      else test.score = 20;
      
      test.status = 'passed';
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      test.score = 0;
    }
    
    return test;
  }

  analyzeDataStructure(data) {
    if (!data) return 'no-data';
    if (typeof data === 'string') return 'string';
    if (Array.isArray(data)) return 'array';
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      return `object-${keys.length}-keys`;
    }
    return typeof data;
  }

  calculateScore(tests) {
    const scores = Object.values(tests).map(test => test.score || 0);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  getRecommendation(results) {
    const score = results.overallScore;
    
    if (score >= 90) {
      return {
        level: 'excellent',
        message: 'Service is ready for production onboarding',
        actions: ['Add to monitoring dashboard', 'Configure alerts', 'Set up SLA monitoring']
      };
    } else if (score >= 70) {
      return {
        level: 'good',
        message: 'Service is mostly ready with minor improvements needed',
        actions: ['Add health endpoint', 'Optimize response times', 'Add API documentation']
      };
    } else if (score >= 50) {
      return {
        level: 'needs-work',
        message: 'Service needs improvements before onboarding',
        actions: ['Fix connectivity issues', 'Add proper health checks', 'Improve error handling']
      };
    } else {
      return {
        level: 'not-ready',
        message: 'Service requires significant work before onboarding',
        actions: ['Fix basic connectivity', 'Implement health endpoints', 'Review service architecture']
      };
    }
  }

  async quickHealthCheck(url) {
    try {
      const startTime = Date.now();
      const response = await axios.get(url, { 
        timeout: 5000,
        validateStatus: () => true
      });
      const responseTime = Date.now() - startTime;

      return {
        url,
        reachable: true,
        statusCode: response.status,
        responseTime,
        contentType: response.headers['content-type'],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        url,
        reachable: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async onboardService(serviceConfig) {
    // Validate service first
    const testResults = await this.testService(serviceConfig);
    
    if (testResults.overallScore < 50) {
      throw new Error(`Service score too low (${testResults.overallScore}/100). Please improve service before onboarding.`);
    }

    // Determine appropriate module based on service type
    let moduleFile;
    if (serviceConfig.type === 'backend' || serviceConfig.type === 'api') {
      moduleFile = '../modules/services/index.json';
    } else if (serviceConfig.type === 'frontend' || serviceConfig.type === 'app') {
      moduleFile = '../modules/products/index.json';
    } else if (serviceConfig.type === 'tool' || serviceConfig.type === 'cli') {
      moduleFile = '../modules/tools/index.json';
    } else {
      moduleFile = '../modules/services/index.json'; // Default
    }

    // Load existing config
    let config = {};
    try {
      config = require(moduleFile);
    } catch (error) {
      config = { services: {} };
    }

    // Add new service
    const serviceId = serviceConfig.name.toLowerCase().replace(/\s+/g, '-');
    const targetKey = moduleFile.includes('services') ? 'services' : 
                     moduleFile.includes('products') ? 'products' : 'tools';
    
    if (!config[targetKey]) {
      config[targetKey] = {};
    }
    
    config[targetKey][serviceId] = {
      ...serviceConfig,
      onboardedAt: new Date().toISOString(),
      testScore: testResults.overallScore,
      status: 'active'
    };

    // Write back to file
    fs.writeFileSync(
      path.resolve(__dirname, moduleFile), 
      JSON.stringify(config, null, 2)
    );

    console.log(`✅ Service '${serviceConfig.name}' onboarded successfully`);
    return { serviceId, testResults };
  }

  start(port = 3006) {
    this.app.listen(port, () => {
      console.log(`🧪 API Testing Playground running on port ${port}`);
      console.log(`🌐 Dashboard: http://localhost:${port}`);
      console.log(`🔧 Quick test: http://localhost:${port}/api/quick-test/[URL]`);
    });
  }
}

module.exports = APITestingPlayground;

if (require.main === module) {
  const playground = new APITestingPlayground();
  playground.start();
}