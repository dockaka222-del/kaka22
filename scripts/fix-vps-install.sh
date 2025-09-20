#!/bin/bash
# Fix VPS Installation for current directory

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_header() { echo -e "${PURPLE}🔧 $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Configuration
DOMAIN="${1:-voice.vipdayne.net}"
EMAIL="${2:-voice@vipdayne.net}"
CURRENT_DIR=$(pwd)

print_header "Voice Cloning AI - Fix Installation"
echo "=================================="
print_info "Current directory: ${CURRENT_DIR}"
print_info "Domain: ${DOMAIN}"
print_info "Email: ${EMAIL}"

# Check if we're in the right place
if [[ ! -f "package.json" ]] && [[ ! -f "package-cpu-only.json" ]]; then
    print_error "No package.json found. Please run from kaka22 directory."
    exit 1
fi

# Auto-detect VPS IP
print_info "🌐 Auto-detecting VPS IP..."
VPS_IP=$(curl -s https://api.ipify.org || curl -s https://ifconfig.me/ip || echo "")

if [[ -z "$VPS_IP" ]]; then
    print_error "Could not detect VPS IP"
    exit 1
fi

print_success "VPS IP: ${VPS_IP}"

# Use package-cpu-only.json if available
if [[ -f "package-cpu-only.json" ]]; then
    print_info "📦 Using CPU-only package configuration..."
    cp package-cpu-only.json package.json
fi

# Install Node.js dependencies in current directory
print_info "📦 Installing Node.js dependencies..."
if command -v pnpm &> /dev/null; then
    pnpm install
else
    npm install
fi

# Create required directories
print_info "📁 Creating directories..."
mkdir -p public/{uploads,temp} logs
chmod 755 public/{uploads,temp}

# Create CPU-only environment configuration
print_info "⚙️ Creating CPU-only environment..."
cat > .env.production << EOF
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# CPU-Only Mode (NO Hugging Face token required)
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

# Local TTS (No external APIs)
VIETNAMESE_VOICE=vi-VN-HoaiMyNeural
TTS_ENGINE=edge-tts
TTS_FALLBACK_ENGINES=espeak,festival,sox
LOCAL_TTS_ONLY=true

# CPU Processing
MAX_CONCURRENT_TTS=1
MAX_CONCURRENT_VOICE_CLONE=1
CPU_OPTIMIZATION=true
MEMORY_LIMIT=2048

# Security
SESSION_SECRET=cpu-voice-cloning-$(openssl rand -hex 16)
CORS_ORIGIN=https://${DOMAIN}
FORCE_HTTPS=true

# Performance
CLEANUP_INTERVAL=300000
TEMP_FILE_TTL=1800000
AUTO_CLEANUP=true
EOF

# Create PM2 ecosystem config
print_info "⚙️ Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'voice-cloning-ai-cpu',
    script: 'npm',
    args: 'start',
    cwd: '${CURRENT_DIR}',
    instances: 1, // Single instance for 4GB VPS
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
    
    error_file: '${CURRENT_DIR}/logs/error.log',
    out_file: '${CURRENT_DIR}/logs/output.log',
    log_file: '${CURRENT_DIR}/logs/combined.log',
    time: true,
    autorestart: true,
    watch: false
  }]
};
EOF

# Create log directory
mkdir -p logs

# Build application
print_info "🔨 Building application..."
if npm run build; then
    print_success "Build completed"
else
    print_error "Build failed"
    exit 1
fi

# Test TTS engines status
print_info "🧪 Testing TTS engines..."

# Test edge-tts
if [[ -d "venv" ]]; then
    source venv/bin/activate
    
    if edge-tts --text "Test" --voice "vi-VN-HoaiMyNeural" --write-media test.wav 2>/dev/null; then
        print_success "edge-tts: ✅ Working"
        rm -f test.wav
    else
        print_warning "edge-tts: ❌ Not working"
    fi
    
    deactivate
else
    print_warning "Python virtual environment not found"
fi

# Test espeak
if espeak -v vi "Test" -w test_espeak.wav 2>/dev/null; then
    print_success "espeak: ✅ Working"
    rm -f test_espeak.wav
else
    print_warning "espeak: ❌ Not available"
fi

# Test ffmpeg
if ffmpeg -f lavfi -i anullsrc=r=16000:cl=mono -t 1 -acodec pcm_s16le test_ffmpeg.wav -y 2>/dev/null; then
    print_success "FFmpeg: ✅ Working"
    rm -f test_ffmpeg.wav
else
    print_error "FFmpeg: ❌ Not working"
fi

# Start application
print_info "🚀 Starting application..."
pm2 start ecosystem.config.js --env production

# Save PM2 config
pm2 save

print_header "🎉 Fix Installation Complete!"
echo "=============================="

print_success "✅ Application directory: ${CURRENT_DIR}"
print_success "✅ Environment configured"
print_success "✅ PM2 process started"

# Get current status
pm2 status

print_header "🔧 Next Steps:"
echo "1. Setup SSL: ./scripts/ssl-setup.sh ${DOMAIN} ${EMAIL}"
echo "2. Test app: curl http://localhost:3000/api/health"
echo "3. Monitor: pm2 monit"

print_info "📋 Available commands:"
echo "• pm2 status - Process status"
echo "• pm2 logs voice-cloning-ai-cpu - View logs"
echo "• pm2 restart voice-cloning-ai-cpu - Restart app"

print_success "🎵 Voice Cloning AI CPU-only ready in current directory! ✨"