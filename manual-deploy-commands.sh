#!/bin/bash
# Manual deployment commands for Onasis Gateway with CaaS
# Copy and paste these commands into your SSH session

# Step 1: Create nginx configuration for api.connectionpoint.tech
cat > /etc/nginx/sites-available/api-connectionpoint << 'EOF'
# Onasis Gateway API Configuration for connectionpoint.tech
# Complete fintech API gateway with credit-as-a-service integration

# HTTP Configuration (Port 80)
server {
    listen 80;
    server_name api.connectionpoint.tech;
    
    # Main API Gateway (Onasis Gateway on port 3000)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings for fintech operations
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering off;
        
        # Large request support for file uploads
        client_max_body_size 50M;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Fast health check settings
        proxy_connect_timeout 5s;
        proxy_read_timeout 5s;
        access_log off;
    }
    
    # MCP Server endpoints (port 3001)
    location /mcp {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support for MCP
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
    
    # API adapter discovery endpoint
    location /api/adapters {
        proxy_pass http://localhost:3000/api/adapters;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Credit-as-a-Service specific endpoints
    location /api/credit {
        proxy_pass http://localhost:3000/api/credit;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Extended timeout for credit processing
        proxy_connect_timeout 90s;
        proxy_read_timeout 90s;
    }
    
    # Payment webhook endpoints (higher rate limits)
    location /webhooks {
        proxy_pass http://localhost:3000/webhooks;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Preserve original webhook headers
        proxy_pass_request_headers on;
        proxy_set_header X-Original-URI $request_uri;
    }
    
    # Static assets and documentation
    location /docs {
        proxy_pass http://localhost:3000/docs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache static documentation
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Step 2: Enable the site
ln -sf /etc/nginx/sites-available/api-connectionpoint /etc/nginx/sites-enabled/api-connectionpoint

# Step 3: Test nginx configuration
nginx -t

# Step 4: Reload nginx
systemctl reload nginx

# Step 5: Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Step 6: Generate SSL certificate
certbot --nginx -d api.connectionpoint.tech --non-interactive --agree-tos --email admin@connectionpoint.tech

# Step 7: Test the deployment
echo "Testing deployment..."
curl -I http://api.connectionpoint.tech/health

# Step 8: Show status
echo "=== Nginx Status ==="
systemctl status nginx --no-pager -l

echo -e "\n=== Active Sites ==="
ls -la /etc/nginx/sites-enabled/

echo -e "\n=== Port Status ==="
netstat -tulpn | grep -E ':(80|443|3000|3001)'