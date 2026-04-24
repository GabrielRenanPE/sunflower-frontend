"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Clock, TrendingUp, Sun, PiggyBank, Zap, BarChart3 } from "lucide-react";

export default function SimuladorDashboard() {
  // Estados interativos baseados em CAPTAÇÃO REAL
  const [geracaoMensalkWh, setGeracaoMensalkWh] = useState<number>(400); // kWh gerados por mês
  const [tarifaEnergia, setTarifaEnergia] = useState<number>(0.95); // Preço do kWh em R$
  const [custoSistema, setCustoSistema] = useState<number>(18000);
  const [inflacaoEnergia, setInflacaoEnergia] = useState<number>(8); // % ao ano

  // Cálculos da simulação: Economia baseada no que foi gerado x valor da tarifa
  const economiaMensal = geracaoMensalkWh * tarifaEnergia; 
  const economiaAnual = economiaMensal * 12;
  
  // Payback (em anos e meses)
  const paybackMeses = custoSistema / economiaMensal;
  const paybackAnos = Math.floor(paybackMeses / 12);
  const paybackMesesRestantes = Math.ceil(paybackMeses % 12);

  // Projeção de ROI em 20 anos (vida útil média das placas), considerando inflação na conta de luz
  const { lucroLiquido20Anos, dadosGrafico } = useMemo(() => {
    let acumulado = 0;
    let valorContaComInflacao = economiaAnual;
    const dados = [];
    
    for (let i = 1; i <= 20; i++) {
      acumulado += valorContaComInflacao;
      dados.push({
        ano: i,
        lucroLiquido: acumulado - custoSistema,
      });
      valorContaComInflacao += valorContaComInflacao * (inflacaoEnergia / 100);
    }
    
    return {
      lucroLiquido20Anos: acumulado - custoSistema,
      dadosGrafico: dados
    };
  }, [economiaAnual, custoSistema, inflacaoEnergia]);

  // Encontrar o valor máximo para escalar as barras do gráfico
  const maxLucro = Math.max(...dadosGrafico.map(d => d.lucroLiquido));

  return (
    <main className="w-full p-4 md:p-6 lg:p-8 space-y-5 bg-[#eeede8] min-h-screen text-sun-text font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Cabeçalho */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-black/10 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-sun-green-600 rounded-full flex items-center justify-center text-sun-amber-400 shrink-0 shadow-md border border-black/5">
              <Calculator size={36} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none mb-1.5 text-sun-text">Simulador de Economia</h1>
              <p className="text-[10px] font-bold text-[#6b6a64] uppercase tracking-[0.3em] opacity-80">
                Projete seu retorno sobre investimento (ROI)
              </p>
            </div>
          </div>
          <a href="/" className="text-[11px] font-black uppercase tracking-[0.15em] text-sun-green-600 hover:text-sun-green-700 transition-colors">
            ← Voltar ao Dashboard
          </a>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Painel de Controles (Inputs) - Efeito Glassmorphism */}
          <Card className="col-span-1 border-white/40 bg-white/60 backdrop-blur-xl shadow-xl shadow-slate-200/50 rounded-2xl transition-all duration-300 hover:shadow-2xl">
            <CardHeader className="bg-white/40 border-b border-white/50 rounded-t-2xl pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Sun className="text-orange-500" size={22} />
                Parâmetros do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              
              <div className="space-y-3 relative group">
                <label className="text-sm font-bold text-slate-700 flex justify-between items-end">
                  <span className="text-slate-500">Captação Mensal</span>
                  <span className="text-xl text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{geracaoMensalkWh} <span className="text-sm">kWh</span></span>
                </label>
                <input 
                  type="range" 
                  min="100" 
                  max="3000" 
                  step="50"
                  value={geracaoMensalkWh} 
                  onChange={(e) => setGeracaoMensalkWh(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500 transition-all hover:h-3"
                />
              </div>

              <div className="space-y-3 relative group">
                <label className="text-sm font-bold text-slate-700 flex justify-between items-end">
                  <span className="text-slate-500">Tarifa de Energia</span>
                  <span className="text-xl text-yellow-600 bg-yellow-50 px-3 py-1 rounded-lg border border-yellow-100">R$ {tarifaEnergia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </label>
                <input 
                  type="range" 
                  min="0.40" 
                  max="2.00" 
                  step="0.01"
                  value={tarifaEnergia} 
                  onChange={(e) => setTarifaEnergia(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-yellow-500 transition-all hover:h-3"
                />
              </div>

              <div className="space-y-3 relative group">
                <label className="text-sm font-bold text-slate-700 flex justify-between items-end">
                  <span className="text-slate-500">Custo do Sistema</span>
                  <span className="text-xl text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">R$ {custoSistema.toLocaleString('pt-BR')}</span>
                </label>
                <input 
                  type="range" 
                  min="5000" 
                  max="100000" 
                  step="1000"
                  value={custoSistema} 
                  onChange={(e) => setCustoSistema(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500 transition-all hover:h-3"
                />
              </div>

              <div className="space-y-3 relative group">
                <label className="text-sm font-bold text-slate-700 flex justify-between items-end">
                  <span className="text-slate-500">Inflação Anual</span>
                  <span className="text-xl text-orange-500 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">{inflacaoEnergia}%</span>
                </label>
                <input 
                  type="range" 
                  min="2" 
                  max="15" 
                  step="1"
                  value={inflacaoEnergia} 
                  onChange={(e) => setInflacaoEnergia(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500 transition-all hover:h-3"
                />
              </div>

            </CardContent>
          </Card>

          {/* Painel de Resultados */}
          <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card Economia Anual */}
            <Card className="border-white/60 bg-linear-to-br from-emerald-50/90 to-teal-100/50 backdrop-blur-md shadow-lg shadow-emerald-900/5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10">
              <CardContent className="p-8 flex flex-col justify-center h-full relative overflow-hidden">
                <div className="absolute -right-6 -top-6 text-emerald-500/10 rotate-12 pointer-events-none">
                  <PiggyBank size={140} strokeWidth={1} />
                </div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-3 bg-white/80 text-emerald-600 rounded-xl shadow-sm">
                    <PiggyBank size={24} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-emerald-900">Economia no 1º Ano</h3>
                </div>
                <p className="text-4xl xl:text-5xl font-black bg-clip-text text-transparent bg-linear-to-r from-emerald-700 to-teal-500 relative z-10">
                  R$ {economiaAnual.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 w-fit relative z-10">
                  <Zap size={14} className="fill-emerald-500" />
                  Baseado em {geracaoMensalkWh} kWh/mês
                </div>
              </CardContent>
            </Card>

            {/* Card Tempo de Payback */}
            <Card className="border-white/60 bg-linear-to-br from-blue-50/90 to-indigo-100/50 backdrop-blur-md shadow-lg shadow-blue-900/5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10">
              <CardContent className="p-8 flex flex-col justify-center h-full relative overflow-hidden">
                <div className="absolute -right-6 -top-6 text-blue-500/10 -rotate-12 pointer-events-none">
                  <Clock size={140} strokeWidth={1} />
                </div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-3 bg-white/80 text-blue-600 rounded-xl shadow-sm">
                    <Clock size={24} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-blue-900">Tempo de Payback</h3>
                </div>
                <p className="text-4xl xl:text-5xl font-black bg-clip-text text-transparent bg-linear-to-r from-blue-700 to-indigo-500 relative z-10">
                  {paybackAnos}<span className="text-2xl"> {paybackAnos === 1 ? 'ano' : 'anos'}</span> {paybackMesesRestantes > 0 && <span className="text-2xl">e {paybackMesesRestantes} {paybackMesesRestantes === 1 ? 'mês' : 'meses'}</span>}
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 w-fit relative z-10">
                  Tempo para o sistema se pagar
                </div>
              </CardContent>
            </Card>

            {/* Card ROI 20 anos (Ocupa 2 colunas com Gráfico Interativo) */}
            <Card className="col-span-1 md:col-span-2 border-white/60 bg-white/70 backdrop-blur-xl shadow-xl shadow-indigo-900/5 rounded-2xl transition-all duration-300 hover:shadow-2xl">
              <CardContent className="p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
                
                {/* Texto da Esquerda (Mais largo e com whitespace-nowrap) */}
                <div className="w-full lg:w-[45%] xl:w-[40%]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
                      <TrendingUp size={24} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-indigo-900">Lucro (20 Anos)</h3>
                  </div>
                  {/* Removido o break-words, adicionado whitespace-nowrap e fonte ajustada */}
                  <p className="text-4xl lg:text-[2.5rem] font-black tracking-tighter whitespace-nowrap bg-clip-text text-transparent bg-linear-to-r from-indigo-700 to-purple-600">
                    R$ {lucroLiquido20Anos.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-sm font-medium text-slate-500 mt-4 leading-relaxed pr-4">
                    Economia total acumulada ao longo da vida útil do sistema, já subtraindo o custo inicial do equipamento.
                  </p>
                </div>
                
                {/* Gráfico de Barras Dinâmico */}
                <div className="w-full lg:w-[50%] xl:w-[55%] h-48 bg-slate-50/50 rounded-xl border border-slate-100 p-4 flex flex-col justify-end relative">
                  <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 flex items-center gap-1">
                    <BarChart3 size={14} /> Projeção de Acúmulo
                  </div>
                  
                  {/* Linha Zero (Custo pago) */}
                  <div className="absolute left-0 right-0 border-t border-dashed border-slate-300 z-0" style={{ bottom: `${Math.max(0, (Math.abs(Math.min(...dadosGrafico.map(d => d.lucroLiquido))) / maxLucro) * 100)}%` }}></div>

                  <div className="flex items-end justify-between gap-1 w-full h-32 relative z-10 mt-6">
                    {dadosGrafico.map((d, i) => {
                      const heightPct = Math.max(0, (d.lucroLiquido / maxLucro) * 100);
                      const isLucro = d.lucroLiquido >= 0;
                      
                      return (
                        <div key={i} className="relative flex-1 flex flex-col justify-end h-full group">
                          <div 
                            className={`w-full rounded-t-sm transition-all duration-500 ease-out cursor-pointer hover:opacity-100 opacity-80 ${isLucro ? 'bg-linear-to-t from-indigo-600 to-indigo-400 hover:from-purple-600 hover:to-indigo-500' : 'bg-linear-to-t from-orange-400 to-red-400'}`}
                            style={{ height: `${heightPct}%`, minHeight: isLucro ? '4px' : '0px' }}
                          />
                          
                          {/* Eixo X */}
                          {i % 2 === 0 && (
                            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-400">
                              {d.ano}
                            </span>
                          )}

                          {/* Tooltip Hover */}
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-20">
                            Ano {d.ano}: R$ {Math.round(d.lucroLiquido).toLocaleString('pt-BR')}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </CardContent>
            </Card>

          </div> 
        </div> 
      </div> 
    </main>
  );
}