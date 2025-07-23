
import { useRef, useCallback, useState, useEffect } from 'react';
import { AudioRecorder } from '@/utils/audioRecorder';
import { AudioEncoder } from '@/utils/audioEncoder';
import { AudioQueue } from '@/utils/audioQueue';

interface GeminiLiveState {
  isConnected: boolean;
  isAISpeaking: boolean;
  isListening: boolean;
  isUserSpeaking: boolean;
  error: string | null;
  conversationState: 'idle' | 'user_speaking' | 'processing' | 'ai_speaking';
}

export const useGeminiLive = () => {
  const [state, setState] = useState<GeminiLiveState>({
    isConnected: false,
    isAISpeaking: false,
    isListening: false,
    isUserSpeaking: false,
    error: null,
    conversationState: 'idle'
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize with 24kHz for output (Gemini outputs at 24kHz)
    audioQueueRef.current = new AudioQueue(24000);
    
    return () => {
      disconnect();
    };
  }, []);

  const handleSpeechStart = useCallback(() => {
    console.log('User started speaking');
    setState(prev => ({ 
      ...prev, 
      isUserSpeaking: true,
      conversationState: 'user_speaking'
    }));
    
    // Clear any existing timeout
    if (turnTimeoutRef.current) {
      clearTimeout(turnTimeoutRef.current);
      turnTimeoutRef.current = null;
    }
  }, []);

  const handleSpeechEnd = useCallback(() => {
    console.log('User stopped speaking - sending turn complete');
    setState(prev => ({ 
      ...prev, 
      isUserSpeaking: false,
      conversationState: 'processing'
    }));
    
    // Send turn complete after a brief delay to ensure all audio was sent
    turnTimeoutRef.current = setTimeout(() => {
      sendTurnComplete();
    }, 500);
  }, []);

  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
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
          console.log('Received from edge function:', data);
          
          if (data.type === 'setup_complete') {
            console.log('Gemini Live setup completed');
            setState(prev => ({ ...prev, conversationState: 'idle' }));
          }
          
          if (data.type === 'audio_response' && data.audioData) {
            console.log('Received audio response from Gemini');
            setState(prev => ({ 
              ...prev, 
              isAISpeaking: true,
              conversationState: 'ai_speaking'
            }));
            
            // Decode and play audio (24kHz output)
            const audioData = AudioEncoder.decodeFromGemini(data.audioData);
            audioQueueRef.current?.addToQueue(audioData);
          }
          
          if (data.type === 'text_response' && data.text) {
            console.log('Received text response from Gemini:', data.text);
          }
          
          if (data.type === 'turn_complete') {
            console.log('AI turn complete - ready for user input');
            setState(prev => ({ 
              ...prev, 
              isAISpeaking: false,
              conversationState: 'idle'
            }));
          }
          
          if (data.type === 'error') {
            console.error('Error from Gemini:', data.error);
            setState(prev => ({ ...prev, error: data.error }));
          }
          
        } catch (error) {
          console.error('Error parsing message from edge function:', error);
          setState(prev => ({ ...prev, error: 'Failed to parse response' }));
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('Connection closed:', event.code, event.reason);
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isAISpeaking: false,
          isListening: false,
          isUserSpeaking: false,
          conversationState: 'idle',
          error: event.code === 1008 ? 'API key not configured' : null
        }));
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Connection failed',
          isConnected: false,
          conversationState: 'idle'
        }));
      };

    } catch (error) {
      console.error('Failed to connect:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to connect to AI service',
        conversationState: 'idle'
      }));
    }
  }, []);

  const startAudioRecording = useCallback(async () => {
    try {
      audioRecorderRef.current = new AudioRecorder(
        (audioData) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const encodedAudio = AudioEncoder.encodeForGemini(audioData);
            
            const message = {
              type: 'audio_input',
              audioData: encodedAudio
            };
            
            console.log('Sending audio chunk to edge function');
            wsRef.current.send(JSON.stringify(message));
          }
        },
        handleSpeechStart,
        handleSpeechEnd
      );

      await audioRecorderRef.current.start();
      setState(prev => ({ ...prev, isListening: true }));
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to access microphone',
        conversationState: 'idle'
      }));
    }
  }, [handleSpeechStart, handleSpeechEnd]);

  const disconnect = useCallback(() => {
    if (turnTimeoutRef.current) {
      clearTimeout(turnTimeoutRef.current);
      turnTimeoutRef.current = null;
    }

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
      isUserSpeaking: false,
      error: null,
      conversationState: 'idle'
    });
  }, []);

  const sendTurnComplete = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Sending turn complete signal to edge function');
      const message = {
        type: 'turn_complete'
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const manualTurnComplete = useCallback(() => {
    console.log('Manual turn complete triggered');
    handleSpeechEnd();
  }, [handleSpeechEnd]);

  const getVolumeLevel = useCallback(() => {
    return audioRecorderRef.current?.getVolumeLevel() || 0;
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    sendTurnComplete,
    manualTurnComplete,
    getVolumeLevel
  };
};
