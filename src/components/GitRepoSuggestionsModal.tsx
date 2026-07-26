import React, { useState, useEffect } from 'react';
import type { Project, UserProfile } from '../types/architecture';
import { fetchUserGithubRepos, importProjectFromGithubRepo, type GithubRepoItem } from '../services/githubApi';
import { 
  X, 
  Search, 
  Star, 
  Lock, 
  Globe, 
  Zap, 
  Sparkles, 
  Key,
  FolderGit2,
  User,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

interface GitRepoSuggestionsModalProps {
  user: UserProfile;
  onImportStart: (repoName: string, promise: Promise<Project>) => void;
  onClose: () => void;
}

export const GitRepoSuggestionsModal: React.FC<GitRepoSuggestionsModalProps> = ({
  user,
  onImportStart,
  onClose
}) => {
  const defaultGitUser = user.username || user.gitLinkedAccount?.username || 'Sebaxis07';
  const [gitUsernameInput, setGitUsernameInput] = useState<string>(defaultGitUser);
  const [repos, setRepos] = useState<GithubRepoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [customToken, setCustomToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  async function loadReposForHandle(handle: string, tokenVal?: string) {
    setIsLoading(true);
    const tokenToUse = tokenVal || customToken || user.token || user.gitLinkedAccount?.accessToken;
    const remoteRepos = await fetchUserGithubRepos(tokenToUse, handle);
    setRepos(remoteRepos);
    setIsLoading(false);
  }

  useEffect(() => {
    loadReposForHandle(gitUsernameInput);
  }, [gitUsernameInput, customToken]);

  const handleStartImporting = (repoItem: GithubRepoItem) => {
    const tokenToUse = customToken || user.token || user.gitLinkedAccount?.accessToken || '';
    const importPromise = importProjectFromGithubRepo(
      tokenToUse,
      repoItem.owner.login,
      repoItem.name,
      repoItem.default_branch || 'main'
    );

    onImportStart(repoItem.name, importPromise);
    onClose();
  };

  const filteredRepos = repos.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.language && r.language.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <img 
              src={`https://github.com/${gitUsernameInput || 'Sebaxis07'}.png`} 
              alt={gitUsernameInput} 
              className="w-8 h-8 rounded-full border border-neutral-700 object-cover"
            />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                REPOSITORIOS DE @{gitUsernameInput}
              </h2>
              <span className="text-[10px] text-neutral-400 font-sans block">
                Proyectos reales verificados para la cuenta {user.email || '@' + user.username}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ownership Verification Banner */}
        <div className="p-2.5 bg-black border border-neutral-800 rounded flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-300 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-white shrink-0" />
            <span>
              Sesión vinculada a <strong>{user.email || '@' + user.username}</strong>
            </span>
          </div>

          <span className="px-2 py-0.5 rounded bg-neutral-900 text-white font-bold text-[10px] border border-neutral-800">
            PROPIETARIO AUTENTICADO
          </span>
        </div>

        {/* Change GitHub Username Bar */}
        <div className="p-3 bg-black border border-neutral-800 rounded space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-neutral-300">
              <User className="w-4 h-4 text-white shrink-0" />
              <span className="font-bold">USUARIO GITHUB:</span>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                value={gitUsernameInput}
                onChange={e => setGitUsernameInput(e.target.value)}
                placeholder="Ej. Sebaxis07"
                className="flex-1 px-3 py-1 bg-[#171717] border border-neutral-700 rounded text-xs text-white font-mono font-bold focus:outline-none focus:border-white"
              />
              <button
                onClick={() => loadReposForHandle(gitUsernameInput)}
                className="px-3 py-1 bg-white text-black font-bold rounded text-xs hover:bg-neutral-200 transition-colors flex items-center gap-1 shrink-0"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                BUSCAR REPOS
              </button>
            </div>
          </div>
        </div>

        {/* Token Input Toggle Bar */}
        <div className="p-2.5 bg-[#141414] border border-neutral-800 rounded flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-400 text-[11px]">
            <Key className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
            <span>
              {customToken || user.token ? '🟢 Token Personal Activo' : '⚪ Mostrando repositorios públicos de @' + gitUsernameInput}
            </span>
          </div>

          <button
            onClick={() => setShowTokenInput(!showTokenInput)}
            className="px-2.5 py-1 bg-black hover:bg-neutral-900 text-neutral-200 font-bold rounded border border-neutral-700 text-[10px] shrink-0"
          >
            {showTokenInput ? 'OCULTAR TOKEN' : 'PAT TOKEN (Para repos privados)'}
          </button>
        </div>

        {showTokenInput && (
          <div className="p-3 bg-[#171717] border border-neutral-800 rounded space-y-2 text-xs">
            <label className="text-[10px] text-neutral-400 uppercase font-bold block">
              Pega tu GitHub Personal Access Token (PAT)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={customToken}
                onChange={e => setCustomToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="flex-1 px-3 py-1.5 bg-black border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
              />
              <button
                onClick={() => loadReposForHandle(gitUsernameInput, customToken)}
                className="px-3 py-1.5 bg-white text-black font-bold rounded text-xs"
              >
                USAR TOKEN
              </button>
            </div>
          </div>
        )}

        {/* Filter Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`FILTRAR REPOSITORIOS DE @${gitUsernameInput} (ej. TesisPag, React)...`}
            className="w-full pl-9 pr-3 py-2 bg-black border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
          />
        </div>

        {/* Repositories List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-neutral-400 font-mono space-y-2">
              <Sparkles className="w-5 h-5 mx-auto animate-spin text-white" />
              <p>Consultando repositorios de @{gitUsernameInput} en GitHub API...</p>
            </div>
          ) : filteredRepos.length > 0 ? (
            filteredRepos.map(repo => (
              <div
                key={repo.id}
                onClick={() => handleStartImporting(repo)}
                className="p-3.5 bg-black rounded-lg border border-neutral-800 hover:border-white transition-all cursor-pointer group flex items-center justify-between gap-3"
              >
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs font-mono group-hover:text-white truncate">
                      {repo.name}
                    </span>

                    {repo.private ? (
                      <span className="px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-300 border border-neutral-800 text-[9px] font-bold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> PRIVADO
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded bg-black text-neutral-400 border border-neutral-800 text-[9px] font-bold flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5 text-neutral-500" /> PÚBLICO
                      </span>
                    )}

                    {repo.language && (
                      <span className="px-1.5 py-0.2 rounded bg-neutral-900 text-white font-bold text-[9px] border border-neutral-800">
                        {repo.language}
                      </span>
                    )}
                  </div>

                  {repo.description && (
                    <p className="text-[11px] text-neutral-400 font-sans line-clamp-1">
                      {repo.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {repo.stargazers_count > 0 && (
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Star className="w-3 h-3 text-neutral-400 fill-neutral-400" /> {repo.stargazers_count}
                    </span>
                  )}

                  <button className="px-3 py-1.5 bg-white text-black font-bold rounded text-[11px] group-hover:bg-neutral-200 transition-colors flex items-center gap-1">
                    <Zap className="w-3 h-3 text-black" />
                    ESCANEAR CÓDIGO
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-black border border-neutral-800 rounded-lg space-y-3">
              <FolderGit2 className="w-8 h-8 mx-auto text-white" />
              <h3 className="text-xs font-bold text-white uppercase font-mono">No se encontraron repositorios para @{gitUsernameInput}</h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                Verifica el nombre de usuario de GitHub arriba o pulsa BUSCAR REPOS para consultar la API.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
