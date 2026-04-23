import { motion } from "framer-motion";
import { Play } from "lucide-react";

export default function SceneCard({ name, description, icon: Icon, curtains, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-card rounded-2xl p-4 border border-border/60 shadow-sm flex items-center gap-4"
    >
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground">{name}</h3>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {curtains} curtain{curtains !== 1 ? "s" : ""}
        </p>
      </div>
      <button className="h-10 w-10 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors flex-shrink-0">
        <Play className="h-4 w-4 text-primary ml-0.5" />
      </button>
    </motion.div>
  );
}
