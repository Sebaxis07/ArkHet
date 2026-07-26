import type { Project, ArchNode, ArchEdge, FolderItem, ClusterZone, GitInfo, SubNode, DBSchemaTable, Endpoint, EnvVariable } from '../types/architecture';

export interface ScanResult {
  projectName: string;
  detectedStack: string[];
  inferredNodes: ArchNode[];
  inferredEdges: ArchEdge[];
  folderStructure: FolderItem[];
  warnings: string[];
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
    if (deps.fastify) { stack.push('Fastify'); }
    if (deps.typescript) { stack.push('TypeScript'); }

    // Queues & Event Messaging
    let hasQueue = false;
    if (deps.bull || deps.bullmq || deps.amqplib || deps.kafkajs || deps.redis || deps.ioredis) {
      hasQueue = true;
      if (deps.bull || deps.bullmq) stack.push('BullMQ Queue');
      if (deps.amqplib) stack.push('RabbitMQ AMQP');
      if (deps.kafkajs) stack.push('Apache Kafka');
      if (deps.redis || deps.ioredis) stack.push('Redis Broker');
    }

    // AI & Machine Learning SDKs
    let hasAiService = false;
    if (deps.openai || deps['@google/generative-ai'] || deps.langchain || deps['@langchain/core'] || deps.pinecone) {
      hasAiService = true;
      if (deps.openai) stack.push('OpenAI GPT-4 API');
      if (deps['@google/generative-ai']) stack.push('Gemini AI API');
      if (deps.pinecone) stack.push('Pinecone Vector DB');
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
      hasAiService,
      hasQueue
    };
  } catch (e) {
    return { name: 'proyecto-local', stack: [], rawDeps: [], scripts: {}, detectedDb: '', detectedOrm: '', hasExpress: false, hasMongoose: false, hasPrisma: false, hasReact: false, hasAiService: false, hasQueue: false };
  }
}

export function deepAnalyzeCodeFiles(files: { name: string; path: string; content: string }[]): {
  extractedEndpoints: Endpoint[];
  extractedAiServices: string[];
  extractedModels: DBSchemaTable[];
  extractedComponents: SubNode[];
  extractedBackendServices: SubNode[];
  extractedEnvVars: EnvVariable[];
} {
  const extractedEndpoints: Endpoint[] = [];
  const extractedAiServices: string[] = [];
  const extractedModels: DBSchemaTable[] = [];
  const extractedComponents: SubNode[] = [];
  const extractedBackendServices: SubNode[] = [];
  const extractedEnvVars: EnvVariable[] = [];

  const seenPaths = new Set<string>();
  const seenEnvs = new Set<string>();

  for (const file of files) {
    const content = file.content;
    const pathLower = file.path.toLowerCase();

    // 1. Process.env extraction
    const envRegex = /process\.env\.([A-Z0-9_]+)/g;
    let envMatch;
    while ((envMatch = envRegex.exec(content)) !== null) {
      const key = envMatch[1];
      if (!seenEnvs.has(key)) {
        seenEnvs.add(key);
        extractedEnvVars.push({
          key,
          sampleValue: key.includes('SECRET') || key.includes('TOKEN') || key.includes('PASS') ? '••••••••' : 'dev_value',
          isSecret: /SECRET|TOKEN|KEY|PASSWORD|MONGO|URL|AUTH/i.test(key),
          required: true
        });
      }
    }

    // 2. AI Service Detection in Code
    if (/openai|generative-ai|langchain|pinecone|gemini|fastapi/i.test(content)) {
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

    // 3. Endpoint Extraction with Parameter Parsing
    const routeRegex = /(?:app|router|server)\.(get|post|put|delete|patch|use)\s*\(\s*['"]([^'"]+)['"]/gi;
    let routeMatch;
    while ((routeMatch = routeRegex.exec(content)) !== null) {
      const method = routeMatch[1].toUpperCase() as any;
      const path = routeMatch[2];
      if (!seenPaths.has(`${method}:${path}`) && path.startsWith('/')) {
        seenPaths.add(`${method}:${path}`);

        // Parse path parameters like :id
        const params = (path.match(/:[a-zA-Z0-9_]+/g) || []).map(p => p.substring(1));

        extractedEndpoints.push({
          id: `ep-deep-${extractedEndpoints.length + 1}`,
          method,
          path,
          description: `Ruta en ${file.name}`,
          parameters: params.length > 0 ? params : undefined
        });
      }
    }

    // 4. UI Components Extraction with LoC
    if (pathLower.includes('component') || pathLower.includes('view') || pathLower.includes('page')) {
      const nameNoExt = file.name.replace(/\.[^/.]+$/, '');
      const cleanName = nameNoExt.charAt(0).toUpperCase() + nameNoExt.slice(1);
      if (!extractedComponents.some(c => c.label === cleanName)) {
        extractedComponents.push({
          id: `sn-comp-${extractedComponents.length + 1}`,
          label: cleanName,
          type: 'component',
          details: file.path,
          linesOfCode: (content.match(/\n/g) || []).length + 1
        });
      }
    }

    // 5. Backend Services Extraction
    if (pathLower.includes('service') || pathLower.includes('controller') || pathLower.includes('helper') || pathLower.includes('worker')) {
      const nameNoExt = file.name.replace(/\.[^/.]+$/, '');
      const cleanName = nameNoExt.charAt(0).toUpperCase() + nameNoExt.slice(1);
      const isService = pathLower.includes('service');
      const isWorker = pathLower.includes('worker');
      if (!extractedBackendServices.some(s => s.label === cleanName)) {
        extractedBackendServices.push({
          id: `sn-srv-${extractedBackendServices.length + 1}`,
          label: cleanName,
          type: isWorker ? 'worker' : isService ? 'service' : 'controller',
          details: file.path,
          linesOfCode: (content.match(/\n/g) || []).length + 1
        });
      }
    }

    // 6. Deep Database Schema Fields Extraction (Mongoose / Prisma)
    const mongooseModelMatch = content.match(/mongoose\.model\s*\(\s*['"]([^'"]+)['"]/i);
    if (mongooseModelMatch && mongooseModelMatch[1]) {
      const modelName = mongooseModelMatch[1];
      if (!extractedModels.some(m => m.name === modelName)) {
        const fields: Array<{ name: string; type: string; isPk?: boolean; isIndexed?: boolean }> = [
          { name: '_id', type: 'ObjectId', isPk: true }
        ];

        // Match field names and types in Mongoose Schema
        const fieldMatches = content.matchAll(/([a-zA-Z0-9_]+)\s*:\s*\{\s*type\s*:\s*([a-zA-Z0-9_\.]+)/g);
        for (const fm of fieldMatches) {
          if (fm[1] !== '_id' && !fields.some(f => f.name === fm[1])) {
            fields.push({
              name: fm[1],
              type: fm[2].replace('Schema.Types.', ''),
              isIndexed: /index|unique/i.test(content)
            });
          }
        }

        extractedModels.push({
          name: modelName,
          columnsCount: Math.max(fields.length, 5),
          relations: [],
          sampleFields: fields
        });
      }
    }
  }

  return {
    extractedEndpoints,
    extractedAiServices,
    extractedModels,
    extractedComponents,
    extractedBackendServices,
    extractedEnvVars
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
    hasAiService: false,
    hasQueue: false
  };

  if (pkgFile) {
    parsedPkg = parsePackageJson(pkgFile.content);
    if (parsedPkg.name && parsedPkg.name !== 'proyecto-local') {
      rawName = parsedPkg.name.replace(/[-_]/g, ' ').toUpperCase();
    }
  }

  const name = rawName.replace(/BACKEND|FRONTEND|SERVER|CLIENT/gi, '').trim() || rawName;
  const deepAnalysis = deepAnalyzeCodeFiles(files);

  let gitInfo: GitInfo = gitInfoCustom || {};

  // Detect TOP-LEVEL Microservice Folders
  const topLevelFolders = (folderTreeCustom || []).filter(item => item.type === 'folder');
  const topLevelFolderNames = topLevelFolders.map(f => f.name.toLowerCase());

  const hasTopLevelAi = topLevelFolderNames.some(n => n.includes('ai') || n.includes('ml') || n.includes('llm'));
  const hasTopLevelFrontend = topLevelFolderNames.some(n => n.includes('frontend') || n.includes('client') || n.includes('web'));
  const hasTopLevelBackend = topLevelFolderNames.some(n => n.includes('backend') || n.includes('server') || n.includes('api'));
  const hasTopLevelUploads = topLevelFolderNames.some(n => n.includes('upload') || n.includes('deliverable') || n.includes('storage') || n.includes('media'));
  const hasTopLevelDevops = topLevelFolderNames.some(n => n.includes('docker') || n.includes('k8s') || n.includes('deploy') || n.includes('ci'));

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
    { id: 'zone-fe', title: `CAPA 1: PRESENTACIÓN CLIENTE`, layer: 'presentation', x: 40, y: 80, width: 340, height: 460 },
    { id: 'zone-be', title: `CAPA 2: SERVIDORES API Y NEGOCIO`, layer: 'application', x: 420, y: 80, width: 440, height: 460 },
    { id: 'zone-db', title: `CAPA 3: PERSISTENCIA E INFRAESTRUCTURA`, layer: 'data', x: 900, y: 80, width: 360, height: 460 }
  ];

  const nodes: ArchNode[] = [];
  const edges: ArchEdge[] = [];

  if (isMultiModuleProject) {
    // 1. FRONTEND NODE
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
      hosting: 'Vite / Vercel Serverless',
      domainUrl: `https://${name.toLowerCase().replace(/\s+/g, '')}.vercel.app`,
      cpuRam: '1 vCPU / 2GB RAM',
      sslEnabled: true,
      folderPath: feFolder ? feFolder.path : '/frontend',
      status: 'healthy',
      subNodes: deepAnalysis.extractedComponents.length > 0 ? deepAnalysis.extractedComponents : [
        { id: 'sn-fe-1', label: `UI Components`, type: 'component', details: '/frontend/src/components', linesOfCode: 1420 },
        { id: 'sn-fe-2', label: 'ApiClient', type: 'service', details: '/frontend/src/api', linesOfCode: 380 }
      ]
    });

    // 2. BACKEND NODE
    const beFolder = topLevelFolders.find(f => /backend|server|api/i.test(f.name));
    nodes.push({
      id: 'node-be-gateway',
      label: `Servidor Backend API`,
      category: 'backend',
      clusterId: 'zone-be',
      description: `Servidor API de negocio y autenticación en ${beFolder ? beFolder.path : '/backend'}`,
      x: 450,
      y: 140,
      techStack: ['Express.js', 'Node.js', 'Mongoose ORM', 'JWT Auth'],
      port: 5000,
      hosting: 'Node.js Runtime / Vercel API',
      domainUrl: `https://api.${name.toLowerCase().replace(/\s+/g, '')}.com`,
      cpuRam: '2 vCPU / 4GB RAM',
      sslEnabled: true,
      folderPath: beFolder ? beFolder.path : '/backend',
      status: 'healthy',
      envVars: deepAnalysis.extractedEnvVars.length > 0 ? deepAnalysis.extractedEnvVars : [
        { key: 'PORT', sampleValue: '5000', required: true },
        { key: 'MONGODB_URI', sampleValue: 'mongodb+srv://user:pass@cluster.mongodb.net', isSecret: true, required: true },
        { key: 'JWT_SECRET', sampleValue: '••••••••••••', isSecret: true, required: true }
      ],
      subNodes: deepAnalysis.extractedBackendServices.length > 0 ? deepAnalysis.extractedBackendServices : [
        { id: 'sn-be-1', label: 'AuthRouter', type: 'route', details: '/backend/routes/auth.js', linesOfCode: 240 },
        { id: 'sn-be-2', label: 'MainController', type: 'controller', details: '/backend/controllers/main.js', linesOfCode: 580 }
      ],
      endpoints: deepAnalysis.extractedEndpoints.length > 0 ? deepAnalysis.extractedEndpoints : [
        { id: 'ep-1', method: 'GET', path: '/api/v1/health', description: 'Health check probe' },
        { id: 'ep-2', method: 'POST', path: '/api/v1/data', description: 'Procesar requerimiento' }
      ]
    });

    // 3. AI MICROSERVICE NODE
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
        domainUrl: `http://localhost:8000`,
        cpuRam: '4 vCPU / 8GB RAM',
        sslEnabled: false,
        folderPath: aiFolder ? aiFolder.path : '/ai-service',
        status: 'healthy',
        subNodes: [
          { id: 'sn-ai-1', label: 'PromptEngine', type: 'service', details: 'Inferencia LLM', linesOfCode: 420 },
          { id: 'sn-ai-2', label: 'EmbeddingIndexer', type: 'worker', details: 'Vectorización Contextual', linesOfCode: 310 }
        ]
      });

      edges.push({
        id: 'e-be-ai',
        source: 'node-be-gateway',
        target: 'node-ai-service',
        label: 'gRPC / REST API Stream',
        protocol: 'gRPC',
        physicalProtocol: 'TCP/IP Port 8000',
        codeInvocation: 'axios.post("http://localhost:8000/predict")'
      });
    }

    // 4. QUEUE BROKER NODE (If Queues detected)
    if (parsedPkg.hasQueue) {
      nodes.push({
        id: 'node-queue-broker',
        label: `Broker de Colas BullMQ / Redis`,
        category: 'queue',
        clusterId: 'zone-be',
        description: `Gestión asíncrona de eventos y tareas en segundo plano`,
        x: 450,
        y: 420,
        techStack: ['Redis 7.0', 'BullMQ Queue', 'AMQP Worker'],
        port: 6379,
        hosting: 'Redis Enterprise Cloud',
        cpuRam: '1 vCPU / 2GB RAM',
        status: 'healthy',
        subNodes: [
          { id: 'sn-q1', label: 'NotificationWorker', type: 'worker', details: 'Procesador de correos', linesOfCode: 180 }
        ]
      });

      edges.push({
        id: 'e-be-queue',
        source: 'node-be-gateway',
        target: 'node-queue-broker',
        label: 'Async Job Dispatch',
        protocol: 'AMQP',
        physicalProtocol: 'TCP/IP Port 6379',
        codeInvocation: 'queue.add("emailJob", data)'
      });
    }

    // 5. FILE STORAGE NODE
    if (hasTopLevelUploads) {
      const uploadFolder = topLevelFolders.find(f => /upload|deliverable|storage|media/i.test(f.name));
      nodes.push({
        id: 'node-storage-uploads',
        label: `Almacenamiento S3 / Local`,
        category: 'storage',
        clusterId: 'zone-db',
        description: `Repositorio de documentos y archivos adjuntos`,
        x: 930,
        y: 320,
        techStack: ['AWS S3 Bucket', 'Multer Storage'],
        folderPath: uploadFolder ? uploadFolder.path : '/uploads',
        status: 'healthy'
      });

      edges.push({
        id: 'e-be-storage',
        source: 'node-be-gateway',
        target: 'node-storage-uploads',
        label: 'FS Stream Access',
        protocol: 'File Access',
        physicalProtocol: 'HTTPS Port 443',
        codeInvocation: 'fs.createReadStream(path)'
      });
    }

    // 6. DATABASE NODE
    nodes.push({
      id: 'node-db-main',
      label: `Base de Datos MongoDB`,
      category: 'database',
      clusterId: 'zone-db',
      description: `Almacenamiento persistente de datos de ${name}`,
      x: 930,
      y: 460,
      techStack: ['MongoDB 7.0', 'Mongoose ODM'],
      port: 27017,
      hosting: 'MongoDB Atlas Cloud Cluster',
      cpuRam: 'Dedicated Cluster M10',
      sslEnabled: true,
      status: 'healthy',
      tables: deepAnalysis.extractedModels.length > 0 ? deepAnalysis.extractedModels : [
        { name: `${name}Data`, columnsCount: 10, relations: ['Usuarios'] },
        { name: 'Usuarios', columnsCount: 8, relations: [] }
      ]
    });

    edges.push(
      { id: 'e-fe-be', source: 'node-fe-app', target: 'node-be-gateway', label: 'HTTP REST / JSON', protocol: 'HTTP', physicalProtocol: 'TLS/HTTPS 443', codeInvocation: 'fetch("/api/data")' },
      { id: 'e-be-db', source: 'node-be-gateway', target: 'node-db-main', label: 'Mongoose ODM Connection', protocol: 'ORM', physicalProtocol: 'MongoDB Wire Protocol 27017', codeInvocation: 'mongoose.connect(URI)' }
    );
  } else {
    // Single directory architecture
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
        domainUrl: `http://localhost:5173`,
        folderPath: '/src',
        status: 'healthy',
        subNodes: deepAnalysis.extractedComponents.length > 0 ? deepAnalysis.extractedComponents : [
          { id: 'sn-fe-1', label: `${name}UI`, type: 'component' }
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
        domainUrl: `http://localhost:5000`,
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
        hosting: 'MongoDB Atlas Cloud',
        status: 'healthy',
        tables: deepAnalysis.extractedModels
      }
    );

    edges.push(
      { id: 'e1', source: 'node-fe-app', target: 'node-be-gateway', label: 'HTTP REST / JSON', protocol: 'HTTP', physicalProtocol: 'HTTP Port 5000', codeInvocation: 'apiClient.get()' },
      { id: 'e2', source: 'node-be-gateway', target: 'node-db-main', label: 'Mongoose ODM Connection', protocol: 'ORM', physicalProtocol: 'TCP/IP Port 27017', codeInvocation: 'Model.find()' }
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
        versionLabel: 'v1.0 Snapshot Escaneo Profundo',
        date: new Date().toISOString().split('T')[0],
        notes: 'Análisis de variables process.env, esquemas DB, colas y subcomponentes.',
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
