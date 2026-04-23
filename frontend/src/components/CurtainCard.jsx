import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function CurtainCard({ name, room, icon: Icon }) {
  const [openPercent, setOpenPercent] = useState(50);
  const isOpen = openPercent > 0;

  const statusText =
    openPercent === 0 ? "Closed" : openPercent === 100 ? "Fully open" : "Partially open";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden"
    >
      {/* Curtain Visual */}
      <div className="relative h-24 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600" />
        {[12, 30, 50, 70, 88].map((left) => (
          <div key={left} className="absolute top-2 h-2.5 w-px bg-slate-400/50" style={{ left: `${left}%` }} />
        ))}
        <motion.div
          animate={{ height: `${100 - openPercent}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 28 }}
          className="absolute top-0 left-0 right-0 overflow-hidden"
        >
          <div
            className="absolute inset-0 bg-primary/15"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, transparent 0px, transparent 10px, hsl(var(--primary) / 0.08) 10px, hsl(var(--primary) / 0.08) 11px)",
            }}
          />
        </motion.div>
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground italic">{statusText}</span>
          <span className="text-[11px] font-bold text-foreground/70">{openPercent}%</span>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4">
        <div className="flex items-center gap-2.5 mb-4">
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${isOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">{name}</p>
            <p className="text-[10px] text-muted-foreground">{room}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setOpenPercent(100)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
              openPercent === 100 ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
            }`}
          >
            <ChevronUp className="h-3.5 w-3.5" />
            Open
          </button>
          <button
            onClick={() => setOpenPercent(0)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
              openPercent === 0 ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
            }`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
}
