import { buildTrackFromControlPoints, TrackData } from './types';

// Night Highway: Long straights, fast sweepers
export const nightHighwayTrack: TrackData = buildTrackFromControlPoints({
  id: 'night-highway',
  name: 'Night Highway',
  difficulty: 'medium',
  laps: 3,
  lengthKm: 1.6,
  parTimeMs: 140000,
  multiplier: 1.2,
  roadWidth: 200,
  wallMargin: 80,
  targetPerimeterPx: 15200,
  rawPoints: [
    { x: -400, y: -700 },
    { x: 400, y: -700 },
    { x: 1200, y: -700 },  // long top highway straight
    { x: 1700, y: -520 },
    { x: 1850, y: -100 },  // fast sweeper right
    { x: 1550, y: 320 },
    { x: 950, y: 420 },
    { x: 450, y: 220 },    // mid highway S-bend
    { x: -150, y: 520 },
    { x: -850, y: 680 },
    { x: -1550, y: 560 },  // long return avenue
    { x: -1800, y: 120 },
    { x: -1550, y: -380 },
    { x: -1050, y: -660 },
  ],
});
