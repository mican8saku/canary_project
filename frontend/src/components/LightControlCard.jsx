import { useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb, LightbulbOff, Loader2, Sun } from "lucide-react";

export default function LightControlCard({ lightOn, onToggle }) {
  const [loading, setLoading] = useState(false);

  async function handleToggle(targetState) {
    // Om vi redan är i det läget, gör inget
    if (lightOn === targetState || loading) return;

    setLoading(true);
    try {
      await onToggle?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 shadow-2xl">
      {/* Ljus-effekt (Bakgrundsglöd när lampan är tänd) */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none transition-opacity duration-1000"
        style={{
          background: lightOn
            ? "radial-gradient(circle at 50% 20%, hsl(45 93% 53% / 0.4) 0%, transparent 70%)"
            : "none",
        }}
      />

      {/* Visual Area - Liknar gardinens visual */}
      <div className="relative h-32 flex items-center justify-center overflow-hidden">
        {/* "Glöd-ringen" runt ikonen */}
        <motion.div
          animate={{
            scale: lightOn ? [1, 1.1, 1] : 1,
            opacity: lightOn ? [0.2, 0.4, 0.2] : 0.1,
          }}
          transition={{ repeat: Infinity, duration: 3 }}
          className={`absolute w-24 h-24 rounded-full blur-2xl ${lightOn ? 'bg-yellow-400' : 'bg-slate-500'}`}
        />
        
        <div className={`relative z-10 backdrop-blur-md rounded-xl px-4 py-1.5 flex items-center gap-2 ${lightOn ? "bg-yellow-500/80" : "bg-slate-700/80"}`}>
          {lightOn ? <Lightbulb className="h-4 w-4 text-white" /> : <LightbulbOff className="h-4 w-4 text-white" />}
          <span className="text-white text-xs font-bold tracking-widest uppercase">
            {lightOn ? "Lights On" : "Lights Off"}
          </span>
        </div>
      </div>

      <div className="p-5 relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-7 w-7 rounded-lg bg-yellow-500/20 flex items-center justify-center">
            <Sun className={`h-3.5 w-3.5 ${lightOn ? "text-yellow-400" : "text-slate-400"}`} />
          </div>
          <div>
            <h2 className="text-white font-bold text-base leading-tight">Belysning</h2>
            <p className="text-slate-400 text-xs">Nest enclosure</p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* ON-KNAPP */}
          <button
            onClick={() => handleToggle(true)}
            disabled={loading || lightOn}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              lightOn 
                ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30" 
                : "bg-white/10 text-slate-300"
            }`}
          >
            {loading && !lightOn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lightbulb className="h-3.5 w-3.5" />}
            Turn On
          </button>

          {/* OFF-KNAPP */}
          <button
            onClick={() => handleToggle(false)}
            disabled={loading || !lightOn}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              !lightOn 
                ? "bg-slate-600 text-white shadow-lg shadow-slate-900/30" 
                : "bg-white/10 text-slate-300"
            }`}
          >
            {loading && lightOn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LightbulbOff className="h-3.5 w-3.5" />}
            Turn Off
          </button>
        </div>
      </div>
    </div>
  );
}