import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

const DataPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ersätt med din Raspberry Pis IP eller Vercel-miljövariabel
  const API_URL = "http://DIN_PI_IP:5000/api/sensors"; 

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  if (loading) return <div className="p-10 text-center text-white">Laddar sensordata...</div>;

  return (
    <div className="p-4 sm:p-10 bg-slate-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 text-center text-emerald-400">Sensoranalys</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        
        {/* TEMPERATURGRAF */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-rose-400">Temperatur (°C)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.temperature}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                <Line type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LJUSGRAF */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h2 className="text-xl font-semibold mb-4 text-amber-400">Ljusnivå (Lux)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.light}>
                <defs>
                  <linearGradient id="colorLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                <Area type="monotone" dataKey="value" stroke="#fbbf24" fillOpacity={1} fill="url(#colorLight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIR (RÖRELSE) - Full bredd */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">Rörelseaktivitet (PIR)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.pir}>
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                <Area type="step" dataKey="value" stroke="#10b981" fill="#10b98120" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPage;