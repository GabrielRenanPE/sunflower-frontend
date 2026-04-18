"use client";

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Registrando os módulos necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function EnergyChart() {
  const data = {
    labels: ['6h','7h','8h','9h','10h','11h','12h','13h','14h','15h','16h','17h','18h'],
    datasets: [{
      label: 'kWh/m²',
      data: [0.1, 0.4, 1.2, 2.8, 4.5, 5.9, 6.4, 5.8, 4.6, 3.1, 1.8, 0.7, 0.1],
      backgroundColor: '#97C459', // var(--green-200) do seu HTML
      borderColor: '#3B6D11',     // var(--green-600)
      borderWidth: 1,
      borderRadius: 4,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { 
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { callback: (value: any) => `${value} kWh` }
      }
    }
  };

  return (
    <div className="h-62.5 w-full">
      <Bar data={data} options={options} />
    </div>
  );
}