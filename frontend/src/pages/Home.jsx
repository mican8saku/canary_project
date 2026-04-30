import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Blinds, Camera, Thermometer, Bird, Activity, Sun } from "lucide-react";
import AlertBanner from "../components/AlertBanner";
import { useBirdNest } from "../hooks/useBirdNest";
import { WifiOff } from "lucide-react";

const hour = new Date().getHours();
const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

export default function Home() {
  const { lux, temperature, birdStatus, curtainState, lastMotionAt, lastMotionAtRaw, lightOn, alerts, dismissAlert, loading, deviceOnline } = useBirdNest();

  const birdActive = birdStatus === "active";

  const tempDisplay = temperature != null ? `${temperature}°C` : "--°C";
  const birdStatusDisplay = birdStatus ?? "Unknown";

  const luxDisplay = lux != null ? `${lux} lx` : "-- lx";

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-blue-700 px-5 pt-[max(3rem,env(safe-area-inset-top))] pb-8 overflow-hidden">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-white/5" />

        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <p className="text-xs font-medium text-white/70 uppercase tracking-widest mb-1">{greeting}</p>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">SmartNest</h1>
          <p className="text-sm text-white/60">Bird monitoring & nest care</p>
        </motion.div>

        {/* Sensor Strip */}
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.08 }}
  className="relative z-10 mt-6 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
>
  {/* Temperature Tag */}
  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 whitespace-nowrap">
    <Thermometer className={`h-4 w-4 ${temperature >= 30 ? "text-orange-300" : "text-white/70"}`} />
    <div>
      <span className={`text-sm font-bold ${temperature != null && temperature >= 30 ? "text-orange-200" : "text-white"}`}>
        {tempDisplay}
      </span>
      <span className="text-[11px] text-white/50 ml-1.5">Temp</span>
    </div>
  </div>

  {/* Lux Tag - NY! */}
  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 whitespace-nowrap">
    <Sun className={`h-4 w-4 ${lux < 50 ? "text-blue-300" : "text-amber-300"}`} />
    <div>
      <span className="text-sm font-bold text-white">
        {luxDisplay}
      </span>
      <span className="text-[11px] text-white/50 ml-1.5">Light</span>
    </div>
  </div>
</motion.div>
      </div>

      {/* Offline / error banner */}
      {!deviceOnline && (
        <div className="mx-5 mt-4 flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-2xl px-4 py-3">
          <WifiOff className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-xs font-medium text-destructive">Device unreachable — showing last known data</p>
        </div>
      )}

      {/* Alerts — deduplicated by id before render */}
      <div className={`${deviceOnline ? "mt-4" : "mt-2"} px-5`}>
        <AlertBanner
          alerts={alerts.filter((a, i, arr) => arr.findIndex((b) => b.id === a.id) === i)}
          onDismiss={dismissAlert}
          lastMotionAt={lastMotionAtRaw}
        />
      </div>

      {/* Bird Status */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className={`mx-5 mt-2 rounded-2xl p-5 shadow-sm border transition-all duration-300 ${
          alerts.length > 0
            ? "bg-muted/60 border-border/30 opacity-75"
            : "bg-card border-border/60"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${birdActive ? "bg-green-100" : "bg-muted"}`}>
              <Bird className={`h-5 w-5 ${birdActive ? "text-green-600" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Bird Status</p>
              <p className={`text-xs ${birdActive ? "text-green-600 font-semibold" : "text-muted-foreground"}`}>
                {birdStatus == null ? "Unknown" : birdActive ? "Active — movement detected" : "Inactive"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end mb-0.5">
              <Activity className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">Last seen</p>
            </div>
            <p className="text-xs text-muted-foreground">{lastMotionAt}</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Access */}
      <div className="px-5 mt-5 mb-8">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Quick Access</p>
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <Link
              to="/dashboard"
              className="relative block bg-card border border-border/60 rounded-2xl p-5 active:scale-95 transition-transform shadow-sm"
            >
              <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                curtainState === "open" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
              }`}>
                {curtainState === "open" ? "Open" : "Closed"}
              </span>
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-sm">
                <Blinds className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm font-bold text-foreground">Curtains</p>
              <p className="text-xs text-muted-foreground mt-0.5">Open & close control</p>
            </Link>
          </motion.div>

         {/* LIGHTS - Ny knapp som går till dashboard */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}>
      <Link to="/dashboard" className="relative block bg-card border border-border/60 rounded-2xl p-5 active:scale-95 transition-transform shadow-sm">
        <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          lightOn ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
        }`}>
          {lightOn ? "On" : "Off"}
        </span>
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-sm">
          <Sun className="h-5 w-5 text-white" />
        </div>
        <p className="text-sm font-bold text-foreground">Lights</p>
        <p className="text-xs text-muted-foreground mt-0.5">LED & Lux settings</p>
      </Link>
    </motion.div>

          {/* CAMERA */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <Link
              to="/camera"
              className="relative block bg-card border border-border/60 rounded-2xl p-5 active:scale-95 transition-transform shadow-sm"
            >
              <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                deviceOnline ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"
              }`}>
                {deviceOnline ? "Live" : "Offline"}
              </span>
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-sm">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm font-bold text-foreground">Camera</p>
              <p className="text-xs text-muted-foreground mt-0.5">Live bird feed</p>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
