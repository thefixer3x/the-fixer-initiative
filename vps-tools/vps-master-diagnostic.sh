#!/bin/bash

# Hostinger VPS Master Diagnostic Tool
# Consolidated version combining best features from all diagnostic scripts
# Version: 2.0
# Date: July 9, 2025

set -euo pipefail

# Configuration
VPS_IP="168.231.74.29"
API_TOKEN="$HOSTINGER_API_TOKEN"
SSH_KEY="$HOME/.ssh/id_rsa_vps"
RESULTS_FILE="vps-diagnostic-results.txt"
LOG_FILE="vps-diagnostic.log"

# Colors and emojis for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Output with timestamp
output() {
    echo "$1"
    log "$1"
}

# Error handling
error_exit() {
    output "❌ ERROR: $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    output "🔍 Checking prerequisites..."
    
    if [ -z "$API_TOKEN" ]; then
        output "⚠️  Warning: HOSTINGER_API_TOKEN not set - API tests will be skipped"
        API_TESTS=false
    else
        output "✅ API Token found: ${API_TOKEN:0:10}..."
        API_TESTS=true
    fi
    
    if [ ! -f "$SSH_KEY" ]; then
        output "⚠️  Warning: SSH key not found at $SSH_KEY - SSH tests may fail"
    else
        output "✅ SSH key found"
    fi
    
    # Check required commands
    for cmd in curl nc ping ssh; do
        if ! command -v "$cmd" &> /dev/null; then
            error_exit "Required command '$cmd' not found"
        fi
    done
    
    output "✅ All prerequisites checked"
}

# Network connectivity test
test_network() {
    output ""
    output "🌐 NETWORK CONNECTIVITY TEST"
    output "=============================="
    
    output "Testing ping to $VPS_IP..."
    if ping -c 3 "$VPS_IP" >/dev/null 2>&1; then
        ping_time=$(ping -c 1 "$VPS_IP" | grep "time=" | cut -d'=' -f4 | head -1)
        output "✅ Server is ONLINE (Response time: $ping_time)"
        
        # Extended ping test
        packet_loss=$(ping -c 10 "$VPS_IP" | grep "packet loss" | awk '{print $6}')
        output "📊 Packet loss over 10 pings: $packet_loss"
        
        return 0
    else
        output "❌ Server is OFFLINE or unreachable"
        output "🚨 Critical: Cannot reach server - check network/server status"
        return 1
    fi
}

# Port scanning
test_ports() {
    output ""
    output "🔌 PORT ACCESSIBILITY SCAN"
    output "=========================="
    
    # Common service ports
    declare -A ports=(
        [22]="SSH"
        [2222]="SSH Alt"
        [22000]="SSH Custom"
        [2200]="SSH Alt2"
        [22022]="SSH Alt3"
        [80]="HTTP"
        [443]="HTTPS"
        [21]="FTP"
        [25]="SMTP"
        [53]="DNS"
        [3389]="RDP"
        [8080]="HTTP Alt"
    )
    
    open_ports=()
    ssh_ports=()
    
    for port in "${!ports[@]}"; do
        service="${ports[$port]}"
        output "Testing port $port ($service)..."
        
        if nc -z -w3 "$VPS_IP" "$port" 2>/dev/null; then
            output "✅ Port $port ($service): OPEN"
            open_ports+=("$port")
            
            # Track SSH ports specifically
            if [[ "$service" == *"SSH"* ]]; then
                ssh_ports+=("$port")
            fi
        else
            output "❌ Port $port ($service): CLOSED"
        fi
    done
    
    output ""
    output "📊 SCAN SUMMARY:"
    output "Open ports: ${open_ports[*]:-None}"
    output "Potential SSH ports: ${ssh_ports[*]:-None}"
    
    # Store SSH ports for later testing
    echo "${ssh_ports[*]}" > "/tmp/ssh_ports.txt"
}

# SSH connectivity test
test_ssh() {
    output ""
    output "🔐 SSH CONNECTIVITY TEST"
    output "========================"
    
    # Get SSH ports from port scan or use defaults
    if [ -f "/tmp/ssh_ports.txt" ]; then
        ssh_ports=($(cat /tmp/ssh_ports.txt))
    fi
    
    # Default SSH ports if none found open
    if [ ${#ssh_ports[@]} -eq 0 ]; then
        ssh_ports=(22 2222 22000 2200 22022)
        output "ℹ️  Using default SSH ports (none found in port scan)"
    fi
    
    ssh_success=false
    working_port=""
    
    for port in "${ssh_ports[@]}"; do
        output "Testing SSH on port $port..."
        
        # Try SSH connection with timeout
        if timeout 8 ssh -p "$port" -i "$SSH_KEY" \
           -o ConnectTimeout=5 \
           -o BatchMode=yes \
           -o StrictHostKeyChecking=no \
           "root@$VPS_IP" \
           "echo 'SSH_SUCCESS'; hostname; uptime; whoami" 2>/dev/null | grep -q "SSH_SUCCESS"; then
            
            output "🎉 SSH SUCCESS on port $port!"
            ssh_success=true
            working_port="$port"
            
            # Get system information
            output "📋 Gathering system information..."
            ssh_info=$(timeout 10 ssh -p "$port" -i "$SSH_KEY" \
                      -o ConnectTimeout=5 \
                      -o BatchMode=yes \
                      -o StrictHostKeyChecking=no \
                      "root@$VPS_IP" \
                      "echo '=== SYSTEM INFO ==='; \
                       hostname; \
                       uptime; \
                       free -h; \
                       df -h; \
                       systemctl status sshd --no-pager; \
                       netstat -tlnp | grep :22" 2>/dev/null)
            
            output "$ssh_info"
            echo "$ssh_info" > "ssh-system-info.txt"
            echo "WORKING_SSH_PORT=$port" > "ssh-success.txt"
            break
        else
            output "❌ SSH failed on port $port"
        fi
    done
    
    if [ "$ssh_success" = false ]; then
        output "🚨 SSH ACCESS FAILED on all tested ports"
        output "Possible causes:"
        output "  - SSH service stopped/disabled"
        output "  - Firewall blocking connections"
        output "  - Server in maintenance mode"
        output "  - Different SSH port configuration"
        output "  - Key authentication issues"
    fi
}

# API endpoint testing
test_api() {
    if [ "$API_TESTS" = false ]; then
        output ""
        output "⏭️  SKIPPING API TESTS (No API token)"
        return
    fi
    
    output ""
    output "🔗 API ENDPOINT TESTING"
    output "======================"
    
    # API endpoints to test
    declare -a endpoints=(
        "https://api.hostinger.com/v1"
        "https://api.hostinger.com/v1/vps"
        "https://api.hostinger.com/v1/hosting"
        "https://api.hostinger.com/v1/cloud"
        "https://api.hostinger.com/v1/servers"
        "https://rest-api.hostinger.com/v2"
        "https://rest-api.hostinger.com/v2/vps"
    )
    
    api_success=false
    working_endpoints=()
    
    for endpoint in "${endpoints[@]}"; do
        output "Testing: $endpoint"
        
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
                   -H "Authorization: Bearer $API_TOKEN" \
                   -H "Accept: application/json" \
                   -H "User-Agent: VPS-Master-Diagnostic/2.0" \
                   --connect-timeout 10 \
                   --max-time 15 \
                   "$endpoint" 2>/dev/null || echo "HTTPSTATUS:000")
        
        http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
        body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//')
        
        case $http_code in
            200)
                output "✅ SUCCESS (HTTP 200)"
                output "   Response: ${body:0:100}..."
                api_success=true
                working_endpoints+=("$endpoint")
                ;;
            401)
                output "❌ UNAUTHORIZED (HTTP 401)"
                output "   Issue: Invalid or expired API token"
                ;;
            403)
                output "❌ FORBIDDEN (HTTP 403)"
                output "   Issue: Access denied - insufficient permissions"
                ;;
            404)
                output "❌ NOT FOUND (HTTP 404)"
                output "   Issue: Endpoint does not exist"
                ;;
            429)
                output "⚠️  RATE LIMITED (HTTP 429)"
                output "   Issue: Too many requests - wait before retrying"
                ;;
            500|502|503|504)
                output "❌ SERVER ERROR (HTTP $http_code)"
                output "   Issue: Hostinger API internal error"
                ;;
            000)
                output "❌ CONNECTION FAILED"
                output "   Issue: Cannot connect to endpoint"
                ;;
            *)
                output "⚠️  HTTP $http_code"
                output "   Response: ${body:0:100}"
                ;;
        esac
    done
    
    output ""
    output "📊 API SUMMARY:"
    if [ ${#working_endpoints[@]} -gt 0 ]; then
        output "✅ Working endpoints: ${#working_endpoints[@]}"
        printf '%s\n' "${working_endpoints[@]}" > "api-working-endpoints.txt"
    else
        output "❌ No working API endpoints found"
    fi
}

# System recommendations
generate_recommendations() {
    output ""
    output "🛠️  SYSTEM RECOMMENDATIONS"
    output "=========================="
    
    # SSH recommendations
    if [ -f "ssh-success.txt" ]; then
        working_port=$(grep "WORKING_SSH_PORT" ssh-success.txt | cut -d'=' -f2)
        output "✅ SSH Access Available:"
        output "   Connect: ssh -p $working_port -i $SSH_KEY root@$VPS_IP"
        output "   Recommended diagnostics to run on server:"
        output "     - systemctl status sshd nginx apache2 mysql"
        output "     - htop (check resources)"
        output "     - df -h (check disk space)"
        output "     - journalctl -f (check logs)"
    else
        output "🔧 SSH Access Issues:"
        output "   1. Check Hostinger control panel for server status"
        output "   2. Try web-based console: https://hpanel.hostinger.com/"
        output "   3. Check for custom SSH port configuration"
        output "   4. Verify SSH service is running"
        output "   5. Contact support if server is unresponsive"
    fi
    
    # API recommendations
    if [ -f "api-working-endpoints.txt" ]; then
        output "✅ API Access Available:"
        output "   Use working endpoints for remote management"
        output "   Consider setting up automated monitoring"
    else
        output "🔧 API Access Issues:"
        output "   1. Verify API token permissions in control panel"
        output "   2. Check token expiration date"
        output "   3. Test from different network if possible"
        output "   4. Contact support for API access issues"
    fi
    
    # Alternative access methods
    output ""
    output "🆘 ALTERNATIVE ACCESS METHODS:"
    output "1. Hostinger Control Panel: https://hpanel.hostinger.com/"
    output "2. Browser-based console (if available in panel)"
    output "3. Emergency console access"
    output "4. Mobile app management"
    output "5. Support ticket for critical issues"
}

# Generate summary report
generate_summary() {
    output ""
    output "📋 DIAGNOSTIC SUMMARY REPORT"
    output "============================"
    output "Timestamp: $(date)"
    output "VPS IP: $VPS_IP"
    output "Diagnostic Version: 2.0"
    output ""
    
    # Network status
    if ping -c 1 "$VPS_IP" >/dev/null 2>&1; then
        output "🌐 Network: ✅ ONLINE"
    else
        output "🌐 Network: ❌ OFFLINE"
    fi
    
    # SSH status  
    if [ -f "ssh-success.txt" ]; then
        working_port=$(grep "WORKING_SSH_PORT" ssh-success.txt | cut -d'=' -f2)
        output "🔐 SSH: ✅ Available on port $working_port"
    else
        output "🔐 SSH: ❌ Not accessible"
    fi
    
    # API status
    if [ -f "api-working-endpoints.txt" ]; then
        endpoint_count=$(wc -l < "api-working-endpoints.txt")
        output "🔗 API: ✅ $endpoint_count working endpoints"
    else
        output "🔗 API: ❌ No working endpoints"
    fi
    
    # Open ports
    if [ -f "/tmp/ssh_ports.txt" ]; then
        open_ports=$(cat /tmp/ssh_ports.txt)
        output "🔌 Ports: ${open_ports:-None detected}"
    fi
    
    output ""
    output "📁 Generated Files:"
    output "  - $RESULTS_FILE (This output)"
    output "  - $LOG_FILE (Detailed log)"
    [ -f "ssh-success.txt" ] && output "  - ssh-success.txt (SSH connection details)"
    [ -f "ssh-system-info.txt" ] && output "  - ssh-system-info.txt (System information)"
    [ -f "api-working-endpoints.txt" ] && output "  - api-working-endpoints.txt (Working API endpoints)"
}

# Main execution
main() {
    # Redirect output to both console and file
    exec > >(tee "$RESULTS_FILE") 2>&1
    
    output "🔍 HOSTINGER VPS MASTER DIAGNOSTIC TOOL v2.0"
    output "=============================================="
    output "Starting diagnostic at $(date)"
    output "Target: $VPS_IP"
    output ""
    
    # Run diagnostic steps
    check_prerequisites
    test_network
    test_ports  
    test_ssh
    test_api
    generate_recommendations
    generate_summary
    
    output ""
    output "🎯 DIAGNOSTIC COMPLETE!"
    output "Results saved to: $RESULTS_FILE"
    output "Log saved to: $LOG_FILE"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
