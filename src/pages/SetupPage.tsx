import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flag,
  MapPin,
  Route,
  Car as CarIcon,
  Clock,
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { StatBar } from '../components/StatBar';
import { TrackPreviewSvg } from '../components/TrackPreviewSvg';
import {
  CARS,
  CITIES,
  formatTimeMs,
  TRACK_METADATA,
} from '../game/content';
import { fetchProfileStats } from '../services/races';
import { useGameStore } from '../store/gameStore';

export const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    player,
    selectedCityId,
    selectedTrackId,
    selectedCarId,
    setupStep,
    setSelectedCityId,
    setSelectedTrackId,
    setSelectedCarId,
    setSetupStep,
  } = useGameStore();

  const [bestTimes, setBestTimes] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (!player) return;
    fetchProfileStats(player.id)
      .then((res) => setBestTimes(res.bestTimeByTrack))
      .catch(() => {});
  }, [player]);

  const handleBack = () => {
    if (setupStep === 1) {
      navigate('/');
    } else {
      setSetupStep((setupStep - 1) as 1 | 2 | 3);
    }
  };

  const handleNext = () => {
    if (setupStep < 3) {
      setSetupStep((setupStep + 1) as 1 | 2 | 3);
    } else {
      navigate('/race');
    }
  };

  const selectedCity =
    CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
  const selectedTrack =
    TRACK_METADATA.find((t) => t.id === selectedTrackId) || TRACK_METADATA[0];
  const selectedCar = CARS.find((c) => c.id === selectedCarId) || CARS[0];

  return (
    <div className="min-h-screen bg-[#090b10] flex flex-col justify-between px-3.5 py-5 sm:px-8 sm:py-8">
      {/* Top Header + Step Wizard Bar */}
      <div className="max-w-5xl w-full mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-display font-bold uppercase tracking-wider text-slate-300 hover:text-white"
          >
            <ArrowLeft size={18} />
            <span>{setupStep === 1 ? 'Main Menu' : 'Previous Step'}</span>
          </button>

          <div className="font-display font-black text-base sm:text-xl uppercase italic tracking-wider">
            RACE <span className="text-[#ff3366]">SETUP</span>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Step {setupStep}/3
          </div>
        </div>

        {/* 3-Step Indicator Tabs */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { step: 1 as const, label: '1. City', sub: selectedCity.name, icon: MapPin },
            { step: 2 as const, label: '2. Track', sub: selectedTrack.name, icon: Route },
            { step: 3 as const, label: '3. Car', sub: selectedCar.name, icon: CarIcon },
          ].map((item) => {
            const Icon = item.icon;
            const active = setupStep === item.step;
            const done = setupStep > item.step;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setSetupStep(item.step)}
                className={`rounded-xl p-2.5 sm:p-3.5 border text-left transition flex items-center gap-2.5 ${
                  active
                    ? 'bg-[#171d2c] border-[#ff3366] text-white shadow-lg shadow-[#ff3366]/15'
                    : done
                    ? 'bg-[#121621] border-[#00e676]/50 text-slate-200'
                    : 'bg-[#121621]/60 border-[#232a3d] text-slate-400'
                }`}
              >
                <Icon
                  size={18}
                  className={
                    active
                      ? 'text-[#ff3366] shrink-0'
                      : done
                      ? 'text-[#00e676] shrink-0'
                      : 'text-slate-500 shrink-0'
                  }
                />
                <div className="min-w-0">
                  <div className="font-display font-bold text-[11px] sm:text-xs uppercase tracking-wider truncate">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {item.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step 1: Select City */}
        {setupStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl uppercase text-white">
                Select Host City
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Choose 1 of 5 world cities — sets the visual scenery, road palette, and synth soundtrack.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CITIES.map((city) => {
                const isSelected = city.id === selectedCityId;
                return (
                  <Card
                    key={city.id}
                    selected={isSelected}
                    accentColor={city.accentColor}
                    onClick={() => setSelectedCityId(city.id)}
                    className="p-5 flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Color swatch bar */}
                    <div
                      className="h-2 w-full rounded-full mb-4"
                      style={{
                        background: `linear-gradient(90deg, ${city.accentColor}, ${city.secondaryColor})`,
                      }}
                    />

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-xs font-display font-bold uppercase tracking-widest"
                          style={{ color: city.accentColor }}
                        >
                          {city.theme}
                        </span>
                        {isSelected && (
                          <CheckCircle2
                            size={18}
                            style={{ color: city.accentColor }}
                          />
                        )}
                      </div>

                      <h3 className="font-display font-black text-xl text-white uppercase">
                        {city.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {city.look}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#232a3d] flex items-center justify-between text-[11px] text-slate-400">
                      <span>Music: {city.musicTempo} BPM</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: city.groundColor }}
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: city.roadColor }}
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: city.accentColor }}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Select Track */}
        {setupStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl uppercase text-white">
                Select Circuit Track
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Harder tracks scale AI speed and award a higher score multiplier (up to 1.5×).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TRACK_METADATA.map((track) => {
                const isSelected = track.id === selectedTrackId;
                const bestMs = bestTimes[track.id];
                const diffBadge =
                  track.difficulty === 'easy'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : track.difficulty === 'medium'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30';

                return (
                  <Card
                    key={track.id}
                    selected={isSelected}
                    accentColor="#00f0ff"
                    onClick={() => setSelectedTrackId(track.id)}
                    className="p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-display font-bold uppercase border ${diffBadge}`}
                        >
                          {track.difficulty}
                        </span>
                        <span className="font-mono font-bold text-xs text-[#00f0ff]">
                          {track.multiplier.toFixed(1)}× Score Multiplier
                        </span>
                      </div>

                      <h3 className="font-display font-black text-xl text-white uppercase">
                        {track.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {track.shapeDescription}
                      </p>

                      <div className="my-3 py-2 rounded-xl bg-[#090b10] border border-[#232a3d]">
                        <TrackPreviewSvg
                          trackId={track.id}
                          accentColor={isSelected ? '#00f0ff' : '#64748b'}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#232a3d] text-xs">
                      <div>
                        <div className="text-[10px] uppercase text-slate-500">
                          Distance
                        </div>
                        <div className="font-mono font-bold text-white">
                          {track.lengthKm} km · {track.laps} Laps
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-slate-500">
                          Par Time
                        </div>
                        <div className="font-mono font-bold text-slate-200">
                          {formatTimeMs(track.parTimeMs)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-slate-500 flex items-center justify-end gap-1">
                          <Clock size={10} /> Your Best
                        </div>
                        <div className="font-mono font-bold text-[#00e676]">
                          {bestMs ? formatTimeMs(bestMs) : 'No record'}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Select Car */}
        {setupStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl uppercase text-white">
                Select Your Machine
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Every car is balanced between 20 and 23 total stat points — pick the setup that fits your driving style.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CARS.map((car) => {
                const isSelected = car.id === selectedCarId;
                return (
                  <Card
                    key={car.id}
                    selected={isSelected}
                    accentColor={car.primaryColor}
                    onClick={() => setSelectedCarId(car.id)}
                    className="p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-display font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                          Best for: {car.bestFor}
                        </span>
                        {isSelected && (
                          <CheckCircle2
                            size={18}
                            style={{ color: car.primaryColor }}
                          />
                        )}
                      </div>

                      <h3 className="font-display font-black text-xl text-white uppercase">
                        {car.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {car.description}
                      </p>

                      {/* Visual Top-Down Car Preview */}
                      <div className="my-4 h-20 rounded-xl bg-[#090b10] border border-[#232a3d] flex items-center justify-center">
                        <svg width="120" height="56" viewBox="-36 -20 72 40">
                          <rect
                            x="-22"
                            y="-15"
                            width="11"
                            height="4"
                            rx="1"
                            fill="#334155"
                          />
                          <rect
                            x="-22"
                            y="11"
                            width="11"
                            height="4"
                            rx="1"
                            fill="#334155"
                          />
                          <rect
                            x="10"
                            y="-15"
                            width="11"
                            height="4"
                            rx="1"
                            fill="#334155"
                          />
                          <rect
                            x="10"
                            y="11"
                            width="11"
                            height="4"
                            rx="1"
                            fill="#334155"
                          />
                          <rect
                            x="-25"
                            y="-12"
                            width="50"
                            height="24"
                            rx="6"
                            fill={car.primaryColor}
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />
                          <rect
                            x="-23"
                            y="-2.5"
                            width="46"
                            height="5"
                            fill={car.stripeColor}
                          />
                          <rect
                            x="-8"
                            y="-9"
                            width="20"
                            height="18"
                            rx="4"
                            fill="#090b10"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-[#232a3d]">
                      <StatBar
                        label="Speed"
                        value={car.speed}
                        color="#ff3366"
                      />
                      <StatBar
                        label="Acceleration"
                        value={car.accel}
                        color="#00f0ff"
                      />
                      <StatBar
                        label="Handling"
                        value={car.handling}
                        color="#00e676"
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Footer */}
      <div className="max-w-5xl w-full mx-auto mt-8 pt-4 border-t border-[#232a3d] flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={handleBack}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </Button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span>{selectedCity.name}</span>
          <span>•</span>
          <span>{selectedTrack.name}</span>
          <span>•</span>
          <span className="text-white font-bold">{selectedCar.name}</span>
        </div>

        <Button size="lg" onClick={handleNext}>
          {setupStep < 3 ? (
            <>
              <span>Next</span>
              <ArrowRight size={18} />
            </>
          ) : (
            <>
              <Flag size={18} />
              <span>Start Race</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
