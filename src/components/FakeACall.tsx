import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import CallButton from './CallButton';
import CallInterface from './CallInterface';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useToast } from '@/components/ui/use-toast';

type CallState = 'idle' | 'ringing' | 'connected' | 'ended';

const FakeACall = () => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const { playRingtone, stopRingtone } = useAudioPlayer();
  const { toast } = useToast();

  // Call timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (callState === 'connected') {
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
      
      // Ring for 2-3 rings (about 4-6 seconds)
      setTimeout(() => {
        stopRingtone();
        setCallState('connected');
        setCallDuration(0);
        
        toast({
          title: "Call Connected",
          description: "You're now connected to your emergency contact.",
        });
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
    setCallState('ended');
    
    setTimeout(() => {
      setCallState('idle');
      setCallDuration(0);
    }, 2000);

    toast({
      title: "Call Ended",
      description: "Your escape route is complete!",
    });
  };

  if (callState === 'connected') {
    return (
      <CallInterface
        onEndCall={endCall}
        callDuration={callDuration}
        isConnected={true}
      />
    );
  }

  if (callState === 'ended') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-sm p-8 bg-gradient-surface shadow-surface border-border/50 text-center">
          <div className="text-call-ended text-2xl font-semibold mb-4">
            Call Ended
          </div>
          <p className="text-muted-foreground">
            Mission accomplished! Returning to standby...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in-up">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          FakeACall
        </h1>
        <p className="text-muted-foreground text-lg max-w-md">
          Your discreet escape button. Tap to receive an "important" call and gracefully exit any situation.
        </p>
      </div>

      {/* Main call button */}
      <div className="mb-12">
        <CallButton
          onInitiateCall={initiateCall}
          isRinging={callState === 'ringing'}
          disabled={callState !== 'idle'}
        />
      </div>

      {/* Status */}
      <div className="text-center">
        {callState === 'idle' && (
          <p className="text-muted-foreground">
            Tap the button to initiate your escape call
          </p>
        )}
        {callState === 'ringing' && (
          <div className="animate-pulse">
            <p className="text-primary font-semibold text-lg mb-2">
              Incoming Call...
            </p>
            <p className="text-muted-foreground text-sm">
              Get ready to "answer" your important call
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-6 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground">
          Discreet • Believable • Your Freedom
        </p>
      </div>
    </div>
  );
};

export default FakeACall;