import { motion } from "framer-motion";
import { Blinds, Camera } from "lucide-react"; // Importera Camera
import FeaturedCurtainCard from "../components/FeaturedCurtainCard";
import LightControlCard from "../components/LightControlCard"; 
import { FeaturedControlCard } from "../components/FeaturedControlCard"; // Importera den nya universella komponenten
import { useBirdNest } from "../hooks/useBirdNest";

export default function Dashboard() {
  const { 
    curtainState, openCurtain, closeCurtain, curtainLoading,
    lightOn, toggleLight,
    takeSnapshot, isCapturing // Se till att dessa finns i din useBirdNest hook!
  } = useBirdNest();

  return (
    <div className="px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-10">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">Control</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Nest Control</h1>
      </motion.div>

      <div className="space-y-4 mb-8">
        {/* Gardin-kortet */}
        <FeaturedCurtainCard
          name="Curtain Control"
          room="Nest enclosure"
          icon={Blinds}
          curtainState={curtainState}
          onOpen={openCurtain}
          onClose={closeCurtain}
          curtainLoading={curtainLoading}
        />

        {/* Ljus-kortet */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <LightControlCard 
            lightOn={lightOn} 
            onToggle={toggleLight} 
          />
        </motion.div>
      </div>
    </div>
  );
}