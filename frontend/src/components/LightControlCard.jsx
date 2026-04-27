import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, LightbulbOff } from 'lucide-react';

export default function LightControlCard({ lightOn, onToggle }) {
  return (
    <div className="relative overflow-hidden bg-card rounded-3xl border border-border shadow-sm">
      {/* Bakgrunds-glöd när lampan är tänd */}
      <motion.div
        animate={{
          opacity: lightOn ? 1 : 0,
          scale: lightOn ? 1.2 : 0.8,
        }}
        className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-400/20 blur-3xl rounded-full"
      />

      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Ikonen med cirkel-bakgrund */}
          <div className={`p-3 rounded-2xl transition-colors duration-500 ${
            lightOn ? 'bg-yellow-400 text-white' : 'bg-secondary text-muted-foreground'
          }`}>
            {lightOn ? <Lightbulb size={24} /> : <LightbulbOff size={24} />}
          </div>

          <div>
            <h3 className="font-bold text-foreground text-base">Belysning</h3>
            <p className="text-xs text-muted-foreground font-medium">
              {lightOn ? 'Lyser just nu' : 'Släckt'}
            </p>
          </div>
        </div>

        {/* Den snygga Toggle-brytaren */}
        <button
          onClick={onToggle}
          className={`group relative w-14 h-8 rounded-full transition-all duration-300 ${
            lightOn ? 'bg-yellow-400 shadow-inner' : 'bg-muted shadow-inner'
          }`}
        >
          <motion.div
            initial={false}
            animate={{
              x: lightOn ? 24 : 4, // Flyttar bollen 24px åt höger om tänd
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
          />
        </button>
      </div>
    </div>
  );
}