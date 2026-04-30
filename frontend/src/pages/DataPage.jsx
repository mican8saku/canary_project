import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Activity, Thermometer, Sun, Loader2, 
  AlertCircle 
} from "lucide-react";
import { BASE_URL } from "../api/birdNestApi";

function ChartContainer({ icon: Icon, title, colorClass, children }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest ml-1">
        {title}
      </h2>
      <div className="bg-card rounded-3xl border border-border/60 shadow-sm overflow-hidden p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center">
            <Icon className={`h-4 w-4 ${colorClass}`} />
          </div>
          <span className="text-sm font-medium text-foreground italic opacity-70">Live Analytics</span>
        </div>
        <div className="h-64 w-full">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export default function DataPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('24h');

  const getFilteredData = (rawData) => {
    if (!rawData) return [];
    
    switch (viewMode) {
      case '1h':
        return rawData.slice(-60);    // 60 minuter
      case '3h':
        return rawData.slice(-180);   // 3 * 60 minuter
      case '6h':
        return rawData.slice(-360);   // 6 * 60 minuter
      case '12h':
        return rawData.slice(-720);   // 12 * 60 minuter
      case '24h':
        return rawData.slice(-1440);  // 24 * 60 minuter
      default:
        return rawData;
    }
  };

  const fetchData = () => {
    setLoading(true);
    fetch(`${BASE_URL}/api/sensors`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setError(null);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to reach BirdNest Pi");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Genererar jämna klockslag för X-axeln om man kör 24h mode
  const timeTicks = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"];

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8 space-y-6">
      
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-end">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">Environmental</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Sensor Data</h1>
        </div>
        
        {/* TIDSKONTROLL */}
        <div className="flex bg-muted p-1 rounded-xl border border-border/50">
          {['1h', '3h', '6h', '12h', '24h'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                viewMode === mode 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </motion.div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground font-medium">Gathering intel...</p>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex flex-col items-center gap-2 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <p className="font-semibold text-sm">Pi is Offline</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* 1. AKTIVITET (PIR) - NU HÖGST UPP */}
          <ChartContainer title="Bird Activity" icon={Activity} colorClass="text-green-500">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getFilteredData(data.pir)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="time" 
                  ticks={viewMode === '24h' ? timeTicks : undefined}
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  minTickGap={50}
                />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))' }} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.3} 
                  strokeWidth={3} 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* 2. TEMPERATUR - FIXED RANGE [15-35] */}
          <ChartContainer title="Air Temperature" icon={Thermometer} colorClass="text-orange-500">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getFilteredData(data.temperature)}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="time" 
                  ticks={viewMode === '24h' ? timeTicks : undefined}
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  minTickGap={50}
                />
                <YAxis 
                  domain={[15, 35]} 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  unit="°" 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#f97316" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorTemp)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* 3. LJUSNIVÅ - FIXED RANGE [0-1000] */}
          <ChartContainer title="Light Intensity" icon={Sun} colorClass="text-yellow-500">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getFilteredData(data.light)}>
                <defs>
                  <linearGradient id="colorLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="time" 
                  ticks={viewMode === '24h' ? timeTicks : undefined}
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  minTickGap={50}
                />
                <YAxis 
                  domain={[0, 1000]} 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))' }} />
                <Area type="monotone" dataKey="value" stroke="#eab308" fillOpacity={1} fill="url(#colorLight)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>

        </div>
      )}
    </div>
  );
}