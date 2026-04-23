import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Thermometer, X } from "lucide-react";

export default function TemperatureAlert({ temperature }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (temperature >= 30) {
      setVisible(true);
    }
  }, [temperature]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="mx-5 mb-4 flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3"
        >
          <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Thermometer className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-800">High Temperature</p>
            <p className="text-xs text-orange-600">It's {temperature}°C — consider closing curtains.</p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="h-7 w-7 rounded-full hover:bg-orange-100 flex items-center justify-center transition-colors"
          >
            <X className="h-3.5 w-3.5 text-orange-500" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
