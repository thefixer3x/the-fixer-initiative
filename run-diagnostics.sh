#!/bin/bash

# VPS Diagnostic - Direct Execution
# This script will test SSH and API connectivity

exec > vps-diagnostic-results.txt 2>&1

echo "=== VPS DIAGNOSTIC REPORT ==="
echo "Date: $(date)"
echo "VPS IP: 168.231.74.29"
echo ""

# Test SSH Ports
echo "=== SSH PORT TESTING ==="
for port in 22 2222 22000 2200 22022; do
    echo "Testing SSH port $port..."
    timeout 5 ssh -p $port -i ~/.ssh/id_rsa_vps -o ConnectTimeout=3 -o BatchMode=yes -o StrictHostKeyChecking=no root@168.231.74.29 "echo SSH_SUCCESS_$port; hostname; uptime" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ SUCCESS: SSH working on port $port"
        echo "WORKING_SSH_PORT=$port" >> ssh-success.txt
        break
    else
        echo "❌ Failed on port $port"
    fi
done

echo ""
echo "=== API ENDPOINT TESTING ==="

# Test API endpoints
endpoints=(
    "https://api.hostinger.com/v1"
    "https://api.hostinger.com/v1/vps"
    "https://api.hostinger.com/v1/hosting"
    "https://api.hostinger.com/v1/cloud"
)

for endpoint in "${endpoints[@]}"; do
    echo "Testing: $endpoint"
    response=$(curl -s -w "HTTP:%{http_code}" -H "Authorization: Bearer $HOSTINGER_API_TOKEN" -H "Accept: application/json" --connect-timeout 10 "$endpoint" 2>/dev/null)
    http_code=$(echo "$response" | grep -o "HTTP:[0-9]*" | cut -d: -f2)
    
    case $http_code in
        200) echo "✅ SUCCESS (HTTP 200)" ;;
        401) echo "❌ UNAUTHORIZED (HTTP 401)" ;;
        403) echo "❌ FORBIDDEN (HTTP 403)" ;;
        404) echo "❌ NOT FOUND (HTTP 404)" ;;
        *) echo "⚠️  HTTP $http_code or failed" ;;
    esac
done

echo ""
echo "=== NETWORK CONNECTIVITY ==="
ping -c 3 168.231.74.29

echo ""
echo "=== DIAGNOSTIC COMPLETE ==="
echo "Results saved to: vps-diagnostic-results.txt"
