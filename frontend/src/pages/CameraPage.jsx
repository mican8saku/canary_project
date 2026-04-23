import { useState, useEffect } from "react";
import { getCameraSnapshotUrl } from "../api/birdNestApi";
import { RefreshCw, CameraOff } from "lucide-react"; // Om du använder lucide-react

export default function LiveCameraView() {
  const [timestamp, setTimestamp] = useState(Date.now());
  const [error, setError] = useState(false);

  // Funktion för att tvinga fram en ny bild
  const refreshImage = () => {
    setTimestamp(Date.now());
    setError(false);
  };

  // Valfritt: Uppdatera automatiskt var 5:e sekund
  useEffect(() => {
    const interval = setInterval(refreshImage, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-muted border aspect-video shadow-sm">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4">
          <CameraOff className="w-12 h-12 mb-2 opacity-20" />
          <p className="text-sm font-medium text-center">Kameran kan inte laddas</p>
          <p className="text-xs opacity-60 text-center mt-1">Säkerställ att Tailscale är igång</p>
          <button 
            onClick={refreshImage}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold"
          >
            Försök igen
          </button>
        </div>
      ) : (
        <>
          <img
            src={getCameraSnapshotUrl()} 
            key={timestamp} // Viktigt: key gör att React byter ut bilden när timestamp ändras
            alt="Live snapshot"
            className="w-full h-full object-cover"
            onError={() => setError(true)}
          />
          
          {/* En liten "Live"-indikator */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-white font-bold uppercase tracking-wider">Live</span>
          </div>

          <button 
            onClick={refreshImage}
            className="absolute bottom-3 right-3 p-2 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
        </>
      )}
    </div>
  );
}