
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface AIState {
  isAISpeaking: boolean;
  isListening: boolean;
  error: string | null;
}

interface CallInterfaceProps {
  onEndCall: () => void;
  callDuration: number;
  isConnected: boolean;
  aiState?: AIState;
}

const CallInterface = ({ onEndCall, callDuration, isConnected, aiState }: CallInterfaceProps) => {
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

  // Simulate audio level animation when AI is speaking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (aiState?.isAISpeaking) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
    } else {
      setAudioLevel(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [aiState?.isAISpeaking]);

  const getConnectionStatus = () => {
    if (!isConnected) return 'Connecting...';
    if (aiState?.error) return 'Connection Error';
    if (aiState?.isAISpeaking) return 'AI Speaking';
    if (aiState?.isListening) return 'Listening';
    return 'Connected';
  };

  const getStatusColor = () => {
    if (!isConnected) return 'bg-muted text-muted-foreground';
    if (aiState?.error) return 'bg-destructive/20 text-destructive';
    if (aiState?.isAISpeaking) return 'bg-primary/20 text-primary animate-pulse';
    if (aiState?.isListening) return 'bg-call-active/20 text-call-active';
    return 'bg-call-active/20 text-call-active';
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
            {aiState ? 'AI Assistant' : 'Incoming call...'}
          </p>
        </div>

        {/* Audio level visualization */}
        {aiState?.isAISpeaking && (
          <div className="mb-6 flex items-center justify-center gap-1">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`w-1 bg-primary rounded-full transition-all duration-100 ${
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
          <div className="text-center mb-4 p-2 bg-destructive/20 text-destructive rounded-md text-sm">
            {aiState.error}
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
            {aiState?.isListening ? 'Speak naturally - AI is listening' : 'Tap to end call'}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CallInterface;
