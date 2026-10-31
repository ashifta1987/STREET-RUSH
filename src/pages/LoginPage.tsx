import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Flag, Trophy, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import {
  signInDriver,
  signUpDriver,
  USERNAME_REGEX,
} from '../services/auth';
import { useGameStore } from '../store/gameStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setPlayer = useGameStore((s) => s.setPlayer);

  const [tab, setTab] = useState<'new' | 'returning'>('new');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = username.trim();

    if (tab === 'new') {
      if (!USERNAME_REGEX.test(cleanName)) {
        setError(
          'Driver name must be 3–16 characters (letters, numbers, and underscore only).'
        );
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        const profile = await signUpDriver(cleanName, password);
        setPlayer(profile);
        navigate('/');
      } catch (err: any) {
        setError(err.message || 'Could not create driver account.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!cleanName || !password) {
        setError('Name or password is wrong');
        return;
      }
      setLoading(true);
      try {
        const profile = await signInDriver(cleanName, password);
        setPlayer(profile);
        navigate('/');
      } catch {
        setError('Name or password is wrong');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] relative overflow-hidden flex flex-col justify-center items-center px-4 py-10">
      {/* Ambient racing neon glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#ff3366]/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#00f0ff]/15 blur-[120px]" />

      <div className="w-full max-w-md z-10">
        {/* Game Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff3366]/15 border border-[#ff3366]/40 text-[#ff3366] text-xs font-display font-bold uppercase tracking-widest mb-3">
            <Flag size={14} />
            Global Arcade Street Racing
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl tracking-wider uppercase italic text-white drop-shadow-[0_0_24px_rgba(255,51,102,0.45)]">
            ZAIN <span className="text-[#ff3366]">SUPER RACE</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            5 Racers · 5 World Cities · Server-Verified Global Rankings
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl bg-[#121621]/95 border border-[#232a3d] shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          {/* Tabs: New driver / Returning driver */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#090b10] border border-[#232a3d] mb-6">
            <button
              type="button"
              onClick={() => {
                setTab('new');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition ${
                tab === 'new'
                  ? 'bg-[#ff3366] text-white shadow-lg shadow-[#ff3366]/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus size={15} />
              New Driver
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('returning');
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition ${
                tab === 'returning'
                  ? 'bg-[#00f0ff] text-[#090b10] shadow-lg shadow-[#00f0ff]/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn size={15} />
              Returning Driver
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 px-4 py-3 text-xs sm:text-sm text-rose-200"
            >
              <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Driver Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. Arjun_K"
                maxLength={16}
                autoComplete="username"
                required
                className="w-full rounded-xl bg-[#090b10] border border-[#232a3d] focus:border-[#00f0ff] focus:outline-none px-4 py-3 text-white font-mono text-sm placeholder:text-slate-600 transition"
              />
              {tab === 'new' && (
                <p className="text-[11px] text-slate-500 mt-1">
                  3–16 characters: letters, numbers, and underscore (_) only.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-display font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  autoComplete={tab === 'new' ? 'new-password' : 'current-password'}
                  required
                  className="w-full rounded-xl bg-[#090b10] border border-[#232a3d] focus:border-[#00f0ff] focus:outline-none pl-4 pr-11 py-3 text-white text-sm placeholder:text-slate-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {tab === 'new' && (
              <div>
                <label className="block text-xs font-display font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl bg-[#090b10] border border-[#232a3d] focus:border-[#00f0ff] focus:outline-none px-4 py-3 text-white text-sm placeholder:text-slate-600 transition"
                />
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                fullWidth
                size="lg"
                disabled={loading}
              >
                {loading
                  ? 'Connecting...'
                  : tab === 'new'
                  ? 'Create Driver & Enter Garage'
                  : 'Rejoin & Continue Racing'}
              </Button>
            </div>
          </form>
        </div>

        {/* Public Leaderboard Link */}
        <div className="mt-6 text-center">
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-display font-bold uppercase tracking-wider text-[#00f0ff] hover:underline"
          >
            <Trophy size={16} />
            View Global Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
};

