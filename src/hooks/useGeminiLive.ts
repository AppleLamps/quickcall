
import { useRef, useCallback, useState, useEffect } from 'react';
import { AudioRecorder } from '@/utils/audioRecorder';
import { AudioEncoder } from '@/utils/audioEncoder';
import { AudioQueue } from '@/utils/audioQueue';

interface GeminiLiveState {
  isConnected: boolean;
  isAISpeaking: boolean;
  isListening: boolean;
  error: string | null;
}

export const useGeminiLive = () => {
  const [state, setState] = useState<GeminiLiveState>({
    isConnected: false,
    isAISpeaking: false,
    isListening: false,
    error: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);

  useEffect(() => {
    // Initialize with 24kHz for output
    audioQueueRef.current = new AudioQueue(24000);
    
    return () => {
      disconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Use correct WebSocket URL with /functions/v1/ prefix
      const projectId = 'keuxuonslkcvdeysdoge';
      const wsUrl = `wss://${projectId}.functions.supabase.co/functions/v1/gemini-live`;
      
      console.log('Connecting to:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Connected to Gemini Live via relay');
        setState(prev => ({ ...prev, isConnected: true }));
        startAudioRecording();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received from Gemini:', data);
          
          // Handle setup completion
          if (data.setupComplete) {
            console.log('Gemini setup completed, ready for conversation');
            return;
          }
          
          // Handle server content with audio
          if (data.serverContent) {
            const { modelTurn, turnComplete } = data.serverContent;
            
            if (modelTurn?.parts) {
              modelTurn.parts.forEach((part: any) => {
                if (part.inlineData?.mimeType === 'audio/pcm' && part.inlineData?.data) {
                  console.log('Received audio data from Gemini');
                  setState(prev => ({ ...prev, isAISpeaking: true }));
                  
                  // Decode and play audio (24kHz output)
                  const audioData = AudioEncoder.decodeFromGemini(part.inlineData.data);
                  audioQueueRef.current?.addToQueue(audioData);
                }
              });
            }
            
            if (turnComplete) {
              console.log('AI turn complete');
              setState(prev => ({ ...prev, isAISpeaking: false }));
            }
          }
          
        } catch (error) {
          console.error('Error parsing Gemini response:', error);
          setState(prev => ({ ...prev, error: 'Failed to parse response' }));
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('Gemini connection closed:', event.code, event.reason);
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isAISpeaking: false,
          isListening: false,
          error: event.code === 1008 ? 'API key not configured' : null
        }));
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Connection failed',
          isConnected: false 
        }));
      };

    } catch (error) {
      console.error('Failed to connect:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to connect to AI service' 
      }));
    }
  }, []);

  const startAudioRecording = useCallback(async () => {
    try {
      audioRecorderRef.current = new AudioRecorder((audioData) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const encodedAudio = AudioEncoder.encodeForGemini(audioData);
          
          // Use correct message format for Gemini Live API
          const message = {
            clientContent: {
              turns: [{
                role: "user",
                parts: [{
                  inlineData: {
                    mimeType: "audio/pcm",
                    data: encodedAudio
                  }
                }]
              }],
              turnComplete: false
            }
          };
          
          wsRef.current.send(JSON.stringify(message));
        }
      });

      await audioRecorderRef.current.start();
      setState(prev => ({ ...prev, isListening: true }));
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to access microphone' 
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }

    if (audioQueueRef.current) {
      audioQueueRef.current.stop();
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState({
      isConnected: false,
      isAISpeaking: false,
      isListening: false,
      error: null
    });
  }, []);

  const sendTurnComplete = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        clientContent: {
          turnComplete: true
        }
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    sendTurnComplete
  };
};
