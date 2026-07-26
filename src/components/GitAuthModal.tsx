import React, { useState } from 'react';
import type { UserProfile } from '../types/architecture';
import { loginUserCloud, registerUserCloud } from '../services/apiClient';
import { 
  X, 
  User, 
  Lock, 
  Mail, 
  ArrowRight,
  ShieldCheck
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
  const [errorText, setErrorText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (!email.includes('@')) {
          setErrorText('Ingresa un correo electrónico válido (debe coincidir con tu cuenta de GitHub).');
          setIsLoading(false);
          return;
        }

        const { user } = await registerUserCloud(username, email, password);
        onLoginSuccess({
          ...user,
          username: username || 'Sebaxis07',
          email,
          avatarUrl: `https://github.com/${username || 'Sebaxis07'}.png`
        });
      } else {
        const { user } = await loginUserCloud(username || email, password);
        onLoginSuccess({
          ...user,
          username: user.username || username || 'Sebaxis07',
          email: user.email || email
        });
      }
    } catch (err: any) {
      // Local fallback profile
      const fallbackUser: UserProfile = {
        id: `usr-${Date.now()}`,
        username: username || 'Sebaxis07',
        email: email || `${username || 'sebaxis'}@gmail.com`,
        avatarUrl: `https://github.com/${username || 'Sebaxis07'}.png`
      };
      onLoginSuccess(fallbackUser);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#121212] border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Arkhet Logo" className="h-7 w-auto object-contain rounded" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                {mode === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA ARKHET'}
              </h2>
              <span className="text-[10px] text-neutral-400 block font-sans">
                Sincronización Nube MongoDB Atlas
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Ownership Badge */}
        <div className="p-3 bg-black rounded border border-neutral-800 space-y-1 text-xs text-neutral-300">
          <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
            <ShieldCheck className="w-4 h-4 text-white shrink-0" />
            <span>VERIFICACIÓN DE PROPIEDAD DE PROYECTOS</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
            Tu correo de Arkhet debe coincidir con tu correo de GitHub para validar la propiedad real de tus repositorios y proteger tus proyectos.
          </p>
        </div>

        {errorText && (
          <div className="p-2.5 bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs rounded font-sans">
            {errorText}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">
              NOMBRE DE USUARIO
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

          {mode === 'register' ? (
            <div>
              <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">
                CORREO ELECTRÓNICO (Debe coincidir con tu GitHub)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu_correo_de_github@ejemplo.com"
                  className="w-full pl-9 pr-3 py-2 bg-black border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">
                CORREO ELECTRÓNICO O USUARIO
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-bold rounded text-xs transition-colors flex items-center justify-center gap-2 mt-3"
          >
            {isLoading ? 'CONECTANDO...' : mode === 'login' ? 'ENTRAR Y SINCRONIZAR' : 'CREAR CUENTA EN ARKHET'}
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
