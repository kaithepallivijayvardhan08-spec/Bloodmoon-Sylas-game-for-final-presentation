import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { sound } from '../services/audio';
import { Shield, Lock, Mail, User, ArrowRight, X, AlertCircle, UserX } from 'lucide-react';

interface AuthModalProps {
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  onPlayAsGuest?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode,
  onClose,
  onSuccess,
  onPlayAsGuest,
}) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [callsign, setCallsign] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim() || (!isLogin && !email.trim())) {
      setErrorMsg('Please complete all required security credentials.');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
      ? { username: username.trim(), password }
      : {
          username: username.trim(),
          email: email.trim(),
          password,
          callsign: callsign.trim() || username.trim(),
        };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Authentication error encountered.');
      }

      sound.playAchievement();
      onSuccess(data.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400 shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black font-mono tracking-tight text-white">
              {isLogin ? 'OPERATIVE VERIFICATION' : 'ENLIST NEW OPERATIVE'}
            </h3>
            <p className="text-xs font-mono text-slate-400">
              MEAN ARCHITECTURE SECURE CREDENTIALS
            </p>
          </div>
        </div>

        {/* Error notice */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 font-mono text-xs">
          <div>
            <label className="block text-slate-400 mb-1">CALLSIGN / USERNAME *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. GhostSniper"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 text-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-slate-400 mb-1">OPERATIVE EMAIL *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="commando@arena.net"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 text-white focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-slate-400 mb-1">TACTICAL ALIAS / CALLSIGN (OPTIONAL)</label>
              <input
                type="text"
                value={callsign}
                onChange={(e) => setCallsign(e.target.value)}
                placeholder="e.g. Apex Viper"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 text-white focus:outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-400 mb-1">SECURITY PASSKEY *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 text-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <span>VERIFYING WITH MAINFRAME...</span>
            ) : (
              <>
                <span>{isLogin ? 'AUTHORIZE ACCESS' : 'COMPLETE REGISTRATION'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode & Guest Button */}
        <div className="mt-5 flex flex-col items-center gap-3 font-mono text-xs text-slate-400">
          <div>
            {isLogin ? (
              <span>
                New operative recruit?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setIsLogin(false);
                    setErrorMsg('');
                  }}
                  className="text-sky-400 hover:underline font-bold"
                >
                  Enlist profile now
                </button>
              </span>
            ) : (
              <span>
                Already enlisted?{' '}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setIsLogin(true);
                    setErrorMsg('');
                  }}
                  className="text-sky-400 hover:underline font-bold"
                >
                  Log in to terminal
                </button>
              </span>
            )}
          </div>

          {onPlayAsGuest && (
            <div className="w-full pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onPlayAsGuest();
                }}
                className="w-full py-2.5 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 hover:text-amber-200 border border-amber-500/40 font-bold transition-all flex items-center justify-center gap-2"
              >
                <UserX className="w-4 h-4" />
                PLAY IMMEDIATELY AS GUEST
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
