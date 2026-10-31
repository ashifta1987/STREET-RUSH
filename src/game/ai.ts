import { AI_PERSONALITIES, DIFFICULTY_AI_SCALE } from './content';
import { InputState } from './input';
import { RacerBody } from './physics';
import { TrackData } from './tracks/types';

export function computeAIInput(
  ai: RacerBody,
  player: RacerBody,
  track: TrackData,
  dt: number
): { input: InputState; speedMultiplier: number } {
  const personality =
    AI_PERSONALITIES.find((p) => p.id === ai.aiPersonalityId) || AI_PERSONALITIES[0];

  const wpCount = track.waypoints.length;
  let wpIdx = ai.aiWaypointIndex ?? 0;

  // Advance waypoint when within reach or passed along tangent
  let wp = track.waypoints[wpIdx];
  const dxToWp = wp.x - ai.x;
  const dyToWp = wp.y - ai.y;
  const distToWp = Math.hypot(dxToWp, dyToWp);
  const dotAlong = dxToWp * wp.tx + dyToWp * wp.ty;

  if (distToWp < 165 || dotAlong < -20) {
    wpIdx = (wpIdx + 1) % wpCount;
    ai.aiWaypointIndex = wpIdx;
    wp = track.waypoints[wpIdx];

    // Occasional corner mistake (running slightly wide on corners)
    if (wp.cornerSharpness > 0.35 && Math.random() < personality.mistakeRate) {
      ai.aiMistakeTimer = 0.75;
    }
  }

  if ((ai.aiMistakeTimer ?? 0) > 0) {
    ai.aiMistakeTimer = Math.max(0, (ai.aiMistakeTimer ?? 0) - dt);
  }

  // Look ahead 2 waypoints for smooth steering
  const targetWp = track.waypoints[(wpIdx + 1) % wpCount];
  const baseLaneOffset = ai.aiLaneOffset ?? 0;
  const mistakeWideOffset = (ai.aiMistakeTimer ?? 0) > 0 ? 32 : 0;
  const cornerInsideOffset =
    targetWp.cornerSharpness > 0.25 ? personality.insideLineBias * 0.65 : 0;

  const totalOffset = Math.max(
    -track.roadWidth * 0.34,
    Math.min(
      track.roadWidth * 0.34,
      baseLaneOffset + cornerInsideOffset + mistakeWideOffset
    )
  );

  const targetX = targetWp.x + targetWp.nx * totalOffset;
  const targetY = targetWp.y + targetWp.ny * totalOffset;

  const desiredAngle = Math.atan2(targetY - ai.y, targetX - ai.x);
  let angleDiff = desiredAngle - ai.angle;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  const steerDeadzone = 0.045;
  const left = angleDiff < -steerDeadzone;
  const right = angleDiff > steerDeadzone;

  // Determine desired cornering speed
  const lookAheadWp = track.waypoints[(wpIdx + 3) % wpCount];
  const worstRecommended = Math.min(
    wp.recommendedSpeedRatio,
    lookAheadWp.recommendedSpeedRatio
  );
  const desiredSpeedRatio = Math.min(1.0, worstRecommended * personality.brakeLateFactor);
  const currentSpeedRatio = ai.speed / Math.max(1, ai.stats.maxSpeed);

  const needBrake =
    currentSpeedRatio > desiredSpeedRatio + 0.14 && Math.abs(angleDiff) > 0.22;

  // Anti-stuck check: if speed is very low for > 1.2s, steer directly toward track center and accelerate
  if (Math.abs(ai.speed) < 35) {
    ai.aiStuckTimer = (ai.aiStuckTimer ?? 0) + dt;
  } else {
    ai.aiStuckTimer = 0;
  }

  if ((ai.aiStuckTimer ?? 0) > 1.0) {
    // Re-aim directly toward next waypoint center
    const centerAngle = Math.atan2(wp.y - ai.y, wp.x - ai.x);
    ai.angle = centerAngle;
    ai.aiStuckTimer = 0;
  }

  // Rubber-band logic:
  // 300 m = 3000 px in world coordinates
  const progressGap = ai.totalProgressDist - player.totalProgressDist;
  let rubberBandFactor = 1.0;
  if (progressGap > 3000) {
    rubberBandFactor = 0.95; // AI more than 300m ahead slow by 5%
  } else if (progressGap < -3000) {
    rubberBandFactor = 1.05; // AI far behind speed up by 5%
  }

  const difficultyScale = DIFFICULTY_AI_SCALE[track.difficulty] ?? 1.0;
  const speedMultiplier =
    personality.speedFactor * difficultyScale * rubberBandFactor;

  return {
    input: {
      accelerate: !needBrake,
      brake: needBrake,
      left,
      right,
      handbrake: false,
    },
    speedMultiplier,
  };
}
