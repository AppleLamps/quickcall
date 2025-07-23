
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Globe, 
  Music, 
  Map, 
  Image, 
  Camera,
  Settings,
  Calculator,
  Calendar,
  Clock
} from 'lucide-react';

interface AppIconProps {
  name: string;
  icon: React.ReactNode;
  gradient: string;
  onPress?: () => void;
  isActive?: boolean;
}

const AppIconComponent = ({ name, icon, gradient, onPress, isActive }: AppIconProps) => {
  return (
    <div className="flex flex-col items-center group">
      <button
        onClick={onPress}
        className={`w-16 h-16 rounded-2xl ${gradient} flex items-center justify-center shadow-lg transform transition-all duration-200 active:scale-95 hover:shadow-xl ${
          isActive ? 'ring-2 ring-white/50 shadow-glow' : ''
        }`}
        style={{
          boxShadow: isActive 
            ? '0 0 20px rgba(255,255,255,0.3), 0 8px 20px rgba(0,0,0,0.3)' 
            : '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        {icon}
      </button>
      <span className="text-white text-xs mt-2 font-sf-pro font-medium drop-shadow-sm group-hover:text-white/90 transition-colors">
        {name}
      </span>
    </div>
  );
};

export const AppIcons = {
  Messages: ({ onPress, isActive }: { onPress?: () => void; isActive?: boolean }) => (
    <AppIconComponent
      name="Messages"
      icon={<MessageSquare className="h-8 w-8 text-white" />}
      gradient="bg-gradient-to-br from-green-400 to-green-600"
      onPress={onPress}
      isActive={isActive}
    />
  ),
  Phone: ({ onPress, isActive }: { onPress?: () => void; isActive?: boolean }) => (
    <AppIconComponent
      name="Phone"
      icon={<Phone className="h-8 w-8 text-white" />}
      gradient="bg-gradient-to-br from-green-500 to-green-700"
      onPress={onPress}
      isActive={isActive}
    />
  ),
  Mail: ({ onPress, isActive }: { onPress?: () => void; isActive?: boolean }) => (
    <AppIconComponent
      name="Mail"
      icon={<Mail className="h-8 w-8 text-white" />}
      gradient="bg-gradient-to-br from-blue-400 to-blue-600"
      onPress={onPress}
      isActive={isActive}
    />
  ),
  Safari: ({ onPress, isActive }: { onPress?: () => void; isActive?: boolean }) => (
    <AppIconComponent
      name="Safari"
      icon={<Globe className="h-8 w-8 text-white" />}
      gradient="bg-gradient-to-br from-blue-500 to-blue-700"
      onPress={onPress}
      isActive={isActive}
    />
  ),
  Music: ({ onPress, isActive }: { onPress?: () => void; isActive?: boolean }) => (
    <AppIconComponent
      name="Music"
      icon={<Music className="h-8 w-8 text-white" />}
      gradient="bg-gradient-to-br from-red-400 to-red-600"
      onPress={onPress}
      isActive={isActive}
    />
  ),
  Maps: ({ onPress, isActive }: { onPress?: () => void; isActive?: boolean }) => (
    <AppIconComponent
      name="Maps"
      icon={<Map className="h-8 w-8 text-white" />}
      gradient="bg-gradient-to-br from-green-400 to-green-600"
      onPress={onPress}
      isActive={isActive}
    />
  ),
  Photos: ({ onPress, isActive }: { onPress?: () => void; isActive?: boolean }) => (
    <AppIconComponent
      name="Photos"
      icon={<Image className="h-8 w-8 text-white" />}
      gradient="bg-gradient-to-br from-purple-400 to-pink-500"
      onPress={onPress}
      isActive={isActive}
    />
  ),
  Camera: ({ onPress, isActive }: { onPress?: () => void; isActive?: boolean }) => (
    <AppIconComponent
      name="Camera"
      icon={<Camera className="h-8 w-8 text-white" />}
      gradient="bg-gradient-to-br from-gray-600 to-gray-800"
      onPress={onPress}
      isActive={isActive}
    />
  ),
  Settings: ({ onPress, isActive }: { onPress?: () => void; isActive?: boolean }) => (
    <AppIconComponent
      name="Settings"
      icon={<Settings className="h-8 w-8 text-white" />}
      gradient="bg-gradient-to-br from-gray-500 to-gray-700"
      onPress={onPress}
      isActive={isActive}
    />
  ),
  Calculator: ({ onPress, isActive }: { onPress?: () => void; isActive?: boolean }) => (
    <AppIconComponent
      name="Calculator"
      icon={<Calculator className="h-8 w-8 text-white" />}
      gradient="bg-gradient-to-br from-orange-400 to-orange-600"
      onPress={onPress}
      isActive={isActive}
    />
  ),
  Calendar: ({ onPress, isActive }: { onPress?: () => void; isActive?: boolean }) => (
    <AppIconComponent
      name="Calendar"
      icon={<Calendar className="h-8 w-8 text-white" />}
      gradient="bg-gradient-to-br from-red-500 to-red-700"
      onPress={onPress}
      isActive={isActive}
    />
  ),
  Clock: ({ onPress, isActive }: { onPress?: () => void; isActive?: boolean }) => (
    <AppIconComponent
      name="Clock"
      icon={<Clock className="h-8 w-8 text-white" />}
      gradient="bg-gradient-to-br from-gray-700 to-gray-900"
      onPress={onPress}
      isActive={isActive}
    />
  ),
};
