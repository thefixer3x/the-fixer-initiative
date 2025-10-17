#!/bin/bash

# Agent Banks Server Endpoint Testing Script
# Date: July 9, 2025
# Purpose: Verify all endpoints and server functionality

SERVER_URL="http://localhost:3000"
RESULTS_FILE="endpoint-test-results.txt"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log_result() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$RESULTS_FILE"
    echo -e "$1"
}

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    log_result "🔍 Testing: $description"
    log_result "   Endpoint: $method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
                   -X "$method" \
                   -H "Content-Type: application/json" \
                   -d "$data" \
                   "$SERVER_URL$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
                   -X "$method" \
                   "$SERVER_URL$endpoint" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//')
    
    case $http_code in
        200)
            log_result "   ✅ SUCCESS (HTTP 200)"
            log_result "   Response: ${body:0:150}..."
            return 0
            ;;
        404)
            log_result "   ❌ NOT FOUND (HTTP 404)"
            log_result "   Response: ${body:0:100}"
            return 1
            ;;
        500)
            log_result "   ❌ SERVER ERROR (HTTP 500)"
            log_result "   Response: ${body:0:100}"
            return 1
            ;;
        000)
            log_result "   ❌ CONNECTION FAILED"
            log_result "   Cannot connect to server"
            return 1
            ;;
        *)
            log_result "   ⚠️  HTTP $http_code"
            log_result "   Response: ${body:0:100}"
            return 1
            ;;
    esac
}

# Main testing function
main() {
    log_result "🚀 AGENT BANKS SERVER ENDPOINT TESTING"
    log_result "======================================"
    log_result "Server URL: $SERVER_URL"
    log_result "Test started at: $(date)"
    log_result ""
    
    # Check if server is accessible
    log_result "🌐 BASIC CONNECTIVITY TEST"
    log_result "--------------------------"
    
    if curl -s --connect-timeout 5 "$SERVER_URL" >/dev/null 2>&1; then
        log_result "✅ Server is accessible at $SERVER_URL"
    else
        log_result "❌ Server is not accessible at $SERVER_URL"
        log_result "🚨 Aborting tests - server not reachable"
        exit 1
    fi
    
    log_result ""
    
    # Test counter
    total_tests=0
    passed_tests=0
    
    # Test 1: Health Check
    log_result "🏥 HEALTH CHECK ENDPOINT"
    log_result "------------------------"
    if test_endpoint "GET" "/health" "Health Check"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    log_result ""
    
    # Test 2: Root endpoint
    log_result "🏠 ROOT ENDPOINT"
    log_result "----------------"
    if test_endpoint "GET" "/" "Root/Home Page"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    log_result ""
    
    # Test 3: Memory Search
    log_result "🔍 MEMORY SEARCH ENDPOINT"
    log_result "-------------------------"
    search_data='{"query":"test search","limit":10}'
    if test_endpoint "POST" "/api/memories/search" "Memory Search API" "$search_data"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    log_result ""
    
    # Test 4: Chat Endpoint
    log_result "💬 CHAT ENDPOINT"
    log_result "----------------"
    chat_data='{"message":"Hello, this is a test message"}'
    if test_endpoint "POST" "/api/chat" "Chat Interface API" "$chat_data"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    log_result ""
    
    # Test 5: Analytics
    log_result "📊 ANALYTICS ENDPOINT"
    log_result "---------------------"
    if test_endpoint "GET" "/api/analytics" "Analytics Dashboard"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    log_result ""
    
    # Test 6: Memory Creation (Expected to fail)
    log_result "📝 MEMORY CREATION ENDPOINT (Known Issue)"
    log_result "-----------------------------------------"
    memory_data='{"content":"Test memory","type":"note","tags":["test"]}'
    test_endpoint "POST" "/api/memories" "Memory Creation API" "$memory_data"
    ((total_tests++))
    log_result "   ℹ️  Note: This endpoint is expected to fail with 'Invalid API key' error"
    log_result ""
    
    # Test 7: Static Assets (if any)
    log_result "📁 STATIC ASSETS CHECK"
    log_result "----------------------"
    if test_endpoint "GET" "/favicon.ico" "Favicon"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    log_result ""
    
    # Server status check
    log_result "🖥️  SERVER STATUS CHECK"
    log_result "-----------------------"
    
    # Check server response time
    response_time=$(curl -s -w "%{time_total}" -o /dev/null "$SERVER_URL/health" 2>/dev/null || echo "failed")
    if [ "$response_time" != "failed" ]; then
        log_result "✅ Server response time: ${response_time}s"
        if (( $(echo "$response_time < 1.0" | bc -l) )); then
            log_result "   🚀 Excellent response time"
        elif (( $(echo "$response_time < 3.0" | bc -l) )); then
            log_result "   👍 Good response time"
        else
            log_result "   ⚠️  Slow response time"
        fi
    else
        log_result "❌ Could not measure response time"
    fi
    
    log_result ""
    
    # Final Summary
    log_result "📋 TEST SUMMARY"
    log_result "==============="
    log_result "Total Tests: $total_tests"
    log_result "Passed: $passed_tests"
    log_result "Failed: $((total_tests - passed_tests))"
    
    success_rate=$((passed_tests * 100 / total_tests))
    log_result "Success Rate: $success_rate%"
    
    if [ $success_rate -ge 80 ]; then
        log_result "🎉 OVERALL STATUS: ✅ EXCELLENT - Server is highly functional"
    elif [ $success_rate -ge 60 ]; then
        log_result "👍 OVERALL STATUS: ✅ GOOD - Server is mostly functional"
    else
        log_result "⚠️  OVERALL STATUS: ❌ POOR - Server has significant issues"
    fi
    
    log_result ""
    log_result "🕐 Test completed at: $(date)"
    log_result "📁 Results saved to: $RESULTS_FILE"
    
    # Display quick summary to console
    echo ""
    echo -e "${BLUE}=== QUICK SUMMARY ===${NC}"
    echo -e "Server URL: ${GREEN}$SERVER_URL${NC}"
    echo -e "Tests Passed: ${GREEN}$passed_tests${NC}/${total_tests}"
    echo -e "Success Rate: ${GREEN}$success_rate%${NC}"
    echo -e "Full results: ${YELLOW}$RESULTS_FILE${NC}"
}

# Run the tests
main "$@"
