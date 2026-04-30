import { useState, useEffect, useCallback } from "react";
import {
  getSystemStatus,
  openCurtain as apiOpen,
  closeCurtain as apiClose,
  apiPost,
  BASE_URL
} from "../api/birdNestApi";

const POLL_INTERVAL_MS = 2_000;

// DENNA FUNKTION SAKNADES:
function formatLastMotion(isoString) {
  if (!isoString) return "No motion detected";
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
  const [curtainState, setCurtainState] = useState(null);
  const [birdStatus, setBirdStatus] = useState(null);
  const [lastMotionAt, setLastMotionAt] = useState(null);
  const [deviceOnline, setDeviceOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [curtainLoading, setCurtainLoading] = useState(false);
  const [lightOn, setLightOn] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lux, setLux] = useState(null);
  

  const fetchStatus = useCallback(async () => {
    try {
      const status = await getSystemStatus();
      setTemperature(status.temperature);
      setLux(status.lux);
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

  const takeSnapshot = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      const response = await fetch(`${BASE_URL}/camera/snapshot`);
      return await response.json();
    } catch (err) {
      console.error("Camera error:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  const openCurtain = useCallback(async () => {
    if (curtainLoading) return;
    setCurtainLoading(true);
    try {
      const res = await apiOpen();
      if (res && res.curtainState !== undefined) setCurtainState(res.curtainState);
    } finally {
      setCurtainLoading(false);
    }
  }, [curtainLoading]);

  const closeCurtain = useCallback(async () => {
    if (curtainLoading) return;
    setCurtainLoading(true);
    try {
      const res = await apiClose();
      if (res && res.curtainState !== undefined) setCurtainState(res.curtainState);
    } finally {
      setCurtainLoading(false);
    }
  }, [curtainLoading]);

  const toggleLight = useCallback(async () => {
    try {
      const res = await apiPost('/light/toggle'); 
      if (res && res.lightOn !== undefined) setLightOn(res.lightOn);
    } catch (err) {
      console.error("Light error:", err);
    }
  }, []);

  return {
    temperature,
    lux,
    curtainState,
    lightOn,
    isMoving,
    toggleLight,
    birdStatus,
    lastMotionAt: formatLastMotion(lastMotionAt), // Anropar funktionen ovan
    lastMotionAtRaw: lastMotionAt,
    deviceOnline,
    loading,
    error,
    alerts,
    openCurtain,
    closeCurtain,
    curtainLoading,
    takeSnapshot,
    isCapturing
  };
}