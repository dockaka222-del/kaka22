import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      features: {
        voiceCloning: true,
        vietnameseTTS: true,
        sslAutomation: true,
        cpuOptimized: true
      },
      system: {
        uptime: typeof process !== 'undefined' ? process.uptime() : 0,
        memory: typeof process !== 'undefined' ? process.memoryUsage() : {},
        nodeVersion: typeof process !== 'undefined' ? process.version : 'unknown',
        platform: typeof process !== 'undefined' ? process.platform : 'unknown'
      },
      endpoints: {
        upload: '/api/upload',
        voiceClone: '/api/voice-clone',
        tts: '/api/tts',
        serveAudio: '/api/serve-audio',
        processAudio: '/api/process-audio'
      },
      ssl: {
        domain: 'voice.vipdayne.net',
        autoRenewal: true,
        httpsEnabled: true
      }
    };

    return NextResponse.json(healthData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'Voice-Cloning-AI',
        'X-Timestamp': new Date().toISOString()
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { 
      status: 500,
      headers: {
        'X-Health-Check': 'Voice-Cloning-AI-Error'
      }
    });
  }
}