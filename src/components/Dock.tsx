
import { AppIcons } from './AppIcons';

interface DockProps {
  onAppPress?: () => void;
}

const Dock = ({ onAppPress }: DockProps) => {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-fade-in-up">
      <div className="bg-white/20 backdrop-blur-xl rounded-3xl px-6 py-4 flex gap-6 shadow-2xl border border-white/10">
        <AppIcons.Messages />
        <AppIcons.Phone onPress={onAppPress} />
        <AppIcons.Mail />
        <AppIcons.Safari />
      </div>
    </div>
  );
};

export default Dock;
