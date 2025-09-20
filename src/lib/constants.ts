import { VoiceCloningSettings, SettingsPreset } from '@/types/voice-cloning';

// File upload constraints
export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FORMATS: ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/webm'],
  ALLOWED_EXTENSIONS: ['.wav', '.mp3', '.m4a', '.ogg', '.webm']
} as const;

// Default voice cloning settings - CPU optimized
export const DEFAULT_SETTINGS: VoiceCloningSettings = {
  // Advanced mode (/predict) settings
  diffusionSteps: 15, // Reduced for CPU efficiency
  lengthAdjust: 1.0,
  intelligebilityCfgRate: 0,
  similarityCfgRate: 0.7,
  topP: 0.8, // Optimized value
  temperature: 1.0,
  repetitionPenalty: 1.0,
  convertStyle: false,
  anonymizationOnly: false,
  
  // Simple mode (/predict_1) settings  
  inferenceCfgRate: 0.7,
  f0Condition: false,
  autoF0Adjust: true,
  pitchShift: 0,
  
  // Mode selection
  useAdvancedMode: false, // Default to simple mode for CPU
  optimizeForCPU: true
};

// Settings presets cho VPS CPU optimization
export const SETTINGS_PRESETS: SettingsPreset[] = [
  {
    name: 'Mặc định (CPU)',
    description: 'Tối ưu cho VPS CPU, cân bằng tốc độ và chất lượng',
    settings: { ...DEFAULT_SETTINGS, diffusionSteps: 10, optimizeForCPU: true }
  },
  {
    name: 'Chất lượng cao',
    description: 'Chất lượng tốt nhất, xử lý chậm hơn',
    settings: {
      ...DEFAULT_SETTINGS,
      useAdvancedMode: false, // Keep simple for CPU
      diffusionSteps: 20,
      similarityCfgRate: 0.8,
      temperature: 0.9,
      optimizeForCPU: true
    }
  },
  {
    name: 'Xử lý nhanh',
    description: 'Tốc độ cao nhất cho VPS CPU',
    settings: {
      ...DEFAULT_SETTINGS,
      useAdvancedMode: false,
      diffusionSteps: 5,
      inferenceCfgRate: 0.5,
      optimizeForCPU: true
    }
  },
  {
    name: 'Giọng nam tính',
    description: 'Tối ưu cho giọng nam với pitch thấp',
    settings: {
      ...DEFAULT_SETTINGS,
      pitchShift: -2,
      autoF0Adjust: true,
      f0Condition: true,
      optimizeForCPU: true
    }
  },
  {
    name: 'Giọng nữ tính',
    description: 'Tối ưu cho giọng nữ với pitch cao',
    settings: {
      ...DEFAULT_SETTINGS,
      pitchShift: 2,
      autoF0Adjust: true,
      f0Condition: true,
      optimizeForCPU: true
    }
  }
];

// API endpoints và cấu hình
export const API_CONFIG = {
  ENDPOINTS: {
    VOICE_CLONE: '/api/voice-clone',
    UPLOAD: '/api/upload',
    TTS: '/api/tts',
    SERVE_AUDIO: '/api/serve-audio',
    HEALTH: '/api/health',
    SSL_STATUS: '/api/ssl-status'
  },
  TIMEOUTS: {
    UPLOAD: 30000, // 30 seconds
    TTS: 45000, // 45 seconds
    PROCESSING: 180000, // 3 minutes for CPU
    HEALTH_CHECK: 5000 // 5 seconds
  }
} as const;

// UI constants
export const UI_CONSTANTS = {
  MAX_TEXT_LENGTH: 2000,
  TOAST_DURATION: 5000,
  PROGRESS_UPDATE_INTERVAL: 1000,
  AUTO_SAVE_DELAY: 2000
} as const;

// Processing stages messages
export const PROCESSING_STAGES = {
  UPLOAD: 'Đang tải file lên...',
  PROCESSING: 'Đang xử lý giọng nói...',
  GENERATING: 'Đang tạo audio mới...',
  COMPLETE: 'Hoàn thành!',
  ERROR: 'Có lỗi xảy ra'
} as const;

// Validation messages
export const VALIDATION_MESSAGES = {
  FILE_TOO_LARGE: `File quá lớn. Kích thước tối đa: ${FILE_CONSTRAINTS.MAX_SIZE / 1024 / 1024}MB`,
  INVALID_FORMAT: `Định dạng file không hỗ trợ. Chỉ chấp nhận: ${FILE_CONSTRAINTS.ALLOWED_EXTENSIONS.join(', ')}`,
  TEXT_TOO_LONG: `Văn bản quá dài. Tối đa ${UI_CONSTANTS.MAX_TEXT_LENGTH} ký tự`,
  TEXT_REQUIRED: 'Vui lòng nhập văn bản cần đọc',
  AUDIO_REQUIRED: 'Vui lòng chọn file âm thanh mẫu'
} as const;

// SSL Configuration constants
export const SSL_CONFIG = {
  DEFAULT_DOMAIN: 'voice.vipdayne.net',
  DEFAULT_EMAIL: 'voice@vipdayne.net',
  RENEWAL_DAYS_BEFORE: 30,
  AUTO_RENEW_INTERVAL: 43200000, // 12 hours in ms
  HEALTH_CHECK_INTERVAL: 300000, // 5 minutes in ms
} as const;

// VPS Optimization constants
export const VPS_CONFIG = {
  MAX_MEMORY: '2048', // MB
  MAX_CPU_CORES: 4,
  MAX_CONCURRENT_TTS: 2,
  MAX_CONCURRENT_VOICE_CLONE: 1,
  CLEANUP_INTERVAL: 1800000, // 30 minutes in ms
  TEMP_FILE_TTL: 3600000, // 1 hour in ms
  UPLOAD_FILE_TTL: 86400000, // 24 hours in ms
} as const;

// GitHub deployment constants
export const GITHUB_CONFIG = {
  REPOSITORY: 'https://github.com/dockaka222-del/kaka1',
  TOKEN: process.env.GITHUB_TOKEN || 'YOUR_GITHUB_TOKEN',
  BRANCH: 'main',
  COMMIT_MESSAGE: 'Voice Cloning AI with SSL automation - Production ready'
} as const;