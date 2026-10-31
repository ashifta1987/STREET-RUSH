import { buildTrackFromControlPoints, TrackData } from './types';

// Old Town Sprint: Tight 90-degree street corners
export const oldTownSprintTrack: TrackData = buildTrackFromControlPoints({
  id: 'old-town-sprint',
  name: 'Old Town Sprint',
  difficulty: 'medium',
  laps: 3,
  lengthKm: 1.4,
  parTimeMs: 150000,
  multiplier: 1.3,
  roadWidth: 190,
  wallMargin: 75,
  targetPerimeterPx: 15400,
  rawPoints: [
    { x: -300, y: -800 },
    { x: 500, y: -800 },
    { x: 950, y: -800 },
    { x: 1020, y: -350 },  // 90 deg right into city block
    { x: 550, y: -300 },   // 90 deg right inward
    { x: 520, y: 180 },    // 90 deg left down
    { x: 1080, y: 220 },   // 90 deg left out
    { x: 1100, y: 750 },   // 90 deg right down to bottom boulevard
    { x: 350, y: 800 },
    { x: -450, y: 800 },
    { x: -1050, y: 760 },
    { x: -1080, y: 220 },  // 90 deg right up
    { x: -620, y: 180 },
    { x: -640, y: -320 },
    { x: -1050, y: -360 },
    { x: -1020, y: -780 },
  ],
});
