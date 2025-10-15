#!/bin/bash

# Comprehensive VPS Diagnostic and Recovery Tool
# Supports both SSH and API approaches

VPS_IP="168.231.74.29"
API_TOKEN="$HOSTINGER_API_TOKEN"

echo "🔍 HOSTINGER VPS COMPREHENSIVE DIAGNOSTIC"
echo "========================================="
echo "Target VPS: $VPS_IP"
echo "Timestamp: $(date)"
echo ""

# 1. Basic Connectivity
echo "🌐 NETWORK CONNECTIVITY"
echo "----------------------"
if ping -c 2 $VPS_IP >/dev/null 2>&1; then
    echo "✅ Server is ONLINE"
    ping_stats=$(ping -c 5 $VPS_IP | tail -1)
    echo "   📊 $ping_stats"
else
    echo "❌ Server is OFFLINE or unreachable"
    echo "   🚨 Critical: Server may be down"
fi
echo ""

# 2. Port Scanning
echo "🔌 PORT ACCESSIBILITY"
echo "--------------------"
common_ports=(22 80 443 2222 22000 3389 21 25 53 110 143 993 995)
open_ports=()

for port in "${common_ports[@]}"; do
    if nc -z -w2 $VPS_IP $port 2>/dev/null; then
        echo "✅ Port $port: OPEN"
        open_ports+=($port)
        
        # Special handling for SSH ports
        if [[ $port == 22 || $port == 2222 || $port == 22000 ]]; then
            echo "   🔑 SSH potentially available on port $port"
        fi
    else
        echo "❌ Port $port: CLOSED"
    fi
done
echo ""

# 3. SSH Connectivity Tests
echo "🔐 SSH CONNECTION ATTEMPTS"
echo "-------------------------"
ssh_success=false
for port in 22 2222 22000 2200; do
    echo -n "Trying SSH on port $port... "
    if timeout 5 ssh -p $port -i ~/.ssh/id_rsa_vps -o ConnectTimeout=3 -o BatchMode=yes -o StrictHostKeyChecking=no root@$VPS_IP "echo 'SSH_SUCCESS'" 2>/dev/null | grep -q "SSH_SUCCESS"; then
        echo "✅ SUCCESS!"
        echo "   🎉 SSH is working on port $port"
        ssh_success=true
        working_ssh_port=$port
        break
    else
        echo "❌ Failed"
    fi
done

if [ "$ssh_success" = false ]; then
    echo "🚨 No SSH access available on common ports"
    echo "   Possible causes:"
    echo "   - SSH service stopped"
    echo "   - Firewall blocking access"
    echo "   - Server in maintenance mode"
    echo "   - Custom SSH port configuration"
fi
echo ""

# 4. API Diagnostics
echo "🔗 HOSTINGER API DIAGNOSTICS"
echo "----------------------------"
api_working=false

# Test various API endpoints
declare -A api_endpoints=(
    ["Primary API"]="https://api.hostinger.com/v1"
    ["Hosting API"]="https://api.hostinger.com/v1/hosting"
    ["VPS API"]="https://api.hostinger.com/v1/vps"
    ["Cloud API"]="https://api.hostinger.com/v1/cloud"
    ["Backup API"]="https://rest-api.hostinger.com/v2"
)

for name in "${!api_endpoints[@]}"; do
    endpoint="${api_endpoints[$name]}"
    echo -n "Testing $name... "
    
    response=$(curl -s -w "%{http_code}" -o /tmp/api_response.json \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Accept: application/json" \
        -H "User-Agent: VPS-Diagnostic/1.0" \
        --connect-timeout 10 \
        "$endpoint" 2>/dev/null)
    
    case $response in
        200)
            echo "✅ SUCCESS (HTTP 200)"
            api_working=true
            echo "   📄 Response: $(head -c 100 /tmp/api_response.json)..."
            ;;
        401)
            echo "❌ UNAUTHORIZED (HTTP 401)"
            echo "   🔑 Check API token validity"
            ;;
        403)
            echo "❌ FORBIDDEN (HTTP 403)"
            echo "   🚫 Access denied - check permissions"
            ;;
        404)
            echo "❌ NOT FOUND (HTTP 404)"
            echo "   📍 Endpoint may not exist"
            ;;
        *)
            echo "⚠️  HTTP $response or timeout"
            ;;
    esac
done
echo ""

# 5. Recovery Recommendations
echo "🛠️  RECOVERY RECOMMENDATIONS"
echo "=============================="

if [ "$ssh_success" = true ]; then
    echo "✅ SSH ACCESS AVAILABLE"
    echo "   🔧 Connect using: ssh -p $working_ssh_port -i ~/.ssh/id_rsa_vps root@$VPS_IP"
    echo "   📋 Available diagnostic commands:"
    echo "      - systemctl status sshd"
    echo "      - htop (system resources)"
    echo "      - df -h (disk usage)"
    echo "      - free -h (memory usage)"
    echo "      - netstat -tlnp (listening services)"
elif [ "$api_working" = true ]; then
    echo "🔗 API ACCESS AVAILABLE"
    echo "   📡 Use API for remote management"
    echo "   💻 Access Hostinger control panel: https://hpanel.hostinger.com/"
    echo "   🖥️  Try browser-based console if available"
else
    echo "🚨 CRITICAL: NO ACCESS METHODS WORKING"
    echo "   📞 Contact Hostinger Support immediately"
    echo "   🌐 Check https://hpanel.hostinger.com/ for server status"
    echo "   📧 Create support ticket for server investigation"
fi

echo ""
echo "🎯 IMMEDIATE NEXT STEPS"
echo "======================="

if [ ${#open_ports[@]} -gt 0 ]; then
    echo "✅ Services detected on ports: ${open_ports[*]}"
    
    if [[ " ${open_ports[*]} " =~ " 80 " ]] || [[ " ${open_ports[*]} " =~ " 443 " ]]; then
        echo "🌐 Web services appear to be running"
        echo "   Test: curl -I http://$VPS_IP"
    fi
fi

echo ""
echo "📋 DIAGNOSTIC SUMMARY"
echo "===================="
echo "Server IP: $VPS_IP"
echo "Ping: $(ping -c 1 $VPS_IP >/dev/null 2>&1 && echo "✅ OK" || echo "❌ FAIL")"
echo "SSH: $([ "$ssh_success" = true ] && echo "✅ Available on port $working_ssh_port" || echo "❌ Unavailable")"
echo "API: $([ "$api_working" = true ] && echo "✅ Responsive" || echo "❌ Unresponsive")"
echo "Open Ports: $([ ${#open_ports[@]} -gt 0 ] && echo "${open_ports[*]}" || echo "None detected")"

# Cleanup
rm -f /tmp/api_response.json
