#!/bin/bash
# Voice Cloning AI - CPU Only Installation (NO Hugging Face token required)
# Ubuntu 22.04 LTS VPS

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() { echo -e "${PURPLE}🖥️ $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Configuration
DOMAIN="${1:-voice.vipdayne.net}"
EMAIL="${2:-voice@vipdayne.net}"
APP_DIR="/opt/voice-cloning-ai"

print_header "Voice Cloning AI - CPU Only Installation"
echo "========================================"
print_info "🚫 NO Hugging Face token required"
print_info "🖥️ CPU-only processing"
print_info "🌐 Domain: ${DOMAIN}"
print_info "📧 Email: ${EMAIL}"
echo ""

# Check Ubuntu version
if ! grep -q "Ubuntu 22" /etc/os-release 2>/dev/null; then
    print_warning "This script is optimized for Ubuntu 22.04"
fi

# Auto-detect VPS IP
print_info "🌐 Auto-detecting VPS IP..."
VPS_IP=$(curl -s https://api.ipify.org || curl -s https://ifconfig.me/ip || echo "")

if [[ -z "$VPS_IP" ]]; then
    print_error "Could not detect VPS IP"
    exit 1
fi

print_success "VPS IP: ${VPS_IP}"

# System update
print_info "📦 Updating system..."
sudo apt update && sudo apt upgrade -y

# Install CPU-only dependencies (NO GPU packages)
print_info "🔧 Installing CPU-only dependencies..."
sudo apt install -y \
    curl wget git build-essential \
    python3 python3-pip python3-venv \
    ffmpeg sox espeak espeak-data festival \
    nginx ufw htop \
    certbot python3-certbot-nginx \
    jq dnsutils

# Install Node.js 18
print_info "📦 Installing Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install global packages
sudo npm install -g pnpm pm2

print_success "System dependencies installed"

# Create application directories
print_info "📁 Creating application structure..."
sudo mkdir -p ${APP_DIR} /var/log/voice-cloning
sudo chown $USER:$USER ${APP_DIR}

cd ${APP_DIR}

# Clone repository if not exists
if [[ ! -d ".git" ]]; then
    print_info "📥 Cloning repository..."
    git clone https://github.com/dockaka222-del/kaka22.git .
else
    print_info "📄 Repository exists, pulling latest..."
    git pull origin main
fi

# Setup Python TTS environment (CPU-only)
print_info "🎤 Setting up CPU-only TTS environment..."
python3 -m venv venv
source venv/bin/activate

# Install CPU-only Python packages
pip install --upgrade pip
pip install edge-tts
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install librosa soundfile numpy scipy

# Test TTS installation
print_info "🧪 Testing TTS engines..."

# Test edge-tts
if edge-tts --text "Test CPU processing" --voice "vi-VN-HoaiMyNeural" --write-media test_edge.wav 2>/dev/null; then
    print_success "edge-tts: ✅ Working"
    rm -f test_edge.wav
else
    print_warning "edge-tts: ❌ Failed"
fi

# Test espeak
if espeak -v vi "Test CPU" -w test_espeak.wav 2>/dev/null; then
    print_success "espeak: ✅ Working"
    rm -f test_espeak.wav
else
    print_warning "espeak: ❌ Failed"
fi

# Test festival
if echo "Test CPU" | festival --tts 2>/dev/null; then
    print_success "festival: ✅ Working"
else
    print_warning "festival: ❌ Failed"
fi

# Test sox
if sox -n test_sox.wav synth 1 sine 440 2>/dev/null; then
    print_success "sox: ✅ Working"
    rm -f test_sox.wav
else
    print_warning "sox: ❌ Failed"
fi

deactivate

# Install Node.js dependencies
print_info "📦 Installing Node.js dependencies..."
pnpm install

# Create CPU-only environment
print_info "⚙️ Creating CPU-only environment..."
cat > .env.production << EOF
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# CPU-Only Configuration
CPU_ONLY_MODE=true
NO_GPU_REQUIRED=true
LOCAL_PROCESSING_ONLY=true

# SSL Configuration
SSL_DOMAIN=${DOMAIN}
SSL_EMAIL=${EMAIL}
VPS_IP=${VPS_IP}
NEXT_PUBLIC_APP_URL=https://${DOMAIN}

# File Settings
MAX_FILE_SIZE=10485760
SUPPORTED_FORMATS=wav,mp3,m4a,ogg,webm

# Local TTS Configuration (No external APIs)
VIETNAMESE_VOICE=vi-VN-HoaiMyNeural
TTS_ENGINE=edge-tts
TTS_FALLBACK_ENGINES=espeak,festival,sox
LOCAL_TTS_ONLY=true

# CPU Processing Settings
MAX_CONCURRENT_TTS=1
MAX_CONCURRENT_VOICE_CLONE=1
CPU_OPTIMIZATION=true
MEMORY_LIMIT=2048

# Security
SESSION_SECRET=cpu-voice-cloning-$(openssl rand -hex 16)
CORS_ORIGIN=https://${DOMAIN}
FORCE_HTTPS=true

# Performance Optimization
CLEANUP_INTERVAL=300000
TEMP_FILE_TTL=1800000
AUTO_CLEANUP=true
EOF

# Configure firewall
print_info "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Create service user
print_info "👤 Creating service user..."
sudo useradd -r -s /bin/false voiceclone 2>/dev/null || true

# Set permissions
sudo chown -R voiceclone:voiceclone ${APP_DIR}
sudo chmod -R 755 ${APP_DIR}/public
sudo chmod +x ${APP_DIR}/scripts/*

# Create CPU-only ecosystem config
print_info "⚙️ Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'voice-cloning-ai-cpu',
    script: 'npm',
    args: 'start',
    instances: 2, // Limited for CPU-only
    exec_mode: 'cluster',
    
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0',
      CPU_ONLY_MODE: 'true',
      NODE_OPTIONS: '--max-old-space-size=2048 --optimize-for-size'
    },
    
    max_memory_restart: '2G',
    min_uptime: '10s',
    max_restarts: 10,
    
    error_file: '/var/log/voice-cloning/error.log',
    out_file: '/var/log/voice-cloning/output.log',
    log_file: '/var/log/voice-cloning/combined.log',
    time: true,
    autorestart: true,
    watch: false
  }]
};
EOF

print_success "CPU-only installation completed!"

print_header "🎯 Next Steps:"
echo "1. Setup SSL: ./scripts/ssl-setup.sh ${DOMAIN} ${EMAIL}"
echo "2. Deploy app: ./scripts/deploy-cpu.sh"
echo "3. Test: npm run cpu-test"
echo "4. Access: https://${DOMAIN}"

print_header "🖥️ CPU-Only Features:"
echo "• ✅ Local TTS engines (edge-tts, espeak, festival, sox)"
echo "• ✅ FFmpeg audio processing"
echo "• ✅ Voice analysis và transfer"
echo "• ✅ SSL automation"
echo "• ✅ Hoàn toàn độc lập (no external APIs during processing)"

print_warning "📝 Notes:"
echo "• No Hugging Face token required"
echo "• No GPU needed"
echo "• All processing local trên CPU"
echo "• Processing time: 10-60 seconds depending on VPS specs"

print_success "🎵 Voice Cloning AI CPU-only ready for deployment! ✨"