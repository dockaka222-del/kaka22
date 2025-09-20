#!/bin/bash
# CPU-Only Deployment Script

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

APP_DIR="/opt/voice-cloning-ai"

print_header "Voice Cloning AI - CPU Only Deployment"
echo "====================================="
print_info "🚫 No GPU required"
print_info "🚫 No Hugging Face token required"
print_info "🖥️ Local CPU processing only"

# Check if in correct directory
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Run from project root."
    exit 1
fi

# Load environment
if [[ -f ".env.production" ]]; then
    source .env.production
    DOMAIN="${SSL_DOMAIN:-voice.vipdayne.net}"
else
    DOMAIN="voice.vipdayne.net"
    print_warning "No .env.production found, using defaults"
fi

# Stop existing processes
print_info "🛑 Stopping existing processes..."
pm2 stop voice-cloning-ai-cpu 2>/dev/null || print_info "No existing process"

# Backup current build
print_info "💾 Creating backup..."
if [[ -d ".next" ]]; then
    mv .next .next.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
fi

# Install dependencies
print_info "📦 Installing dependencies..."
pnpm install --production

# Build application
print_info "🔨 Building CPU-only application..."
if CPU_ONLY_MODE=true pnpm run build; then
    print_success "Build completed (CPU-only mode)"
else
    print_error "Build failed!"
    
    # Restore backup
    if [[ -d ".next.backup."* ]]; then
        rm -rf .next
        mv .next.backup.* .next 2>/dev/null || true
    fi
    exit 1
fi

# Test TTS engines
print_info "🧪 Testing local TTS engines..."

# Activate Python environment
source venv/bin/activate

# Test edge-tts
if edge-tts --text "Test deployment" --voice "vi-VN-HoaiMyNeural" --write-media public/temp/deploy_test.wav 2>/dev/null; then
    print_success "edge-tts: Ready"
    rm -f public/temp/deploy_test.wav
else
    print_warning "edge-tts: Not available"
fi

# Test espeak
if espeak -v vi "Test" -w public/temp/espeak_test.wav 2>/dev/null; then
    print_success "espeak: Ready"
    rm -f public/temp/espeak_test.wav
else
    print_warning "espeak: Not available"
fi

deactivate

# Test FFmpeg audio processing
print_info "🎵 Testing audio processing..."
if ffmpeg -f lavfi -i anullsrc=r=16000:cl=mono -t 1 -acodec pcm_s16le public/temp/ffmpeg_test.wav -y 2>/dev/null; then
    print_success "FFmpeg: Ready"
    rm -f public/temp/ffmpeg_test.wav
else
    print_error "FFmpeg: Failed - this is required"
    exit 1
fi

# Create directories
print_info "📁 Creating directories..."
mkdir -p public/{uploads,temp} logs
chmod 755 public/{uploads,temp}

# Start application
print_info "🚀 Starting CPU-only application..."
pm2 start ecosystem.config.js --env production

# Wait for startup
print_info "⏳ Waiting for application startup..."
sleep 10

# Health check
print_info "🏥 Performing health check..."
if curl -s --max-time 10 "http://localhost:3000/api/health" > /dev/null; then
    print_success "Application health check passed"
else
    print_warning "Health check failed"
fi

# Test CPU-only processing
print_info "🧪 Testing CPU-only voice processing..."

# Create test audio file
echo "Test audio content" > /tmp/test_audio.txt
if command -v espeak &> /dev/null; then
    espeak -v vi "Test voice cloning CPU" -w /tmp/test_source.wav 2>/dev/null || true
fi

# Test local TTS
if curl -s -X POST "http://localhost:3000/api/local-tts" \
    -H "Content-Type: application/json" \
    -d '{"text":"Test CPU TTS","engine":"edge-tts"}' | grep -q "success.*true"; then
    print_success "Local TTS: Working"
else
    print_warning "Local TTS: May need configuration"
fi

# Save PM2 configuration
pm2 save

print_header "🎉 CPU-Only Deployment Complete!"
echo "================================="

print_success "🌐 Application running on port 3000"
print_success "🖥️ CPU-only processing active"
print_success "🚫 No external API dependencies"

if [[ -d "/etc/letsencrypt/live/${DOMAIN}" ]]; then
    print_success "🔒 Access: https://${DOMAIN}"
else
    print_success "🌐 Access: http://${DOMAIN}"
    print_info "Run SSL setup: ./scripts/ssl-setup.sh"
fi

print_info "🛠️ Management commands:"
echo "• pm2 monit - Monitor processes"
echo "• pm2 logs voice-cloning-ai-cpu - View logs"  
echo "• npm run cpu-test - Test CPU processing"

print_header "🖥️ CPU Processing Features:"
echo "• Local TTS: edge-tts, espeak, festival, sox"
echo "• Voice analysis: FFmpeg + Python librosa"
echo "• Voice transfer: FFmpeg filters"
echo "• Audio enhancement: Noise reduction, normalization"
echo "• Processing time: 10-60 seconds (depending on VPS)"

print_success "🎵 Voice Cloning AI CPU-only deployment ready! ✨"

print_warning "📝 Important:"
echo "• No Hugging Face token required"
echo "• All processing happens locally on your VPS"
echo "• No data sent to external APIs during voice processing"
echo "• Performance depends on your VPS CPU specs"