import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Bell, Thermometer, Clock, Cpu, Activity, 
  HardDrive, Blinds, Bird, Loader2, AlertCircle, 
  CheckCircle2, XCircle, Sun, Sunrise, Sunset // Lade till Sunrise/Sunset
} from "lucide-react";
import SettingRow from "../components/SettingRow";
import { getDiagnostics, apiPost } from "../api/birdNestApi";

function DiagRow({ icon: Icon, label, value, status }) {
  const color =
    status === "ok" ? "text-green-500" :
    status === "warn" ? "text-orange-400" :
    status === "error" ? "text-destructive" :
    "text-muted-foreground";

  const Dot = status === "ok" ? CheckCircle2 : status === "error" ? XCircle : null;

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
  const [diag, setDiag] = useState(null);
  const [diagLoading, setDiagLoading] = useState(true);
  const [diagError, setDiagError] = useState(null);

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

  useEffect(() => {
    setDiagLoading(true);
    getDiagnostics()
      .then((data) => {
        if (data && data.ok) setDiag(data);
        setDiagError(null);
      })
      .catch((err) => setDiagError(err.message || "Failed to load diagnostics"))
      .finally(() => setDiagLoading(false));
  }, []);

  useEffect(() => {
    apiPost('/settings/automation', {}, 'GET')
      .then(data => {
        if (data && data.ok && data.settings) setAutoSettings(data.settings);
      })
      .catch(err => console.error("Could not fetch automation settings", err));
  }, []);

  const updateAutoSetting = async (key, value) => {
    setAutoSettings(prev => ({ ...prev, [key]: value }));
    try {
      await apiPost('/settings/automation', { [key]: value });
    } catch (err) {
      console.error("Failed to save setting:", err);
    }
  };

  const isPi = diag?.isPi ?? false;
  const lastMotionLabel = (() => {
    if (!diag?.lastMotionAt) return "Unknown";
    const secondsAgo = Math.floor((Date.now() - new Date(diag.lastMotionAt).getTime()) / 1000);
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    return `${Math.floor(secondsAgo / 60)}m ago`;
  })();

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8 space-y-6">
      
      {/* HEADER - Nu vänsterställd igen */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">Preferences</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
      </motion.div>

      {/* AUTOMATION CARD */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        {/* Rubrik matchar nu Diagnostics exakt */}
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
          Automation Routine
        </h2>
        
        <div className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden">
          
          <div className="px-4">
            <SettingRow
              icon={Blinds}
              label="Curtain Automation"
              description="Schedule based on activity"
              type="toggle"
              value={autoSettings.curtain_routine_active}
              onChange={(val) => updateAutoSetting("curtain_routine_active", val)}
            />
          </div>

          {/* Undermeny - Försvinner inte längre, blir bara grå via CSS klasser */}
          <div className={`transition-all duration-300 ${
            !autoSettings.curtain_routine_active ? "opacity-30 grayscale pointer-events-none" : "opacity-100"
          }`}>
            <div className="pl-10 pr-4 pb-2 divide-y divide-border/40 bg-muted/5 border-t border-border/40">
              <SettingRow
                icon={Activity}
                label="Biorythm (PIR)"
                type="toggle"
                value={autoSettings.use_pir_adjustment}
                onChange={(val) => updateAutoSetting("use_pir_adjustment", val)}
              />

              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-background flex items-center justify-center border border-border/40">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Active Window</span>
                </div>
                
                {/* Bredare input-ruta med Sunrise/Sunset ikoner */}
                <div className="flex items-center gap-3 bg-background px-4 py-2.5 rounded-xl border border-border/50 shadow-inner min-w-[200px] justify-between">
                  <div className="flex items-center gap-2">
                    <Sunrise className="h-3.5 w-3.5 text-orange-400" />
                    <input 
                      type="time" 
                      value={autoSettings.time_up}
                      onChange={(e) => updateAutoSetting("time_up", e.target.value)}
                      className="bg-transparent text-sm font-bold w-[80px] outline-none text-foreground cursor-pointer"
                    />
                  </div>
                  <span className="text-muted-foreground/30 font-light">|</span>
                  <div className="flex items-center gap-2">
                    <Sunset className="h-3.5 w-3.5 text-blue-400" />
                    <input 
                      type="time" 
                      value={autoSettings.time_down}
                      onChange={(e) => updateAutoSetting("time_down", e.target.value)}
                      className="bg-transparent text-sm font-bold w-[80px] outline-none text-foreground cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

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

          {/* Lux-inställning - Nu med TextBox och svart text */}
          <div className={`transition-all duration-300 ${
            !autoSettings.led_routine_active ? "opacity-30 grayscale pointer-events-none" : "opacity-100"
          }`}>
            <div className="pl-12 pr-6 py-4 bg-muted/5 border-t border-border/40 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Lux Threshold</span>
                <span className="text-[10px] text-muted-foreground">Lower = triggers when darker</span>
              </div>
              <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-lg border border-border/50 shadow-sm border-black">
                 <input 
                  type="number"
                  value={autoSettings.lux_threshold}
                  onChange={(e) => updateAutoSetting("lux_threshold", parseInt(e.target.value) || 0)}
                  className="bg-transparent text-sm font-bold w-12 text-center outline-none text-black"
                />
                <span className="text-[10px] font-bold text-black uppercase">LX</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* DIAGNOSTICS CARD */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 ml-1">Diagnostics</h2>
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm px-4 py-1">
          {diagLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : diagError ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-destructive font-medium">
              <AlertCircle className="h-6 w-6" />
              <p className="text-sm">Pi is Offline</p>
            </div>
          ) : (
            <>
              <DiagRow icon={Activity} label="Device Status" value="Online" status="ok" />
              <DiagRow icon={Cpu} label="Running Mode" value={isPi ? "Raspberry Pi" : "PC Mock"} status={isPi ? "ok" : "warn"} />
              <DiagRow icon={Blinds} label="Curtain State" value={diag?.curtainState === 100 ? "Open" : "Closed"} status="ok" />
              <DiagRow icon={Bird} label="Last Motion" value={lastMotionLabel} status="ok" />
              <DiagRow icon={Thermometer} label="Temp Sensor" value={diag?.tempSensor === "ok" ? "OK" : "Mock"} status="ok" />
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}