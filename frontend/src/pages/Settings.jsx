import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Thermometer, Clock, Cpu, Activity, HardDrive, Blinds, Bird, Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import SettingRow from "../components/SettingRow";
import { getDiagnostics, apiPost } from "../api/birdNestApi"; // Se till att apiPost är importerad

function DiagRow({ icon: Icon, label, value, status }) {
  const color =
    status === "ok" ? "text-green-500" :
    status === "warn" ? "text-orange-400" :
    status === "error" ? "text-destructive" :
    "text-muted-foreground";

  const Dot =
    status === "ok" ? CheckCircle2 :
    status === "error" ? XCircle :
    null;

  return (
    <div className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className={`flex items-center gap-1.5 text-sm font-semibold ${color}`}>
        {Dot && <Dot className="h-3.5 w-3.5" />}
        {value}
      </div>
    </div>
  );
}

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [tempThreshold] = useState(30);
  const [motionTimeout] = useState(30);

  const [diag, setDiag] = useState(null);
  const [diagLoading, setDiagLoading] = useState(true);
  const [diagError, setDiagError] = useState(null);

  // Initialize with default values to prevent "Cannot read properties of null"
  const [autoSettings, setAutoSettings] = useState({
    led_routine_active: true,
    curtain_routine_active: true,
    use_pir_adjustment: true,
    window_hours: 1,
    lux_threshold: 30,
    still_minutes: 5,
    time_up: "08:00",
    time_down: "21:30"
  });

  // 1. Fetch diagnostics
  useEffect(() => {
    setDiagLoading(true);
    getDiagnostics()
      .then((data) => {
        if (data && data.ok) {
          setDiag(data);
        }
        setDiagError(null);
      })
      .catch((err) => setDiagError(err.message || "Failed to load diagnostics"))
      .finally(() => setDiagLoading(false));
  }, []);

  // 2. Fetch automation settings once on mount
  useEffect(() => {
    // We use apiPost with 'GET' or just a fetch to our new endpoint
    apiPost('/settings/automation', {}, 'GET')
      .then(data => {
        if (data && data.ok && data.settings) {
          setAutoSettings(data.settings);
        }
      })
      .catch(err => console.error("Could not fetch automation settings", err));
  }, []);

  // 3. Updated save function (Consolidated name)
  const updateAutoSetting = async (key, value) => {
    // Optimistic UI update
    setAutoSettings(prev => ({ ...prev, [key]: value }));
    
    try {
      await apiPost('/settings/automation', { [key]: value });
    } catch (err) {
      console.error("Failed to save setting:", err);
      // Optional: Add a toast notification here that save failed
    }
  };

  const isOnline = diag != null;
  const isPi = diag?.isPi ?? false;

  const lastMotionLabel = (() => {
    if (!diag?.lastMotionAt) return "Unknown";
    const secondsAgo = Math.floor((Date.now() - new Date(diag.lastMotionAt).getTime()) / 1000);
    if (secondsAgo < 10) return "Just now";
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    return `${Math.floor(secondsAgo / 60)}m ago`;
  })();

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">Preferences</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
      </motion.div>

      {/* --- AUTOMATION SECTION --- */}
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.12 }}
  className="mb-6"
>
  <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2.5 ml-1">
    Automation Routine
  </h2>
  
  <div className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
    
    {/* CURTAIN MAIN TOGGLE */}
    <div className="px-4">
      <SettingRow
        icon={Blinds}
        label="Curtain Automation"
        description="Auto-adjust based on bird activity"
        type="toggle"
        value={autoSettings.curtain_routine_active}
        onChange={(val) => updateAutoSetting("curtain_routine_active", val)}
      />
    </div>

    {/* CURTAIN SUB-SETTINGS (Indented) */}
    <div className={`transition-all duration-500 ease-in-out ${
      !autoSettings.curtain_routine_active 
        ? "opacity-30 grayscale pointer-events-none max-h-0 overflow-hidden" 
        : "opacity-100 max-h-[500px] bg-muted/10"
    }`}>
      <div className="pl-10 pr-4 pb-2 divide-y divide-border/40">
        
        {/* BIORYTHM */}
        <SettingRow
          icon={Activity}
          label="Biorythm (PIR)"
          type="toggle"
          value={autoSettings.use_pir_adjustment}
          onChange={(val) => updateAutoSetting("use_pir_adjustment", val)}
        />

        {/* TIME RANGE ROW */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-background flex items-center justify-center border border-border/40">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">Active Window</span>
          </div>
          <div className="flex items-center gap-2 bg-background px-3 py-2 rounded-xl border border-border/50 shadow-inner">
            <input 
              type="time" 
              value={autoSettings.time_up}
              onChange={(e) => updateAutoSetting("time_up", e.target.value)}
              className="bg-transparent text-sm font-bold w-[70px] outline-none focus:text-primary appearance-none cursor-pointer"
            />
            <span className="text-muted-foreground/40 font-light">|</span>
            <input 
              type="time" 
              value={autoSettings.time_down}
              onChange={(e) => updateAutoSetting("time_down", e.target.value)}
              className="bg-transparent text-sm font-bold w-[70px] outline-none focus:text-primary appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>

    {/* LIGHTING SECTION */}
    <div className="px-4 border-t border-border/50">
      <SettingRow
        icon={Sun}
        label="Smart Lighting"
        description="LED control via light sensor"
        type="toggle"
        value={autoSettings.led_routine_active}
        onChange={(val) => updateAutoSetting("led_routine_active", val)}
      />
    </div>

    {/* LUX SLIDER (Indented) */}
    <div className={`transition-all duration-500 ease-in-out ${
      !autoSettings.led_routine_active 
        ? "opacity-30 grayscale pointer-events-none max-h-0 overflow-hidden" 
        : "opacity-100 max-h-[500px] bg-muted/10"
    }`}>
      <div className="pl-12 pr-6 py-5">
        <div className="flex justify-between items-end mb-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Sensitivity</span>
            <span className="text-[10px] text-muted-foreground/60 italic">Lower = triggers in darker conditions</span>
          </div>
          <span className="text-sm font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
            {autoSettings.lux_threshold} <span className="text-[10px] font-medium">LX</span>
          </span>
        </div>
        <input 
          type="range"
          min="5"
          max="150"
          step="5"
          value={autoSettings.lux_threshold}
          onChange={(e) => updateAutoSetting("lux_threshold", parseInt(e.target.value))}
          className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
        />
      </div>
    </div>

  </div>
</motion.div>

      {/* Device Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-card rounded-2xl p-5 border border-border/60 shadow-sm mb-6"
      >
        {diagLoading ? (
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading diagnostics…</span>
          </div>
        ) : diagError ? (
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive">Pi is Offline</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold text-foreground">
              {isPi ? "Raspberry Pi — Online" : "Device online (PC mode)"}
            </span>
          </div>
        )}
      </motion.div>

      {/* Diagnostics Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Diagnostics</h2>
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm px-4 py-1">
          {!diagLoading && !diagError && (
            <>
              <DiagRow icon={Activity} label="Device Status" value={isOnline ? "Online" : "Offline"} status={isOnline ? "ok" : "error"} />
              <DiagRow icon={Cpu} label="Running Mode" value={isPi ? "Raspberry Pi" : "PC Mock"} status={isPi ? "ok" : "warn"} />
              <DiagRow icon={HardDrive} label="State File" value={diag?.stateFileExists ? "Present" : "Missing"} status={diag?.stateFileExists ? "ok" : "error"} />
              <DiagRow icon={Blinds} label="Curtain State" value={diag?.curtainState === 100 ? "Open" : "Closed"} status="ok" />
              <DiagRow icon={Bird} label="Last Motion" value={lastMotionLabel} status={lastMotionLabel !== "Unknown" ? "ok" : "warn"} />
              <DiagRow icon={Thermometer} label="Temperature Sensor" value={diag?.tempSensor === "ok" ? "OK" : "Simulated"} status={diag?.tempSensor === "ok" ? "ok" : "warn"} />
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}