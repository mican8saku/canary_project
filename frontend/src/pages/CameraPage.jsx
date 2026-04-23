import LiveCameraView from "../components/LiveCameraView";
import { motion } from "framer-motion";

export default function CameraPage() {
  return (
    <div className="px-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">Live</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Camera</h1>
      </motion.div>
      <LiveCameraView />
    </div>
  );
}
