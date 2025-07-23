import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';

interface CallButtonProps {
  onInitiateCall: () => void;
  isRinging: boolean;
  disabled?: boolean;
}

const CallButton = ({ onInitiateCall, isRinging, disabled }: CallButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    onInitiateCall();
    
    // Reset press state after animation
    setTimeout(() => setIsPressed(false), 200);
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Ring waves animation */}
      {isRinging && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-primary animate-ring-wave" />
          <div className="absolute inset-0 rounded-full border-2 border-primary animate-ring-wave animation-delay-300" />
          <div className="absolute inset-0 rounded-full border-2 border-primary animate-ring-wave animation-delay-600" />
        </>
      )}
      
      {/* Main call button */}
      <Button
        variant="call"
        size="call"
        onClick={handlePress}
        disabled={disabled || isRinging}
        className={`relative z-10 ${isPressed ? 'scale-95' : ''} ${isRinging ? 'animate-pulse-call' : ''}`}
      >
        <Phone className="h-8 w-8" />
      </Button>
    </div>
  );
};

export default CallButton;