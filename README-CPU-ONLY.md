# 🖥️ Voice Cloning AI - CPU Only Version

## 🚫 **KHÔNG CẦN Hugging Face Token!**

Complete Voice Cloning AI solution chạy hoàn toàn trên CPU VPS Ubuntu 22 mà KHÔNG cần GPU hay external APIs.

## ✨ **CPU-Only Features**

### 🎤 **Local Voice Cloning**
- **🚫 No Hugging Face token required**
- **🚫 No GPU needed**  
- **🚫 No external API calls during processing**
- **✅ Hoàn toàn local processing trên VPS CPU**

### 🎵 **Voice Processing Pipeline**
1. **📁 Upload**: Audio file từ user
2. **📝 Text**: Vietnamese text input
3. **🎤 Local TTS**: Generate audio từ text (edge-tts/espeak/festival)
4. **🔍 Voice Analysis**: Analyze source voice characteristics với FFmpeg
5. **🔄 Voice Transfer**: Apply source voice style lên TTS audio
6. **🎨 Enhancement**: Audio post-processing và optimization
7. **📥 Download**: Stream + full quality results

### 🔒 **SSL Automation**
- **🌐 Domain**: voice.vipdayne.net (configurable)
- **🔐 Auto SSL**: Let's Encrypt certificates
- **🔄 Auto Renewal**: 2x daily checks
- **✅ Auto Accept**: Tự động confirm SSL registration

## 🚀 **VPS Installation (Ubuntu 22)**

### **Quick Install:**
```bash
# 1. Clone repository
git clone https://github.com/dockaka222-del/kaka22.git
cd kaka22

# 2. Install CPU-only version (NO tokens required)
sudo ./scripts/vps-install-cpu-only.sh voice.vipdayne.net voice@vipdayne.net

# 3. Setup SSL automation
./scripts/ssl-setup.sh

# 4. Deploy CPU-only application
./scripts/deploy-cpu-only.sh

# 5. Access application
curl https://voice.vipdayne.net/api/health
open https://voice.vipdayne.net
```

## 🖥️ **CPU Processing Technologies**

### **Local TTS Engines:**
- **edge-tts**: Microsoft TTS với Vietnamese voices (primary)
- **espeak**: Lightweight TTS engine (fallback)
- **festival**: Traditional Linux TTS (backup)
- **sox**: Audio synthesis engine (final fallback)

### **Voice Processing:**
- **FFmpeg**: Advanced audio filters và effects
- **Voice Analysis**: Pitch, tempo, energy detection
- **Voice Transfer**: Apply source characteristics lên TTS
- **Enhancement**: Noise reduction, normalization, EQ

### **Audio Features:**
- **Pitch Shifting**: Rubberband, asetrate filters
- **Tempo Adjustment**: atempo, speed modification
- **Energy Control**: Volume, dynamics processing
- **Quality Enhancement**: Loudnorm, compressor, EQ

## 📊 **Performance Expectations**

### **VPS CPU Performance:**
| CPU Cores | RAM | Processing Time | Concurrent Users |
|-----------|-----|-----------------|------------------|
| 2 cores | 4GB | 15-45 seconds | 3-5 users |
| 4 cores | 8GB | 10-30 seconds | 8-12 users |
| 8 cores | 16GB | 5-20 seconds | 15-25 users |

### **Processing Breakdown:**
- **TTS Generation**: 2-10 seconds
- **Voice Analysis**: 3-8 seconds  
- **Voice Transfer**: 5-25 seconds
- **Enhancement**: 2-5 seconds
- **Total**: 12-48 seconds

## 🔧 **Local Dependencies**

### **System Requirements:**
```bash
# Required packages for CPU processing
sudo apt install -y \
    python3 python3-pip python3-venv \
    ffmpeg sox espeak festival \
    build-essential
```

### **Python Packages:**
```bash
# In virtual environment
pip install edge-tts librosa soundfile numpy scipy
```

### **Audio Tools:**
- **FFmpeg**: Audio/video processing
- **SoX**: Sound processing
- **eSpeak**: Speech synthesis
- **Festival**: Text-to-speech system

## 🎯 **API Endpoints (Local Only)**

### **Core APIs:**
- `POST /api/local-tts` - Local TTS generation
- `POST /api/analyze-voice` - Voice characteristic analysis
- `POST /api/cpu-voice-transfer` - Voice style transfer
- `POST /api/enhance-tts` - Audio enhancement
- `POST /api/voice-clone` - Complete CPU processing pipeline

### **Testing:**
```bash
# Test local TTS
curl -X POST http://localhost:3000/api/local-tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Test CPU TTS","engine":"edge-tts"}'

# Test voice analysis
curl -X POST http://localhost:3000/api/analyze-voice \
  -H "Content-Type: application/json" \
  -d '{"audioPath":"/uploads/test.wav"}'

# Test complete pipeline
curl -X POST http://localhost:3000/api/voice-clone \
  -H "Content-Type: application/json" \
  -d '{
    "text":"Test voice cloning CPU only",
    "audioFilePath":"/uploads/test.wav",
    "settings":{"optimizeForCPU":true}
  }'
```

## 🛠️ **Management Commands**

### **Application:**
```bash
pm2 status                      # Process status
pm2 monit                       # Real-time monitoring
pm2 logs voice-cloning-ai-cpu   # View logs
pm2 restart voice-cloning-ai-cpu # Restart
```

### **SSL:**
```bash
voice-ssl status                # SSL + app status
voice-ssl renew                 # Manual renewal
voice-ssl new-domain new.com    # Change domain
```

### **System:**
```bash
htop                           # Resource monitoring
df -h                          # Disk usage
free -h                        # Memory usage
```

## 🔍 **CPU-Only Architecture**

### **No External Dependencies:**
- ❌ No Hugging Face API calls
- ❌ No GPU processing
- ❌ No internet required during voice processing
- ✅ Complete local processing
- ✅ All data stays on your VPS

### **Processing Flow:**
```
1. User uploads audio file
2. User enters Vietnamese text
3. Local TTS generates audio from text
4. FFmpeg analyzes source voice characteristics
5. Python/FFmpeg transfers voice style to TTS audio
6. Audio enhancement và post-processing
7. User downloads result (no data leaves VPS)
```

## 🚦 **Troubleshooting**

### **Common Issues:**

**1. TTS Not Working:**
```bash
# Check edge-tts
source venv/bin/activate
edge-tts --list-voices | grep vi-VN

# Check espeak
espeak -v vi "test" -w test.wav
```

**2. Audio Processing Fails:**
```bash
# Check FFmpeg
ffmpeg -version

# Check sox
sox --version
```

**3. High CPU Usage:**
```bash
# Reduce PM2 instances
pm2 scale voice-cloning-ai-cpu 1

# Check settings
cat .env.production | grep CPU
```

**4. Memory Issues:**
```bash
# Add swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📈 **Optimization Tips**

### **For Low-End VPS (2 CPU, 4GB):**
- Set `MAX_CONCURRENT_VOICE_CLONE=1`
- Use single PM2 instance
- Enable swap space
- Use espeak as primary TTS (faster)

### **For High-End VPS (4+ CPU, 8GB+):**
- Set `MAX_CONCURRENT_VOICE_CLONE=2`
- Use PM2 clustering
- Enable voice transfer features
- Use edge-tts as primary

---

## 🎉 **CPU-Only Voice Cloning Ready!**

**🌐 GitHub**: https://github.com/dockaka222-del/kaka22  
**🖥️ CPU Only**: No GPU required  
**🚫 No Tokens**: No Hugging Face account needed  
**🔒 SSL**: Auto-management included  
**🇻🇳 Vietnamese**: Full support  

**Clone**: `git clone https://github.com/dockaka222-del/kaka22.git`

🎵 **Voice cloning powered by CPU only!** ✨