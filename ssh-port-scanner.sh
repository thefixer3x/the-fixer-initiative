#!/bin/bash

# Simple SSH Port Scanner for Hostinger VPS
VPS_IP="168.231.74.29"

echo "SSH Port Scanner for $VPS_IP"
echo "============================="

# Test common SSH ports
ports=(22 2222 22000 2200 22022 2202 10022)

for port in "${ports[@]}"; do
    echo -n "Port $port: "
    if timeout 3 bash -c "echo >/dev/tcp/$VPS_IP/$port" 2>/dev/null; then
        echo "OPEN - Testing SSH..."
        ssh -p $port -i ~/.ssh/id_rsa_vps -o ConnectTimeout=3 -o BatchMode=yes root@$VPS_IP "echo Connected on port $port" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ SSH SUCCESS on port $port"
            exit 0
        else
            echo "❌ Port open but SSH failed"
        fi
    else
        echo "CLOSED"
    fi
done

echo "No working SSH ports found"
