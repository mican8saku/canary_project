import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MotionChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // När du har SSH: Byt 'localhost' mot din Raspberry Pis IP
        const response = await fetch('http://localhost:5000/api/motion-stats');
        const jsonData = await response.json();

        // Formaterar om datan så Recharts förstår den
        const formattedData = jsonData.labels.map((label, index) => ({
          time: label,
          count: jsonData.values[index]
        }));

        setData(formattedData);
      } catch (error) {
        console.error("Väntar på anslutning till Raspberry Pi...");
        // Test-data så du ser grafen direkt:
        setData([
          {time: "10:00", count: 2}, {time: "10:20", count: 5},
          {time: "10:40", count: 0}, {time: "11:00", count: 3}
        ]);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Uppdatera var 30:e sekund
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: '100%', height: 300, background: '#1a1a1a', padding: '15px', borderRadius: '12px' }}>
      <h4 style={{ color: '#ccc', marginBottom: '10px', fontFamily: 'sans-serif' }}>Rörelseaktivitet (24h)</h4>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="time" stroke="#666" tick={{fontSize: 12}} />
          <YAxis stroke="#666" allowDecimals={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#222', border: 'none', borderRadius: '8px', color: '#fff' }}
          />
          <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MotionChart;