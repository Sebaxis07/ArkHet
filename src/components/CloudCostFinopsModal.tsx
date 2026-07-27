import React, { useState } from 'react';
import type { Project } from '../types/architecture';
import { calculateProjectFinOps } from '../services/finopsService';
import { 
  X, 
  DollarSign, 
  Sparkles, 
  Sliders
} from 'lucide-react';

interface CloudCostFinopsModalProps {
  project: Project;
  onClose: () => void;
}

export const CloudCostFinopsModal: React.FC<CloudCostFinopsModalProps> = ({
  project,
  onClose
}) => {
  const [trafficScale, setTrafficScale] = useState<number>(1);
  const finopsData = calculateProjectFinOps(project, trafficScale);

  const estimatedRequests = Math.round(10000 * Math.pow(trafficScale, 2.2));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded border border-neutral-800">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                CALCULADORA DE COSTOS CLOUD & ESTIMADOR FINOPS
              </h2>
              <span className="text-[10px] text-neutral-400 font-sans block">
                Estimación de facturación mensual y optimización de recursos para <span className="text-white font-bold">{project.name}</span>
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Summary Cost Banner */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-black rounded-lg border border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-500 font-bold uppercase block">FACTURA CLOUD ESTIMADA</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">${finopsData.totalMonthlyCost}</span>
              <span className="text-xs text-neutral-400 font-bold">/ mes</span>
            </div>
          </div>

          <div className="p-4 bg-black rounded-lg border border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-500 font-bold uppercase block">PROYECCIÓN ALTO TRÁFICO</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">${finopsData.projectedCostHighTraffic}</span>
              <span className="text-xs text-neutral-400 font-bold">/ mes</span>
            </div>
          </div>

          <div className="p-4 bg-black rounded-lg border border-neutral-800 space-y-1">
            <span className="text-[10px] text-neutral-500 font-bold uppercase block">OPORTUNIDAD DE AHORRO</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">-$71.50</span>
              <span className="text-xs text-neutral-400 font-bold">/ mes</span>
            </div>
          </div>
        </div>

        {/* Interactive Traffic Scale Slider */}
        <div className="p-4 bg-black border border-neutral-800 rounded-lg space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-300 font-bold uppercase text-[10px] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-white" /> REGULADOR DE TRÁFICO MENSUAL
            </span>
            <span className="px-2 py-0.5 rounded bg-white text-black font-bold text-[10px]">
              ~{estimatedRequests.toLocaleString()} Peticiones/mes
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={trafficScale}
            onChange={e => setTrafficScale(parseFloat(e.target.value))}
            className="w-full accent-white cursor-pointer"
          />
        </div>

        {/* Per Node Cost Breakdown Table */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <span className="text-[10px] uppercase font-bold text-neutral-500 block">DESGLOSE DE COSTO POR SERVICIO NATIVO</span>

          <div className="space-y-2">
            {finopsData.nodeCosts.map(nc => (
              <div 
                key={nc.nodeId}
                className="p-3 bg-black border border-neutral-800 rounded-lg flex items-center justify-between text-xs hover:border-neutral-700 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{nc.nodeLabel}</span>
                    <span className="text-[9px] px-2 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 uppercase font-bold">
                      {nc.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block">{nc.costBreakdown} ({nc.provider})</span>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-white font-mono">${nc.estimatedMonthlyCost}</span>
                  <span className="text-[9px] text-neutral-500 block">/ mes</span>
                </div>
              </div>
            ))}
          </div>

          {/* FinOps Recommendations */}
          <div className="pt-3 border-t border-neutral-800 space-y-3">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-white" /> RECOMENDACIONES FINOPS DE OPTIMIZACIÓN
            </span>

            <div className="grid grid-cols-3 gap-3">
              {finopsData.savingsRecommendations.map((rec, idx) => (
                <div key={idx} className="p-3 bg-black border border-neutral-800 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[11px] leading-tight line-clamp-1">{rec.title}</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-white text-black font-bold rounded shrink-0 ml-1">
                      -${rec.potentialSavingsMonthly}/mo
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-sans leading-snug line-clamp-2">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
