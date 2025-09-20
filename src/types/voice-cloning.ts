// Types cho ứng dụng Voice Cloning với SSL automation
export interface VoiceCloningRequest {
  text: string;
  sourceAudioFile: File;
  settings: VoiceCloningSettings;
}

export interface VoiceCloningSettings {
  // Cài đặt cho /predict endpoint (voice conversion với text)
  diffusionSteps: number;
  lengthAdjust: number;
  intelligebilityCfgRate: number;
  similarityCfgRate: number;
  topP: number;
  temperature: number;
  repetitionPenalty: number;
  convertStyle: boolean;
  anonymizationOnly: boolean;
  
  // Cài đặt cho /predict_1 endpoint (voice cloning đơn giản)
  inferenceCfgRate: number;
  f0Condition: boolean;
  autoF0Adjust: boolean;
  pitchShift: number;
  
  // Endpoint selection
  useAdvancedMode: boolean; // true = /predict, false = /predict_1
  
  // VPS optimization
  optimizeForCPU?: boolean;
}

export interface VoiceCloningResponse {
  success: boolean;
  message?: string;
  streamAudioUrl?: string;
  fullAudioUrl?: string;
  error?: string;
  processingTime?: number;
  method?: string;
  engine?: string;
}

export interface UploadResponse {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
  publicUrl?: string;
  originalName?: string;
}

export interface ProcessingStatus {
  isProcessing: boolean;
  progress: number;
  message: string;
  stage: 'upload' | 'processing' | 'generating' | 'complete' | 'error';
}

export interface AudioFile {
  file: File;
  url: string;
  duration?: number;
  size: number;
  name: string;
  type: string;
}

export interface HistoryItem {
  id: string;
  timestamp: Date;
  text: string;
  audioFileName: string;
  settings: VoiceCloningSettings;
  resultUrl?: string;
  processingTime?: number;
  status: 'success' | 'failed' | 'processing';
}

// Default settings presets
export interface SettingsPreset {
  name: string;
  description: string;
  settings: Partial<VoiceCloningSettings>;
}

// API Error types
export interface APIError {
  code: string;
  message: string;
  details?: any;
}

// File validation
export interface FileValidation {
  isValid: boolean;
  error?: string;
  maxSize: number;
  allowedFormats: readonly string[];
}

// SSL Configuration types
export interface SSLConfig {
  domain: string;
  email: string;
  autoRenew: boolean;
  vpsIP?: string;
  certificatePath?: string;
  renewalDays: number;
}

// TTS Configuration
export interface TTSConfig {
  engine: 'edge-tts' | 'google-tts' | 'espeak' | 'festival';
  voice: string;
  quality: 'low' | 'medium' | 'high';
  speed: number;
  pitch: number;
}

// VPS Configuration
export interface VPSConfig {
  cpuCores: number;
  memoryLimit: number;
  maxConcurrentJobs: number;
  cleanupInterval: number;
  tempFileTTL: number;
}