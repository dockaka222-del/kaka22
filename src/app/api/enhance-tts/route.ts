import { NextRequest, NextResponse } from 'next/server';

// TTS Enhancement API - CPU-only audio enhancement
export async function POST(request: NextRequest) {
  try {
    const { audioUrl, enhancements } = await request.json();

    if (!audioUrl) {
      return NextResponse.json({
        success: false,
        error: 'Audio URL required'
      }, { status: 400 });
    }

    console.log(`🎨 [Enhance-TTS] Enhancing: ${audioUrl}`);

    const startTime = Date.now();

    // Enhance TTS audio with voice characteristics
    const result = await enhanceTTSAudio(audioUrl, enhancements);

    const processingTime = Date.now() - startTime;

    if (result.success) {
      return NextResponse.json({
        success: true,
        audioUrl: result.audioUrl,
        processingTime,
        method: 'TTS Enhancement',
        message: 'TTS audio enhanced successfully'
      });
    } else {
      throw new Error(result.error || 'Enhancement failed');
    }

  } catch (error: any) {
    console.error('❌ [Enhance-TTS] Error:', error.message);
    
    return NextResponse.json({
      success: false,
      error: `TTS enhancement failed: ${error.message}`
    }, { status: 500 });
  }
}

// Enhance TTS audio with CPU processing
async function enhanceTTSAudio(audioUrl: string, enhancements: any): Promise<any> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const { join } = require('path');
  const fs = require('fs');
  const execAsync = promisify(exec);

  try {
    const timestamp = Date.now();
    const tempDir = join(process.cwd(), 'public', 'temp');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const inputPath = join(process.cwd(), 'public', audioUrl.replace(/^\//, ''));
    const outputPath = join(tempDir, `enhanced_${timestamp}.wav`);

    // Build enhancement filters
    const filters = [];

    // Basic processing
    filters.push('aresample=16000,highpass=f=80,lowpass=f=8000');

    // Apply enhancements
    if (enhancements.pitch) {
      const pitchShift = 12 * Math.log2(enhancements.pitch / 220);
      const pitchFactor = Math.pow(2, pitchShift / 12);
      filters.push(`asetrate=16000*${pitchFactor},aresample=16000`);
    }

    if (enhancements.tempo) {
      const tempo = Math.max(0.5, Math.min(2.0, enhancements.tempo));
      filters.push(`atempo=${tempo}`);
    }

    // Quality enhancement
    filters.push('loudnorm=I=-16:TP=-1.5');

    const filterChain = filters.join(',');
    const enhanceCommand = `ffmpeg -i "${inputPath}" -af "${filterChain}" -ar 16000 -ac 1 -b:a 128k -y "${outputPath}"`;
    
    await execAsync(enhanceCommand, { timeout: 60000 });

    if (!fs.existsSync(outputPath)) {
      throw new Error('Enhanced file not generated');
    }

    return {
      success: true,
      audioUrl: `/temp/enhanced_${timestamp}.wav`
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      audioUrl: audioUrl // Fallback to original
    };
  }
}