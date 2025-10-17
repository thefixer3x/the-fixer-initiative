#!/bin/bash

# Onasis Gateway Nginx Deployment Script
# Deploys nginx configurations for both vortexcore.app and connectionpoint.tech domains

set -e

# Configuration
VPS_HOST="168.231.74.29"
VPS_PORT="2222"
VPS_USER="root"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Function to deploy nginx configuration
deploy_nginx_config() {
    local config_file=$1
    local remote_name=$2
    
    log "Deploying $config_file to VPS as $remote_name"
    
    # Copy configuration file to VPS
    scp -P $VPS_PORT "$config_file" "$VPS_USER@$VPS_HOST:/etc/nginx/sites-available/$remote_name"
    
    # Enable the site
    ssh -p $VPS_PORT "$VPS_USER@$VPS_HOST" "ln -sf /etc/nginx/sites-available/$remote_name /etc/nginx/sites-enabled/$remote_name"
    
    log "Configuration $remote_name deployed successfully"
}

# Function to test nginx configuration
test_nginx() {
    log "Testing nginx configuration on VPS"
    
    ssh -p $VPS_PORT "$VPS_USER@$VPS_HOST" "nginx -t" || error "Nginx configuration test failed"
    
    log "Nginx configuration test passed"
}

# Function to reload nginx
reload_nginx() {
    log "Reloading nginx on VPS"
    
    ssh -p $VPS_PORT "$VPS_USER@$VPS_HOST" "systemctl reload nginx"
    
    log "Nginx reloaded successfully"
}

# Function to setup SSL certificates
setup_ssl() {
    local domain=$1
    
    log "Setting up SSL certificate for $domain"
    
    ssh -p $VPS_PORT "$VPS_USER@$VPS_HOST" << EOF
        # Install certbot if not already installed
        if ! command -v certbot &> /dev/null; then
            apt update
            apt install -y certbot python3-certbot-nginx
        fi
        
        # Generate SSL certificate
        certbot --nginx -d $domain --non-interactive --agree-tos --email admin@$domain
EOF
    
    log "SSL certificate setup completed for $domain"
}

# Function to check VPS connectivity
check_connectivity() {
    log "Checking VPS connectivity"
    
    ssh -p $VPS_PORT "$VPS_USER@$VPS_HOST" "echo 'VPS connection successful'" || error "Cannot connect to VPS"
    
    log "VPS connectivity confirmed"
}

# Function to backup existing configurations
backup_configs() {
    log "Backing up existing nginx configurations"
    
    ssh -p $VPS_PORT "$VPS_USER@$VPS_HOST" << 'EOF'
        BACKUP_DIR="/root/nginx-backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Backup existing configurations
        if [ -d "/etc/nginx/sites-enabled" ]; then
            cp -r /etc/nginx/sites-enabled "$BACKUP_DIR/"
        fi
        
        if [ -d "/etc/nginx/sites-available" ]; then
            cp -r /etc/nginx/sites-available "$BACKUP_DIR/"
        fi
        
        echo "Backup created at: $BACKUP_DIR"
EOF
    
    log "Backup completed"
}

# Function to display deployment status
show_status() {
    log "Checking deployment status"
    
    ssh -p $VPS_PORT "$VPS_USER@$VPS_HOST" << 'EOF'
        echo "=== Nginx Status ==="
        systemctl status nginx --no-pager -l
        
        echo -e "\n=== Active Sites ==="
        ls -la /etc/nginx/sites-enabled/
        
        echo -e "\n=== SSL Certificates ==="
        if command -v certbot &> /dev/null; then
            certbot certificates 2>/dev/null || echo "No SSL certificates found"
        else
            echo "Certbot not installed"
        fi
        
        echo -e "\n=== Port Status ==="
        netstat -tulpn | grep -E ':(80|443|3000|3001)'
EOF
}

# Main deployment function
main() {
    echo "=== Onasis Gateway Nginx Deployment ==="
    echo "This script will deploy nginx configurations for both domains:"
    echo "- api.vortexcore.app (legacy/backup)"
    echo "- api.connectionpoint.tech (primary)"
    echo ""
    
    # Check if configuration files exist
    VORTEX_CONFIG="nginx-vortexcore-api.conf"
    CONNECTION_CONFIG="nginx-connectionpoint-api.conf"
    
    if [ ! -f "$VORTEX_CONFIG" ]; then
        warn "VortexCore config not found: $VORTEX_CONFIG"
    fi
    
    if [ ! -f "$CONNECTION_CONFIG" ]; then
        error "ConnectionPoint config not found: $CONNECTION_CONFIG"
    fi
    
    # Prompt for confirmation
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deployment cancelled"
        exit 0
    fi
    
    # Execute deployment steps
    check_connectivity
    backup_configs
    
    # Deploy connectionpoint.tech configuration (primary)
    deploy_nginx_config "$CONNECTION_CONFIG" "api-connectionpoint"
    
    # Deploy vortexcore.app configuration if it exists (backup)
    if [ -f "$VORTEX_CONFIG" ]; then
        deploy_nginx_config "$VORTEX_CONFIG" "api-vortexcore"
    fi
    
    # Test and reload nginx
    test_nginx
    reload_nginx
    
    # Show status
    show_status
    
    echo ""
    log "Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Test API endpoints: curl -I http://api.connectionpoint.tech/health"
    echo "2. Setup SSL certificates: ./deploy-nginx-configs.sh ssl"
    echo "3. Enable HTTPS redirect in nginx configurations"
    echo ""
}

# Handle SSL setup command
if [ "$1" = "ssl" ]; then
    log "Setting up SSL certificates"
    check_connectivity
    setup_ssl "api.connectionpoint.tech"
    if [ -f "nginx-vortexcore-api.conf" ]; then
        setup_ssl "api.vortexcore.app" 
    fi
    reload_nginx
    show_status
    exit 0
fi

# Handle status command
if [ "$1" = "status" ]; then
    check_connectivity
    show_status
    exit 0
fi

# Handle backup command
if [ "$1" = "backup" ]; then
    check_connectivity
    backup_configs
    exit 0
fi

# Show help
if [ "$1" = "help" ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  (no args)  Deploy nginx configurations"
    echo "  ssl        Setup SSL certificates"
    echo "  status     Show deployment status"
    echo "  backup     Backup existing configurations"
    echo "  help       Show this help message"
    echo ""
    exit 0
fi

# Run main deployment
main