
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, MessageSquare, UserPlus, Pause, Video } from 'lucide-react';
import iOSStatusBar from './iOSStatusBar';

interface AIState {
  isAISpeaking: boolean;
  isListening: boolean;
  isUserSpeaking: boolean;
  error: string | null;
  conversationState: 'idle' | 'user_speaking' | 'processing' | 'ai_speaking';
}

interface CallInterfaceProps {
  onEndCall: () => void;
  callDuration: number;
  isConnected: boolean;
  aiState?: AIState;
  onManualTurnComplete?: () => void;
  getVolumeLevel?: () => number;
}

const CallInterface = ({ 
  onEndCall, 
  callDuration, 
  isConnected, 
  aiState, 
  onManualTurnComplete,
  getVolumeLevel 
}: CallInterfaceProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Update audio level visualization
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (aiState?.isAISpeaking) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
    } else if (aiState?.isUserSpeaking && getVolumeLevel) {
      interval = setInterval(() => {
        setAudioLevel(getVolumeLevel() * 100);
      }, 100);
    } else {
      setAudioLevel(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [aiState?.isAISpeaking, aiState?.isUserSpeaking, getVolumeLevel]);

  const getStatusText = () => {
    if (!isConnected) return 'Connecting...';
    if (aiState?.error) return 'Connection Error';
    
    switch (aiState?.conversationState) {
      case 'user_speaking':
        return 'Speaking...';
      case 'processing':
        return 'Processing...';
      case 'ai_speaking':
        return 'AI Speaking';
      default:
        return 'Connected';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sf-pro">
      {/* Status Bar */}
      <iOSStatusBar />

      {/* Call Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        
        {/* Contact Info */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 bg-gray-600 rounded-full mb-6 flex items-center justify-center">
            <div className="w-16 h-16 bg-gray-400 rounded-full" />
          </div>
          
          <h1 className="text-3xl font-light mb-2">Emergency Contact</h1>
          <p className="text-green-400 text-lg font-medium mb-2">
            {getStatusText()}
          </p>
          <p className="text-gray-400 text-lg">
            {formatTime(callDuration)}
          </p>
        </div>

        {/* Audio Visualization */}
        {(aiState?.isAISpeaking || aiState?.isUserSpeaking) && (
          <div className="mb-8 flex items-center justify-center gap-1">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-100 ${
                  aiState?.isAISpeaking ? 'bg-green-400' : 'bg-blue-400'
                } ${
                  audioLevel > i * 5 ? 'h-8' : 'h-2'
                }`}
              />
            ))}
          </div>
        )}

        {/* Error Message */}
        {aiState?.error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-8 text-center">
            <p className="text-red-400 text-sm">{aiState.error}</p>
          </div>
        )}

        {/* Status Message */}
        <div className="text-center mb-12">
          <p className="text-gray-300 text-sm">
            {aiState?.conversationState === 'user_speaking' 
              ? 'Speak naturally - AI will detect when you finish'
              : aiState?.conversationState === 'processing'
              ? 'Processing your message...'
              : aiState?.conversationState === 'ai_speaking'
              ? 'Emergency contact is responding'
              : 'Ready to listen'
            }
          </p>
        </div>
      </div>

      {/* Call Controls */}
      <div className="px-8 pb-12">
        {/* First row of controls */}
        <div className="flex justify-center gap-16 mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="h-16 w-16 rounded-full bg-gray-800 hover:bg-gray-700"
            disabled
          >
            <MessageSquare className="h-6 w-6 text-white" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-16 w-16 rounded-full bg-gray-800 hover:bg-gray-700"
            disabled
          >
            <Video className="h-6 w-6 text-white" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-16 w-16 rounded-full bg-gray-800 hover:bg-gray-700"
            disabled
          >
            <UserPlus className="h-6 w-6 text-white" />
          </Button>
        </div>

        {/* Second row of controls */}
        <div className="flex justify-center gap-16 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className={`h-16 w-16 rounded-full ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6 text-white" />
            ) : (
              <Mic className="h-6 w-6 text-white" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-16 w-16 rounded-full bg-gray-800 hover:bg-gray-700"
            disabled
          >
            {aiState?.isAISpeaking ? (
              <Volume2 className="h-6 w-6 text-white" />
            ) : (
              <VolumeX className="h-6 w-6 text-gray-400" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-16 w-16 rounded-full bg-gray-800 hover:bg-gray-700"
            disabled
          >
            <Pause className="h-6 w-6 text-white" />
          </Button>
        </div>

        {/* End Call Button */}
        <div className="flex justify-center">
          <Button
            onClick={onEndCall}
            className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 shadow-lg"
          >
            <PhoneOff className="h-6 w-6 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CallInterface;
