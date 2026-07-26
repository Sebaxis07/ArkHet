import React, { useState } from 'react';
import type { Project, ArchNode, Endpoint } from '../types/architecture';
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
  Table,
  Layout,
  Code2,
  Terminal,
  Cloud,
  CheckCircle,
  AlertCircle
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
  // Tab State
  const [activeTab, setActiveTab] = useState<string>('default');
  const [showSecrets, setShowSecrets] = useState(false);

  // New Endpoint Form State
  const [newMethod, setNewMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | 'WS'>('GET');
  const [newPath, setNewPath] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isAddingEndpoint, setIsAddingEndpoint] = useState(false);

  // Deployment Config State inside Sidebar
  const [editUrl, setEditUrl] = useState(selectedNode?.deploymentUrl || selectedNode?.domainUrl || '');
  const [editProvider, setEditProvider] = useState(selectedNode?.cloudProvider || selectedNode?.hosting || 'Vercel Serverless');

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
      case 'cloud': return <Cloud className="w-4 h-4 text-white" />;
      default: return <Layers className="w-4 h-4 text-white" />;
    }
  };

  const handleToggleDeployed = (isDeployed: boolean) => {
    if (!selectedNode) return;
    const updated: ArchNode = {
      ...selectedNode,
      isDeployed,
      deploymentUrl: isDeployed ? (editUrl || selectedNode.domainUrl || `https://${project.name.toLowerCase().replace(/\s+/g, '')}.vercel.app`) : undefined,
      cloudProvider: isDeployed ? editProvider : undefined
    };
    onUpdateNode(updated);
  };

  const handleSaveDeploymentInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;
    const updated: ArchNode = {
      ...selectedNode,
      isDeployed: true,
      deploymentUrl: editUrl,
      cloudProvider: editProvider
    };
    onUpdateNode(updated);
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

  // Category Tabs Definition (Includes DESPLIEGUE tab for all nodes)
  const renderCategoryTabs = () => {
    if (!selectedNode) return null;
    const cat = selectedNode.category;

    const commonTabs = [{ id: 'deploy', label: '🌐 DESPLIEGUE' }];

    if (cat === 'frontend') {
      return [
        ...commonTabs,
        { id: 'ui', label: 'VISTAS & UI' },
        { id: 'consumed_api', label: 'CONSUMO API' },
        { id: 'stack', label: 'PAQUETES' }
      ];
    } else if (cat === 'backend') {
      return [
        ...commonTabs,
        { id: 'endpoints', label: `ENDPOINTS (${selectedNode.endpoints?.length || 0})` },
        { id: 'services', label: `SERVICIOS (${selectedNode.subNodes?.length || 0})` },
        { id: 'env', label: 'VARS ENV' },
        { id: 'stack', label: 'STACK' }
      ];
    } else if (cat === 'database') {
      return [
        ...commonTabs,
        { id: 'tables', label: `ESQUEMAS DB (${selectedNode.tables?.length || 0})` },
        { id: 'performance', label: 'PERFORMANCE' },
        { id: 'stack', label: 'DRIVER' }
      ];
    } else if (cat === 'microservice') {
      return [
        ...commonTabs,
        { id: 'ai_models', label: 'MOTOR IA' },
        { id: 'services', label: 'FASTAPI/SERVICES' },
        { id: 'stack', label: 'PAQUETES PYTHON' }
      ];
    } else if (cat === 'queue') {
      return [
        ...commonTabs,
        { id: 'queue_events', label: 'EVENTOS & QUEUES' },
        { id: 'workers', label: 'WORKERS' },
        { id: 'stack', label: 'BROKER STACK' }
      ];
    } else if (cat === 'auth') {
      return [
        ...commonTabs,
        { id: 'identity', label: 'PROVEEDOR SSO' },
        { id: 'env', label: 'KEYS & SECRETS' },
        { id: 'stack', label: 'AUTH STACK' }
      ];
    } else if (cat === 'storage') {
      return [
        ...commonTabs,
        { id: 'buckets', label: 'BUCKETS & S3' },
        { id: 'permissions', label: 'PERMISOS' },
        { id: 'stack', label: 'STORAGE STACK' }
      ];
    } else if (cat === 'devops') {
      return [
        ...commonTabs,
        { id: 'docker', label: 'CONTAINERS DOCKER' },
        { id: 'pipeline', label: 'CI/CD PIPELINE' },
        { id: 'stack', label: 'INFRA STACK' }
      ];
    } else {
      return [
        ...commonTabs,
        { id: 'stack', label: 'STACK' },
        { id: 'subnodes', label: `MÓDULOS (${selectedNode.subNodes?.length || 0})` }
      ];
    }
  };

  const tabs = renderCategoryTabs() || [];
  const currentTab = tabs.some(t => t.id === activeTab) ? activeTab : tabs[0]?.id || 'deploy';

  return (
    <div className="w-80 h-full bg-[#121212] border-l border-neutral-800 flex flex-col z-20 font-sans text-neutral-200 select-none">
      {selectedNode ? (
        // CATEGORY-SPECIFIC NODE INSPECTOR
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Node Inspector Header */}
          <div className="p-5 border-b border-neutral-800 bg-[#171717] space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase bg-black text-white border border-neutral-800 font-bold">
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
              <h2 className="text-base font-bold text-white tracking-tight leading-snug font-mono">
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

            {/* Operational Status Selector */}
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

          {/* Navigation Category Tabs */}
          <div className="flex border-b border-neutral-800 bg-black font-mono text-[11px] overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2 font-bold whitespace-nowrap border-b-2 transition-all ${
                  currentTab === t.id ? 'border-white text-white bg-[#171717]' : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
            {/* USER DEPLOYMENT CONFIRMATION TAB (DESPLIEGUE) */}
            {currentTab === 'deploy' && (
              <div className="space-y-4 font-mono">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">
                  CONFIRMACIÓN Y ENLACE DE DESPLIEGUE EN VIVO
                </span>

                {/* User Confirmation Toggle Card */}
                <div className="p-3 bg-black rounded border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300">ESTADO DE PRODUCCIÓN:</span>
                    {selectedNode.isDeployed ? (
                      <span className="px-2 py-0.5 bg-white text-black font-bold rounded text-[10px] flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-black" /> 🟢 DESPLEGADO EN NUBE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-neutral-900 text-neutral-400 font-bold rounded border border-neutral-800 text-[10px] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-neutral-500" /> ⚪ SOLO EN LOCAL
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-neutral-900">
                    <button
                      type="button"
                      onClick={() => handleToggleDeployed(false)}
                      className={`flex-1 py-1.5 rounded text-[11px] font-bold transition-all border ${
                        !selectedNode.isDeployed ? 'bg-neutral-800 text-white border-neutral-600' : 'bg-black text-neutral-500 border-neutral-800'
                      }`}
                    >
                      SOLO LOCAL
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleDeployed(true)}
                      className={`flex-1 py-1.5 rounded text-[11px] font-bold transition-all ${
                        selectedNode.isDeployed ? 'bg-white text-black' : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                      }`}
                    >
                      🟢 DESPLEGADO
                    </button>
                  </div>
                </div>

                {/* Deployment Config Form */}
                {selectedNode.isDeployed ? (
                  <form onSubmit={handleSaveDeploymentInfo} className="p-3.5 bg-black border border-neutral-800 rounded-lg space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase font-bold block">
                        URL pública en vivo (Live Production Domain):
                      </label>
                      <input
                        type="url"
                        value={editUrl}
                        onChange={e => setEditUrl(e.target.value)}
                        placeholder="https://tu-proyecto.vercel.app"
                        className="w-full px-3 py-1.5 bg-[#171717] border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase font-bold block">
                        Proveedor Cloud Hosting:
                      </label>
                      <select
                        value={editProvider}
                        onChange={e => setEditProvider(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#171717] border border-neutral-800 rounded text-xs text-white font-mono font-bold focus:outline-none"
                      >
                        <option value="Vercel Serverless Network">Vercel Serverless</option>
                        <option value="Render Cloud API">Render.com</option>
                        <option value="Railway App Platform">Railway.app</option>
                        <option value="MongoDB Atlas Cloud Cluster">MongoDB Atlas Cloud</option>
                        <option value="AWS EC2 / S3 Storage">AWS Cloud (S3 / EC2)</option>
                        <option value="Cloudinary Media Storage">Cloudinary</option>
                        <option value="Fly.io Container Platform">Fly.io</option>
                        <option value="Servidor VPS / Auto-Alojado">Servidor VPS Propio</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-1">
                      {editUrl && (
                        <a
                          href={editUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2 bg-white text-black font-bold rounded text-[11px] text-center flex items-center justify-center gap-1.5 hover:bg-neutral-200 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-black" />
                          PROBAR URL EN VIVO
                        </a>
                      )}
                      <button
                        type="submit"
                        className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded text-[11px]"
                      >
                        GUARDAR
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 bg-black border border-neutral-800 rounded-lg text-center space-y-2">
                    <Cloud className="w-6 h-6 mx-auto text-neutral-500" />
                    <p className="text-[11px] text-neutral-400 font-mono">
                      Este nodo está configurado como <strong>SOLO LOCAL</strong>. Si ya lo desplegaste en Vercel, Render o MongoDB Atlas, haz clic en el botón superior para ingresar su enlace en vivo.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* FRONTEND SPECIFIC TEMPLATE */}
            {selectedNode.category === 'frontend' && (
              <>
                {currentTab === 'ui' && (
                  <div className="space-y-3 font-mono">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-bold block">
                      VISTAS Y COMPONENTES VISUALES EN CLIENTE
                    </span>

                    <div className="space-y-2">
                      {selectedNode.subNodes && selectedNode.subNodes.length > 0 ? (
                        selectedNode.subNodes.map(sn => (
                          <div key={sn.id} className="p-3 bg-black rounded border border-neutral-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                                <Layout className="w-3.5 h-3.5 text-white" />
                                {sn.label}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 font-bold">
                                {sn.linesOfCode || 120} LoC
                              </span>
                            </div>
                            {sn.details && (
                              <span className="text-[10px] text-neutral-500 block truncate">{sn.details}</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-neutral-500 text-xs">Sin vistas de componentes mapeadas.</p>
                      )}
                    </div>
                  </div>
                )}

                {currentTab === 'consumed_api' && (
                  <div className="space-y-3 font-mono">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-bold block">
                      CONSUMO DE RUTAS API (HTTP CLIENT)
                    </span>

                    <div className="p-3 bg-black rounded border border-neutral-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-neutral-300">
                        <span className="font-bold">Cliente HTTP:</span>
                        <span className="text-white font-bold">Axios / Fetch API</span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-300">
                        <span className="font-bold">Backend Target:</span>
                        <span className="text-white font-bold">http://localhost:5000/api</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 bg-black rounded border border-neutral-800 font-mono text-[11px] space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-white text-black font-bold text-[9px]">POST</span>
                          <span className="text-white font-bold">/api/auth/login</span>
                        </div>
                        <span className="text-[10px] text-neutral-400">Autenticación de sesión de usuario</span>
                      </div>
                      <div className="p-2.5 bg-black rounded border border-neutral-800 font-mono text-[11px] space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-neutral-800 text-white font-bold text-[9px] border border-neutral-700">GET</span>
                          <span className="text-white font-bold">/api/projects</span>
                        </div>
                        <span className="text-[10px] text-neutral-400">Carga de proyectos del mapa</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* BACKEND SPECIFIC TEMPLATE */}
            {selectedNode.category === 'backend' && (
              <>
                {currentTab === 'endpoints' && (
                  <div className="space-y-4 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                        RUTAS API DETECTADAS ({selectedNode.endpoints?.length || 0})
                      </span>
                      <button
                        onClick={() => setIsAddingEndpoint(!isAddingEndpoint)}
                        className="px-2 py-1 bg-white text-black font-bold text-[10px] rounded flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> NUEVO
                      </button>
                    </div>

                    {isAddingEndpoint && (
                      <form onSubmit={handleAddEndpointSubmit} className="p-3 bg-black border border-neutral-800 rounded space-y-2 text-xs">
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

                    <div className="space-y-2">
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
                            {ep.parameters && ep.parameters.length > 0 && (
                              <div className="text-[10px] text-neutral-400 font-mono">
                                Parámetros URL: <span className="text-white font-bold">{ep.parameters.join(', ')}</span>
                              </div>
                            )}
                            {ep.description && (
                              <p className="text-[11px] text-neutral-400 font-sans">{ep.description}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-neutral-500">Sin endpoints registrados en este nodo.</p>
                      )}
                    </div>
                  </div>
                )}

                {currentTab === 'services' && (
                  <div className="space-y-3 font-mono">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">
                      CONTROLADORES Y SERVICIOS BACKEND
                    </span>

                    <div className="space-y-2">
                      {selectedNode.subNodes && selectedNode.subNodes.length > 0 ? (
                        selectedNode.subNodes.map(sn => (
                          <div key={sn.id} className="p-3 bg-black rounded border border-neutral-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                                <Code2 className="w-3.5 h-3.5 text-white" />
                                {sn.label}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 font-bold">
                                {sn.linesOfCode || 180} LoC
                              </span>
                            </div>
                            {sn.details && (
                              <span className="text-[10px] text-neutral-500 block truncate">{sn.details}</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-neutral-500 text-xs">Sin controladores registrados.</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* DATABASE SPECIFIC TEMPLATE (Deep Field Extractor) */}
            {selectedNode.category === 'database' && (
              <>
                {currentTab === 'tables' && (
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
                                {tbl.sampleFields && tbl.sampleFields.length > 0 ? (
                                  tbl.sampleFields.map(f => (
                                    <tr key={f.name}>
                                      <td className="py-1 text-white font-bold">{f.name}</td>
                                      <td className="py-1 text-neutral-400">{f.type}</td>
                                      <td className="py-1 text-right text-neutral-400 font-bold">
                                        {f.isPk ? 'PK' : f.isIndexed ? 'INDEX' : '-'}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <>
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
                                  </>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-neutral-500 text-xs">Sin esquemas registrados.</p>
                    )}
                  </div>
                )}

                {currentTab === 'performance' && (
                  <div className="space-y-3 font-mono">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold block">
                      RENDIMIENTO Y MÉTRICAS DE BASE DE DATOS
                    </span>

                    <div className="p-3 bg-black rounded border border-neutral-800 space-y-2 text-xs">
                      <div className="flex justify-between text-neutral-300">
                        <span>Puerto DB:</span>
                        <span className="text-white font-bold">:{selectedNode.port || 27017}</span>
                      </div>
                      <div className="flex justify-between text-neutral-300">
                        <span>Cluster:</span>
                        <span className="text-white font-bold">MongoDB Atlas M10 Dedicated</span>
                      </div>
                      <div className="flex justify-between text-neutral-300">
                        <span>Estado de Índices:</span>
                        <span className="text-white font-bold">OPTIMIZADO (B-TREE)</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* SHARED COMMON STACK & ENV VARS TAB */}
            {currentTab === 'stack' && (
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-bold block">
                  TECNOLOGÍAS Y PAQUETES DETECTADOS
                </span>

                <div className="space-y-2">
                  {selectedNode.techStack && selectedNode.techStack.length > 0 ? (
                    selectedNode.techStack.map(ts => (
                      <div key={ts} className="p-3 bg-black rounded border border-neutral-800 flex items-center justify-between font-mono">
                        <span className="font-bold text-white text-xs">{ts}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800 font-bold">
                          ACTIVO
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-neutral-500 font-mono">Sin tecnologías registradas.</p>
                  )}
                </div>
              </div>
            )}

            {currentTab === 'env' && (
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
        // GLOBAL PROJECT SPEC SHEET
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-bold block">
              FICHA TÉCNICA Y AUTENTICACIÓN GIT
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight mt-1 font-mono">
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
        </div>
      )}
    </div>
  );
};
