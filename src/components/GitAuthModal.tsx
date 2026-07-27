import React, { useState } from 'react';
import type { UserProfile } from '../types/architecture';
import { loginUserCloud, registerUserCloud } from '../services/apiClient';
import { 
  X, 
  User, 
  Lock, 
  Mail, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
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
        if (!username || username.trim().length < 3) {
          setErrorText('El nombre de usuario debe tener al menos 3 caracteres.');
          setIsLoading(false);
          return;
        }

        if (!email || !email.includes('@')) {
          setErrorText('Ingresa un correo electrónico válido (debe coincidir con tu cuenta de GitHub).');
          setIsLoading(false);
          return;
        }

        if (!password || password.length < 4) {
          setErrorText('La contraseña debe tener al menos 4 caracteres.');
          setIsLoading(false);
          return;
        }

        const { user } = await registerUserCloud(username, email, password);
        onLoginSuccess({
          ...user,
          username: user.username || username,
          email: user.email || email,
          avatarUrl: `https://github.com/${username}.png`
        });
      } else {
        if (!username && !email) {
          setErrorText('Ingresa tu nombre de usuario o correo electrónico.');
          setIsLoading(false);
          return;
        }

        if (!password) {
          setErrorText('Ingresa tu contraseña.');
          setIsLoading(false);
          return;
        }

        const { user } = await loginUserCloud(username || email, password);
        onLoginSuccess({
          ...user,
          username: user.username || username,
          email: user.email || email,
          avatarUrl: `https://github.com/${user.username || username || 'Sebaxis07'}.png`
        });
      }
    } catch (err: any) {
      // STRICT AUTH: Display clear error and DO NOT bypass login with fake profiles!
      setErrorText(err.message || 'Error de autenticación. Usuario o contraseña incorrectos.');
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
            <span>AUTENTICACIÓN SEGURA Y VERIFICACIÓN</span>
          </div>
          <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
            Ingresa tus credenciales registradas para autenticarte contra la API de Arkhet.
          </p>
        </div>

        {/* Error Notification Alert */}
        {errorText && (
          <div className="p-3 bg-black border border-neutral-700 text-white text-xs rounded font-sans flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
            <span>{errorText}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">
              NOMBRE DE USUARIO / EMAIL
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Ej. Sebaxis07"
                className="w-full pl-9 pr-3 py-2 bg-black border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-[10px] text-neutral-400 font-bold uppercase block mb-1">
                CORREO ELECTRÓNICO (GITHUB)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu_correo@github.com"
                  className="w-full pl-9 pr-3 py-2 bg-black border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
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
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-black border border-neutral-800 rounded text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-white text-black font-bold text-xs rounded hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? 'VERIFICANDO CREDENCIALES...' : mode === 'login' ? 'INICIAR SESIÓN' : 'REGISTRAR CUENTA'}
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-neutral-800 text-[11px] text-neutral-400 font-sans">
          {mode === 'login' ? (
            <span>
              ¿No tienes una cuenta aún?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorText(''); }}
                className="text-white font-bold underline hover:text-neutral-200"
              >
                Regístrate aquí
              </button>
            </span>
          ) : (
            <span>
              ¿Ya tienes cuenta en Arkhet?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorText(''); }}
                className="text-white font-bold underline hover:text-neutral-200"
              >
                Inicia sesión aquí
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
