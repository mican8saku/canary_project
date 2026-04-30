import { useState, useEffect, useCallback } from "react";
import {
  getSystemStatus,
  openCurtain as apiOpen,
  closeCurtain as apiClose,
  apiPost,
  BASE_URL // Se till att denna är exporterad från din api-fil
} from "../api/birdNestApi";

const POLL_INTERVAL_MS = 2_000;

// ... (formatLastMotion funktionen behålls som den är)

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
  
  // NYTT: State för kamera-snapshot
  const [isCapturing, setIsCapturing] = useState(false);

  // ... (dismissAlert och fetchStatus behålls som de är)

  // ── Camera actions ──────────────────────────────────────────────────────────
  const takeSnapshot = useCallback(async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      // Vi använder fetch direkt här eftersom vi vill trigga snapshot-kommandot
      const response = await fetch(`${BASE_URL}/camera/snapshot`);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Kameradefel:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  // ── Curtain actions ────────────────────────────────────────────────────────
  const openCurtain = useCallback(async () => {
    if (curtainLoading) return;
    setCurtainLoading(true);
    try {
      const res = await apiOpen();
      if (res && res.ok) {
        // Din backend returnerar curtainState i svaret
        setCurtainState(res.curtainState);
      }
    } finally {
      setCurtainLoading(false);
    }
  }, [curtainLoading]);

  const closeCurtain = useCallback(async () => {
    if (curtainLoading) return;
    setCurtainLoading(true);
    try {
      const res = await apiClose();
      if (res && res.ok) {
        setCurtainState(res.curtainState);
      }
    } finally {
      setCurtainLoading(false);
    }
  }, [curtainLoading]);

  // ── Light Control ──────────────────────────────────────────────────────────
  const toggleLight = useCallback(async () => {
    try {
      const res = await apiPost('/light/toggle'); 
      if (res && res.lightOn !== undefined) {
        setLightOn(res.lightOn);
      }
    } catch (err) {
      console.error("Kunde inte ändra ljus:", err);
    }
  }, []);

  // KOM IHÅG: Lägg till de nya funktionerna i return-objektet!
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
    takeSnapshot, // EXPORTERA DENNA
    isCapturing   // EXPORTERA DENNA
  };
}