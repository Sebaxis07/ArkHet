export type NodeCategory = 
  | 'frontend' 
  | 'backend' 
  | 'database' 
  | 'queue' 
  | 'microservice' 
  | 'auth' 
  | 'storage' 
  | 'devops' 
  | 'cloud';

export type NodeStatus = 'healthy' | 'refactoring' | 'warning' | 'deprecated';

export type LayerViewMode = 'logical' | 'physical' | 'code';

export interface Endpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS';
  path: string;
  description?: string;
  parameters?: string[];
  responseType?: string;
}

export interface DBSchemaTable {
  name: string;
  columnsCount: number;
  relations: string[];
  sampleFields?: Array<{ name: string; type: string; isPk?: boolean; isIndexed?: boolean }>;
}

export interface EnvVariable {
  key: string;
  sampleValue?: string;
  isSecret?: boolean;
  required?: boolean;
}

export interface SubNode {
  id: string;
  label: string;
  type: 'route' | 'controller' | 'service' | 'model' | 'worker' | 'component' | 'config';
  details?: string;
  linesOfCode?: number;
}

export interface ArchNode {
  id: string;
  label: string;
  category: NodeCategory;
  clusterId?: string;
  description: string;
  x: number;
  y: number;
  techStack?: string[];
  port?: number;
  hosting?: string;
  domainUrl?: string;
  cpuRam?: string;
  sslEnabled?: boolean;
  folderPath?: string;
  status: NodeStatus;
  endpoints?: Endpoint[];
  tables?: DBSchemaTable[];
  envVars?: EnvVariable[];
  subNodes?: SubNode[];
  isDeployed?: boolean;
  deploymentUrl?: string;
  cloudProvider?: string;
}

export interface ArchEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  protocol?: 'HTTP' | 'HTTPS' | 'TCP' | 'gRPC' | 'WS' | 'WSS' | 'ORM' | 'File Access' | 'AMQP' | 'Kafka';
  physicalProtocol?: string;
  codeInvocation?: string;
}

export interface ClusterZone {
  id: string;
  title: string;
  layer: 'presentation' | 'application' | 'data' | 'infrastructure' | 'cloud_deployment';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ArchitectureSnapshot {
  id: string;
  versionLabel: string;
  date: string;
  notes: string;
  nodes: ArchNode[];
  edges: ArchEdge[];
}

export interface ArchitectureRisk {
  id: string;
  type: 'security' | 'bottleneck' | 'deprecated' | 'coupling';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  targetNodeId?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: FolderItem[];
  nodeCategory?: NodeCategory;
}

export interface GitInfo {
  remoteUrl?: string;
  owner?: string;
  repoName?: string;
  currentBranch?: string;
  isLinkedToUser?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  token?: string;
  gitLinkedAccount?: {
    username: string;
    accessToken: string;
    isLinked?: boolean;
  };
}

export interface Project {
  id: string;
  userId?: string;
  name: string;
  description: string;
  category: string;
  healthStatus: 'production' | 'healthy' | 'refactoring' | 'staging' | 'warning' | 'critical' | 'development';
  complexityScore: number;
  primaryStack: string[];
  clusters: ClusterZone[];
  nodes: ArchNode[];
  edges: ArchEdge[];
  folderStructure: FolderItem[];
  snapshots: ArchitectureSnapshot[];
  risks?: ArchitectureRisk[];
  gitInfo?: GitInfo;
  repository?: string;
  branch?: string;
  pendingTasks?: string[];
  updatedAt: string;
}
