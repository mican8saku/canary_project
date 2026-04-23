import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";

// curtainState: "open" | "closed"
export default function FeaturedCurtainCard({ name, room, icon: Icon, curtainState = "closed", onOpen, onClose, curtainLoading = false }) {
  const isOpen = curtainState === "open";
  const statusText = isOpen ? "Open" : "Closed";

  // Which action is in-flight
  const [activeAction, setActiveAction] = useState(null); // "opening" | "closing"

  async function handleOpen() {
    if (curtainLoading || isOpen) return;
    setActiveAction("opening");
    await onOpen?.();
    setActiveAction(null);
  }

  async function handleClose() {
    if (curtainLoading || !isOpen) return;
    setActiveAction("closing");
    await onClose?.();
    setActiveAction(null);
  }

  const busy = activeAction !== null;

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 shadow-2xl">
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 30% 0%, hsl(221 83% 53% / 0.5) 0%, transparent 60%)" }}
      />

      {/* Curtain Visual — fully open (0%) or fully closed (100%) */}
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-300/20 to-transparent" />
        <motion.div
          animate={{ height: isOpen ? "0%" : "100%" }}
          transition={{ type: "spring", stiffness: 160, damping: 28 }}
          className="absolute top-0 left-0 right-0 overflow-hidden"
        >
          <div
            className="absolute inset-0"
            style={{
              background: "repeating-linear-gradient(90deg, hsl(221 83% 53% / 0.18) 0px, hsl(221 83% 53% / 0.06) 12px, hsl(221 83% 53% / 0.18) 24px)",
            }}
          />
        </motion.div>
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600 rounded-t-3xl" />
        {[10, 22, 34, 46, 58, 70, 82, 94].map((left) => (
          <div key={left} className="absolute top-2 h-3 w-0.5 bg-slate-300/60 rounded-full" style={{ left: `${left}%` }} />
        ))}
        <div className={`absolute top-3 left-1/2 -translate-x-1/2 backdrop-blur-md rounded-xl px-4 py-1.5 ${isOpen ? "bg-green-500/80" : "bg-slate-700/80"}`}>
          <span className="text-white text-xs font-bold tracking-widest uppercase">{statusText}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="p-5 relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-blue-300" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base leading-tight">{name}</h2>
            <p className="text-slate-400 text-xs">{room}</p>
            <p className="text-slate-300 text-xs font-medium mt-0.5">Status: {statusText}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleOpen}
            disabled={busy || isOpen}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              !isOpen && !busy ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white/10 text-slate-300"
            }`}
          >
            {activeAction === "opening" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronUp className="h-3.5 w-3.5" />}
            {activeAction === "opening" ? "Opening..." : "Open"}
          </button>
          <button
            onClick={handleClose}
            disabled={busy || !isOpen}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              isOpen && !busy ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white/10 text-slate-300"
            }`}
          >
            {activeAction === "closing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {activeAction === "closing" ? "Closing..." : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
