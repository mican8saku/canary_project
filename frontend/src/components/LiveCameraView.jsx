import { useState, useCallback } from "react";
import { CameraOff, RefreshCw, Maximize2 } from "lucide-react";
import { BASE_URL } from "../api/birdNestApi"; 

export default function LiveCameraView() {
  const [error, setError] = useState(false);
  const [key, setKey] = useState(0);

  const reloadStream = () => {
    setError(false);
    setKey(prev => prev + 1);
  };

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-white/5 shadow-xl">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 p-4">
          <CameraOff className="w-12 h-12 mb-2 opacity-20" />
          <p className="text-sm font-medium">Stream Offline</p>
          <button 
            onClick={reloadStream}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
          >
            Reconnect
          </button>
        </div>
      ) : (
        <>
          {/* HÄR ÄR TRICKET: Vi använder /camera/stream direkt */}
          <img 
            key={key}
            src={`${BASE_URL}/camera/stream?t=${key}`} 
            alt="Live Bird Stream"
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
          
          {/* Overlay info */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-white font-black uppercase tracking-widest">Live 480p</span>
          </div>

          <div className="absolute bottom-4 right-4 flex gap-2">
            <button 
              onClick={reloadStream}
              className="p-2.5 bg-black/40 backdrop-blur-md hover:bg-black/60 rounded-xl border border-white/10 transition-all"
            >
              <RefreshCw className="w-4 h-4 text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}