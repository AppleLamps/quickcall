
import { useState, useEffect } from 'react';
import { AppIcons } from './AppIcons';
import IOSStatusBar from './iOSStatusBar';
import Dock from './Dock';
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

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 py-12 min-h-screen">
        
        {/* Enhanced time display */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="text-white text-8xl font-thin font-sf-pro mb-2 drop-shadow-2xl">
            {formatTime(currentTime)}
          </div>
          <div className="text-white/90 text-xl font-sf-pro font-light tracking-wide drop-shadow-lg">
            {formatDate(currentTime)}
          </div>
        </div>

        {/* App grid with improved spacing and animations */}
        <div className="grid grid-cols-4 gap-8 mb-20 animate-fade-in animation-delay-300">
          <AppIcons.Messages />
          <AppIcons.Phone onPress={onAppPress} isActive />
          <AppIcons.Mail />
          <AppIcons.Safari />
          <AppIcons.Music />
          <AppIcons.Maps />
          <AppIcons.Photos />
          <AppIcons.Camera />
          <AppIcons.Settings />
          <AppIcons.Calculator />
          <AppIcons.Calendar />
          <AppIcons.Clock />
        </div>

        {/* Featured app - FakeACall with enhanced styling */}
        <div className="text-center animate-fade-in animation-delay-600">
          <div className="flex flex-col items-center group">
            <button
              onClick={onAppPress}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-2xl transform transition-all duration-300 active:scale-95 hover:shadow-glow hover:scale-105 ring-2 ring-white/30"
              style={{
                boxShadow: '0 0 30px rgba(34, 197, 94, 0.4), 0 10px 25px rgba(0,0,0,0.3)'
              }}
            >
              <Phone className="h-10 w-10 text-white" />
            </button>
            <span className="text-white text-sm mt-3 font-sf-pro font-medium drop-shadow-sm group-hover:text-white/90 transition-colors">
              FakeACall
            </span>
          </div>
          <p className="text-white/70 text-sm mt-4 font-sf-pro max-w-xs leading-relaxed drop-shadow-sm">
            Tap to activate your emergency escape call
          </p>
        </div>
      </div>

      {/* Enhanced dock */}
      <Dock onAppPress={onAppPress} />
    </div>
  );
};

export default iOSHomeScreen;
