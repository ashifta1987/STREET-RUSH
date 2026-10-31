import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  RefreshCw,
  Filter,
  Medal,
  Flag,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { CITIES, formatTimeMs, TRACK_METADATA } from '../game/content';
import { fetchLeaderboard, LeaderboardRow } from '../services/races';
import { useGameStore } from '../store/gameStore';

export const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const player = useGameStore((s) => s.player);

  const [trackFilter, setTrackFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week'>('all');

  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [myRow, setMyRow] = useState<LeaderboardRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLeaderboard({
        trackId: trackFilter || null,
        cityId: cityFilter || null,
        period: periodFilter,
        currentUserId: player?.id || null,
      });
      setRows(res.topRows);
      setMyRow(res.myRow);
    } catch (err: any) {
      setError(err.message || 'Could not load global rankings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRankings();
  }, [trackFilter, cityFilter, periodFilter, player?.id]);

  const isPlayerInTopList = player
    ? rows.some((r) => r.player_id === player.id)
    : false;

  return (
    <div className="min-h-screen bg-[#090b10] px-4 py-6 sm:px-8 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(player ? '/' : '/login')}
              className="w-10 h-10 rounded-xl bg-[#121621] border border-[#232a3d] hover:border-[#00f0ff] flex items-center justify-center text-white transition"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl uppercase italic text-white">
                GLOBAL <span className="text-[#00f0ff]">LEADERBOARD</span>
              </h1>
              <p className="text-xs text-slate-400">
                Top 100 drivers ranked by server-verified race scores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadRankings}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </Button>
            {player && (
              <Button size="sm" onClick={() => navigate('/setup')}>
                <Flag size={14} />
                <span>Race Now</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-slate-400">
            <Filter size={15} className="text-[#00f0ff]" />
            <span>Filters</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-1 sm:justify-end">
            {/* Track filter */}
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              aria-label="Filter by track"
              className="rounded-xl bg-[#090b10] border border-[#232a3d] focus:border-[#00f0ff] px-3 py-2 text-xs font-medium text-white outline-none"
            >
              <option value="">All Tracks (Total Score)</option>
              {TRACK_METADATA.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Best Score)
                </option>
              ))}
            </select>

            {/* City filter */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              aria-label="Filter by city"
              className="rounded-xl bg-[#090b10] border border-[#232a3d] focus:border-[#00f0ff] px-3 py-2 text-xs font-medium text-white outline-none"
            >
              <option value="">All Cities</option>
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Period toggle */}
            <div className="inline-flex rounded-xl bg-[#090b10] border border-[#232a3d] p-1">
              <button
                type="button"
                onClick={() => setPeriodFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase transition ${
                  periodFilter === 'all'
                    ? 'bg-[#ff3366] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase transition ${
                  periodFilter === 'week'
                    ? 'bg-[#ff3366] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                This Week
              </button>
            </div>
          </div>
        </Card>

        {/* Rankings Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Loading global standings...
            </div>
          ) : error ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-rose-400 text-sm">{error}</p>
              <Button size="sm" onClick={loadRankings}>
                Try Again
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Trophy size={36} className="text-slate-600 mx-auto" />
              <div className="font-display font-bold text-base uppercase text-white">
                No Races Recorded for This Filter Yet
              </div>
              <p className="text-xs text-slate-400">
                Be the first driver to set a record on this combination!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#232a3d] bg-[#090b10]/60 text-[11px] font-display font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">Rank</th>
                    <th className="py-3.5 px-4">Driver</th>
                    <th className="py-3.5 px-4 text-right">
                      {trackFilter ? 'Best Score' : 'Total Score'}
                    </th>
                    <th className="py-3.5 px-4 text-right hidden sm:table-cell">
                      Races
                    </th>
                    <th className="py-3.5 px-4 text-right hidden sm:table-cell">
                      Wins
                    </th>
                    <th className="py-3.5 px-4 text-right hidden md:table-cell">
                      Podiums
                    </th>
                    <th className="py-3.5 px-4 text-right">Best Lap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232a3d] text-sm">
                  {rows.map((r) => {
                    const isMe = player?.id === r.player_id;
                    return (
                      <tr
                        key={r.player_id}
                        className={`transition ${
                          isMe
                            ? 'bg-[#ff3366]/15 font-semibold'
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs ${
                              r.rank === 1
                                ? 'bg-amber-400 text-[#090b10] font-black'
                                : r.rank === 2
                                ? 'bg-slate-300 text-[#090b10] font-black'
                                : r.rank === 3
                                ? 'bg-amber-700 text-white font-black'
                                : 'text-slate-300'
                            }`}
                          >
                            #{r.rank}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white">
                              {r.username}
                            </span>
                            {isMe && (
                              <span className="px-2 py-0.5 rounded bg-[#ff3366] text-white font-display font-bold text-[10px] uppercase">
                                YOU
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#00f0ff]">
                          {(trackFilter
                            ? r.best_score
                            : r.total_score
                          ).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-300 hidden sm:table-cell">
                          {r.races}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-amber-400 hidden sm:table-cell">
                          {r.wins}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-400 hidden md:table-cell">
                          {r.podiums}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                          {formatTimeMs(r.best_lap_ms)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pinned row if player is outside top 100 */}
          {player && !isPlayerInTopList && myRow && (
            <div className="border-t-2 border-[#ff3366] bg-[#ff3366]/15 px-4 py-3.5 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <Medal size={18} className="text-[#ff3366]" />
                <span className="font-mono font-bold text-white">
                  #{myRow.rank} · {myRow.username} (Your Pinned Rank)
                </span>
              </div>
              <div className="font-mono font-bold text-[#00f0ff]">
                {(trackFilter
                  ? myRow.best_score
                  : myRow.total_score
                ).toLocaleString()}{' '}
                pts
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
