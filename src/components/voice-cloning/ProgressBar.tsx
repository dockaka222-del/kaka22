"use client"

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProcessingStatus } from '@/types/voice-cloning';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  status: ProcessingStatus;
  className?: string;
}

export default function ProgressBar({ status, className }: ProgressBarProps) {
  const getStageColor = (stage: ProcessingStatus['stage']) => {
    switch (stage) {
      case 'upload':
        return 'text-blue-600 dark:text-blue-400';
      case 'processing':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'generating':
        return 'text-purple-600 dark:text-purple-400';
      case 'complete':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStageIcon = (stage: ProcessingStatus['stage']) => {
    switch (stage) {
      case 'upload':
        return '📤';
      case 'processing':
        return '⚙️';
      case 'generating':
        return '🎵';
      case 'complete':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };



  if (!status.isProcessing && status.stage !== 'complete' && status.stage !== 'error') {
    return null;
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getStageIcon(status.stage)}</span>
            <div className="flex-1">
              <h3 className={cn("font-medium", getStageColor(status.stage))}>
                {status.message}
              </h3>
              {status.stage !== 'error' && status.stage !== 'complete' && (
                <p className="text-sm text-muted-foreground mt-1">
                  Vui lòng không tắt trang web trong quá trình xử lý...
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={status.progress} 
              className="w-full h-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tiến trình</span>
              <span>{Math.round(status.progress)}%</span>
            </div>
          </div>

          {/* Stage Indicators */}
          <div className="flex justify-between text-xs">
            <div className={cn(
              "flex flex-col items-center space-y-1 transition-colors",
              status.stage === 'upload' || (status.progress > 0) ? 'text-primary' : 'text-muted-foreground'
            )}>
              <span>📤</span>
              <span>Tải lên</span>
            </div>
            <div className={cn(
              "flex flex-col items-center space-y-1 transition-colors",
              status.stage === 'processing' || (status.progress > 25) ? 'text-primary' : 'text-muted-foreground'
            )}>
              <span>⚙️</span>
              <span>Xử lý</span>
            </div>
            <div className={cn(
              "flex flex-col items-center space-y-1 transition-colors",
              status.stage === 'generating' || (status.progress > 50) ? 'text-primary' : 'text-muted-foreground'
            )}>
              <span>🎵</span>
              <span>Tạo audio</span>
            </div>
            <div className={cn(
              "flex flex-col items-center space-y-1 transition-colors",
              status.stage === 'complete' || (status.progress === 100) ? 'text-green-600' : 'text-muted-foreground'
            )}>
              <span>✅</span>
              <span>Hoàn thành</span>
            </div>
          </div>

          {/* Processing Animation */}
          {status.isProcessing && status.stage !== 'error' && (
            <div className="flex justify-center pt-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {status.stage === 'error' && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                Đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại.
              </p>
            </div>
          )}

          {/* Success Message */}
          {status.stage === 'complete' && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                🎉 Xử lý hoàn tất! Bạn có thể nghe thử và tải xuống kết quả bên dưới.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}