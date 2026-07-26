import React, { useState } from 'react';
import type { Project, ArchNode, Endpoint, SubNode } from '../types/architecture';
import { 
  X, 
  Server, 
  Database, 
  Globe, 
  Cpu, 
  Shield, 
  HardDrive, 
  Layers, 
  Zap, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Lock, 
  Folder, 
  UserCheck,
  GitBranch,
  ExternalLink,
  Search,
  Table
} from 'lucide-react';

interface TechSpecSidebarProps {
  project: Project;
  selectedNode: ArchNode | null;
  onCloseNodeSelection: () => void;
  onUpdateNode: (updatedNode: ArchNode) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const TechSpecSidebar: React.FC<TechSpecSidebarProps> = ({
  project,
  selectedNode,
  onCloseNodeSelection,
  onUpdateNode,
  onDeleteNode
}) => {
  const [activeTab, setActiveTab] = useState<'stack' | 'endpoints' | 'db' | 'env' | 'subnodes'>('stack');
  const [showSecrets, setShowSecrets] = useState(false);
  const [subnodeSearch, setSubnodeSearch] = useState('');

  // New Endpoint State
  const [newMethod, setNewMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'WS'>('GET');
  const [newPath, setNewPath] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isAddingEndpoint, setIsAddingEndpoint] = useState(false);

  const getNodeIcon = (category: string) => {
    switch (category) {
      case 'frontend': return <Globe className="w-4 h-4 text-white" />;
      case 'backend': return <Server className="w-4 h-4 text-white" />;
      case 'database': return <Database className="w-4 h-4 text-white" />;
      case 'queue': return <Zap className="w-4 h-4 text-white" />;
      case 'microservice': return <Cpu className="w-4 h-4 text-white" />;
      case 'auth': return <Shield className="w-4 h-4 text-white" />;
      case 'storage': return <HardDrive className="w-4 h-4 text-white" />;
      default: return <Layers className="w-4 h-4 text-white" />;
    }
  };

  const handleAddEndpointSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode || !newPath) return;

    const newEp: Endpoint = {
      id: `ep-${Date.now()}`,
      method: newMethod,
      path: newPath,
      description: newDesc || 'Endpoint personalizado'
    };

    const updatedNode: ArchNode = {
      ...selectedNode,
      endpoints: [...(selectedNode.endpoints || []), newEp]
    };

    onUpdateNode(updatedNode);
    setNewPath('');
    setNewDesc('');
    setIsAddingEndpoint(false);
  };

  const handleRemoveEndpoint = (epId: string) => {
    if (!selectedNode) return;
    const updatedNode: ArchNode = {
      ...selectedNode,
      endpoints: (selectedNode.endpoints || []).filter(e => e.id !== epId)
    };
    onUpdateNode(updatedNode);
  };

  const handleStatusChange = (newStatus: ArchNode['status']) => {
    if (!selectedNode) return;
    onUpdateNode({ ...selectedNode, status: newStatus });
  };

  // Group subnodes into clean categories
  const getCategorizedSubnodes = (subNodes?: SubNode[]) => {
    if (!subNodes || subNodes.length === 0) return {};

    const filtered = subNodes.filter(sn => 
      sn.label.toLowerCase().includes(subnodeSearch.toLowerCase()) ||
      (sn.details && sn.details.toLowerCase().includes(subnodeSearch.toLowerCase()))
    );

    const categories: Record<string, SubNode[]> = {
      '📁 RUTAS Y API (Routes & Endpoints)': [],
      '🧩 COMPONENTES DE VISTA (React & UI)': [],
      '⚙️ SERVICIOS E INTELIGENCIA ARTIFICIAL': [],
      '🗄️ MODELOS Y ESQUEMAS DB': [],
      '📦 OTROS MÓDULOS DE CÓDIGO': []
    };

    for (const sn of filtered) {
      if (sn.type === 'route') {
        categories['📁 RUTAS Y API (Routes & Endpoints)'].push(sn);
      } else if (sn.type === 'controller' || sn.details?.includes('components') || sn.details?.includes('views')) {
        categories['🧩 COMPONENTES DE VISTA (React & UI)'].push(sn);
      } else if (sn.type === 'service' || sn.type === 'worker' || sn.details?.includes('service')) {
        categories['⚙️ SERVICIOS E INTELIGENCIA ARTIFICIAL'].push(sn);
      } else if (sn.type === 'model' || sn.details?.includes('models')) {
        categories['🗄️ MODELOS Y ESQUEMAS DB'].push(sn);
      } else {
        categories['📦 OTROS MÓDULOS DE CÓDIGO'].push(sn);
      }
    }

    // Filter out empty categories
    return Object.fromEntries(Object.entries(categories).filter(([_, items]) => items.length > 0));
  };

  return (
    <div className="w-80 h-full bg-[#121212] border-l border-neutral-800 flex flex-col z-20 font-sans text-neutral-200 select-none">
      {selectedNode ? (
        // NODE SPEC INSPECTOR
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Node Inspector Header */}
          <div className="p-5 border-b border-neutral-800 bg-[#171717] space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-black text-white border border-neutral-800 font-bold">
                {getNodeIcon(selectedNode.category)} NODO {selectedNode.category.toUpperCase()}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDeleteNode(selectedNode.id)}
                  className="p-1 text-neutral-500 hover:text-white transition-colors"
                  title="Eliminar Nodo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onCloseNodeSelection}
                  className="p-1 text-neutral-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-white tracking-tight leading-snug">
                {selectedNode.label}
              </h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed font-sans">
                {selectedNode.description}
              </p>
            </div>

            {/* Quick Metadata Pills */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-800/80 font-mono text-[11px]">
              {selectedNode.port && (
                <span className="px-2 py-0.5 rounded bg-black text-white font-bold border border-neutral-800">
                  PUERTO: :{selectedNode.port}
                </span>
              )}
              {selectedNode.hosting && (
                <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800 truncate max-w-[160px]">
                  {selectedNode.hosting}
                </span>
              )}
              {selectedNode.folderPath && (
                <span className="px-2 py-0.5 rounded bg-black text-neutral-400 border border-neutral-800 font-bold truncate max-w-[240px] flex items-center gap-1">
                  <Folder className="w-3 h-3" /> {selectedNode.folderPath}
                </span>
              )}
            </div>

            {/* Health Status Selector */}
            <div className="flex items-center justify-between pt-2 text-xs font-mono">
              <span className="text-neutral-500">ESTADO OPERATIVO:</span>
              <select
                value={selectedNode.status}
                onChange={e => handleStatusChange(e.target.value as any)}
                className="bg-black text-white px-2 py-1 rounded border border-neutral-800 text-[11px] font-bold focus:outline-none"
              >
                <option value="healthy">⚪ SALUDABLE</option>
                <option value="refactoring">⚙️ REFACTORIZANDO</option>
                <option value="warning">⚠️ ADVERTENCIA</option>
                <option value="deprecated">🚫 OBSOLETO</option>
              </select>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-neutral-800 bg-black font-mono text-[11px] overflow-x-auto">
            <button
              onClick={() => setActiveTab('stack')}
              className={`px-3 py-2 font-bold whitespace-nowrap border-b-2 transition-all ${
                activeTab === 'stack' ? 'border-white text-white bg-[#171717]' : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              STACK
            </button>
            <button
              onClick={() => setActiveTab('endpoints')}
              className={`px-3 py-2 font-bold whitespace-nowrap border-b-2 transition-all ${
                activeTab === 'endpoints' ? 'border-white text-white bg-[#171717]' : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              ENDPOINTS ({selectedNode.endpoints?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('subnodes')}
              className={`px-3 py-2 font-bold whitespace-nowrap border-b-2 transition-all ${
                activeTab === 'subnodes' ? 'border-white text-white bg-[#171717]' : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              SUBCOMPONENTES ({selectedNode.subNodes?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('db')}
              className={`px-3 py-2 font-bold whitespace-nowrap border-b-2 transition-all ${
                activeTab === 'db' ? 'border-white text-white bg-[#171717]' : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              TABLAS DB ({selectedNode.tables?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('env')}
              className={`px-3 py-2 font-bold whitespace-nowrap border-b-2 transition-all ${
                activeTab === 'env' ? 'border-white text-white bg-[#171717]' : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              VARS ENV ({selectedNode.envVars?.length || 0})
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
            {/* TAB 1: STACK */}
            {activeTab === 'stack' && (
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-bold block">
                  TECNOLOGÍAS Y PAQUETES DETECTADOS
                </span>

                <div className="space-y-2">
                  {selectedNode.techStack && selectedNode.techStack.length > 0 ? (
                    selectedNode.techStack.map(ts => (
                      <div key={ts} className="p-3 bg-black rounded border border-neutral-800 flex items-center justify-between font-mono">
                        <span className="font-bold text-white text-xs">{ts}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                          ACTIVO
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-500 font-mono">Sin tecnologías registradas.</p>
                  )}
                </div>

                <div className="p-3 bg-[#171717] rounded border border-neutral-800 space-y-2 font-mono text-[11px]">
                  <span className="text-neutral-400 font-bold block uppercase text-[10px]">INSPECCIÓN DE CÓDIGO</span>
                  <div className="flex justify-between text-neutral-300">
                    <span>Directorio Local:</span>
                    <span className="text-white font-bold">{selectedNode.folderPath || '/src'}</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Target Runtime:</span>
                    <span className="text-white font-bold">{selectedNode.hosting || 'Node.js / Python'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ENDPOINTS */}
            {activeTab === 'endpoints' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-bold">
                    RUTAS API Y ENDPOINTS ({selectedNode.endpoints?.length || 0})
                  </span>
                  <button
                    onClick={() => setIsAddingEndpoint(!isAddingEndpoint)}
                    className="px-2 py-1 bg-white text-black font-mono font-bold text-[10px] rounded flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> NUEVO
                  </button>
                </div>

                {isAddingEndpoint && (
                  <form onSubmit={handleAddEndpointSubmit} className="p-3 bg-black border border-neutral-800 rounded space-y-2 font-mono text-xs">
                    <div className="flex gap-2">
                      <select
                        value={newMethod}
                        onChange={e => setNewMethod(e.target.value as any)}
                        className="bg-[#171717] text-white p-1.5 rounded border border-neutral-800 font-bold text-xs"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="WS">WS</option>
                      </select>
                      <input
                        type="text"
                        value={newPath}
                        onChange={e => setNewPath(e.target.value)}
                        placeholder="/api/v1/recurso"
                        className="flex-1 bg-[#171717] text-white p-1.5 rounded border border-neutral-800 font-mono text-xs placeholder-neutral-500"
                        required
                      />
                    </div>
                    <input
                      type="text"
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      placeholder="Descripción del endpoint"
                      className="w-full bg-[#171717] text-white p-1.5 rounded border border-neutral-800 font-sans text-xs placeholder-neutral-500"
                    />
                    <button
                      type="submit"
                      className="w-full py-1.5 bg-white text-black font-bold rounded text-xs"
                    >
                      GUARDAR ENDPOINT
                    </button>
                  </form>
                )}

                <div className="space-y-2 font-mono">
                  {selectedNode.endpoints && selectedNode.endpoints.length > 0 ? (
                    selectedNode.endpoints.map(ep => (
                      <div key={ep.id} className="p-3 bg-black rounded border border-neutral-800 space-y-1 relative group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ep.method === 'GET' ? 'bg-neutral-800 text-white border border-neutral-700' :
                              ep.method === 'POST' ? 'bg-white text-black' :
                              'bg-neutral-900 text-neutral-300 border border-neutral-800'
                            }`}>
                              {ep.method}
                            </span>
                            <span className="text-xs font-bold text-white">{ep.path}</span>
                          </div>

                          <button
                            onClick={() => handleRemoveEndpoint(ep.id)}
                            className="text-neutral-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {ep.description && (
                          <p className="text-[11px] text-neutral-400 font-sans">{ep.description}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-500 font-mono">Sin endpoints registrados en este nodo.</p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: CATEGORIZED SUBCOMPONENTS WITH SEARCH */}
            {activeTab === 'subnodes' && (
              <div className="space-y-3 font-mono">
                {/* Search Bar for Subcomponents */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={subnodeSearch}
                    onChange={e => setSubnodeSearch(e.target.value)}
                    placeholder="Filtrar subcomponentes..."
                    className="w-full pl-8 pr-3 py-1.5 bg-black border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                  />
                </div>

                {/* Render Categorized Accordion Groups */}
                {Object.keys(getCategorizedSubnodes(selectedNode.subNodes)).length > 0 ? (
                  Object.entries(getCategorizedSubnodes(selectedNode.subNodes)).map(([categoryTitle, items]) => (
                    <div key={categoryTitle} className="space-y-1.5">
                      <div className="px-2 py-1 bg-[#1A1A1A] rounded border border-neutral-800 flex items-center justify-between text-[10px] font-bold text-white uppercase">
                        <span>{categoryTitle}</span>
                        <span className="px-1.5 py-0.2 rounded bg-black text-neutral-400 border border-neutral-800">
                          {items.length}
                        </span>
                      </div>

                      <div className="space-y-1 pl-1">
                        {items.map(sn => (
                          <div key={sn.id} className="p-2.5 bg-black rounded border border-neutral-800 flex items-center justify-between text-xs">
                            <div className="space-y-0.5 overflow-hidden">
                              <span className="font-bold text-white block truncate">{sn.label}</span>
                              {sn.details && (
                                <span className="text-[10px] text-neutral-500 block truncate">{sn.details}</span>
                              )}
                            </div>
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 font-bold shrink-0 ml-2">
                              {sn.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-500 text-xs">Sin subcomponentes coincidentes.</p>
                )}
              </div>
            )}

            {/* TAB 4: ENHANCED HIGH-CONTRAST TECHNICAL TABLES FOR DB */}
            {activeTab === 'db' && (
              <div className="space-y-4 font-mono">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">
                  ESQUEMAS Y TABLAS DE BASE DE DATOS ({selectedNode.tables?.length || 0})
                </span>

                {selectedNode.tables && selectedNode.tables.length > 0 ? (
                  selectedNode.tables.map(tbl => (
                    <div key={tbl.name} className="bg-black rounded-lg border border-neutral-800 overflow-hidden shadow-2xl space-y-0">
                      {/* Table Title Bar */}
                      <div className="p-3 bg-[#171717] border-b border-neutral-800 flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Table className="w-3.5 h-3.5 text-white" />
                          COLECCIÓN: {tbl.name.toUpperCase()}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-black text-neutral-300 border border-neutral-800 font-bold">
                          {tbl.columnsCount} campos
                        </span>
                      </div>

                      {/* Technical Columns Table View */}
                      <div className="p-3 space-y-2 text-xs">
                        <table className="w-full text-left font-mono text-[11px]">
                          <thead>
                            <tr className="border-b border-neutral-800 text-neutral-500 font-bold text-[10px]">
                              <th className="pb-1.5">CAMPO</th>
                              <th className="pb-1.5">TIPO</th>
                              <th className="pb-1.5 text-right">ÍNDICE</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-900">
                            <tr>
                              <td className="py-1 text-white font-bold">_id</td>
                              <td className="py-1 text-neutral-400">ObjectId</td>
                              <td className="py-1 text-right text-neutral-400 font-bold">PK</td>
                            </tr>
                            <tr>
                              <td className="py-1 text-white font-bold">titulo / nombre</td>
                              <td className="py-1 text-neutral-400">String</td>
                              <td className="py-1 text-right text-neutral-500">INDEX</td>
                            </tr>
                            <tr>
                              <td className="py-1 text-white font-bold">creadoEn</td>
                              <td className="py-1 text-neutral-400">Date</td>
                              <td className="py-1 text-right text-neutral-600">-</td>
                            </tr>
                            <tr>
                              <td className="py-1 text-white font-bold">estado</td>
                              <td className="py-1 text-neutral-400">String</td>
                              <td className="py-1 text-right text-neutral-600">-</td>
                            </tr>
                          </tbody>
                        </table>

                        {tbl.relations.length > 0 && (
                          <div className="pt-2 border-t border-neutral-900 flex items-center gap-1.5 text-[10px] text-neutral-400">
                            <span>Relaciones / Foreign Keys:</span>
                            <span className="text-white font-bold">{tbl.relations.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-500 text-xs">Este nodo no posee tablas o modelos de base de datos directos.</p>
                )}
              </div>
            )}

            {/* TAB 5: ENV VARS */}
            {activeTab === 'env' && (
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                    VARIABLES DE ENTORNO ({selectedNode.envVars?.length || 0})
                  </span>
                  <button
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="p-1 text-neutral-400 hover:text-white flex items-center gap-1 text-[10px]"
                  >
                    {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showSecrets ? 'OCULTAR' : 'REVELAR'}
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedNode.envVars && selectedNode.envVars.length > 0 ? (
                    selectedNode.envVars.map(v => (
                      <div key={v.key} className="p-3 bg-black rounded border border-neutral-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs font-mono">{v.key}</span>
                          {v.isSecret && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-300 border border-neutral-800 flex items-center gap-1 font-bold">
                              <Lock className="w-2.5 h-2.5" /> SECRETO
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate">
                          {v.isSecret && !showSecrets ? '••••••••••••••••' : v.sampleValue || '***'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-500">Sin variables de entorno asociadas.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // PROJECT GLOBAL FICHA TÉCNICA
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-bold block">
              FICHA TÉCNICA Y AUTENTICACIÓN GIT
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight mt-1">
              {project.name}
            </h2>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed font-sans">
              {project.description}
            </p>
          </div>

          {/* User & Git Account Ownership Card */}
          <div className="p-4 bg-black border border-neutral-800 rounded-lg space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-neutral-500 uppercase text-[10px] font-bold">PROPIETARIO DE PROYECTO:</span>
              <span className="px-2 py-0.5 rounded bg-white text-black font-bold flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-black" /> @{project.gitInfo?.owner || 'Sebaxis07'}
              </span>
            </div>

            {project.gitInfo?.remoteUrl && (
              <div className="space-y-1 pt-1">
                <span className="text-neutral-500 uppercase text-[10px] font-bold block">REPOSITORIO REMOTO:</span>
                <a
                  href={project.gitInfo.remoteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white hover:underline truncate block font-bold text-[11px] flex items-center gap-1"
                >
                  <GitBranch className="w-3 h-3" /> {project.gitInfo.remoteUrl} <ExternalLink className="w-3 h-3 text-neutral-500" />
                </a>
              </div>
            )}

            <div className="flex justify-between text-neutral-400 pt-1">
              <span>RAMA ACTIVA:</span>
              <span className="text-white font-bold">{project.branch || project.gitInfo?.currentBranch || 'main'}</span>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <span className="text-neutral-500 uppercase text-[10px] font-bold block">STACK PRINCIPAL</span>
            <div className="flex flex-wrap gap-1.5">
              {project.primaryStack.map(st => (
                <span key={st} className="px-2.5 py-1 rounded bg-black text-white font-bold border border-neutral-800">
                  {st}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 bg-black rounded-lg border border-neutral-800 space-y-2 font-mono text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>ESTADO VINCULADO:</span>
              <span className="text-white font-bold uppercase">🟢 SINCRONIZADO CON GIT</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>COMPLEJIDAD:</span>
              <span className="text-white font-bold">{project.complexityScore} / 100</span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <span className="text-neutral-500 uppercase text-[10px] font-bold block">TAREAS DE OPS / REFACTORES</span>
            {project.pendingTasks && project.pendingTasks.length > 0 ? (
              <ul className="space-y-1.5 text-neutral-300">
                {project.pendingTasks.map((t, idx) => (
                  <li key={idx} className="p-2 bg-[#171717] rounded border border-neutral-800 flex items-start gap-2 text-[11px]">
                    <span className="text-white font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-neutral-500">Sin tareas pendientes registradas.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
