import React, { useState, useEffect } from 'react';
import type { Project, UserProfile } from '../types/architecture';
import { fetchRepoCommits, type GithubCommitItem } from '../services/githubApi';
import { 
  X, 
  GitCommit, 
  ExternalLink, 
  Search, 
  Sparkles, 
  Clock, 
  FolderGit2
} from 'lucide-react';

interface CommitHistoryModalProps {
  project: Project;
  user: UserProfile;
  onClose: () => void;
}

export const CommitHistoryModal: React.FC<CommitHistoryModalProps> = ({
  project,
  user,
  onClose
}) => {
  const [commits, setCommits] = useState<GithubCommitItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const owner = project.gitInfo?.owner || user.gitLinkedAccount?.username || 'Sebaxis07';
  const repoName = project.gitInfo?.repoName || project.name.toLowerCase().replace(/\s+/g, '-');
  const tokenToUse = user.token || user.gitLinkedAccount?.accessToken || '';

  useEffect(() => {
    async function loadCommits() {
      setIsLoading(true);
      const commitList = await fetchRepoCommits(tokenToUse, owner, repoName);
      setCommits(commitList);
      setIsLoading(false);
    }
    loadCommits();
  }, [owner, repoName, tokenToUse]);

  const filteredCommits = commits.filter(c => 
    c.commit.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.sha.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.commit.author?.name && c.commit.author.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded border border-neutral-800">
              <GitCommit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                HISTORIAL DE COMMITS DE @{owner}/{repoName}
              </h2>
              <span className="text-[10px] text-neutral-400 font-sans block">
                Línea de tiempo de commits de la rama <span className="text-white font-mono font-bold">{project.branch || 'main'}</span>
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="FILTRAR COMMITS POR MENSAJE, HASH O AUTOR (ej. feat, fix)..."
            className="w-full pl-9 pr-3 py-2 bg-black border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
          />
        </div>

        {/* Commits Timeline List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-neutral-400 font-mono space-y-2">
              <Sparkles className="w-5 h-5 mx-auto animate-spin text-white" />
              <p>Consultando historial de commits en GitHub API...</p>
            </div>
          ) : filteredCommits.length > 0 ? (
            filteredCommits.map((item, idx) => {
              const commitDate = new Date(item.commit.author.date).toLocaleString();
              const authorAvatar = item.author?.avatar_url || `https://github.com/${owner}.png`;
              const authorName = item.commit.author.name || item.author?.login || owner;
              const shortSha = item.sha.substring(0, 7);

              return (
                <div 
                  key={item.sha}
                  className="p-3.5 bg-black rounded-lg border border-neutral-800 hover:border-white transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-2 py-0.5 rounded bg-white text-black font-bold text-[10px] shrink-0">
                        {shortSha}
                      </span>

                      {idx === 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-neutral-900 text-neutral-300 border border-neutral-800 text-[9px] font-bold">
                          HEAD / ÚLTIMO
                        </span>
                      )}
                    </div>

                    <a
                      href={item.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 font-mono hover:underline shrink-0"
                    >
                      VER EN GITHUB <ExternalLink className="w-3 h-3 text-neutral-500" />
                    </a>
                  </div>

                  <p className="text-xs font-bold text-white font-mono leading-relaxed group-hover:text-white">
                    {item.commit.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-2 border-t border-neutral-900">
                    <div className="flex items-center gap-2">
                      <img 
                        src={authorAvatar} 
                        alt={authorName} 
                        className="w-4 h-4 rounded-full border border-neutral-700" 
                      />
                      <span className="text-neutral-300 font-bold">{authorName}</span>
                    </div>

                    <div className="flex items-center gap-1 text-neutral-500">
                      <Clock className="w-3 h-3" />
                      <span>{commitDate}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-black border border-neutral-800 rounded-lg space-y-3 font-mono">
              <FolderGit2 className="w-8 h-8 mx-auto text-neutral-500" />
              <h3 className="text-xs font-bold text-white uppercase">No se encontraron commits en este repositorio</h3>
              <p className="text-[11px] text-neutral-400">
                Verifica que el repositorio <strong className="text-white">@{owner}/{repoName}</strong> exista y esté público en GitHub.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
