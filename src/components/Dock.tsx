
interface DockProps {
  onAppPress?: () => void;
}

const Dock = ({ onAppPress }: DockProps) => {
  // Return null to hide the dock completely
  return null;
};

export default Dock;
