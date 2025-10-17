// The Fixer Initiative - Monitoring Cockpit
const express = require('express');
const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

class MonitoringCockpit {
  constructor() {
    this.app = express();
    this.services = new Map();
    this.metrics = new Map();
    this.alerts = [];
    this.clients = new Set();
    
    this.setupExpress();
    this.setupWebSocket();
    this.loadServiceConfigs();
    this.startMonitoring();
  }

  setupExpress() {
    this.app.use(express.static('./control-room/dashboard'));
    this.app.use(express.json());

    // API endpoints
    this.app.get('/api/services', (req, res) => {
      res.json(Array.from(this.services.entries()));
    });

    this.app.get('/api/metrics', (req, res) => {
      res.json({
        services: Array.from(this.services.entries()),
        metrics: Array.from(this.metrics.entries()),
        alerts: this.alerts.slice(-10),
        summary: this.getSummary()
      });
    });

    this.app.get('/api/health', (req, res) => {
      const health = {};
      for (const [id, service] of this.services) {
        health[id] = service.status;
      }
      res.json(health);
    });

    this.app.post('/api/restart-service', async (req, res) => {
      const { serviceId } = req.body;
      try {
        await this.restartService(serviceId);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupWebSocket() {
    this.wss = new WebSocket.Server({ port: 8080 });
    
    this.wss.on('connection', (ws) => {
      console.log('New monitoring client connected');
      this.clients.add(ws);
      
      // Send initial data
      ws.send(JSON.stringify({
        type: 'initial',
        data: {
          services: Array.from(this.services.entries()),
          metrics: Array.from(this.metrics.entries())
        }
      }));

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async loadServiceConfigs() {
    try {
      // Load from modules
      const servicesConfig = require('../modules/services/index.json');
      const toolsConfig = require('../modules/tools/index.json');
      const productsConfig = require('../modules/products/index.json');
      const enterpriseConfig = require('../modules/enterprise/index.json');

      // Initialize services
      for (const [id, config] of Object.entries(servicesConfig.services)) {
        this.services.set(id, {
          ...config,
          id,
          category: 'service',
          status: 'unknown',
          lastCheck: null,
          responseTime: null,
          uptime: 0
        });
      }

      for (const [id, config] of Object.entries(productsConfig.products)) {
        this.services.set(id, {
          ...config,
          id,
          category: 'product',
          status: 'unknown',
          lastCheck: null,
          responseTime: null,
          uptime: 0
        });
      }

      // Track enterprise clients separately
      this.enterpriseClients = enterpriseConfig.enterprise_clients;

    } catch (error) {
      console.error('Error loading service configs:', error);
    }
  }

  async startMonitoring() {
    console.log('🎛️ Starting monitoring cockpit...');
    
    // Start health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds

    // Start metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 60000); // Every minute

    // Start financial tracking
    this.financialInterval = setInterval(() => {
      this.trackFinancials();
    }, 300000); // Every 5 minutes

    // Initial checks
    this.performHealthChecks();
    this.collectMetrics();
  }

  async performHealthChecks() {
    const checks = [];
    
    for (const [id, service] of this.services) {
      if (service.endpoints || service.url) {
        checks.push(this.checkServiceHealth(id, service));
      }
    }

    await Promise.allSettled(checks);
    
    // Broadcast updates
    this.broadcast({
      type: 'health_update',
      data: Array.from(this.services.entries())
    });
  }

  async checkServiceHealth(id, service) {
    const urls = service.endpoints || [service.url];
    const startTime = Date.now();

    try {
      for (const url of urls) {
        if (!url) continue;
        
        const healthUrl = url.endsWith('/health') ? url : `${url}/health`;
        const response = await axios.get(healthUrl, { 
          timeout: 5000,
          validateStatus: () => true // Accept any status code
        });

        const responseTime = Date.now() - startTime;
        const isHealthy = response.status >= 200 && response.status < 400;

        // Update service status
        const updatedService = {
          ...service,
          status: isHealthy ? 'healthy' : 'unhealthy',
          lastCheck: new Date().toISOString(),
          responseTime,
          statusCode: response.status,
          uptime: isHealthy ? service.uptime + 1 : 0
        };

        this.services.set(id, updatedService);

        // Create alert if status changed
        if (service.status !== updatedService.status) {
          this.createAlert(id, updatedService.status, `${service.name} is now ${updatedService.status}`);
        }

        break; // Use first successful endpoint
      }
    } catch (error) {
      const updatedService = {
        ...service,
        status: 'offline',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error.message,
        uptime: 0
      };

      this.services.set(id, updatedService);

      if (service.status !== 'offline') {
        this.createAlert(id, 'offline', `${service.name} is offline: ${error.message}`);
      }
    }
  }

  async collectMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      services: {},
      totals: {
        healthy: 0,
        unhealthy: 0,
        offline: 0,
        total: this.services.size
      }
    };

    // Collect service metrics
    for (const [id, service] of this.services) {
      metrics.services[id] = {
        status: service.status,
        responseTime: service.responseTime,
        uptime: service.uptime,
        category: service.category
      };

      // Count totals
      if (service.status === 'healthy') metrics.totals.healthy++;
      else if (service.status === 'unhealthy') metrics.totals.unhealthy++;
      else metrics.totals.offline++;
    }

    // Calculate availability
    metrics.availability = metrics.totals.total > 0 
      ? (metrics.totals.healthy / metrics.totals.total * 100).toFixed(2)
      : 0;

    this.metrics.set(Date.now(), metrics);

    // Keep only last 100 metrics
    if (this.metrics.size > 100) {
      const keys = Array.from(this.metrics.keys()).sort();
      this.metrics.delete(keys[0]);
    }

    // Broadcast metrics update
    this.broadcast({
      type: 'metrics_update',
      data: metrics
    });
  }

  async trackFinancials() {
    try {
      const financial = {
        timestamp: new Date().toISOString(),
        revenue: {
          monthly: 0,
          services: {},
          enterprise: {}
        },
        costs: {
          infrastructure: 50, // VPS cost
          apis: 0,
          total: 50
        }
      };

      // Calculate service revenue
      for (const [id, service] of this.services) {
        if (service.category === 'product' && service.pricing) {
          financial.revenue.services[id] = this.calculateServiceRevenue(service);
          financial.revenue.monthly += financial.revenue.services[id];
        }
      }

      // Calculate enterprise revenue
      for (const [clientId, client] of Object.entries(this.enterpriseClients)) {
        financial.revenue.enterprise[clientId] = this.calculateEnterpriseRevenue(client);
        financial.revenue.monthly += financial.revenue.enterprise[clientId];
      }

      // Calculate API costs (estimated)
      financial.costs.apis = financial.revenue.monthly * 0.1; // 10% of revenue
      financial.costs.total = financial.costs.infrastructure + financial.costs.apis;

      // Store financial data
      this.metrics.set(`financial_${Date.now()}`, financial);

      // Broadcast financial update
      this.broadcast({
        type: 'financial_update',
        data: financial
      });

    } catch (error) {
      console.error('Error tracking financials:', error);
    }
  }

  calculateServiceRevenue(service) {
    // Simple revenue calculation based on service type
    switch (service.pricing) {
      case 'subscription': return 2900; // $29/month avg
      case 'enterprise': return 12000; // $120/month avg
      case 'free': return 0;
      default: return 1000;
    }
  }

  calculateEnterpriseRevenue(client) {
    switch (client.type) {
      case 'white-label': return 50000; // $500/month
      case 'standard': return 15000; // $150/month
      case 'custom': return 100000; // $1000/month
      default: return 5000;
    }
  }

  createAlert(serviceId, status, message) {
    const alert = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      serviceId,
      status,
      message,
      severity: status === 'offline' ? 'critical' : 'warning'
    };

    this.alerts.unshift(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }

    // Broadcast alert
    this.broadcast({
      type: 'alert',
      data: alert
    });

    console.log(`🚨 Alert: ${message}`);
  }

  async restartService(serviceId) {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service ${serviceId} not found`);
    }

    // For VPS services, use SSH to restart
    if (service.location && service.location.includes('vps')) {
      return this.restartVPSService(serviceId);
    }

    // For other services, just trigger health check
    await this.checkServiceHealth(serviceId, service);
    
    this.createAlert(serviceId, 'info', `${service.name} restart triggered`);
  }

  async restartVPSService(serviceId) {
    // This would use SSH to restart services on VPS
    const { exec } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const command = `ssh -p 2222 root@168.231.74.29 "pm2 restart ${serviceId}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

  getSummary() {
    const latest = Array.from(this.metrics.values()).pop();
    return {
      totalServices: this.services.size,
      healthyServices: latest?.totals.healthy || 0,
      availability: latest?.availability || 0,
      alerts: this.alerts.length,
      lastUpdate: latest?.timestamp || null
    };
  }

  start(port = 3005) {
    this.app.listen(port, () => {
      console.log(`🎛️ Monitoring Cockpit running on port ${port}`);
      console.log(`📊 Dashboard: http://localhost:${port}`);
      console.log(`🔌 WebSocket: ws://localhost:8080`);
    });
  }
}

// Export and start if run directly
module.exports = MonitoringCockpit;

if (require.main === module) {
  const cockpit = new MonitoringCockpit();
  cockpit.start();
}