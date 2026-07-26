import React from 'react';
import { 
  Sparkles, 
  Minus,
  Database
} from 'lucide-react';

interface ImportProgressModalProps {
  repoName: string;
  percent: number;
  stepText: string;
  onMinimize: () => void;
}

export const ImportProgressModal: React.FC<ImportProgressModalProps> = ({
  repoName,
  percent,
  stepText,
  onMinimize
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 relative">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-white animate-spin" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                ESCANEO Y DESCARGA EN PROGRESO
              </h2>
              <span className="text-[10px] text-neutral-400 font-sans block">
                {repoName}
              </span>
            </div>
          </div>

          <button
            onClick={onMinimize}
            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 text-xs font-bold flex items-center gap-1"
            title="Continuar trabajando mientras se descarga en segundo plano"
          >
            <Minus className="w-3.5 h-3.5" /> SEGUNDO PLANO
          </button>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-neutral-400">PROGRESO DEL ESCANEO</span>
            <span className="text-white font-mono text-sm">{percent}%</span>
          </div>

          <div className="w-full h-3 bg-black rounded-full overflow-hidden p-0.5 border border-neutral-800">
            <div
              className="h-full bg-white rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(255,255,255,0.4)]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Live Step Log */}
        <div className="p-3 bg-black rounded border border-neutral-800 space-y-1.5 font-mono text-xs">
          <div className="flex items-center justify-between text-neutral-500 text-[10px]">
            <span>LOG EN TIEMPO REAL:</span>
            <span className="text-white flex items-center gap-1"><Database className="w-3 h-3" /> PARSER ACTIVO</span>
          </div>
          <p className="text-neutral-300 truncate font-mono font-bold">
            {stepText}
          </p>
        </div>

        {/* Informative Footer */}
        <p className="text-[11px] text-neutral-400 font-sans leading-relaxed text-center pt-1 border-t border-neutral-800/80">
          Puedes minimizar esta ventana y seguir usando Arkhet. Te avisaremos cuando el mapa de arquitectura esté listo.
        </p>
      </div>
    </div>
  );
};
