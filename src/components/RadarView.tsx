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
  onImportProject,
  onDeleteProject
}) => {
  const [viewMode, setViewMode] = useState<'mindmap' | 'grid'>('mindmap');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Canvas Mind Map Zoom & Pan State
  const [zoom, setZoom] = useState(() => (window.innerWidth < 640 ? 0.55 : 0.85));
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchDistanceStart, setTouchDistanceStart] = useState<number | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const categories = ['TODOS', 'AI / ML', 'Microservices', 'Web App', 'Unity / Game', 'Internal Tool'];

  const handleOpenLocalFolderDirect = async () => {
    if ('showDirectoryPicker' in window && onImportProject) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
        const project = await scanNativeDirectoryHandle(dirHandle);
        onImportProject(project);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          alert('Error al acceder a la carpeta local: ' + err.message);
        }
      }
    } else {
      onOpenScanner();
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesCategory = selectedCategory === 'TODOS' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.primaryStack.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AI / ML': return <Cpu className="w-3.5 h-3.5 text-neutral-300" />;
      case 'Microservices': return <Boxes className="w-3.5 h-3.5 text-neutral-300" />;
      case 'Unity / Game': return <Gamepad2 className="w-3.5 h-3.5 text-neutral-300" />;
      case 'Internal Tool': return <Wrench className="w-3.5 h-3.5 text-neutral-300" />;
      default: return <Building2 className="w-3.5 h-3.5 text-neutral-300" />;
    }
  };

  const getHealthBadge = (status: Project['healthStatus']) => {
    switch (status) {
      case 'production':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono uppercase bg-white text-black font-bold"><ShieldCheck className="w-3 h-3" /> PRODUCCIÓN</span>;
      case 'refactoring':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono uppercase bg-neutral-800 text-neutral-300 border border-neutral-700"><AlertTriangle className="w-3 h-3 text-neutral-400" /> REFACTOR</span>;
      case 'staging':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono uppercase bg-neutral-900 text-neutral-200 border border-neutral-700">STAGING</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono uppercase bg-neutral-900 text-neutral-400 border border-neutral-800">DESARROLLO</span>;
    }
  };

  // Mouse Wheel Zoom Handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom(z => Math.min(2.5, Math.max(0.3, parseFloat((z + zoomDelta).toFixed(2)))));
  };

  // Desktop Mouse Drag
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

  // Mobile Touch Panning & Pinch-to-Zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    } else if (e.touches.length === 2) {
      setIsPanning(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchDistanceStart(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanning) {
      setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    } else if (e.touches.length === 2 && touchDistanceStart !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / touchDistanceStart;
      setZoom(z => Math.min(2.5, Math.max(0.3, parseFloat((z * (factor > 1 ? 1.03 : 0.97)).toFixed(2)))));
      setTouchDistanceStart(currentDist);
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setTouchDistanceStart(null);
  };

  // Compute Responsive Radial Mind Map layout
  const centerX = isMobile ? 320 : 650;
  const centerY = isMobile ? 260 : 360;
  const horizontalDist = isMobile ? 260 : 380;
  const verticalSpacing = isMobile ? 140 : 160;

  const projectNodes = filteredProjects.map((p, idx) => {
    const isEven = idx % 2 === 0;
    const sideMultiplier = isEven ? 1 : -1;
    const pairIndex = Math.floor(idx / 2);
    const rowOffset = (pairIndex - (Math.ceil(filteredProjects.length / 2) - 1) / 2) * verticalSpacing;

    const x = centerX + sideMultiplier * horizontalDist;
    const y = centerY + rowOffset;
    const isRight = sideMultiplier > 0;

    return { ...p, x, y, isRight };
  });

  return (
    <div 
      className="flex-1 flex flex-col h-full bg-[#0A0A0A] text-neutral-200 overflow-hidden relative font-sans select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Micro Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1A1A1A_1px,transparent_1px),linear-gradient(to_bottom,#1A1A1A_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none" />

      {/* Header Banner - Responsive Compact Layout */}
      <div className="px-4 sm:px-8 py-3 sm:py-4 border-b border-neutral-800 bg-[#121212] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Arkhet Logo" 
            className="h-8 sm:h-10 w-auto object-contain rounded border border-neutral-800"
          />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2 font-mono">
              ARKHET
              <span className="text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 font-normal">
                MAPA MENTAL
              </span>
            </h1>
            <p className="text-[11px] sm:text-xs text-neutral-400 font-mono line-clamp-1">
              Operating System de Arquitectura & Grafo Vivo
            </p>
          </div>
        </div>

        {/* Action Toolbar (Horizontal Scroll on Mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 font-mono text-xs">
          <div className="flex items-center bg-black p-1 rounded border border-neutral-800 shrink-0">
            <button
              onClick={() => setViewMode('mindmap')}
              className={`px-2.5 py-1 rounded font-bold flex items-center gap-1.5 transition-all text-[11px] ${
                viewMode === 'mindmap' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-black" /> MAPA
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded font-bold flex items-center gap-1.5 transition-all text-[11px] ${
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

      {/* Filter & Search Toolbar (Single Touch Line) */}
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
              title="Acercar (o usa la rueda del ratón)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1.5 text-neutral-400 font-bold">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.max(0.3, z - 0.15))}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition-colors"
              title="Alejar (o usa la rueda del ratón)"
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

                    {/* Sub-Branch Leaf Nodes (Tech Stack Tags) extending outwards */}
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
                <g key={pn.id} transform={`translate(${pn.x - 120}, ${pn.y - 60})`}>
                  <foreignObject width="240" height="120">
                    <div
                      onClick={() => onSelectProject(pn)}
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
                    onClick={() => onSelectProject(project)}
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

                      <h3 className="text-base font-bold text-white group-hover:text-white transition-colors flex items-center justify-between">
                        {project.name}
                        <ExternalLink className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
                      </h3>
                      <p className="text-xs text-neutral-400 mt-2 leading-relaxed font-sans">
                        {project.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {project.primaryStack.map(stack => (
                          <span
                            key={stack}
                            className="px-2 py-0.5 rounded text-[11px] font-mono bg-black text-neutral-300 border border-neutral-800"
                          >
                            {stack}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 font-mono">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-white font-bold">
                          <UserCheck className="w-3.5 h-3.5 text-white" /> @{project.gitInfo?.owner || 'Sebaxis07'}
                        </span>
                        <span>
                          <strong className="text-white">{project.nodes.length}</strong> NODOS
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">COMPLEJIDAD:</span>
                        <span className="font-bold text-white">{project.complexityScore} / 100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#121212] border border-neutral-800 rounded-lg max-w-xl mx-auto my-12 space-y-4">
                <div className="p-3 bg-black rounded-full w-16 h-16 mx-auto border border-neutral-800 flex items-center justify-center text-white">
                  <img src="/logo.png" alt="Arkhet Logo" className="w-10 h-10 object-contain" />
                </div>
                <h3 className="text-base font-bold text-white uppercase font-mono tracking-wider">Bienvenido a Arkhet</h3>
                <p className="text-xs text-neutral-400 font-mono max-w-md mx-auto leading-relaxed">
                  Selecciona la carpeta raíz de cualquier proyecto local en tu equipo para construir su grafo de arquitectura en Arkhet.
                </p>
                <button
                  onClick={handleOpenLocalFolderDirect}
                  className="px-5 py-3 rounded bg-white text-black font-mono font-bold text-xs hover:bg-neutral-200 transition-colors inline-flex items-center gap-2"
                >
                  <HardDrive className="w-4 h-4" /> CONECTAR CARPETA LOCAL
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
