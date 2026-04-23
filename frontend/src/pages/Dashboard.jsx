import { motion } from "framer-motion";
import { Blinds } from "lucide-react";
import FeaturedCurtainCard from "../components/FeaturedCurtainCard";
import { useBirdNest } from "../hooks/useBirdNest";

const nestCurtain = { name: "Curtain Control", room: "Nest enclosure", icon: Blinds };

export default function Dashboard() {
  const { curtainState, openCurtain, closeCurtain, curtainLoading } = useBirdNest();

  return (
    <div className="px-4 pt-[max(1.25rem,env(safe-area-inset-top))]">

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">Control</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Curtains</h1>
      </motion.div>

      <div className="space-y-5 mb-8">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Nest Control
        </p>
        <FeaturedCurtainCard
          name={nestCurtain.name}
          room={nestCurtain.room}
          icon={nestCurtain.icon}
          curtainState={curtainState}
          onOpen={openCurtain}
          onClose={closeCurtain}
          curtainLoading={curtainLoading}
        />
      </div>
    </div>
  );
}
