import React, { useState } from 'react';
import type { Project } from '../types/architecture';
import { generateEnterprisePdfHtml } from '../services/pdfReportGenerator';
import { 
  Download, 
  FileText, 
  Code, 
  Check, 
  Copy, 
  X, 
  Printer, 
  Table, 
  Sparkles
} from 'lucide-react';

interface ExportModalProps {
  project: Project;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ project, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'markdown' | 'json' | 'mermaid' | 'csv'>('pdf');

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
- **Propietario**: @${project.gitInfo?.owner || 'Sebaxis07'}
- **Stack Principal**: ${project.primaryStack.join(', ')}
- **Categoría**: ${project.category}
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
- **Hosting**: ${n.cloudProvider || n.hosting || 'N/A'}
- **Endpoints**:
${n.endpoints?.map(ep => `  - \`${ep.method}\` \`${ep.path}\`: ${ep.description || ''}`).join('\n') || '  - Ninguno'}
`).join('\n')}

---

## 🔒 Auditoría de Variables de Entorno (.env)
${project.nodes.flatMap(n => (n.envVars || []).map(ev => `- \`${ev.key}\` (en ${n.label}): ${ev.isSecret ? '🔒 SECRETO' : '⚪ CONFIG'}`)).join('\n') || '*Sin variables explícitas.*'}
`;
  };

  const generateCsvData = () => {
    let csv = 'Tipo,Modulo,Nombre/Path,Metodo/Tipo,Detalle\n';
    project.nodes.forEach(n => {
      csv += `Nodo,${n.category},"${n.label}",${n.hosting || 'N/A'},"${n.description}"\n`;
      (n.endpoints || []).forEach(ep => {
        csv += `Endpoint,${n.label},"${ep.path}",${ep.method},"${ep.description || ''}"\n`;
      });
      (n.tables || []).forEach(t => {
        csv += `DB Table,${n.label},"${t.name}",${t.columnsCount} Cols,"${t.relations?.join('; ') || ''}"\n`;
      });
    });
    return csv;
  };

  const handleOpenPdfWindow = () => {
    const htmlContent = generateEnterprisePdfHtml(project);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
    }
  };

  const getContentForFormat = () => {
    switch (exportFormat) {
      case 'markdown': return generateMarkdownDoc();
      case 'json': return JSON.stringify(project, null, 2);
      case 'mermaid': return generateMermaidGraph();
      case 'csv': return generateCsvData();
      default: return generateMarkdownDoc();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getContentForFormat());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (exportFormat === 'pdf') {
      handleOpenPdfWindow();
      return;
    }

    const content = getContentForFormat();
    const ext = exportFormat === 'markdown' ? 'md' : exportFormat === 'mermaid' ? 'mmd' : exportFormat;
    const mime = exportFormat === 'json' ? 'application/json' : exportFormat === 'csv' ? 'text/csv' : 'text/plain';

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${project.name.toLowerCase().replace(/\s+/g, '-')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-black rounded border border-neutral-800">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                SISTEMA DE REPORTES Y AUDITORÍA PROFESIONAL
              </h2>
              <span className="text-[10px] text-neutral-400 font-sans block">
                Generación de informes ejecutivos en PDF de 10 Secciones Empresariales
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="grid grid-cols-4 gap-2 bg-black p-1.5 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => setExportFormat('pdf')}
            className={`py-2 px-3 rounded font-bold transition-all flex items-center justify-center gap-1.5 ${
              exportFormat === 'pdf' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4" /> PDF EJECUTIVO (10 SEC)
          </button>

          <button
            onClick={() => setExportFormat('markdown')}
            className={`py-2 px-3 rounded font-bold transition-all flex items-center justify-center gap-1.5 ${
              exportFormat === 'markdown' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> MARKDOWN (.MD)
          </button>

          <button
            onClick={() => setExportFormat('csv')}
            className={`py-2 px-3 rounded font-bold transition-all flex items-center justify-center gap-1.5 ${
              exportFormat === 'csv' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Table className="w-4 h-4" /> EXCEL / CSV (.CSV)
          </button>

          <button
            onClick={() => setExportFormat('json')}
            className={`py-2 px-3 rounded font-bold transition-all flex items-center justify-center gap-1.5 ${
              exportFormat === 'json' ? 'bg-white text-black shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" /> JSON STRUCT
          </button>
        </div>

        {/* Dynamic Format Preview */}
        {exportFormat === 'pdf' ? (
          <div className="p-6 bg-black border border-neutral-800 rounded-lg space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 font-mono">
              <span className="text-white font-bold uppercase text-[11px] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-white" /> VISTA PREVIA DEL REPORTE PDF EJECUTIVO
              </span>
              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px] font-bold">
                10 SECCIONES EMPRESARIALES
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono text-[11px]">
              <div className="p-3 bg-[#141414] rounded border border-neutral-800 space-y-1">
                <span className="text-neutral-400 text-[10px] uppercase font-bold block">1. PORTADA Y RESUMEN</span>
                <p className="text-white font-bold">{project.name}</p>
                <span className="text-neutral-500 text-[10px]">Score: {project.complexityScore}/100 • Propietario: @{project.gitInfo?.owner || 'Sebaxis07'}</span>
              </div>

              <div className="p-3 bg-[#141414] rounded border border-neutral-800 space-y-1">
                <span className="text-neutral-400 text-[10px] uppercase font-bold block">3. AUDITORÍA DE SEGURIDAD</span>
                <p className="text-white font-bold">Variables .env & Puertos</p>
                <span className="text-neutral-500 text-[10px]">{project.nodes.flatMap(n => n.envVars || []).length} variables analizadas</span>
              </div>

              <div className="p-3 bg-[#141414] rounded border border-neutral-800 space-y-1">
                <span className="text-neutral-400 text-[10px] uppercase font-bold block">5. RUTAS Y ENDPOINTS</span>
                <p className="text-white font-bold">Catálogo REST API</p>
                <span className="text-neutral-500 text-[10px]">{project.nodes.flatMap(n => n.endpoints || []).length} endpoints catalogados</span>
              </div>

              <div className="p-3 bg-[#141414] rounded border border-neutral-800 space-y-1">
                <span className="text-neutral-400 text-[10px] uppercase font-bold block">6. ESQUEMAS DE BASE DE DATOS</span>
                <p className="text-white font-bold">Diccionario Mongoose/Prisma</p>
                <span className="text-neutral-500 text-[10px]">{project.nodes.flatMap(n => n.tables || []).length} colecciones/tablas</span>
              </div>
            </div>

            <button
              onClick={handleOpenPdfWindow}
              className="w-full py-3 bg-white text-black font-mono font-bold text-xs rounded hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4 text-black" />
              ABRIR / IMPRIMIR REPORTE PDF COMPLETO EN NUEVA VENTANA
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden relative">
            <pre className="w-full h-64 p-4 bg-black border border-neutral-800 rounded-lg text-xs text-neutral-300 font-mono overflow-auto leading-relaxed">
              {getContentForFormat()}
            </pre>
          </div>
        )}

        {/* Bottom Actions Footer */}
        <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
          {exportFormat !== 'pdf' && (
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-black hover:bg-neutral-900 border border-neutral-800 rounded text-neutral-300 hover:text-white font-bold text-xs transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'COPIADO AL PORTAPAPELES' : 'COPIAR AL PORTAPAPELES'}
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-black hover:bg-neutral-900 border border-neutral-800 rounded text-neutral-400 hover:text-white font-bold text-xs transition-colors"
            >
              CANCELAR
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black font-bold text-xs rounded transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              {exportFormat === 'pdf' ? 'ABRIR / IMPRIMIR PDF' : 'DESCARGAR ARCHIVO'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
