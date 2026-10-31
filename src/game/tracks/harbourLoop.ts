import { buildTrackFromControlPoints, TrackData } from './types';

// Harbour Loop: Wide oval, two gentle chicanes
export const harbourLoopTrack: TrackData = buildTrackFromControlPoints({
  id: 'harbour-loop',
  name: 'Harbour Loop',
  difficulty: 'easy',
  laps: 3,
  lengthKm: 1.2,
  parTimeMs: 120000,
  multiplier: 1.0,
  roadWidth: 220,
  wallMargin: 90,
  targetPerimeterPx: 12600,
  rawPoints: [
    { x: 0, y: -600 },
    { x: 550, y: -600 },
    { x: 950, y: -480 },
    { x: 1180, y: -150 },
    { x: 1040, y: 120 },   // gentle chicane 1
    { x: 1160, y: 380 },
    { x: 900, y: 620 },
    { x: 350, y: 650 },
    { x: -200, y: 620 },
    { x: -650, y: 520 },
    { x: -1020, y: 260 },
    { x: -920, y: -20 },   // gentle chicane 2
    { x: -1050, y: -320 },
    { x: -680, y: -580 },
  ],
});
