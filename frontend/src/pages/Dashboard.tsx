import { motion } from 'framer-motion';
import { Blinds, Lightbulb } from 'lucide-react';
import FeaturedControlCard from '../components/FeaturedControlCard';
import { useBirdNest } from '../hooks/useBirdNest';

const nestControls = [
  {
    name: 'Curtain Control',
    room: 'Nest enclosure',
    icon: Blinds,
    type: 'curtain' as const,
  },
  {
    name: 'LED Light',
    room: 'Nest enclosure',
    icon: Lightbulb,
    type: 'led' as const,
  },
];

export default function Dashboard() {
  const {
    curtainState,
    openCurtain,
    closeCurtain,
    controlLed,
    curtainLoading,
    ledLoading,
  } = useBirdNest();

  return (
    <div className="px-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">
          Control Panel
        </p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Nest Management
        </h1>
      </motion.div>

      <div className="space-y-5 mb-8">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Device Controls
        </p>
        
        {nestControls.map((control) => (
          <FeaturedControlCard
            key={control.name}
            name={control.name}
            room={control.room}
            icon={control.icon}
            type={control.type}
            state={control.type === 'curtain' ? curtainState : undefined}
            onActivate={
              control.type === 'curtain' 
                ? openCurtain 
                : () => controlLed(true)
            }
            onDeactivate={
              control.type === 'curtain' 
                ? closeCurtain 
                : () => controlLed(false)
            }
            loading={
              control.type === 'curtain' 
                ? curtainLoading 
                : ledLoading
            }
          />
        ))}
      </div>
    </div>
  );
}
