
import { Phone } from 'lucide-react';

interface AppIconProps {
  onPress: () => void;
  label: string;
}

const AppIcon = ({ onPress, label }: AppIconProps) => {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onPress}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg transform transition-transform active:scale-95"
      >
        <Phone className="h-8 w-8 text-white" />
      </button>
      <span className="text-white text-xs mt-1 font-sf-pro">{label}</span>
    </div>
  );
};

export default AppIcon;
