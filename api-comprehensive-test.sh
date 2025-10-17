#!/bin/bash

# Hostinger API Comprehensive Test
echo "🔗 Hostinger API Investigation"
echo "=============================="

if [ -z "$HOSTINGER_API_TOKEN" ]; then
    echo "❌ HOSTINGER_API_TOKEN not set"
    exit 1
fi

echo "✅ API Token found: ${HOSTINGER_API_TOKEN:0:10}..."
echo ""

# Test different API endpoints
declare -a endpoints=(
    "https://api.hostinger.com/v1"
    "https://api.hostinger.com/v1/hosting"
    "https://api.hostinger.com/v1/vps" 
    "https://api.hostinger.com/v1/cloud"
    "https://api.hostinger.com/v1/servers"
    "https://rest-api.hostinger.com/v2"
)

for endpoint in "${endpoints[@]}"; do
    echo "Testing: $endpoint"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -H "Authorization: Bearer $HOSTINGER_API_TOKEN" \
        -H "Accept: application/json" \
        -H "User-Agent: VPS-Diagnostic/1.0" \
        --connect-timeout 10 \
        "$endpoint")
    
    http_status=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//')
    
    case $http_status in
        200)
            echo "✅ SUCCESS (200 OK)"
            echo "Response: ${body:0:100}..."
            ;;
        401)
            echo "❌ UNAUTHORIZED (401)"
            echo "Issue: Invalid or expired API token"
            ;;
        403)
            echo "❌ FORBIDDEN (403)" 
            echo "Issue: Access denied - insufficient permissions"
            ;;
        404)
            echo "❌ NOT FOUND (404)"
            echo "Issue: Endpoint does not exist"
            ;;
        429)
            echo "⚠️  RATE LIMITED (429)"
            echo "Issue: Too many requests"
            ;;
        500)
            echo "❌ SERVER ERROR (500)"
            echo "Issue: Hostinger API internal error"
            ;;
        000)
            echo "❌ CONNECTION FAILED"
            echo "Issue: Cannot connect to endpoint"
            ;;
        *)
            echo "⚠️  HTTP $http_status"
            echo "Response: ${body:0:100}"
            ;;
    esac
    echo "---"
done

echo ""
echo "🎯 Summary:"
echo "If any endpoint returned 200 OK, the API is working"
echo "If all returned 401/403, check your API token permissions"
echo "If all failed to connect, there may be network issues"
