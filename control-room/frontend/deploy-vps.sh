#!/bin/bash

# VPS Deployment Script for Control Room Frontend
# This script automates the deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/lanonasis/the-fixer-initiative/control-room/frontend"
LOG_DIR="/var/log/pm2"
ENV_FILE="${APP_DIR}/.env.production"

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    print_info "Checking requirements..."
    
    # Check Node.js/Bun
    if command -v bun &> /dev/null; then
        print_info "Bun found: $(bun --version)"
        PACKAGE_MANAGER="bun"
    elif command -v node &> /dev/null; then
        print_info "Node.js found: $(node --version)"
        PACKAGE_MANAGER="npm"
    else
        print_error "Node.js or Bun not found. Please install Node.js 18+ or Bun."
        exit 1
    fi
    
    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        print_error "PM2 not found. Install with: npm install -g pm2"
        exit 1
    fi
    print_info "PM2 found: $(pm2 --version)"
    
    # Check if app directory exists
    if [ ! -d "$APP_DIR" ]; then
        print_error "App directory not found: $APP_DIR"
        exit 1
    fi
    
    print_info "Requirements check passed ✓"
}

setup_logs() {
    print_info "Setting up log directories..."
    sudo mkdir -p "$LOG_DIR"
    sudo chown -R $USER:$USER "$LOG_DIR" || true
    print_info "Log directories ready ✓"
}

check_env_file() {
    print_info "Checking environment file..."
    
    if [ ! -f "$ENV_FILE" ]; then
        print_warn "Environment file not found: $ENV_FILE"
        print_info "Please create .env.production with required variables"
        print_info "See ENV_VARS_VPS.md for reference"
        exit 1
    fi
    
    # Check critical variables
    if ! grep -q "NEXT_PUBLIC_SUPABASE_URL=" "$ENV_FILE" || grep -q "NEXT_PUBLIC_SUPABASE_URL=https://your-project" "$ENV_FILE"; then
        print_warn "NEXT_PUBLIC_SUPABASE_URL not configured properly in $ENV_FILE"
    fi
    
    if ! grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=" "$ENV_FILE" || grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key" "$ENV_FILE"; then
        print_warn "NEXT_PUBLIC_SUPABASE_ANON_KEY not configured properly in $ENV_FILE"
    fi
    
    if ! grep -q "SUPABASE_SERVICE_ROLE_KEY=" "$ENV_FILE" || grep -q "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" "$ENV_FILE"; then
        print_warn "SUPABASE_SERVICE_ROLE_KEY not configured properly in $ENV_FILE"
    fi
    
    if ! grep -q "NEXT_PUBLIC_BASE_URL=" "$ENV_FILE" || grep -q "NEXT_PUBLIC_BASE_URL=https://yourdomain.com" "$ENV_FILE"; then
        print_warn "NEXT_PUBLIC_BASE_URL not configured properly in $ENV_FILE"
    fi
    
    print_info "Environment file check passed ✓"
}

install_dependencies() {
    print_info "Installing dependencies..."
    cd "$APP_DIR"
    
    if [ "$PACKAGE_MANAGER" = "bun" ]; then
        bun install --production=false
    else
        npm ci
    fi
    
    print_info "Dependencies installed ✓"
}

build_application() {
    print_info "Building application..."
    cd "$APP_DIR"
    
    if [ "$PACKAGE_MANAGER" = "bun" ]; then
        bun run build
    else
        npm run build
    fi
    
    if [ ! -d "${APP_DIR}/.next" ]; then
        print_error "Build failed - .next directory not found"
        exit 1
    fi
    
    print_info "Application built successfully ✓"
}

start_pm2() {
    print_info "Starting PM2 process..."
    cd "$APP_DIR"
    
    # Stop existing process if running
    pm2 stop control-room-frontend 2>/dev/null || true
    pm2 delete control-room-frontend 2>/dev/null || true
    
    # Start process
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    print_info "PM2 process started ✓"
    pm2 list
}

test_application() {
    print_info "Testing application..."
    
    # Wait a bit for app to start
    sleep 5
    
    # Test health endpoint
    if curl -f http://localhost:7779/api/ecosystem/status > /dev/null 2>&1; then
        print_info "Application health check passed ✓"
    else
        print_warn "Health check failed - check logs with: pm2 logs control-room-frontend"
    fi
}

show_summary() {
    print_info "Deployment Summary"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Application Directory: $APP_DIR"
    echo "Environment File: $ENV_FILE"
    echo "Package Manager: $PACKAGE_MANAGER"
    echo ""
    echo "PM2 Status:"
    pm2 list
    echo ""
    echo "Useful commands:"
    echo "  pm2 logs control-room-frontend    # View logs"
    echo "  pm2 restart control-room-frontend  # Restart"
    echo "  pm2 status                         # Check status"
    echo ""
    echo "Next steps:"
    echo "  1. Configure Nginx (see nginx.conf)"
    echo "  2. Set up SSL certificate (certbot)"
    echo "  3. Configure firewall (ufw)"
    echo "  4. Test your domain"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Main deployment flow
main() {
    print_info "Starting VPS deployment for Control Room Frontend..."
    echo ""
    
    check_requirements
    setup_logs
    check_env_file
    install_dependencies
    build_application
    start_pm2
    test_application
    show_summary
    
    print_info "Deployment completed! 🚀"
}

# Run main function
main
