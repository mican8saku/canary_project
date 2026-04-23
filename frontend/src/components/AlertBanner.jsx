import { motion, AnimatePresence } from "framer-motion";
import { Thermometer, Activity, X } from "lucide-react";

const styles = {
  temp: {
    bg: {
      backgroundColor: "#fef2f2",
      border: "1px solid #fecaca",
      borderLeft: "4px solid #dc2626",
    },
    iconBg: { backgroundColor: "#fee2e2" },
    iconColor: { color: "#dc2626" },
    titleColor: { color: "#991b1b" },
    bodyColor: { color: "#b91c1c" },
    closeHover: "hover:bg-red-100",
    Icon: Thermometer,
  },
  motion: {
    bg: {
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderLeft: "3px solid #94a3b8",
    },
    iconBg: { backgroundColor: "#e2e8f0" },
    iconColor: { color: "#64748b" },
    titleColor: { color: "#1e293b" },
    bodyColor: { color: "#475569" },
    closeHover: "hover:bg-slate-100",
    Icon: Activity,
  },
};

function formatTime(isoString) {
  if (!isoString) return null;
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AlertBanner({ alerts, onDismiss, lastMotionAt }) {
  return (
    <AnimatePresence>
      {alerts.map((alert) => {
        const s = styles[alert.type] || styles.motion;
        const Icon = s.Icon;
        const isMotion = alert.type === "motion";
        const formattedTime = isMotion ? formatTime(lastMotionAt) : null;

        return (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -12, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="overflow-hidden mb-3"
          >
            <div
              className="flex items-start gap-3 rounded-2xl px-4 py-3"
              style={s.bg}
            >
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={s.iconBg}
              >
                <Icon className="h-4 w-4" style={s.iconColor} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={s.titleColor}>
                  {isMotion ? "Bird inactive" : "Temperature Alert"}
                </p>

                <p className="text-xs mt-0.5" style={s.bodyColor}>
                  {isMotion
                    ? formattedTime
                      ? `Last activity ${formattedTime}`
                      : "No recent activity"
                    : alert.message}
                </p>
              </div>

              <button
                onClick={() => onDismiss(alert.id)}
                className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${s.closeHover}`}
                style={{ color: s.iconColor.color }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
