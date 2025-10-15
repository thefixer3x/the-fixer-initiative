#!/bin/bash

# The Fixer Initiative - Aggregator Setup Script

echo "🚀 Setting up The Fixer Initiative Aggregator Module..."

# Create module structure
echo "📁 Creating module directories..."
mkdir -p modules/{services,tools,products,enterprise}
mkdir -p control-room/{dashboard,monitoring,orchestration}

# Add lan-onasis-workspace as main submodule (includes onasis-core)
echo "📦 Adding lan-onasis-workspace monorepo..."
if [ ! -d "modules/lan-onasis-workspace" ]; then
    git submodule add https://github.com/thefixer3x/lan-onasis-workspace.git modules/lan-onasis-workspace
else
    echo "   ✅ lan-onasis-workspace already exists"
fi

# Add vibe-memory as a service
echo "📦 Adding vibe-memory service..."
if [ ! -d "modules/services/vibe-memory" ]; then
    git submodule add https://github.com/thefixer3x/vibe-memory.git modules/services/vibe-memory
else
    echo "   ✅ vibe-memory already exists"
fi

# Initialize all submodules
echo "🔄 Initializing submodules..."
git submodule update --init --recursive

# Create classification index files
echo "📝 Creating classification indices..."

cat > modules/services/index.json << 'EOF'
{
  "services": {
    "onasis-core": {
      "name": "Onasis Core API Gateway",
      "type": "backend",
      "location": "../lan-onasis-workspace/core/onasis-core",
      "purpose": "Master API gateway with privacy masking",
      "access": "enterprise",
      "endpoints": [
        "https://api.vortexai.io",
        "https://api.lanonasis.com"
      ]
    },
    "vibe-memory": {
      "name": "Memory as a Service",
      "type": "infrastructure",
      "location": "./vibe-memory",
      "purpose": "Vector memory storage with AI integration",
      "access": "public",
      "endpoints": [
        "https://api.lanonasis.com"
      ]
    },
    "mcp-server": {
      "name": "Model Context Protocol Server",
      "type": "integration",
      "location": "../lan-onasis-workspace/core/onasis-core/MCP BUILD",
      "purpose": "AI assistant integration channel",
      "access": "developer"
    }
  }
}
EOF

cat > modules/tools/index.json << 'EOF'
{
  "tools": {
    "memory-cli": {
      "name": "Lanonasis CLI",
      "type": "cli",
      "package": "@lanonasis/cli",
      "version": "1.1.0",
      "purpose": "Command-line memory management"
    },
    "memory-sdk": {
      "name": "Memory Client SDK",
      "type": "sdk",
      "package": "@lanonasis/memory-client",
      "purpose": "JavaScript/TypeScript SDK"
    },
    "vscode-extension": {
      "name": "Memory VSCode Extension",
      "type": "ide-extension",
      "location": "./vibe-memory/vscode-extension",
      "purpose": "IDE integration for memory management"
    },
    "hostinger-mcp": {
      "name": "Hostinger VPS MCP",
      "type": "mcp-tool",
      "location": "../../hostinger-vps-mcp.js",
      "purpose": "VPS management via MCP"
    }
  }
}
EOF

cat > modules/products/index.json << 'EOF'
{
  "products": {
    "vortexcore": {
      "name": "VortexCore",
      "type": "saas",
      "location": "../lan-onasis-workspace/apps/vortexcore",
      "url": "https://vortexcore.app",
      "purpose": "Main SaaS platform",
      "pricing": "subscription"
    },
    "vortexcore-saas": {
      "name": "VortexCore Business",
      "type": "b2b-saas",
      "location": "../lan-onasis-workspace/apps/vortexcore-saas",
      "url": "https://saas.seftec.tech",
      "purpose": "Enterprise analytics platform",
      "pricing": "enterprise"
    },
    "lanonasis-index": {
      "name": "Lanonasis Platform",
      "type": "portal",
      "location": "../lan-onasis-workspace/apps/lanonasis-index",
      "url": "https://lanonasis.com",
      "purpose": "Public portal and documentation",
      "pricing": "free"
    }
  }
}
EOF

cat > modules/enterprise/index.json << 'EOF'
{
  "enterprise_clients": {
    "example_corp": {
      "name": "Example Corporation",
      "type": "template",
      "services": ["memory-service", "api-gateway"],
      "custom_domain": "api.example.com",
      "sla": "99.9%",
      "support": "business-hours"
    }
  }
}
EOF

# Create aggregation script
echo "🔧 Creating aggregation script..."
cat > modules/aggregate-services.js << 'EOF'
const fs = require('fs');
const path = require('path');

class ServiceAggregator {
  constructor() {
    this.services = {};
    this.tools = {};
    this.products = {};
    this.enterprise = {};
  }

  loadAll() {
    try {
      // Load all module indices
      this.services = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'services/index.json'), 'utf8')
      ).services;
      
      this.tools = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'tools/index.json'), 'utf8')
      ).tools;
      
      this.products = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'products/index.json'), 'utf8')
      ).products;
      
      this.enterprise = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'enterprise/index.json'), 'utf8')
      ).enterprise_clients;
      
      return this.generateReport();
    } catch (error) {
      console.error('Error loading modules:', error);
      return null;
    }
  }

  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        total_services: Object.keys(this.services).length,
        total_tools: Object.keys(this.tools).length,
        total_products: Object.keys(this.products).length,
        enterprise_clients: Object.keys(this.enterprise).length
      },
      services: this.services,
      tools: this.tools,
      products: this.products,
      enterprise: this.enterprise
    };
  }
}

// Run aggregation
const aggregator = new ServiceAggregator();
const report = aggregator.loadAll();
console.log(JSON.stringify(report, null, 2));
EOF

# Create sync script
echo "🔄 Creating sync script..."
cat > sync-modules.sh << 'EOF'
#!/bin/bash
echo "🔄 Syncing all modules..."

# Update main repo
git pull origin main 2>/dev/null || echo "No remote configured yet"

# Update all submodules
git submodule update --init --recursive --remote

# Show status
echo "📊 Module Status:"
git submodule status

# Generate aggregation report
if command -v node &> /dev/null; then
    echo "📊 Generating aggregation report..."
    node modules/aggregate-services.js > aggregation-report.json
else
    echo "⚠️  Node.js not found, skipping aggregation report"
fi

echo "✅ Sync complete!"
EOF

chmod +x sync-modules.sh

# Update .gitignore
echo "📝 Updating .gitignore..."
cat >> .gitignore << 'EOF'

# Aggregator specific
aggregation-report.json
*.log
.env
node_modules/
EOF

# Final status
echo ""
echo "✅ Aggregator setup complete!"
echo ""
echo "📊 Module Summary:"
echo "   - lan-onasis-workspace (includes onasis-core)"
echo "   - vibe-memory service"
echo "   - Classification structure created"
echo ""
echo "🎯 Next steps:"
echo "   1. Review and commit: git add . && git commit -m 'Setup aggregator structure'"
echo "   2. Push to GitHub: git push origin main"
echo "   3. Run sync: ./sync-modules.sh"
echo "   4. Generate report: node modules/aggregate-services.js"
echo ""
echo "🔧 To add enterprise clients:"
echo "   Edit: modules/enterprise/index.json"
echo ""