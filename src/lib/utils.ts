import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FILE_CONSTRAINTS, VALIDATION_MESSAGES } from './constants';
import { FileValidation, AudioFile } from '@/types/voice-cloning';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// File validation utilities
export function validateAudioFile(file: File): FileValidation {
  // Check file size
  if (file.size > FILE_CONSTRAINTS.MAX_SIZE) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.FILE_TOO_LARGE,
      maxSize: FILE_CONSTRAINTS.MAX_SIZE,
      allowedFormats: [...FILE_CONSTRAINTS.ALLOWED_EXTENSIONS]
    };
  }

  // Check file type
  const isValidType = FILE_CONSTRAINTS.ALLOWED_FORMATS.some(format => 
    file.type === format || file.type.startsWith(format.split('/')[0])
  );
  
  const isValidExtension = FILE_CONSTRAINTS.ALLOWED_EXTENSIONS.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );

  if (!isValidType && !isValidExtension) {
    return {
      isValid: false,
      error: VALIDATION_MESSAGES.INVALID_FORMAT,
      maxSize: FILE_CONSTRAINTS.MAX_SIZE,
      allowedFormats: [...FILE_CONSTRAINTS.ALLOWED_EXTENSIONS]
    };
  }

  return {
    isValid: true,
    maxSize: FILE_CONSTRAINTS.MAX_SIZE,
    allowedFormats: FILE_CONSTRAINTS.ALLOWED_EXTENSIONS
  };
}

// Convert File to AudioFile with metadata
export function createAudioFile(file: File): AudioFile {
  return {
    file,
    url: URL.createObjectURL(file),
    size: file.size,
    name: file.name,
    type: file.type
  };
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Format duration in seconds to mm:ss
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Generate unique ID for history items
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Debounce function for input handling
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Local storage utilities
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      if (typeof window === 'undefined') return defaultValue;
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Silent fail
    }
  },
  
  remove: (key: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Silent fail
    }
  }
};

// Text validation
export function validateText(text: string): { isValid: boolean; error?: string } {
  if (!text.trim()) {
    return { isValid: false, error: VALIDATION_MESSAGES.TEXT_REQUIRED };
  }
  
  if (text.length > 2000) {
    return { isValid: false, error: VALIDATION_MESSAGES.TEXT_TOO_LONG };
  }
  
  return { isValid: true };
}

// Error message extraction from API responses
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  if (error?.data?.message) return error.data.message;
  return 'Đã xảy ra lỗi không xác định';
}

// URL cleanup for object URLs
export function cleanupObjectURL(url: string): void {
  try {
    URL.revokeObjectURL(url);
  } catch {
    // Silent fail
  }
}

// Progress calculation helper
export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(Math.max((current / total) * 100, 0), 100);
}
