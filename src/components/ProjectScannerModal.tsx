import React, { useState } from 'react';
import type { Project } from '../types/architecture';
import { autoGenerateProjectFromManifests, scanNativeDirectoryHandle } from '../services/scanner';
import { Folder, Upload, X, CheckCircle2, Zap, HardDrive } from 'lucide-react';

interface ProjectScannerModalProps {
  onImportProject: (project: Project) => void;
  onClose: () => void;
}

export const ProjectScannerModal: React.FC<ProjectScannerModalProps> = ({ onImportProject, onClose }) => {
  const [scannedFiles, setScannedFiles] = useState<{ name: string; content: string }[]>([]);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [isScanningNative, setIsScanningNative] = useState(false);

  // Native HTML5 File System Directory Picker API
  const handleOpenLocalDirectory = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        setIsScanningNative(true);
        setScanStatus('Escaneando estructura y manifests de la carpeta local...');
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'read'
        });
        const project = await scanNativeDirectoryHandle(dirHandle);
        onImportProject(project);
        onClose();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          alert('Error al acceder a la carpeta local: ' + err.message);
        }
      } finally {
        setIsScanningNative(false);
      }
    } else {
      alert('Tu navegador no soporta showDirectoryPicker. Utiliza el selector manual a continuación.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: { name: string; content: string }[] = [];
    let readCount = 0;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string || '';
        fileList.push({ name: file.name, content });
        readCount++;

        if (readCount === files.length) {
          setScannedFiles(fileList);
          setScanStatus(`Archivos leídos correctamente: ${fileList.length} (${fileList.map(f => f.name).join(', ')})`);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleRunScanner = () => {
    if (scannedFiles.length > 0) {
      const generated = autoGenerateProjectFromManifests(scannedFiles);
      onImportProject(generated);
      onClose();
    } else {
      const demoFiles = [
        {
          name: 'package.json',
          content: JSON.stringify({
            name: 'copiloto-voz-agentes',
            dependencies: { react: '19', next: '15', '@prisma/client': '5', express: '4', redis: '7' }
          })
        },
        {
          name: '.env.example',
          content: 'DATABASE_URL=postgresql://user:pass@localhost:5432/voice_db\nJWT_SECRET=supersecretkey\nDEEPGRAM_API_KEY=dg_***'
        },
        {
          name: 'schema.prisma',
          content: 'model SesionVoz {\n  id String\n  audioUrl String\n  user Usuario\n}\nmodel Usuario {\n id String\n name String\n}'
        }
      ];
      const generated = autoGenerateProjectFromManifests(demoFiles);
      onImportProject(generated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-neutral-800 rounded-lg w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl font-sans">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-[#171717]">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded bg-white text-black">
              <HardDrive className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-mono font-bold text-white uppercase">CONECTAR SISTEMA DE ARCHIVOS LOCAL</h2>
              <p className="text-xs text-neutral-400 font-mono">Lector directo de carpetas sin subir ZIPs ni enviar archivos fuera de tu equipo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Direct Folder Connection Banner */}
          <div className="p-6 bg-black border border-white/20 rounded-lg space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <Folder className="w-4 h-4 text-white" /> Conectar Carpeta Raíz de tu PC
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                LECTURA LOCAL
              </span>
            </div>

            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Selecciona cualquier carpeta de tu proyecto (<code className="text-white">C:\Users\...\tu-proyecto</code>). La app escaneará localmente archivos de configuración (<code className="text-white">package.json</code>, <code className="text-white">schema.prisma</code>, <code className="text-white">Dockerfile</code>) sin enviar ningún dato a servidores externos.
            </p>

            <button
              onClick={handleOpenLocalDirectory}
              disabled={isScanningNative}
              className="w-full py-3 rounded bg-white text-black hover:bg-neutral-200 font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <HardDrive className="w-4 h-4" />
              {isScanningNative ? 'ESCANEANDO CARPETA LOCAL...' : 'SELECCIONAR CARPETA LOCAL (SHOWDIRECTORYPICKER)'}
            </button>
          </div>

          <div className="relative border-t border-neutral-800 pt-4">
            <span className="text-xs font-mono font-bold text-neutral-500 uppercase block mb-3">
              O bien, arrastra archivos manifest sueltos:
            </span>

            <div className="p-6 border border-dashed border-neutral-800 hover:border-neutral-500 bg-black rounded flex flex-col items-center justify-center text-center transition-colors relative cursor-pointer group">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-white mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-xs font-mono font-bold text-white uppercase">Arrastra archivos manifest aquí</h3>
              <p className="text-[11px] text-neutral-500 mt-1 font-mono">
                Sube <code className="text-neutral-300">package.json</code>, <code className="text-neutral-300">schema.prisma</code>, o <code className="text-neutral-300">Dockerfile</code>
              </p>
            </div>
          </div>

          {scanStatus && (
            <div className="p-3 bg-neutral-900 border border-neutral-700 text-white rounded text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
              {scanStatus}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-neutral-800 font-mono">
            <span className="text-xs text-neutral-500">
              SOPORTA: NODE.JS, PRISMA, DOCKER, PYTHON, GO
            </span>

            <button
              onClick={handleRunScanner}
              className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {scannedFiles.length > 0 ? 'GENERAR GRAFO DE ARCHIVOS' : 'GENERAR DEMO'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
