import React, { useState, useEffect } from 'react';
import LiveCameraView from "../components/LiveCameraView";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Image as ImageIcon, Loader2, RefreshCcw } from "lucide-react";
import { BASE_URL } from "../api/birdNestApi";

export default function CameraPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);

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

  const takeSnapshot = async () => {
    setIsCapturing(true);
    try {
      // 1. Pien tar en bild och sparar den i static/gallery
      await fetch(`${BASE_URL}/camera/snapshot`);
      // 2. Vänta lite så filen hinner skrivas, sen uppdatera listan
      setTimeout(fetchGallery, 1000);
    } catch (err) {
      console.error("Capture failed:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10 space-y-8">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Surveillance</p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">BirdNest <span className="text-primary">Cam</span></h1>
        </div>
        {/* <button 
          onClick={takeSnapshot}
          disabled={isCapturing}
          className="h-12 px-6 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
        >
          {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          Capture
        </button> */}
      </div>

      {/* Video Stream Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Live Feed</h2>
          <span className="text-[10px] text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded-full">Encrypted Connection</span>
        </div>
        <LiveCameraView />
      </section>

      {/* Gallery Section */}
      <section className="space-y-4">
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
            <AnimatePresence>
              {images.map((filename) => (
                <motion.div 
                  key={filename}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative aspect-square rounded-[2rem] overflow-hidden border border-border/50 bg-card shadow-sm"
                >
                  <img 
                    src={`${BASE_URL}/static/gallery/${filename}?t=${Date.now()}`} 
                    alt="Captured bird" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <p className="text-[10px] text-white/70 font-mono">{filename}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}