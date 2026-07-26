import React, { useState, useRef } from 'react';
import type { ArchNode, ArchEdge, ClusterZone, LayerViewMode } from '../types/architecture';
import { 
  Server, 
  Database, 
  Globe, 
  Cpu, 
  Shield, 
  HardDrive, 
  Zap, 
  Maximize2, 
  ZoomIn, 
  ZoomOut,
  ChevronDown,
  ChevronRight,
  Box,
  Plus,
  Radio,
  FileCode,
  Terminal,
  Lock,
  Layers
} from 'lucide-react';

interface ArchitectureGraphProps {
  nodes: ArchNode[];
  edges: ArchEdge[];
  clusters: ClusterZone[];
  selectedNodeId: string | null;
  layerView: LayerViewMode;
  onSelectNode: (nodeId: string) => void;
  onNodesChange: (nodes: ArchNode[]) => void;
  onAddNode: () => void;
}

export const ArchitectureGraph: React.FC<ArchitectureGraphProps> = ({
  nodes,
  edges,
  clusters,
  selectedNodeId,
  layerView,
  onSelectNode,
  onNodesChange,
  onAddNode
}) => {
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [touchDistanceStart, setTouchDistanceStart] = useState<number | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const getNodeIcon = (category: string) => {
    switch (category) {
      case 'frontend': return <Globe className="w-4 h-4 text-white" />;
      case 'backend': return <Server className="w-4 h-4 text-white" />;
      case 'database': return <Database className="w-4 h-4 text-white" />;
      case 'queue': return <Zap className="w-4 h-4 text-white" />;
      case 'microservice': return <Cpu className="w-4 h-4 text-white" />;
      case 'auth': return <Shield className="w-4 h-4 text-white" />;
      case 'storage': return <HardDrive className="w-4 h-4 text-white" />;
      case 'devops': return <Terminal className="w-4 h-4 text-white" />;
      default: return <Layers className="w-4 h-4 text-white" />;
    }
  };

  // Smooth Mouse Wheel Zoom Handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoom(z => Math.min(2.5, Math.max(0.35, parseFloat((z + zoomDelta).toFixed(2)))));
  };

  // Desktop Mouse Events
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (draggingNodeId) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;
      
      onNodesChange(nodes.map(n => {
        if (n.id === draggingNodeId) {
          return { ...n, x: n.x + dx, y: n.y + dy };
        }
        return n;
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
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
      setZoom(z => Math.min(2.5, Math.max(0.35, parseFloat((z * (factor > 1 ? 1.03 : 0.97)).toFixed(2)))));
      setTouchDistanceStart(currentDist);
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setTouchDistanceStart(null);
  };

  const toggleNodeExpansion = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodeIds(prev => {
      const copy = new Set(prev);
      if (copy.has(nodeId)) copy.delete(nodeId);
      else copy.add(nodeId);
      return copy;
    });
  };

  // Group subnodes into categories for compact rendering
  const groupSubnodes = (subNodes?: ArchNode['subNodes']) => {
    if (!subNodes || subNodes.length === 0) return {};
    const groups: Record<string, typeof subNodes> = {};
    for (const sn of subNodes) {
      const category = sn.type === 'route' ? 'RUTAS & API' :
                       sn.type === 'controller' ? 'COMPONENTES UI' :
                       sn.type === 'service' ? 'SERVICIOS & IA' :
                       sn.type === 'model' ? 'ESQUEMAS DB' : 'MÓDULOS CÓDIGO';
      if (!groups[category]) groups[category] = [];
      groups[category].push(sn);
    }
    return groups;
  };

  // Compute Dynamic Adaptive Bounding Boxes for Clusters
  const dynamicClusters = clusters.map(cluster => {
    const memberNodes = nodes.filter(n => 
      n.clusterId === cluster.id || 
      (cluster.layer === 'presentation' && n.category === 'frontend') ||
      (cluster.layer === 'application' && (n.category === 'backend' || n.category === 'auth' || n.category === 'queue')) ||
      (cluster.layer === 'data' && (n.category === 'database' || n.category === 'microservice' || n.category === 'storage'))
    );

    if (memberNodes.length === 0) {
      return cluster;
    }

    const paddingX = 30;
    const paddingTop = 50;
    const paddingBottom = 30;
    const cardWidth = 320;

    const minX = Math.min(...memberNodes.map(n => n.x)) - paddingX;
    const maxX = Math.max(...memberNodes.map(n => n.x + cardWidth)) + paddingX;

    const minY = Math.min(...memberNodes.map(n => n.y)) - paddingTop;
    const maxY = Math.max(...memberNodes.map(n => {
      const isExpanded = expandedNodeIds.has(n.id) || layerView === 'code';
      const totalSub = n.subNodes?.length || 0;
      const h = isExpanded ? Math.min(520, 220 + totalSub * 36) : 210;
      return n.y + h;
    })) + paddingBottom;

    return {
      ...cluster,
      x: minX,
      y: minY,
      width: Math.max(350, maxX - minX),
      height: Math.max(280, maxY - minY)
    };
  });

  return (
    <div 
      className="flex-1 h-full bg-[#0A0A0A] relative overflow-hidden select-none font-sans"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Micro Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1F1F1F_1px,transparent_1px),linear-gradient(to_bottom,#1F1F1F_1px,transparent_1px)] bg-[size:24px_24px] opacity-30 pointer-events-none" />

      {/* Layer View Mode Badge Indicator */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#141414] px-3 py-1.5 rounded-lg border border-neutral-800 shadow-2xl font-mono text-xs">
        <span className="text-neutral-500 font-bold uppercase text-[10px]">VISTA ACTIVA:</span>
        {layerView === 'logical' && (
          <span className="px-2 py-0.5 rounded bg-white text-black font-bold uppercase text-[10px] flex items-center gap-1">
            <Radio className="w-3 h-3 text-black" /> LÓGICA (DOMINIO ESTRATÉGICO)
          </span>
        )}
        {layerView === 'physical' && (
          <span className="px-2 py-0.5 rounded bg-neutral-900 text-white border border-neutral-700 font-bold uppercase text-[10px] flex items-center gap-1">
            <Server className="w-3 h-3 text-white" /> FÍSICA (SERVIDORES, PUERTOS Y RECURSOS)
          </span>
        )}
        {layerView === 'code' && (
          <span className="px-2 py-0.5 rounded bg-black text-neutral-200 border border-neutral-700 font-bold uppercase text-[10px] flex items-center gap-1">
            <FileCode className="w-3 h-3 text-white" /> CÓDIGO (IDE & MÓDULOS DE FUENTE)
          </span>
        )}
      </div>

      {/* Top Controls Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-[#141414] p-1.5 rounded border border-neutral-800 shadow-2xl">
        <button
          onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
          className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition-colors"
          title="Acercar (o usa la rueda del ratón / gesto pellizcar)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono px-2 text-neutral-400 font-bold">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(z => Math.max(0.35, z - 0.15))}
          className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition-colors"
          title="Alejar (o usa la rueda del ratón / gesto pellizcar)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={() => { setZoom(0.85); setPan({ x: 0, y: 0 }); }}
          className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition-colors border-l border-neutral-800 ml-1 pl-2 font-mono text-xs flex items-center gap-1"
          title="Centrar Grafo"
        >
          <Maximize2 className="w-3.5 h-3.5" /> CENTRAR
        </button>

        <button
          onClick={onAddNode}
          className="px-3 py-1 bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs rounded transition-colors flex items-center gap-1 ml-1"
        >
          <Plus className="w-3.5 h-3.5" /> NODO
        </button>
      </div>

      {/* Main Interactive Canvas SVG */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleMouseDownCanvas}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Dynamic Cluster Bounding Containers */}
          {dynamicClusters.map(cluster => (
            <g key={cluster.id} className="transition-all duration-150 ease-out">
              <rect
                x={cluster.x}
                y={cluster.y}
                width={cluster.width}
                height={cluster.height}
                rx="10"
                fill={layerView === 'physical' ? '#0D0D0D' : '#0F0F0F'}
                stroke={layerView === 'physical' ? '#404040' : '#262626'}
                strokeWidth={layerView === 'physical' ? '2' : '1.5'}
                strokeDasharray={layerView === 'code' ? '2,2' : '6,6'}
              />
              <text
                x={cluster.x + 16}
                y={cluster.y + 28}
                fill={layerView === 'physical' ? '#A3A3A3' : '#737373'}
                fontSize="11"
                fontFamily="monospace"
                fontWeight="bold"
                letterSpacing="1.5"
              >
                {layerView === 'physical' ? `SERVIDORES & RACKS: ${cluster.title}` : cluster.title}
              </text>
            </g>
          ))}

          {/* Connectors / Edges (Transformed by layerView) */}
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            const isSelected = selectedNodeId === sourceNode.id || selectedNodeId === targetNode.id;

            const x1 = sourceNode.x + 320;
            const y1 = sourceNode.y + 65;
            const x2 = targetNode.x;
            const y2 = targetNode.y + 65;

            const dx = Math.abs(x2 - x1) * 0.5;
            const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            // Transformed Line Text according to layerView
            const edgeLabelText = 
              layerView === 'physical' ? (edge.physicalProtocol || `PORT ${targetNode.port || 80} / TLS`) :
              layerView === 'code' ? (edge.codeInvocation || `import { ${targetNode.label} }`) :
              (edge.label || 'HTTP REST / JSON');

            return (
              <g key={edge.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={isSelected ? '#FFFFFF' : layerView === 'physical' ? '#737373' : '#404040'}
                  strokeWidth={isSelected ? '2.5' : layerView === 'physical' ? '2' : '1.5'}
                  strokeDasharray={layerView === 'physical' ? 'none' : edge.protocol === 'HTTP' ? 'none' : '4,4'}
                  className="transition-all duration-200"
                />

                {edgeLabelText && (
                  <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                    <rect
                      x="-85"
                      y="-11"
                      width="170"
                      height="22"
                      rx="4"
                      fill="#0A0A0A"
                      stroke={layerView === 'physical' ? '#525252' : '#262626'}
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3"
                      fill={layerView === 'physical' ? '#FFFFFF' : '#A3A3A3'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {edgeLabelText}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Node Cards (Transformed Radically by layerView) */}
          {nodes.map(node => {
            const isSelected = selectedNodeId === node.id;
            const isExpanded = expandedNodeIds.has(node.id) || layerView === 'code';
            const subnodeGroups = groupSubnodes(node.subNodes);
            const totalSubnodes = node.subNodes?.length || 0;

            const cardHeight = isExpanded ? Math.min(520, 220 + totalSubnodes * 36) : 210;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => onSelectNode(node.id)}
                onMouseDown={e => {
                  e.stopPropagation();
                  setDraggingNodeId(node.id);
                  setDragStart({ x: e.clientX, y: e.clientY });
                }}
                className="cursor-pointer group"
              >
                <foreignObject width="320" height={cardHeight}>
                  {/* LAYER VIEW 1: LÓGICA (Executive High-Level View) */}
                  {layerView === 'logical' && (
                    <div
                      className={`w-full h-full rounded-lg bg-[#141414] border transition-all duration-150 p-4 font-sans shadow-2xl flex flex-col justify-between overflow-hidden ${
                        isSelected
                          ? 'border-white ring-1 ring-white shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                          : 'border-neutral-800 hover:border-neutral-500'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="p-1.5 bg-black rounded border border-neutral-800 flex items-center justify-center shrink-0">
                            {getNodeIcon(node.category)}
                          </span>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 font-bold truncate">
                            {node.category}
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-white tracking-tight font-mono truncate leading-snug">
                          {node.label}
                        </h3>
                        <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1 leading-snug">
                          {node.description}
                        </p>
                      </div>

                      {totalSubnodes > 0 && (
                        <div className="my-1.5 pt-2 border-t border-neutral-800/80 font-mono text-[10px]">
                          <div 
                            onClick={e => toggleNodeExpansion(node.id, e)}
                            className="flex items-center justify-between px-2.5 py-1.5 bg-black rounded border border-neutral-800 hover:border-neutral-600 transition-colors text-neutral-300 font-bold"
                          >
                            <span className="flex items-center gap-1.5">
                              <Box className="w-3.5 h-3.5 text-white" />
                              {totalSubnodes} SUBCOMPONENTES
                            </span>
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-white" /> : <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1 pt-1 font-mono text-[10px]">
                        {node.techStack?.slice(0, 3).map(st => (
                          <span key={st} className="px-2 py-0.5 rounded bg-black text-neutral-300 border border-neutral-800 font-bold">
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LAYER VIEW 2: FÍSICA (Server Hardware & Port Deployment View) */}
                  {layerView === 'physical' && (
                    <div
                      className={`w-full h-full rounded-lg bg-[#0F0F0F] border-2 transition-all duration-150 p-4 font-mono shadow-2xl flex flex-col justify-between overflow-hidden ${
                        isSelected
                          ? 'border-white ring-2 ring-white shadow-[0_0_25px_rgba(255,255,255,0.2)]'
                          : 'border-neutral-700 hover:border-white'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Server Rack Bar */}
                        <div className="flex items-center justify-between bg-black p-2 rounded border border-neutral-800">
                          <div className="flex items-center gap-1.5">
                            <Server className="w-4 h-4 text-white animate-pulse" />
                            <span className="font-bold text-white text-[11px] uppercase tracking-wider">
                              HOST: {node.hosting || 'NODE.JS RUNTIME'}
                            </span>
                          </div>
                          {node.port && (
                            <span className="px-2 py-0.5 rounded bg-white text-black font-bold text-[10px]">
                              PORT :{node.port}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-white tracking-tight font-mono truncate">
                            {node.label}
                          </h3>
                          {node.domainUrl && (
                            <span className="text-[10px] text-neutral-400 font-mono truncate block">
                              🌐 {node.domainUrl}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Server Hardware Metrics Badges */}
                      <div className="space-y-1.5 pt-2 border-t border-neutral-800 text-[10px] font-mono">
                        <div className="flex justify-between items-center bg-black p-1.5 rounded border border-neutral-800 text-neutral-300">
                          <span>RECURSOS ASIGNADOS:</span>
                          <strong className="text-white">{node.cpuRam || '2 vCPU / 4GB RAM'}</strong>
                        </div>
                        <div className="flex justify-between items-center bg-black p-1.5 rounded border border-neutral-800 text-neutral-300">
                          <span>ENCRIPTACIÓN SSL/TLS:</span>
                          <span className="text-white font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3 text-white" /> TLS 1.3 PUERTO 443
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LAYER VIEW 3: CÓDIGO (Source Code IDE & Subcomponents View) */}
                  {layerView === 'code' && (
                    <div
                      className={`w-full h-full rounded-lg bg-[#0A0A0A] border transition-all duration-150 p-3.5 font-mono shadow-2xl flex flex-col justify-between overflow-hidden ${
                        isSelected
                          ? 'border-white ring-1 ring-white shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                          : 'border-neutral-800 hover:border-neutral-600'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* IDE Header */}
                        <div className="flex items-center justify-between bg-[#171717] px-2.5 py-1 rounded border border-neutral-800 text-[10px]">
                          <span className="font-bold text-white flex items-center gap-1.5 truncate">
                            <FileCode className="w-3.5 h-3.5 text-white" />
                            {node.folderPath || '/src'}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-black text-neutral-400 font-bold">
                            SRC MODULE
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xs font-bold text-white tracking-tight truncate">
                            {node.label}
                          </h3>
                        </div>

                        {/* Always Expanded Code Modules List */}
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                          {Object.entries(subnodeGroups).map(([catName, items]) => (
                            <div key={catName} className="p-2 bg-[#141414] rounded border border-neutral-800">
                              <span className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">
                                {catName} ({items.length})
                              </span>
                              <div className="space-y-1">
                                {items.map(item => (
                                  <div key={item.id} className="text-[10px] text-white font-bold truncate flex items-center justify-between border-b border-neutral-900 pb-0.5">
                                    <span>• {item.label}</span>
                                    {item.linesOfCode && (
                                      <span className="text-[9px] text-neutral-500 font-mono">{item.linesOfCode} LoC</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-1 border-t border-neutral-800 flex items-center justify-between text-[9px] text-neutral-500">
                        <span>EXPORTS: default {node.label}</span>
                        <span className="text-white font-bold font-mono">IDE CODE VIEW</span>
                      </div>
                    </div>
                  )}
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
