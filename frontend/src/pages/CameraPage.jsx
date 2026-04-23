import { useState } from "react";
import { CameraOff, RefreshCw } from "lucide-react";
import { BASE_URL } from "../api/birdNestApi"; 

export default function LiveCameraView() {
  const [error, setError] = useState(false);
  const [key, setKey] = useState(0);

  const reloadStream = () => {
    setError(false);
    setKey(prev => prev + 1);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-muted border aspect-video shadow-sm">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4">
          <CameraOff className="w-12 h-12 mb-2 opacity-20" />
          <p className="text-sm font-medium text-center">Kameran är offline</p>
          <button 
            onClick={reloadStream}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold"
          >
            Försök ansluta igen
          </button>
        </div>
      ) : (
        <>
          <img 
            key={key}
            src={`${BASE_URL}/camera/stream`} 
            alt="Live Bird Stream"
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
          
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-white font-bold uppercase tracking-wider">Live Video</span>
          </div>

          <button 
            onClick={reloadStream}
            className="absolute bottom-3 right-3 p-2 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
        </>
      )}
    </div>
  );
}