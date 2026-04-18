import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sun, MapPin, Zap, Cloud, Wind, Thermometer, ShieldCheck, Activity
} from "lucide-react";

import { EnergyChart } from "@/components/EnergyChart";
import { SolarCompass } from "@/components/SolarCompass";
import { DayCurveChart } from "@/components/DayCurveChart";

export default function SunflowerDashboard() {
  return (
    <main className="w-full p-4 md:p-6 lg:p-8 space-y-5 bg-[#eeede8] min-h-screen text-sun-text font-sans">
      
      {/* ── Topbar (REFINADO) ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-black/10 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-sun-green-600 rounded-full flex items-center justify-center text-sun-amber-400 shrink-0 shadow-sm border border-black/5">
            <Sun size={32} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none mb-1.5">Sunflower</h1>
            <p className="text-[10px] font-bold text-[#6b6a64] uppercase tracking-[0.3em] opacity-80">
              Análise de Viabilidade Solar
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="flex items-center gap-2.5 bg-white border border-black/10 px-5 py-2.5 rounded-full shadow-sm">
            <div className="w-2.5 h-2.5 bg-sun-green-context rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-sun-text">
              Coletando dados
            </span>
          </div>
          
          {/* Date Badge */}
          <div className="bg-white border border-black/10 px-5 py-2.5 rounded-full shadow-sm">
            <span className="text-[11px] font-black text-sun-text/80 tracking-wide">
              17 de abr. de 2026 <span className="text-sun-green-context mx-1.5 font-black">|</span> 22:23
            </span>
          </div>
        </div>
      </header>

      {/* ── Location Bar ── */}
      <div className="flex items-center gap-2 bg-white px-4 py-3.5 rounded-lg border border-black/10 shadow-sm">
        <MapPin size={20} className="text-sun-green-600" />
        <span className="font-black text-sun-text text-base">Belo Jardim, PE, Brasil</span>
        <span className="text-black/10 mx-2 font-black">|</span> 
        <span className="font-black text-sun-green-context text-sm tracking-tight">
          lat -8.33° <span className="text-black/10 mx-1.5">·</span> lon -36.42° <span className="text-black/10 mx-1.5">·</span> alt 768 m
        </span>
        <span className="ml-auto bg-sun-green-50 text-sun-green-600 px-4 py-1.5 rounded-full font-black text-[11px] uppercase tracking-wider border border-sun-green-100">
          Semiárido nordestino
        </span>
      </div>

      {/* ── Verdict Card ── */}
      <Card className="border-black/10 shadow-md rounded-xl overflow-hidden bg-white">
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-10">
          <div className="w-20 h-20 bg-sun-amber-600 rounded-full flex items-center justify-center text-sun-amber-400 shrink-0 shadow-inner">
             <Sun size={40} fill="currentColor" />
          </div>
          <div className="flex-1 space-y-3 text-center md:text-left">
            <h2 className="text-2xl font-black text-sun-text">Ótimo para instalação solar!</h2>
            <p className="text-[16px] font-bold text-[#4a4944] leading-relaxed max-w-2xl">
              Esta região apresenta alta irradiação, baixa nebulosidade e ângulos favoráveis. A instalação de painéis definitivos tem alto retorno potencial no Agreste.
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0 bg-sun-green-50/50 p-6 rounded-2xl border border-sun-green-100/50">
            <span className="text-6xl font-black text-sun-green-600 leading-none tracking-tighter">84</span>
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#6b6a64] mt-3">viabilidade / 100</span>
            <div className="w-40 h-2.5 mt-3 bg-[#eeede8] rounded-full overflow-hidden shadow-inner">
              <div className="bg-sun-green-400 h-full w-[84%]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Grid (RESTAURADA E DESTACADA) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Energia captada hoje", val: "6.4", unit: "kWh / m²", delta: "+12% vs. média local" },
          { label: "Irradiação pico", val: "891", unit: "W/m² às 11h42", delta: "Alta — dia excelente" },
          { label: "Horas de sol pleno", val: "9.1", unit: "h estimadas hoje", delta: "Acima da média nacional" },
          { label: "Eficiência de rastreio", val: "94%", unit: "captação atual", delta: "Rastreio biaxial ativo" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-black/5 p-5 rounded-xl shadow-sm flex flex-col justify-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#6b6a64] mb-1">{kpi.label}</p>
            <h3 className="text-3xl font-black text-sun-text">{kpi.val}</h3>
            {/* Unidades em verde vibrante e badges */}
            <p className="text-[14px] font-extrabold text-sun-green-context mt-1 mb-2">{kpi.unit}</p>
            <p className="text-[11px] font-bold text-sun-green-600 bg-sun-green-50 self-start px-2 py-0.5 rounded-md border border-sun-green-100/50">{kpi.delta}</p>
          </div>
        ))}
      </div>

      {/* ── Main Grid (Bar Chart & Compass) ── */}
      <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-5">
        <Card className="border-black/5 shadow-sm rounded-xl bg-white">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[12px] uppercase font-black text-sun-text tracking-[0.2em]">
                Produção de Energia
              </h3>
              <div className="flex gap-1 border border-black/5 rounded-full p-1 bg-[#eeede8]/50">
                {["Hoje", "Semana", "Mês", "Ano"].map((label, idx) => (
                  <button key={label} className={`text-[11px] px-5 py-2 rounded-full font-black transition-all uppercase tracking-wider ${idx === 0 ? 'bg-sun-green-600 text-white shadow-md' : 'text-[#6b6a64] hover:bg-black/5'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <EnergyChart />
          </CardContent>
        </Card>

        <Card className="border-black/5 shadow-sm rounded-xl bg-white">
          <CardContent className="p-6 md:p-8 flex flex-col items-center">
            <h3 className="text-[12px] uppercase font-black text-sun-text tracking-[0.2em] mb-6 self-start">
              Posição da Placa Solar
            </h3>
            <SolarCompass azimuth={214} polar={38} />
          </CardContent>
        </Card>
      </div>

      {/* ── Fatores (6 Cards) RESTAURADOS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { name: "Irradiação global", val: "Alta", icon: <Sun size={14}/>, color: "text-sun-green-600", bg: "bg-sun-green-50", fill: "w-[90%] bg-sun-green-400" },
          { name: "Nebulosidade", val: "Baixa", icon: <Cloud size={14}/>, color: "text-blue-600", bg: "bg-blue-50", fill: "w-[15%] bg-blue-500" },
          { name: "Sombreamento", val: "Mínimo", icon: <ShieldCheck size={14}/>, color: "text-sun-green-600", bg: "bg-sun-green-50", fill: "w-[8%] bg-sun-green-400" },
          { name: "Temperatura", val: "32°C", icon: <Thermometer size={14}/>, color: "text-sun-amber-600", bg: "bg-sun-amber-50", fill: "w-[72%] bg-sun-amber-400" },
          { name: "Vento", val: "12 km/h", icon: <Wind size={14}/>, color: "text-sun-green-600", bg: "bg-sun-green-50", fill: "w-[30%] bg-sun-green-400" },
          { name: "ROI estimado", val: "4.2 anos", icon: <Activity size={14}/>, color: "text-sun-green-600", bg: "bg-sun-green-50", fill: "w-[85%] bg-sun-green-400" },
        ].map((f, i) => (
          <div key={i} className="bg-white border border-black/5 p-4 rounded-xl shadow-sm">
            <div className={`w-8 h-8 rounded-md flex items-center justify-center mb-3 ${f.bg} ${f.color}`}>
              {f.icon}
            </div>
            <p className="text-[11px] uppercase font-black tracking-widest text-[#6b6a64] mb-1">{f.name}</p>
            <p className={`text-xl font-black mb-2 ${f.color}`}>{f.val}</p>
            <div className="h-1.5 bg-[#eeede8] rounded-full overflow-hidden">
              <div className={`h-full ${f.fill}`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Curva do Dia ── */}
      <Card className="border-black/5 shadow-sm rounded-xl bg-white">
        <CardContent className="p-6 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[12px] uppercase font-black text-sun-text tracking-[0.2em]">
              Irradiação ao longo do dia (W/m²)
            </h3>
            <span className="text-[11px] font-black uppercase tracking-widest text-sun-green-context bg-sun-green-50 px-4 py-1.5 rounded-full border border-sun-green-100">
              Curva de captação — hoje
            </span>
          </div>
          <DayCurveChart />
        </CardContent>
      </Card>

    </main>
  );
}