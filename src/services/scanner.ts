import type { Project, ArchNode, ArchEdge, FolderItem, ClusterZone, GitInfo, SubNode, DBSchemaTable, Endpoint } from '../types/architecture';

export interface ScanResult {
  projectName: string;
  detectedStack: string[];
  inferredNodes: ArchNode[];
  inferredEdges: ArchEdge[];
  folderStructure: FolderItem[];
  warnings: string[];
}

export function parseGitConfig(content: string): { remoteUrl?: string; owner?: string; repoName?: string } {
  try {
    const urlMatch = content.match(/url\s*=\s*(.+)/);
    if (!urlMatch || !urlMatch[1]) return {};

    const rawUrl = urlMatch[1].trim();
    let owner = '';
    let repoName = '';

    const httpsMatch = rawUrl.match(/github\.com\/([^\/]+)\/([^\/\.\s]+)/);
    if (httpsMatch) {
      owner = httpsMatch[1];
      repoName = httpsMatch[2].replace(/\.git$/, '');
    }

    const sshMatch = rawUrl.match(/github\.com:([^\/]+)\/([^\/\.\s]+)/);
    if (sshMatch) {
      owner = sshMatch[1];
      repoName = sshMatch[2].replace(/\.git$/, '');
    }

    return {
      remoteUrl: rawUrl,
      owner,
      repoName
    };
  } catch (e) {
    return {};
  }
}

export function parseGitHead(content: string): string {
  try {
    const trimmed = content.trim();
    const branchMatch = trimmed.match(/refs\/heads\/(.+)/);
    if (branchMatch && branchMatch[1]) {
      return branchMatch[1].trim();
    }
    return trimmed.substring(0, 7);
  } catch (e) {
    return 'main';
  }
}

export function parsePackageJson(content: string) {
  try {
    const pkg = JSON.parse(content);
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const stack: string[] = [];

    // Web / Frontend
    if (deps.react) { stack.push('React 19'); }
    if (deps.next) { stack.push('Next.js'); }
    if (deps.vue) { stack.push('Vue.js'); }
    if (deps.svelte) { stack.push('Svelte'); }
    if (deps.vite) { stack.push('Vite'); }
    if (deps.tailwindcss) { stack.push('Tailwind CSS'); }

    // Backend & Services
    if (deps.express) { stack.push('Express.js'); }
    if (deps['@nestjs/core']) { stack.push('NestJS'); }
    if (deps.koa) { stack.push('Koa.js'); }
    if (deps.fastify) { stack.push('Fastify'); }
    if (deps.typescript) { stack.push('TypeScript'); }
    if (deps['socket.io'] || deps.ws) { stack.push('Socket.io / WebSockets'); }

    // AI & Machine Learning SDKs
    let hasAiService = false;
    if (deps.openai || deps['@google/generative-ai'] || deps.langchain || deps['@langchain/core'] || deps.anthropic || deps.replicate || deps.huggingface || deps.pinecone || deps['@pinecone-database/pinecone']) {
      hasAiService = true;
      if (deps.openai) stack.push('OpenAI API');
      if (deps['@google/generative-ai']) stack.push('Gemini AI API');
      if (deps.langchain || deps['@langchain/core']) stack.push('LangChain RAG');
      if (deps.pinecone || deps['@pinecone-database/pinecone']) stack.push('Pinecone Vector DB');
    }

    // Databases & ORMs
    let detectedDb = '';
    let detectedOrm = '';

    if (deps.mongoose || deps.mongodb) {
      detectedDb = 'MongoDB';
      detectedOrm = 'Mongoose ORM';
      stack.push('MongoDB', 'Mongoose');
    }
    if (deps['@prisma/client'] || deps.prisma) {
      detectedOrm = 'Prisma ORM';
      if (!detectedDb) detectedDb = 'PostgreSQL / SQL';
      stack.push('Prisma ORM');
    }
    if (deps.pg) {
      if (!detectedDb) detectedDb = 'PostgreSQL';
      stack.push('PostgreSQL');
    }
    if (deps.mysql || deps.mysql2) {
      if (!detectedDb) detectedDb = 'MySQL';
      stack.push('MySQL');
    }
    if (deps.sqlite3 || deps['better-sqlite3']) {
      if (!detectedDb) detectedDb = 'SQLite';
      stack.push('SQLite');
    }
    if (deps.redis || deps.ioredis) {
      stack.push('Redis');
    }

    return {
      name: pkg.name || 'proyecto-local',
      stack,
      rawDeps: Object.keys(deps),
      scripts: pkg.scripts || {},
      detectedDb,
      detectedOrm,
      hasExpress: !!deps.express,
      hasMongoose: !!(deps.mongoose || deps.mongodb),
      hasPrisma: !!(deps['@prisma/client'] || deps.prisma),
      hasReact: !!deps.react,
      hasAiService
    };
  } catch (e) {
    return { name: 'proyecto-local', stack: [], rawDeps: [], scripts: {}, detectedDb: '', detectedOrm: '', hasExpress: false, hasMongoose: false, hasPrisma: false, hasReact: false, hasAiService: false };
  }
}

export function parseEnvExample(content: string) {
  const lines = content.split('\n');
  const vars = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, val] = trimmed.split('=');
      if (key) {
        vars.push({
          key: key.trim(),
          required: true,
          sampleValue: val ? val.trim() : '***',
          isSecret: /SECRET|KEY|PASSWORD|TOKEN|DATABASE_URL|MONGO_URI|URI|OPENAI|GEMINI/i.test(key)
        });
      }
    }
  }
  return vars;
}

export function deepAnalyzeCodeFiles(files: { name: string; path: string; content: string }[]): {
  extractedEndpoints: Endpoint[];
  extractedAiServices: string[];
  extractedModels: DBSchemaTable[];
  extractedComponents: SubNode[];
  extractedBackendServices: SubNode[];
} {
  const extractedEndpoints: Endpoint[] = [];
  const extractedAiServices: string[] = [];
  const extractedModels: DBSchemaTable[] = [];
  const extractedComponents: SubNode[] = [];
  const extractedBackendServices: SubNode[] = [];

  const seenPaths = new Set<string>();

  for (const file of files) {
    const content = file.content;
    const pathLower = file.path.toLowerCase();

    // 1. AI Service Detection in Code
    if (/openai|generative-ai|langchain|anthropic|huggingface|pinecone|gemini|gpt|python|fastapi/i.test(content)) {
      if (/openai|gpt/i.test(content) && !extractedAiServices.includes('OpenAI GPT-4 API')) {
        extractedAiServices.push('OpenAI GPT-4 API');
      }
      if (/generative-ai|gemini/i.test(content) && !extractedAiServices.includes('Google Gemini AI')) {
        extractedAiServices.push('Google Gemini AI');
      }
      if (/pinecone/i.test(content) && !extractedAiServices.includes('Pinecone Vector DB')) {
        extractedAiServices.push('Pinecone Vector DB');
      }
    }

    // 2. Endpoint Extraction
    const routeRegex = /(?:app|router|server)\.(get|post|put|delete|patch|use)\s*\(\s*['"]([^'"]+)['"]/gi;
    let match;
    while ((match = routeRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase() as any;
      const path = match[2];
      if (!seenPaths.has(`${method}:${path}`) && path.startsWith('/')) {
        seenPaths.add(`${method}:${path}`);
        extractedEndpoints.push({
          id: `ep-deep-${extractedEndpoints.length + 1}`,
          method,
          path,
          description: `Ruta detectada en ${file.name}`
        });
      }
    }

    // 3. UI Components Extraction
    if (pathLower.includes('component') || pathLower.includes('view') || pathLower.includes('page')) {
      const nameNoExt = file.name.replace(/\.[^/.]+$/, '');
      const cleanName = nameNoExt.charAt(0).toUpperCase() + nameNoExt.slice(1);
      if (!extractedComponents.some(c => c.label === cleanName)) {
        extractedComponents.push({
          id: `sn-comp-${extractedComponents.length + 1}`,
          label: cleanName,
          type: 'controller',
          details: file.path
        });
      }
    }

    // 4. Backend Services Extraction
    if (pathLower.includes('service') || pathLower.includes('controller') || pathLower.includes('helper') || pathLower.includes('worker')) {
      const nameNoExt = file.name.replace(/\.[^/.]+$/, '');
      const cleanName = nameNoExt.charAt(0).toUpperCase() + nameNoExt.slice(1);
      const isService = pathLower.includes('service');
      if (!extractedBackendServices.some(s => s.label === cleanName)) {
        extractedBackendServices.push({
          id: `sn-srv-${extractedBackendServices.length + 1}`,
          label: cleanName,
          type: isService ? 'service' : 'controller',
          details: file.path
        });
      }
    }

    // 5. Database Schema Extraction
    const mongooseModelMatch = content.match(/mongoose\.model\s*\(\s*['"]([^'"]+)['"]/i);
    if (mongooseModelMatch && mongooseModelMatch[1]) {
      const modelName = mongooseModelMatch[1];
      if (!extractedModels.some(m => m.name === modelName)) {
        extractedModels.push({
          name: modelName,
          columnsCount: (content.match(/:/g) || []).length,
          relations: []
        });
      }
    }
  }

  return {
    extractedEndpoints,
    extractedAiServices,
    extractedModels,
    extractedComponents,
    extractedBackendServices
  };
}

export function autoGenerateProjectFromManifests(
  rawFiles: { name: string; path?: string; content: string }[], 
  folderTreeCustom?: FolderItem[], 
  customName?: string,
  gitInfoCustom?: GitInfo
): Project {
  const files = rawFiles.map(f => ({ ...f, path: f.path || `/${f.name}` }));
  const pkgFile = files.find(f => f.name.endsWith('package.json'));
  const gitConfigFile = files.find(f => f.path.endsWith('.git/config') || f.name === 'config');
  const gitHeadFile = files.find(f => f.path.endsWith('.git/HEAD') || f.name === 'HEAD');

  let rawName = customName || 'PROYECTO LOCAL';
  let parsedPkg = {
    name: 'proyecto-local',
    stack: [] as string[],
    rawDeps: [] as string[],
    scripts: {},
    detectedDb: '',
    detectedOrm: '',
    hasExpress: false,
    hasMongoose: false,
    hasPrisma: false,
    hasReact: false,
    hasAiService: false
  };

  if (pkgFile) {
    parsedPkg = parsePackageJson(pkgFile.content);
    if (parsedPkg.name && parsedPkg.name !== 'proyecto-local') {
      rawName = parsedPkg.name.replace(/[-_]/g, ' ').toUpperCase();
    }
  }

  // Clean base name without redundant backend/frontend suffixes
  const name = rawName.replace(/BACKEND|FRONTEND|SERVER|CLIENT/gi, '').trim() || rawName;

  const deepAnalysis = deepAnalyzeCodeFiles(files);

  let gitInfo: GitInfo = gitInfoCustom || {};
  if (gitConfigFile) {
    const parsedGitConfig = parseGitConfig(gitConfigFile.content);
    gitInfo = { ...gitInfo, ...parsedGitConfig };
  }
  if (gitHeadFile) {
    const currentBranch = parseGitHead(gitHeadFile.content);
    gitInfo = { ...gitInfo, currentBranch };
  }

  // Detect TOP-LEVEL Microservice Folders
  const topLevelFolders = (folderTreeCustom || []).filter(item => item.type === 'folder');
  const topLevelFolderNames = topLevelFolders.map(f => f.name.toLowerCase());

  const hasTopLevelAi = topLevelFolderNames.some(n => n.includes('ai') || n.includes('ml') || n.includes('llm'));
  const hasTopLevelFrontend = topLevelFolderNames.some(n => n.includes('frontend') || n.includes('client') || n.includes('web'));
  const hasTopLevelBackend = topLevelFolderNames.some(n => n.includes('backend') || n.includes('server') || n.includes('api'));
  const hasTopLevelUploads = topLevelFolderNames.some(n => n.includes('upload') || n.includes('deliverable') || n.includes('storage') || n.includes('media'));

  const isMultiModuleProject = hasTopLevelAi || (hasTopLevelFrontend && hasTopLevelBackend);

  const stack = [...parsedPkg.stack];
  if (hasTopLevelAi) stack.push('Python 3.11', 'FastAPI / LLM');
  if (deepAnalysis.extractedAiServices.length > 0) {
    deepAnalysis.extractedAiServices.forEach(s => {
      if (!stack.includes(s)) stack.push(s);
    });
  }
  if (stack.length === 0) stack.push('TypeScript', 'Python', 'Node.js');

  const clusters: ClusterZone[] = [
    { id: 'zone-fe', title: `CAPA 1: PRESENTACIÓN (${name})`, layer: 'presentation', x: 40, y: 80, width: 340, height: 460 },
    { id: 'zone-be', title: `CAPA 2: SERVIDORES API Y NEGOCIO`, layer: 'application', x: 420, y: 80, width: 440, height: 460 },
    { id: 'zone-db', title: `CAPA 3: MICROSERVICIOS IA Y PERSISTENCIA`, layer: 'data', x: 900, y: 80, width: 360, height: 460 }
  ];

  const nodes: ArchNode[] = [];
  const edges: ArchEdge[] = [];

  if (isMultiModuleProject) {
    // 1. FRONTEND NODE (Clean label: Frontend Web UI)
    const feFolder = topLevelFolders.find(f => /frontend|client|web/i.test(f.name));
    nodes.push({
      id: 'node-fe-app',
      label: `Frontend Web UI`,
      category: 'frontend',
      clusterId: 'zone-fe',
      description: `Aplicación cliente en ${feFolder ? feFolder.path : '/frontend'}`,
      x: 70,
      y: 140,
      techStack: ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS'],
      port: 5173,
      hosting: 'Vite / Vercel',
      folderPath: feFolder ? feFolder.path : '/frontend',
      status: 'healthy',
      subNodes: deepAnalysis.extractedComponents.length > 0 ? deepAnalysis.extractedComponents : [
        { id: 'sn-fe-1', label: `UI Components`, type: 'controller', details: '/frontend/src/components' },
        { id: 'sn-fe-2', label: 'ApiClient', type: 'service', details: '/frontend/src/api' }
      ]
    });

    // 2. BACKEND NODE (Clean label: Servidor Backend API)
    const beFolder = topLevelFolders.find(f => /backend|server|api/i.test(f.name));
    nodes.push({
      id: 'node-be-gateway',
      label: `Servidor Backend API`,
      category: 'backend',
      clusterId: 'zone-be',
      description: `Servidor principal de negocio y autenticación en ${beFolder ? beFolder.path : '/backend'}`,
      x: 450,
      y: 140,
      techStack: ['Express.js', 'Node.js', 'Mongoose ORM'],
      port: 5000,
      hosting: 'Node.js Runtime',
      folderPath: beFolder ? beFolder.path : '/backend',
      status: 'healthy',
      subNodes: deepAnalysis.extractedBackendServices.length > 0 ? deepAnalysis.extractedBackendServices : [
        { id: 'sn-be-1', label: 'AuthRouter', type: 'route', details: '/backend/routes' },
        { id: 'sn-be-2', label: 'MainController', type: 'controller', details: '/backend/controllers' }
      ],
      endpoints: deepAnalysis.extractedEndpoints.length > 0 ? deepAnalysis.extractedEndpoints : [
        { id: 'ep-1', method: 'GET', path: '/api/v1/health', description: 'Health check' },
        { id: 'ep-2', method: 'POST', path: '/api/v1/data', description: 'Procesar requerimiento' }
      ]
    });

    // 3. AI MICROSERVICE NODE (Clean label: Microservicio IA)
    if (hasTopLevelAi || deepAnalysis.extractedAiServices.length > 0) {
      const aiFolder = topLevelFolders.find(f => /ai|ml|llm/i.test(f.name));
      nodes.push({
        id: 'node-ai-service',
        label: `Microservicio IA (Python)`,
        category: 'microservice',
        clusterId: 'zone-db',
        description: `Servicio de IA y motor LLM para ${name}`,
        x: 930,
        y: 140,
        techStack: ['Python 3.11', 'FastAPI', 'OpenAI API', 'LangChain RAG'],
        port: 8000,
        hosting: 'Python FastAPI Runtime',
        folderPath: aiFolder ? aiFolder.path : '/ai-service',
        status: 'healthy',
        subNodes: [
          { id: 'sn-ai-1', label: 'PromptEngine', type: 'service', details: 'Generación de Respuestas IA' },
          { id: 'sn-ai-2', label: 'EmbeddingIndexer', type: 'worker', details: 'Vectorización Contextual' }
        ]
      });

      edges.push({
        id: 'e-be-ai',
        source: 'node-be-gateway',
        target: 'node-ai-service',
        label: 'gRPC / HTTPS API Stream',
        protocol: 'gRPC/REST'
      });
    }

    // 4. FILE STORAGE NODE
    if (hasTopLevelUploads) {
      const uploadFolder = topLevelFolders.find(f => /upload|deliverable|storage|media/i.test(f.name));
      nodes.push({
        id: 'node-storage-uploads',
        label: `Almacenamiento de Entregables`,
        category: 'storage',
        clusterId: 'zone-db',
        description: `Repositorio de documentos, entregables y PDFs`,
        x: 930,
        y: 300,
        techStack: ['Local FS Storage', 'PDF Deliverables'],
        folderPath: uploadFolder ? uploadFolder.path : '/uploads',
        status: 'healthy'
      });

      edges.push({
        id: 'e-be-storage',
        source: 'node-be-gateway',
        target: 'node-storage-uploads',
        label: 'FS Stream Access',
        protocol: 'File Access'
      });
    }

    // 5. DATABASE NODE
    nodes.push({
      id: 'node-db-main',
      label: `Base de Datos MongoDB`,
      category: 'database',
      clusterId: 'zone-db',
      description: `Almacenamiento persistente de datos`,
      x: 930,
      y: 440,
      techStack: ['MongoDB 7.0', 'Mongoose ODM'],
      port: 27017,
      status: 'healthy',
      tables: deepAnalysis.extractedModels.length > 0 ? deepAnalysis.extractedModels : [
        { name: `${name}Data`, columnsCount: 10, relations: ['Usuarios'] },
        { name: 'Usuarios', columnsCount: 8, relations: [] }
      ]
    });

    edges.push(
      { id: 'e-fe-be', source: 'node-fe-app', target: 'node-be-gateway', label: 'HTTP REST / JSON', protocol: 'HTTP' },
      { id: 'e-be-db', source: 'node-be-gateway', target: 'node-db-main', label: 'Mongoose ODM Connection', protocol: 'ORM' }
    );
  } else {
    // Single directory architecture with deep code inspection
    nodes.push(
      {
        id: 'node-fe-app',
        label: `${name} Web UI`,
        category: 'frontend',
        clusterId: 'zone-fe',
        description: `Interfaz cliente de ${name}`,
        x: 70,
        y: 140,
        techStack: parsedPkg.hasReact ? ['React 19', 'Vite'] : ['Web Client UI'],
        port: 5173,
        hosting: 'Vite / Localhost',
        folderPath: '/src',
        status: 'healthy',
        subNodes: deepAnalysis.extractedComponents.length > 0 ? deepAnalysis.extractedComponents : [
          { id: 'sn-fe-1', label: `${name}UI`, type: 'controller' }
        ]
      },
      {
        id: 'node-be-gateway',
        label: `Servidor API Backend`,
        category: 'backend',
        clusterId: 'zone-be',
        description: `Servidor API de negocio para ${name}`,
        x: 450,
        y: 140,
        techStack: parsedPkg.hasExpress ? ['Express.js', 'Node.js'] : ['Node.js API'],
        port: 5000,
        hosting: 'Node.js Runtime',
        folderPath: '/server',
        status: 'healthy',
        subNodes: deepAnalysis.extractedBackendServices,
        endpoints: deepAnalysis.extractedEndpoints
      },
      {
        id: 'node-db-main',
        label: `Base de Datos MongoDB / NoSQL`,
        category: 'database',
        clusterId: 'zone-db',
        description: `Persistencia de datos de ${name}`,
        x: 930,
        y: 140,
        techStack: ['MongoDB 7.0', 'Mongoose ODM'],
        port: 27017,
        status: 'healthy',
        tables: deepAnalysis.extractedModels
      }
    );

    edges.push(
      { id: 'e1', source: 'node-fe-app', target: 'node-be-gateway', label: 'HTTP REST / JSON', protocol: 'HTTP' },
      { id: 'e2', source: 'node-be-gateway', target: 'node-db-main', label: 'Mongoose ODM Connection', protocol: 'ORM' }
    );
  }

  return {
    id: `local-${Date.now()}`,
    name,
    description: `Proyecto real ${name} analizado con arquitectura de código fuente profunda (${nodes.map(n => n.label).join(', ')}).`,
    category: isMultiModuleProject || hasTopLevelAi ? 'AI / ML' : 'Web App',
    healthStatus: 'development',
    complexityScore: Math.min(98, 60 + nodes.length * 8 + stack.length * 4),
    primaryStack: stack,
    clusters,
    nodes,
    edges,
    folderStructure: folderTreeCustom || [],
    snapshots: [
      {
        id: `snap-local-init`,
        versionLabel: 'v1.0 Snapshot Escaneo Local Profundo',
        date: new Date().toISOString().split('T')[0],
        notes: 'Análisis profundo de archivos locales, microservicios, endpoints y código fuente.',
        nodes,
        edges
      }
    ],
    risks: [
      {
        id: 'r-env',
        type: 'security',
        title: 'Verificación de Claves de IA y Entorno Local',
        description: 'Verificar la configuración de llaves secretas de IA y variables de entorno.',
        severity: 'medium',
        targetNodeId: hasTopLevelAi ? 'node-ai-service' : 'node-be-gateway'
      }
    ],
    gitInfo,
    repository: gitInfo.remoteUrl || `github.com/${gitInfo.owner || 'usuario'}/${name.toLowerCase().replace(/\s+/g, '-')}`,
    branch: gitInfo.currentBranch || 'main',
    pendingTasks: [`Verificar rutas y controladores de ${name}`],
    updatedAt: new Date().toISOString()
  };
}

export async function scanNativeDirectoryHandle(
  dirHandle: any,
  onProgress?: (percent: number, stepText: string) => void
): Promise<Project> {
  const files: { name: string; path: string; content: string }[] = [];
  const folderTree: FolderItem[] = [];

  const ignoredFolders = new Set(['node_modules', '.next', 'dist', 'build', '.cache', '__pycache__', 'target', '.git']);

  if (onProgress) onProgress(15, `Escaneando disco local para carpeta ${dirHandle.name}...`);

  let totalFilesDiscovered = 0;

  async function traverse(handle: any, currentPath: string, parentChildrenArray: FolderItem[]) {
    for await (const entry of handle.values()) {
      const itemPath = `${currentPath}/${entry.name}`;

      if (entry.kind === 'directory') {
        if (ignoredFolders.has(entry.name)) continue;

        const folderItem: FolderItem = {
          id: `f-${Math.random().toString(36).substr(2, 9)}`,
          name: entry.name,
          path: itemPath,
          type: 'folder',
          children: []
        };
        parentChildrenArray.push(folderItem);
        await traverse(entry, itemPath, folderItem.children!);
      } else if (entry.kind === 'file') {
        totalFilesDiscovered++;
        const fileItem: FolderItem = {
          id: `file-${Math.random().toString(36).substr(2, 9)}`,
          name: entry.name,
          path: itemPath,
          type: 'file'
        };
        parentChildrenArray.push(fileItem);

        if (
          entry.name.endsWith('package.json') ||
          entry.name.endsWith('schema.prisma') ||
          entry.name.includes('.env') ||
          entry.name.includes('docker') ||
          entry.name.endsWith('requirements.txt') ||
          itemPath.endsWith('.git/config') ||
          itemPath.endsWith('.git/HEAD') ||
          /\.(js|ts|jsx|tsx|py)$/i.test(entry.name)
        ) {
          try {
            const file = await entry.getFile();
            if (file.size < 200000) {
              const content = await file.text();
              files.push({ name: entry.name, path: itemPath, content });

              const pct = Math.min(85, 20 + Math.round((files.length / Math.max(1, totalFilesDiscovered)) * 65));
              if (onProgress) {
                onProgress(pct, `Leyendo código fuente local: ${itemPath}`);
              }
            }
          } catch (e) {
            console.warn(`Could not read local file ${itemPath}:`, e);
          }
        }
      }
    }
  }

  await traverse(dirHandle, `/${dirHandle.name}`, folderTree);

  if (onProgress) onProgress(90, `Generando arquitectura multi-módulo y detectando microservicios...`);

  const proj = autoGenerateProjectFromManifests(files, folderTree, dirHandle.name.replace(/[-_]/g, ' ').toUpperCase());
  (proj as any)._dirHandle = dirHandle;

  if (onProgress) onProgress(100, `¡Mapa de arquitectura local generado exitosamente!`);

  return proj;
}
