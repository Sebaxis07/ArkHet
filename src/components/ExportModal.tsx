import React, { useState } from 'react';
import type { Project } from '../types/architecture';
import { Download, FileText, Code, Check, Copy, X } from 'lucide-react';

interface ExportModalProps {
  project: Project;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ project, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'json' | 'mermaid'>('markdown');

  const generateMermaidGraph = () => {
    let code = 'graph TD\n';
    project.nodes.forEach(n => {
      const shape = n.category === 'database' ? `[("${n.label}")]` : n.category === 'frontend' ? `["${n.label}"]` : `("${n.label}")`;
      code += `  ${n.id.replace(/[-]/g, '_')}${shape}\n`;
    });
    project.edges.forEach(e => {
      const src = e.source.replace(/[-]/g, '_');
      const tgt = e.target.replace(/[-]/g, '_');
      const lbl = e.label ? `|"${e.label}"|` : '';
      code += `  ${src} -->${lbl} ${tgt}\n`;
    });
    return code;
  };

  const generateMarkdownDoc = () => {
    return `# Especificación Técnica de Arquitectura: ${project.name}

> ${project.description}

## 🚀 Resumen del Stack Tecnológico
- **Stack Principal**: ${project.primaryStack.join(', ')}
- **Categoría**: ${project.category}
- **Estado de Salud**: ${project.healthStatus.toUpperCase()}
- **Puntuación de Complejidad**: ${project.complexityScore} / 100

---

## 📐 Diagrama de Grafo de Arquitectura (Mermaid.js)

\`\`\`mermaid
${generateMermaidGraph()}\`\`\`

---

## ⚙️ Desglose de Nodos y Servicios

${project.nodes.map(n => `### ${n.label} (\`${n.category}\`)
- **Descripción**: ${n.description}
- **Stack Tecnológico**: ${n.techStack?.join(', ') || 'N/A'}
- **Puerto**: \`:${n.port || 'N/A'}\`
- **Target de Despliegue**: ${n.hosting || 'N/A'}
- **Endpoints**:
${n.endpoints?.map(ep => `  - \`${ep.method}\` \`${ep.path}\`: ${ep.description || ''}`).join('\n') || '  - Ninguno'}
`).join('\n')}

---
*Generado automáticamente por Arkhet el ${new Date().toISOString().split('T')[0]}*
`;
  };

  const getContentToExport = () => {
    if (exportFormat === 'markdown') return generateMarkdownDoc();
    if (exportFormat === 'mermaid') return generateMermaidGraph();
    return JSON.stringify(project, null, 2);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getContentToExport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = getContentToExport();
    const ext = exportFormat === 'json' ? 'json' : exportFormat === 'mermaid' ? 'mmd' : 'md';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arkhet-${project.name.toLowerCase().replace(/\s+/g, '-')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-neutral-800 rounded-lg w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl font-sans">
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-[#171717]">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Arkhet Logo" className="h-8 w-auto object-contain" />
            <div>
              <h2 className="text-base font-mono font-bold text-white uppercase">ARKHET - EXPORTAR DOCUMENTACIÓN TÉCNICA</h2>
              <p className="text-xs text-neutral-400 font-mono">Genera especificaciones Markdown vivas, diagramas Mermaid o esquemas JSON</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-black border-b border-neutral-800 flex items-center justify-between font-mono">
          <div className="flex gap-2">
            <button
              onClick={() => setExportFormat('markdown')}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 border transition-all ${
                exportFormat === 'markdown' ? 'bg-white text-black border-white' : 'bg-neutral-900 text-neutral-400 border-neutral-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> DOC MARKDOWN
            </button>
            <button
              onClick={() => setExportFormat('mermaid')}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 border transition-all ${
                exportFormat === 'mermaid' ? 'bg-white text-black border-white' : 'bg-neutral-900 text-neutral-400 border-neutral-800'
              }`}
            >
              <Code className="w-3.5 h-3.5" /> CÓDIGO MERMAID.JS
            </button>
            <button
              onClick={() => setExportFormat('json')}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 border transition-all ${
                exportFormat === 'json' ? 'bg-white text-black border-white' : 'bg-neutral-900 text-neutral-400 border-neutral-800'
              }`}
            >
              <Code className="w-3.5 h-3.5" /> ESQUEMA JSON
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '¡COPIADO!' : 'COPIAR'}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 rounded bg-white text-black hover:bg-neutral-200 text-xs font-bold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> DESCARGAR ARCHIVO
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-black font-mono text-xs text-neutral-300">
          <pre className="whitespace-pre-wrap leading-relaxed">
            {getContentToExport()}
          </pre>
        </div>
      </div>
    </div>
  );
};
