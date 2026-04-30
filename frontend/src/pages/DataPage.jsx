import React from 'react';
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

// Registrera modulerna i Chart.js
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
  // Mock-data för PIR-aktivitet över ett dygn
  const data = {
    labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"],
    datasets: [
      {
        label: 'Rörelse i buren (PIR)',
        data: [0, 0, 12, 45, 30, 10, 2], // Exempelvärden (antal triggers)
        fill: true,
        borderColor: '#10b981', // En snygg grön färg (Emerald-500)
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4, // Gör linjen mjukt kurvad
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Dölj legend för en renare look
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      x: {
        grid: { display: false },
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
        {/* Kortet för grafen */}
        <div className="bg-card rounded-3xl border border-border/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Aktivitet (24h)</h2>
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
              Live Uppdatering
            </span>
          </div>
          
          <div className="h-[300px] w-full">
            <Line data={data} options={options} />
          </div>
        </div>

        {/* Ett extra kort för snabbinfo */}
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