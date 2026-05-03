import { useState, useEffect, useCallback } from "react"; // Lagt till useEffect
import { CameraOff, RefreshCw } from "lucide-react";
import { BASE_URL } from "../api/birdNestApi"; 

export default function LiveCameraView({ isCapturing }) { // Ta emot isCapturing som prop
  const [error, setError] = useState(false);
  const [key, setKey] = useState(0);

  const reloadStream = useCallback(() => {
    setError(false);
    setKey(prev => prev + 1);
  }, []);

  // Automatisk återanslutning efter att snapshot är klart
  useEffect(() => {
    if (!isCapturing && error) {
      const timer = setTimeout(() => {
        reloadStream();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCapturing, error, reloadStream]);

  return (
    <div className="relative aspect-[3/4] max-h-[520px] mx-auto rounded-[2.5rem] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 p-6 text-center">
          <CameraOff className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">Stream Offline</p>
          <button 
            onClick={reloadStream}
            className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            Reconnect
          </button>
        </div>
      ) : (
        <>
          <img 
            key={key}
            src={`${BASE_URL}/camera/stream?t=${key}`} 
            alt="Live Bird Stream"
            className="w-full h-full object-cover" 
            onError={() => setError(true)}
          />
          
          {/* Status Overlay */}
          <div className="absolute top-5 left-5 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {isCapturing ? (
              <>
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Saving...</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-white font-black uppercase tracking-widest">Live</span>
              </>
            )}
          </div>

          <div className="absolute bottom-5 right-5">
            <button 
              onClick={reloadStream}
              className="p-3 bg-black/60 backdrop-blur-md hover:bg-white/20 rounded-2xl border border-white/10 transition-all group"
            >
              <RefreshCw className="w-4 h-4 text-white group-active:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}