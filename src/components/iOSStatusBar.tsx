
import { Battery, Signal, Wifi } from 'lucide-react';

const iOSStatusBar = () => {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false
  });

  return (
    <div className="flex items-center justify-between px-6 py-2 text-white text-sm font-medium">
      {/* Left side - Time */}
      <div className="font-sf-pro font-semibold">
        {currentTime}
      </div>

      {/* Right side - Status icons */}
      <div className="flex items-center gap-1">
        <Signal className="h-4 w-4" />
        <Wifi className="h-4 w-4" />
        <Battery className="h-4 w-4" />
      </div>
    </div>
  );
};

export default iOSStatusBar;
