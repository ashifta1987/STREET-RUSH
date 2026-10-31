import React from 'react';
import { Pause, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { formatTimeMs } from '../game/content';
import { HUDTelemetry } from '../game/engine';
import { TrackData } from '../game/tracks/types';
import { Minimap } from './Minimap';

interface HUDProps {
  telemetry: HUDTelemetry;
  track: TrackData;
  cityName: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPauseClick: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  telemetry,
  track,
  cityName,
  soundEnabled,
  onToggleSound,
  onPauseClick,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5 select-none">
      {/* Top Row: Position, Lap, Timers, Controls */}
      <div className="flex items-start justify-between gap-2">
        {/* Left: Position & Lap */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="rounded-2xl bg-[#090b10]/85 backdrop-blur-md border border-[#232a3d] px-3.5 py-2 sm:px-5 sm:py-3 shadow-xl">
            <div className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 font-semibold">
              POS
            </div>
            <div className="font-display font-black text-2xl sm:text-4xl leading-none text-white">
              {telemetry.position}
              <span className="text-sm sm:text-lg text-slate-400 font-bold">
                /5
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-[#090b10]/85 backdrop-blur-md border border-[#232a3d] px-3.5 py-2 sm:px-5 sm:py-3 shadow-xl">
            <div className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 font-semibold">
              LAP
            </div>
            <div className="font-display font-black text-2xl sm:text-4xl leading-none text-[#00f0ff]">
              {telemetry.lap}
              <span className="text-sm sm:text-lg text-slate-400 font-bold">
                /{telemetry.totalLaps}
              </span>
            </div>
          </div>

          {/* Lap & Best Lap Timers */}
          <div className="rounded-2xl bg-[#090b10]/85 backdrop-blur-md border border-[#232a3d] px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-xl hidden xs:block sm:block">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-slate-400 uppercase font-semibold">LAP</span>
              <span className="font-mono font-bold text-white text-sm sm:text-base">
                {formatTimeMs(telemetry.currentLapTimeMs)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-xs mt-0.5">
              <span className="text-slate-400 uppercase font-semibold">BEST</span>
              <span className="font-mono font-bold text-[#00e676] text-xs sm:text-sm">
                {formatTimeMs(telemetry.bestLapTimeMs)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Minimap + Pause & Sound buttons */}
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={onToggleSound}
                title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#090b10]/85 backdrop-blur-md border border-[#232a3d] hover:border-[#00f0ff] flex items-center justify-center text-white transition"
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-slate-400" />}
              </button>
              <button
                onClick={onPauseClick}
                title="Pause Race (Esc)"
                className="px-3.5 h-10 sm:h-11 rounded-xl bg-[#090b10]/85 backdrop-blur-md border border-[#232a3d] hover:border-[#ff3366] flex items-center gap-1.5 text-white font-display font-bold text-xs uppercase tracking-wider transition"
              >
                <Pause size={16} />
                <span className="hidden sm:inline">Pause</span>
              </button>
            </div>

            {/* Compact mobile timer */}
            <div className="rounded-xl bg-[#090b10]/85 backdrop-blur-md border border-[#232a3d] px-2.5 py-1 text-right sm:hidden">
              <div className="font-mono font-bold text-xs text-white">
                {formatTimeMs(telemetry.currentLapTimeMs)}
              </div>
              <div className="font-mono text-[10px] text-[#00e676]">
                BEST {formatTimeMs(telemetry.bestLapTimeMs)}
              </div>
            </div>
          </div>

          <Minimap track={track} dots={telemetry.dots} />
        </div>
      </div>

      {/* Center Countdown Banner (3 - 2 - 1 - GO!) */}
      {telemetry.countdownText && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div
            key={telemetry.countdownText}
            className={`font-display font-black text-7xl sm:text-9xl tracking-tight drop-shadow-[0_0_35px_rgba(255,51,102,0.8)] animate-bounce ${
              telemetry.countdownText === 'GO!'
                ? 'text-[#00e676]'
                : 'text-[#ff3366]'
            }`}
          >
            {telemetry.countdownText}
          </div>
        </div>
      )}

      {/* Bottom Row: Track Info, Off-road / Wall Hits badge, and Speedometer */}
      <div className="flex items-end justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          {telemetry.isOffRoad && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert size={14} />
              Off-Road · Speed 50%
            </div>
          )}
          <div className="rounded-xl bg-[#090b10]/85 backdrop-blur-md border border-[#232a3d] px-3 py-2 text-xs text-slate-300">
            <span className="font-bold text-white">{cityName}</span> · {track.name}
            <span className="ml-3 text-slate-400">
              Wall Hits:{' '}
              <strong
                className={
                  telemetry.wallHits === 0
                    ? 'text-[#00e676]'
                    : telemetry.wallHits <= 2
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }
              >
                {telemetry.wallHits}
              </strong>
            </span>
          </div>
        </div>

        {/* Speedometer */}
        <div className="rounded-2xl bg-[#090b10]/85 backdrop-blur-md border border-[#232a3d] px-4 py-2.5 sm:px-6 sm:py-3.5 shadow-xl text-right">
          <div className="font-mono font-black text-3xl sm:text-5xl leading-none text-white">
            {telemetry.speedKmh}
          </div>
          <div className="text-[10px] sm:text-xs font-display font-bold uppercase tracking-widest text-[#ff3366] mt-0.5">
            KM/H
          </div>
        </div>
      </div>
    </div>
  );
};
