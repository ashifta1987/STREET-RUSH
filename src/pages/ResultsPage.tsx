import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Home,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import {
  calculateScoreBreakdown,
  CARS,
  CITIES,
  formatTimeMs,
  TRACK_METADATA,
} from '../game/content';
import { submitRaceResult } from '../services/races';
import { useGameStore } from '../store/gameStore';

export const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { lastResult, setLastResult } = useGameStore();
  const [retrying, setRetrying] = useState(false);

  if (!lastResult) {
    return (
      <div className="min-h-screen bg-[#090b10] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Trophy size={48} className="text-slate-600" />
        <h2 className="font-display font-bold text-2xl uppercase text-white">
          No Recent Race Found
        </h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Finish a 3-lap race to see your race standings and server-calculated score breakdown.
        </p>
        <Button onClick={() => navigate('/setup')}>Go to Race Setup</Button>
      </div>
    );
  }

  const track =
    TRACK_METADATA.find((t) => t.id === lastResult.trackId) ||
    TRACK_METADATA[0];
  const city =
    CITIES.find((c) => c.id === lastResult.cityId) || CITIES[0];
  const car = CARS.find((c) => c.id === lastResult.carId) || CARS[0];

  const breakdown = calculateScoreBreakdown({
    position: lastResult.playerPosition,
    finishTimeMs: lastResult.finishTimeMs,
    parTimeMs: track.parTimeMs,
    wallHits: lastResult.wallHits,
    multiplier: track.multiplier,
  });

  const displayScore = lastResult.serverScore ?? breakdown.totalScore;

  const handleRetrySave = async () => {
    setRetrying(true);
    try {
      const score = await submitRaceResult({
        trackId: lastResult.trackId,
        carId: lastResult.carId,
        cityId: lastResult.cityId,
        position: lastResult.playerPosition,
        finishTimeMs: lastResult.finishTimeMs,
        bestLapMs: lastResult.bestLapMs,
        wallHits: lastResult.wallHits,
      });
      setLastResult({
        ...lastResult,
        serverScore: score,
        saveError: null,
      });
    } catch (err: any) {
      setLastResult({
        ...lastResult,
        saveError: err.message || 'Retry failed. Please try again in a moment.',
      });
    } finally {
      setRetrying(false);
    }
  };

  const ordinal = (n: number) =>
    n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;

  return (
    <div className="min-h-screen bg-[#090b10] px-4 py-6 sm:px-8 sm:py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-display font-bold uppercase tracking-widest text-[#00f0ff]">
              {city.name} · {track.name} ({car.name})
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl uppercase italic text-white">
              RACE <span className="text-[#ff3366]">RESULTS</span>
            </h1>
          </div>

          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <Home size={16} />
            <span>Main Menu</span>
          </Button>
        </div>

        {/* Save Status Alert */}
        {lastResult.saveError ? (
          <div className="rounded-2xl bg-amber-500/15 border border-amber-500/40 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-amber-200 text-xs sm:text-sm">
              <AlertTriangle size={20} className="text-amber-400 shrink-0" />
              <span>
                Could not save score to server: {lastResult.saveError}
              </span>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={retrying}
              onClick={handleRetrySave}
            >
              <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
              <span>{retrying ? 'Saving...' : 'Retry Save'}</span>
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm text-emerald-300">
            <CheckCircle2 size={18} className="text-[#00e676] shrink-0" />
            <span>
              Race verified and saved to global leaderboard! (+
              {displayScore.toLocaleString()} pts)
            </span>
          </div>
        )}

        {/* Main Grid: Final 5 Racers Order + Server Score Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left 3 cols: Final Standings of all 5 Racers */}
          <Card className="lg:col-span-3 p-5 sm:p-6 space-y-4">
            <h2 className="font-display font-bold text-base uppercase tracking-wider text-slate-300">
              Final Standings (5 Racers)
            </h2>

            <div className="space-y-2.5">
              {lastResult.standings.map((r) => {
                const posColors =
                  r.position === 1
                    ? 'bg-amber-400 text-[#090b10]'
                    : r.position === 2
                    ? 'bg-slate-300 text-[#090b10]'
                    : r.position === 3
                    ? 'bg-amber-700 text-white'
                    : 'bg-[#1b2234] text-slate-300';

                return (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition ${
                      r.isPlayer
                        ? 'bg-[#ff3366]/15 border-[#ff3366]'
                        : 'bg-[#090b10]/80 border-[#232a3d]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-lg font-display font-black text-sm flex items-center justify-center shrink-0 ${posColors}`}
                      >
                        {r.position}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm sm:text-base text-white truncate">
                            {r.name}
                          </span>
                          {r.isPlayer && (
                            <span className="px-2 py-0.5 rounded bg-[#ff3366] text-white font-display font-bold text-[10px] uppercase">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {r.carName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-sm text-white">
                        {formatTimeMs(r.finishTimeMs)}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        Best Lap {formatTimeMs(r.bestLapMs)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Right 2 cols: Score Breakdown */}
          <Card className="lg:col-span-2 p-5 sm:p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-base uppercase tracking-wider text-slate-300">
                  Score Breakdown
                </h2>
                <span className="px-2.5 py-1 rounded-full bg-[#00f0ff]/15 text-[#00f0ff] font-display font-bold text-xs">
                  {ordinal(lastResult.playerPosition)} Place
                </span>
              </div>

              <div className="space-y-3 text-sm pt-2">
                <div className="flex items-center justify-between py-2 border-b border-[#232a3d]">
                  <div>
                    <div className="text-white font-medium">Position Points</div>
                    <div className="text-xs text-slate-400">
                      Finished {ordinal(lastResult.playerPosition)} of 5
                    </div>
                  </div>
                  <span className="font-mono font-bold text-white">
                    +{breakdown.positionPoints}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#232a3d]">
                  <div>
                    <div className="text-white font-medium">Time Bonus</div>
                    <div className="text-xs text-slate-400">
                      Par {formatTimeMs(track.parTimeMs)} vs{' '}
                      {formatTimeMs(lastResult.finishTimeMs)}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#00f0ff]">
                    +{breakdown.timeBonus}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#232a3d]">
                  <div>
                    <div className="text-white font-medium">Clean Driving</div>
                    <div className="text-xs text-slate-400">
                      {lastResult.wallHits} wall hit
                      {lastResult.wallHits === 1 ? '' : 's'}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#00e676]">
                    +{breakdown.cleanBonus}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#232a3d]">
                  <div>
                    <div className="text-white font-medium">Track Multiplier</div>
                    <div className="text-xs text-slate-400 capitalize">
                      {track.name} ({track.difficulty})
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-400">
                    ×{breakdown.multiplier.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#090b10] border border-[#232a3d] p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-display uppercase tracking-wider text-slate-400">
                  Final Race Score
                </div>
                <div className="text-[11px] text-slate-500">
                  Server-verified calculation
                </div>
              </div>
              <div className="font-mono font-black text-3xl text-[#ff3366]">
                {displayScore.toLocaleString()}
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 pt-2">
          <Button
            size="lg"
            onClick={() => navigate('/race')}
          >
            <RotateCcw size={18} />
            <span>Race Again</span>
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/setup')}
          >
            <Sliders size={18} />
            <span>Change Setup</span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/leaderboard')}
          >
            <Trophy size={18} />
            <span>Leaderboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
