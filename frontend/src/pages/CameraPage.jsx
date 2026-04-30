import React, { useState, useEffect } from 'react';
import LiveCameraView from "../components/LiveCameraView";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Image as ImageIcon, Loader2, RefreshCcw, Video, Aperture } from "lucide-react";
import { BASE_URL } from "../api/birdNestApi";
import { useBirdNest } from "../hooks/useBirdNest";

export default function CameraPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Hämta allt från din hook
  const { isCapturing, takeSnapshot: triggerSnapshot } = useBirdNest();

  const fetchGallery = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/gallery`);
      const data = await response.json();
      if (data.ok) setImages(data.images);
    } catch (err) {
      console.error("Gallery failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleCapture = async () => {
    await triggerSnapshot();
    setTimeout(fetchGallery, 1500);
  };

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10 space-y-6">
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end"
      >
        <div>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Surveillance</p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">BirdNest <span className="text-primary">Cam</span></h1>
        </div>
      </motion.div>

      {/* Video Stream Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Feed</h2>
          <span className="text-[10px] text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded-full">Secure Connection</span>
        </div>
        
        <LiveCameraView isCapturing={isCapturing} />

        {/* Kamerakontroll-kort */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 shadow-2xl p-5 border border-white/5">
          <div
            className="absolute inset-0 opacity-40 pointer-events-none transition-opacity duration-500"
            style={{
              background: isCapturing
                ? "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.15) 0%, transparent 70%)"
                : "none",
            }}
          />

          <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Aperture className={`h-5 w-5 ${isCapturing ? "text-primary animate-spin" : "text-primary/70"}`} />
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">Camera Controls</h2>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-medium">Nest enclosure</p>
            </div>
          </div>

          <div className="flex gap-3 relative z-10">
            <button
              onClick={handleCapture}
              disabled={isCapturing}
              className={`flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${
                isCapturing 
                  ? "bg-slate-700 text-slate-400" 
                  : "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              }`}
            >
              {isCapturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {isCapturing ? "Processing..." : "Take Snapshot"}
            </button>

            <button
              disabled={true}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed"
            >
              <Video className="h-4 w-4" />
              Record
            </button>
          </div>
        </div>
      </motion.section>

      {/* Gallery Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4 pt-4"
      >
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Storage Gallery</h2>
          </div>
          <button onClick={fetchGallery} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <RefreshCcw className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary/20" /></div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {images.map((filename) => (
                <motion.div 
                  key={filename}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative aspect-square rounded-[2rem] overflow-hidden border border-border/50 bg-card shadow-sm"
                >
                  <img 
                    src={`${BASE_URL}/static/gallery/${filename}?t=${filename}`} 
                    alt="Captured bird" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <p className="text-[10px] text-white/70 font-mono truncate">{filename}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.section>
    </div>
  );
}