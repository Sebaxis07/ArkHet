import React, { useState } from 'react';
import type { FolderItem, LayerViewMode, NodeCategory } from '../types/architecture';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  ChevronRight, 
  ChevronDown, 
  ArrowLeft,
  Sliders
} from 'lucide-react';

interface FolderTreeSidebarProps {
  folderStructure: FolderItem[];
  layerView: LayerViewMode;
  onChangeLayerView: (mode: LayerViewMode) => void;
  onSelectNodeCategory?: (category: NodeCategory) => void;
  onBackToRadar: () => void;
  projectName: string;
}

export const FolderTreeSidebar: React.FC<FolderTreeSidebarProps> = ({
  folderStructure,
  layerView,
  onChangeLayerView,
  onSelectNodeCategory,
  onBackToRadar,
  projectName
}) => {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ 'f-src': true, 'f1': true, 'f5': true, 'f-be': true });

  const toggleFolder = (id: string) => {
    setOpenFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderFolderItem = (item: FolderItem, depth = 0) => {
    const isOpen = openFolders[item.id];
    const isFolder = item.type === 'folder';

    return (
      <div key={item.id} style={{ paddingLeft: `${depth * 14}px` }}>
        <div
          onClick={() => {
            if (isFolder) toggleFolder(item.id);
            if (item.nodeCategory && onSelectNodeCategory) {
              onSelectNodeCategory(item.nodeCategory);
            }
          }}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-neutral-800 cursor-pointer text-xs font-mono text-neutral-300 hover:text-white transition-colors group"
        >
          {isFolder ? (
            <>
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white" />
              )}
              {isOpen ? (
                <FolderOpen className="w-4 h-4 text-white" />
              ) : (
                <Folder className="w-4 h-4 text-neutral-400" />
              )}
            </>
          ) : (
            <>
              <span className="w-3.5" />
              <FileCode className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300" />
            </>
          )}

          <span className="truncate">{item.name}</span>

          {item.nodeCategory && (
            <span className="ml-auto px-1.5 py-0.2 rounded text-[10px] bg-black text-neutral-400 border border-neutral-800 uppercase font-mono">
              {item.nodeCategory}
            </span>
          )}
        </div>

        {isFolder && isOpen && item.children && (
          <div className="space-y-0.5">
            {item.children.map(child => renderFolderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-72 h-full bg-[#121212] border-r border-neutral-800 flex flex-col z-10 text-neutral-200 font-sans">
      <div className="p-4 border-b border-neutral-800 space-y-3 bg-[#171717]">
        <button
          onClick={onBackToRadar}
          className="px-3 py-1.5 rounded bg-black hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono font-semibold border border-neutral-800 transition-all flex items-center gap-1.5 w-full"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          VOLVER AL RADAR
        </button>

        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-bold">Sistema Activo</span>
          <h2 className="text-sm font-bold text-white truncate">{projectName}</h2>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="p-3 border-b border-neutral-800 bg-black space-y-2">
        <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 flex items-center gap-1 font-bold">
          <Sliders className="w-3 h-3 text-white" /> Modo de Vista Real
        </span>
        <div className="grid grid-cols-3 gap-1 bg-[#171717] p-1 rounded border border-neutral-800 font-mono">
          <button
            onClick={() => onChangeLayerView('logical')}
            className={`py-1 rounded text-xs font-bold transition-all ${
              layerView === 'logical' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Lógica
          </button>
          <button
            onClick={() => onChangeLayerView('physical')}
            className={`py-1 rounded text-xs font-bold transition-all ${
              layerView === 'physical' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Física
          </button>
          <button
            onClick={() => onChangeLayerView('code')}
            className={`py-1 rounded text-xs font-bold transition-all ${
              layerView === 'code' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Código
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 block mb-2 font-bold">
          Estructura de Código & Directorios
        </span>

        <div className="space-y-0.5">
          {folderStructure.length > 0 ? (
            folderStructure.map(item => renderFolderItem(item))
          ) : (
            <div className="text-xs text-neutral-500 font-mono p-2">Sin directorio personalizado mapeado.</div>
          )}
        </div>
      </div>
    </div>
  );
};
