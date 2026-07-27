import type { Project, GitInfo, FolderItem } from '../types/architecture';
import { autoGenerateProjectFromManifests } from './scanner';

export interface GithubRepoItem {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  description: string | null;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
  default_branch: string;
}

export interface GithubCommitItem {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author?: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
}

export async function fetchUserGithubRepos(token?: string, username?: string): Promise<GithubRepoItem[]> {
  try {
    // 1. Try Authenticated Fetch if Token is present
    if (token && !token.startsWith('ghp_demo')) {
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    }

    // 2. Fallback to Unauthenticated Public Repos Fetch for Username
    const targetUser = username || 'Sebaxis07';
    const publicRes = await fetch(`https://api.github.com/users/${targetUser}/repos?sort=updated&per_page=100`, {
      headers: {
        Accept: 'application/vnd.github.v3+json'
      }
    });

    if (publicRes.ok) {
      const publicData = await publicRes.json();
      if (Array.isArray(publicData)) return publicData;
    }

    return [];
  } catch (e: any) {
    console.warn('Could not fetch GitHub repos:', e);
    return [];
  }
}

export async function fetchRepoCommits(token: string, owner: string, repo: string): Promise<GithubCommitItem[]> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json'
    };
    if (token && !token.startsWith('ghp_demo')) {
      headers['Authorization'] = `token ${token}`;
    }

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
    return [];
  } catch (e) {
    console.warn('Could not fetch commits:', e);
    return [];
  }
}

export async function importProjectFromGithubRepo(
  token: string,
  owner: string,
  repo: string,
  defaultBranch = 'main',
  onProgress?: (percent: number, stepText: string) => void
): Promise<Project> {
  const fetchedFiles: { name: string; path: string; content: string }[] = [];
  const folderTree: FolderItem[] = [];

  let progressListeners: ((percent: number, stepText: string) => void)[] = [];
  if (onProgress) progressListeners.push(onProgress);

  const reportProgress = (pct: number, text: string) => {
    progressListeners.forEach(fn => fn(pct, text));
  };

  reportProgress(10, `Iniciando conexión con GitHub API para ${owner}/${repo}...`);

  try {
    reportProgress(20, `Verificando repositorio y rama por defecto...`);

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json'
    };
    if (token && !token.startsWith('ghp_demo')) {
      headers['Authorization'] = `token ${token}`;
    }

    // 1. Fetch Repository Details to get real default_branch
    let branchToUse = defaultBranch || 'main';
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (repoRes.ok) {
        const repoDetails = await repoRes.json();
        if (repoDetails.default_branch) {
          branchToUse = repoDetails.default_branch;
        }
      }
    } catch (e) {
      // Use fallback branch
    }

    reportProgress(35, `Consultando árbol recursivo de directorios (branch: ${branchToUse})...`);

    // 2. Fetch Recursive Git Tree
    let treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branchToUse}?recursive=1`, {
      headers
    });

    // Fallback try 'master' if 'main' returned 404
    if (!treeRes.ok && branchToUse !== 'master') {
      branchToUse = 'master';
      treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`, {
        headers
      });
    }

    if (treeRes.ok) {
      const treeData = await treeRes.json();
      const treeItems: any[] = treeData.tree || [];

      reportProgress(55, `Analizando estructura de ${treeItems.length} archivos y microservicios...`);

      const folderMap = new Map<string, FolderItem>();
      const manifestItems = treeItems.filter((item: any) => 
        item.type === 'blob' && (
          item.path.endsWith('package.json') ||
          item.path.endsWith('requirements.txt') ||
          item.path.endsWith('schema.prisma') ||
          item.path.endsWith('Dockerfile') ||
          item.path.includes('.env') ||
          item.path.endsWith('README.md') ||
          /\.(js|ts|jsx|tsx|py)$/i.test(item.path)
        )
      );

      for (const item of treeItems) {
        const parts = item.path.split('/');
        const name = parts[parts.length - 1];
        const isDir = item.type === 'tree';

        const folderItem: FolderItem = {
          id: `gh-${item.sha}`,
          name,
          path: `/${item.path}`,
          type: isDir ? 'folder' : 'file',
          children: isDir ? [] : undefined
        };

        folderMap.set(item.path, folderItem);

        if (parts.length === 1) {
          folderTree.push(folderItem);
        } else {
          const parentPath = parts.slice(0, -1).join('/');
          const parentFolder = folderMap.get(parentPath);
          if (parentFolder && parentFolder.children) {
            parentFolder.children.push(folderItem);
          }
        }
      }

      // Limit max parallel manifest fetches to 15 to avoid GitHub API rate limiting
      const itemsToFetch = manifestItems.slice(0, 15);
      let processedCount = 0;

      for (const item of itemsToFetch) {
        processedCount++;
        const currentPct = Math.min(88, 55 + Math.round((processedCount / Math.max(1, itemsToFetch.length)) * 30));
        reportProgress(currentPct, `Leyendo archivo: ${item.path}`);

        try {
          const rawHeaders: Record<string, string> = {
            Accept: 'application/vnd.github.v3.raw'
          };
          if (token && !token.startsWith('ghp_demo')) {
            rawHeaders['Authorization'] = `token ${token}`;
          }

          const rawRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${item.path}`, {
            headers: rawHeaders
          });

          if (rawRes.ok) {
            const content = await rawRes.text();
            fetchedFiles.push({ name: item.path.split('/').pop() || item.path, path: `/${item.path}`, content });
          }
        } catch (e) {
          // Ignore single file fetch failure
        }
      }
    } else {
      reportProgress(70, `Generando modelo de arquitectura base para ${repo}...`);
    }
  } catch (e) {
    console.warn('Could not fetch recursive GitHub tree:', e);
  }

  reportProgress(92, `Construyendo mapa de nodos de arquitectura y microservicios...`);

  const gitInfo: GitInfo = {
    remoteUrl: `https://github.com/${owner}/${repo}`,
    owner,
    repoName: repo,
    currentBranch: defaultBranch,
    isLinkedToUser: true
  };

  const project = autoGenerateProjectFromManifests(
    fetchedFiles,
    folderTree,
    repo.replace(/[-_]/g, ' ').toUpperCase(),
    gitInfo
  );

  reportProgress(100, `¡Mapa de arquitectura generado con éxito!`);

  // Allow promise subscribers for live progress
  (project as any).subscribeProgress = (fn: (percent: number, stepText: string) => void) => {
    progressListeners.push(fn);
  };

  return project;
}

// Function wrapper that connects progress listeners seamlessly
export function importProjectWithProgress(
  token: string,
  owner: string,
  repo: string,
  defaultBranch = 'main',
  onProgress?: (percent: number, stepText: string) => void
): Promise<Project> {
  return importProjectFromGithubRepo(token, owner, repo, defaultBranch, onProgress);
}
