import React, { useState, useEffect } from 'react';
import LiveCameraView from "../components/LiveCameraView";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Image as ImageIcon, Trash2, Loader2, RefreshCcw } from "lucide-react";
import { BASE_URL } from "../api/birdNestApi";

export default function CameraPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);

  // 1. Hämta listan på sparade bilder från Pien
  const fetchGallery = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/gallery`);
      const data = await response.json();
      if (data.ok) {
        setImages(data.images);
      }
    } catch (err) {
      console.error("Kunde inte ladda galleriet:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  // 2. Ta en ny bild och spara den på Pien
  const takeSnapshot = async () => {
    setIsCapturing(true);
    try {
      // Vi anropar snapshot-routen
      await fetch(`${BASE_URL}/camera/snapshot`);
      // Eftersom bilden nu sparats i static/gallery på Pien, 
      // uppdaterar vi listan för att visa den nya bilden
      await fetchGallery();
    } catch (err) {
      console.error("Snapshot misslyckades:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8 space-y-6">
      
      {/* HEADER */}
      <motion.div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Monitoring</p>
            <button onClick={fetchGallery} className="p-1 hover:bg-muted rounded-full transition-all">
              <RefreshCcw className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">BirdNest Cam</h1>
        </div>
        
        <button 
          onClick={takeSnapshot}
          disabled={isCapturing}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50 transition-all"
        >
          {isCapturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          Capture
        </button>
      </motion.div>

      {/* LIVE VIEW */}
      <div className="bg-card rounded-[2.5rem] border border-border/60 shadow-sm overflow-hidden p-2">
         <LiveCameraView />
      </div>

      {/* GALLERI - SPARADE BILDER PÅ PIEN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Pi Gallery</h2>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground/50">{images.length} Photos</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground/20" /></div>
        ) : images.length === 0 ? (
          <div className="border-2 border-dashed border-border/40 rounded-[2rem] py-12 flex flex-col items-center justify-center text-muted-foreground/40">
            <ImageIcon className="h-8 w-8 mb-2 opacity-10" />
            <p className="text-sm font-medium italic">Empty nest...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {images.map((filename) => (
                <motion.div 
                  key={filename}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-border/50 bg-muted shadow-sm"
                >
                  <img 
                    key={key}
                    src="[https://mjpeg.sanasto.fi/mjpg/video.mjpg](https://mjpeg.sanasto.fi/mjpg/video.mjpg)"
                    alt="Live Bird Stream"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer" // Lägg till denna för att undvika HTTPS -> HTTP blockering
                    onError={() => setError(true)}
                  />
                  
                  {/* Tidsstämpel baserat på filnamnet om du vill (valfritt) */}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] bg-black/40 backdrop-blur-md text-white px-2 py-0.5 rounded-full font-medium">
                       {filename.split('.')[0]}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}