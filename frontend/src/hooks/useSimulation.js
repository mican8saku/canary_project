import { useState, useEffect, useRef } from "react";

// Simulates temperature and motion events, returns current state + alerts
export function useSimulation() {
  const [temperature, setTemperature] = useState(28);
  const [lastMotionAt, setLastMotionAt] = useState(Date.now());
  const [alerts, setAlerts] = useState([]);
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  const dismissAlert = (id) =>
    setAlerts((prev) => prev.filter((a) => a.id !== id));

  const addAlert = (alert) => {
    const id = alert.type + "_" + Date.now();
    // Don't stack same type
    if (alertsRef.current.some((a) => a.type === alert.type)) return;
    setAlerts((prev) => [...prev, { ...alert, id }]);
  };

  // Simulate temperature fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setTemperature((t) => {
        const next = parseFloat((t + (Math.random() * 2 - 0.8)).toFixed(1));
        const clamped = Math.max(24, Math.min(36, next));
        if (clamped >= 30) {
          addAlert({
            type: "temperature",
            title: "High Temperature",
            message: `It's ${clamped}°C — consider closing curtains.`,
            severity: "warning",
          });
        } else {
          setAlerts((prev) => prev.filter((a) => a.type !== "temperature"));
        }
        return clamped;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Simulate motion events
  useEffect(() => {
    const motionInterval = setInterval(() => {
      // 40% chance of motion every 12s
      if (Math.random() < 0.4) {
        setLastMotionAt(Date.now());
        setAlerts((prev) => prev.filter((a) => a.type !== "motion"));
      }
    }, 12000);

    // Check if no motion for 30s (simulated)
    const checkInterval = setInterval(() => {
      const elapsed = (Date.now() - lastMotionAt) / 1000;
      if (elapsed >= 30) {
        addAlert({
          type: "motion",
          title: "No Movement Detected",
          message: "No motion for 30 seconds. Check the camera.",
          severity: "info",
          action: "View Camera",
        });
      }
    }, 5000);

    return () => {
      clearInterval(motionInterval);
      clearInterval(checkInterval);
    };
  }, [lastMotionAt]);

  return { temperature, lastMotionAt, alerts, dismissAlert };
}
