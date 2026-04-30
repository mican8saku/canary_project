import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

export default function DataPage() {
  // Recharts vill ha data som en array av objekt
  const data = [
    { time: "00:00", activity: 0 },
    { time: "04:00", activity: 0 },
    { time: "08:00", activity: 12 },
    { time: "12:00", activity: 45 },
    { time: "16:00", activity: 30 },
    { time: "20:00", activity: 10 },
    { time: "23:59", activity: 2 },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Sensor Data</h1>
        <p className="text-muted-foreground">Visualisering av fågelns aktivitet</p>
      </header>

      <div className="grid gap-6">
        {/* Kortet för grafen */}
        <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Aktivitet (24h)</h2>
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
              Live Uppdatering
            </span>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {/* Vi använder AreaChart för att få den snygga fyllningen (fill) under linjen */}
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  vertical={false} 
                  strokeDasharray="3 3" 
                  stroke="rgba(255, 255, 255, 0.05)" 
                />
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#888', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px' 
                  }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="activity" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorActivity)" 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Info-kort */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border/50 p-4">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Mest aktiv</p>
            <p className="text-xl font-semibold mt-1">11:30 - 12:45</p>
          </div>
          <div className="bg-card rounded-2xl border border-border/50 p-4">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Totala triggers</p>
            <p className="text-xl font-semibold mt-1">142 gånger</p>
          </div>
        </div>
      </div>
    </div>
  );
}