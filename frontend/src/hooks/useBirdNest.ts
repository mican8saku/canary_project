import { useState, useEffect, useCallback } from 'react';
import {
  getSystemStatus,
  openCurtain as apiOpen,
  closeCurtain as apiClose,
  controlLed as apiControlLed,
  type SystemStatus,
  type Alert,
} from '../api/birdNestApi';

const POLL_INTERVAL_MS = 5000;

function formatLastMotion(isoString: string | null): string {
  if (!isoString) return 'Unknown';
  
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface BirdNestHook {
  temperature: number | null;
  curtainState: 'open' | 'closed' | null;
  birdStatus: 'active' | 'inactive' | null;
  lastMotionAt: string;
  lastMotionAtRaw: string | null;
  deviceOnline: boolean;
  loading: boolean;
  error: string | null;
  alerts: Alert[];
  dismissAlert: (id: string) => void;
  openCurtain: () => Promise<void>;
  closeCurtain: () => Promise<void>;
  controlLed: (on: boolean) => Promise<void>;
  curtainLoading: boolean;
  ledLoading: boolean;
}

export function useBirdNest(): BirdNestHook {
  const [state, setState] = useState<Omit<SystemStatus, 'alerts'>>({
    temperature: null,
    curtainState: null,
    birdStatus: null,
    lastMotionAt: null,
    deviceOnline: true,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [curtainLoading, setCurtainLoading] = useState(false);
  const [ledLoading, setLedLoading] = useState(false);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const status = await getSystemStatus();
      setState({
        temperature: status.temperature,
        curtainState: status.curtainState,
        birdStatus: status.birdStatus,
        lastMotionAt: status.lastMotionAt,
        deviceOnline: status.deviceOnline,
      });
      setAlerts(status.alerts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
      setState(prev => ({ ...prev, deviceOnline: false }));
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

  const openCurtain = useCallback(async () => {
    if (curtainLoading) return;
    setCurtainLoading(true);
    try {
      const { curtainState } = await apiOpen();
      setState(prev => ({ ...prev, curtainState }));
    } finally {
      setCurtainLoading(false);
    }
  }, [curtainLoading]);

  const closeCurtain = useCallback(async () => {
    if (curtainLoading) return;
    setCurtainLoading(true);
    try {
      const { curtainState } = await apiClose();
      setState(prev => ({ ...prev, curtainState }));
    } finally {
      setCurtainLoading(false);
    }
  }, [curtainLoading]);

  const controlLed = useCallback(async (on: boolean) => {
    if (ledLoading) return;
    setLedLoading(true);
    try {
      await apiControlLed(on);
    } finally {
      setLedLoading(false);
    }
  }, [ledLoading]);

  return {
    ...state,
    lastMotionAt: formatLastMotion(state.lastMotionAt),
    lastMotionAtRaw: state.lastMotionAt,
    deviceOnline: state.deviceOnline,
    loading,
    error,
    alerts,
    dismissAlert,
    openCurtain,
    closeCurtain,
    controlLed,
    curtainLoading,
    ledLoading,
  };
}
