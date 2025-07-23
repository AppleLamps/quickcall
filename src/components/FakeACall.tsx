
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import CallInterface from './CallInterface';
import iOSHomeScreen from './iOSHomeScreen';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { useToast } from '@/components/ui/use-toast';

type CallState = 'idle' | 'ringing' | 'connected' | 'ai-conversation' | 'ended';

const FakeACall = () => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const { playRingtone, stopRingtone } = useAudioPlayer();
  const geminiLive = useGeminiLive();
  const { toast } = useToast();

  // Call timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (callState === 'connected' || callState === 'ai-conversation') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  const initiateCall = async () => {
    try {
      setCallState('ringing');
      
      // Play ringtone
      await playRingtone();
      
      // Ring for 2-3 rings then connect to AI
      setTimeout(async () => {
        stopRingtone();
        setCallState('connected');
        setCallDuration(0);
        
        // Connect to Gemini Live API
        await geminiLive.connect();
        
        // Transition to AI conversation after brief moment
        setTimeout(() => {
          setCallState('ai-conversation');
          toast({
            title: "Emergency Contact Connected",
            description: "Your emergency contact is now on the line.",
          });
        }, 1000);
        
      }, 5000);
      
    } catch (error) {
      console.error('Failed to initiate call:', error);
      toast({
        title: "Call Failed",
        description: "Unable to initiate call. Please try again.",
        variant: "destructive",
      });
      setCallState('idle');
    }
  };

  const endCall = () => {
    stopRingtone();
    geminiLive.disconnect();
    setCallState('ended');
    
    setTimeout(() => {
      setCallState('idle');
      setCallDuration(0);
    }, 2000);

    toast({
      title: "Call Ended",
      description: "Call completed successfully.",
    });
  };

  // Show call interface when connected or in AI conversation
  if (callState === 'connected' || callState === 'ai-conversation') {
    return (
      <CallInterface
        onEndCall={endCall}
        callDuration={callDuration}
        isConnected={callState === 'ai-conversation'}
        aiState={callState === 'ai-conversation' ? {
          isAISpeaking: geminiLive.isAISpeaking,
          isListening: geminiLive.isListening,
          isUserSpeaking: geminiLive.isUserSpeaking,
          error: geminiLive.error,
          conversationState: geminiLive.conversationState
        } : undefined}
        onManualTurnComplete={geminiLive.manualTurnComplete}
        getVolumeLevel={geminiLive.getVolumeLevel}
      />
    );
  }

  // Show end call screen
  if (callState === 'ended') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-sf-pro">
        <div className="text-center">
          <div className="text-2xl font-light mb-4">Call Ended</div>
          <p className="text-gray-400">Returning to home screen...</p>
        </div>
      </div>
    );
  }

  // Show ringing state
  if (callState === 'ringing') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col font-sf-pro">
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="text-center mb-8">
            <div className="w-32 h-32 bg-gray-600 rounded-full mb-6 flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 bg-gray-400 rounded-full" />
            </div>
            
            <h1 className="text-3xl font-light mb-2">Emergency Contact</h1>
            <p className="text-gray-400 text-lg">Calling...</p>
          </div>
        </div>
        
        <div className="pb-12 flex justify-center">
          <button
            onClick={endCall}
            className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 shadow-lg flex items-center justify-center"
          >
            <div className="w-6 h-6 bg-white rounded-sm" />
          </button>
        </div>
      </div>
    );
  }

  // Show home screen
  return <iOSHomeScreen onAppPress={initiateCall} />;
};

export default FakeACall;
