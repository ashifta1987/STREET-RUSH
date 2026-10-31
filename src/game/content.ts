export interface CityConfig {
  id: 'kochi' | 'mumbai' | 'dubai' | 'tokyo' | 'newyork';
  name: string;
  theme: string;
  look: string;
  accentColor: string;
  secondaryColor: string;
  groundColor: string;
  groundPatternColor: string;
  waterOrFeatureColor: string;
  roadColor: string;
  roadShoulderColor: string;
  curbColorA: string;
  curbColorB: string;
  wallColor: string;
  ambientGlow: string;
  sceneryType: 'palms' | 'seawall' | 'towers' | 'neon' | 'downtown';
  musicTempo: number;
  musicScale: number[];
}

export interface TrackMetadata {
  id: 'harbour-loop' | 'night-highway' | 'old-town-sprint' | 'hillside-hairpins';
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  laps: number;
  lengthKm: number;
  parTimeMs: number;
  multiplier: number;
  shapeDescription: string;
}

export interface CarConfig {
  id: 'bolt-gt' | 'falcon-rs' | 'drift-king' | 'thunder-v8' | 'city-hopper';
  name: string;
  speed: number;       // 1-10
  accel: number;       // 1-10
  handling: number;    // 1-10
  bestFor: string;
  primaryColor: string;
  stripeColor: string;
  description: string;
}

export interface AIPersonality {
  id: 'viper' | 'blaze' | 'storm' | 'rookie';
  label: string;
  description: string;
  speedFactor: number;     // 1.0, 0.96, 0.93, 0.88
  insideLineBias: number;  // offset in px toward corner apex
  brakeLateFactor: number; // >1 brakes later, <1 brakes earlier
  mistakeRate: number;     // probability per corner of running slightly wide
}

export const CITIES: CityConfig[] = [
  {
    id: 'kochi',
    name: 'Kochi',
    theme: 'Backwaters',
    look: 'Coconut palms, canals, monsoon-green',
    accentColor: '#10b981',
    secondaryColor: '#06b6d4',
    groundColor: '#0c291e',
    groundPatternColor: '#113829',
    waterOrFeatureColor: '#0b4f6c',
    roadColor: '#1f2937',
    roadShoulderColor: '#15221b',
    curbColorA: '#10b981',
    curbColorB: '#f8fafc',
    wallColor: '#064e3b',
    ambientGlow: 'rgba(16, 185, 129, 0.16)',
    sceneryType: 'palms',
    musicTempo: 122,
    musicScale: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25],
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    theme: 'Marine Drive',
    look: 'Sea wall, city lights, evening orange',
    accentColor: '#f97316',
    secondaryColor: '#eab308',
    groundColor: '#1e162b',
    groundPatternColor: '#271c36',
    waterOrFeatureColor: '#152c4a',
    roadColor: '#252636',
    roadShoulderColor: '#31253c',
    curbColorA: '#f97316',
    curbColorB: '#fde047',
    wallColor: '#7c2d12',
    ambientGlow: 'rgba(249, 115, 22, 0.18)',
    sceneryType: 'seawall',
    musicTempo: 128,
    musicScale: [293.66, 329.63, 369.99, 440.0, 493.88, 587.33],
  },
  {
    id: 'dubai',
    name: 'Dubai',
    theme: 'Desert Boulevard',
    look: 'Sand edges, glass towers, gold tones',
    accentColor: '#eab308',
    secondaryColor: '#f59e0b',
    groundColor: '#362817',
    groundPatternColor: '#42311c',
    waterOrFeatureColor: '#0ea5e9',
    roadColor: '#262421',
    roadShoulderColor: '#523d24',
    curbColorA: '#eab308',
    curbColorB: '#1e293b',
    wallColor: '#713f12',
    ambientGlow: 'rgba(234, 179, 8, 0.18)',
    sceneryType: 'towers',
    musicTempo: 126,
    musicScale: [246.94, 261.63, 311.13, 329.63, 369.99, 440.0],
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    theme: 'Neon Night',
    look: 'Dark roads, neon signs, purple and pink',
    accentColor: '#ec4899',
    secondaryColor: '#a855f7',
    groundColor: '#0d091a',
    groundPatternColor: '#150f29',
    waterOrFeatureColor: '#3b0764',
    roadColor: '#161324',
    roadShoulderColor: '#211836',
    curbColorA: '#ec4899',
    curbColorB: '#22d3ee',
    wallColor: '#831843',
    ambientGlow: 'rgba(236, 72, 153, 0.22)',
    sceneryType: 'neon',
    musicTempo: 136,
    musicScale: [220.0, 261.63, 293.66, 329.63, 392.0, 440.0],
  },
  {
    id: 'newyork',
    name: 'New York',
    theme: 'Downtown Grid',
    look: 'Yellow cabs, steel bridges, grey and red',
    accentColor: '#ef4444',
    secondaryColor: '#facc15',
    groundColor: '#17191f',
    groundPatternColor: '#1f232b',
    waterOrFeatureColor: '#1e293b',
    roadColor: '#262930',
    roadShoulderColor: '#1c1f26',
    curbColorA: '#ef4444',
    curbColorB: '#facc15',
    wallColor: '#7f1d1d',
    ambientGlow: 'rgba(239, 68, 68, 0.16)',
    sceneryType: 'downtown',
    musicTempo: 132,
    musicScale: [261.63, 311.13, 349.23, 392.0, 466.16, 523.25],
  },
];

export const TRACK_METADATA: TrackMetadata[] = [
  {
    id: 'harbour-loop',
    name: 'Harbour Loop',
    difficulty: 'easy',
    laps: 3,
    lengthKm: 1.2,
    parTimeMs: 120000,
    multiplier: 1.0,
    shapeDescription: 'Wide oval, two gentle chicanes',
  },
  {
    id: 'night-highway',
    name: 'Night Highway',
    difficulty: 'medium',
    laps: 3,
    lengthKm: 1.6,
    parTimeMs: 140000,
    multiplier: 1.2,
    shapeDescription: 'Long straights, fast sweepers',
  },
  {
    id: 'old-town-sprint',
    name: 'Old Town Sprint',
    difficulty: 'medium',
    laps: 3,
    lengthKm: 1.4,
    parTimeMs: 150000,
    multiplier: 1.3,
    shapeDescription: 'Tight 90° street corners',
  },
  {
    id: 'hillside-hairpins',
    name: 'Hillside Hairpins',
    difficulty: 'hard',
    laps: 3,
    lengthKm: 1.8,
    parTimeMs: 180000,
    multiplier: 1.5,
    shapeDescription: 'Hairpins, narrow sections',
  },
];

export const CARS: CarConfig[] = [
  {
    id: 'bolt-gt',
    name: 'Bolt GT',
    speed: 9,
    accel: 6,
    handling: 5,
    bestFor: 'Highways',
    primaryColor: '#3b82f6',
    stripeColor: '#93c5fd',
    description: 'Built for blistering top speed on long highway straights.',
  },
  {
    id: 'falcon-rs',
    name: 'Falcon RS',
    speed: 7,
    accel: 8,
    handling: 7,
    bestFor: 'All-rounder',
    primaryColor: '#ff3366',
    stripeColor: '#ffffff',
    description: 'Balanced street tuner with punchy acceleration and crisp grip.',
  },
  {
    id: 'drift-king',
    name: 'Drift King',
    speed: 6,
    accel: 7,
    handling: 10,
    bestFor: 'Hairpins',
    primaryColor: '#a855f7',
    stripeColor: '#22d3ee',
    description: 'Razor-sharp cornering machine that carves through tight hairpins.',
  },
  {
    id: 'thunder-v8',
    name: 'Thunder V8',
    speed: 10,
    accel: 5,
    handling: 5,
    bestFor: 'Experts only',
    primaryColor: '#eab308',
    stripeColor: '#111827',
    description: 'Raw muscle with unmatched top speed. Demands clean braking.',
  },
  {
    id: 'city-hopper',
    name: 'City Hopper',
    speed: 5,
    accel: 10,
    handling: 8,
    bestFor: 'Beginners, street corners',
    primaryColor: '#10b981',
    stripeColor: '#ecfdf5',
    description: 'Instant launch off corners and forgiving handling in tight streets.',
  },
];

export const AI_PERSONALITIES: AIPersonality[] = [
  {
    id: 'viper',
    label: 'Viper',
    description: 'Aggressive, takes inside lines',
    speedFactor: 1.0,
    insideLineBias: -24,
    brakeLateFactor: 1.08,
    mistakeRate: 0.04,
  },
  {
    id: 'blaze',
    label: 'Blaze',
    description: 'Fast on straights, brakes late',
    speedFactor: 0.96,
    insideLineBias: 16,
    brakeLateFactor: 1.18,
    mistakeRate: 0.14,
  },
  {
    id: 'storm',
    label: 'Storm',
    description: 'Smooth and consistent',
    speedFactor: 0.93,
    insideLineBias: 0,
    brakeLateFactor: 0.98,
    mistakeRate: 0.02,
  },
  {
    id: 'rookie',
    label: 'Rookie',
    description: 'Cautious, brakes early',
    speedFactor: 0.88,
    insideLineBias: 28,
    brakeLateFactor: 0.85,
    mistakeRate: 0.24,
  },
];

// Pool of 12 AI driver names and colours picked at random each race
export const AI_DRIVER_POOL: { name: string; color: string; stripe: string }[] = [
  { name: 'Viper_X', color: '#ef4444', stripe: '#fecaca' },
  { name: 'Blaze_99', color: '#f97316', stripe: '#fed7aa' },
  { name: 'Storm_R', color: '#06b6d4', stripe: '#cffafe' },
  { name: 'Rookie_Z', color: '#84cc16', stripe: '#ecfccb' },
  { name: 'Kenji_GT', color: '#d946ef', stripe: '#f5d0fe' },
  { name: 'Zara_Turbo', color: '#14b8a6', stripe: '#ccfbf1' },
  { name: 'Kabir_V8', color: '#eab308', stripe: '#fef08a' },
  { name: 'Nadia_RS', color: '#6366f1', stripe: '#e0e7ff' },
  { name: 'Tariq_Apex', color: '#f43f5e', stripe: '#ffe4e6' },
  { name: 'Elena_Drift', color: '#38bdf8', stripe: '#e0f2fe' },
  { name: 'Dev_Nitro', color: '#fb923c', stripe: '#ffedd5' },
  { name: 'Yuki_S', color: '#c084fc', stripe: '#f3e8ff' },
];

export const DIFFICULTY_AI_SCALE: Record<'easy' | 'medium' | 'hard', number> = {
  easy: 0.92,
  medium: 1.0,
  hard: 1.06,
};

export function calculateScoreBreakdown(params: {
  position: number;
  finishTimeMs: number;
  parTimeMs: number;
  wallHits: number;
  multiplier: number;
}) {
  const posTable = [1000, 700, 500, 300, 150];
  const positionPoints = posTable[Math.min(4, Math.max(0, params.position - 1))] ?? 150;
  const rawTimeBonus = Math.floor((params.parTimeMs - params.finishTimeMs) / 100);
  const timeBonus = Math.min(500, Math.max(0, rawTimeBonus));
  const cleanBonus = params.wallHits <= 0 ? 200 : params.wallHits <= 2 ? 100 : 0;
  const subtotal = positionPoints + timeBonus + cleanBonus;
  const totalScore = Math.round(subtotal * params.multiplier);

  return {
    positionPoints,
    timeBonus,
    cleanBonus,
    multiplier: params.multiplier,
    subtotal,
    totalScore,
  };
}

export function formatTimeMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || ms <= 0 || !Number.isFinite(ms)) return '--:--.--';
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const hundredths = Math.floor((ms % 1000) / 10);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
}
