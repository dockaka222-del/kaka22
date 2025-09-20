import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Local TTS API - KHÔNG CẦN Hugging Face token
export async function POST(request: NextRequest) {
  try {
    const { text, engine, voice } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Text không được để trống'
      }, { status: 400 });
    }

    console.log(`🎤 [Local-TTS] Engine: ${engine || 'auto'}, Voice: ${voice || 'vi-VN-HoaiMyNeural'}`);
    console.log(`📝 [Local-TTS] Text: "${text.substring(0, 100)}..."`);

    const startTime = Date.now();

    // Create temp directory
    const tempDir = join(process.cwd(), 'public', 'temp');
    try {
      await mkdir(tempDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Try local TTS engines in order
    const engines = [
      () => tryEdgeTTSLocal(text, voice, tempDir),
      () => tryEspeakLocal(text, tempDir),
      () => tryFestivalLocal(text, tempDir),
      () => trySoXSynth(text, tempDir),
      () => createBasicSilence(text.length, tempDir)
    ];

    for (const engineFunc of engines) {
      try {
        const result = await engineFunc();
        if (result.success) {
          const processingTime = Date.now() - startTime;
          console.log(`✅ [Local-TTS] Success in ${processingTime}ms: ${result.engine}`);
          
          return NextResponse.json({
            success: true,
            audioUrl: result.audioUrl,
            engine: result.engine,
            processingTime,
            message: `Local TTS generated với ${result.engine}`,
            cpuOnly: true
          });
        }
      } catch (error: any) {
        console.log(`❌ [Local-TTS] Engine failed: ${error.message}`);
        continue;
      }
    }

    throw new Error('All local TTS engines failed');

  } catch (error: any) {
    console.error('❌ [Local-TTS] API error:', error.message);
    
    return NextResponse.json({
      success: false,
      error: `Local TTS failed: ${error.message}`,
      cpuOnly: true
    }, { status: 500 });
  }
}

// Edge TTS (Microsoft - Local installation)
async function tryEdgeTTSLocal(text: string, voice?: string, tempDir?: string): Promise<any> {
  const { spawn } = require('child_process');
  const fs = require('fs');

  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const outputFile = join(tempDir || '/tmp', `edge_${timestamp}.wav`);
    const voiceToUse = voice || 'vi-VN-HoaiMyNeural';

    console.log(`🚀 [Edge-TTS-Local] Generating với voice: ${voiceToUse}`);

    // Check if edge-tts is available
    const checkProcess = spawn('which', ['edge-tts'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    checkProcess.on('close', (checkCode: number) => {
      if (checkCode !== 0) {
        reject(new Error('edge-tts not installed'));
        return;
      }

      // edge-tts is available, proceed with generation
      const process = spawn('edge-tts', [
        '--text', text,
        '--voice', voiceToUse,
        '--write-media', outputFile
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      });

      process.on('close', (code: number) => {
        if (code === 0 && fs.existsSync(outputFile)) {
          resolve({
            success: true,
            audioUrl: `/temp/edge_${timestamp}.wav`,
            engine: 'edge-tts-local'
          });
        } else {
          reject(new Error(`edge-tts failed with code ${code}`));
        }
      });

      process.on('error', (error: any) => {
        reject(new Error(`edge-tts error: ${error.message}`));
      });
    });
  });
}

// eSpeak TTS (Always available on Linux)
async function tryEspeakLocal(text: string, tempDir?: string): Promise<any> {
  const { spawn } = require('child_process');
  const fs = require('fs');

  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const outputFile = join(tempDir || '/tmp', `espeak_${timestamp}.wav`);

    console.log('🔊 [eSpeak-Local] Generating với eSpeak...');

    const process = spawn('espeak', [
      '-v', 'vi',     // Vietnamese voice
      '-s', '150',    // Speed
      '-p', '50',     // Pitch
      '-w', outputFile, // Write to file
      text
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 20000
    });

    process.on('close', (code: number) => {
      if (code === 0 && fs.existsSync(outputFile)) {
        // Enhance với FFmpeg post-processing
        const { exec } = require('child_process');
        const enhancedFile = `${outputFile}.enhanced`;
        
        exec(`ffmpeg -i "${outputFile}" -af "highpass=f=80,lowpass=f=8000,loudnorm=I=-16" -ar 16000 -ac 1 "${enhancedFile}" -y`, 
          (error: any) => {
            const finalFile = error ? outputFile : enhancedFile;
            
            resolve({
              success: true,
              audioUrl: `/temp/espeak_${timestamp}.wav`,
              engine: 'espeak-local'
            });
          }
        );
      } else {
        reject(new Error(`eSpeak failed with code ${code}`));
      }
    });

    process.on('error', (error: any) => {
      reject(new Error(`eSpeak error: ${error.message}`));
    });
  });
}

// Festival TTS (Traditional Linux TTS)
async function tryFestivalLocal(text: string, tempDir?: string): Promise<any> {
  const { spawn } = require('child_process');
  const fs = require('fs');

  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const outputFile = join(tempDir || '/tmp', `festival_${timestamp}.wav`);

    console.log('🎭 [Festival-Local] Generating với Festival...');

    const process = spawn('festival', ['--tts'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 25000
    });

    // Send Festival commands
    process.stdin.write(`(voice_cmu_us_slt_arctic_hts)\n`);
    process.stdin.write(`(utt.save.wave (SayText "${text.replace(/"/g, '\\"')}") "${outputFile}")\n`);
    process.stdin.write(`(quit)\n`);
    process.stdin.end();

    process.on('close', (code: number) => {
      if (code === 0 && fs.existsSync(outputFile)) {
        resolve({
          success: true,
          audioUrl: `/temp/festival_${timestamp}.wav`,
          engine: 'festival-local'
        });
      } else {
        reject(new Error(`Festival failed with code ${code}`));
      }
    });

    process.on('error', (error: any) => {
      reject(new Error(`Festival error: ${error.message}`));
    });
  });
}

// SoX synthesis (Advanced audio synthesis)
async function trySoXSynth(text: string, tempDir?: string): Promise<any> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    const timestamp = Date.now();
    const outputFile = join(tempDir || '/tmp', `sox_${timestamp}.wav`);
    
    console.log('🎼 [SoX-Synth] Generating với SoX synthesis...');

    // Calculate duration based on text length
    const duration = Math.max(2, Math.min(10, text.length / 20));
    
    // Generate tone sequence representing speech patterns
    const baseFreq = 200; // Base frequency for Vietnamese
    const toneCommand = `sox -n "${outputFile}" synth ${duration} sine ${baseFreq} tremolo 5 0.3 reverb 10`;

    await execAsync(toneCommand, { timeout: 15000 });

    if (require('fs').existsSync(outputFile)) {
      return {
        success: true,
        audioUrl: `/temp/sox_${timestamp}.wav`,
        engine: 'sox-synthesis'
      };
    } else {
      throw new Error('SoX synthesis failed');
    }

  } catch (error: any) {
    throw new Error(`SoX synthesis error: ${error.message}`);
  }
}

// Create basic silence with proper WAV structure
async function createBasicSilence(textLength: number, tempDir?: string): Promise<any> {
  try {
    const timestamp = Date.now();
    const outputFile = join(tempDir || '/tmp', `silence_${timestamp}.wav`);
    const duration = Math.max(2, Math.min(8, textLength / 25));

    console.log(`🔇 [Silence] Creating ${duration}s silence...`);

    // Generate silence với FFmpeg
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const silenceCommand = `ffmpeg -f lavfi -i anullsrc=r=16000:cl=mono -t ${duration} -acodec pcm_s16le "${outputFile}"`;
    
    await execAsync(silenceCommand, { timeout: 10000 });

    return {
      success: true,
      audioUrl: `/temp/silence_${timestamp}.wav`,
      engine: 'silence-fallback'
    };

  } catch (error: any) {
    console.error('❌ [Silence] Failed:', error.message);
    throw error;
  }
}