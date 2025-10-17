#!/bin/bash

# VPS Diagnostic Script for Hostinger
# Date: $(date)

VPS_IP="168.231.74.29"
API_TOKEN="$HOSTINGER_API_TOKEN"

echo "=== HOSTINGER VPS DIAGNOSTIC REPORT ==="
echo "Generated: $(date)"
echo "VPS IP: $VPS_IP"
echo ""

# Basic Network Diagnostics
echo "=== NETWORK CONNECTIVITY ==="
echo -n "Ping Test: "
if ping -c 2 $VPS_IP >/dev/null 2>&1; then
    echo "✅ ONLINE"
    PING_TIME=$(ping -c 1 $VPS_IP | grep "time=" | cut -d'=' -f4)
    echo "Response Time: $PING_TIME"
else
    echo "❌ OFFLINE"
fi

echo ""
echo "=== SSH CONNECTIVITY ==="
for port in 22 2222 22000; do
    echo -n "Port $port: "
    if nc -z -w3 $VPS_IP $port 2>/dev/null; then
        echo "✅ OPEN"
        SSH_PORT=$port
    else
        echo "❌ CLOSED"
    fi
done

echo ""
echo "=== API DIAGNOSTICS ==="

# Try different API endpoints
api_endpoints=(
    "https://api.hostinger.com/v1/vps"
    "https://api.hostinger.com/vps/instances"
    "https://rest-api.hostinger.com/v2/vps"
    "https://api.hostinger.com/v1/hosting"
    "https://api.hostinger.com/v1/cloud"
)

for endpoint in "${api_endpoints[@]}"; do
    echo -n "Testing $endpoint: "
    response=$(curl -s -w "%{http_code}" -o /dev/null \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Accept: application/json" \
        --connect-timeout 5 \
        "$endpoint")
    
    case $response in
        200) echo "✅ SUCCESS (HTTP 200)" ;;
        401) echo "❌ UNAUTHORIZED (HTTP 401)" ;;
        403) echo "❌ FORBIDDEN (HTTP 403)" ;;
        404) echo "❌ NOT FOUND (HTTP 404)" ;;
        500) echo "❌ SERVER ERROR (HTTP 500)" ;;
        000) echo "❌ NO RESPONSE" ;;
        *) echo "⚠️  HTTP $response" ;;
    esac
done

echo ""
echo "=== SYSTEM RECOMMENDATIONS ==="

if [ -n "$SSH_PORT" ]; then
    echo "✅ SSH available on port $SSH_PORT"
    echo "   Try: ssh -p $SSH_PORT -i ~/.ssh/id_rsa_vps root@$VPS_IP"
else
    echo "❌ SSH not accessible"
    echo "   Possible issues:"
    echo "   - SSH service stopped"
    echo "   - Firewall blocking connections"
    echo "   - Server maintenance"
    echo "   - Custom SSH port not tested"
fi

echo ""
echo "=== ALTERNATIVE ACCESS METHODS ==="
echo "1. Hostinger Control Panel: https://hpanel.hostinger.com/"
echo "2. VPS Console (if available in panel)"
echo "3. Emergency console access"
echo "4. Contact Hostinger support if server is unresponsive"

echo ""
echo "=== NEXT STEPS ==="
echo "1. Check Hostinger control panel for VPS status"
echo "2. Try SSH on discovered open ports"
echo "3. Use API endpoints that responded successfully"
echo "4. Contact support if critical services are down"
