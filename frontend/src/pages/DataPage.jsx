import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { BASE_URL } from "../api/birdNestApi"; // Din miljövariabel

export default function DataPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Använder miljövariabeln för att nå din Flask-server
    fetch(`${BASE_URL}/api/sensors`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching sensor data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-10 text-center text-slate-400">Laddar sensordata...</div>;
  }

  return (
    <div className="p-4 sm:p-10 bg-slate-900 min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header>
          <h1 className="text-3xl font-bold text-emerald-400">Sensorstatistik</h1>
          <p className="text-slate-400 mt-2">Historik och realtidsvärden från fågelholken</p>
        </header>

        {data ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* TEMPERATURGRAF */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
              <h2 className="text-lg font-medium mb-4 text-rose-400">Temperatur (°C)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.temperature}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* LJUSGRAF */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
              <h2 className="text-lg font-medium mb-4 text-amber-400">Ljusnivå (Lux)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.light}>
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="value" stroke="#fbbf24" fill="#fbbf2420" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PIR (RÖRELSE) - Full bredd i botten */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl lg:col-span-2">
              <h2 className="text-lg font-medium mb-4 text-emerald-400">Rörelseaktivitet (PIR)</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.pir}>
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                    <Area type="step" dataKey="value" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-20 text-rose-400 bg-slate-800 rounded-2xl border border-slate-700">
            Kunde inte hämta data. Kontrollera anslutningen till din Raspberry Pi.
          </div>
        )}
      </div>
    </div>
  );
}
