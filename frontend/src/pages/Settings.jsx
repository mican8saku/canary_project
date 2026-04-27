import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Thermometer, Clock, Cpu, Activity, HardDrive, Blinds, Bird, Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import SettingRow from "../components/SettingRow";
import { getDiagnostics } from "../api/birdNestApi";

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

  useEffect(() => {
    setDiagLoading(true);
    getDiagnostics()
      .then((data) => {
        if(data && data.ok) {
          setDiag(data);
        }
          setDiagError(null); 
      })
      .catch((err) => setDiagError(err.message || "Failed to load diagnostics"))
      .finally(() => setDiagLoading(false));
  }, []);

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
            <span className="text-sm text-destructive">Could not load diagnostics</span>
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

      {/* Diagnostics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Diagnostics</h2>
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm px-4 py-1">
          {diagLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : diagError ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Diagnostics unavailable</p>
              <p className="text-xs text-muted-foreground/70">{diagError}</p>
            </div>
          ) : (
            <>
              <DiagRow
                icon={Activity}
                label="Device Status"
                value={isOnline ? "Online" : "Offline"}
                status={isOnline ? "ok" : "error"}
              />
              <DiagRow
                icon={Cpu}
                label="Running Mode"
                value={isPi ? "Raspberry Pi" : "PC Mock"}
                status={isPi ? "ok" : "warn"}
              />
              <DiagRow
                icon={HardDrive}
                label="State File"
                value={diag?.stateFileExists ? "Present" : "Missing"}
                status={diag?.stateFileExists ? "ok" : "error"}
              />
              <DiagRow
                icon={Blinds}
                label="Curtain State"
                value={diag?.curtainState === 100 ? "Open" : "Closed"}
                status="ok"
              />
              <DiagRow
                icon={Bird}
                label="Last Motion"
                value={lastMotionLabel}
                status={lastMotionLabel !== "Unknown" ? "ok" : "warn"}
              />
              <DiagRow
                icon={Thermometer}
                label="Temperature Sensor"
                value={diag?.tempSensor === "ok" ? "OK" : diag?.tempSensor === "mock" ? "Simulated" : "Simulated"}
                status={diag?.tempSensor === "ok" ? "ok" : "warn"}
              />
              <DiagRow
                icon={Cpu}
                label="Motor Control"
                value={diag?.motorControl === "mock" ? "Simulated" : (diag?.motorControl ?? "Unknown")}
                status={diag?.motorControl === "OK" ? "ok" : "warn"}
              />
            </>
          )}
        </div>
      </motion.div>

      {/* Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Alerts</h2>
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm px-4 divide-y divide-border/50">
          <SettingRow
            icon={Bell}
            label="Notifications"
            description="Receive alerts for temperature and motion"
            type="toggle"
            value={notifications}
            onChange={setNotifications}
          />
        </div>
      </motion.div>

      {/* Thresholds */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Thresholds</h2>
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm px-4 divide-y divide-border/50">
          <SettingRow
            icon={Thermometer}
            label="Temperature Alert"
            description="Alert when temperature exceeds this value"
            type="value"
            value={`${tempThreshold}°C`}
          />
          <SettingRow
            icon={Clock}
            label="Motion Alert Timeout"
            description="Alert if no movement detected for this long"
            type="value"
            value={`${motionTimeout}s`}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 ml-1">Tap to adjust thresholds (coming soon)</p>
      </motion.div>
    </div>
  );
}
