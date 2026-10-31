import { CarConfig } from './content';
import { InputState } from './input';
import { SplineSample, TrackData } from './tracks/types';

export interface CarPhysicsStats {
  maxSpeed: number;     // px/s
  acceleration: number; // px/s^2
  brakeDecel: number;   // px/s^2
  turnRate: number;     // rad/s
  grip: number;         // lateral velocity damping factor
}

export interface RacerBody {
  id: string;
  name: string;
  isPlayer: boolean;
  carConfig: CarConfig;
  color: string;
  stripeColor: string;
  stats: CarPhysicsStats;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number; // signed forward speed
  angle: number; // heading in radians
  angularVel: number;
  steerAngle: number;
  isOffRoad: boolean;
  isDrifting: boolean;
  wallHits: number;
  wallHitCooldown: number;
  bumpCooldown: number;
  closestSplineIndex: number;
  distanceAlongLap: number;
  lateralOffsetFromCenter: number;
  // Race progress
  lap: number; // 1..3 (or 4 when finished)
  nextCheckpointIndex: number;
  checkpointsPassedInLap: number;
  totalProgressDist: number;
  currentLapTimeMs: number;
  bestLapTimeMs: number | null;
  finishTimeMs: number | null;
  finished: boolean;
  position: number; // 1..5
  // AI specific
  aiPersonalityId?: 'viper' | 'blaze' | 'storm' | 'rookie';
  aiWaypointIndex?: number;
  aiLaneOffset?: number;
  aiMistakeTimer?: number;
  aiStuckTimer?: number;
}

export function derivePhysicsStats(car: CarConfig): CarPhysicsStats {
  // Speed 5..10 -> 325..390 px/s
  const maxSpeed = 265 + car.speed * 12.5;
  // Accel 5..10 -> 190..340 px/s^2
  const acceleration = 95 + car.accel * 24.5;
  // Handling 5..10 -> turnRate 2.25..3.55 rad/s, grip 5.5..10.5
  const turnRate = 1.45 + car.handling * 0.21;
  const grip = 3.5 + car.handling * 0.72;

  return {
    maxSpeed,
    acceleration,
    brakeDecel: 420,
    turnRate,
    grip,
  };
}

export function findClosestSplineInfo(
  x: number,
  y: number,
  track: TrackData,
  hintIndex?: number
): {
  index: number;
  sample: SplineSample;
  distFromCenter: number;
  signedLateral: number;
} {
  const n = track.spline.length;
  let bestIdx = 0;
  let bestDistSq = Infinity;

  if (hintIndex !== undefined && hintIndex >= 0 && hintIndex < n) {
    // Search local window first (±35 samples)
    const window = 35;
    for (let offset = -window; offset <= window; offset++) {
      const idx = (hintIndex + offset + n) % n;
      const sp = track.spline[idx];
      const dx = x - sp.x;
      const dy = y - sp.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestIdx = idx;
      }
    }
    // If somehow very far away, fall back to full scan
    if (bestDistSq > 350 * 350) {
      bestDistSq = Infinity;
      for (let i = 0; i < n; i++) {
        const sp = track.spline[i];
        const dx = x - sp.x;
        const dy = y - sp.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          bestIdx = i;
        }
      }
    }
  } else {
    for (let i = 0; i < n; i++) {
      const sp = track.spline[i];
      const dx = x - sp.x;
      const dy = y - sp.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestIdx = i;
      }
    }
  }

  const sample = track.spline[bestIdx];
  const dx = x - sample.x;
  const dy = y - sample.y;
  const signedLateral = dx * sample.nx + dy * sample.ny;
  const distFromCenter = Math.hypot(dx, dy);

  return {
    index: bestIdx,
    sample,
    distFromCenter,
    signedLateral,
  };
}

export function stepCarPhysics(
  racer: RacerBody,
  input: InputState,
  track: TrackData,
  dt: number,
  speedMultiplier = 1.0
): { hitWall: boolean } {
  let hitWall = false;

  if (racer.wallHitCooldown > 0) {
    racer.wallHitCooldown = Math.max(0, racer.wallHitCooldown - dt);
  }
  if (racer.bumpCooldown > 0) {
    racer.bumpCooldown = Math.max(0, racer.bumpCooldown - dt);
  }

  // Locate car relative to track centreline
  const preInfo = findClosestSplineInfo(racer.x, racer.y, track, racer.closestSplineIndex);
  racer.closestSplineIndex = preInfo.index;
  racer.distanceAlongLap = preInfo.sample.dist;
  racer.lateralOffsetFromCenter = preInfo.signedLateral;

  const halfRoad = track.roadWidth * 0.5;
  racer.isOffRoad = Math.abs(preInfo.signedLateral) > halfRoad + 8;

  // Off-road (grass, sand) multiplies max speed by 0.5
  const terrainFactor = racer.isOffRoad ? 0.5 : 1.0;
  const effectiveMaxSpeed = racer.stats.maxSpeed * speedMultiplier * terrainFactor;
  const reverseMaxSpeed = effectiveMaxSpeed * 0.32;

  // Steering input
  let steerInput = 0;
  if (input.left) steerInput -= 1;
  if (input.right) steerInput += 1;
  racer.steerAngle = steerInput * 0.45;

  // Forward & right unit vectors
  const fx = Math.cos(racer.angle);
  const fy = Math.sin(racer.angle);
  const rx = -fy;
  const ry = fx;

  // Decompose current velocity into forward and lateral components
  let forwardVel = racer.vx * fx + racer.vy * fy;
  let lateralVel = racer.vx * rx + racer.vy * ry;

  // Acceleration / braking / reverse
  if (input.accelerate) {
    forwardVel += racer.stats.acceleration * speedMultiplier * dt;
  } else if (input.brake) {
    if (forwardVel > 15) {
      forwardVel -= racer.stats.brakeDecel * dt;
    } else {
      forwardVel -= racer.stats.acceleration * 0.65 * dt;
    }
  } else {
    // Natural rolling drag
    const drag = racer.isOffRoad ? 190 : 85;
    if (Math.abs(forwardVel) <= drag * dt) {
      forwardVel = 0;
    } else {
      forwardVel -= Math.sign(forwardVel) * drag * dt;
    }
  }

  if (input.handbrake) {
    forwardVel *= Math.max(0, 1 - 2.6 * dt);
  }

  // Clamp to effective max speed (smoothly decelerate if just entered grass)
  if (forwardVel > effectiveMaxSpeed) {
    if (racer.isOffRoad) {
      forwardVel = Math.max(effectiveMaxSpeed, forwardVel - 420 * dt);
    } else {
      forwardVel = effectiveMaxSpeed;
    }
  }
  if (forwardVel < -reverseMaxSpeed) {
    forwardVel = -reverseMaxSpeed;
  }

  // Turning rate scales with movement so car doesn't spin in place
  const speedRatioForTurn = Math.min(1, Math.abs(forwardVel) / 75);
  const reverseSign = forwardVel >= -5 ? 1 : -1;
  const handbrakeTurnBoost = input.handbrake ? 1.28 : 1.0;

  if (steerInput !== 0 && speedRatioForTurn > 0.04) {
    racer.angle +=
      steerInput *
      racer.stats.turnRate *
      handbrakeTurnBoost *
      speedRatioForTurn *
      reverseSign *
      dt;
  }

  // Recompute basis after rotation
  const nfx = Math.cos(racer.angle);
  const nfy = Math.sin(racer.angle);
  const nrx = -nfy;
  const nry = nfx;

  // Apply grip to dampen lateral slip (handbrake lowers grip for drifting)
  const effectiveGrip = input.handbrake ? racer.stats.grip * 0.35 : racer.stats.grip;
  lateralVel *= Math.exp(-effectiveGrip * dt);

  racer.isDrifting =
    Math.abs(lateralVel) > 48 || (input.handbrake && Math.abs(forwardVel) > 120);

  racer.vx = nfx * forwardVel + nrx * lateralVel;
  racer.vy = nfy * forwardVel + nry * lateralVel;
  racer.speed = forwardVel;

  // Integrate position
  racer.x += racer.vx * dt;
  racer.y += racer.vy * dt;

  // Check wall collision at outer track boundary
  const postInfo = findClosestSplineInfo(racer.x, racer.y, track, racer.closestSplineIndex);
  racer.closestSplineIndex = postInfo.index;
  racer.distanceAlongLap = postInfo.sample.dist;
  racer.lateralOffsetFromCenter = postInfo.signedLateral;

  const maxAllowedLateral = track.wallOffset - 16;
  if (Math.abs(postInfo.signedLateral) > maxAllowedLateral) {
    const sign = Math.sign(postInfo.signedLateral) || 1;
    // Clamp car back inside the wall boundary
    racer.x = postInfo.sample.x + postInfo.sample.nx * sign * (maxAllowedLateral - 2);
    racer.y = postInfo.sample.y + postInfo.sample.ny * sign * (maxAllowedLateral - 2);

    // Wall hits stop the car's forward speed and count as a "crash" for the clean-driving bonus
    if (Math.abs(racer.speed) > 45 && racer.wallHitCooldown <= 0) {
      racer.wallHits += 1;
      racer.wallHitCooldown = 0.85;
      hitWall = true;
    }

    racer.speed = 0;
    // Small inward nudge so the car doesn't stay glued to the wall
    racer.vx = -postInfo.sample.nx * sign * 35;
    racer.vy = -postInfo.sample.ny * sign * 35;

    // Gently align heading slightly toward track tangent so AI or grazing player recovers cleanly
    const trackAngle = Math.atan2(postInfo.sample.ty, postInfo.sample.tx);
    let angleDiff = trackAngle - racer.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    racer.angle += angleDiff * 0.25;
  }

  return { hitWall };
}

export function resolveCarCollisions(racers: RacerBody[]): boolean {
  let anyPlayerBump = false;
  const collisionRadius = 21; // car-to-car collision radius
  const minDist = collisionRadius * 2;

  for (let i = 0; i < racers.length; i++) {
    for (let j = i + 1; j < racers.length; j++) {
      const a = racers[i];
      const b = racers[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0 && dist < minDist) {
        const overlap = (minDist - dist) * 0.5 + 1;
        const nx = dx / dist;
        const ny = dy / dist;

        // Push both cars apart
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;

        // Cut speed by 20% on bump (with cooldown so multi-frame contact doesn't zero speed)
        if (a.bumpCooldown <= 0 || b.bumpCooldown <= 0) {
          a.vx *= 0.8;
          a.vy *= 0.8;
          a.speed *= 0.8;
          b.vx *= 0.8;
          b.vy *= 0.8;
          b.speed *= 0.8;

          // Add slight separation impulse
          const impulse = 45;
          a.vx -= nx * impulse;
          a.vy -= ny * impulse;
          b.vx += nx * impulse;
          b.vy += ny * impulse;

          a.bumpCooldown = 0.45;
          b.bumpCooldown = 0.45;

          if (a.isPlayer || b.isPlayer) {
            anyPlayerBump = true;
          }
        }
      }
    }
  }

  return anyPlayerBump;
}
