#!/bin/bash
# CaaS Deployment Verification Script

echo "=== CaaS Deployment Verification ==="
echo "Running at: $(date)"
echo ""

# Check DNS resolution
echo "1. Checking DNS Resolution..."
if dig api.connectionpoint.tech +short | grep -q "168.231.74.29"; then
    echo "✓ DNS is resolving correctly to 168.231.74.29"
else
    echo "✗ DNS not resolving or pointing to wrong IP"
    echo "  Current resolution: $(dig api.connectionpoint.tech +short)"
fi
echo ""

# Check nginx configuration
echo "2. Checking Nginx Configuration..."
if nginx -t 2>/dev/null; then
    echo "✓ Nginx configuration is valid"
else
    echo "✗ Nginx configuration has errors"
    nginx -t
fi
echo ""

# Check if nginx is running
echo "3. Checking Nginx Service..."
if systemctl is-active --quiet nginx; then
    echo "✓ Nginx is running"
else
    echo "✗ Nginx is not running"
    systemctl status nginx --no-pager -l | head -10
fi
echo ""

# Check if site is enabled
echo "4. Checking Enabled Sites..."
if [ -L "/etc/nginx/sites-enabled/api-connectionpoint" ]; then
    echo "✓ api-connectionpoint site is enabled"
else
    echo "✗ api-connectionpoint site is not enabled"
fi
echo ""

# Check port availability
echo "5. Checking Port Status..."
for port in 80 443 3000 3001; do
    if netstat -tulpn 2>/dev/null | grep -q ":$port "; then
        echo "✓ Port $port is listening"
    else
        echo "✗ Port $port is not listening"
    fi
done
echo ""

# Check API endpoints
echo "6. Testing API Endpoints..."
# Test HTTP
response=$(curl -s -o /dev/null -w "%{http_code}" http://api.connectionpoint.tech/health 2>/dev/null)
if [ "$response" = "200" ] || [ "$response" = "301" ] || [ "$response" = "302" ]; then
    echo "✓ HTTP endpoint responding (status: $response)"
else
    echo "✗ HTTP endpoint not responding (status: $response)"
fi

# Test local services
echo ""
echo "7. Testing Local Services..."
# Onasis Gateway
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null)
if [ "$response" = "200" ]; then
    echo "✓ Onasis Gateway is running on port 3000"
else
    echo "✗ Onasis Gateway not responding on port 3000"
fi

# MCP Server
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null)
if [ "$response" = "200" ] || [ "$response" = "404" ]; then
    echo "✓ MCP Server is running on port 3001"
else
    echo "✗ MCP Server not responding on port 3001"
fi
echo ""

# Check SSL certificate
echo "8. Checking SSL Certificate..."
if [ -f "/etc/letsencrypt/live/api.connectionpoint.tech/cert.pem" ]; then
    echo "✓ SSL certificate exists"
    openssl x509 -noout -dates -in /etc/letsencrypt/live/api.connectionpoint.tech/cert.pem 2>/dev/null
else
    echo "✗ SSL certificate not found"
fi
echo ""

# Check database
echo "9. Checking Database..."
if command -v psql &> /dev/null; then
    if psql -U postgres -d onasis_gateway -c "SELECT 1;" &>/dev/null; then
        echo "✓ PostgreSQL connection successful"
        # Check credit schema
        if psql -U postgres -d onasis_gateway -c "\dn credit" | grep -q "credit"; then
            echo "✓ Credit schema exists"
        else
            echo "✗ Credit schema not found"
        fi
    else
        echo "✗ Cannot connect to PostgreSQL"
    fi
else
    echo "✗ psql command not found"
fi
echo ""

# Check PM2 services
echo "10. Checking PM2 Services..."
if command -v pm2 &> /dev/null; then
    pm2 list
else
    echo "✗ PM2 not installed"
fi
echo ""

# Summary
echo "=== Deployment Summary ==="
echo "Run this script on your VPS to verify the deployment status."
echo "Fix any issues marked with ✗ before proceeding."