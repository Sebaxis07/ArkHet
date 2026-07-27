import React, { useState } from 'react';
import type { Project } from '../types/architecture';
import { generatePostmanCollection, generateMockJsonResponse, generateJestTestSuite } from '../services/apiMockService';
import { 
  X, 
  Play, 
  Download, 
  Copy, 
  Check, 
  Zap, 
  Sparkles
} from 'lucide-react';

interface ApiMockServerModalProps {
  project: Project;
  onClose: () => void;
}

export const ApiMockServerModal: React.FC<ApiMockServerModalProps> = ({
  project,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'tester' | 'postman' | 'jest'>('tester');
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const endpoints = (project.nodes || []).flatMap(n => (n.endpoints || []).map(ep => ({ ...ep, nodeLabel: n.label })));
  const currentEndpoint = endpoints.find(e => e.id === selectedEndpointId) || endpoints[0] || { id: 'ep-1', method: 'GET', path: '/api/v1/health', description: 'Probe', nodeLabel: 'Backend' };

  const handleTestEndpoint = () => {
    setIsTesting(true);
    setTimeout(() => {
      const mockRes = generateMockJsonResponse(currentEndpoint);
      setTestResult(mockRes);
      setIsTesting(false);
    }, 400);
  };

  const handleDownloadPostman = () => {
    const collection = generatePostmanCollection(project);
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postman-collection-${project.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJest = () => {
    const code = generateJestTestSuite(project);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded border border-neutral-800">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                SERVIDOR DE MOCKS API & SUITE DE PRUEBAS POSTMAN
              </h2>
              <span className="text-[10px] text-neutral-400 font-sans block">
                Simulación REST y exportación de colecciones Postman/Jest para <span className="text-white font-bold">{project.name}</span>
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-800 bg-black text-xs">
          {[
            { id: 'tester', label: '⚡ TESTER MOCK REST' },
            { id: 'postman', label: '🚀 EXPORTAR A POSTMAN (v2.1)' },
            { id: 'jest', label: '🧪 CÓDIGO TEST JEST / SUPERTEST' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2.5 font-bold border-b-2 transition-all ${
                activeTab === t.id ? 'border-white text-white bg-[#141414]' : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: TESTER MOCK REST */}
        {activeTab === 'tester' && (
          <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
            {/* Left: Endpoints List */}
            <div className="p-3 bg-black border border-neutral-800 rounded-lg space-y-2 overflow-y-auto">
              <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">ENDPOINTS DETECTADOS ({endpoints.length})</span>
              {endpoints.map(ep => (
                <div
                  key={ep.id}
                  onClick={() => { setSelectedEndpointId(ep.id); setTestResult(null); }}
                  className={`p-2.5 rounded border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    (selectedEndpointId === ep.id || (!selectedEndpointId && ep.id === currentEndpoint.id))
                      ? 'bg-[#171717] border-white text-white'
                      : 'bg-[#0D0D0D] border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="space-y-0.5 truncate">
                    <span className="font-bold block truncate">{ep.path}</span>
                    <span className="text-[9px] text-neutral-500">{ep.nodeLabel}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-black border border-neutral-700 text-white font-bold text-[9px]">
                    {ep.method}
                  </span>
                </div>
              ))}
            </div>

            {/* Right: Interactive Mock Tester */}
            <div className="p-4 bg-black border border-neutral-800 rounded-lg space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-neutral-500 block">PRUEBA DE PETICIÓN SIMULADA</span>
                <div className="p-2.5 bg-[#141414] rounded border border-neutral-800 flex items-center justify-between text-xs font-bold text-white">
                  <span>{currentEndpoint.method} {currentEndpoint.path}</span>
                  <span className="text-[9px] text-neutral-400">STATUS 200 OK</span>
                </div>

                <button
                  onClick={handleTestEndpoint}
                  disabled={isTesting}
                  className="w-full py-2 bg-white text-black font-bold text-xs rounded hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  {isTesting ? 'EJECUTANDO INFERENCIA MOCK...' : 'EJECUTAR PETICIÓN MOCK'}
                </button>
              </div>

              {testResult && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block">RESPUESTA MOCK (JSON):</span>
                  <pre className="p-3 bg-[#141414] border border-neutral-800 rounded text-xs text-neutral-300 font-mono overflow-auto max-h-48 leading-relaxed">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: POSTMAN EXPORT */}
        {activeTab === 'postman' && (
          <div className="space-y-4 font-mono">
            <div className="p-4 bg-black border border-neutral-800 rounded-lg space-y-3">
              <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white" /> COLECCIÓN POSTMAN v2.1 LISTA PARA IMPORTAR
              </h3>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                Descarga el archivo JSON completo con todas las rutas, encabezados de autenticación JWT y payloads simulados.
              </p>
              <button
                onClick={handleDownloadPostman}
                className="px-4 py-2 bg-white text-black font-bold text-xs rounded hover:bg-neutral-200 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-black" />
                DESCARGAR COLECCIÓN POSTMAN (v2.1)
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: JEST TEST SUITE CODE */}
        {activeTab === 'jest' && (
          <div className="space-y-3 font-mono flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-neutral-500">
                SUITE DE PRUEBAS DE INTEGRACIÓN EN JEST / SUPERTEST
              </span>
              <button
                onClick={handleCopyJest}
                className="px-3 py-1.5 bg-white text-black font-bold text-xs rounded hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'CÓDIGO COPIADO' : 'COPIAR CÓDIGO'}
              </button>
            </div>

            <pre className="flex-1 p-4 bg-black border border-neutral-800 rounded-lg text-xs text-neutral-300 font-mono overflow-auto leading-relaxed">
              {generateJestTestSuite(project)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
