"use client"

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
  onEnded?: () => void;
  autoPlay?: boolean;
}

export default function AudioPlayer({ 
  src, 
  title = "Kết quả audio", 
  className,
  onEnded,
  autoPlay = false
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Update time
  const updateTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  // Handle load
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  }, []);

  // Handle play/pause
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [isPlaying]);

  // Handle seek
  const handleSeek = useCallback((value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, []);

  // Handle volume change
  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  // Handle ended
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (onEnded) {
      onEnded();
    }
  }, [onEnded]);

  // Effect cho audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [updateTime, handleLoadedMetadata, handleEnded]);

  // Auto play effect
  useEffect(() => {
    if (autoPlay && audioRef.current && !isLoading) {
      audioRef.current.play();
    }
  }, [autoPlay, isLoading]);

  // Progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          className="hidden"
        />

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            disabled={isLoading || duration === 0}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          {/* Play/Pause Button */}
          <Button
            onClick={togglePlayPause}
            disabled={isLoading}
            size="lg"
            className="h-12 w-12 rounded-full p-0"
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            ) : isPlaying ? (
              <span className="text-lg">⏸️</span>
            ) : (
              <span className="text-lg">▶️</span>
            )}
          </Button>

          {/* Volume Control */}
          <div className="flex items-center space-x-2 min-w-0 flex-1 max-w-xs">
            <Button
              onClick={toggleMute}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
            >
              {isMuted || volume === 0 ? (
                <span>🔇</span>
              ) : volume < 0.5 ? (
                <span>🔉</span>
              ) : (
                <span>🔊</span>
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="flex-1"
            />
          </div>
        </div>

        {/* Download Button */}
        <div className="flex justify-center pt-2">
          <Button asChild variant="outline">
            <a
              href={src}
              download={`voice-clone-${Date.now()}.wav`}
              className="inline-flex items-center space-x-2"
            >
              <span>📥</span>
              <span>Tải xuống</span>
            </a>
          </Button>
        </div>

        {/* Progress Display */}
        {isLoading && (
          <div className="text-center text-sm text-muted-foreground">
            Đang tải audio...
          </div>
        )}
        
        {!isLoading && duration > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Tiến trình: {progressPercentage.toFixed(1)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}