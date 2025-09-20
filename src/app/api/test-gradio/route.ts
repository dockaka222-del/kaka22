import { NextResponse } from 'next/server';
import { testGradioAPI } from '@/lib/gradio-test';

export async function GET() {
  try {
    console.log('🧪 Starting Gradio API test...');
    
    const testResult = await testGradioAPI();
    
    return NextResponse.json({
      success: testResult.success,
      message: testResult.success ? 'Gradio API test passed' : 'Gradio API test failed',
      result: testResult.result,
      error: testResult.error,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Test endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Test endpoint failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}