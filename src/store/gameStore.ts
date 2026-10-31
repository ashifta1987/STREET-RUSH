import { create } from 'zustand';
import { CarConfig, CityConfig, TrackMetadata } from '../game/content';
import { FinalRacerStanding } from '../game/race';
import { soundManager } from '../game/sound';

export interface PlayerProfile {
  id: string;
  username: string;
}

export interface RaceResultData {
  trackId: TrackMetadata['id'];
  carId: CarConfig['id'];
  cityId: CityConfig['id'];
  standings: FinalRacerStanding[];
  playerPosition: number;
  finishTimeMs: number;
  bestLapMs: number;
  wallHits: number;
  serverScore: number | null;
  saveError: string | null;
}

interface GameState {
  player: PlayerProfile | null;
  authInitialized: boolean;
  selectedCityId: CityConfig['id'];
  selectedTrackId: TrackMetadata['id'];
  selectedCarId: CarConfig['id'];
  setupStep: 1 | 2 | 3;
  lastResult: RaceResultData | null;
  soundEnabled: boolean;

  setPlayer: (player: PlayerProfile | null) => void;
  setAuthInitialized: (init: boolean) => void;
  setSelectedCityId: (cityId: CityConfig['id']) => void;
  setSelectedTrackId: (trackId: TrackMetadata['id']) => void;
  setSelectedCarId: (carId: CarConfig['id']) => void;
  setSetupStep: (step: 1 | 2 | 3) => void;
  setLastResult: (result: RaceResultData | null) => void;
  toggleSound: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  player: null,
  authInitialized: false,
  selectedCityId: 'tokyo',
  selectedTrackId: 'harbour-loop',
  selectedCarId: 'falcon-rs',
  setupStep: 1,
  lastResult: null,
  soundEnabled: soundManager.isEnabled(),

  setPlayer: (player) => set({ player }),
  setAuthInitialized: (authInitialized) => set({ authInitialized }),
  setSelectedCityId: (selectedCityId) => set({ selectedCityId }),
  setSelectedTrackId: (selectedTrackId) => set({ selectedTrackId }),
  setSelectedCarId: (selectedCarId) => set({ selectedCarId }),
  setSetupStep: (setupStep) => set({ setupStep }),
  setLastResult: (lastResult) => set({ lastResult }),
  toggleSound: () => {
    const next = soundManager.toggle();
    set({ soundEnabled: next });
  },
}));
