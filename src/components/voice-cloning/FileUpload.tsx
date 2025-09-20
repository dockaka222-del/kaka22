"use client"

import React, { useCallback, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { validateAudioFile, formatFileSize, createAudioFile, cleanupObjectURL } from '@/lib/utils';
import { AudioFile } from '@/types/voice-cloning';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (audioFile: AudioFile | null) => void;
  selectedFile: AudioFile | null;
  isProcessing?: boolean;
  className?: string;
}

export default function FileUpload({ 
  onFileSelect, 
  selectedFile, 
  isProcessing = false,
  className 
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isProcessing) {
      setIsDragOver(true);
    }
  }, [isProcessing]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (isProcessing) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [isProcessing]);

  const handleFileSelection = useCallback((file: File) => {
    if (isProcessing) return;

    // Cleanup previous file URL if exists
    if (selectedFile?.url) {
      cleanupObjectURL(selectedFile.url);
    }

    const validation = validateAudioFile(file);
    if (!validation.isValid) {
      // Show error toast - component sẽ handle via parent
      onFileSelect(null);
      return;
    }

    // Simulate upload progress
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 50);

    // Create audio file object
    const audioFile = createAudioFile(file);
    
    setTimeout(() => {
      onFileSelect(audioFile);
      setUploadProgress(0);
    }, 600);

  }, [isProcessing, selectedFile, onFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection]);

  const handleBrowseClick = useCallback(() => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isProcessing]);

  const handleRemoveFile = useCallback(() => {
    if (isProcessing) return;
    
    if (selectedFile?.url) {
      cleanupObjectURL(selectedFile.url);
    }
    onFileSelect(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [isProcessing, selectedFile, onFileSelect]);

  return (
    <div className={cn("w-full", className)}>
      <div className="space-y-4">
        {/* Upload Area */}
        <Card className={cn(
          "transition-all duration-200",
          isDragOver && "border-primary bg-primary/5",
          isProcessing && "opacity-50 pointer-events-none",
          selectedFile && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
        )}>
          <CardContent className="p-6">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragOver ? "border-primary bg-primary/10" : "border-muted-foreground/25",
                selectedFile && "border-green-500/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".wav,.mp3,.m4a,.ogg,.webm,audio/*"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isProcessing}
              />

              {uploadProgress > 0 ? (
                <div className="space-y-3">
                  <div className="text-lg font-medium">Đang tải file...</div>
                  <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                </div>
              ) : selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-green-500/10 dark:bg-green-500/20">
                    <span className="text-2xl">🎵</span>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-green-600 dark:text-green-400">
                      File đã chọn
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  </div>
                  <Button
                    onClick={handleRemoveFile}
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                  >
                    Chọn file khác
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-muted">
                    <span className="text-2xl">🎤</span>
                  </div>
                  <div>
                    <p className="text-lg font-medium">
                      Kéo thả file âm thanh vào đây
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      hoặc nhấp để chọn file từ máy tính
                    </p>
                  </div>
                  <Button
                    onClick={handleBrowseClick}
                    variant="outline"
                    disabled={isProcessing}
                  >
                    Chọn file âm thanh
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    Hỗ trợ: WAV, MP3, M4A, OGG, WebM • Tối đa 10MB
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Audio Preview */}
        {selectedFile && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Nghe thử file âm thanh mẫu:</h4>
                <audio
                  controls
                  src={selectedFile.url}
                  className="w-full h-8"
                  preload="metadata"
                >
                  Trình duyệt không hỗ trợ phát audio.
                </audio>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}