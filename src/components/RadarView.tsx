import React, { useState, useRef, useEffect } from 'react';
import type { Project } from '../types/architecture';
import { scanNativeDirectoryHandle } from '../services/scanner';
import { 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink,
  Plus,
  GitBranch,
  HardDrive,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Sparkles,
  Cpu,
  Boxes,
  Gamepad2,
  Wrench,
  Building2,
  UserCheck
} from 'lucide-react';

interface RadarViewProps {
  projects: Project[];
  activeImportTask?: {
    repoName: string;
    percent: number;
    stepText: string;
  } | null;
  onSelectProject: (project: Project) => void;
  onOpenScanner: () => void;
  onOpenComparator: () => void;
  onImportProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
}

export const RadarView: React.FC<RadarViewProps> = ({
  projects,
  activeImportTask,
  onSelectProject,
  onOpenScanner,
  onOpenComparator,
  onDeleteProject
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'mindmap' | 'grid'>('mindmap');
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (isMobile) setZoom(0.55);
  }, [isMobile]);

  const categories = ['TODOS', 'AI / ML', 'microservices', 'web app', 'unity / game', 'internal tool'];

  const filteredProjects = projects.filter(p => {
    const matchesCat = selectedCategory === 'TODOS' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.primaryStack.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'ai / ml': return <Cpu className="w-3.5 h-3.5 text-white" />;
      case 'microservices': return <Boxes className="w-3.5 h-3.5 text-white" />;
      case 'web app': return <Wrench className="w-3.5 h-3.5 text-white" />;
      case 'unity / game': return <Gamepad2 className="w-3.5 h-3.5 text-white" />;
      case 'internal tool': return <Building2 className="w-3.5 h-3.5 text-white" />;
      default: return <Boxes className="w-3.5 h-3.5 text-white" />;
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-black text-white border border-neutral-700 font-bold">
            <ShieldCheck className="w-3 h-3 text-white" /> EN PRODUCCIÓN
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-black text-neutral-300 border border-neutral-700 font-bold">
            <AlertTriangle className="w-3 h-3 text-neutral-400" /> ALERTA DE RIESGO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-black text-neutral-400 border border-neutral-800 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> DESARROLLO
          </span>
        );
    }
  };

  // Canvas Mouse Pan Controls
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom(z => Math.min(2.5, Math.max(0.3, parseFloat((z + zoomDelta).toFixed(2)))));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanning) {
      setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  const handleOpenLocalFolderDirect = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker();
        if (handle) {
          const newProj = await scanNativeDirectoryHandle(handle);
          onSelectProject(newProj);
        }
      } else {
        onOpenScanner();
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.warn('Error reading directory:', e);
      }
    }
  };

  // Mind Map Coordinates Layout Algorithm
  const centerX = 700;
  const centerY = 450;
  const verticalSpacing = 160;

  const leftCount = Math.ceil(filteredProjects.length / 2);
  const rightCount = filteredProjects.length - leftCount;

  const projectNodes = filteredProjects.map((proj, idx) => {
    const isRight = idx >= leftCount;
    const sideIdx = isRight ? idx - leftCount : idx;
    const totalOnSide = isRight ? rightCount : leftCount;

    const startY = centerY - ((totalOnSide - 1) * verticalSpacing) / 2;
    const x = isRight ? centerX + 360 : centerX - 360;
    const y = startY + sideIdx * verticalSpacing;

    return {
      ...proj,
      x,
      y,
      isRight
    };
  });

  return (
    <div 
      className="flex-1 h-full bg-[#0A0A0A] flex flex-col font-sans text-neutral-200 overflow-hidden select-none relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top OS Branding Bar */}
      <div className="p-4 sm:p-6 bg-[#0D0D0D] border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 z-20 font-mono shadow-2xl">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Arkhet" className="h-8 w-auto object-contain rounded border border-neutral-800" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wider uppercase">ARKHET</h1>
              <span className="px-1.5 py-0.2 text-[8px] bg-white text-black font-bold rounded">MAPA MENTAL</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-sans">
              Operating System de Arquitectura & Grafo Vivo
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Switcher Mindmap vs Grid */}
          <div className="bg-black p-1 rounded border border-neutral-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewMode('mindmap')}
              className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'mindmap' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" /> MAPA
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> REJILLA
            </button>
          </div>

          {projects.length > 1 && (
            <button
              onClick={onOpenComparator}
              className="px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold border border-neutral-700 shrink-0 flex items-center gap-1.5"
            >
              <GitBranch className="w-3.5 h-3.5 text-neutral-400" />
              COMPARAR
            </button>
          )}

          <button
            onClick={handleOpenLocalFolderDirect}
            className="px-3 py-1.5 rounded bg-white hover:bg-neutral-200 text-black text-[11px] font-bold shrink-0 flex items-center gap-1.5"
          >
            <HardDrive className="w-3.5 h-3.5" />
            CARPETA LOCAL
          </button>

          <button
            onClick={onOpenScanner}
            className="px-2.5 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-[11px] font-bold border border-neutral-800 shrink-0 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            IMPORTAR
          </button>
        </div>
      </div>

      {/* Live Download Status Banner */}
      {activeImportTask && (
        <div className="bg-white text-black px-4 sm:px-8 py-2 border-b border-neutral-800 flex items-center justify-between font-mono text-xs z-20">
          <div className="flex items-center gap-2 overflow-hidden">
            <Sparkles className="w-4 h-4 text-black animate-spin shrink-0" />
            <span className="font-bold uppercase truncate">
              DESCARGANDO {activeImportTask.repoName}... {activeImportTask.percent}%
            </span>
          </div>

          <div className="w-24 sm:w-48 h-2 bg-neutral-200 rounded-full overflow-hidden shrink-0 ml-2">
            <div 
              className="h-full bg-black transition-all duration-300" 
              style={{ width: `${activeImportTask.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="px-4 sm:px-8 py-2 border-b border-neutral-800 bg-[#0D0D0D] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 z-20">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-white text-black font-bold'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="BUSCAR..."
            className="w-full pl-8 pr-3 py-1 bg-neutral-900 border border-neutral-800 rounded text-[11px] font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
          />
        </div>
      </div>

      {/* VIEW MODE 1: MACRO MIND MAP CANVAS */}
      {viewMode === 'mindmap' ? (
        <div className="flex-1 relative overflow-hidden">
          {/* Floating Canvas Controls */}
          <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-[#141414] p-1 rounded border border-neutral-800 shadow-2xl">
            <button
              onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition-colors"
              title="Acercar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1.5 text-neutral-400 font-bold">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.max(0.3, z - 0.15))}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition-colors"
              title="Alejar"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setZoom(isMobile ? 0.55 : 0.85); setPan({ x: 0, y: 0 }); }}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition-colors border-l border-neutral-800 ml-1 pl-1.5 font-mono text-[10px] flex items-center gap-1"
              title="Centrar"
            >
              <Maximize2 className="w-3 h-3" /> CENTRAR
            </button>
          </div>

          <svg
            ref={svgRef}
            className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
            onMouseDown={handleMouseDownCanvas}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Spline Lines connecting Center to Project Nodes */}
              {projectNodes.map(pn => {
                const startX = pn.isRight ? centerX + 120 : centerX - 120;
                const endX = pn.isRight ? pn.x - 120 : pn.x + 120;

                const controlX1 = startX + (pn.isRight ? 90 : -90);
                const controlX2 = endX + (pn.isRight ? -90 : 90);

                const pathData = `M ${startX} ${centerY} C ${controlX1} ${centerY}, ${controlX2} ${pn.y}, ${endX} ${pn.y}`;

                return (
                  <g key={`path-${pn.id}`}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#525252"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    />

                    {/* Sub-Branch Leaf Nodes (Tech Stack Tags) */}
                    {pn.primaryStack.slice(0, 3).map((st, sIdx) => {
                      const leafDirection = pn.isRight ? 1 : -1;
                      const lx = pn.x + leafDirection * (140 + (sIdx % 2) * 20);
                      const ly = pn.y + (sIdx - 1) * 34;

                      const nodeEdgeX = pn.isRight ? pn.x + 120 : pn.x - 120;

                      return (
                        <g key={`leaf-${pn.id}-${st}`}>
                          <line
                            x1={nodeEdgeX}
                            y1={pn.y}
                            x2={lx}
                            y2={ly}
                            stroke="#333333"
                            strokeWidth="1.5"
                          />
                          <foreignObject x={pn.isRight ? lx : lx - 100} y={ly - 14} width="100" height="28">
                            <div className="px-2 py-1 bg-black border border-neutral-800 rounded text-center text-[10px] font-mono text-neutral-300 font-bold truncate">
                              {st}
                            </div>
                          </foreignObject>
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Central Root Mind Map Node: ARKHET OS */}
              <foreignObject x={centerX - 120} y={centerY - 55} width="240" height="110">
                <div className="w-full h-full p-3 rounded-xl bg-[#141414] border-2 border-white shadow-2xl flex flex-col items-center justify-center text-center font-mono space-y-1">
                  <img src="/logo.png" alt="Arkhet" className="h-7 w-auto object-contain" />
                  <span className="text-xs font-bold text-white tracking-widest uppercase">ARKHET ECOSISTEMA</span>
                  <div className="flex items-center gap-2 text-[9px] text-neutral-400 font-bold">
                    <span><strong>{projects.length}</strong> SISTEMAS</span>
                    <span>•</span>
                    <span className="text-white flex items-center gap-1"><UserCheck className="w-3 h-3 text-white" /> @Sebaxis07</span>
                  </div>
                </div>
              </foreignObject>

              {/* Mind Map Project Branch Nodes */}
              {projectNodes.map(pn => (
                <g 
                  key={pn.id} 
                  transform={`translate(${pn.x - 120}, ${pn.y - 60})`}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation();
                    onSelectProject(pn);
                  }}
                  className="cursor-pointer"
                >
                  <foreignObject width="240" height="120" className="pointer-events-auto">
                    <div
                      onClick={e => {
                        e.stopPropagation();
                        onSelectProject(pn);
                      }}
                      className="group w-full h-full p-3 rounded-lg bg-[#171717] border border-neutral-800 hover:border-white transition-all cursor-pointer shadow-2xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1 border-b border-neutral-800 pb-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black text-neutral-300 border border-neutral-800 flex items-center gap-1">
                            {getCategoryIcon(pn.category)} {pn.category}
                          </span>
                          {getHealthBadge(pn.healthStatus)}
                        </div>

                        <h3 className="text-xs font-bold text-white group-hover:text-white font-mono truncate flex items-center justify-between mt-1">
                          {pn.name}
                          <ExternalLink className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white shrink-0" />
                        </h3>
                      </div>

                      <div className="pt-1 border-t border-neutral-800 flex items-center justify-between text-[9px] font-mono text-neutral-400">
                        <span className="flex items-center gap-1 font-bold text-white">
                          <UserCheck className="w-3 h-3 text-white" /> @{pn.gitInfo?.owner || 'Sebaxis07'}
                        </span>
                        <span>COMPLEJIDAD: <strong className="text-white">{pn.complexityScore}</strong></span>
                      </div>
                    </div>
                  </foreignObject>
                </g>
              ))}
            </g>
          </svg>

          {filteredProjects.length === 0 && !activeImportTask && (
            <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
              <div className="p-6 bg-[#121212] border border-neutral-800 rounded-lg text-center space-y-3 max-w-sm pointer-events-auto">
                <HardDrive className="w-8 h-8 mx-auto text-white" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">Sin Proyectos Conectados</h3>
                <p className="text-xs text-neutral-400 font-mono">
                  Selecciona la carpeta local de tu PC para construir tu primer mapa mental de arquitectura en Arkhet.
                </p>
                <button
                  onClick={handleOpenLocalFolderDirect}
                  className="px-4 py-2 rounded bg-white text-black font-mono font-bold text-xs hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> CONECTAR CARPETA LOCAL
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // VIEW MODE 2: CORPORATE GRID
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-2">
              <span className="text-xs uppercase font-mono font-bold tracking-widest text-neutral-400">
                SISTEMAS VINCULADOS A @Sebaxis07 ({filteredProjects.length})
              </span>
            </div>

            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                {filteredProjects.map(project => (
                  <div
                    key={project.id}
                    onClick={e => {
                      e.stopPropagation();
                      onSelectProject(project);
                    }}
                    className="group bg-[#141414] border border-neutral-800 hover:border-white rounded-lg p-4 sm:p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between relative"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                          {getCategoryIcon(project.category)}
                          {project.category}
                        </span>
                        <div className="flex items-center gap-2">
                          {getHealthBadge(project.healthStatus)}
                          {onDeleteProject && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                if (confirm(`¿Eliminar ${project.name} del historial de Arkhet?`)) {
                                  onDeleteProject(project.id);
                                }
                              }}
                              className="p-1 text-neutral-600 hover:text-white transition-colors"
                              title="Eliminar de la lista"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-white font-mono flex items-center justify-between mb-2">
                        {project.name}
                        <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
                      </h3>

                      <p className="text-xs text-neutral-400 line-clamp-2 mb-4 font-sans leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-neutral-800">
                      <div className="flex flex-wrap gap-1.5">
                        {project.primaryStack.map(tech => (
                          <span key={tech} className="text-[10px] font-mono px-2 py-0.5 rounded bg-black text-neutral-300 border border-neutral-800 font-bold">
                            {tech}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                        <span>PUNTAJE DE COMPLEJIDAD</span>
                        <span className="font-bold text-white">{project.complexityScore} / 100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#141414] border border-neutral-800 rounded-lg space-y-3 font-mono">
                <Boxes className="w-8 h-8 mx-auto text-neutral-500" />
                <h3 className="text-sm font-bold text-white uppercase">No se encontraron sistemas en esta categoría</h3>
                <p className="text-xs text-neutral-400">
                  Prueba cambiando el filtro de búsqueda o conecta un nuevo repositorio.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
