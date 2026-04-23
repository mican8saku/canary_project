import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Maximize2, RefreshCw, Minimize2, Loader2, AlertCircle } from "lucide-react";

const BASE_URL = "https://recede-pebbly-tidbit.ngrok-free.dev";

function getSnapshotUrl() {
  // Cache-bust on each refresh so the browser doesn't serve the old image
  return `${BASE_URL}/camera/snapshot?t=${Date.now()}`;
}

function SnapshotImage({ src, onLoad, onError, loading }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {loading && (
        <Loader2 className="h-8 w-8 text-white/40 animate-spin" />
      )}
      <img
        key={src}
        src={src}
        alt="Camera snapshot"
        onLoad={onLoad}
        onError={onError}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
        style={{ display: loading ? "none" : "block" }}
      />
    </div>
  );
}

export default function LiveCameraView() {
  const [snapshotUrl, setSnapshotUrl] = useState(getSnapshotUrl);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSnapshotUrl(getSnapshotUrl());
      setImageLoading(true);
      setImageError(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setImageLoading(true);
    setImageError(false);
    setSnapshotUrl(getSnapshotUrl());
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  const FeedContent = ({ large }) => (
    <div className={`relative w-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center ${large ? "flex-1" : "aspect-video rounded-2xl overflow-hidden"}`}>
      <div
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.1) 0%, transparent 60%)" }}
      />

      {/* Snapshot or fallback */}
      {imageError ? (
        <div className="flex flex-col items-center gap-2 text-white/40">
          <AlertCircle className="h-10 w-10" />
          <span className="text-sm font-medium">Camera unavailable</span>
        </div>
      ) : (
        <SnapshotImage
          src={snapshotUrl}
          loading={imageLoading}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      {/* LIVE badge */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 z-10">
        <span className={`h-2 w-2 rounded-full ${imageError ? "bg-gray-400" : "bg-red-500 animate-pulse"}`} />
        <span className="text-[11px] text-white font-bold tracking-wider">{imageError ? "OFFLINE" : "LIVE"}</span>
      </div>

      {/* Controls */}
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <button
          onClick={handleRefresh}
          className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-white ${refreshing ? "animate-spin" : ""}`} />
        </button>
        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          {fullscreen
            ? <Minimize2 className="h-3.5 w-3.5 text-white" />
            : <Maximize2 className="h-3.5 w-3.5 text-white" />
          }
        </button>
      </div>

      {/* Bottom timestamp */}
      <div className="absolute bottom-3 left-3 text-[10px] text-white/40 font-mono z-10">
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );

  return (
    <>
      {/* Fullscreen */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            <div className="flex items-center justify-between px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-3">
              <div>
                <p className="text-white font-bold">Nest Camera</p>
                <p className="text-white/40 text-xs">Bird Enclosure • Live</p>
              </div>
              <button
                onClick={() => setFullscreen(false)}
                className="text-white/70 text-sm font-semibold px-3 py-1.5 rounded-xl bg-white/10"
              >
                Done
              </button>
            </div>
            <FeedContent large />
            <div className="pb-[max(1.5rem,env(safe-area-inset-bottom))] px-5 pt-4">
              <button
                onClick={handleRefresh}
                className="w-full py-3 rounded-2xl bg-white/10 text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh Snapshot
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline View */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 mb-8"
      >
        {/* Status bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${imageError ? "bg-red-400" : "bg-green-500 animate-pulse"}`} />
            <span className="text-sm font-semibold text-foreground">Nest Camera</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Bird Enclosure</span>
            <span className="text-[10px] font-medium text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">Auto-refreshing</span>
          </div>
        </div>

        {/* Feed */}
        <div className="rounded-2xl overflow-hidden border border-border/60 shadow-sm">
          <FeedContent />
        </div>

        {/* Info Card */}
        <div className="bg-card rounded-2xl p-4 border border-border/60 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${imageError ? "bg-red-500/10" : "bg-green-500/10"}`}>
              <Camera className={`h-4 w-4 ${imageError ? "text-red-500" : "text-green-600"}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{imageError ? "Camera preview unavailable" : "Snapshot"}</p>
              <p className="text-xs text-muted-foreground">Snapshot</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-xl"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </motion.div>
    </>
  );
}
