import React, { useState, useRef } from 'react';
import type { ArchNode, ArchEdge, ClusterZone } from '../types/architecture';
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
  Plus
} from 'lucide-react';

interface ArchitectureGraphProps {
  nodes: ArchNode[];
  edges: ArchEdge[];
  clusters: ClusterZone[];
  selectedNodeId: string | null;
  layerView: string;
  onSelectNode: (nodeId: string) => void;
  onNodesChange: (nodes: ArchNode[]) => void;
  onAddNode: () => void;
}

export const ArchitectureGraph: React.FC<ArchitectureGraphProps> = ({
  nodes,
  edges,
  clusters,
  selectedNodeId,
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
      default: return <Cpu className="w-4 h-4 text-white" />;
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
                       sn.type === 'controller' ? 'COMPONENTES & VISTAS' :
                       sn.type === 'service' ? 'SERVICIOS & IA' :
                       sn.type === 'model' ? 'MODELOS DE DATOS' : 'OTROS MÓDULOS';
      if (!groups[category]) groups[category] = [];
      groups[category].push(sn);
    }
    return groups;
  };

  // Compute Dynamic Adaptive Bounding Boxes for Clusters based on member nodes
  const dynamicClusters = clusters.map(cluster => {
    const memberNodes = nodes.filter(n => 
      n.clusterId === cluster.id || 
      (cluster.layer === 'presentation' && n.category === 'frontend') ||
      (cluster.layer === 'application' && (n.category === 'backend' || n.category === 'auth')) ||
      (cluster.layer === 'data' && (n.category === 'database' || n.category === 'microservice' || n.category === 'storage'))
    );

    if (memberNodes.length === 0) {
      return cluster;
    }

    const paddingX = 30;
    const paddingTop = 50;
    const paddingBottom = 30;
    const cardWidth = 310;

    const minX = Math.min(...memberNodes.map(n => n.x)) - paddingX;
    const maxX = Math.max(...memberNodes.map(n => n.x + cardWidth)) + paddingX;

    const minY = Math.min(...memberNodes.map(n => n.y)) - paddingTop;
    const maxY = Math.max(...memberNodes.map(n => {
      const isExpanded = expandedNodeIds.has(n.id);
      const totalSub = n.subNodes?.length || 0;
      const h = isExpanded ? Math.min(480, 200 + totalSub * 32) : 190;
      return n.y + h;
    })) + paddingBottom;

    return {
      ...cluster,
      x: minX,
      y: minY,
      width: Math.max(340, maxX - minX),
      height: Math.max(260, maxY - minY)
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

      {/* Main Interactive Canvas SVG with Wheel Zoom and Touch Gestures */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleMouseDownCanvas}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Dynamic Adaptive Cluster Layer Bounding Containers */}
          {dynamicClusters.map(cluster => (
            <g key={cluster.id} className="transition-all duration-150 ease-out">
              <rect
                x={cluster.x}
                y={cluster.y}
                width={cluster.width}
                height={cluster.height}
                rx="10"
                fill="#0F0F0F"
                stroke="#262626"
                strokeWidth="1.5"
                strokeDasharray="6,6"
              />
              <text
                x={cluster.x + 16}
                y={cluster.y + 28}
                fill="#737373"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="bold"
                letterSpacing="1.5"
              >
                {cluster.title}
              </text>
            </g>
          ))}

          {/* Connectors / Edges */}
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            const isSelected = selectedNodeId === sourceNode.id || selectedNodeId === targetNode.id;

            const x1 = sourceNode.x + 310;
            const y1 = sourceNode.y + 60;
            const x2 = targetNode.x;
            const y2 = targetNode.y + 60;

            const dx = Math.abs(x2 - x1) * 0.5;
            const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            return (
              <g key={edge.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={isSelected ? '#FFFFFF' : '#404040'}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  strokeDasharray={edge.protocol === 'HTTP' ? 'none' : '4,4'}
                  className="transition-all duration-200"
                />

                {edge.label && (
                  <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                    <rect
                      x="-65"
                      y="-11"
                      width="130"
                      height="22"
                      rx="4"
                      fill="#0A0A0A"
                      stroke="#262626"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3"
                      fill="#A3A3A3"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Node Cards */}
          {nodes.map(node => {
            const isSelected = selectedNodeId === node.id;
            const isExpanded = expandedNodeIds.has(node.id);
            const subnodeGroups = groupSubnodes(node.subNodes);
            const totalSubnodes = node.subNodes?.length || 0;

            // Perfect Card Dimensions to prevent clipping
            const cardHeight = isExpanded ? Math.min(480, 200 + totalSubnodes * 32) : 190;

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
                <foreignObject width="310" height={cardHeight}>
                  <div
                    className={`w-full h-full rounded-lg bg-[#141414] border transition-all duration-150 p-4 font-sans shadow-2xl flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? 'border-white ring-1 ring-white shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                        : 'border-neutral-800 hover:border-neutral-500'
                    }`}
                  >
                    <div>
                      {/* Node Header */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="p-1.5 bg-black rounded border border-neutral-800 flex items-center justify-center shrink-0">
                          {getNodeIcon(node.category)}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 font-bold truncate">
                          {node.category}
                        </span>
                      </div>

                      {/* Clean Title */}
                      <h3 className="text-xs font-bold text-white tracking-tight font-mono truncate leading-snug">
                        {node.label}
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1 leading-snug">
                        {node.description}
                      </p>
                    </div>

                    {/* Categorized Subcomponents Drawer Badge */}
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

                        {/* Expanded Categorized List */}
                        {isExpanded && (
                          <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {Object.entries(subnodeGroups).map(([category, items]) => (
                              <div key={category} className="p-1.5 bg-[#1A1A1A] rounded border border-neutral-800">
                                <span className="text-[9px] uppercase font-bold text-neutral-400 block mb-1">
                                  {category} ({items.length})
                                </span>
                                <div className="space-y-1">
                                  {items.slice(0, 4).map(item => (
                                    <div key={item.id} className="text-[10px] text-white font-bold truncate flex items-center justify-between">
                                      <span>• {item.label}</span>
                                      <span className="text-[9px] text-neutral-500 font-mono">{item.type}</span>
                                    </div>
                                  ))}
                                  {items.length > 4 && (
                                    <span className="text-[9px] text-neutral-500 font-bold block pt-0.5">
                                      + {items.length - 4} más... (ver en ficha lateral)
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tech Stack Pills */}
                    <div className="flex flex-wrap gap-1 pt-1 font-mono text-[10px]">
                      {node.techStack?.slice(0, 3).map(st => (
                        <span key={st} className="px-2 py-0.5 rounded bg-black text-neutral-300 border border-neutral-800 font-bold">
                          {st}
                        </span>
                      ))}
                      {node.techStack && node.techStack.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-500 font-bold">
                          +{node.techStack.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
