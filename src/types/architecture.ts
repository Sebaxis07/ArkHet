export type NodeCategory = 
  | 'core'
  | 'frontend' 
  | 'backend' 
  | 'database' 
  | 'auth' 
  | 'storage' 
  | 'infra' 
  | 'queue' 
  | 'microservice' 
  | 'external-api';

export type LayerViewMode = 'logical' | 'physical' | 'code';

export interface Endpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'WS';
  path: string;
  description?: string;
  authRequired?: boolean;
}

export interface DBSchemaTable {
  name: string;
  columnsCount: number;
  relations: string[];
  ormModel?: string;
}

export interface EnvVariable {
  key: string;
  required: boolean;
  sampleValue?: string;
  description?: string;
  isSecret?: boolean;
}

export interface ClusterZone {
  id: string;
  title: string;
  layer: 'presentation' | 'application' | 'data' | 'infra';
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed?: boolean;
}

export interface SubNode {
  id: string;
  label: string;
  type: 'route' | 'controller' | 'service' | 'model' | 'middleware' | 'worker';
  details?: string;
}

export interface ArchNode {
  id: string;
  label: string;
  category: NodeCategory;
  description: string;
  x: number;
  y: number;
  clusterId?: string;
  subNodes?: SubNode[];
  expanded?: boolean;
  techStack?: string[];
  port?: number | string;
  hosting?: string;
  endpoints?: Endpoint[];
  tables?: DBSchemaTable[];
  envVars?: EnvVariable[];
  folderPath?: string;
  status: 'healthy' | 'refactoring' | 'warning' | 'deprecated';
  version?: string;
  coverageScore?: number;
}

export interface ArchEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  protocol?: string;
  layer?: LayerViewMode;
}

export interface FolderItem {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  nodeCategory?: NodeCategory;
  children?: FolderItem[];
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
  type: 'security' | 'performance' | 'tech_debt' | 'missing_docs';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  targetNodeId?: string;
}

export interface GitInfo {
  remoteUrl?: string;
  owner?: string;
  repoName?: string;
  currentBranch?: string;
  lastCommitHash?: string;
  lastCommitMessage?: string;
  uncommittedChangesCount?: number;
  isLinkedToUser?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl: string;
  email?: string;
  gitProvider?: 'github' | 'gitlab';
  accessToken?: string;
  token?: string;
  linkedReposCount?: number;
  gitLinkedAccount?: {
    username?: string;
    accessToken?: string;
    isLinked?: boolean;
  };
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: 'Web App' | 'AI / ML' | 'Microservices' | 'Unity / Game' | 'Internal Tool' | 'Cloud Infra';
  healthStatus: 'production' | 'staging' | 'development' | 'refactoring';
  complexityScore: number;
  repository?: string;
  branch?: string;
  primaryStack: string[];
  clusters?: ClusterZone[];
  nodes: ArchNode[];
  edges: ArchEdge[];
  folderStructure: FolderItem[];
  snapshots: ArchitectureSnapshot[];
  risks?: ArchitectureRisk[];
  gitInfo?: GitInfo;
  userId?: string;
  pendingTasks?: string[];
  updatedAt: string;
}
