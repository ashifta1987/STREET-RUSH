import { computeAIInput } from './ai';
import { CarConfig, CityConfig } from './content';
import { InputController } from './input';
import {
  RacerBody,
  resolveCarCollisions,
  stepCarPhysics,
} from './physics';
import {
  buildFinalStandings,
  createRaceGrid,
  FinalRacerStanding,
  GhostSample,
  loadBestGhost,
  saveBestGhost,
  updateRacePositions,
  updateRacerCheckpointsAndLap,
} from './race';
import { RaceRenderer, SkidMark, SparkParticle } from './renderer';
import { soundManager } from './sound';
import { TrackData } from './tracks/types';

export interface MinimapDot {
  id: string;
  x: number;
  y: number;
  color: string;
  isPlayer: boolean;
  position: number;
}

export interface HUDTelemetry {
  position: number;
  lap: number;
  totalLaps: number;
  currentLapTimeMs: number;
  bestLapTimeMs: number | null;
  totalRaceTimeMs: number;
  speedKmh: number;
  wallHits: number;
  countdownText: string | null; // '3', '2', '1', 'GO!', or null
  isOffRoad: boolean;
  hasGhost: boolean;
  dots: MinimapDot[];
}

export class RaceEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private track: TrackData;
  private city: CityConfig;
  private racers: RacerBody[];
  private player: RacerBody;
  private renderer = new RaceRenderer();
  public inputController: InputController;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private accumulator = 0;
  private readonly fixedDt = 1 / 60;

  private paused = false;
  private finished = false;
  private countdownTimer = 3.2; // 3..2..1..GO
  private lastBeepSecond = 4;
  private goPlayed = false;
  private elapsedRaceMs = 0;
  private hudEmitAccumulator = 0;

  private skidMarks: SkidMark[] = [];
  private particles: SparkParticle[] = [];

  // Ghost recording & playback
  private bestGhost: { lapTimeMs: number; samples: GhostSample[] } | null = null;
  private currentLapGhostSamples: GhostSample[] = [];
  private ghostSampleAccumulator = 0;

  private onHUDUpdate: (hud: HUDTelemetry) => void;
  private onPauseChange: (paused: boolean) => void;
  private onRaceFinish: (result: {
    standings: FinalRacerStanding[];
    playerPosition: number;
    finishTimeMs: number;
    bestLapMs: number;
    wallHits: number;
  }) => void;

  constructor(params: {
    canvas: HTMLCanvasElement;
    track: TrackData;
    city: CityConfig;
    playerName: string;
    playerCar: CarConfig;
    onHUDUpdate: (hud: HUDTelemetry) => void;
    onPauseChange: (paused: boolean) => void;
    onRaceFinish: (result: {
      standings: FinalRacerStanding[];
      playerPosition: number;
      finishTimeMs: number;
      bestLapMs: number;
      wallHits: number;
    }) => void;
  }) {
    this.canvas = params.canvas;
    const context = this.canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context not available');
    this.ctx = context;

    this.track = params.track;
    this.city = params.city;
    this.onHUDUpdate = params.onHUDUpdate;
    this.onPauseChange = params.onPauseChange;
    this.onRaceFinish = params.onRaceFinish;

    this.racers = createRaceGrid(
      this.track,
      params.playerName,
      params.playerCar
    );
    this.player = this.racers.find((r) => r.isPlayer)!;
    this.renderer.resetCamera(this.player);

    this.bestGhost = loadBestGhost(this.track.id);

    this.inputController = new InputController(() => {
      if (!this.finished) {
        this.setPaused(!this.paused);
      }
    });
  }

  start() {
    this.inputController.attach();
    soundManager.startCityMusic(this.city.id);
    soundManager.startEngine();
    this.lastTimestamp = performance.now();
    this.emitHUD();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.inputController.detach();
    soundManager.stopAllRaceAudio();
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    if (paused) {
      soundManager.stopEngine();
    } else if (!this.finished) {
      soundManager.startEngine();
    }
    this.onPauseChange(paused);
  }

  private loop = (now: number) => {
    const frameDelta = Math.min(0.1, (now - this.lastTimestamp) / 1000);
    this.lastTimestamp = now;

    if (!this.paused && !this.finished) {
      this.accumulator += frameDelta;
      while (this.accumulator >= this.fixedDt) {
        this.fixedUpdate(this.fixedDt);
        this.accumulator -= this.fixedDt;
        if (this.finished) break;
      }
    }

    this.renderFrame();

    if (!this.finished) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  private fixedUpdate(dt: number) {
    // 1. Handle 3-2-1-GO countdown
    if (this.countdownTimer > 0) {
      this.countdownTimer -= dt;
      const ceilSec = Math.ceil(this.countdownTimer);
      if (ceilSec >= 1 && ceilSec <= 3 && ceilSec < this.lastBeepSecond) {
        this.lastBeepSecond = ceilSec;
        soundManager.playCountdownBeep();
      }
      if (this.countdownTimer <= 0 && !this.goPlayed) {
        this.goPlayed = true;
        soundManager.playCountdownGo();
      }
      this.hudEmitAccumulator += dt;
      if (this.hudEmitAccumulator >= 0.05) {
        this.hudEmitAccumulator = 0;
        this.emitHUD();
      }
      return;
    }

    if (this.countdownTimer > -0.8) {
      this.countdownTimer -= dt;
    }

    const dtMs = dt * 1000;
    this.elapsedRaceMs += dtMs;

    // 2. Step Player Car Physics
    const playerInput = this.inputController.getState();
    const prevPlayerX = this.player.x;
    const prevPlayerY = this.player.y;
    const { hitWall } = stepCarPhysics(
      this.player,
      playerInput,
      this.track,
      dt,
      1.0
    );

    if (hitWall) {
      soundManager.playCrash();
      this.spawnSparks(this.player.x, this.player.y, '#ff3366', 12);
    }

    if (this.player.isDrifting) {
      this.addSkidMark(prevPlayerX, prevPlayerY, this.player.x, this.player.y);
    }

    soundManager.updateEnginePitch(
      this.player.speed / Math.max(1, this.player.stats.maxSpeed)
    );

    // 3. Step AI Cars Physics
    for (const racer of this.racers) {
      if (racer.isPlayer) continue;
      const { input: aiInput, speedMultiplier } = computeAIInput(
        racer,
        this.player,
        this.track,
        dt
      );
      const prevX = racer.x;
      const prevY = racer.y;
      stepCarPhysics(racer, aiInput, this.track, dt, speedMultiplier);
      if (racer.isDrifting) {
        this.addSkidMark(prevX, prevY, racer.x, racer.y);
      }
    }

    // 4. Car-to-car collisions
    const bumpedPlayer = resolveCarCollisions(this.racers);
    if (bumpedPlayer) {
      soundManager.playBump();
      this.spawnSparks(this.player.x, this.player.y, '#ffb800', 8);
    }

    // 5. Record ghost sample for player's current lap
    this.ghostSampleAccumulator += dt;
    if (this.ghostSampleAccumulator >= 0.1) {
      this.ghostSampleAccumulator = 0;
      this.currentLapGhostSamples.push({
        tMs: Math.round(this.player.currentLapTimeMs),
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        angle: Number(this.player.angle.toFixed(3)),
      });
    }

    // 6. Update checkpoints, laps, and positions
    for (const racer of this.racers) {
      const prevLapTimeMs = racer.currentLapTimeMs;
      const { completedLap, finishedRace } = updateRacerCheckpointsAndLap(
        racer,
        this.track,
        dtMs,
        this.elapsedRaceMs
      );

      if (racer.isPlayer && (completedLap || finishedRace)) {
        const completedLapDuration = Math.round(prevLapTimeMs + dtMs);
        saveBestGhost(
          this.track.id,
          completedLapDuration,
          this.currentLapGhostSamples
        );
        this.bestGhost = loadBestGhost(this.track.id);
        this.currentLapGhostSamples = [];

        if (finishedRace) {
          soundManager.playRaceFinish();
          this.finishRace();
          return;
        } else if (completedLap) {
          soundManager.playLapComplete();
        }
      }
    }

    updateRacePositions(this.racers);

    // 7. Update particles & skidMarks
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (this.skidMarks.length > 260) {
      this.skidMarks.splice(0, this.skidMarks.length - 260);
    }

    // 8. Emit HUD state ~20 times/sec
    this.hudEmitAccumulator += dt;
    if (this.hudEmitAccumulator >= 0.05) {
      this.hudEmitAccumulator = 0;
      this.emitHUD();
    }
  }

  private addSkidMark(x1: number, y1: number, x2: number, y2: number) {
    this.skidMarks.push({ x1, y1, x2, y2, alpha: 0.7 });
  }

  private spawnSparks(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 160;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        color,
      });
    }
  }

  private getCurrentGhostPose(): GhostSample | null {
    if (!this.bestGhost || this.bestGhost.samples.length === 0) return null;
    const t = this.player.currentLapTimeMs;
    const samples = this.bestGhost.samples;
    for (let i = 0; i < samples.length - 1; i++) {
      const a = samples[i];
      const b = samples[i + 1];
      if (t >= a.tMs && t <= b.tMs) {
        const span = Math.max(1, b.tMs - a.tMs);
        const ratio = (t - a.tMs) / span;
        return {
          tMs: t,
          x: a.x + (b.x - a.x) * ratio,
          y: a.y + (b.y - a.y) * ratio,
          angle: a.angle,
        };
      }
    }
    return null;
  }

  private renderFrame() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ghostPose =
      this.countdownTimer <= 0 ? this.getCurrentGhostPose() : null;

    this.renderer.render(
      this.ctx,
      width,
      height,
      this.track,
      this.city,
      this.racers,
      this.player,
      this.skidMarks,
      this.particles,
      ghostPose
    );
  }

  private emitHUD() {
    let countdownText: string | null = null;
    if (this.countdownTimer > 0) {
      countdownText = String(Math.ceil(this.countdownTimer));
    } else if (this.countdownTimer > -0.75) {
      countdownText = 'GO!';
    }

    // Map speed (px/s) to realistic km/h display (e.g. 380 px/s -> ~245 km/h)
    const speedKmh = Math.max(0, Math.round(Math.abs(this.player.speed) * 0.64));

    this.onHUDUpdate({
      position: this.player.position,
      lap: Math.min(this.track.laps, this.player.lap),
      totalLaps: this.track.laps,
      currentLapTimeMs: Math.round(this.player.currentLapTimeMs),
      bestLapTimeMs: this.player.bestLapTimeMs,
      totalRaceTimeMs: Math.round(this.elapsedRaceMs),
      speedKmh,
      wallHits: this.player.wallHits,
      countdownText,
      isOffRoad: this.player.isOffRoad,
      hasGhost: !!this.bestGhost,
      dots: this.racers.map((r) => ({
        id: r.id,
        x: r.x,
        y: r.y,
        color: r.isPlayer ? '#ff3366' : r.color,
        isPlayer: r.isPlayer,
        position: r.position,
      })),
    });
  }

  private finishRace() {
    this.finished = true;
    soundManager.stopEngine();

    const standings = buildFinalStandings(
      this.racers,
      this.track,
      this.elapsedRaceMs
    );
    const playerRow = standings.find((s) => s.isPlayer) || standings[0];

    this.onRaceFinish({
      standings,
      playerPosition: playerRow.position,
      finishTimeMs: playerRow.finishTimeMs,
      bestLapMs: playerRow.bestLapMs,
      wallHits: playerRow.wallHits,
    });
  }
}
