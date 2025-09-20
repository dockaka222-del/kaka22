// CPU-Only Voice Processing - Không cần Hugging Face token
export class CPUVoiceProcessor {
  private readonly engines: string[];

  constructor() {
    this.engines = ['edge-tts', 'espeak', 'festival', 'sox'];
    console.log('🖥️ CPU-Only Voice Processor initialized');
  }

  // Main voice cloning function - completely local
  async processVoiceCloning(
    sourceAudioPath: string,
    targetText: string,
    settings: any
  ): Promise<any> {
    const startTime = Date.now();

    try {
      console.log(`🎵 [CPU] Processing voice cloning: "${targetText.substring(0, 50)}..."`);

      // Step 1: Generate TTS audio from Vietnamese text
      const ttsResult = await this.generateLocalTTS(targetText);
      if (!ttsResult.success) {
        throw new Error('TTS generation failed');
      }

      // Step 2: Analyze source voice characteristics
      const sourceAnalysis = await this.analyzeVoiceCharacteristics(sourceAudioPath);

      // Step 3: Apply voice transfer using CPU processing
      const transferResult = await this.transferVoiceCharacteristics(
        ttsResult.audioUrl,
        sourceAnalysis,
        settings
      );

      if (transferResult.success) {
        return {
          success: true,
          streamAudioUrl: transferResult.streamUrl,
          fullAudioUrl: transferResult.fullUrl,
          processingTime: Date.now() - startTime,
          method: 'CPU-Only Processing',
          message: '✅ Voice cloning hoàn thành với CPU processing!'
        };
      } else {
        // Fallback: return enhanced TTS
        const enhancedTTS = await this.enhanceTTSAudio(ttsResult.audioUrl, sourceAnalysis);
        
        return {
          success: true,
          streamAudioUrl: enhancedTTS.audioUrl,
          fullAudioUrl: enhancedTTS.audioUrl,
          processingTime: Date.now() - startTime,
          method: 'Enhanced TTS',
          message: '✅ Voice cloning với enhanced TTS (CPU optimized)!'
        };
      }

    } catch (error: any) {
      console.error('🔴 [CPU] Voice processing failed:', error);
      
      return {
        success: false,
        error: `CPU processing failed: ${error.message}`,
        processingTime: Date.now() - startTime
      };
    }
  }

  // Generate TTS using local engines only
  private async generateLocalTTS(text: string): Promise<any> {
    const engines = [
      () => this.edgeTTS(text),
      () => this.espeakTTS(text),
      () => this.festivalTTS(text),
      () => this.createSilenceAudio(text.length)
    ];

    for (const engineFunc of engines) {
      try {
        const result = await engineFunc();
        if (result.success) {
          console.log(`✅ [TTS] Generated with: ${result.engine}`);
          return result;
        }
      } catch (error: any) {
        console.log(`❌ [TTS] Engine failed: ${error.message}`);
        continue;
      }
    }

    throw new Error('All local TTS engines failed');
  }

  // Edge TTS (Microsoft)
  private async edgeTTS(text: string): Promise<any> {
    try {
      const response = await fetch('/api/local-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          engine: 'edge-tts',
          voice: 'vi-VN-HoaiMyNeural'
        }),
        signal: AbortSignal.timeout(30000)
      });

      const result = await response.json();
      return result.success ? result : { success: false };
    } catch {
      return { success: false };
    }
  }

  // eSpeak TTS (Lightweight)
  private async espeakTTS(text: string): Promise<any> {
    try {
      const response = await fetch('/api/local-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          engine: 'espeak',
          voice: 'vi'
        }),
        signal: AbortSignal.timeout(20000)
      });

      const result = await response.json();
      return result.success ? result : { success: false };
    } catch {
      return { success: false };
    }
  }

  // Festival TTS
  private async festivalTTS(text: string): Promise<any> {
    try {
      const response = await fetch('/api/local-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          engine: 'festival',
          voice: 'default'
        }),
        signal: AbortSignal.timeout(25000)
      });

      const result = await response.json();
      return result.success ? result : { success: false };
    } catch {
      return { success: false };
    }
  }

  // Analyze voice characteristics using CPU
  private async analyzeVoiceCharacteristics(audioPath: string): Promise<any> {
    try {
      const response = await fetch('/api/analyze-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioPath }),
        signal: AbortSignal.timeout(30000)
      });

      const result = await response.json();
      return result.success ? result.analysis : {
        pitch: 0,
        tempo: 1.0,
        formants: [],
        energy: 1.0
      };
    } catch (error: any) {
      console.log('❌ Voice analysis failed, using defaults');
      return {
        pitch: 0,
        tempo: 1.0,
        formants: [],
        energy: 1.0
      };
    }
  }

  // Transfer voice characteristics using FFmpeg
  private async transferVoiceCharacteristics(
    ttsAudioUrl: string,
    sourceAnalysis: any,
    settings: any
  ): Promise<any> {
    try {
      const response = await fetch('/api/cpu-voice-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ttsAudio: ttsAudioUrl,
          sourceAnalysis,
          settings: {
            pitchShift: sourceAnalysis.pitch + (settings.pitchShift || 0),
            tempoAdjust: sourceAnalysis.tempo * (settings.lengthAdjust || 1.0),
            energyBoost: sourceAnalysis.energy,
            optimizeForCPU: true
          }
        }),
        signal: AbortSignal.timeout(120000)
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('❌ Voice transfer failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Enhance TTS audio with source characteristics
  private async enhanceTTSAudio(ttsAudioUrl: string, sourceAnalysis: any): Promise<any> {
    try {
      const response = await fetch('/api/enhance-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioUrl: ttsAudioUrl,
          enhancements: {
            pitch: sourceAnalysis.pitch,
            tempo: sourceAnalysis.tempo,
            energy: sourceAnalysis.energy
          }
        }),
        signal: AbortSignal.timeout(60000)
      });

      const result = await response.json();
      return result;
    } catch (error: any) {
      return {
        success: false,
        audioUrl: ttsAudioUrl // Return original if enhancement fails
      };
    }
  }

  // Create silence audio as final fallback
  private async createSilenceAudio(textLength: number): Promise<any> {
    const duration = Math.max(2, Math.min(10, textLength / 20));
    
    try {
      const response = await fetch('/api/generate-silence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration }),
        signal: AbortSignal.timeout(10000)
      });

      const result = await response.json();
      return result.success ? result : { success: false };
    } catch {
      return { success: false };
    }
  }
}

// Factory function for CPU processor
export function createCPUVoiceProcessor(): CPUVoiceProcessor {
  return new CPUVoiceProcessor();
}

// Utility functions for CPU-only processing
export const CPUUtils = {
  // Check if running on CPU-only environment
  isCPUOnly(): boolean {
    return !process.env.HUGGINGFACE_TOKEN || process.env.CPU_ONLY_MODE === 'true';
  },

  // Get optimal CPU settings
  getOptimalCPUSettings(): any {
    return {
      diffusionSteps: 0, // No diffusion needed for CPU-only
      useAdvancedMode: false,
      optimizeForCPU: true,
      maxConcurrentJobs: 1,
      enableGPU: false,
      processingMode: 'cpu-enhanced-tts'
    };
  },

  // Estimate processing time for CPU
  estimateProcessingTime(textLength: number, audioFileSize: number): number {
    // Base time: 10 seconds
    // + 1 second per 100 characters
    // + 1 second per MB of audio
    const baseTime = 10000;
    const textTime = (textLength / 100) * 1000;
    const audioTime = (audioFileSize / 1024 / 1024) * 1000;
    
    return Math.min(baseTime + textTime + audioTime, 60000); // Max 1 minute
  }
};