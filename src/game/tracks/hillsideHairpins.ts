import { buildTrackFromControlPoints, TrackData } from './types';

// Hillside Hairpins: Hairpins, narrow sections
export const hillsideHairpinsTrack: TrackData = buildTrackFromControlPoints({
  id: 'hillside-hairpins',
  name: 'Hillside Hairpins',
  difficulty: 'hard',
  laps: 3,
  lengthKm: 1.8,
  parTimeMs: 180000,
  multiplier: 1.5,
  roadWidth: 175,
  wallMargin: 68,
  targetPerimeterPx: 18200,
  rawPoints: [
    { x: -350, y: -900 },
    { x: 450, y: -900 },
    { x: 1150, y: -820 },
    { x: 1350, y: -480 },  // Hairpin 1 entry
    { x: 920, y: -380 },
    { x: 420, y: -420 },   // Hairpin 1 exit switchback
    { x: 180, y: -80 },    // Hairpin 2 apex
    { x: 780, y: 40 },
    { x: 1320, y: 180 },   // Hairpin 3 outer ridge
    { x: 1220, y: 620 },
    { x: 580, y: 780 },
    { x: -120, y: 520 },   // Canyon chicane
    { x: -580, y: 820 },
    { x: -1220, y: 680 },  // Hairpin 4 valley turn
    { x: -1320, y: 220 },
    { x: -720, y: 40 },
    { x: -1220, y: -320 }, // Uphill switchback
    { x: -1150, y: -780 },
  ],
});
