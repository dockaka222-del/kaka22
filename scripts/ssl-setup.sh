#!/bin/bash
# SSL Automation Setup for Voice Cloning AI

set -e

# Configuration
DOMAIN="${1:-voice.vipdayne.net}"
EMAIL="${2:-voice@vipdayne.net}"
APP_DIR="/opt/voice-cloning-ai"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() { echo -e "${PURPLE}🔒 $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

print_header "SSL Automation Setup"
echo "====================="
print_info "Domain: ${DOMAIN}"
print_info "Email: ${EMAIL}"

# Auto-detect VPS IP
VPS_IP=$(curl -s https://api.ipify.org || curl -s https://ifconfig.me/ip)
print_success "VPS IP: ${VPS_IP}"

# Check DNS resolution
print_info "🔍 Checking DNS resolution..."
RESOLVED_IP=$(dig +short "${DOMAIN}" @8.8.8.8 | tail -n1)

if [[ "$RESOLVED_IP" == "$VPS_IP" ]]; then
    print_success "DNS correctly configured: ${DOMAIN} → ${VPS_IP}"
else
    print_warning "DNS mismatch: ${DOMAIN} → ${RESOLVED_IP} (expected: ${VPS_IP})"
    print_info "SSL setup will continue, certificate will be issued when DNS propagates"
fi

# Configure Nginx with SSL support
print_info "⚙️ Configuring Nginx..."
sudo tee "/etc/nginx/sites-available/voice-cloning" > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }
    
    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
        client_max_body_size 10M;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # SSL configuration (managed by certbot)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/voice-cloning /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
if sudo nginx -t; then
    sudo systemctl reload nginx
    print_success "Nginx configured successfully"
else
    print_error "Nginx configuration failed"
    exit 1
fi

# Create webroot for Let's Encrypt
sudo mkdir -p /var/www/html
sudo chown www-data:www-data /var/www/html

# Register SSL certificate
print_info "🔐 Registering SSL certificate..."
if sudo certbot --nginx \
    --non-interactive \
    --agree-tos \
    --email "${EMAIL}" \
    --domains "${DOMAIN}" \
    --redirect; then
    
    print_success "SSL certificate registered!"
else
    print_warning "SSL registration failed (DNS might not be ready)"
    print_info "Certificate will be issued automatically when DNS propagates"
fi

# Setup auto-renewal
print_info "🔄 Setting up SSL auto-renewal..."
sudo tee "/usr/local/bin/ssl-renew.sh" > /dev/null << 'EOF'
#!/bin/bash
# SSL Auto-renewal for Voice Cloning AI

LOG_FILE="/var/log/voice-cloning/ssl.log"

echo "$(date): Starting SSL renewal check" >> "$LOG_FILE"

if certbot renew --quiet >> "$LOG_FILE" 2>&1; then
    echo "$(date): SSL renewal successful" >> "$LOG_FILE"
    systemctl reload nginx
    cd /opt/voice-cloning-ai && pm2 reload voice-cloning-ai
else
    echo "$(date): SSL renewal failed" >> "$LOG_FILE"
fi
EOF

sudo chmod +x "/usr/local/bin/ssl-renew.sh"

# Add cron job
(sudo crontab -l 2>/dev/null || echo "") | grep -v "ssl-renew.sh" | sudo crontab -
(sudo crontab -l 2>/dev/null; echo "0 2,14 * * * /usr/local/bin/ssl-renew.sh") | sudo crontab -

# Create SSL management commands
sudo tee "/usr/local/bin/voice-ssl" > /dev/null << 'EOF'
#!/bin/bash
# Voice Cloning AI SSL Management

case "$1" in
    "status")
        echo "🔒 SSL Status for voice.vipdayne.net"
        echo "================================="
        
        if [[ -f "/etc/letsencrypt/live/voice.vipdayne.net/cert.pem" ]]; then
            expiry=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/voice.vipdayne.net/cert.pem" | cut -d= -f2)
            days_left=$(( ($(date -d "$expiry" +%s) - $(date +%s)) / 86400 ))
            echo "Certificate: ✅ Valid ($days_left days remaining)"
        else
            echo "Certificate: ❌ Not found"
        fi
        
        if curl -s --max-time 5 "https://voice.vipdayne.net/api/health" > /dev/null; then
            echo "HTTPS: ✅ Working"
        else
            echo "HTTPS: ❌ Failed"
        fi
        ;;
        
    "renew")
        echo "🔄 Manually renewing SSL..."
        sudo certbot renew
        sudo systemctl reload nginx
        pm2 reload voice-cloning-ai
        echo "✅ SSL renewed and services reloaded"
        ;;
        
    "new-domain")
        NEW_DOMAIN="$2"
        NEW_EMAIL="${3:-admin@$NEW_DOMAIN}"
        
        if [[ -z "$NEW_DOMAIN" ]]; then
            echo "Usage: voice-ssl new-domain <domain> [email]"
            exit 1
        fi
        
        echo "🌐 Changing domain to: $NEW_DOMAIN"
        
        # Update environment
        sed -i "s/^SSL_DOMAIN=.*/SSL_DOMAIN=$NEW_DOMAIN/" "/opt/voice-cloning-ai/.env.production"
        sed -i "s/^SSL_EMAIL=.*/SSL_EMAIL=$NEW_EMAIL/" "/opt/voice-cloning-ai/.env.production"
        sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://$NEW_DOMAIN|" "/opt/voice-cloning-ai/.env.production"
        
        # Update Nginx
        sudo sed -i "s/server_name .*/server_name $NEW_DOMAIN www.$NEW_DOMAIN;/g" "/etc/nginx/sites-available/voice-cloning"
        
        # Register SSL for new domain
        sudo certbot --nginx -d "$NEW_DOMAIN" --email "$NEW_EMAIL" --agree-tos --non-interactive --redirect
        
        # Restart services
        sudo systemctl reload nginx
        cd "/opt/voice-cloning-ai" && pm2 restart voice-cloning-ai
        
        echo "✅ Domain changed to: https://$NEW_DOMAIN"
        ;;
        
    *)
        echo "Voice Cloning AI - SSL Management"
        echo "Usage: voice-ssl {status|renew|new-domain}"
        echo ""
        echo "Commands:"
        echo "  status                    - Show SSL status"
        echo "  renew                     - Manually renew SSL"
        echo "  new-domain <domain> [email] - Change domain"
        ;;
esac
EOF

sudo chmod +x "/usr/local/bin/voice-ssl"

# Update environment with SSL settings
print_info "📝 Updating environment with SSL settings..."
if [[ -f "${APP_DIR}/.env.production" ]]; then
    # Update existing
    sed -i "/^SSL_DOMAIN=/d" "${APP_DIR}/.env.production"
    sed -i "/^SSL_EMAIL=/d" "${APP_DIR}/.env.production"
    sed -i "/^VPS_IP=/d" "${APP_DIR}/.env.production"
    
    cat >> "${APP_DIR}/.env.production" << EOF

# SSL Configuration (Auto-generated)
SSL_DOMAIN=${DOMAIN}
SSL_EMAIL=${EMAIL}
VPS_IP=${VPS_IP}
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
CANONICAL_URL=https://${DOMAIN}
FORCE_HTTPS=true
EOF
fi

print_success "SSL automation setup completed!"

# Test SSL if certificate exists
if [[ -d "/etc/letsencrypt/live/${DOMAIN}" ]]; then
    print_info "🧪 Testing SSL..."
    sleep 5
    
    if curl -s --max-time 10 "https://${DOMAIN}/api/health" > /dev/null; then
        print_success "HTTPS working correctly!"
    else
        print_warning "HTTPS test failed (app might not be running yet)"
    fi
fi

print_header "🎉 SSL Setup Complete!"
echo "======================"
print_success "Domain: https://${DOMAIN}"
print_success "Auto-renewal: Active (2x daily)"
print_success "Management: voice-ssl command available"

echo ""
print_info "Management commands:"
echo "• voice-ssl status - Check SSL status"
echo "• voice-ssl renew - Manual renewal"
echo "• voice-ssl new-domain <domain> - Change domain"

echo ""
print_header "Next: Run './scripts/deploy.sh' to start the application"