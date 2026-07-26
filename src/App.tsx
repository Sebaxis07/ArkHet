import { useState, useEffect, useRef } from 'react';
import type { Project, ArchNode, LayerViewMode, ArchitectureSnapshot, UserProfile } from './types/architecture';
import { INITIAL_PROJECTS } from './data/mockProjects';
import { RadarView } from './components/RadarView';
import { ArchitectureGraph } from './components/ArchitectureGraph';
import { FolderTreeSidebar } from './components/FolderTreeSidebar';
import { TechSpecSidebar } from './components/TechSpecSidebar';
import { ProjectComparator } from './components/ProjectComparator';
import { SnapshotManager } from './components/SnapshotManager';
import { ExportModal } from './components/ExportModal';
import { ProjectScannerModal } from './components/ProjectScannerModal';
import { ArchIntelligenceOverlay } from './components/ArchIntelligenceOverlay';
import { GitAuthModal } from './components/GitAuthModal';
import { UserProfileWidget } from './components/UserProfileWidget';
import { GitRepoSuggestionsModal } from './components/GitRepoSuggestionsModal';
import { ImportProgressModal } from './components/ImportProgressModal';
import { scanNativeDirectoryHandle } from './services/scanner';
import { 
  Download, 
  History, 
  GitBranch, 
  HardDrive,
  RefreshCw,
  FolderGit2,
  Sparkles,
  Maximize2,
  Menu,
  X,
  SlidersHorizontal,
  FolderTree
} from 'lucide-react';

const LOCAL_STORAGE_KEY_PROJECTS = 'project_architecture_os_projects_v9';
const LOCAL_STORAGE_KEY_ACTIVE_ID = 'project_architecture_os_active_id_v9';
const LOCAL_STORAGE_KEY_USER = 'project_architecture_os_user_v9';

export function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {
      console.warn('Could not read user profile from localStorage:', e);
    }
    return null;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read saved projects from localStorage:', e);
    }
    return INITIAL_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    try {
      const savedId = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_ID);
      return savedId || null;
    } catch (e) {
      return null;
    }
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [layerView, setLayerView] = useState<LayerViewMode>('logical');

  // Mobile Drawer State
  const [isLeftSidebarOpenMobile, setIsLeftSidebarOpenMobile] = useState(false);
  const [isRightSidebarOpenMobile, setIsRightSidebarOpenMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-Sync Watcher State
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState<boolean>(true);
  const [isSyncingLive, setIsSyncingLive] = useState<boolean>(false);
  const dirHandlesMap = useRef<Record<string, any>>({});

  // Background Scanning & Import Progress State
  const [activeImportTask, setActiveImportTask] = useState<{
    repoName: string;
    percent: number;
    stepText: string;
    isMinimized: boolean;
  } | null>(null);

  // Modals
  const [showScanner, setShowScanner] = useState(false);
  const [showComparator, setShowComparator] = useState(false);
  const [showSnapshotManager, setShowSnapshotManager] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showGitAuthModal, setShowGitAuthModal] = useState(false);
  const [showRepoSuggestionsModal, setShowRepoSuggestionsModal] = useState(false);

  useEffect(() => {
    try {
      if (userProfile) {
        localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(userProfile));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
      }
    } catch (e) {
      console.warn('Could not save user profile:', e);
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.warn('Could not save projects to localStorage:', e);
    }
  }, [projects]);

  useEffect(() => {
    try {
      if (activeProjectId) {
        localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_ID, activeProjectId);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY_ACTIVE_ID);
      }
    } catch (e) {
      console.warn('Could not save active project ID to localStorage:', e);
    }
  }, [activeProjectId]);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;
  const selectedNode = activeProject?.nodes.find(n => n.id === selectedNodeId) || null;

  // Background Live Watcher Effect
  useEffect(() => {
    if (!isAutoSyncEnabled || !activeProjectId) return;

    const interval = setInterval(async () => {
      const activeHandle = dirHandlesMap.current[activeProjectId];
      if (activeHandle) {
        try {
          setIsSyncingLive(true);
          const updatedProj = await scanNativeDirectoryHandle(activeHandle);
          dirHandlesMap.current[updatedProj.id] = activeHandle;
          
          setProjects(prev => prev.map(p => p.id === activeProjectId ? {
            ...updatedProj,
            id: activeProjectId,
            userId: userProfile?.id || p.userId,
            gitInfo: {
              ...updatedProj.gitInfo,
              owner: userProfile?.username || p.gitInfo?.owner,
              isLinkedToUser: !!userProfile
            },
            nodes: updatedProj.nodes,
            folderStructure: updatedProj.folderStructure
          } : p));
        } catch (e) {
          // Silent catch for live watcher
        } finally {
          setTimeout(() => setIsSyncingLive(false), 800);
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoSyncEnabled, activeProjectId, userProfile]);

  const handleStartBackgroundImport = (repoName: string, promise: Promise<Project>) => {
    setActiveImportTask({
      repoName,
      percent: 10,
      stepText: 'Iniciando escaneo de disco/API...',
      isMinimized: false
    });

    if ((promise as any).subscribeProgress) {
      (promise as any).subscribeProgress((pct: number, text: string) => {
        setActiveImportTask(prev => prev ? { ...prev, percent: pct, stepText: text } : null);
      });
    }

    promise.then(newProject => {
      handleImportProject(newProject);
      setTimeout(() => {
        setActiveImportTask(null);
      }, 1200);
    }).catch(err => {
      alert('Error en el escaneo de repositorio: ' + err.message);
      setActiveImportTask(null);
    });
  };

  const handleOpenLocalDirectoryTop = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
        
        let progressCb: ((pct: number, text: string) => void) | null = null;
        
        const scanPromise = scanNativeDirectoryHandle(dirHandle, (pct, text) => {
          if (progressCb) progressCb(pct, text);
        });

        (scanPromise as any).subscribeProgress = (cb: (pct: number, text: string) => void) => {
          progressCb = cb;
        };

        handleStartBackgroundImport(`CARPETA LOCAL (${dirHandle.name})`, scanPromise);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          alert('Error al acceder a la carpeta local: ' + err.message);
        }
      }
    } else {
      setShowScanner(true);
    }
  };

  const handleUpdateNodes = (newNodes: ArchNode[]) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, nodes: newNodes } : p));
  };

  const handleUpdateSingleNode = (updatedNode: ArchNode) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          nodes: p.nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
        };
      }
      return p;
    }));
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          nodes: p.nodes.filter(n => n.id !== nodeId),
          edges: p.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
        };
      }
      return p;
    }));
    setSelectedNodeId(null);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
  };

  const handleAddCustomNode = () => {
    if (!activeProjectId || !activeProject) return;
    const newNodeId = `node-custom-${Date.now()}`;
    const newNode: ArchNode = {
      id: newNodeId,
      label: 'Nuevo Servicio Modulado',
      category: 'backend',
      description: 'Componente de arquitectura recién agregado',
      x: 480,
      y: 260,
      techStack: ['Node.js'],
      status: 'healthy',
      subNodes: [
        { id: `sn-${Date.now()}-1`, label: 'CustomController', type: 'controller' },
        { id: `sn-${Date.now()}-2`, label: 'CustomService', type: 'service' }
      ]
    };
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, nodes: [...p.nodes, newNode] } : p));
    setSelectedNodeId(newNodeId);
  };

  const handleSaveSnapshot = (versionLabel: string, notes: string) => {
    if (!activeProjectId || !activeProject) return;
    const newSnapshot: ArchitectureSnapshot = {
      id: `snap-${Date.now()}`,
      versionLabel,
      date: new Date().toISOString().split('T')[0],
      notes,
      nodes: [...activeProject.nodes],
      edges: [...activeProject.edges]
    };
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, snapshots: [newSnapshot, ...(p.snapshots || [])] };
      }
      return p;
    }));
  };

  const handleRestoreSnapshot = (snapshot: ArchitectureSnapshot) => {
    if (!activeProjectId || !snapshot.nodes) return;
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, nodes: snapshot.nodes, edges: snapshot.edges };
      }
      return p;
    }));
  };

  const handleImportProject = (newProject: Project) => {
    if ((newProject as any)._dirHandle) {
      dirHandlesMap.current[newProject.id] = (newProject as any)._dirHandle;
    }
    const projectWithUser: Project = {
      ...newProject,
      userId: userProfile?.id,
      gitInfo: {
        ...newProject.gitInfo,
        owner: userProfile?.username || newProject.gitInfo?.owner,
        isLinkedToUser: !!userProfile
      }
    };

    setProjects(prev => {
      const existsIndex = prev.findIndex(p => p.name === newProject.name);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = projectWithUser;
        return copy;
      }
      return [projectWithUser, ...prev];
    });
    setActiveProjectId(projectWithUser.id);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setUserProfile(user);
    setShowGitAuthModal(false);
    setShowRepoSuggestionsModal(true);
  };

  const handleLogoutFull = () => {
    setUserProfile(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0A0A0A] text-neutral-100 overflow-hidden font-sans select-none">
      {/* Top Responsive Navbar */}
      <header className="h-14 bg-[#121212] border-b border-neutral-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 font-mono">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => { setActiveProjectId(null); setSelectedNodeId(null); }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <img 
              src="/logo.png" 
              alt="Arkhet Logo" 
              className="h-7 sm:h-8 w-auto object-contain rounded transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-bold text-white tracking-widest text-xs sm:text-sm font-mono leading-none">ARKHET</span>
              <span className="text-[8px] sm:text-[9px] text-neutral-400 font-mono tracking-tighter">ARCHITECTURE OS</span>
            </div>
          </div>

          {activeProject && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono pl-4 border-l border-neutral-800">
              <span className="text-neutral-600">/</span>
              <span className="px-2 py-0.5 rounded bg-black text-white border border-neutral-800 font-bold uppercase truncate max-w-[140px] lg:max-w-[220px]">
                {activeProject.name}
              </span>
            </div>
          )}
        </div>

        {/* Global Toolbar (Desktop View) */}
        <div className="hidden lg:flex items-center gap-2.5 text-xs">
          {/* Active Background Scan Badge */}
          {activeImportTask && activeImportTask.isMinimized && (
            <button
              onClick={() => setActiveImportTask(prev => prev ? { ...prev, isMinimized: false } : null)}
              className="px-3 py-1.5 rounded bg-white text-black font-bold flex items-center gap-1.5 animate-pulse"
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
              className="px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-white font-bold border border-neutral-700 flex items-center gap-1.5"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-white" />
              REPOS DE @{userProfile.username}
            </button>
          )}

          {activeProject && (
            <>
              {/* Auto-Sync Live Watcher Toggle */}
              <button
                onClick={() => setIsAutoSyncEnabled(!isAutoSyncEnabled)}
                className={`px-3 py-1.5 rounded border font-bold flex items-center gap-1.5 transition-all ${
                  isAutoSyncEnabled
                    ? 'bg-neutral-900 text-white border-neutral-700'
                    : 'bg-black text-neutral-500 border-neutral-800'
                }`}
                title="Sincronización en Vivo Automática"
              >
                <span className={`w-2 h-2 rounded-full ${isAutoSyncEnabled ? 'bg-white animate-pulse' : 'bg-neutral-600'}`} />
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLive ? 'animate-spin text-white' : 'text-neutral-400'}`} />
                {isAutoSyncEnabled ? 'AUTO-SYNC ACTIVO' : 'AUTO-SYNC PAUSADO'}
              </button>

              <button
                onClick={() => setShowSnapshotManager(true)}
                className="px-3 py-1.5 rounded bg-black hover:bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 transition-colors flex items-center gap-1.5 font-bold"
              >
                <History className="w-3.5 h-3.5 text-neutral-400" />
                SNAPSHOTS ({activeProject.snapshots?.length || 0})
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                className="px-3 py-1.5 rounded bg-black hover:bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 transition-colors flex items-center gap-1.5 font-bold"
              >
                <Download className="w-3.5 h-3.5 text-neutral-400" />
                EXPORTAR
              </button>
            </>
          )}

          <button
            onClick={() => setShowComparator(true)}
            className="px-3 py-1.5 rounded bg-black hover:bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800 transition-colors flex items-center gap-1.5 font-bold"
          >
            <GitBranch className="w-3.5 h-3.5 text-neutral-400" />
            COMPARAR
          </button>

          <button
            onClick={handleOpenLocalDirectoryTop}
            className="px-3 py-1.5 rounded bg-white hover:bg-neutral-200 text-black font-bold flex items-center gap-1.5"
          >
            <HardDrive className="w-3.5 h-3.5" />
            CONECTAR CARPETA LOCAL (PC)
          </button>

          {/* User Profile Widget */}
          <div className="pl-2 border-l border-neutral-800">
            <UserProfileWidget
              user={userProfile}
              onOpenGitAuth={() => setShowGitAuthModal(true)}
              onLogout={handleLogoutFull}
            />
          </div>
        </div>

        {/* Mobile Hamburger Controls */}
        <div className="flex lg:hidden items-center gap-2">
          {activeProject && (
            <button
              onClick={() => setIsLeftSidebarOpenMobile(!isLeftSidebarOpenMobile)}
              className="p-2 bg-neutral-900 border border-neutral-800 rounded text-neutral-300 hover:text-white"
              title="Árbol de Archivos"
            >
              <FolderTree className="w-4 h-4" />
            </button>
          )}

          {activeProject && (
            <button
              onClick={() => setIsRightSidebarOpenMobile(!isRightSidebarOpenMobile)}
              className="p-2 bg-neutral-900 border border-neutral-800 rounded text-neutral-300 hover:text-white"
              title="Ficha Técnica Inspector"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-[#171717] border border-neutral-800 rounded text-white"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#121212] border-b border-neutral-800 p-4 space-y-3 font-mono text-xs z-40">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <UserProfileWidget
              user={userProfile}
              onOpenGitAuth={() => { setIsMobileMenuOpen(false); setShowGitAuthModal(true); }}
              onLogout={handleLogoutFull}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setIsMobileMenuOpen(false); handleOpenLocalDirectoryTop(); }}
              className="p-2.5 bg-white text-black font-bold rounded flex items-center justify-center gap-1.5"
            >
              <HardDrive className="w-3.5 h-3.5" /> CARPETA LOCAL
            </button>

            <button
              onClick={() => { setIsMobileMenuOpen(false); setShowComparator(true); }}
              className="p-2.5 bg-neutral-900 border border-neutral-800 text-white font-bold rounded flex items-center justify-center gap-1.5"
            >
              <GitBranch className="w-3.5 h-3.5" /> COMPARAR
            </button>

            {userProfile && (
              <button
                onClick={() => { setIsMobileMenuOpen(false); setShowRepoSuggestionsModal(true); }}
                className="col-span-2 p-2.5 bg-neutral-900 border border-neutral-800 text-white font-bold rounded flex items-center justify-center gap-1.5"
              >
                <FolderGit2 className="w-3.5 h-3.5" /> REPOS DE @{userProfile.username}
              </button>
            )}

            {activeProject && (
              <>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); setShowSnapshotManager(true); }}
                  className="p-2.5 bg-black border border-neutral-800 text-neutral-300 font-bold rounded flex items-center justify-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5" /> SNAPSHOTS
                </button>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); setShowExportModal(false); }}
                  className="p-2.5 bg-black border border-neutral-800 text-neutral-300 font-bold rounded flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> EXPORTAR
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {!activeProject ? (
          <RadarView
            projects={projects}
            activeImportTask={activeImportTask}
            onSelectProject={p => setActiveProjectId(p.id)}
            onOpenScanner={() => setShowScanner(true)}
            onOpenComparator={() => setShowComparator(true)}
            onImportProject={handleImportProject}
            onDeleteProject={handleDeleteProject}
          />
        ) : (
          <>
            {/* Left Sidebar - Desktop & Responsive Mobile Drawer */}
            <div className={`
              fixed lg:static inset-y-14 left-0 z-40 transition-transform duration-300 ease-in-out
              ${isLeftSidebarOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <FolderTreeSidebar
                folderStructure={activeProject.folderStructure}
                layerView={layerView}
                onChangeLayerView={setLayerView}
                onBackToRadar={() => { setActiveProjectId(null); setSelectedNodeId(null); setIsLeftSidebarOpenMobile(false); }}
                projectName={activeProject.name}
              />
            </div>

            {/* Central Architecture Canvas Graph */}
            <ArchitectureGraph
              nodes={activeProject.nodes}
              edges={activeProject.edges}
              clusters={activeProject.clusters || []}
              selectedNodeId={selectedNodeId}
              layerView={layerView}
              onSelectNode={id => { setSelectedNodeId(id); setIsRightSidebarOpenMobile(true); }}
              onNodesChange={handleUpdateNodes}
              onAddNode={handleAddCustomNode}
            />

            {/* Right Sidebar - Desktop & Responsive Mobile Drawer */}
            <div className={`
              fixed lg:static inset-y-14 right-0 z-40 transition-transform duration-300 ease-in-out
              ${isRightSidebarOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
              <TechSpecSidebar
                project={activeProject}
                selectedNode={selectedNode}
                onCloseNodeSelection={() => { setSelectedNodeId(null); setIsRightSidebarOpenMobile(false); }}
                onUpdateNode={handleUpdateSingleNode}
                onDeleteNode={handleDeleteNode}
              />
            </div>

            {/* Mobile Backdrop for Drawers */}
            {(isLeftSidebarOpenMobile || isRightSidebarOpenMobile) && (
              <div 
                onClick={() => { setIsLeftSidebarOpenMobile(false); setIsRightSidebarOpenMobile(false); }}
                className="lg:hidden fixed inset-0 bg-black/60 z-30 backdrop-blur-sm"
              />
            )}

            {/* Bottom Overlay - Architecture Intelligence & Risk Diagnosis */}
            <ArchIntelligenceOverlay
              risks={activeProject.risks || []}
              complexityScore={activeProject.complexityScore}
              onSelectRiskTarget={nodeId => { setSelectedNodeId(nodeId); setIsRightSidebarOpenMobile(true); }}
            />
          </>
        )}
      </main>

      {/* Import Progress Modal */}
      {activeImportTask && !activeImportTask.isMinimized && (
        <ImportProgressModal
          repoName={activeImportTask.repoName}
          percent={activeImportTask.percent}
          stepText={activeImportTask.stepText}
          onMinimize={() => setActiveImportTask(prev => prev ? { ...prev, isMinimized: true } : null)}
        />
      )}

      {/* Modals */}
      {showGitAuthModal && (
        <GitAuthModal
          onLoginSuccess={handleLoginSuccess}
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

      {showScanner && (
        <ProjectScannerModal
          onImportProject={handleImportProject}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showComparator && (
        <ProjectComparator
          projects={projects}
          onClose={() => setShowComparator(false)}
        />
      )}

      {showSnapshotManager && activeProject && (
        <SnapshotManager
          project={activeProject}
          onSaveSnapshot={handleSaveSnapshot}
          onRestoreSnapshot={handleRestoreSnapshot}
          onClose={() => setShowSnapshotManager(false)}
        />
      )}

      {showExportModal && activeProject && (
        <ExportModal
          project={activeProject}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
