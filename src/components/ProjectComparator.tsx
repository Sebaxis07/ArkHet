import React, { useState } from 'react';
import type { Project } from '../types/architecture';
import { X, GitBranch, Check } from 'lucide-react';

interface ProjectComparatorProps {
  projects: Project[];
  onClose: () => void;
}

export const ProjectComparator: React.FC<ProjectComparatorProps> = ({ projects, onClose }) => {
  const [projAId, setProjAId] = useState<string>(projects[0]?.id || '');
  const [projBId, setProjBId] = useState<string>(projects[1]?.id || projects[0]?.id || '');

  const projA = projects.find(p => p.id === projAId) || projects[0];
  const projB = projects.find(p => p.id === projBId) || projects[1] || projects[0];

  const stackA = projA?.primaryStack || [];
  const stackB = projB?.primaryStack || [];

  const sharedStack = stackA.filter(s => stackB.includes(s));
  const uniqueA = stackA.filter(s => !stackB.includes(s));
  const uniqueB = stackB.filter(s => !stackA.includes(s));

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-neutral-800 rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl font-sans">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-[#171717]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded bg-white text-black">
              <GitBranch className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-mono font-bold text-white tracking-wide uppercase">COMPARADOR DE ARQUITECTURA DE SISTEMAS</h2>
              <p className="text-xs text-neutral-400 font-mono">Evalúa la superposición de tecnología, complejidad y patrones estructurales</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-6 bg-black border-b border-neutral-800">
          <div>
            <label className="text-xs uppercase font-mono text-white font-bold block mb-2">Sistema A</label>
            <select
              value={projAId}
              onChange={e => setProjAId(e.target.value)}
              className="w-full p-2.5 bg-neutral-900 border border-neutral-700 rounded text-xs font-mono font-bold text-white focus:outline-none focus:border-white"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs uppercase font-mono text-white font-bold block mb-2">Sistema B</label>
            <select
              value={projBId}
              onChange={e => setProjBId(e.target.value)}
              className="w-full p-2.5 bg-neutral-900 border border-neutral-700 rounded text-xs font-mono font-bold text-white focus:outline-none focus:border-white"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="p-5 rounded bg-black border border-neutral-800 space-y-3">
              <h3 className="text-sm font-bold text-white">{projA.name}</h3>
              <p className="text-xs text-neutral-400">{projA.description}</p>
              <div className="flex items-center justify-between text-xs font-mono text-neutral-300 pt-2 border-t border-neutral-800">
                <span>PUNTUACIÓN DE COMPLEJIDAD:</span>
                <span className="font-bold text-white">{projA.complexityScore} / 100</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-neutral-300">
                <span>NODOS / SERVICIOS:</span>
                <span className="font-bold">{projA.nodes.length} nodos</span>
              </div>
            </div>

            <div className="p-5 rounded bg-black border border-neutral-800 space-y-3">
              <h3 className="text-sm font-bold text-white">{projB.name}</h3>
              <p className="text-xs text-neutral-400">{projB.description}</p>
              <div className="flex items-center justify-between text-xs font-mono text-neutral-300 pt-2 border-t border-neutral-800">
                <span>PUNTUACIÓN DE COMPLEJIDAD:</span>
                <span className="font-bold text-white">{projB.complexityScore} / 100</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-neutral-300">
                <span>NODOS / SERVICIOS:</span>
                <span className="font-bold">{projB.nodes.length} nodos</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded bg-black border border-neutral-800 space-y-4">
            <h4 className="text-xs uppercase font-mono tracking-wider text-white font-bold">Matriz de Stack Tecnológico</h4>

            <div className="grid grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded">
                <span className="text-white font-bold block mb-2">Exclusivas de {projA.name}</span>
                <div className="flex flex-wrap gap-1">
                  {uniqueA.length > 0 ? (
                    uniqueA.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded bg-black text-neutral-300 border border-neutral-800">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-neutral-500">Ninguna</span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-white text-black font-bold rounded">
                <span className="text-black font-bold block mb-2 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Stack Compartido ({sharedStack.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {sharedStack.length > 0 ? (
                    sharedStack.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded bg-black text-white">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-neutral-600">Sin tecnologías compartidas</span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded">
                <span className="text-white font-bold block mb-2">Exclusivas de {projB.name}</span>
                <div className="flex flex-wrap gap-1">
                  {uniqueB.length > 0 ? (
                    uniqueB.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded bg-black text-neutral-300 border border-neutral-800">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-neutral-500">Ninguna</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
