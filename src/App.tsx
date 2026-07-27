import { useState, useEffect } from 'react';
import type { Project, ArchNode, LayerViewMode, UserProfile } from './types/architecture';
import { INITIAL_PROJECTS } from './data/mockProjects';
import { ArchitectureGraph } from './components/ArchitectureGraph';
import { TechSpecSidebar } from './components/TechSpecSidebar';
import { RadarView } from './components/RadarView';
import { CompareView } from './components/CompareView';
import { FolderTreeSidebar } from './components/FolderTreeSidebar';
import { SnapshotManager } from './components/SnapshotManager';
import { ExportModal } from './components/ExportModal';
import { GitAuthModal } from './components/GitAuthModal';
import { GitRepoSuggestionsModal } from './components/GitRepoSuggestionsModal';
import { UserProfileWidget } from './components/UserProfileWidget';
import { ImportProgressModal } from './components/ImportProgressModal';
import { CommitHistoryModal } from './components/CommitHistoryModal';
import { scanNativeDirectoryHandle } from './services/scanner';
import { fetchUserProjectsCloud, syncProjectCloud, clearStoredAuthToken } from './services/apiClient';
import { 
  Menu, 
  X, 
  Compass, 
  GitBranch, 
  HardDrive, 
  RefreshCw, 
  History, 
  Download, 
  ChevronRight,
  FolderGit2,
  Maximize2,
  Sparkles,
  GitCommit
} from 'lucide-react';

const STORAGE_KEY_PROJECTS = 'arkhet_projects_v9';
const STORAGE_KEY_ACTIVE_ID = 'arkhet_active_project_id_v9';
const STORAGE_KEY_USER_PROFILE = 'arkhet_user_profile_v9';

// STRICT DEDUPLICATION: Prevents visual glitching and repeating project cards
function deduplicateProjects(projs: Project[]): Project[] {
  const seen = new Set<string>();
  return projs.filter(p => {
    if (!p || !p.name) return false;
    const nameKey = p.name.toLowerCase().trim();
    const key = `${p.id || ''}:${nameKey}`;
    if (seen.has(key) || seen.has(nameKey)) return false;
    seen.add(key);
    seen.add(nameKey);
    return true;
  });
}

export function App() {
  // Projects & Active View State
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return deduplicateProjects(parsed);
      }
    } catch (e) {
      console.warn('Could not parse local projects:', e);
    }
    return deduplicateProjects(INITIAL_PROJECTS);
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (savedId && savedId !== 'null') return savedId;
    } catch (e) {}
    return null;
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {}
    return null;
  });

  // Layer & Node Selection
  const [layerView, setLayerView] = useState<LayerViewMode>('logical');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Modals & Drawers
  const [showComparator, setShowComparator] = useState(false);
  const [showSnapshotManager, setShowSnapshotManager] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGitAuthModal, setShowGitAuthModal] = useState(false);
  const [showRepoSuggestionsModal, setShowRepoSuggestionsModal] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Background Scanning State
  const [activeImportTask, setActiveImportTask] = useState<{
    repoName: string;
    percent: number;
    stepText: string;
    isMinimized: boolean;
  } | null>(null);

  // Live Auto-Sync
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);
  const [isSyncingLive, setIsSyncingLive] = useState(false);

  // Cloud Pull Projects on User Auth
  useEffect(() => {
    async function pullCloudProjects() {
      if (userProfile && userProfile.email) {
        setIsSyncingLive(true);
        const cloudProjs = await fetchUserProjectsCloud();
        if (cloudProjs.length > 0) {
          setProjects(prev => deduplicateProjects([...cloudProjs, ...prev]));
        }
        setIsSyncingLive(false);
      }
    }
    pullCloudProjects();
  }, [userProfile?.email]);

  // Persist State
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(deduplicateProjects(projects)));
    } catch (e) {}
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeProjectId || 'null');
    } catch (e) {}
  }, [activeProjectId]);

  useEffect(() => {
    try {
      if (userProfile) localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(userProfile));
      else {
        localStorage.removeItem(STORAGE_KEY_USER_PROFILE);
        clearStoredAuthToken();
      }
    } catch (e) {}
  }, [userProfile]);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;
  const selectedNode = activeProject?.nodes.find(n => n.id === selectedNodeId) || null;

  // Sync Active Project Cloud
  useEffect(() => {
    if (activeProject && isAutoSyncEnabled && userProfile?.email) {
      setIsSyncingLive(true);
      const timer = setTimeout(async () => {
        await syncProjectCloud(activeProject);
        setIsSyncingLive(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeProject, isAutoSyncEnabled, userProfile?.email]);

  // Handle Native Local Folder Selection
  const handleOpenLocalDirectoryTop = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker();
        if (handle) {
          setActiveImportTask({
            repoName: handle.name,
            percent: 15,
            stepText: `Analizando disco local: ${handle.name}...`,
            isMinimized: false
          });

          const newProj = await scanNativeDirectoryHandle(handle, (percent, stepText) => {
            setActiveImportTask(prev => prev ? { ...prev, percent, stepText } : null);
          });

          newProj.userId = userProfile?.email;
          setProjects(prev => deduplicateProjects([newProj, ...prev]));
          setActiveProjectId(newProj.id);
          setActiveImportTask(null);
        }
      } else {
        alert('Tu navegador no soporta el acceso directo a carpetas locales. Usa Google Chrome o Edge.');
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.warn('Error reading local directory:', e);
      }
      setActiveImportTask(null);
    }
  };

  const handleStartBackgroundImport = (repoName: string, promise: Promise<Project>) => {
    setActiveImportTask({
      repoName,
      percent: 10,
      stepText: 'Iniciando escaneo de disco/API...',
      isMinimized: false
    });

    if ((promise as any).subscribeProgress) {
      (promise as any).subscribeProgress((percent: number, stepText: string) => {
        setActiveImportTask(prev => prev ? { ...prev, percent, stepText } : null);
      });
    }

    promise.then((newProj) => {
      newProj.userId = userProfile?.email;
      setProjects(prev => deduplicateProjects([newProj, ...prev]));
      setActiveProjectId(newProj.id);
      setActiveImportTask(null);
      if (userProfile?.email) {
        syncProjectCloud(newProj);
      }
    }).catch(err => {
      console.error('Error importing project:', err);
      setActiveImportTask(null);
    });
  };

  // Node Mutations
  const handleUpdateNode = (updatedNode: ArchNode) => {
    if (!activeProject) return;
    const updatedNodes = activeProject.nodes.map(n => n.id === updatedNode.id ? updatedNode : n);
    const updatedProject = { ...activeProject, nodes: updatedNodes, updatedAt: new Date().toISOString() };
    setProjects(prev => deduplicateProjects(prev.map(p => p.id === activeProject.id ? updatedProject : p)));
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!activeProject) return;
    const updatedNodes = activeProject.nodes.filter(n => n.id !== nodeId);
    const updatedEdges = activeProject.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    const updatedProject = { ...activeProject, nodes: updatedNodes, edges: updatedEdges, updatedAt: new Date().toISOString() };
    setProjects(prev => deduplicateProjects(prev.map(p => p.id === activeProject.id ? updatedProject : p)));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const handleAddNode = () => {
    if (!activeProject) return;
    const newNode: ArchNode = {
      id: `node-${Date.now()}`,
      label: 'Nuevo Servicio',
      category: 'backend',
      clusterId: 'zone-be',
      description: 'Microservicio recién añadido al mapa',
      x: 450,
      y: 200,
      techStack: ['Node.js', 'Express.js'],
      status: 'healthy'
    };
    const updatedProject = { ...activeProject, nodes: [...activeProject.nodes, newNode], updatedAt: new Date().toISOString() };
    setProjects(prev => deduplicateProjects(prev.map(p => p.id === activeProject.id ? updatedProject : p)));
    setSelectedNodeId(newNode.id);
  };

  const handleSaveSnapshot = () => {
    if (!activeProject) return;
    const newSnap = {
      id: `snap-${Date.now()}`,
      versionLabel: `v1.${(activeProject.snapshots?.length || 0) + 1}`,
      date: new Date().toISOString().split('T')[0],
      notes: 'Snapshot guardado por el usuario',
      nodes: activeProject.nodes,
      edges: activeProject.edges
    };
    const updatedProject = { ...activeProject, snapshots: [...(activeProject.snapshots || []), newSnap] };
    setProjects(prev => deduplicateProjects(prev.map(p => p.id === activeProject.id ? updatedProject : p)));
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => deduplicateProjects(prev.filter(p => p.id !== projectId)));
    if (activeProjectId === projectId) setActiveProjectId(null);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0A0A0A] text-neutral-100 overflow-hidden font-sans select-none">
      {/* NAVBAR HEADER */}
      <header className="h-14 sm:h-16 bg-[#0D0D0D] border-b border-neutral-800 px-3 sm:px-6 flex items-center justify-between shrink-0 relative z-50 font-mono shadow-2xl">
        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
          <div 
            onClick={() => { setActiveProjectId(null); setSelectedNodeId(null); }}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
          >
            <div className="relative shrink-0">
              <img 
                src="/logo.png" 
                alt="Arkhet Logo" 
                className="h-7 sm:h-9 w-auto object-contain rounded transition-transform group-hover:scale-105 border border-neutral-800"
              />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full border border-[#0D0D0D] animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full border border-[#0D0D0D]" />
            </div>

            <div className="flex flex-col shrink-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-white tracking-wider text-xs sm:text-base font-mono leading-none">ARKHET</span>
                <span className="hidden sm:inline px-1.5 py-0.2 text-[8px] font-mono bg-neutral-900 text-neutral-400 border border-neutral-800 rounded font-bold">
                  v2.0 OS
                </span>
              </div>
              <span className="hidden sm:inline text-[9px] text-neutral-500 font-mono tracking-tighter">GRAFO VIVO DE ARQUITECTURA</span>
            </div>
          </div>

          {activeProject ? (
            <div className="flex items-center gap-1 sm:gap-2 font-mono text-[11px] sm:text-xs pl-2 sm:pl-3 border-l border-neutral-800 overflow-hidden">
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-600 shrink-0" />
              <div className="flex items-center gap-1.5 bg-black px-2.5 py-0.5 sm:py-1 rounded-full border border-neutral-800 text-white font-bold overflow-hidden">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                <span className="truncate max-w-[110px] sm:max-w-[160px] md:max-w-[220px] uppercase tracking-wide text-[10px] sm:text-xs">
                  {activeProject.name}
                </span>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 font-mono text-[11px] pl-3 border-l border-neutral-800 text-neutral-500">
              <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
              <span className="flex items-center gap-1 text-neutral-400 font-bold">
                <Compass className="w-3.5 h-3.5 text-white" /> VISTA GLOBAL DE ECOSISTEMA
              </span>
            </div>
          )}
        </div>

        {/* Center Segment */}
        <div className="hidden md:flex items-center bg-black p-1 rounded-lg border border-neutral-800/90 shadow-inner gap-1 text-xs">
          <button
            onClick={() => { setActiveProjectId(null); setSelectedNodeId(null); }}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              !activeProjectId
                ? 'bg-white text-black shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> ECOSISTEMA MAPA
          </button>

          <button
            onClick={() => setShowComparator(true)}
            className="px-3 py-1.5 rounded-md font-bold transition-all text-neutral-400 hover:text-white hover:bg-neutral-900 flex items-center gap-1.5"
          >
            <GitBranch className="w-3.5 h-3.5" /> COMPARAR
          </button>

          <button
            onClick={handleOpenLocalDirectoryTop}
            className="px-3 py-1.5 rounded-md font-bold transition-all text-neutral-400 hover:text-white hover:bg-neutral-900 flex items-center gap-1.5"
          >
            <HardDrive className="w-3.5 h-3.5" /> CARPETA LOCAL
          </button>
        </div>

        {/* Right Segment */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          {activeImportTask && activeImportTask.isMinimized && (
            <button
              onClick={() => setActiveImportTask(prev => prev ? { ...prev, isMinimized: false } : null)}
              className="px-3 py-1.5 rounded-md bg-white text-black font-bold flex items-center gap-2 animate-pulse shadow-lg"
              title="Expandir progreso de escaneo"
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              DESCARGANDO {activeImportTask.repoName}... {activeImportTask.percent}%
              <Maximize2 className="w-3 h-3 ml-1" />
            </button>
          )}

          {userProfile && (
            <button
              onClick={() => setShowRepoSuggestionsModal(true)}
              className="px-3 py-1.5 rounded-md bg-[#171717] hover:bg-neutral-800 text-white font-bold border border-neutral-700 flex items-center gap-1.5 transition-colors"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-white" />
              REPOS @{userProfile.username}
            </button>
          )}

          {activeProject && (
            <div className="flex items-center gap-2 border-l border-neutral-800 pl-3">
              <button
                onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
                className={`p-2 rounded-md border font-bold flex items-center gap-1.5 transition-all ${
                  isAutoSyncEnabled
                    ? 'bg-neutral-900 text-white border-neutral-700'
                    : 'bg-black text-neutral-500 border-neutral-800'
                }`}
                title={isAutoSyncEnabled ? 'Auto-Sync Activo en Vivo' : 'Auto-Sync Pausado'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLive ? 'animate-spin text-white' : 'text-neutral-400'}`} />
              </button>

              <button
                onClick={() => setShowCommitModal(true)}
                className="px-2.5 py-1.5 rounded-md bg-black hover:bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 font-bold flex items-center gap-1.5 transition-colors"
                title="Historial de Commits de GitHub"
              >
                <GitCommit className="w-3.5 h-3.5 text-neutral-400" />
                <span className="hidden xl:inline">COMMITS</span>
              </button>

              <button
                onClick={() => setShowSnapshotManager(true)}
                className="px-2.5 py-1.5 rounded-md bg-black hover:bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 font-bold flex items-center gap-1.5 transition-colors"
                title="Historial de Snapshots"
              >
                <History className="w-3.5 h-3.5 text-neutral-400" />
                <span className="hidden xl:inline">SNAPSHOTS</span> ({activeProject.snapshots?.length || 0})
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                className="px-2.5 py-1.5 rounded-md bg-black hover:bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 font-bold flex items-center gap-1.5 transition-colors"
                title="Exportar Mapa"
              >
                <Download className="w-3.5 h-3.5 text-neutral-400" />
                <span className="hidden xl:inline">EXPORTAR</span>
              </button>
            </div>
          )}

          <div className="pl-3 border-l border-neutral-800">
            <UserProfileWidget 
              user={userProfile} 
              onOpenGitAuth={() => setShowGitAuthModal(true)}
              onLogout={() => {
                setUserProfile(null);
                clearStoredAuthToken();
              }}
            />
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 text-neutral-300 hover:text-white rounded bg-black border border-neutral-800"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Main Body Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        {showComparator ? (
          <CompareView 
            projects={projects}
            activeProject={activeProject || projects[0]}
            onBackToRadar={() => setShowComparator(false)}
          />
        ) : !activeProjectId ? (
          <RadarView 
            projects={projects}
            activeImportTask={activeImportTask}
            onSelectProject={(proj) => { setActiveProjectId(proj.id); setSelectedNodeId(null); }}
            onOpenScanner={handleOpenLocalDirectoryTop}
            onOpenComparator={() => setShowComparator(true)}
            onDeleteProject={handleDeleteProject}
          />
        ) : (
          <div className="flex-1 flex w-full h-full overflow-hidden">
            {/* Left Sidebar: Folder Tree Sidebar */}
            <FolderTreeSidebar 
              folderStructure={activeProject!.folderStructure || []}
              layerView={layerView}
              onChangeLayerView={setLayerView}
              onBackToRadar={() => setActiveProjectId(null)}
              projectName={activeProject!.name}
            />

            {/* Center Canvas */}
            <ArchitectureGraph 
              nodes={activeProject!.nodes}
              edges={activeProject!.edges}
              clusters={activeProject!.clusters}
              selectedNodeId={selectedNodeId}
              layerView={layerView}
              onSelectNode={setSelectedNodeId}
              onNodesChange={(updatedNodes) => {
                const updatedProject = { ...activeProject!, nodes: updatedNodes, updatedAt: new Date().toISOString() };
                setProjects(prev => deduplicateProjects(prev.map(p => p.id === activeProject!.id ? updatedProject : p)));
              }}
              onAddNode={handleAddNode}
            />

            {/* Right Tech Spec Sidebar Inspector */}
            <TechSpecSidebar 
              project={activeProject!}
              selectedNode={selectedNode}
              onCloseNodeSelection={() => setSelectedNodeId(null)}
              onUpdateNode={handleUpdateNode}
              onDeleteNode={handleDeleteNode}
            />
          </div>
        )}
      </div>

      {/* Modals & Overlays */}
      {showCommitModal && activeProject && userProfile && (
        <CommitHistoryModal
          project={activeProject}
          user={userProfile}
          onClose={() => setShowCommitModal(false)}
        />
      )}

      {showSnapshotManager && activeProject && (
        <SnapshotManager
          project={activeProject}
          onClose={() => setShowSnapshotManager(false)}
          onRestoreSnapshot={(snap: any) => {
            const restoredProject = { ...activeProject, nodes: snap.nodes, edges: snap.edges, updatedAt: new Date().toISOString() };
            setProjects(prev => deduplicateProjects(prev.map(p => p.id === activeProject.id ? restoredProject : p)));
            setShowSnapshotManager(false);
          }}
          onSaveSnapshot={handleSaveSnapshot}
        />
      )}

      {showExportModal && activeProject && (
        <ExportModal 
          project={activeProject}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showGitAuthModal && (
        <GitAuthModal 
          onLoginSuccess={(prof: any) => { setUserProfile(prof); setShowGitAuthModal(false); }}
          onClose={() => setShowGitAuthModal(false)}
        />
      )}

      {showRepoSuggestionsModal && userProfile && (
        <GitRepoSuggestionsModal 
          user={userProfile}
          onImportStart={handleStartBackgroundImport}
          onClose={() => setShowRepoSuggestionsModal(false)}
        />
      )}

      {activeImportTask && (
        <ImportProgressModal
          repoName={activeImportTask.repoName}
          percent={activeImportTask.percent}
          stepText={activeImportTask.stepText}
          onMinimize={() => setActiveImportTask(prev => prev ? { ...prev, isMinimized: true } : null)}
        />
      )}
    </div>
  );
}
