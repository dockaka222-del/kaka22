"use client"

import React, { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

import { VoiceCloningSettings } from '@/types/voice-cloning';
import { DEFAULT_SETTINGS, SETTINGS_PRESETS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface AdvancedSettingsProps {
  settings: VoiceCloningSettings;
  onSettingsChange: (settings: VoiceCloningSettings) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isProcessing?: boolean;
  className?: string;
}

export default function AdvancedSettings({
  settings,
  onSettingsChange,
  isOpen,
  onOpenChange,
  isProcessing = false,
  className
}: AdvancedSettingsProps) {

  const handleSettingChange = useCallback(<K extends keyof VoiceCloningSettings>(
    key: K,
    value: VoiceCloningSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  }, [settings, onSettingsChange]);

  const handleSliderChange = useCallback((key: keyof VoiceCloningSettings) => 
    (value: number[]) => handleSettingChange(key, value[0])
  , [handleSettingChange]);

  const handleSwitchChange = useCallback((key: keyof VoiceCloningSettings) => 
    (checked: boolean) => handleSettingChange(key, checked)
  , [handleSettingChange]);

  const handlePresetSelect = useCallback((presetName: string) => {
    const preset = SETTINGS_PRESETS.find(p => p.name === presetName);
    if (preset) {
      onSettingsChange({
        ...DEFAULT_SETTINGS,
        ...preset.settings
      });
    }
  }, [onSettingsChange]);

  const resetToDefaults = useCallback(() => {
    onSettingsChange(DEFAULT_SETTINGS);
  }, [onSettingsChange]);

  return (
    <Card className={cn("w-full", className)}>
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Cài đặt nâng cao</CardTitle>
                <CardDescription>
                  Điều chỉnh các tham số xử lý giọng nói
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" disabled={isProcessing}>
                {isOpen ? '🔽' : '🔼'}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            
            {/* Presets */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Cài đặt có sẵn</Label>
              <div className="flex flex-wrap gap-2">
                {SETTINGS_PRESETS.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetSelect(preset.name)}
                    disabled={isProcessing}
                    className="text-xs"
                  >
                    {preset.name}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefaults}
                  disabled={isProcessing}
                  className="text-xs"
                >
                  Khôi phục mặc định
                </Button>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="advanced-mode" className="text-sm font-medium">
                  Chế độ nâng cao
                </Label>
                <Switch
                  id="advanced-mode"
                  checked={settings.useAdvancedMode}
                  onCheckedChange={handleSwitchChange('useAdvancedMode')}
                  disabled={isProcessing}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {settings.useAdvancedMode 
                  ? "Sử dụng thuật toán tiên tiến với nhiều tùy chọn hơn (chậm hơn)" 
                  : "Sử dụng thuật toán đơn giản và nhanh"
                }
              </p>
            </div>

            {/* Common Settings */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Diffusion Steps */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Số bước xử lý: {settings.diffusionSteps}
                </Label>
                <Slider
                  value={[settings.diffusionSteps]}
                  onValueChange={handleSliderChange('diffusionSteps')}
                  max={settings.useAdvancedMode ? 100 : 50}
                  min={5}
                  step={5}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Số bước cao hơn = chất lượng tốt hơn nhưng xử lý lâu hơn
                </p>
              </div>

              {/* Length Adjust */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Điều chỉnh độ dài: {settings.lengthAdjust.toFixed(2)}x
                </Label>
                <Slider
                  value={[settings.lengthAdjust]}
                  onValueChange={handleSliderChange('lengthAdjust')}
                  max={2}
                  min={0.5}
                  step={0.1}
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Tăng/giảm tốc độ nói của audio kết quả
                </p>
              </div>
            </div>

            {/* Advanced Mode Settings */}
            {settings.useAdvancedMode ? (
              <div className="space-y-6 border-t pt-6">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Cài đặt chế độ nâng cao
                </h4>
                
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Temperature */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Độ sáng tạo: {settings.temperature.toFixed(2)}
                    </Label>
                    <Slider
                      value={[settings.temperature]}
                      onValueChange={handleSliderChange('temperature')}
                      max={2}
                      min={0.1}
                      step={0.1}
                      disabled={isProcessing}
                    />
                  </div>

                  {/* Top-p */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Top-p: {settings.topP.toFixed(2)}
                    </Label>
                    <Slider
                      value={[settings.topP]}
                      onValueChange={handleSliderChange('topP')}
                      max={1}
                      min={0.1}
                      step={0.1}
                      disabled={isProcessing}
                    />
                  </div>

                  {/* Similarity CFG Rate */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Độ tương đồng: {settings.similarityCfgRate.toFixed(2)}
                    </Label>
                    <Slider
                      value={[settings.similarityCfgRate]}
                      onValueChange={handleSliderChange('similarityCfgRate')}
                      max={1}
                      min={0}
                      step={0.1}
                      disabled={isProcessing}
                    />
                  </div>

                  {/* Repetition Penalty */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Tránh lặp: {settings.repetitionPenalty.toFixed(2)}
                    </Label>
                    <Slider
                      value={[settings.repetitionPenalty]}
                      onValueChange={handleSliderChange('repetitionPenalty')}
                      max={2}
                      min={0.5}
                      step={0.1}
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                {/* Switches */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="convert-style" className="text-sm">
                      Chuyển đổi phong cách
                    </Label>
                    <Switch
                      id="convert-style"
                      checked={settings.convertStyle}
                      onCheckedChange={handleSwitchChange('convertStyle')}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="anonymization" className="text-sm">
                      Chỉ ẩn danh
                    </Label>
                    <Switch
                      id="anonymization"
                      checked={settings.anonymizationOnly}
                      onCheckedChange={handleSwitchChange('anonymizationOnly')}
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Simple Mode Settings */
              <div className="space-y-6 border-t pt-6">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Cài đặt chế độ đơn giản
                </h4>
                
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Inference CFG Rate */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Cường độ xử lý: {settings.inferenceCfgRate.toFixed(2)}
                    </Label>
                    <Slider
                      value={[settings.inferenceCfgRate]}
                      onValueChange={handleSliderChange('inferenceCfgRate')}
                      max={1}
                      min={0}
                      step={0.1}
                      disabled={isProcessing}
                    />
                  </div>

                  {/* Pitch Shift */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Thay đổi cao độ: {settings.pitchShift > 0 ? '+' : ''}{settings.pitchShift}
                    </Label>
                    <Slider
                      value={[settings.pitchShift]}
                      onValueChange={handleSliderChange('pitchShift')}
                      max={12}
                      min={-12}
                      step={1}
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                {/* F0 Settings */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="f0-condition" className="text-sm">
                      Điều kiện F0
                    </Label>
                    <Switch
                      id="f0-condition"
                      checked={settings.f0Condition}
                      onCheckedChange={handleSwitchChange('f0Condition')}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-f0" className="text-sm">
                      Tự động điều chỉnh F0
                    </Label>
                    <Switch
                      id="auto-f0"
                      checked={settings.autoF0Adjust}
                      onCheckedChange={handleSwitchChange('autoF0Adjust')}
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </div>
            )}

          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}