import React, { useState } from 'react';
import type { Project } from '../types/architecture';
import { 
  ArrowLeft, 
  GitCompare, 
  Plus, 
  Minus, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Minus as EqualIcon
} from 'lucide-react';

interface CompareViewProps {
  projects: Project[];
  activeProject: Project;
  onBackToRadar: () => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  projects,
  activeProject,
  onBackToRadar
}) => {
  const [projectAId, setProjectAId] = useState<string>(activeProject.id);
  const [projectBId, setProjectBId] = useState<string>(
    projects.find(p => p.id !== activeProject.id)?.id || activeProject.id
  );
  const [activeTab, setActiveTab] = useState<'visual' | 'stack' | 'endpoints' | 'report'>('visual');

  const projectA = projects.find(p => p.id === projectAId) || activeProject;
  const projectB = projects.find(p => p.id === projectBId) || activeProject;

  // Calculate Node Diff Categories
  const nodesA = projectA.nodes || [];
  const nodesB = projectB.nodes || [];

  const addedNodesInB = nodesB.filter(nb => !nodesA.some(na => na.label.toLowerCase() === nb.label.toLowerCase() || na.id === nb.id));
  const removedNodesFromA = nodesA.filter(na => !nodesB.some(nb => nb.label.toLowerCase() === na.label.toLowerCase() || na.id === nb.id));
  
  const modifiedNodes = nodesB.filter(nb => {
    const matchingA = nodesA.find(na => na.label.toLowerCase() === nb.label.toLowerCase() || na.id === nb.id);
    if (!matchingA) return false;
    return (
      matchingA.port !== nb.port ||
      matchingA.category !== nb.category ||
      (matchingA.techStack?.length || 0) !== (nb.techStack?.length || 0) ||
      (matchingA.endpoints?.length || 0) !== (nb.endpoints?.length || 0)
    );
  });

  const identicalNodes = nodesB.filter(nb => {
    const matchingA = nodesA.find(na => na.label.toLowerCase() === nb.label.toLowerCase() || na.id === nb.id);
    if (!matchingA) return false;
    return !modifiedNodes.includes(nb);
  });

  // Calculate Stack Deltas
  const stackA = projectA.primaryStack || [];
  const stackB = projectB.primaryStack || [];

  const addedStack = stackB.filter(s => !stackA.includes(s));
  const removedStack = stackA.filter(s => !stackB.includes(s));
  const commonStack = stackA.filter(s => stackB.includes(s));

  // Metrics Delta
  const complexityDelta = projectB.complexityScore - projectA.complexityScore;
  const nodeCountDelta = nodesB.length - nodesA.length;
  
  const endpointsA = nodesA.reduce((acc, n) => acc + (n.endpoints?.length || 0), 0);
  const endpointsB = nodesB.reduce((acc, n) => acc + (n.endpoints?.length || 0), 0);
  const endpointDelta = endpointsB - endpointsA;

  // Generate Executive Markdown Diff Report
  const generateMarkdownReport = () => {
    return `# Reporte de Auditoría y Comparación de Arquitectura

**Proyecto Base (A)**: ${projectA.name}
**Proyecto Comparado (B)**: ${projectB.name}
**Fecha de Auditoría**: ${new Date().toLocaleDateString()}

---

## 📊 Métricas Generales y Delta
- **Diferencia de Complejidad**: ${projectA.complexityScore} ➔ ${projectB.complexityScore} (${complexityDelta >= 0 ? '+' : ''}${complexityDelta} pts)
- **Recuento de Nodos**: ${nodesA.length} ➔ ${nodesB.length} (${nodeCountDelta >= 0 ? '+' : ''}${nodeCountDelta})
- **Total de Endpoints API**: ${endpointsA} ➔ ${endpointsB} (${endpointDelta >= 0 ? '+' : ''}${endpointDelta})

---

## 🟩 Nodos y Microservicios Añadidos en B (${addedNodesInB.length})
${addedNodesInB.length > 0 ? addedNodesInB.map(n => `- **${n.label}** (${n.category.toUpperCase()}) - ${n.description}`).join('\n') : '*Sin nodos añadidos.*'}

## 🟥 Nodos y Microservicios Eliminados (${removedNodesFromA.length})
${removedNodesFromA.length > 0 ? removedNodesFromA.map(n => `- **${n.label}** (${n.category.toUpperCase()})`).join('\n') : '*Sin nodos eliminados.*'}

## 🟨 Nodos Modificados (${modifiedNodes.length})
${modifiedNodes.length > 0 ? modifiedNodes.map(n => `- **${n.label}**: Cambios detectados en configuración o puertos.`).join('\n') : '*Sin nodos modificados.*'}

---

## 🛠️ Divergencias en el Stack Tecnológico
- **Tecnologías Incorporadas**: ${addedStack.length > 0 ? addedStack.join(', ') : 'Ninguna'}
- **Tecnologías Removidas**: ${removedStack.length > 0 ? removedStack.join(', ') : 'Ninguna'}
- **Tecnologías Conservadas**: ${commonStack.length > 0 ? commonStack.join(', ') : 'Ninguna'}
`;
  };

  const handleDownloadReport = () => {
    const reportText = generateMarkdownReport();
    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparacion-${projectA.name}-vs-${projectB.name}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 h-full bg-[#0A0A0A] flex flex-col font-sans text-neutral-200 overflow-hidden select-none">
      {/* Header Bar */}
      <div className="p-4 bg-[#121212] border-b border-neutral-800 flex items-center justify-between z-10 font-mono">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToRadar}
            className="p-1.5 bg-black hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-white" /> MOTOR DE COMPARACIÓN ARQUITECTÓNICA
            </h1>
            <span className="text-[10px] text-neutral-400 font-sans block">
              Divergencias en tiempo real entre proyectos y snapshots
            </span>
          </div>
        </div>

        {/* Project Selectors A vs B */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black px-3 py-1.5 rounded border border-neutral-800 text-xs">
            <span className="text-neutral-500 font-bold">PROYECTO A (BASE):</span>
            <select
              value={projectAId}
              onChange={e => setProjectAId(e.target.value)}
              className="bg-[#171717] text-white font-bold px-2 py-0.5 rounded border border-neutral-700 text-xs focus:outline-none"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <span className="text-neutral-500 font-bold text-xs">VS</span>

          <div className="flex items-center gap-2 bg-black px-3 py-1.5 rounded border border-neutral-800 text-xs">
            <span className="text-neutral-500 font-bold">PROYECTO B (COMPARADO):</span>
            <select
              value={projectBId}
              onChange={e => setProjectBId(e.target.value)}
              className="bg-[#171717] text-white font-bold px-2 py-0.5 rounded border border-neutral-700 text-xs focus:outline-none"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadReport}
            className="px-3 py-1.5 bg-white text-black font-bold rounded text-xs hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-black" /> EXPORTAR REPORTE
          </button>
        </div>
      </div>

      {/* Top Delta Executive Metrics Dashboard */}
      <div className="p-4 bg-[#141414] border-b border-neutral-800 grid grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-3 bg-black rounded border border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-500 uppercase font-bold block">COMPLEJIDAD DELTA</span>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white">{projectA.complexityScore} ➔ {projectB.complexityScore}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
              complexityDelta > 0 ? 'bg-neutral-800 text-white border border-neutral-700' :
              complexityDelta < 0 ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-400'
            }`}>
              {complexityDelta > 0 ? <TrendingUp className="w-3 h-3" /> : complexityDelta < 0 ? <TrendingDown className="w-3 h-3" /> : <EqualIcon className="w-3 h-3" />}
              {complexityDelta >= 0 ? `+${complexityDelta}` : complexityDelta} pts
            </span>
          </div>
        </div>

        <div className="p-3 bg-black rounded border border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-500 uppercase font-bold block">RECUENTO DE NODOS</span>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white">{nodesA.length} ➔ {nodesB.length}</span>
            <span className="px-2 py-0.5 rounded bg-white text-black font-bold text-[10px]">
              {nodeCountDelta >= 0 ? `+${nodeCountDelta}` : nodeCountDelta} Nodos
            </span>
          </div>
        </div>

        <div className="p-3 bg-black rounded border border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-500 uppercase font-bold block">ENDPOINTS API</span>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white">{endpointsA} ➔ {endpointsB}</span>
            <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-200 border border-neutral-800 font-bold text-[10px]">
              {endpointDelta >= 0 ? `+${endpointDelta}` : endpointDelta} Endpoints
            </span>
          </div>
        </div>

        <div className="p-3 bg-black rounded border border-neutral-800 space-y-1">
          <span className="text-[10px] text-neutral-500 uppercase font-bold block">DIVERGENCIAS DETECTADAS</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-neutral-800 text-white font-bold rounded text-[10px]">
              +{addedNodesInB.length} Añadidos
            </span>
            <span className="px-2 py-0.5 bg-neutral-900 text-neutral-400 font-bold rounded border border-neutral-800 text-[10px]">
              -{removedNodesFromA.length} Removidos
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Toolbar */}
      <div className="flex border-b border-neutral-800 bg-black font-mono text-xs">
        {[
          { id: 'visual', label: '🎨 VISUAL COLOR DIFF' },
          { id: 'stack', label: '📊 MATRIZ DE TECH STACK' },
          { id: 'endpoints', label: 'OPTIMIZADOR / ENDPOINTS' },
          { id: 'report', label: '📑 REPORTE DE AUDITORÍA' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
              activeTab === t.id ? 'border-white text-white bg-[#141414]' : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Comparison Body Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* TAB 1: VISUAL COLOR DIFF CANVAS */}
        {activeTab === 'visual' && (
          <div className="space-y-6">
            {/* Color Legend Bar */}
            <div className="p-3 bg-black border border-neutral-800 rounded-lg flex items-center justify-between font-mono text-xs">
              <span className="text-neutral-400 font-bold uppercase text-[10px]">LEYENDA DE AUDITORÍA ARQUITECTÓNICA:</span>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <span className="w-3 h-3 rounded-full bg-white border border-neutral-700" /> 🟩 AÑADIDO EN B ({addedNodesInB.length})
                </span>
                <span className="flex items-center gap-1.5 font-bold text-neutral-400">
                  <span className="w-3 h-3 rounded-full bg-neutral-800 border border-neutral-700" /> 🟥 ELIMINADO EN B ({removedNodesFromA.length})
                </span>
                <span className="flex items-center gap-1.5 font-bold text-neutral-300">
                  <span className="w-3 h-3 rounded-full bg-neutral-900 border border-neutral-700" /> 🟨 MODIFICADO ({modifiedNodes.length})
                </span>
                <span className="flex items-center gap-1.5 font-bold text-neutral-500">
                  <span className="w-3 h-3 rounded-full bg-black border border-neutral-800" /> ⚪ IDÉNTICO ({identicalNodes.length})
                </span>
              </div>
            </div>

            {/* Split Comparison Columns A vs B */}
            <div className="grid grid-cols-2 gap-6">
              {/* Column A */}
              <div className="space-y-3">
                <div className="p-3 bg-[#141414] border border-neutral-800 rounded flex items-center justify-between font-mono">
                  <span className="font-bold text-white text-xs">PROYECTO BASE (A): {projectA.name}</span>
                  <span className="text-[10px] text-neutral-400">{nodesA.length} Nodos</span>
                </div>

                <div className="space-y-2">
                  {nodesA.map(nodeA => {
                    const isRemoved = removedNodesFromA.some(r => r.id === nodeA.id || r.label === nodeA.label);
                    const isMod = modifiedNodes.some(m => m.id === nodeA.id || m.label === nodeA.label);

                    return (
                      <div
                        key={nodeA.id}
                        className={`p-4 rounded-lg border font-mono space-y-2 transition-all ${
                          isRemoved ? 'bg-black border-neutral-700 text-neutral-400' :
                          isMod ? 'bg-[#141414] border-neutral-700 text-white' :
                          'bg-black border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs flex items-center gap-2">
                            {isRemoved && <Minus className="w-4 h-4 text-neutral-400 shrink-0" />}
                            {nodeA.label}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-black border border-neutral-800 font-bold uppercase">
                            {nodeA.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-sans line-clamp-1">{nodeA.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column B */}
              <div className="space-y-3">
                <div className="p-3 bg-[#141414] border border-neutral-800 rounded flex items-center justify-between font-mono">
                  <span className="font-bold text-white text-xs">PROYECTO COMPARADO (B): {projectB.name}</span>
                  <span className="text-[10px] text-white font-bold">{nodesB.length} Nodos</span>
                </div>

                <div className="space-y-2">
                  {nodesB.map(nodeB => {
                    const isAdded = addedNodesInB.some(a => a.id === nodeB.id || a.label === nodeB.label);
                    const isMod = modifiedNodes.some(m => m.id === nodeB.id || m.label === nodeB.label);

                    return (
                      <div
                        key={nodeB.id}
                        className={`p-4 rounded-lg border font-mono space-y-2 transition-all ${
                          isAdded ? 'bg-black border-white text-white shadow-2xl' :
                          isMod ? 'bg-[#141414] border-neutral-700 text-white' :
                          'bg-black border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs flex items-center gap-2">
                            {isAdded && <Plus className="w-4 h-4 text-white shrink-0" />}
                            {nodeB.label}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            isAdded ? 'bg-white text-black' : 'bg-black border border-neutral-800 text-neutral-300'
                          }`}>
                            {isAdded ? '🟩 NUEVO' : nodeB.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 font-sans line-clamp-1">{nodeB.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TECH STACK DELTA MATRIX */}
        {activeTab === 'stack' && (
          <div className="space-y-4 font-mono">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">
              MATRIZ COMPARATIVA DE LIBRERÍAS Y TECNOLOGÍAS
            </span>

            <div className="p-4 bg-black border border-neutral-800 rounded-lg space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-[#141414] rounded border border-neutral-800 space-y-2">
                  <span className="text-[10px] font-bold text-white uppercase block">🟩 TECNOLOGÍAS INCORPORADAS EN B ({addedStack.length})</span>
                  <div className="flex flex-wrap gap-1">
                    {addedStack.length > 0 ? addedStack.map(s => (
                      <span key={s} className="px-2 py-1 rounded bg-white text-black font-bold text-[10px]">{s}</span>
                    )) : <span className="text-neutral-500">Ninguna</span>}
                  </div>
                </div>

                <div className="p-3 bg-[#141414] rounded border border-neutral-800 space-y-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase block">🟥 TECNOLOGÍAS REMOVIDAS EN B ({removedStack.length})</span>
                  <div className="flex flex-wrap gap-1">
                    {removedStack.length > 0 ? removedStack.map(s => (
                      <span key={s} className="px-2 py-1 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 text-[10px] font-bold">{s}</span>
                    )) : <span className="text-neutral-500">Ninguna</span>}
                  </div>
                </div>

                <div className="p-3 bg-[#141414] rounded border border-neutral-800 space-y-2">
                  <span className="text-[10px] font-bold text-neutral-300 uppercase block">⚪ TECNOLOGÍAS COMPARTIDAS ({commonStack.length})</span>
                  <div className="flex flex-wrap gap-1">
                    {commonStack.length > 0 ? commonStack.map(s => (
                      <span key={s} className="px-2 py-1 rounded bg-black text-white border border-neutral-800 text-[10px] font-bold">{s}</span>
                    )) : <span className="text-neutral-500">Ninguna</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ENDPOINTS & ROUTES COMPARISON */}
        {activeTab === 'endpoints' && (
          <div className="space-y-4 font-mono">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">
              COMPARADOR DE ENDPOINTS Y RUTAS API
            </span>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-black border border-neutral-800 rounded-lg space-y-2">
                <span className="font-bold text-white text-xs block mb-2">ENDPOINTS EN PROYECTO A ({endpointsA})</span>
                {nodesA.flatMap(n => n.endpoints || []).map(ep => (
                  <div key={ep.id} className="p-2 bg-[#141414] rounded border border-neutral-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{ep.path}</span>
                    <span className="px-2 py-0.5 bg-black border border-neutral-700 text-white font-bold text-[9px]">{ep.method}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-black border border-neutral-800 rounded-lg space-y-2">
                <span className="font-bold text-white text-xs block mb-2">ENDPOINTS EN PROYECTO B ({endpointsB})</span>
                {nodesB.flatMap(n => n.endpoints || []).map(ep => (
                  <div key={ep.id} className="p-2 bg-[#141414] rounded border border-neutral-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{ep.path}</span>
                    <span className="px-2 py-0.5 bg-white text-black font-bold text-[9px]">{ep.method}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EXECUTIVE MARKDOWN AUDIT REPORT */}
        {activeTab === 'report' && (
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                REPORTE TÉCNICO DE AUDITORÍA Y DIVERGENCIAS
              </span>
              <button
                onClick={handleDownloadReport}
                className="px-3 py-1.5 bg-white text-black font-bold text-xs rounded flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-black" /> DESCARGAR ARCHIVO MARKDOWN
              </button>
            </div>

            <pre className="p-5 bg-black border border-neutral-800 rounded-lg text-xs text-neutral-300 font-mono overflow-x-auto leading-relaxed">
              {generateMarkdownReport()}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
