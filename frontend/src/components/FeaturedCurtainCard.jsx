import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";

export default function FeaturedCurtainCard({ name, room, icon: Icon, curtainState = 0, onOpen, onClose, curtainLoading = false }) {
  // 1. Tolka curtainState som siffra (0-100)
  const numericPos = typeof curtainState === "number" ? curtainState : (curtainState === "open" ? 100 : 0);
  
  // 2. Nya tillståndskontroller
  const isFullyOpen = numericPos >= 100;
  const isFullyClosed = numericPos <= 0;
  const isMoving = numericPos > 0 && numericPos < 100;

  // Dynamisk statustext
  const statusText = isMoving ? `Moving (${numericPos}%)` : (isFullyOpen ? "Open" : "Closed");

  const [activeAction, setActiveAction] = useState(null);

  async function handleOpen() {
    if (curtainLoading || isFullyOpen) return; // Kan inte öppna mer om redan på 100%
    setActiveAction("opening");
    await onOpen?.();
    setActiveAction(null);
  }

  async function handleClose() {
    if (curtainLoading || isFullyClosed) return; // Kan inte stänga mer om redan på 0%
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

      {/* Curtain Visual — Animerar höjden baserat på EXAKT procent (omvänt: 100% stängd = 100% höjd) */}
      <div className="relative h-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-300/20 to-transparent" />
        <motion.div
          animate={{ height: `${100 - numericPos}%` }} // Om pos är 100 (öppen), är höjden 0%
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
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
        
        <div className={`absolute top-3 left-1/2 -translate-x-1/2 backdrop-blur-md rounded-xl px-4 py-1.5 ${isFullyOpen ? "bg-green-500/80" : isMoving ? "bg-blue-500/80" : "bg-slate-700/80"}`}>
          <span className="text-white text-xs font-bold tracking-widest uppercase">{statusText}</span>
        </div>
      </div>

      <div className="p-5 relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-blue-300" />
          </div>
          <div>
            <h2 className="text-white font-bold text-base leading-tight">{name}</h2>
            <p className="text-slate-400 text-xs">{room}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* ÖPPNA-KNAPP: Aktiv så länge vi inte är på 100% */}
          <button
            onClick={handleOpen}
            disabled={busy || isFullyOpen}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              !isFullyOpen ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white/10 text-slate-300"
            }`}
          >
            {activeAction === "opening" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronUp className="h-3.5 w-3.5" />}
            {activeAction === "opening" ? "Opening..." : "Open"}
          </button>

          {/* STÄNG-KNAPP: Aktiv så länge vi inte är på 0% */}
          <button
            onClick={handleClose}
            disabled={busy || isFullyClosed}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              !isFullyClosed ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white/10 text-slate-300"
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