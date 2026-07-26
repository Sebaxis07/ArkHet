import React, { useState } from 'react';
import type { UserProfile } from '../types/architecture';
import { loginUserCloud, registerUserCloud } from '../services/apiClient';
import { 
  X, 
  User, 
  Lock, 
  FolderGit2, 
  Mail, 
  ArrowRight,
  Cloud
} from 'lucide-react';

interface GitAuthModalProps {
  onLoginSuccess: (user: UserProfile) => void;
  onClose: () => void;
}

export const GitAuthModal: React.FC<GitAuthModalProps> = ({
  onLoginSuccess,
  onClose
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gitToken, setGitToken] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        const { user } = await registerUserCloud(username, email, password);
        onLoginSuccess({
          ...user,
          username: username || 'Sebaxis07',
          email,
          avatarUrl: `https://github.com/${username || 'Sebaxis07'}.png`,
          token: gitToken || undefined
        });
      } else {
        const { user } = await loginUserCloud(username || email, password);
        onLoginSuccess({
          ...user,
          username: user.username || username || 'Sebaxis07',
          token: gitToken || undefined
        });
      }
    } catch (err: any) {
      // Fallback local account creation if backend server is not connected yet
      const fallbackUser: UserProfile = {
        id: `usr-${Date.now()}`,
        username: username || 'Sebaxis07',
        email: email || `${username || 'sebaxis'}@arkhet.os`,
        avatarUrl: `https://github.com/${username || 'Sebaxis07'}.png`,
        token: gitToken || undefined,
        gitLinkedAccount: gitToken ? {
          username: username || 'Sebaxis07',
          accessToken: gitToken,
          isLinked: true
        } : undefined
      };
      onLoginSuccess(fallbackUser);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Arkhet Logo" className="h-7 w-auto object-contain rounded" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {mode === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA ARKHET'}
              </h2>
              <span className="text-[10px] text-neutral-400 block font-sans">
                Nube MongoDB Atlas & Integración Git
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cloud Badge */}
        <div className="p-3 bg-black rounded border border-neutral-800 flex items-center gap-2 text-xs text-neutral-300">
          <Cloud className="w-4 h-4 text-white shrink-0" />
          <span>Sincroniza tus proyectos entre PC y Celular mediante tu cuenta de usuario.</span>
        </div>

        {errorText && (
          <div className="p-2.5 bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs rounded">
            {errorText}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">
              {mode === 'login' ? 'USUARIO O CORREO' : 'NOMBRE DE USUARIO DE GIT / ARKHET'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Ej. Sebaxis07"
                className="w-full pl-9 pr-3 py-2 bg-black border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">
                CORREO ELECTRÓNICO
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  className="w-full pl-9 pr-3 py-2 bg-black border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">
              CONTRASEÑA
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-black border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                required
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">
              TOKEN OPCIONAL DE GITHUB (Personal Access Token)
            </label>
            <div className="relative">
              <FolderGit2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="password"
                value={gitToken}
                onChange={e => setGitToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx (Opcional para repos privados)"
                className="w-full pl-9 pr-3 py-2 bg-black border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-bold rounded text-xs transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? 'CONECTANDO...' : mode === 'login' ? 'ENTRAR Y SINCRONIZAR' : 'CREAR CUENTA Y CONECTAR'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-neutral-800 text-center text-xs">
          {mode === 'login' ? (
            <button
              onClick={() => setMode('register')}
              className="text-neutral-400 hover:text-white font-bold"
            >
              ¿No tienes cuenta? <span className="underline text-white">Regístrate en Arkhet</span>
            </button>
          ) : (
            <button
              onClick={() => setMode('login')}
              className="text-neutral-400 hover:text-white font-bold"
            >
              ¿Ya tienes cuenta? <span className="underline text-white">Inicia sesión</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
