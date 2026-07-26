import React, { useState } from 'react';
import type { Project, ArchitectureSnapshot } from '../types/architecture';
import { History, Plus, X, Clock, GitCommit } from 'lucide-react';

interface SnapshotManagerProps {
  project: Project;
  onSaveSnapshot: (versionLabel: string, notes: string) => void;
  onRestoreSnapshot: (snapshot: ArchitectureSnapshot) => void;
  onClose: () => void;
}

export const SnapshotManager: React.FC<SnapshotManagerProps> = ({
  project,
  onSaveSnapshot,
  onRestoreSnapshot,
  onClose
}) => {
  const [versionLabel, setVersionLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (versionLabel.trim()) {
      onSaveSnapshot(versionLabel, notes);
      setVersionLabel('');
      setNotes('');
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-neutral-800 rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl font-sans">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-[#171717]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded bg-white text-black">
              <History className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-mono font-bold text-white tracking-wide uppercase">HISTORIAL DE SNAPSHOTS Y VERSIONES</h2>
              <p className="text-xs text-neutral-400 font-mono">Guarda versiones antes y después de refactorizar para seguir la evolución técnica</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-3 rounded border border-dashed border-neutral-700 bg-black hover:bg-neutral-900 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> GUARDAR SNAPSHOT DE ARQUITECTURA ACTUAL
            </button>
          ) : (
            <form onSubmit={handleCreate} className="p-4 rounded bg-black border border-neutral-800 space-y-3 font-mono">
              <h4 className="text-xs font-bold text-white uppercase">Datos del Nuevo Snapshot</h4>
              <input
                type="text"
                placeholder="Etiqueta de versión (ej. v2.0 División en Microservicios)"
                value={versionLabel}
                onChange={e => setVersionLabel(e.target.value)}
                required
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white placeholder-neutral-500"
              />
              <textarea
                placeholder="Notas de arquitectura, objetivos del refactor..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-xs text-white placeholder-neutral-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded text-xs bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded text-xs font-bold bg-white text-black"
                >
                  GUARDAR SNAPSHOT
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            <span className="text-xs uppercase font-mono text-neutral-500 font-bold block">Historial de Snapshots Guardados</span>

            {project.snapshots && project.snapshots.length > 0 ? (
              <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-800">
                {project.snapshots.map(snap => (
                  <div key={snap.id} className="relative pl-10 p-4 rounded bg-black border border-neutral-800 flex items-start justify-between">
                    <div className="absolute left-2.5 top-5 -translate-x-1/2 p-1 rounded-full bg-neutral-900 border border-white text-white">
                      <GitCommit className="w-3.5 h-3.5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{snap.versionLabel}</span>
                        <span className="text-[11px] font-mono text-neutral-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {snap.date}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">{snap.notes || 'Sin notas adjuntas'}</p>
                      <div className="text-[11px] font-mono text-neutral-500 pt-1">
                        Capturados: {snap.nodes?.length || project.nodes.length} nodos, {snap.edges?.length || project.edges.length} conexiones
                      </div>
                    </div>

                    <button
                      onClick={() => onRestoreSnapshot(snap)}
                      className="px-3 py-1.5 rounded text-xs font-mono font-bold bg-white hover:bg-neutral-200 text-black transition-colors"
                    >
                      CARGAR SNAPSHOT
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 font-mono">No hay snapshots guardados en el historial.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
