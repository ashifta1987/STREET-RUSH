export interface Point2D {
  x: number;
  y: number;
}

export interface SplineSample {
  x: number;
  y: number;
  tx: number; // unit tangent x
  ty: number; // unit tangent y
  nx: number; // unit normal x (right of direction)
  ny: number; // unit normal y
  dist: number; // cumulative distance from start line
  curvature: number; // signed curvature
}

export interface Checkpoint {
  index: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  nx: number;
  ny: number;
  width: number;
  dist: number;
}

export interface AIWaypoint {
  index: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  nx: number;
  ny: number;
  dist: number;
  cornerSharpness: number; // 0 (straight) to 1 (tight hairpin)
  recommendedSpeedRatio: number; // 0.45 to 1.0
}

export interface GridSlot {
  slot: number; // 1..5 (5 is player)
  x: number;
  y: number;
  angle: number;
}

export interface RoadsideProp {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  variant: number;
  side: 'left' | 'right';
}

export interface TrackData {
  id: 'harbour-loop' | 'night-highway' | 'old-town-sprint' | 'hillside-hairpins';
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  laps: number;
  lengthKm: number;
  parTimeMs: number;
  multiplier: number;
  roadWidth: number;
  wallOffset: number; // half width from centreline to outer barrier wall
  totalLength: number;
  controlPoints: Point2D[];
  spline: SplineSample[];
  checkpoints: Checkpoint[];
  waypoints: AIWaypoint[];
  gridSlots: GridSlot[];
  props: RoadsideProp[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

function catmullRom(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, t: number): Point2D {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

export function buildTrackFromControlPoints(config: {
  id: TrackData['id'];
  name: string;
  difficulty: TrackData['difficulty'];
  laps: number;
  lengthKm: number;
  parTimeMs: number;
  multiplier: number;
  roadWidth: number;
  wallMargin: number;
  targetPerimeterPx: number;
  rawPoints: Point2D[];
}): TrackData {
  const n = config.rawPoints.length;
  const samplesPerSegment = 24;
  const totalSamples = n * samplesPerSegment;

  // 1. Sample raw spline to measure raw perimeter
  const rawSampled: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = config.rawPoints[(i - 1 + n) % n];
    const p1 = config.rawPoints[i];
    const p2 = config.rawPoints[(i + 1) % n];
    const p3 = config.rawPoints[(i + 2) % n];
    for (let s = 0; s < samplesPerSegment; s++) {
      rawSampled.push(catmullRom(p0, p1, p2, p3, s / samplesPerSegment));
    }
  }

  let rawLen = 0;
  for (let i = 0; i < totalSamples; i++) {
    const a = rawSampled[i];
    const b = rawSampled[(i + 1) % totalSamples];
    rawLen += Math.hypot(b.x - a.x, b.y - a.y);
  }

  const scale = config.targetPerimeterPx / Math.max(1, rawLen);
  const controlPoints = config.rawPoints.map((p) => ({ x: p.x * scale, y: p.y * scale }));
  const scaledPoints = rawSampled.map((p) => ({ x: p.x * scale, y: p.y * scale }));

  // 2. Build dense SplineSample array with tangents, normals, cumulative distance, and curvature
  const spline: SplineSample[] = [];
  let cumDist = 0;

  for (let i = 0; i < totalSamples; i++) {
    const prev = scaledPoints[(i - 1 + totalSamples) % totalSamples];
    const curr = scaledPoints[i];
    const next = scaledPoints[(i + 1) % totalSamples];

    if (i > 0) {
      cumDist += Math.hypot(curr.x - prev.x, curr.y - prev.y);
    }

    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const tx = dx / len;
    const ty = dy / len;
    const nx = -ty;
    const ny = tx;

    // Estimate curvature from angle change over a wider window
    const prevWide = scaledPoints[(i - 3 + totalSamples) % totalSamples];
    const nextWide = scaledPoints[(i + 3) % totalSamples];
    const a1 = Math.atan2(curr.y - prevWide.y, curr.x - prevWide.x);
    const a2 = Math.atan2(nextWide.y - curr.y, nextWide.x - curr.x);
    let dAngle = a2 - a1;
    while (dAngle > Math.PI) dAngle -= Math.PI * 2;
    while (dAngle < -Math.PI) dAngle += Math.PI * 2;
    const segDist = Math.hypot(nextWide.x - prevWide.x, nextWide.y - prevWide.y) || 1;
    const curvature = dAngle / segDist;

    spline.push({
      x: curr.x,
      y: curr.y,
      tx,
      ty,
      nx,
      ny,
      dist: cumDist,
      curvature,
    });
  }

  const last = scaledPoints[totalSamples - 1];
  const first = scaledPoints[0];
  const totalLength = cumDist + Math.hypot(first.x - last.x, first.y - last.y);

  // 3. Build 16 Checkpoints around the track (index 0 is start/finish line)
  const numCheckpoints = 16;
  const checkpoints: Checkpoint[] = [];
  for (let c = 0; c < numCheckpoints; c++) {
    const idx = Math.floor((c / numCheckpoints) * totalSamples) % totalSamples;
    const sp = spline[idx];
    checkpoints.push({
      index: c,
      x: sp.x,
      y: sp.y,
      tx: sp.tx,
      ty: sp.ty,
      nx: sp.nx,
      ny: sp.ny,
      width: config.roadWidth * 1.4,
      dist: sp.dist,
    });
  }

  // 4. Build AI Waypoints (~80 waypoints around the loop with lookahead corner sharpness)
  const numWaypoints = 80;
  const waypoints: AIWaypoint[] = [];
  for (let w = 0; w < numWaypoints; w++) {
    const idx = Math.floor((w / numWaypoints) * totalSamples) % totalSamples;
    const sp = spline[idx];

    // Check lookahead curvature over next few samples so AI brakes before sharp corners
    let maxAbsCurv = Math.abs(sp.curvature);
    for (let look = 1; look <= 8; look++) {
      const lookSp = spline[(idx + look * 2) % totalSamples];
      maxAbsCurv = Math.max(maxAbsCurv, Math.abs(lookSp.curvature));
    }

    // Map curvature (typically 0..0.0045) to sharpness 0..1
    const cornerSharpness = Math.min(1, maxAbsCurv * 260);
    const recommendedSpeedRatio = Math.max(0.48, 1.0 - cornerSharpness * 0.48);

    waypoints.push({
      index: w,
      x: sp.x,
      y: sp.y,
      tx: sp.tx,
      ty: sp.ty,
      nx: sp.nx,
      ny: sp.ny,
      dist: sp.dist,
      cornerSharpness,
      recommendedSpeedRatio,
    });
  }

  // 5. Build 5 Grid Slots (2-wide starting grid behind the start line; player starts 5th!)
  // Slot 1 & 2 front row, Slot 3 & 4 middle row, Slot 5 (player) back row
  const gridSlots: GridSlot[] = [];
  const rowOffsets = [85, 85, 165, 165, 245]; // distance behind start line
  const laneOffsets = [-config.roadWidth * 0.22, config.roadWidth * 0.22, -config.roadWidth * 0.22, config.roadWidth * 0.22, 0];

  for (let slot = 1; slot <= 5; slot++) {
    const targetDist = (totalLength - rowOffsets[slot - 1]) % totalLength;
    // Find closest spline sample
    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < spline.length; i++) {
      const diff = Math.abs(spline[i].dist - targetDist);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
    const sp = spline[bestIdx];
    const lane = laneOffsets[slot - 1];
    gridSlots.push({
      slot,
      x: sp.x + sp.nx * lane,
      y: sp.y + sp.ny * lane,
      angle: Math.atan2(sp.ty, sp.tx),
    });
  }

  // 6. Generate deterministic roadside props (trees, towers, buildings, lights) outside the wall
  const props: RoadsideProp[] = [];
  const wallOffset = config.roadWidth * 0.5 + config.wallMargin;
  for (let i = 0; i < totalSamples; i += 4) {
    const sp = spline[i];
    const side: 'left' | 'right' = i % 8 === 0 ? 'left' : 'right';
    const sign = side === 'right' ? 1 : -1;
    const distFromCenter = wallOffset + 75 + ((i * 37) % 110);
    const px = sp.x + sp.nx * sign * distFromCenter;
    const py = sp.y + sp.ny * sign * distFromCenter;

    // Make sure prop isn't overlapping another segment of the road
    let tooCloseToRoad = false;
    for (let j = 0; j < totalSamples; j += 6) {
      const other = spline[j];
      if (Math.hypot(px - other.x, py - other.y) < wallOffset + 45) {
        tooCloseToRoad = true;
        break;
      }
    }

    if (!tooCloseToRoad) {
      props.push({
        x: px,
        y: py,
        scale: 0.85 + ((i * 13) % 40) / 100,
        rotation: ((i * 53) % 360) * (Math.PI / 180),
        variant: (i / 4) % 4,
        side,
      });
    }
  }

  // 7. Compute bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const sp of spline) {
    minX = Math.min(minX, sp.x - wallOffset - 200);
    maxX = Math.max(maxX, sp.x + wallOffset + 200);
    minY = Math.min(minY, sp.y - wallOffset - 200);
    maxY = Math.max(maxY, sp.y + wallOffset + 200);
  }

  return {
    id: config.id,
    name: config.name,
    difficulty: config.difficulty,
    laps: config.laps,
    lengthKm: config.lengthKm,
    parTimeMs: config.parTimeMs,
    multiplier: config.multiplier,
    roadWidth: config.roadWidth,
    wallOffset,
    totalLength,
    controlPoints,
    spline,
    checkpoints,
    waypoints,
    gridSlots,
    props,
    bounds: { minX, maxX, minY, maxY },
  };
}
