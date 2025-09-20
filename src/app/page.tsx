"use client"

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from "sonner";

// Voice Cloning Components
import FileUpload from '@/components/voice-cloning/FileUpload';
import AdvancedSettings from '@/components/voice-cloning/AdvancedSettings';
import ProgressBar from '@/components/voice-cloning/ProgressBar';
import ResultSection from '@/components/voice-cloning/ResultSection';

// Types and Utils
import { 
  AudioFile, 
  VoiceCloningSettings, 
  ProcessingStatus, 
  VoiceCloningResponse 
} from '@/types/voice-cloning';
import { DEFAULT_SETTINGS, PROCESSING_STAGES } from '@/lib/constants';
import { uploadAudioFile, processVoiceCloning } from '@/lib/api-client';
import { validateText, storage } from '@/lib/utils';

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: 'voice-cloning-settings',
  HISTORY: 'voice-cloning-history',
  LAST_TEXT: 'voice-cloning-last-text'
};

export default function VoiceClonePage() {
  // State management
  const [selectedAudio, setSelectedAudio] = useState<AudioFile | null>(null);
  const [inputText, setInputText] = useState(() => 
    storage.get(STORAGE_KEYS.LAST_TEXT, '')
  );
  const [settings, setSettings] = useState<VoiceCloningSettings>(() => 
    storage.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    progress: 0,
    message: '',
    stage: 'upload'
  });
  const [result, setResult] = useState<VoiceCloningResponse | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Save settings to localStorage when changed
  const handleSettingsChange = useCallback((newSettings: VoiceCloningSettings) => {
    setSettings(newSettings);
    storage.set(STORAGE_KEYS.SETTINGS, newSettings);
  }, []);

  // Save text to localStorage
  const handleTextChange = useCallback((text: string) => {
    setInputText(text);
    storage.set(STORAGE_KEYS.LAST_TEXT, text);
  }, []);

  // File selection handler
  const handleFileSelect = useCallback((audioFile: AudioFile | null) => {
    setSelectedAudio(audioFile);
    // Reset result when new file is selected
    setResult(null);
  }, []);

  // Process voice cloning
  const handleProcessVoiceCloning = useCallback(async () => {
    if (!selectedAudio) {
      toast.error('Vui lòng chọn file âm thanh mẫu');
      return;
    }

    // Validate text
    const textValidation = validateText(inputText);
    if (!textValidation.isValid) {
      toast.error(textValidation.error);
      return;
    }

    setResult(null);
    setProcessingStatus({
      isProcessing: true,
      progress: 10,
      message: PROCESSING_STAGES.UPLOAD,
      stage: 'upload'
    });

    try {
      // Step 1: Upload audio file
      const uploadResult = await uploadAudioFile(selectedAudio.file);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Lỗi tải file lên');
      }

      setProcessingStatus({
        isProcessing: true,
        progress: 30,
        message: PROCESSING_STAGES.PROCESSING,
        stage: 'processing'
      });

      // Step 2: Process voice cloning
      const processingResult = await processVoiceCloning(
        inputText,
        uploadResult.filePath!,
        settings
      );

      setProcessingStatus({
        isProcessing: true,
        progress: 80,
        message: PROCESSING_STAGES.GENERATING,
        stage: 'generating'
      });

      // Simulate final processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (!processingResult.success) {
        throw new Error(processingResult.error || 'Lỗi xử lý voice cloning');
      }

      // Step 3: Complete
      setProcessingStatus({
        isProcessing: false,
        progress: 100,
        message: PROCESSING_STAGES.COMPLETE,
        stage: 'complete'
      });

      setResult(processingResult);
      toast.success('Voice cloning hoàn thành!');

      // Save to history
      // Implementation for history can be added here

    } catch (error) {
      console.error('Voice cloning error:', error);
      
      setProcessingStatus({
        isProcessing: false,
        progress: 0,
        message: PROCESSING_STAGES.ERROR,
        stage: 'error'
      });

      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    }
  }, [selectedAudio, inputText, settings]);

  // Reset for new processing
  const handleNewProcessing = useCallback(() => {
    setResult(null);
    setProcessingStatus({
      isProcessing: false,
      progress: 0,
      message: '',
      stage: 'upload'
    });
  }, []);

  // Check if ready to process
  const isReadyToProcess = selectedAudio && inputText.trim().length > 0 && !processingStatus.isProcessing;

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Voice Cloning AI
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Tạo giọng nói AI từ mẫu âm thanh của bạn. Nhập văn bản tiếng Việt và nghe AI đọc với giọng nói đã nhân bản.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid gap-8">
        {/* Step 1: Upload Audio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </span>
              <span>Chọn file âm thanh mẫu</span>
            </CardTitle>
            <CardDescription>
              Upload file âm thanh chứa giọng nói bạn muốn nhân bản. Chất lượng âm thanh tốt sẽ cho kết quả tốt hơn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={selectedAudio}
              isProcessing={processingStatus.isProcessing}
            />
          </CardContent>
        </Card>

        {/* Step 2: Input Text */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </span>
              <span>Nhập văn bản cần đọc</span>
            </CardTitle>
            <CardDescription>
              Viết văn bản tiếng Việt mà bạn muốn AI đọc với giọng nói đã nhân bản.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input-text">Văn bản (tối đa 2000 ký tự)</Label>
              <Textarea
                id="input-text"
                placeholder="Nhập văn bản tiếng Việt mà bạn muốn AI đọc..."
                value={inputText}
                onChange={(e) => handleTextChange(e.target.value)}
                disabled={processingStatus.isProcessing}
                rows={6}
                className="resize-none"
                maxLength={2000}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tiếng Việt được hỗ trợ đầy đủ</span>
                <span>{inputText.length}/2000 ký tự</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Advanced Settings */}
        <AdvancedSettings
          settings={settings}
          onSettingsChange={handleSettingsChange}
          isOpen={showAdvancedSettings}
          onOpenChange={setShowAdvancedSettings}
          isProcessing={processingStatus.isProcessing}
        />

        {/* Processing Button */}
        <Card>
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <Button
                onClick={handleProcessVoiceCloning}
                disabled={!isReadyToProcess}
                size="lg"
                className="px-8 py-4 text-lg h-auto"
              >
                {processingStatus.isProcessing ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    🎵 Bắt đầu Voice Cloning
                  </>
                )}
              </Button>
              
              {!selectedAudio && (
                <p className="text-sm text-muted-foreground">
                  Vui lòng chọn file âm thanh mẫu để tiếp tục
                </p>
              )}
              
              {selectedAudio && !inputText.trim() && (
                <p className="text-sm text-muted-foreground">
                  Vui lòng nhập văn bản để tiếp tục
                </p>
              )}
              
              {isReadyToProcess && (
                <p className="text-sm text-muted-foreground">
                  Sẵn sàng xử lý! Quá trình có thể mất từ 30 giây đến vài phút.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        {(processingStatus.isProcessing || processingStatus.stage === 'complete' || processingStatus.stage === 'error') && (
          <ProgressBar status={processingStatus} />
        )}

        {/* Results */}
        {result && result.success && (
          <>
            <Separator />
            <ResultSection
              result={result}
              originalText={inputText}
              onNewProcessing={handleNewProcessing}
            />
          </>
        )}
      </div>

      {/* Footer Info */}
      <Card className="mt-12">
        <CardContent className="py-6">
          <div className="text-center space-y-3">
            <h3 className="font-medium">🤖 Powered by Seed-VC AI</h3>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Công nghệ Voice Cloning tiên tiến giúp tạo ra giọng nói tự nhiên và sống động. 
              Phù hợp cho nội dung giáo dục, podcast, audiobook và các ứng dụng sáng tạo khác.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <span>✨ Chất lượng cao</span>
              <span>⚡ Xử lý nhanh</span>
              <span>🇻🇳 Hỗ trợ tiếng Việt</span>
              <span>🔒 An toàn bảo mật</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}