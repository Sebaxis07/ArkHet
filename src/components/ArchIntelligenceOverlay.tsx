import React, { useState } from 'react';
import type { ArchitectureRisk } from '../types/architecture';
import { 
  ShieldAlert, 
  ChevronUp, 
  ChevronDown, 
  AlertTriangle, 
  Activity, 
  CheckCircle2,
  X
} from 'lucide-react';

interface ArchIntelligenceOverlayProps {
  risks: ArchitectureRisk[];
  complexityScore: number;
  onSelectRiskTarget?: (targetNodeId: string) => void;
}

export const ArchIntelligenceOverlay: React.FC<ArchIntelligenceOverlayProps> = ({
  risks,
  complexityScore,
  onSelectRiskTarget
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityBadge = (severity: ArchitectureRisk['severity']) => {
    switch (severity) {
      case 'high':
        return <span className="px-2 py-0.5 rounded bg-white text-black font-bold uppercase text-[9px] font-mono">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 border border-neutral-700 font-bold uppercase text-[9px] font-mono">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-black text-neutral-400 border border-neutral-800 font-bold uppercase text-[9px] font-mono">LOW</span>;
    }
  };

  return (
    <div className="absolute bottom-3 left-3 right-3 sm:left-6 sm:right-6 z-20 font-mono select-none">
      {/* Floating Bottom Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-[#121212] border border-neutral-800 rounded-lg p-2.5 sm:p-3 shadow-2xl flex items-center justify-between gap-2 cursor-pointer hover:border-neutral-600 transition-all"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="p-1.5 bg-black border border-neutral-800 rounded shrink-0">
            <Activity className="w-4 h-4 text-white animate-pulse" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 overflow-hidden">
            <span className="font-bold text-white text-xs tracking-wider uppercase truncate">
              INTELIGENCIA DE ARQUITECTURA
            </span>

            <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-bold">
              <span className="flex items-center gap-1 text-white bg-black px-2 py-0.5 rounded border border-neutral-800 shrink-0">
                <AlertTriangle className="w-3 h-3 text-white" />
                {risks.length} {risks.length === 1 ? 'RIESGO' : 'RIESGOS'}
              </span>

              <span className="hidden md:inline">•</span>

              <span className="hidden sm:inline text-neutral-300">
                PUNTAJE COBERTURA: <strong className="text-white">{100 - risks.length * 5}%</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded bg-black border border-neutral-800 text-[10px] font-bold text-neutral-300">
            <span>COMPLEJIDAD:</span>
            <span className="text-white">{complexityScore} / 100</span>
          </div>

          <button className="p-1 text-neutral-400 hover:text-white rounded border border-neutral-800">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Risk & Diagnosis Drawer */}
      {isExpanded && (
        <div className="mt-2 bg-[#141414] border border-neutral-800 rounded-lg p-4 sm:p-5 shadow-2xl space-y-3 max-h-72 overflow-y-auto animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="text-xs uppercase font-mono font-bold text-white tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-white" />
              DIAGNÓSTICO AUTOMÁTICO DE SALUD TÉCNICA Y DEUDA ARQUITECTÓNICA
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
              className="text-neutral-500 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {risks.length > 0 ? (
              risks.map(risk => (
                <div
                  key={risk.id}
                  onClick={() => risk.targetNodeId && onSelectRiskTarget && onSelectRiskTarget(risk.targetNodeId)}
                  className="p-3 bg-black rounded border border-neutral-800 hover:border-white transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{risk.title}</span>
                      {getSeverityBadge(risk.severity)}
                    </div>
                    <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                      {risk.description}
                    </p>
                  </div>

                  {risk.targetNodeId && (
                    <button className="px-3 py-1 bg-neutral-900 text-neutral-200 border border-neutral-800 rounded text-[10px] font-bold self-start sm:self-auto shrink-0 hover:bg-neutral-800">
                      INSPECCIONAR NODO
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-neutral-400 font-mono flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white" />
                No se han detectado riesgos de seguridad ni cuellos de botella en la arquitectura.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
