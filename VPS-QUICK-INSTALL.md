# 🖥️ **Voice Cloning AI - VPS Quick Install (CPU Only)**

## 🚫 **KHÔNG CẦN Hugging Face Token!**

Repository đã ready trên GitHub: https://github.com/dockaka222-del/kaka22

## 🚀 **VPS Ubuntu 22 Installation:**

### **Step 1: Clone Repository**
```bash
cd /root
git clone https://github.com/dockaka222-del/kaka22.git
cd kaka22
```

### **Step 2: Make Scripts Executable**
```bash
chmod +x scripts/*.sh
```

### **Step 3: Install CPU-Only Version**
```bash
sudo ./scripts/vps-install-cpu-only.sh voice.vipdayne.net voice@vipdayne.net
```

### **Step 4: Setup SSL Automation**
```bash
./scripts/ssl-setup.sh voice.vipdayne.net voice@vipdayne.net
```

### **Step 5: Deploy Application**
```bash
./scripts/deploy-cpu-only.sh
```

### **Step 6: Verify Installation**
```bash
# Check SSL and app status
voice-ssl status

# Test API
curl https://voice.vipdayne.net/api/health

# Monitor processes
pm2 monit
```

## ✅ **Expected Results:**

After successful installation:
```bash
✅ VPS IP: [Auto-detected]
✅ edge-tts: Working
✅ espeak: Working
✅ FFmpeg: Ready
✅ SSL Certificate: Registered for voice.vipdayne.net
✅ Application: Running on PM2
✅ HTTPS: https://voice.vipdayne.net
✅ Health Check: API responding
```

## 🛠️ **Management Commands:**

```bash
# SSL management
voice-ssl status              # Complete status
voice-ssl renew               # Manual renewal
voice-ssl new-domain new.com  # Change domain

# Application management
pm2 status                    # Process status
pm2 logs voice-cloning-ai-cpu # View logs
pm2 restart voice-cloning-ai-cpu # Restart

# System monitoring
htop                          # Resource usage
df -h                         # Disk space
```

## 🎵 **Voice Cloning Features:**

### **Processing Pipeline (100% Local):**
1. **Upload**: Audio file (WAV, MP3, M4A, OGG, WebM)
2. **Text**: Vietnamese text input (max 2000 chars)
3. **TTS**: Local generation với edge-tts/espeak/festival
4. **Analysis**: Voice characteristics với FFmpeg
5. **Transfer**: Apply voice style lên TTS audio
6. **Download**: Stream + full quality results

### **No External Dependencies:**
- ✅ No Hugging Face token
- ✅ No GPU required
- ✅ No internet during processing
- ✅ All data stays on VPS
- ✅ Complete privacy

---

## 🎯 **Your VPS Commands:**

Based on your current situation:

```bash
# You're in the right directory, now run:
chmod +x scripts/*.sh

# Install CPU-only version
sudo ./scripts/vps-install-cpu-only.sh voice.vipdayne.net voice@vipdayne.net

# Setup SSL
./scripts/ssl-setup.sh

# Deploy
./scripts/deploy-cpu-only.sh

# Access
curl https://voice.vipdayne.net/api/health
```

🎵 **Voice Cloning AI CPU-only ready for your VPS!** ✨