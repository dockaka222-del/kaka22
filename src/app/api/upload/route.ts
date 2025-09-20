import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { validateAudioFile } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Không có file được gửi lên' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateAudioFile(file);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist  
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${originalName}`;
    const filePath = join(uploadDir, fileName);
    
    console.log('📁 Saving file to:', filePath);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    console.log('✅ File saved successfully:', fileName);

    // Return public URL path for API usage
    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      filePath: publicUrl, // Use public URL path
      fileName: fileName,
      fileSize: file.size,
      originalName: file.name,
      publicUrl: publicUrl
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Lỗi server khi tải file lên' 
      },
      { status: 500 }
    );
  }
}