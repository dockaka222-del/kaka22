import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { text, voice, engine } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Text không được để trống'
      }, { status: 400 });
    }

    console.log(`🎤 [TTS] Engine: ${engine || 'auto'}, Voice: ${voice || 'vi-VN-HoaiMyNeural'}`);
    console.log(`📝 [TTS] Text: "${text.substring(0, 100)}..."`);

    const startTime = Date.now();
    
    // Create temp directory
    const tempDir = join(process.cwd(), 'public', 'temp');
    try {
      await mkdir(tempDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Try TTS engines in order of preference
    const engines = [
      () => tryEdgeTTS(text, voice, tempDir),
      () => tryGoogleTTS(text, voice, tempDir),
      () => tryEspeakTTS(text, tempDir),
      () => createSilencePlaceholder(text.length, tempDir)
    ];

    for (const engineFunc of engines) {
      try {
        const result = await engineFunc();
        if (result.success) {
          const processingTime = Date.now() - startTime;
          console.log(`✅ [TTS] Success in ${processingTime}ms: ${result.engine}`);
          
          return NextResponse.json({
            success: true,
            audioUrl: result.audioUrl,
            engine: result.engine,
            processingTime,
            message: `TTS generated via ${result.engine}`
          });
        }
      } catch (error: any) {
        console.log(`❌ [TTS] Engine failed: ${error.message}`);
        continue;
      }
    }

    throw new Error('All TTS engines failed');

  } catch (error: any) {
    console.error('❌ [TTS] API error:', error.message);
    
    return NextResponse.json({
      success: false,
      error: `TTS failed: ${error.message}`
    }, { status: 500 });
  }
}

// Edge TTS (primary engine)
async function tryEdgeTTS(text: string, voice?: string, tempDir?: string): Promise<any> {
  const { spawn } = require('child_process');
  const fs = require('fs');

  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const outputFile = join(tempDir || '/tmp', `edge_${timestamp}.wav`);
    const voiceToUse = voice || 'vi-VN-HoaiMyNeural';

    console.log(`🚀 [Edge-TTS] Generating with voice: ${voiceToUse}`);

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
        const publicUrl = `/temp/edge_${timestamp}.wav`;
        resolve({
          success: true,
          audioUrl: publicUrl,
          engine: 'edge-tts'
        });
      } else {
        reject(new Error(`Edge-TTS failed with code ${code}`));
      }
    });

    process.on('error', (error: any) => {
      reject(new Error(`Edge-TTS spawn error: ${error.message}`));
    });
  });
}

// Google TTS fallback
async function tryGoogleTTS(text: string, voice?: string, tempDir?: string): Promise<any> {
  try {
    console.log('🌐 [Google-TTS] Trying Google Translate TTS...');
    
    const encodedText = encodeURIComponent(text.substring(0, 200));
    const lang = voice?.includes('vi') ? 'vi' : 'vi';
    
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob&ttsspeed=1`;
    
    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      throw new Error(`Google TTS failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const timestamp = Date.now();
    const outputFile = join(tempDir || '/tmp', `google_${timestamp}.mp3`);
    
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(outputFile, buffer);

    const publicUrl = `/temp/google_${timestamp}.mp3`;
    
    return {
      success: true,
      audioUrl: publicUrl,
      engine: 'google-tts'
    };

  } catch (error: any) {
    throw new Error(`Google TTS failed: ${error.message}`);
  }
}

// eSpeak TTS (lightweight fallback)
async function tryEspeakTTS(text: string, tempDir?: string): Promise<any> {
  const { spawn } = require('child_process');
  const fs = require('fs');

  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const outputFile = join(tempDir || '/tmp', `espeak_${timestamp}.wav`);

    console.log('🔊 [eSpeak] Using eSpeak TTS (fallback)...');

    const espeakProcess = spawn('espeak', [
      '-v', 'vi',
      '-s', '150',
      '-p', '50',
      '-w', outputFile,
      text
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 15000
    });

    espeakProcess.on('close', (code: number) => {
      if (code === 0 && fs.existsSync(outputFile)) {
        const publicUrl = `/temp/espeak_${timestamp}.wav`;
        resolve({
          success: true,
          audioUrl: publicUrl,
          engine: 'espeak'
        });
      } else {
        reject(new Error(`eSpeak failed with code ${code}`));
      }
    });

    espeakProcess.on('error', (error: any) => {
      reject(new Error(`eSpeak error: ${error.message}`));
    });
  });
}

// Final fallback: silence placeholder
async function createSilencePlaceholder(textLength: number, tempDir?: string): Promise<any> {
  try {
    console.log('🔇 Creating silence placeholder...');

    const estimatedDuration = Math.max(2, Math.min(10, textLength / 20));
    const timestamp = Date.now();
    const outputFile = join(tempDir || '/tmp', `silence_${timestamp}.wav`);
    const publicUrl = `/temp/silence_${timestamp}.wav`;

    // Try ffmpeg for silence generation
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const silenceCommand = `ffmpeg -f lavfi -i anullsrc=r=16000:cl=mono -t ${estimatedDuration} -acodec pcm_s16le "${outputFile}"`;
    
    await execAsync(silenceCommand, { timeout: 10000 });
    
    return {
      success: true,
      audioUrl: publicUrl,
      engine: 'silence-fallback'
    };

  } catch (error: any) {
    // Ultimate fallback: create minimal WAV header
    const timestamp = Date.now();
    const outputFile = join(tempDir || '/tmp', `minimal_${timestamp}.wav`);
    
    // Create minimal WAV file (44 bytes header + 1 second of silence)
    const wavHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x24, 0x08, 0x00, 0x00, // File size
      0x57, 0x41, 0x56, 0x45, // "WAVE"
      0x66, 0x6D, 0x74, 0x20, // "fmt "
      0x10, 0x00, 0x00, 0x00, // Subchunk1Size
      0x01, 0x00,             // AudioFormat (PCM)
      0x01, 0x00,             // NumChannels (Mono)
      0x40, 0x1F, 0x00, 0x00, // SampleRate (8000)
      0x80, 0x3E, 0x00, 0x00, // ByteRate
      0x02, 0x00,             // BlockAlign
      0x10, 0x00,             // BitsPerSample
      0x64, 0x61, 0x74, 0x61, // "data"
      0x00, 0x08, 0x00, 0x00  // Subchunk2Size
    ]);
    
    const silenceData = Buffer.alloc(2048); // 1 second of silence
    const wavFile = Buffer.concat([wavHeader, silenceData]);
    
    await writeFile(outputFile, wavFile);
    
    return {
      success: true,
      audioUrl: `/temp/minimal_${timestamp}.wav`,
      engine: 'minimal-fallback'
    };
  }
}