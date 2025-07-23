#!/bin/bash
# Quick deployment commands for api.connectionpoint.tech

# Create nginx configuration
cat > /etc/nginx/sites-available/api-connectionpoint << 'EOF'
server {
    listen 80;
    server_name api.connectionpoint.tech;
    
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
        proxy_read_timeout 86400;
        proxy_buffering off;
        client_max_body_size 50M;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
    
    location /mcp {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    location /api/adapters {
        proxy_pass http://localhost:3000/api/adapters;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/credit {
        proxy_pass http://localhost:3000/api/credit;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /webhooks {
        proxy_pass http://localhost:3000/webhooks;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/api-connectionpoint /etc/nginx/sites-enabled/

# Test and reload nginx
nginx -t && systemctl reload nginx

# Install certbot if needed
which certbot || (apt update && apt install -y certbot python3-certbot-nginx)

# Generate SSL certificate
certbot --nginx -d api.connectionpoint.tech --non-interactive --agree-tos --email admin@connectionpoint.tech

# Test the deployment
curl -I http://api.connectionpoint.tech/health