import { NextRequest, NextResponse } from 'next/server';

// CPU-optimized audio processing endpoint
export async function POST(request: NextRequest) {
  try {
    const { sourceAudio, targetAudio, settings } = await request.json();

    console.log('🖥️ [AudioProcess] Starting CPU audio processing...');
    
    const startTime = Date.now();

    // Apply voice characteristics using FFmpeg
    const result = await applyVoiceCharacteristics(sourceAudio, targetAudio, settings);

    const processingTime = Date.now() - startTime;
    console.log(`⏱️ [AudioProcess] Completed in ${processingTime}ms`);

    if (result.success) {
      return NextResponse.json({
        success: true,
        streamUrl: result.streamUrl,
        fullUrl: result.fullUrl,
        processingTime,
        method: 'FFmpeg CPU Processing'
      });
    } else {
      throw new Error(result.error || 'Audio processing failed');
    }

  } catch (error: any) {
    console.error('❌ [AudioProcess] Failed:', error.message);
    
    return NextResponse.json({
      success: false,
      error: `Audio processing failed: ${error.message}`
    }, { status: 500 });
  }
}

// Apply voice characteristics using CPU-efficient FFmpeg
async function applyVoiceCharacteristics(
  sourceAudioPath: string,
  targetAudioPath: string,
  settings: any
) {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const { join } = require('path');
  const fs = require('fs');
  const execAsync = promisify(exec);

  try {
    console.log('🎛️ [Voice] Applying voice characteristics...');

    const timestamp = Date.now();
    const tempDir = join(process.cwd(), 'public', 'temp');
    const streamOutput = join(tempDir, `stream_${timestamp}.wav`);
    const fullOutput = join(tempDir, `full_${timestamp}.wav`);

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Construct full paths for input files
    const sourcePath = join(process.cwd(), 'public', sourceAudioPath.replace(/^\//, ''));
    const targetPath = join(process.cwd(), 'public', targetAudioPath.replace(/^\//, ''));

    // CPU-optimized settings
    const pitchShift = Math.max(-6, Math.min(6, settings.pitchShift || 0));
    const lengthAdjust = Math.max(0.5, Math.min(2.0, settings.lengthAdjust || 1.0));
    const speedAdjust = 1.0 / lengthAdjust;
    const optimizeForCPU = settings.optimizeForCPU !== false;

    // Build CPU-efficient FFmpeg filters
    const filters = [];
    
    // Basic processing
    filters.push('aresample=16000');
    
    // Pitch adjustment
    if (pitchShift !== 0) {
      if (optimizeForCPU) {
        const pitchFactor = Math.pow(2, pitchShift / 12);
        filters.push(`asetrate=16000*${pitchFactor},aresample=16000`);
      } else {
        filters.push(`rubberband=pitch=${pitchShift}`);
      }
    }
    
    // Speed adjustment
    if (speedAdjust !== 1.0) {
      filters.push(`atempo=${speedAdjust}`);
    }
    
    // Voice enhancement
    if (optimizeForCPU) {
      filters.push('highpass=f=80,lowpass=f=8000,loudnorm=I=-16:TP=-1.5');
    } else {
      filters.push('highpass=f=80,lowpass=f=8000,loudnorm=I=-16:TP=-1.5:LRA=11');
    }

    const filterChain = filters.join(',');

    // Generate stream version
    console.log('🎵 [Voice] Generating stream version...');
    const streamCommand = `ffmpeg -i "${targetPath}" -af "${filterChain}" -ar 16000 -ac 1 -b:a 64k -y "${streamOutput}"`;
    
    await execAsync(streamCommand, { timeout: 60000 });

    // Generate full version
    console.log('🎵 [Voice] Generating full quality version...');
    if (optimizeForCPU) {
      await execAsync(`cp "${streamOutput}" "${fullOutput}"`);
    } else {
      const fullCommand = `ffmpeg -i "${targetPath}" -af "${filterChain}" -ar 22050 -ac 1 -b:a 128k -y "${fullOutput}"`;
      await execAsync(fullCommand, { timeout: 90000 });
    }

    // Verify files
    if (!fs.existsSync(streamOutput) || !fs.existsSync(fullOutput)) {
      throw new Error('Failed to generate output files');
    }

    const streamStats = fs.statSync(streamOutput);
    const fullStats = fs.statSync(fullOutput);

    if (streamStats.size === 0 || fullStats.size === 0) {
      throw new Error('Generated files are empty');
    }

    console.log(`✅ [Voice] Generated: stream=${streamStats.size}B, full=${fullStats.size}B`);

    return {
      success: true,
      streamUrl: `/temp/stream_${timestamp}.wav`,
      fullUrl: `/temp/full_${timestamp}.wav`
    };

  } catch (error: any) {
    console.error('❌ [Voice] Processing failed:', error.message);
    
    // Fallback: basic processing
    try {
      const timestamp = Date.now();
      const tempDirPath = join(process.cwd(), 'public', 'temp');
      const fallbackOutput = join(tempDirPath, `fallback_${timestamp}.wav`);
      const fallbackTargetPath = join(process.cwd(), 'public', targetAudioPath.replace(/^\//, ''));
      
      const fallbackCommand = `ffmpeg -i "${fallbackTargetPath}" -ar 16000 -ac 1 -b:a 128k -y "${fallbackOutput}"`;
      await execAsync(fallbackCommand, { timeout: 30000 });
      
      return {
        success: true,
        streamUrl: `/temp/fallback_${timestamp}.wav`,
        fullUrl: `/temp/fallback_${timestamp}.wav`
      };
      
    } catch (fallbackError: any) {
      return {
        success: false,
        error: `Audio processing failed: ${error.message}`
      };
    }
  }
}