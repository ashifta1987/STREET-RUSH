import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, LogOut, Volume2, VolumeX, Smartphone } from 'lucide-react';
import { Button } from '../components/Button';
import { HUD } from '../components/HUD';
import { TouchControls } from '../components/TouchControls';
import { CARS, CITIES } from '../game/content';
import { HUDTelemetry, RaceEngine } from '../game/engine';
import { TRACKS_BY_ID } from '../game/tracks';
import { submitRaceResult } from '../services/races';
import { useGameStore } from '../store/gameStore';

export const RacePage: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<RaceEngine | null>(null);

  const {
    player,
    selectedCityId,
    selectedTrackId,
    selectedCarId,
    soundEnabled,
    toggleSound,
    setLastResult,
  } = useGameStore();

  const city = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
  const track = TRACKS_BY_ID[selectedTrackId] || TRACKS_BY_ID['harbour-loop'];
  const car = CARS.find((c) => c.id === selectedCarId) || CARS[0];

  const [paused, setPaused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);

  const [telemetry, setTelemetry] = useState<HUDTelemetry>({
    position: 5,
    lap: 1,
    totalLaps: track.laps,
    currentLapTimeMs: 0,
    bestLapTimeMs: null,
    totalRaceTimeMs: 0,
    speedKmh: 0,
    wallHits: 0,
    countdownText: '3',
    isOffRoad: false,
    hasGhost: false,
    dots: [],
  });

  useEffect(() => {
    const checkOrientation = () => {
      const mobile = window.innerWidth < 768;
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortraitMobile(mobile && portrait);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    // Try locking orientation to landscape on supported mobile browsers
    try {
      const orientation = (screen as any)?.orientation;
      if (orientation?.lock) {
        orientation.lock('landscape').catch(() => {});
      }
    } catch {
      // ignore if unsupported
    }

    return () => {
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const engine = new RaceEngine({
      canvas,
      track,
      city,
      playerName: player?.username || 'YOU',
      playerCar: car,
      onHUDUpdate: (hud) => setTelemetry(hud),
      onPauseChange: (p) => setPaused(p),
      onRaceFinish: async (res) => {
        setSubmitting(true);
        let serverScore: number | null = null;
        let saveError: string | null = null;

        try {
          serverScore = await submitRaceResult({
            trackId: track.id,
            carId: car.id,
            cityId: city.id,
            position: res.playerPosition,
            finishTimeMs: res.finishTimeMs,
            bestLapMs: res.bestLapMs,
            wallHits: res.wallHits,
          });
        } catch (err: any) {
          saveError = err.message || 'Could not save score to server';
        }

        setLastResult({
          trackId: track.id,
          carId: car.id,
          cityId: city.id,
          standings: res.standings,
          playerPosition: res.playerPosition,
          finishTimeMs: res.finishTimeMs,
          bestLapMs: res.bestLapMs,
          wallHits: res.wallHits,
          serverScore,
          saveError,
        });

        navigate('/results');
      },
    });

    engineRef.current = engine;
    engine.start();

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stop();
      engineRef.current = null;
    };
  }, [track, city, car, player, navigate, setLastResult]);

  const handleResume = () => {
    engineRef.current?.setPaused(false);
  };

  const handleQuit = () => {
    // Quitting gives no score
    engineRef.current?.stop();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 bg-[#090b10] overflow-hidden select-none touch-none">
      <canvas ref={canvasRef} className="block w-full h-full" />

      <HUD
        telemetry={telemetry}
        track={track}
        cityName={city.name}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onPauseClick={() => engineRef.current?.setPaused(true)}
      />

      <TouchControls inputController={engineRef.current?.inputController ?? null} />

      {/* Portrait Phone Hint Banner */}
      {isPortraitMobile && !paused && (
        <div className="fixed top-20 inset-x-4 z-30 pointer-events-none flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#090b10]/90 border border-[#00f0ff]/40 text-[#00f0ff] text-xs font-display font-bold uppercase tracking-wider shadow-lg">
            <Smartphone size={15} className="rotate-90" />
            Rotate phone to landscape for wide view
          </div>
        </div>
      )}

      {/* Pause Modal */}
      {paused && !submitting && (
        <div className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#121621] border border-[#232a3d] p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <h2 className="font-display font-black text-3xl uppercase italic text-white">
              RACE <span className="text-[#ff3366]">PAUSED</span>
            </h2>
            <p className="text-xs text-slate-400">
              {city.name} · {track.name} ({car.name})
            </p>

            <div className="space-y-3 pt-2">
              <Button fullWidth size="lg" onClick={handleResume}>
                <Play size={18} />
                <span>Resume Race</span>
              </Button>

              <Button
                fullWidth
                variant="secondary"
                onClick={toggleSound}
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                <span>Sound: {soundEnabled ? 'ON' : 'OFF'}</span>
              </Button>

              <Button
                fullWidth
                variant="danger"
                onClick={handleQuit}
              >
                <LogOut size={18} />
                <span>Quit Race (No Score)</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Saving Score Overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="rounded-3xl bg-[#121621] border border-[#00f0ff]/40 px-8 py-7 text-center space-y-3 shadow-2xl">
            <div className="font-display font-black text-2xl uppercase italic text-[#00f0ff] animate-pulse">
              FINISHING LINE!
            </div>
            <p className="text-sm text-slate-300">
              Verifying telemetry & calculating score on server...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
