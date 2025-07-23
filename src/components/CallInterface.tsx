
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Square } from 'lucide-react';

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
      // AI speaking - show animated bars
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
    } else if (aiState?.isUserSpeaking && getVolumeLevel) {
      // User speaking - show real volume level
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

  const getConnectionStatus = () => {
    if (!isConnected) return 'Connecting...';
    if (aiState?.error) {
      if (aiState.error.includes('API key')) return 'API Key Missing';
      if (aiState.error.includes('Connection failed')) return 'Connection Failed';
      return 'Connection Error';
    }
    
    switch (aiState?.conversationState) {
      case 'user_speaking':
        return 'You are speaking...';
      case 'processing':
        return 'Processing...';
      case 'ai_speaking':
        return 'Emergency Contact Speaking';
      case 'idle':
        return aiState?.isListening ? 'Listening - Speak now' : 'Ready';
      default:
        return 'Connected';
    }
  };

  const getStatusColor = () => {
    if (!isConnected) return 'bg-muted text-muted-foreground';
    if (aiState?.error) return 'bg-destructive/20 text-destructive';
    
    switch (aiState?.conversationState) {
      case 'user_speaking':
        return 'bg-blue-500/20 text-blue-500';
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-500 animate-pulse';
      case 'ai_speaking':
        return 'bg-primary/20 text-primary animate-pulse';
      case 'idle':
        return 'bg-call-active/20 text-call-active';
      default:
        return 'bg-call-active/20 text-call-active';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in-up">
      <Card className="w-full max-w-sm p-8 bg-gradient-surface shadow-surface border-border/50">
        {/* Connection status */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor()}`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected && !aiState?.error ? 'bg-call-active animate-pulse' : 'bg-muted-foreground'
            }`} />
            {getConnectionStatus()}
          </div>
        </div>

        {/* Caller info */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Emergency Contact
          </h2>
          <p className="text-muted-foreground">
            {aiState ? 'AI Assistant Ready' : 'Connecting...'}
          </p>
        </div>

        {/* Audio level visualization */}
        {(aiState?.isAISpeaking || aiState?.isUserSpeaking) && (
          <div className="mb-6 flex items-center justify-center gap-1">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-100 ${
                  aiState?.isAISpeaking ? 'bg-primary' : 'bg-blue-500'
                } ${
                  audioLevel > i * 10 ? 'h-8' : 'h-2'
                }`}
              />
            ))}
          </div>
        )}

        {/* Call timer */}
        <div className="text-center mb-8">
          <div className="text-3xl font-mono font-bold text-foreground">
            {formatTime(callDuration)}
          </div>
        </div>

        {/* Error message */}
        {aiState?.error && (
          <div className="text-center mb-4 p-3 bg-destructive/20 text-destructive rounded-md text-sm">
            {aiState.error}
            {aiState.error.includes('API key') && (
              <div className="mt-2 text-xs">
                Please configure your Gemini API key in the project settings
              </div>
            )}
          </div>
        )}

        {/* Call controls */}
        <div className="flex items-center justify-center gap-6">
          {/* Mute button */}
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleMute}
            className="h-12 w-12 rounded-full"
          >
            {isMuted ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>

          {/* Manual turn complete button */}
          {onManualTurnComplete && aiState?.conversationState === 'user_speaking' && (
            <Button
              variant="secondary"
              size="icon"
              onClick={onManualTurnComplete}
              className="h-12 w-12 rounded-full bg-blue-500/20 hover:bg-blue-500/30"
              title="Stop speaking and let AI respond"
            >
              <Square className="h-5 w-5" />
            </Button>
          )}

          {/* Speaker indicator */}
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full"
            disabled
          >
            {aiState?.isAISpeaking ? (
              <Volume2 className="h-5 w-5 text-primary" />
            ) : (
              <VolumeX className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>

          {/* End call button */}
          <Button
            variant="call-end"
            size="call"
            onClick={onEndCall}
            className="h-16 w-16"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>

        {/* Status text */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            {aiState?.conversationState === 'user_speaking' 
              ? 'Speaking... Tap square to finish your turn'
              : aiState?.conversationState === 'processing'
              ? 'Processing your message...'
              : aiState?.conversationState === 'ai_speaking'
              ? 'Your emergency contact is speaking'
              : aiState?.isListening
              ? 'Speak naturally - AI will detect when you finish'
              : 'Tap to end call'
            }
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CallInterface;
