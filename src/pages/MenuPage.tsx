import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flag,
  Trophy,
  User,
  LogOut,
  Volume2,
  VolumeX,
  Zap,
  Award,
  Gauge,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { signOutDriver } from '../services/auth';
import { fetchProfileStats, ProfileStats } from '../services/races';
import { useGameStore } from '../store/gameStore';
import { CARS, CITIES, TRACK_METADATA } from '../game/content';

export const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    player,
    setPlayer,
    selectedCityId,
    selectedTrackId,
    selectedCarId,
    soundEnabled,
    toggleSound,
  } = useGameStore();

  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!player) return;
    let active = true;
    setLoadingStats(true);
    fetchProfileStats(player.id)
      .then((res) => {
        if (active) setStats(res);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingStats(false);
      });
    return () => {
      active = false;
    };
  }, [player]);

  const handleLogout = async () => {
    await signOutDriver();
    setPlayer(null);
    navigate('/login');
  };

  const currentCity = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
  const currentTrack =
    TRACK_METADATA.find((t) => t.id === selectedTrackId) || TRACK_METADATA[0];
  const currentCar = CARS.find((c) => c.id === selectedCarId) || CARS[0];

  return (
    <div className="min-h-screen bg-[#090b10] relative overflow-hidden flex flex-col justify-between px-4 py-6 sm:px-8 sm:py-10">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -top-36 left-1/2 -translate-x-1/2 w-[550px] h-[350px] rounded-full bg-[#ff3366]/15 blur-[130px]" />

      {/* Top Bar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff3366] to-[#ff6b33] flex items-center justify-center shadow-lg shadow-[#ff3366]/30">
            <Flag size={20} className="text-white" />
          </div>
          <div>
            <span className="font-display font-black text-xl tracking-wider uppercase italic text-white">
              STREET <span className="text-[#ff3366]">RUSH</span>
            </span>
            <div className="text-[11px] text-slate-400">
              Driver:{' '}
              <strong className="text-[#00f0ff] font-mono">
                {player?.username}
              </strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="px-3.5 py-2.5 rounded-xl bg-[#121621] border border-[#232a3d] hover:border-[#00f0ff] flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-slate-200 transition"
          >
            {soundEnabled ? (
              <>
                <Volume2 size={16} className="text-[#00e676]" />
                <span className="hidden sm:inline">Sound On</span>
              </>
            ) : (
              <>
                <VolumeX size={16} className="text-slate-500" />
                <span className="hidden sm:inline">Muted</span>
              </>
            )}
          </button>

          <Button variant="secondary" size="sm" onClick={handleLogout}>
            <LogOut size={15} />
            <span>Log Out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto my-8 z-10 space-y-6">
        {/* Driver Banner & Live Server Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#ff3366]/15 border border-[#ff3366]/40 flex items-center justify-center text-[#ff3366]">
              <Zap size={24} />
            </div>
            <div>
              <div className="text-xs font-display uppercase tracking-wider text-slate-400">
                Total Career Score
              </div>
              <div className="font-mono font-black text-2xl sm:text-3xl text-white">
                {loadingStats
                  ? '...'
                  : (stats?.totalScore ?? 0).toLocaleString()}
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00f0ff]/15 border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff]">
              <Trophy size={24} />
            </div>
            <div>
              <div className="text-xs font-display uppercase tracking-wider text-slate-400">
                Global Rank
              </div>
              <div className="font-mono font-black text-2xl sm:text-3xl text-[#00f0ff]">
                {loadingStats
                  ? '...'
                  : stats?.globalRank
                  ? `#${stats.globalRank}`
                  : 'Unranked'}
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00e676]/15 border border-[#00e676]/40 flex items-center justify-center text-[#00e676]">
              <Award size={24} />
            </div>
            <div>
              <div className="text-xs font-display uppercase tracking-wider text-slate-400">
                Races & Wins
              </div>
              <div className="font-mono font-black text-2xl sm:text-3xl text-white">
                {loadingStats
                  ? '...'
                  : `${stats?.winsCount ?? 0}W / ${stats?.racesCount ?? 0}R`}
              </div>
            </div>
          </Card>
        </div>

        {/* Hero Race Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#161c2e] via-[#121621] to-[#0d1018] border border-[#283149] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-xs font-display font-bold uppercase tracking-widest">
              <Gauge size={14} />
              Ready on the Grid
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl uppercase italic tracking-wide text-white leading-tight">
              Hit the Streets. <br />
              <span className="text-[#ff3366]">Climb the World Rank.</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Start 5th on the grid against 4 AI rivals (Viper, Blaze, Storm, and
              Rookie). Complete 3 clean laps, beat the track par time, and post
              your server-scored result to the global leaderboard.
            </p>

            {/* Current Setup Summary Pill */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-[#090b10] border border-[#232a3d] text-slate-300">
                City: <strong className="text-white">{currentCity.name}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-[#090b10] border border-[#232a3d] text-slate-300">
                Track:{' '}
                <strong className="text-white">{currentTrack.name}</strong> (
                {currentTrack.multiplier.toFixed(1)}×)
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-[#090b10] border border-[#232a3d] text-slate-300">
                Car: <strong className="text-white">{currentCar.name}</strong>
              </span>
            </div>

            <div className="pt-4 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => navigate('/setup')}
                className="min-w-[200px]"
              >
                <Flag size={18} />
                <span>Race Setup</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/race')}
              >
                <Zap size={18} />
                <span>Quick Race</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            onClick={() => navigate('/leaderboard')}
            className="p-6 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Trophy size={24} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg uppercase text-white group-hover:text-[#00f0ff] transition">
                  Global Leaderboard
                </h3>
                <p className="text-xs text-slate-400">
                  Top 100 drivers · Filter by track, city & this week
                </p>
              </div>
            </div>
            <span className="font-display text-xs uppercase tracking-wider text-[#00f0ff]">
              Open →
            </span>
          </Card>

          <Card
            onClick={() => navigate('/profile')}
            className="p-6 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg uppercase text-white group-hover:text-[#00f0ff] transition">
                  Driver Profile
                </h3>
                <p className="text-xs text-slate-400">
                  Best track times, last 10 races & change password
                </p>
              </div>
            </div>
            <span className="font-display text-xs uppercase tracking-wider text-[#00f0ff]">
              Open →
            </span>
          </Card>
        </div>
      </main>

      <footer className="max-w-5xl w-full mx-auto text-center text-xs text-slate-500 z-10">
        STREET RUSH v1.0 · Keyboard (WASD / Arrows / Space) & Mobile Touch Controls
      </footer>
    </div>
  );
};
