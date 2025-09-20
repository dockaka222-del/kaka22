"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { VoiceCloningResponse } from '@/types/voice-cloning';
import AudioPlayer from './AudioPlayer';
import { cn } from '@/lib/utils';

interface ResultSectionProps {
  result: VoiceCloningResponse | null;
  originalText: string;
  className?: string;
  onNewProcessing?: () => void;
}

export default function ResultSection({ 
  result, 
  originalText, 
  className,
  onNewProcessing
}: ResultSectionProps) {
  if (!result || !result.success) {
    return null;
  }

  const hasAudio = result.streamAudioUrl || result.fullAudioUrl;
  const processingTime = result.processingTime ? (result.processingTime / 1000).toFixed(1) : '0';

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>🎉</span>
          <span>Kết quả Voice Cloning</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Processing Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ✅
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Hoàn thành
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold">
              {processingTime}s
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Thời gian xử lý
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold">
              {originalText.length}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Ký tự đã xử lý
            </div>
          </div>
        </div>

        {/* Original Text */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Văn bản gốc:
          </h3>
          <div className="p-3 bg-muted/30 rounded-lg text-sm">
            {originalText.length > 200 
              ? `${originalText.substring(0, 200)}...`
              : originalText
            }
          </div>
        </div>

        <Separator />

        {/* Audio Results */}
        {hasAudio && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Kết quả Audio</h3>
            
            {/* Stream Audio (Preview) */}
            {result.streamAudioUrl && (
              <AudioPlayer
                src={result.streamAudioUrl}
                title="🎵 Audio Preview (Stream)"
                className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
              />
            )}

            {/* Full Audio (High Quality) */}
            {result.fullAudioUrl && (
              <AudioPlayer
                src={result.fullAudioUrl}
                title="🎵 Audio Chất lượng cao"
                className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
              />
            )}

            {/* Download All Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {result.fullAudioUrl && (
                <Button asChild className="flex-1">
                  <a
                    href={result.fullAudioUrl}
                    download={`voice-clone-full-${Date.now()}.wav`}
                    className="inline-flex items-center justify-center space-x-2"
                  >
                    <span>📥</span>
                    <span>Tải audio chất lượng cao</span>
                  </a>
                </Button>
              )}
              
              {result.streamAudioUrl && (
                <Button variant="outline" asChild className="flex-1">
                  <a
                    href={result.streamAudioUrl}
                    download={`voice-clone-preview-${Date.now()}.wav`}
                    className="inline-flex items-center justify-center space-x-2"
                  >
                    <span>📥</span>
                    <span>Tải audio preview</span>
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <Separator />
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={onNewProcessing}
            className="flex-1"
            size="lg"
          >
            🔄 Tạo audio mới
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1"
            size="lg"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
          >
            🆕 Bắt đầu lại
          </Button>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
            💡 Mẹo sử dụng:
          </h4>
          <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
            <li>• Audio chất lượng cao phù hợp cho sử dụng chuyên nghiệp</li>
            <li>• Audio preview phù hợp cho kiểm tra nhanh và chia sẻ</li>
            <li>• Sử dụng cài đặt nâng cao để tinh chỉnh kết quả</li>
            <li>• File âm thanh mẫu tốt sẽ cho kết quả tốt hơn</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}