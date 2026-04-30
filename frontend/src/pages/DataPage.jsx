import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DataPage() {
  // State för att hålla data från backend
  const [motionData, setMotionData] = useState({ labels: [], values: [] });
  const [totalTriggers, setTotalTriggers] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Hämta data från din Flask-backend
        // Ersätt 'localhost' med din Raspberry Pi:s IP om du kör från en annan dator
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/motion-stats`);
        const data = await response.json();

        setMotionData(data);
        
        // Räkna ut totalt antal triggers för snabbinfo-kortet
        const total = data.values.reduce((a, b) => a + b, 0);
        setTotalTriggers(total);
      } catch (error) {
        console.error("Kunde inte hämta sensor-data:", error);
      }
    };

    fetchData();
    // Uppdatera varje minut för att få "Live Uppdatering" känslan
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: motionData.labels, // Tidsstämplar från main.py
    datasets: [
      {
        label: 'Rörelse i buren (PIR)',
        data: motionData.values, // Antal triggers från main.py
        fill: true,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      x: {
        grid: { display: false },
        ticks: {
          // Visa bara var tredje etikett för att inte kladda ner x-axeln
          callback: function(val, index) {
            return index % 3 === 0 ? this.getLabelForValue(val) : '';
          }
        }
      }
    },
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Sensor Data</h1>
        <p className="text-muted-foreground">Visualisering av fågelns aktivitet</p>
      </header>

      <div className="grid gap-6">
        <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Aktivitet (24h)</h2>
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
              Live Uppdatering
            </span>
          </div>
          
          <div className="h-[300px] w-full">
            {motionData.labels.length > 0 ? (
              <Line data={chartData} options={options} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Hämtar data från sensor...</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border/50 p-4">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Status</p>
            <p className="text-xl font-semibold mt-1">Aktiv</p>
          </div>
          <div className="bg-card rounded-2xl border border-border/50 p-4">
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Totala triggers idag</p>
            <p className="text-xl font-semibold mt-1">{totalTriggers} gånger</p>
          </div>
        </div>
      </div>
    </div>
  );
}