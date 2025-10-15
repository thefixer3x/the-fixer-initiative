# Dashboard Extensibility Guide

## 🚀 Adding New Services (Zero Integration Required)

### Method 1: JSON Configuration (Easiest)
Simply add to the appropriate JSON file:

```bash
# Add backend service
echo '{
  "new-service": {
    "name": "New Backend Service",
    "type": "backend",
    "purpose": "Custom service description",
    "endpoints": ["https://api.newservice.com"],
    "access": "public"
  }
}' >> modules/services/index.json

# Add frontend product  
echo '{
  "new-product": {
    "name": "New Product",
    "type": "saas",
    "url": "https://newproduct.com",
    "purpose": "Product description",
    "pricing": "subscription"
  }
}' >> modules/products/index.json

# Restart monitoring - service appears automatically
./start-monitoring.sh
```

### Method 2: Drop-in Service Files
Create standalone service definitions:

```bash
# Create new service file
cat > modules/services/custom-service.json << 'EOF'
{
  "custom-ai-service": {
    "name": "Custom AI Service",
    "type": "ai-backend",
    "location": "https://ai.custom.com",
    "endpoints": [
      "https://ai.custom.com/health",
      "https://ai.custom.com/api/v1"
    ],
    "health_check": "https://ai.custom.com/health",
    "metrics_endpoint": "https://ai.custom.com/metrics",
    "category": "ai-services"
  }
}
EOF

# Auto-discovery picks it up on next restart
```

## 📊 Multiple Dashboard Layouts

### Layout Templates Available

#### 1. Executive Dashboard (High-Level View)
```html
<!-- control-room/dashboard/executive.html -->
- Revenue metrics
- Overall system health
- Key performance indicators
- Enterprise client overview
```

#### 2. Technical Dashboard (Detailed View)  
```html
<!-- control-room/dashboard/technical.html -->
- Service response times
- Error rates and logs
- API call statistics
- Memory/CPU usage
```

#### 3. Financial Dashboard (Business Focus)
```html
<!-- control-room/dashboard/financial.html -->
- Revenue breakdown
- Cost analysis
- Profit margins
- Client billing
```

#### 4. DevOps Dashboard (Operations Focus)
```html
<!-- control-room/dashboard/devops.html -->
- Service health
- Deployment status
- Infrastructure metrics
- Alert management
```

### Create Custom Layouts

```javascript
// Add to monitoring-cockpit.js
this.app.get('/executive', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard/executive.html'));
});

this.app.get('/technical', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard/technical.html'));
});

this.app.get('/financial', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard/financial.html'));
});
```

## 🔧 Service Categories (Auto-Grouping)

Services are automatically grouped by type:

```json
{
  "service-categories": {
    "infrastructure": ["databases", "caching", "queues"],
    "backend": ["apis", "microservices", "workers"],
    "frontend": ["web-apps", "mobile-apps", "dashboards"],
    "ai-services": ["llm", "embeddings", "vector-search"],
    "enterprise": ["white-label", "custom-deployments"],
    "tools": ["cli", "sdk", "extensions"],
    "monitoring": ["metrics", "logging", "alerts"]
  }
}
```

## 📈 Adding Custom Metrics (No Code Required)

### Metric Collectors
Drop JSON metric definitions:

```bash
# Create custom metric collector
cat > modules/metrics/custom-metrics.json << 'EOF'
{
  "memory-usage": {
    "name": "Memory Usage Tracking",
    "endpoint": "https://api.lanonasis.com/api/v1/memory/stats",
    "metrics": ["total_memories", "storage_used", "api_calls"],
    "interval": 60000,
    "chart_type": "line"
  },
  "api-performance": {
    "name": "API Performance",
    "endpoint": "https://api.vortexai.io/metrics", 
    "metrics": ["response_time", "requests_per_minute", "error_rate"],
    "interval": 30000,
    "chart_type": "bar"
  }
}
EOF
```

### Custom Widgets
Add widgets without coding:

```html
<!-- Drop-in widget template -->
<div class="widget" data-metric="memory-usage">
  <h3>Memory Usage</h3>
  <canvas id="memory-chart"></canvas>
</div>
```

## 🔄 Multi-Environment Support

### Environment-Specific Configurations

```bash
# Development environment
cp modules/services/index.json modules/services/dev.json
# Edit dev.json with dev endpoints

# Production environment  
cp modules/services/index.json modules/services/prod.json
# Edit prod.json with prod endpoints

# Start with specific environment
ENV=production ./start-monitoring.sh
ENV=development ./start-monitoring.sh
```

### Environment Switching

```javascript
// Automatic environment detection
const env = process.env.ENV || 'production';
const config = require(`../modules/services/${env}.json`);
```

## 🎨 Dashboard Themes

### Theme Files (CSS Only)
```bash
# Create themes directory
mkdir -p control-room/dashboard/themes

# Dark theme (default)
cp control-room/dashboard/index.html control-room/dashboard/themes/dark.css

# Light theme
cat > control-room/dashboard/themes/light.css << 'EOF'
body { background: #fff; color: #333; }
.panel { background: #f5f5f5; border: 1px solid #ddd; }
.service-card { background: #fff; }
EOF

# Corporate theme
cat > control-room/dashboard/themes/corporate.css << 'EOF'
:root { --primary: #1e40af; --secondary: #64748b; }
.header { background: var(--primary); }
EOF
```

### Theme Switching
```html
<!-- Add theme selector to dashboard -->
<select onchange="switchTheme(this.value)">
  <option value="dark">Dark</option>
  <option value="light">Light</option>
  <option value="corporate">Corporate</option>
</select>
```

## 📱 Mobile-Responsive Layouts

### Responsive Grid System
```css
/* Automatic mobile adaptation */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
  .panel { margin: 0.5rem; }
}
```

## 🔌 Plugin Architecture

### Plugin Interface
```javascript
// Create plugin directory
mkdir -p control-room/plugins

// Sample plugin
cat > control-room/plugins/slack-alerts.js << 'EOF'
module.exports = {
  name: 'Slack Alerts',
  init: (cockpit) => {
    cockpit.on('alert', (alert) => {
      // Send to Slack
    });
  }
};
EOF
```

### Auto-Load Plugins
```javascript
// In monitoring-cockpit.js
const plugins = fs.readdirSync('./plugins')
  .filter(file => file.endsWith('.js'))
  .map(file => require('./plugins/' + file));

plugins.forEach(plugin => plugin.init(this));
```

## 🎯 Quick Examples

### Add GitHub Service
```json
// In modules/services/index.json
{
  "github-integration": {
    "name": "GitHub API",
    "type": "external-api",
    "endpoints": ["https://api.github.com"],
    "purpose": "Repository management"
  }
}
```

### Add Stripe Service  
```json
{
  "stripe-payments": {
    "name": "Stripe Payment Processing",
    "type": "payment-gateway", 
    "endpoints": ["https://api.stripe.com/v1"],
    "purpose": "Payment processing"
  }
}
```

### Add Custom Analytics
```json
{
  "custom-analytics": {
    "name": "Custom Analytics Engine",
    "type": "analytics",
    "url": "https://analytics.mycompany.com",
    "endpoints": ["https://analytics.mycompany.com/health"],
    "metrics_endpoint": "https://analytics.mycompany.com/api/metrics"
  }
}
```

## 🚀 Zero-Configuration Features

### Automatic Discovery
- Health endpoints auto-detected
- Metrics collection auto-configured  
- Charts auto-generated
- Alerts auto-created

### Self-Configuring
- Service types auto-classified
- Dashboard layouts auto-adapted
- Themes auto-applied
- Mobile views auto-optimized

### Hot-Reload Support
- JSON config changes = immediate updates
- No restart required
- Live dashboard updates
- Real-time service discovery

## 📊 Available Dashboard URLs

Once running, access different views:

- **Main Dashboard**: http://localhost:3005
- **Executive View**: http://localhost:3005/executive  
- **Technical View**: http://localhost:3005/technical
- **Financial View**: http://localhost:3005/financial
- **Mobile View**: http://localhost:3005/mobile
- **API Documentation**: http://localhost:3005/api

## 🔧 Configuration-Only Customization

Everything customizable through JSON files:
- ✅ Add services: Edit JSON
- ✅ Change layouts: Swap HTML files
- ✅ Modify themes: Update CSS
- ✅ Add metrics: Drop JSON configs
- ✅ Create widgets: HTML templates
- ✅ Set alerts: JSON thresholds

**No coding required for 95% of customizations!**