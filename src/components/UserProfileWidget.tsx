import React, { useState } from 'react';
import type { UserProfile } from '../types/architecture';
import { LogOut, User, ChevronDown, Key, Cloud } from 'lucide-react';

interface UserProfileWidgetProps {
  user: UserProfile | null;
  onOpenGitAuth: () => void;
  onLogout: () => void;
}

export const UserProfileWidget: React.FC<UserProfileWidgetProps> = ({
  user,
  onOpenGitAuth,
  onLogout
}) => {
  const [isOpenMenu, setIsOpenMenu] = useState(false);

  if (!user) {
    return (
      <button
        onClick={onOpenGitAuth}
        className="px-3 py-1.5 rounded bg-white hover:bg-neutral-200 text-black font-mono font-bold text-xs shadow-lg transition-all flex items-center gap-1.5"
      >
        <User className="w-3.5 h-3.5 text-black" />
        INICIAR SESIÓN / REGISTRO
      </button>
    );
  }

  return (
    <div className="relative font-sans">
      <div
        onClick={() => setIsOpenMenu(!isOpenMenu)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-black border border-neutral-800 hover:border-neutral-600 cursor-pointer transition-colors"
      >
        <img
          src={user.avatarUrl}
          alt={user.username}
          className="w-6 h-6 rounded-full object-cover border border-neutral-700"
        />
        <div className="text-left font-mono">
          <div className="text-xs font-bold text-white leading-none truncate max-w-[110px]">
            @{user.username}
          </div>
          <span className="text-[9px] text-neutral-400 uppercase tracking-tighter flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> NUBE & GIT
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-1" />
      </div>

      {isOpenMenu && (
        <div className="absolute right-0 top-11 w-64 bg-[#141414] border border-neutral-800 rounded-lg shadow-2xl p-4 z-50 font-sans space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-neutral-800">
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-10 h-10 rounded-full object-cover border border-neutral-700"
            />
            <div className="overflow-hidden font-mono">
              <h4 className="text-xs font-bold text-white truncate">@{user.username}</h4>
              {user.email && (
                <p className="text-[10px] text-neutral-400 truncate">{user.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-neutral-400">
              <span>Persistencia Nube:</span>
              <span className="text-white uppercase font-bold flex items-center gap-1">
                <Cloud className="w-3 h-3 text-white" /> MongoDB Atlas
              </span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Estado Git:</span>
              <span className="text-white font-bold uppercase">
                {user.gitLinkedAccount?.isLinked ? '🟢 VINCULADO' : '⚪ LOCAL'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-800 space-y-1 font-mono text-xs">
            <button
              onClick={() => { setIsOpenMenu(false); onOpenGitAuth(); }}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors flex items-center gap-2 font-bold"
            >
              <Key className="w-3.5 h-3.5 text-neutral-400" />
              Cambiar Cuenta / Token Git
            </button>

            <button
              onClick={() => { setIsOpenMenu(false); onLogout(); }}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors flex items-center gap-2 font-bold"
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-400" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
