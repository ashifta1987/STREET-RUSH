import {
  AI_DRIVER_POOL,
  AI_PERSONALITIES,
  CarConfig,
  CARS,
} from './content';
import { derivePhysicsStats, RacerBody } from './physics';
import { TrackData } from './tracks/types';

export interface GhostSample {
  tMs: number;
  x: number;
  y: number;
  angle: number;
}

export interface FinalRacerStanding {
  id: string;
  name: string;
  isPlayer: boolean;
  carName: string;
  carId: string;
  color: string;
  position: number;
  finishTimeMs: number;
  bestLapMs: number;
  wallHits: number;
}

export function createRaceGrid(
  track: TrackData,
  playerName: string,
  playerCar: CarConfig
): RacerBody[] {
  // Shuffle AI driver pool to pick 4 random names/colours
  const shuffledPool = [...AI_DRIVER_POOL].sort(() => Math.random() - 0.5);
  const personalities: ('viper' | 'blaze' | 'storm' | 'rookie')[] = [
    'viper',
    'blaze',
    'storm',
    'rookie',
  ];

  const racers: RacerBody[] = [];

  // Slots 1..4 are AI drivers
  for (let i = 0; i < 4; i++) {
    const slot = track.gridSlots[i];
    const driverInfo = shuffledPool[i];
    const randomCar = CARS[Math.floor(Math.random() * CARS.length)];
    const personalityId = personalities[i];
    const laneBias = (i % 2 === 0 ? -1 : 1) * (14 + i * 4);

    // Give AI cars the same base physics stats as the player car so personality speedFactor
    // ("Speed vs player car: 100%, 96%, 93%, 88%") is true to the spec!
    const baseStats = derivePhysicsStats(playerCar);

    racers.push({
      id: `ai-${i + 1}`,
      name: driverInfo.name,
      isPlayer: false,
      carConfig: randomCar,
      color: driverInfo.color,
      stripeColor: driverInfo.stripe,
      stats: baseStats,
      x: slot.x,
      y: slot.y,
      vx: 0,
      vy: 0,
      speed: 0,
      angle: slot.angle,
      angularVel: 0,
      steerAngle: 0,
      isOffRoad: false,
      isDrifting: false,
      wallHits: 0,
      wallHitCooldown: 0,
      bumpCooldown: 0,
      closestSplineIndex: track.spline.length - 6 - i * 2,
      distanceAlongLap: 0,
      lateralOffsetFromCenter: 0,
      lap: 1,
      nextCheckpointIndex: 1,
      checkpointsPassedInLap: 1,
      totalProgressDist: -slot.slot * 45,
      currentLapTimeMs: 0,
      bestLapTimeMs: null,
      finishTimeMs: null,
      finished: false,
      position: i + 1,
      aiPersonalityId: personalityId,
      aiWaypointIndex: 1,
      aiLaneOffset: laneBias,
      aiMistakeTimer: 0,
      aiStuckTimer: 0,
    });
  }

  // Slot 5 is the Player (always starts 5th on the grid)
  const playerSlot = track.gridSlots[4];
  racers.push({
    id: 'player',
    name: playerName || 'YOU',
    isPlayer: true,
    carConfig: playerCar,
    color: playerCar.primaryColor,
    stripeColor: playerCar.stripeColor,
    stats: derivePhysicsStats(playerCar),
    x: playerSlot.x,
    y: playerSlot.y,
    vx: 0,
    vy: 0,
    speed: 0,
    angle: playerSlot.angle,
    angularVel: 0,
    steerAngle: 0,
    isOffRoad: false,
    isDrifting: false,
    wallHits: 0,
    wallHitCooldown: 0,
    bumpCooldown: 0,
    closestSplineIndex: track.spline.length - 16,
    distanceAlongLap: 0,
    lateralOffsetFromCenter: 0,
    lap: 1,
    nextCheckpointIndex: 1,
    checkpointsPassedInLap: 1,
    totalProgressDist: -250,
    currentLapTimeMs: 0,
    bestLapTimeMs: null,
    finishTimeMs: null,
    finished: false,
    position: 5,
  });

  return racers;
}

export function updateRacerCheckpointsAndLap(
  racer: RacerBody,
  track: TrackData,
  dtMs: number,
  elapsedRaceMs: number
): { completedLap: boolean; finishedRace: boolean } {
  if (racer.finished) {
    return { completedLap: false, finishedRace: false };
  }

  racer.currentLapTimeMs += dtMs;

  const numCp = track.checkpoints.length;
  const targetCp = track.checkpoints[racer.nextCheckpointIndex];
  const dx = racer.x - targetCp.x;
  const dy = racer.y - targetCp.y;
  const distToCp = Math.hypot(dx, dy);

  // Project onto checkpoint tangent & normal
  const alongTangent = dx * targetCp.tx + dy * targetCp.ty;
  const acrossNormal = Math.abs(dx * targetCp.nx + dy * targetCp.ny);

  // Checkpoint counts if car is within road/wall corridor and crosses or reaches checkpoint
  const cpGateRadius = track.wallOffset + 45;
  const passedGate =
    distToCp < cpGateRadius ||
    (acrossNormal < cpGateRadius && alongTangent >= -25 && alongTangent <= 140);

  let completedLap = false;
  let finishedRace = false;

  if (passedGate) {
    if (racer.nextCheckpointIndex === 0 && racer.checkpointsPassedInLap >= numCp) {
      // Completed a full valid lap!
      const lapTime = Math.max(1000, Math.round(racer.currentLapTimeMs));
      if (racer.bestLapTimeMs === null || lapTime < racer.bestLapTimeMs) {
        racer.bestLapTimeMs = lapTime;
      }

      if (racer.lap >= track.laps) {
        racer.finished = true;
        racer.finishTimeMs = Math.round(elapsedRaceMs);
        // Ensure bestLapTimeMs * laps <= finishTimeMs
        const maxAllowedBestLap = Math.floor(racer.finishTimeMs / track.laps);
        if (
          racer.bestLapTimeMs === null ||
          racer.bestLapTimeMs > maxAllowedBestLap
        ) {
          racer.bestLapTimeMs = maxAllowedBestLap;
        }
        finishedRace = true;
      } else {
        racer.lap += 1;
        racer.currentLapTimeMs = 0;
        racer.checkpointsPassedInLap = 1;
        racer.nextCheckpointIndex = 1;
        completedLap = true;
      }
    } else {
      racer.checkpointsPassedInLap += 1;
      racer.nextCheckpointIndex = (racer.nextCheckpointIndex + 1) % numCp;
    }
  }

  // Compute continuous race progress for accurate live sorting
  const nextCp = track.checkpoints[racer.nextCheckpointIndex];
  const distToNextCp = Math.hypot(nextCp.x - racer.x, nextCp.y - racer.y);
  const cpStepDist = track.totalLength / numCp;
  racer.totalProgressDist =
    (racer.lap - 1) * track.totalLength +
    racer.checkpointsPassedInLap * cpStepDist -
    distToNextCp;

  return { completedLap, finishedRace };
}

export function updateRacePositions(racers: RacerBody[]): void {
  // Sort by:
  // 1) Finished racers first (ordered by finishTimeMs ascending)
  // 2) Active racers ordered by: laps completed, then checkpointsPassedInLap, then smaller distance to next checkpoint (captured in totalProgressDist)
  const sorted = [...racers].sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.finishTimeMs ?? 0) - (b.finishTimeMs ?? 0);
    }
    if (a.finished) return -1;
    if (b.finished) return 1;
    if (b.lap !== a.lap) return b.lap - a.lap;
    if (b.checkpointsPassedInLap !== a.checkpointsPassedInLap) {
      return b.checkpointsPassedInLap - a.checkpointsPassedInLap;
    }
    return b.totalProgressDist - a.totalProgressDist;
  });

  sorted.forEach((r, idx) => {
    r.position = idx + 1;
  });
}

export function buildFinalStandings(
  racers: RacerBody[],
  track: TrackData,
  elapsedRaceMs: number
): FinalRacerStanding[] {
  updateRacePositions(racers);
  const totalRaceDist = track.totalLength * track.laps;
  const playerFinishMs = Math.max(
    Math.ceil(track.parTimeMs * 0.72),
    Math.round(elapsedRaceMs)
  );

  // Project finish times for any AI cars still running when the player finishes 3 laps
  const ordered = [...racers].sort((a, b) => a.position - b.position);
  let prevTimeMs = 0;

  return ordered.map((r, idx) => {
    let finishTimeMs = r.finishTimeMs;

    if (r.isPlayer) {
      finishTimeMs = playerFinishMs;
    } else if (finishTimeMs === null) {
      const progressRatio = Math.max(
        0.25,
        Math.min(0.99, r.totalProgressDist / totalRaceDist)
      );
      const projected = Math.round(playerFinishMs / progressRatio);
      finishTimeMs = Math.max(playerFinishMs + 650 * (idx + 1), projected);
    }

    // Ensure strictly increasing finish times down the order
    if (idx > 0 && finishTimeMs <= prevTimeMs) {
      finishTimeMs = prevTimeMs + 420 + idx * 130;
    }
    prevTimeMs = finishTimeMs;

    let bestLapMs =
      r.bestLapTimeMs ?? Math.round((finishTimeMs / track.laps) * 0.97);
    if (bestLapMs * track.laps > finishTimeMs) {
      bestLapMs = Math.floor(finishTimeMs / track.laps);
    }

    return {
      id: r.id,
      name: r.name,
      isPlayer: r.isPlayer,
      carName: r.carConfig.name,
      carId: r.carConfig.id,
      color: r.color,
      position: idx + 1,
      finishTimeMs,
      bestLapMs,
      wallHits: r.wallHits,
    };
  });
}

const GHOST_STORAGE_PREFIX = 'street_rush_ghost_';

export function loadBestGhost(trackId: string): {
  lapTimeMs: number;
  samples: GhostSample[];
} | null {
  try {
    const raw = localStorage.getItem(GHOST_STORAGE_PREFIX + trackId);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveBestGhost(
  trackId: string,
  lapTimeMs: number,
  samples: GhostSample[]
) {
  try {
    const existing = loadBestGhost(trackId);
    if (!existing || lapTimeMs < existing.lapTimeMs) {
      localStorage.setItem(
        GHOST_STORAGE_PREFIX + trackId,
        JSON.stringify({ lapTimeMs, samples })
      );
    }
  } catch {
    // ignore storage quota errors
  }
}
