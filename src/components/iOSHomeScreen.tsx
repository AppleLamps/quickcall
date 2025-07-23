
import { useState, useEffect } from 'react';
import IOSStatusBar from './iOSStatusBar';
import { Phone } from 'lucide-react';

interface iOSHomeScreenProps {
  onAppPress: () => void;
}

const iOSHomeScreen = ({ onAppPress }: iOSHomeScreenProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for real-time display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Enhanced background layers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-pink-900/50" />
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Subtle animated background elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-400/10 rounded-full blur-2xl animate-pulse animation-delay-300" />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-blue-400/10 rounded-full blur-xl animate-pulse animation-delay-600" />
      </div>
      
      {/* Status Bar */}
      <IOSStatusBar />

      {/* Main content - centered layout for mobile */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 py-4">
        
        {/* Enhanced time display */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="text-white text-7xl md:text-8xl font-thin font-sf-pro mb-2 drop-shadow-2xl">
            {formatTime(currentTime)}
          </div>
          <div className="text-white/90 text-lg md:text-xl font-sf-pro font-light tracking-wide drop-shadow-lg">
            {formatDate(currentTime)}
          </div>
        </div>

        {/* Main FakeACall app - prominently displayed */}
        <div className="text-center animate-fade-in animation-delay-300">
          <div className="flex flex-col items-center group mb-8">
            <button
              onClick={onAppPress}
              className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl transform transition-all duration-300 active:scale-95 hover:shadow-glow hover:scale-105 ring-2 ring-white/30"
              style={{
                boxShadow: '0 0 40px rgba(34, 197, 94, 0.5), 0 15px 35px rgba(0,0,0,0.4)'
              }}
            >
              <Phone className="h-16 w-16 md:h-20 md:w-20 text-white" />
            </button>
            <span className="text-white text-2xl md:text-3xl mt-6 font-sf-pro font-medium drop-shadow-sm group-hover:text-white/90 transition-colors">
              FakeACall
            </span>
          </div>
          
          <div className="max-w-sm mx-auto">
            <p className="text-white/80 text-lg md:text-xl font-sf-pro leading-relaxed drop-shadow-sm mb-4">
              Emergency Escape Call
            </p>
            <p className="text-white/60 text-base font-sf-pro leading-relaxed drop-shadow-sm">
              Tap to activate your emergency contact call and get out of any situation safely
            </p>
          </div>
        </div>

        {/* Optional swipe up indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-fade-in animation-delay-600">
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default iOSHomeScreen;
