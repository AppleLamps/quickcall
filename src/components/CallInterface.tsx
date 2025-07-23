import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PhoneOff, Mic, MicOff } from 'lucide-react';

interface CallInterfaceProps {
  onEndCall: () => void;
  callDuration: number;
  isConnected: boolean;
}

const CallInterface = ({ onEndCall, callDuration, isConnected }: CallInterfaceProps) => {
  const [isMuted, setIsMuted] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Implement actual mute functionality
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in-up">
      <Card className="w-full max-w-sm p-8 bg-gradient-surface shadow-surface border-border/50">
        {/* Connection status */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            isConnected 
              ? 'bg-call-active/20 text-call-active' 
              : 'bg-muted text-muted-foreground'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-call-active animate-pulse' : 'bg-muted-foreground'
            }`} />
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>

        {/* Caller info */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Emergency Contact
          </h2>
          <p className="text-muted-foreground">
            Incoming call...
          </p>
        </div>

        {/* Call timer */}
        <div className="text-center mb-8">
          <div className="text-3xl font-mono font-bold text-foreground">
            {formatTime(callDuration)}
          </div>
        </div>

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
            Tap to end call
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CallInterface;