import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Trophy,
  Flag,
  Award,
  Clock,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import {
  CARS,
  CITIES,
  formatTimeMs,
  TRACK_METADATA,
} from '../game/content';
import { changeDriverPassword } from '../services/auth';
import { fetchProfileStats, ProfileStats } from '../services/races';
import { useGameStore } from '../store/gameStore';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const player = useGameStore((s) => s.player);

  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Change password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!player) return;
    setLoading(true);
    fetchProfileStats(player.id)
      .then((res) => setStats(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [player]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;
    setPwError(null);
    setPwSuccess(null);

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwLoading(true);
    try {
      await changeDriverPassword(player.username, oldPassword, newPassword);
      setPwSuccess('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Could not update password.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] px-4 py-6 sm:px-8 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-xl bg-[#121621] border border-[#232a3d] hover:border-[#00f0ff] flex items-center justify-center text-white transition"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl uppercase italic text-white">
                DRIVER <span className="text-[#ff3366]">PROFILE</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                @{player?.username}
              </p>
            </div>
          </div>

          <Button size="sm" onClick={() => navigate('/setup')}>
            <Flag size={14} />
            <span>New Race</span>
          </Button>
        </div>

        {/* Career Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="p-4">
            <div className="text-[11px] font-display uppercase text-slate-400">
              Total Score
            </div>
            <div className="font-mono font-black text-xl sm:text-2xl text-[#00f0ff] mt-1">
              {loading ? '...' : (stats?.totalScore ?? 0).toLocaleString()}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-[11px] font-display uppercase text-slate-400">
              Global Rank
            </div>
            <div className="font-mono font-black text-xl sm:text-2xl text-white mt-1">
              {loading
                ? '...'
                : stats?.globalRank
                ? `#${stats.globalRank}`
                : 'Unranked'}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-[11px] font-display uppercase text-slate-400">
              Races
            </div>
            <div className="font-mono font-black text-xl sm:text-2xl text-white mt-1">
              {loading ? '...' : stats?.racesCount ?? 0}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-[11px] font-display uppercase text-slate-400">
              Wins (1st)
            </div>
            <div className="font-mono font-black text-xl sm:text-2xl text-amber-400 mt-1">
              {loading ? '...' : stats?.winsCount ?? 0}
            </div>
          </Card>

          <Card className="p-4 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-display uppercase text-slate-400">
              Podiums (Top 3)
            </div>
            <div className="font-mono font-black text-xl sm:text-2xl text-[#00e676] mt-1">
              {loading ? '...' : stats?.podiumsCount ?? 0}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Best Time Per Track (2 cols) */}
          <Card className="lg:col-span-2 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#00f0ff]" />
              <h2 className="font-display font-bold text-base uppercase tracking-wider text-white">
                Personal Best Time Per Track (3 Laps)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TRACK_METADATA.map((track) => {
                const best = stats?.bestTimeByTrack[track.id];
                return (
                  <div
                    key={track.id}
                    className="p-4 rounded-xl bg-[#090b10] border border-[#232a3d] flex items-center justify-between"
                  >
                    <div>
                      <div className="font-display font-bold text-sm text-white uppercase">
                        {track.name}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize">
                        {track.difficulty} · Par {formatTimeMs(track.parTimeMs)}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-base text-[#00e676]">
                      {best ? formatTimeMs(best) : '--:--.--'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Last 10 Races Table */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-[#ff3366]" />
                <h2 className="font-display font-bold text-base uppercase tracking-wider text-white">
                  Last 10 Races
                </h2>
              </div>

              {loading ? (
                <div className="text-xs text-slate-400 py-6 text-center">
                  Loading race history...
                </div>
              ) : !stats || stats.recentRaces.length === 0 ? (
                <div className="rounded-xl bg-[#090b10] border border-[#232a3d] p-6 text-center text-xs text-slate-400">
                  No completed races yet. Hit the track to build your career log!
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#232a3d]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#090b10] border-b border-[#232a3d] font-display uppercase text-slate-400">
                        <th className="py-2.5 px-3">Pos</th>
                        <th className="py-2.5 px-3">Track & City</th>
                        <th className="py-2.5 px-3 hidden sm:table-cell">Car</th>
                        <th className="py-2.5 px-3 text-right">Time</th>
                        <th className="py-2.5 px-3 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232a3d]">
                      {stats.recentRaces.map((r) => {
                        const trackName =
                          TRACK_METADATA.find((t) => t.id === r.track_id)
                            ?.name || r.track_id;
                        const cityName =
                          CITIES.find((c) => c.id === r.city_id)?.name ||
                          r.city_id;
                        const carName =
                          CARS.find((c) => c.id === r.car_id)?.name || r.car_id;

                        return (
                          <tr key={r.id} className="bg-[#090b10]/40">
                            <td className="py-2.5 px-3 font-mono font-bold text-white">
                              P{r.position}
                            </td>
                            <td className="py-2.5 px-3 text-slate-200">
                              <span className="font-semibold">{trackName}</span>{' '}
                              <span className="text-slate-400">
                                ({cityName})
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 hidden sm:table-cell">
                              {carName}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                              {formatTimeMs(r.finish_time_ms)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#00f0ff]">
                              +{r.score}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          {/* Change Password Card (1 col) */}
          <Card className="p-5 sm:p-6 space-y-4 h-fit">
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-amber-400" />
              <h2 className="font-display font-bold text-base uppercase tracking-wider text-white">
                Change Password
              </h2>
            </div>

            {pwError && (
              <div className="rounded-xl bg-rose-500/15 border border-rose-500/40 p-3 text-xs text-rose-200 flex items-start gap-2">
                <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 p-3 text-xs text-emerald-200 flex items-start gap-2">
                <CheckCircle2 size={15} className="text-[#00e676] shrink-0 mt-0.5" />
                <span>{pwSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-[11px] font-display font-bold uppercase text-slate-400 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full rounded-xl bg-[#090b10] border border-[#232a3d] focus:border-[#00f0ff] px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display font-bold uppercase text-slate-400 mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-xl bg-[#090b10] border border-[#232a3d] focus:border-[#00f0ff] px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display font-bold uppercase text-slate-400 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  className="w-full rounded-xl bg-[#090b10] border border-[#232a3d] focus:border-[#00f0ff] px-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  fullWidth
                  size="sm"
                  disabled={pwLoading}
                >
                  {pwLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
