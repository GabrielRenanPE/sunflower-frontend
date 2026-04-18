"use client";

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

export function DayCurveChart() {
  const data = {
    labels: ['5h','6h','7h','8h','9h','10h','11h','12h','13h','14h','15h','16h','17h','18h','19h'],
    datasets: [{
      label: 'W/m²',
      data: [0, 18, 95, 230, 420, 620, 790, 891, 860, 730, 560, 360, 170, 52, 4],
      borderColor: '#EF9F27', 
      backgroundColor: 'rgba(239, 159, 39, 0.08)',
      borderWidth: 2.5,
      fill: true,
      tension: 0.45,
      
      // 👇 A MÁGICA ACONTECE AQUI 👇
      pointRadius: 5,           // Aumentamos de 3 para 5 (Tamanho padrão do ponto)
      pointHoverRadius: 8,      // O ponto cresce para 8 quando o mouse passa por cima
      pointBackgroundColor: '#BA7517',
      pointBorderColor: '#fff',
      pointBorderWidth: 2       // Borda branca um pouquinho mais grossa para destacar
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#888780', font: { size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#888780', font: { size: 11 }, callback: (v: any) => `${v} W` } }
    }
  };

  return (
    <div className="h-55 w-full">
      <Line data={data} options={options} />
    </div>
  );
}