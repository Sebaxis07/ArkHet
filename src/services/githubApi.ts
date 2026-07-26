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

export async function importProjectFromGithubRepo(
  token: string,
  owner: string,
  repo: string,
  defaultBranch = 'main',
  onProgress?: (percent: number, stepText: string) => void
): Promise<Project> {
  const fetchedFiles: { name: string; path: string; content: string }[] = [];
  const folderTree: FolderItem[] = [];

  if (onProgress) onProgress(10, `Iniciando conexión con GitHub API para ${owner}/${repo}...`);

  try {
    if (onProgress) onProgress(20, `Consultando árbol recursivo de directorios (branch: ${defaultBranch})...`);

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json'
    };
    if (token && !token.startsWith('ghp_demo')) {
      headers['Authorization'] = `token ${token}`;
    }

    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, {
      headers
    });

    if (treeRes.ok) {
      const treeData = await treeRes.json();
      const treeItems: any[] = treeData.tree || [];

      if (onProgress) onProgress(40, `Analizando estructura de ${treeItems.length} archivos y microservicios...`);

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

      let processedCount = 0;

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

      // Download content for key manifests and microservice source files with progress
      for (const item of manifestItems) {
        processedCount++;
        const currentPct = Math.min(85, 40 + Math.round((processedCount / Math.max(1, manifestItems.length)) * 45));
        
        if (onProgress) {
          onProgress(currentPct, `Descargando manifest/código: ${item.path}`);
        }

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
          // Ignore single file download error
        }
      }
    }
  } catch (e) {
    console.warn('Could not fetch recursive GitHub tree:', e);
  }

  if (onProgress) onProgress(90, `Generando arquitectura multi-módulo y detectando nodos...`);

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

  if (onProgress) onProgress(100, `¡Mapa de arquitectura generado con éxito!`);

  return project;
}
