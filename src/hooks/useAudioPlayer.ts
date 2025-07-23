import { useRef, useCallback } from 'react';

interface UseAudioPlayerReturn {
  playRingtone: () => Promise<void>;
  stopRingtone: () => void;
  isPlaying: boolean;
}

export const useAudioPlayer = (): UseAudioPlayerReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  const playRingtone = useCallback(async (): Promise<void> => {
    try {
      // Create audio context for better browser compatibility
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Generate a realistic phone ring tone
      const sampleRate = audioContext.sampleRate;
      const duration = 1.5; // Ring duration in seconds
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);

      // Generate dual-tone ring (like a traditional phone)
      for (let i = 0; i < buffer.length; i++) {
        const time = i / sampleRate;
        const envelope = Math.sin(time * Math.PI * 2) * 0.3; // Ring envelope
        const tone1 = Math.sin(time * 440 * 2 * Math.PI) * 0.3; // A4 note
        const tone2 = Math.sin(time * 554.37 * 2 * Math.PI) * 0.2; // C#5 note
        data[i] = (tone1 + tone2) * envelope;
      }

      // Create and play the audio
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(audioContext.destination);
      
      isPlayingRef.current = true;
      source.start();
      
      // Store reference for stopping
      audioRef.current = source as any;

      return Promise.resolve();
    } catch (error) {
      console.error('Failed to play ringtone:', error);
      return Promise.reject(error);
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (audioRef.current && isPlayingRef.current) {
      try {
        (audioRef.current as any).stop();
        isPlayingRef.current = false;
      } catch (error) {
        console.error('Failed to stop ringtone:', error);
      }
    }
  }, []);

  return {
    playRingtone,
    stopRingtone,
    isPlaying: isPlayingRef.current,
  };
};