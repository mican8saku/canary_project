import { useState, useEffect, useCallback } from "react";
import {
  getSystemStatus,
  openCurtain as apiOpen,
  closeCurtain as apiClose,
} from "../api/birdNestApi";

const POLL_INTERVAL_MS = 2_000;

function formatLastMotion(isoString) {
  if (!isoString) return "Unknown";
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function useBirdNest() {
  const [temperature, setTemperature] = useState(null);
  const [curtainState, setCurtainState] = useState(null);  // "open" | "closed"
  const [birdStatus, setBirdStatus] = useState(null);       // "active" | "inactive"
  const [lastMotionAt, setLastMotionAt] = useState(null);   // ISO string
  const [deviceOnline, setDeviceOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [curtainLoading, setCurtainLoading] = useState(false);
  const [lightOn, setLightOn] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const dismissAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const status = await getSystemStatus();

      setTemperature(status.temperature);
      setCurtainState(status.curtainState);
      setLightOn(status.lightOn); 
      setIsMoving(status.isMoving); 
      setBirdStatus(status.birdStatus);
      setLastMotionAt(status.lastMotionAt);
      setDeviceOnline(status.deviceOnline ?? true);
      setAlerts(status.alerts ?? []);
      setError(null);
    } catch (err) {
      setDeviceOnline(false);
      setError(err.message || "Failed to reach device");
    }
  }, []);

  // ── Polling ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function initialFetch() {
      setLoading(true);
      await fetchStatus();
      if (!cancelled) setLoading(false);
    }
    initialFetch();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchStatus]);

  // ── Curtain actions ────────────────────────────────────────────────────────
  const openCurtain = useCallback(async () => {
    if (curtainLoading) return;
    setCurtainLoading(true);
    try {
      const res = await apiOpen();
      if (res && typeof res.curtainState === 'number') {
        setCurtainState(res.curtainState) 
      };
    } finally {
      setCurtainLoading(false);
    }
  }, [curtainLoading]);

  const closeCurtain = useCallback(async () => {
    if (curtainLoading) return;
    setCurtainLoading(true);
    try {
      const res = await apiClose();
      if (res && typeof res.curtainState === 'number') {
        setCurtainState(res.curtainState)
      };
    } finally {
      setCurtainLoading(false);
    }
  }, [curtainLoading]);

  // ---- Light Control ------ 
  const toggleLight = useCallback(async () => {
  try {
    const res = await apiPost('/light/toggle'); 
    if (res && res.lightOn !== undefined) {
      setLightOn(res.lightOn);
    }
  } catch (err) {
    console.error("Kunde inte ändra ljus:", err);
  }
}, []); // Tom array är ok här om du inte använder lightOn-variabeln inuti try-blocket

  return {
    temperature,
    curtainState,
    lightOn,
    isMoving,
    toggleLight,
    birdStatus,
    lastMotionAt: formatLastMotion(lastMotionAt),
    lastMotionAtRaw: lastMotionAt,
    deviceOnline,
    loading,
    error,
    alerts,
    dismissAlert,
    openCurtain,
    closeCurtain,
    curtainLoading,
  };
}
