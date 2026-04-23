import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sun,
  Moon,
  Film,
  Coffee,
  CloudSun,
  Plus,
  Blinds,
} from "lucide-react";
import SceneCard from "../components/SceneCard";

const scenes = [
  {
    id: 1,
    name: "Morning Light",
    description: "Open all curtains to 80%",
    icon: Sun,
    curtains: 4,
  },
  {
    id: 2,
    name: "Movie Night",
    description: "Close living room, dim bedroom",
    icon: Film,
    curtains: 2,
  },
  {
    id: 3,
    name: "Good Night",
    description: "Close all curtains completely",
    icon: Moon,
    curtains: 4,
  },
  {
    id: 4,
    name: "Work Mode",
    description: "Office blinds at 60%, rest closed",
    icon: Coffee,
    curtains: 3,
  },
  {
    id: 5,
    name: "Afternoon Breeze",
    description: "Half open everything",
    icon: CloudSun,
    curtains: 4,
  },
];

export default function Saved() {
  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between mb-6"
      >
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">
            Presets
          </p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Saved Scenes
          </h1>
        </div>
        <button className="h-10 w-10 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors active:scale-95">
          <Plus className="h-5 w-5 text-primary" />
        </button>
      </motion.div>

      {/* Active Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3 mb-8"
      >
        {[
          { label: "Open All", icon: Sun },
          { label: "Close All", icon: Moon },
          { label: "50% All", icon: Blinds },
        ].map((action) => (
          <button
            key={action.label}
            className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors active:scale-95"
          >
            <action.icon className="h-5 w-5 text-primary" />
            <span className="text-[11px] font-semibold text-foreground">
              {action.label}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Scenes List */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          My Scenes
        </h2>
        <div className="space-y-3">
          {scenes.map((scene, i) => (
            <SceneCard
              key={scene.id}
              name={scene.name}
              description={scene.description}
              icon={scene.icon}
              curtains={scene.curtains}
              index={i}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
