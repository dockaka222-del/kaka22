import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return new NextResponse('Missing path parameter', { status: 400 });
    }

    console.log(`📁 [ServeAudio] Requested file: ${filePath}`);
    
     // Security: Only allow temp and uploads directories (handle leading slash)
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    if (!cleanPath.startsWith('temp/') && !cleanPath.startsWith('uploads/')) {
      console.error(`❌ [ServeAudio] Invalid path: ${filePath} (cleaned: ${cleanPath})`);
      return new NextResponse('Access denied', { status: 403 });
    }
    
     // Construct full file path
    const path = require('path');
    const fs = require('fs');
    const fullPath = path.join(process.cwd(), 'public', cleanPath);
    console.log(`📂 [ServeAudio] Full path: ${fullPath}`);
    
    try {
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        console.error(`❌ [ServeAudio] File not found: ${fullPath}`);
        return new NextResponse('File not found', { status: 404 });
      }
      
      // Read file
      const fileBuffer = fs.readFileSync(fullPath);
      
      // Determine content type
      const extension = filePath.split('.').pop()?.toLowerCase();
      let contentType = 'audio/wav';
      
      switch (extension) {
        case 'mp3':
          contentType = 'audio/mpeg';
          break;
        case 'wav':
          contentType = 'audio/wav';
          break;
        case 'm4a':
          contentType = 'audio/mp4';
          break;
        case 'ogg':
          contentType = 'audio/ogg';
          break;
        default:
          contentType = 'audio/wav';
      }
      
      console.log(`✅ [ServeAudio] Serving: ${filePath} (${fileBuffer.length} bytes, ${contentType})`);
      
      // Return file with proper headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileBuffer.length.toString(),
          'Content-Disposition': `attachment; filename="${filePath.split('/').pop()}"`,
          'Cache-Control': 'public, max-age=3600',
          'Accept-Ranges': 'bytes'
        }
      });
      
    } catch (fileError: any) {
      console.error(`❌ [ServeAudio] Read error: ${fileError.message}`);
      return new NextResponse('File read error', { status: 500 });
    }
    
  } catch (error: any) {
    console.error('❌ [ServeAudio] Error:', error.message);
    return new NextResponse('Server error', { status: 500 });
  }
}