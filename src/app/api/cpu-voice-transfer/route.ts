import { NextRequest, NextResponse } from 'next/server';

// CPU Voice Transfer API - Hoàn toàn local processing
export async function POST(request: NextRequest) {
  try {
    const { ttsAudio, sourceAnalysis, settings } = await request.json();

    if (!ttsAudio) {
      return NextResponse.json({
        success: false,
        error: 'TTS audio URL required'
      }, { status: 400 });
    }

    console.log(`🔄 [CPU-Transfer] Transferring voice characteristics...`);
    console.log(`🎤 TTS Audio: ${ttsAudio}`);
    console.log(`📊 Source Analysis:`, sourceAnalysis);

    const startTime = Date.now();

    // Perform CPU-based voice transfer
    const result = await performCPUVoiceTransfer(ttsAudio, sourceAnalysis, settings);

    const processingTime = Date.now() - startTime;
    console.log(`✅ [CPU-Transfer] Completed in ${processingTime}ms`);

    if (result.success) {
      return NextResponse.json({
        success: true,
        streamUrl: result.streamUrl,
        fullUrl: result.fullUrl,
        processingTime,
        method: 'CPU Voice Transfer',
        message: 'Voice characteristics transferred using CPU processing'
      });
    } else {
      throw new Error(result.error || 'Voice transfer failed');
    }

  } catch (error: any) {
    console.error('❌ [CPU-Transfer] Error:', error.message);
    
    return NextResponse.json({
      success: false,
      error: `Voice transfer failed: ${error.message}`
    }, { status: 500 });
  }
}

// Perform CPU-based voice characteristics transfer
async function performCPUVoiceTransfer(
  ttsAudioUrl: string,
  sourceAnalysis: any,
  settings: any
): Promise<any> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const { join } = require('path');
  const fs = require('fs');
  const execAsync = promisify(exec);

  try {
    const timestamp = Date.now();
    const tempDir = join(process.cwd(), 'public', 'temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Input and output paths
    const inputPath = join(process.cwd(), 'public', ttsAudioUrl.replace(/^\//, ''));
    const streamOutput = join(tempDir, `cpu_stream_${timestamp}.wav`);
    const fullOutput = join(tempDir, `cpu_full_${timestamp}.wav`);

    console.log(`📂 [Transfer] Input: ${inputPath}`);
    console.log(`📂 [Transfer] Output stream: ${streamOutput}`);

    // Calculate voice transfer parameters from analysis
    const pitchShift = calculatePitchShift(sourceAnalysis);
    const tempoAdjust = calculateTempoAdjust(sourceAnalysis, settings);
    const energyAdjust = calculateEnergyAdjust(sourceAnalysis);

    console.log(`🎛️ [Transfer] Pitch: ${pitchShift}, Tempo: ${tempoAdjust}, Energy: ${energyAdjust}`);

    // Build FFmpeg filter chain for voice transfer
    const filters = [];

    // 1. Basic normalization
    filters.push('aresample=16000');
    
    // 2. Pitch adjustment (source voice characteristic)
    if (Math.abs(pitchShift) > 0.5) {
      // Use asetrate for CPU efficiency
      const pitchFactor = Math.pow(2, pitchShift / 12);
      filters.push(`asetrate=16000*${pitchFactor},aresample=16000`);
    }

    // 3. Tempo adjustment (speaking speed)
    if (Math.abs(tempoAdjust - 1.0) > 0.1) {
      filters.push(`atempo=${Math.max(0.5, Math.min(2.0, tempoAdjust))}`);
    }

    // 4. Energy/dynamics adjustment
    if (Math.abs(energyAdjust - 1.0) > 0.1) {
      const gainDb = 20 * Math.log10(energyAdjust);
      filters.push(`volume=${Math.max(-20, Math.min(20, gainDb))}dB`);
    }

    // 5. Voice enhancement for better quality
    filters.push('highpass=f=80'); // Remove low-frequency noise
    filters.push('lowpass=f=8000'); // Remove high-frequency artifacts
    filters.push('loudnorm=I=-16:TP=-1.5:LRA=7'); // Normalize loudness

    // 6. Optional: Add subtle formant adjustment (voice character)
    if (sourceAnalysis.voiceType) {
      if (sourceAnalysis.voiceType === 'bass' || sourceAnalysis.voiceType === 'baritone') {
        filters.push('equalizer=500:1:-2'); // Reduce mid frequencies for deeper voice
      } else if (sourceAnalysis.voiceType === 'soprano' || sourceAnalysis.voiceType === 'alto') {
        filters.push('equalizer=1000:1:+2'); // Boost mid frequencies for higher voice
      }
    }

    const filterChain = filters.join(',');
    console.log(`🎚️ [Transfer] Filter chain: ${filterChain}`);

    // Generate stream version (64kbps for fast download)
    const streamCommand = `ffmpeg -i "${inputPath}" -af "${filterChain}" -ar 16000 -ac 1 -b:a 64k -y "${streamOutput}"`;
    
    await execAsync(streamCommand, { timeout: 60000 });

    // Generate full version (128kbps for quality)
    const fullCommand = `ffmpeg -i "${inputPath}" -af "${filterChain}" -ar 22050 -ac 1 -b:a 128k -y "${fullOutput}"`;
    
    await execAsync(fullCommand, { timeout: 90000 });

    // Verify output files
    if (!fs.existsSync(streamOutput) || !fs.existsSync(fullOutput)) {
      throw new Error('Failed to generate output files');
    }

    const streamStats = fs.statSync(streamOutput);
    const fullStats = fs.statSync(fullOutput);

    console.log(`✅ [Transfer] Generated: stream=${streamStats.size}B, full=${fullStats.size}B`);

    return {
      success: true,
      streamUrl: `/temp/cpu_stream_${timestamp}.wav`,
      fullUrl: `/temp/cpu_full_${timestamp}.wav`,
      details: {
        pitchShift,
        tempoAdjust,
        energyAdjust,
        filterChain,
        streamSize: streamStats.size,
        fullSize: fullStats.size
      }
    };

  } catch (error: any) {
    console.error('❌ [Transfer] Failed:', error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Calculate pitch shift based on source analysis
function calculatePitchShift(sourceAnalysis: any): number {
  const sourcePitch = sourceAnalysis.pitch || 220;
  const targetPitch = 220; // Neutral Vietnamese pitch
  
  // Calculate semitone difference
  const pitchShift = 12 * Math.log2(sourcePitch / targetPitch);
  
  // Limit to reasonable range
  return Math.max(-6, Math.min(6, pitchShift));
}

// Calculate tempo adjustment
function calculateTempoAdjust(sourceAnalysis: any, settings: any): number {
  const sourceTempo = sourceAnalysis.tempo || 1.0;
  const userTempo = settings.lengthAdjust || 1.0;
  
  // Combine source tempo with user preference
  const adjustedTempo = sourceTempo * userTempo;
  
  return Math.max(0.5, Math.min(2.0, adjustedTempo));
}

// Calculate energy adjustment
function calculateEnergyAdjust(sourceAnalysis: any): number {
  const sourceEnergy = sourceAnalysis.energy || 1.0;
  
  // Normalize energy to target range
  return Math.max(0.3, Math.min(2.0, sourceEnergy));
}