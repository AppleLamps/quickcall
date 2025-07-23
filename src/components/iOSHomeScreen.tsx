
import { useState } from 'react';
import AppIcon from './AppIcon';
import IOSStatusBar from './iOSStatusBar';

interface iOSHomeScreenProps {
  onAppPress: () => void;
}

const iOSHomeScreen = ({ onAppPress }: iOSHomeScreenProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock app icons for realistic feel
  const mockApps = [
    { id: 1, name: 'Messages', color: 'bg-green-500' },
    { id: 2, name: 'Phone', color: 'bg-green-600' },
    { id: 3, name: 'Mail', color: 'bg-blue-500' },
    { id: 4, name: 'Safari', color: 'bg-blue-400' },
    { id: 5, name: 'Music', color: 'bg-red-500' },
    { id: 6, name: 'Maps', color: 'bg-gray-600' },
    { id: 7, name: 'Photos', color: 'bg-yellow-500' },
    { id: 8, name: 'Camera', color: 'bg-gray-700' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Background blur effect */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Status Bar */}
      <IOSStatusBar />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 py-12">
        
        {/* Time display */}
        <div className="text-center mb-16">
          <div className="text-white text-7xl font-thin font-sf-pro">
            {currentTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: false 
            })}
          </div>
          <div className="text-white/80 text-lg font-sf-pro mt-2">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* App grid */}
        <div className="grid grid-cols-4 gap-6 mb-16">
          {mockApps.map((app, index) => (
            <div key={app.id} className="flex flex-col items-center">
              <button
                onClick={index === 1 ? onAppPress : undefined}
                className={`w-16 h-16 rounded-2xl ${
                  index === 1 ? 'bg-gradient-to-br from-green-400 to-green-600' : app.color
                } flex items-center justify-center shadow-lg transform transition-transform active:scale-95 ${
                  index === 1 ? 'ring-2 ring-white/30' : ''
                }`}
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg" />
              </button>
              <span className="text-white text-xs mt-1 font-sf-pro">{app.name}</span>
            </div>
          ))}
        </div>

        {/* Featured app - FakeACall */}
        <div className="text-center">
          <AppIcon onPress={onAppPress} label="FakeACall" />
          <p className="text-white/60 text-sm mt-4 font-sf-pro max-w-xs">
            Tap to activate your emergency escape call
          </p>
        </div>
      </div>

      {/* Dock */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-14 h-14 bg-white/20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default iOSHomeScreen;
