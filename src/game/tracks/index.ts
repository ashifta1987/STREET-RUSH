import { harbourLoopTrack } from './harbourLoop';
import { nightHighwayTrack } from './nightHighway';
import { oldTownSprintTrack } from './oldTownSprint';
import { hillsideHairpinsTrack } from './hillsideHairpins';
import { TrackData } from './types';

export const TRACKS_BY_ID: Record<TrackData['id'], TrackData> = {
  'harbour-loop': harbourLoopTrack,
  'night-highway': nightHighwayTrack,
  'old-town-sprint': oldTownSprintTrack,
  'hillside-hairpins': hillsideHairpinsTrack,
};

export const ALL_TRACKS: TrackData[] = [
  harbourLoopTrack,
  nightHighwayTrack,
  oldTownSprintTrack,
  hillsideHairpinsTrack,
];

export * from './types';
