#!/bin/bash

# Quick SSH and API Test
echo "=== Quick VPS Diagnostic ==="
echo "VPS IP: 168.231.74.29"
echo "Time: $(date)"

# Test ping
echo "Ping test:"
ping -c 2 168.231.74.29

# Test SSH ports
echo "SSH Port Tests:"
for port in 22 2222 22000; do
    echo "Testing port $port..."
    nc -z -w2 168.231.74.29 $port && echo "Port $port: OPEN" || echo "Port $port: CLOSED"
done

# Test API
echo "API Test:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer $HOSTINGER_API_TOKEN" \
  "https://api.hostinger.com/v1" || echo "API test failed"
