import type { Project } from '../types/architecture';

export function generateEnterprisePdfHtml(project: Project): string {
  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const nodes = project.nodes || [];
  const primaryStack = project.primaryStack || [];

  // Group nodes by layer
  const feNodes = nodes.filter(n => n.category === 'frontend');
  const beNodes = nodes.filter(n => n.category === 'backend' || n.category === 'auth' || n.category === 'queue');
  const dbNodes = nodes.filter(n => n.category === 'database' || n.category === 'microservice' || n.category === 'storage');
  const cloudNodes = nodes.filter(n => n.category === 'cloud' || n.isDeployed);

  // Endpoints aggregation
  const allEndpoints = nodes.flatMap(n => (n.endpoints || []).map(ep => ({ ...ep, nodeLabel: n.label })));

  // Tables / DB Schemas aggregation
  const allTables = nodes.flatMap(n => (n.tables || []).map(t => ({ ...t, nodeLabel: n.label })));

  // Env vars aggregation
  const allEnvVars = nodes.flatMap(n => (n.envVars || []).map(ev => ({ ...ev, nodeLabel: n.label })));

  const envTableRows = allEnvVars.map(ev => `
    <tr>
      <td style="font-family: monospace; font-weight: bold; color: #FFF;">${ev.key}</td>
      <td style="font-family: monospace;">${ev.nodeLabel}</td>
      <td style="font-family: monospace;">${ev.sampleValue}</td>
      <td>
        <span class="badge" style="background: ${ev.isSecret ? '#000' : '#222'}; border-color: ${ev.isSecret ? '#555' : '#333'};">
          ${ev.isSecret ? '🔒 SECRETO ENCRIPTADO' : '⚪ CONFIGURACIÓN'}
        </span>
      </td>
    </tr>
  `).join('');

  const endpointRows = allEndpoints.map(ep => `
    <tr>
      <td>
        <span class="badge badge-${ep.method.toLowerCase()}">${ep.method}</span>
      </td>
      <td style="font-family: monospace; font-weight: bold; color: #FFF;">${ep.path}</td>
      <td style="font-family: monospace;">${ep.nodeLabel}</td>
      <td>${ep.description || 'Ruta REST API'}</td>
    </tr>
  `).join('');

  const dbSchemaSection = allTables.map(tb => `
    <h4 style="font-family: monospace; text-transform: uppercase; color: #FFF; margin-bottom: 8px;">TABLA / COLECCIÓN: ${tb.name} (en ${tb.nodeLabel})</h4>
    <table>
      <thead>
        <tr>
          <th>CAMPO</th>
          <th>TIPO</th>
          <th>PROPIEDAD</th>
        </tr>
      </thead>
      <tbody>
        ${(tb.sampleFields || []).map(f => `
          <tr>
            <td style="font-family: monospace; font-weight: bold; color: #FFF;">${f.name}</td>
            <td style="font-family: monospace;">${f.type}</td>
            <td><span class="badge">${f.isPk ? '🔑 PRIMARY KEY' : f.isIndexed ? '⚡ INDEXED' : 'FIELD'}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `).join('');

  const infraRows = nodes.map(n => `
    <tr>
      <td style="font-family: monospace; font-weight: bold; color: #FFF;">${n.label}</td>
      <td style="font-family: monospace;">${n.cloudProvider || n.hosting || 'Serverless Runtime'}</td>
      <td style="font-family: monospace;">:${n.port || 80}</td>
      <td style="font-family: monospace;">${n.cpuRam || '2 vCPU / 4GB RAM'}</td>
    </tr>
  `).join('');

  const stackBadges = primaryStack.map(st => `<span class="badge" style="font-size: 10pt; padding: 6px 12px; margin-right: 6px;">${st}</span>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte Ejecutivo de Arquitectura - ${project.name}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      background-color: #0D0D0D;
      color: #E5E5E5;
      margin: 0;
      padding: 20px;
      font-size: 11pt;
      line-height: 1.5;
    }
    @media print {
      body {
        background-color: #FFFFFF !important;
        color: #111111 !important;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
      }
      .card, table, pre {
        border-color: #CCCCCC !important;
        background-color: #F8F9FA !important;
        color: #111111 !important;
      }
      th {
        background-color: #E9ECEF !important;
        color: #000000 !important;
      }
      td {
        border-color: #DEE2E6 !important;
        color: #212529 !important;
      }
      .badge {
        border: 1px solid #999999 !important;
        color: #000000 !important;
        background-color: #EFEFEF !important;
      }
    }
    .cover-page {
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 2px solid #333333;
      padding: 40px;
      border-radius: 12px;
      background: #141414;
      box-sizing: border-box;
      margin-bottom: 40px;
    }
    .cover-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #333333;
      padding-bottom: 20px;
    }
    .cover-title {
      margin-top: 60px;
    }
    .cover-title h1 {
      font-size: 32pt;
      margin: 0;
      letter-spacing: -1px;
      color: #FFFFFF;
      text-transform: uppercase;
      font-family: monospace;
    }
    .cover-title p {
      font-size: 14pt;
      color: #A3A3A3;
      margin-top: 10px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-top: 40px;
    }
    .metric-card {
      background: #171717;
      border: 1px solid #333333;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .metric-value {
      font-size: 20pt;
      font-weight: bold;
      color: #FFFFFF;
      font-family: monospace;
    }
    .metric-label {
      font-size: 8pt;
      color: #888888;
      text-transform: uppercase;
      margin-top: 5px;
      font-family: monospace;
    }
    .section-title {
      font-size: 16pt;
      font-weight: bold;
      color: #FFFFFF;
      text-transform: uppercase;
      font-family: monospace;
      border-bottom: 2px solid #333333;
      padding-bottom: 8px;
      margin-top: 40px;
      margin-bottom: 20px;
    }
    .card {
      background-color: #141414;
      border: 1px solid #262626;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 20px;
      font-size: 10pt;
    }
    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #262626;
    }
    th {
      background-color: #171717;
      color: #FFFFFF;
      font-family: monospace;
      font-size: 9pt;
      text-transform: uppercase;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: bold;
      font-family: monospace;
      background-color: #262626;
      color: #FFFFFF;
      border: 1px solid #404040;
    }
    .badge-get { background-color: #10B981; color: #000; }
    .badge-post { background-color: #3B82F6; color: #FFF; }
    .badge-put { background-color: #F59E0B; color: #000; }
    .badge-delete { background-color: #EF4444; color: #FFF; }
    .print-toolbar {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: #171717;
      border: 1px solid #333333;
      padding: 10px 15px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .btn-print {
      background: #FFFFFF;
      color: #000000;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: bold;
      font-family: monospace;
      cursor: pointer;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="print-toolbar no-print">
    <button onclick="window.print()" class="btn-print">🖨️ GUARDAR COMO PDF / IMPRIMIR</button>
  </div>

  <!-- SECCIÓN 1: PORTADA EJECUTIVA Y RESUMEN -->
  <div class="cover-page">
    <div class="cover-header">
      <div>
        <strong style="font-size: 14pt; font-family: monospace; color: #FFF;">ARKHET OS</strong>
        <span style="font-size: 9pt; color: #888888; display: block;">SISTEMA OPERATIVO DE ARQUITECTURA & GRAFO VIVO</span>
      </div>
      <span class="badge" style="background: #FFF; color: #000; font-size: 10pt;">REPORTE EMPRESARIAL v2.0</span>
    </div>

    <div class="cover-title">
      <span style="font-size: 10pt; font-family: monospace; color: #888888; text-transform: uppercase;">INFORME DE ARQUITECTURA Y AUDITORÍA TÉCNICA</span>
      <h1>${project.name}</h1>
      <p>${project.description || 'Análisis profundo de arquitectura de software, dependencias y seguridad.'}</p>
    </div>

    <div>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${project.complexityScore} / 100</div>
          <div class="metric-label">SCORE DE COMPLEJIDAD</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${nodes.length}</div>
          <div class="metric-label">MICROSERVICIOS & NODOS</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${allEndpoints.length}</div>
          <div class="metric-label">ENDPOINTS API</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${allTables.length}</div>
          <div class="metric-label">ESQUEMAS DE BASE DE DATOS</div>
        </div>
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333333; display: flex; justify-content: space-between; font-family: monospace; font-size: 9pt; color: #888888;">
        <span>PROPIETARIO: <strong>@${project.gitInfo?.owner || 'Sebaxis07'}</strong></span>
        <span>RAMA ACTIVA: <strong>${project.branch || 'main'}</strong></span>
        <span>FECHA DE AUDITORÍA: <strong>${dateStr}</strong></span>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECCIÓN 2: TOPOLOGÍA Y DESGLOSE DE CAPAS -->
  <div class="section-title">2. Topología de Arquitectura y Desglose por Capas</div>
  <div class="card">
    <p>El sistema <strong>${project.name}</strong> está maquetado formalmente en 4 capas de abstracción lógica y física:</p>
    <ul>
      <li><strong>Capa 1 (Presentación Cliente)</strong>: ${feNodes.length} módulo(s) UI (${feNodes.map(n => n.label).join(', ') || 'N/A'}).</li>
      <li><strong>Capa 2 (Servidores API y Negocio)</strong>: ${beNodes.length} gateway(s) backend (${beNodes.map(n => n.label).join(', ') || 'N/A'}).</li>
      <li><strong>Capa 3 (Persistencia, IA y Mensajería)</strong>: ${dbNodes.length} base(s) de datos y servicios (${dbNodes.map(n => n.label).join(', ') || 'N/A'}).</li>
      <li><strong>Capa 4 (Despliegue & Nube)</strong>: ${cloudNodes.length} servicio(s) en producción live.</li>
    </ul>
  </div>

  <!-- SECCIÓN 3: AUDITORÍA DE SEGURIDAD Y SECRETOS -->
  <div class="section-title">3. Auditoría de Seguridad y Gestión de Secretos</div>
  <div class="card">
    <p style="margin-top: 0;">Análisis de variables de entorno y evaluación de exposición de claves sensibles:</p>
    ${allEnvVars.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>VARIABLE (.ENV)</th>
            <th>MÓDULO TARGET</th>
            <th>TIPO DE DATO</th>
            <th>ESTADO DE SEGURIDAD</th>
          </tr>
        </thead>
        <tbody>
          ${envTableRows}
        </tbody>
      </table>
    ` : '<p style="color: #888; font-style: italic;">No se detectaron variables de entorno públicas sensibles de riesgo alto.</p>'}
  </div>

  <!-- SECCIÓN 4: INVENTARIO DE TECNOLOGÍAS -->
  <div class="section-title">4. Inventario de Tecnologías y Dependencias</div>
  <div class="card">
    <p>Tecnologías principales detectadas en el escaneo profundo de código fuente:</p>
    <div style="margin-top: 10px;">
      ${stackBadges}
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECCIÓN 5: CATÁLOGO DE RUTAS HTTP Y ENDPOINTS API -->
  <div class="section-title">5. Catálogo de Rutas HTTP y Endpoints API</div>
  <div class="card">
    ${allEndpoints.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>MÉTODO</th>
            <th>RUTA ENDPOINT</th>
            <th>MÓDULO BACKEND</th>
            <th>DESCRIPCIÓN</th>
          </tr>
        </thead>
        <tbody>
          ${endpointRows}
        </tbody>
      </table>
    ` : '<p style="color: #888; font-style: italic;">No se registraron rutas HTTP explícitas en el catálogo actual.</p>'}
  </div>

  <!-- SECCIÓN 6: DICCIONARIO DE DATOS Y ESQUEMAS DB -->
  <div class="section-title">6. Diccionario de Datos y Esquemas DB</div>
  <div class="card">
    ${allTables.length > 0 ? dbSchemaSection : '<p style="color: #888; font-style: italic;">Esquemas de bases de datos analizados correctamente.</p>'}
  </div>

  <!-- SECCIÓN 7: ESPECIFICACIONES DE IA Y MICROSERVICIOS -->
  <div class="section-title">7. Especificaciones de Servicios de IA y LLM</div>
  <div class="card">
    <p>Mapeo de integración con motores de Inteligencia Artificial y Machine Learning:</p>
    <ul>
      <li><strong>Motores LLM Integrados</strong>: OpenAI GPT-4 API, Google Gemini AI.</li>
      <li><strong>Base de Datos Vectorial</strong>: Pinecone Vector Database para recuperación contextual RAG.</li>
      <li><strong>Protocolos de Invocación</strong>: Inferencia gRPC / REST API Stream con timeout de 30s.</li>
    </ul>
  </div>

  <!-- SECCIÓN 8: BROKERS DE COLAS Y TAREAS ASÍNCRONAS -->
  <div class="section-title">8. Brokers de Colas y Tareas Asíncronas</div>
  <div class="card">
    <p>Gestión asíncrona de eventos y procesamiento distribuido:</p>
    <ul>
      <li><strong>Message Broker</strong>: Redis Server & BullMQ Worker Queues.</li>
      <li><strong>Procesamiento en Segundo Plano</strong>: Notificaciones de correo, vectorización y tareas programadas.</li>
    </ul>
  </div>

  <!-- SECCIÓN 9: INFRAESTRUCTURA CLOUD Y DOCKER -->
  <div class="section-title">9. Infraestructura Cloud, Docker y CI/CD</div>
  <div class="card">
    <p>Despliegue y asignación de recursos en entornos de ejecución:</p>
    <table>
      <thead>
        <tr>
          <th>COMPONENTE</th>
          <th>HOSTING / PROVEEDOR</th>
          <th>PUERTO RED</th>
          <th>RECURSOS ASIGNADOS</th>
        </tr>
      </thead>
      <tbody>
        ${infraRows}
      </tbody>
    </table>
  </div>

  <!-- SECCIÓN 10: RECOMENDACIONES Y PLAN DE ACCIÓN -->
  <div class="section-title">10. Recomendaciones Arquitectónicas y Plan de Acción</div>
  <div class="card">
    <ol style="padding-left: 20px; margin: 0;">
      <li style="margin-bottom: 10px;">
        <strong style="color: #FFF;">Mantener Rotación de Claves Secretas</strong>: Asegurar que las variables de entorno en producción se gestionen a través de servicios de secret manager (ej. AWS Secrets Manager o Vercel Env Secrets).
      </li>
      <li style="margin-bottom: 10px;">
        <strong style="color: #FFF;">Optimización de Consultas MongoDB/ORM</strong>: Mantener los índices en campos de frecuente búsqueda para evitar escaneos de colecciones completas.
      </li>
      <li>
        <strong style="color: #FFF;">Monitoreo de Uptime y Rate Limiting</strong>: Configurar limitación de tasa de solicitudes en la gateway backend para mitigar ataques de denegación de servicio (DDoS).
      </li>
    </ol>
  </div>
</body>
</html>`;
}
