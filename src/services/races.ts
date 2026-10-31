import { supabase } from '../lib/supabase';

export interface LeaderboardRow {
  rank: number;
  player_id: string;
  username: string;
  total_score: number;
  races: number;
  wins: number;
  podiums: number;
  best_score: number;
  best_lap_ms: number;
}

export interface RaceHistoryRow {
  id: number;
  player_id: string;
  track_id: string;
  car_id: string;
  city_id: string;
  position: number;
  finish_time_ms: number;
  best_lap_ms: number;
  wall_hits: number;
  score: number;
  created_at: string;
}

export interface ProfileStats {
  totalScore: number;
  globalRank: number | null;
  racesCount: number;
  winsCount: number;
  podiumsCount: number;
  bestTimeByTrack: Record<string, number | null>;
  recentRaces: RaceHistoryRow[];
}

export function getStartOfWeekIST(): Date {
  // Compute Monday 00:00:00 in Asia/Kolkata (UTC+05:30)
  const now = new Date();
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffsetMs);

  const dayOfWeek = istTime.getUTCDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  istTime.setUTCDate(istTime.getUTCDate() - daysSinceMonday);
  istTime.setUTCHours(0, 0, 0, 0);

  return new Date(istTime.getTime() - istOffsetMs);
}

export async function submitRaceResult(params: {
  trackId: string;
  carId: string;
  cityId: string;
  position: number;
  finishTimeMs: number;
  bestLapMs: number;
  wallHits: number;
}): Promise<number> {
  const { data, error } = await supabase.rpc('submit_race', {
    p_track_id: params.trackId,
    p_car_id: params.carId,
    p_city_id: params.cityId,
    p_position: params.position,
    p_finish_time_ms: Math.round(params.finishTimeMs),
    p_best_lap_ms: Math.round(params.bestLapMs),
    p_wall_hits: Math.max(0, Math.round(params.wallHits)),
  });

  if (error) {
    throw new Error(error.message || 'Could not save race result');
  }

  return Number(data);
}

export async function fetchLeaderboard(filters: {
  trackId?: string | null;
  cityId?: string | null;
  period?: 'all' | 'week';
  currentUserId?: string | null;
}): Promise<{
  topRows: LeaderboardRow[];
  myRow: LeaderboardRow | null;
}> {
  const sinceIso =
    filters.period === 'week' ? getStartOfWeekIST().toISOString() : null;

  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_track_id: filters.trackId || null,
    p_city_id: filters.cityId || null,
    p_since: sinceIso,
    p_limit: 100,
  });

  if (error) {
    throw new Error(error.message || 'Failed to load leaderboard');
  }

  const normalize = (row: any): LeaderboardRow => ({
    rank: Number(row.rank),
    player_id: row.player_id,
    username: row.username,
    total_score: Number(row.total_score),
    races: Number(row.races),
    wins: Number(row.wins),
    podiums: Number(row.podiums),
    best_score: Number(row.best_score),
    best_lap_ms: Number(row.best_lap_ms),
  });

  const topRows: LeaderboardRow[] = (data || []).map(normalize);
  let myRow: LeaderboardRow | null = null;

  if (filters.currentUserId) {
    myRow = topRows.find((r) => r.player_id === filters.currentUserId) || null;
    if (!myRow) {
      const { data: allData } = await supabase.rpc('get_leaderboard', {
        p_track_id: filters.trackId || null,
        p_city_id: filters.cityId || null,
        p_since: sinceIso,
        p_limit: 100000,
      });
      const found = (allData || []).find(
        (r: any) => r.player_id === filters.currentUserId
      );
      if (found) {
        myRow = normalize(found);
      }
    }
  }

  return { topRows, myRow };
}

export async function fetchProfileStats(playerId: string): Promise<ProfileStats> {
  const [{ data: allRaces, error: racesErr }, { myRow }] = await Promise.all([
    supabase
      .from('races')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false }),
    fetchLeaderboard({ currentUserId: playerId }),
  ]);

  if (racesErr) {
    throw new Error(racesErr.message || 'Failed to load profile races');
  }

  const racesList = (allRaces || []) as RaceHistoryRow[];
  const bestTimeByTrack: Record<string, number | null> = {
    'harbour-loop': null,
    'night-highway': null,
    'old-town-sprint': null,
    'hillside-hairpins': null,
  };

  let totalScore = 0;
  let winsCount = 0;
  let podiumsCount = 0;

  for (const r of racesList) {
    totalScore += Number(r.score);
    if (r.position === 1) winsCount += 1;
    if (r.position <= 3) podiumsCount += 1;

    const currentBest = bestTimeByTrack[r.track_id];
    if (currentBest === null || currentBest === undefined || r.finish_time_ms < currentBest) {
      bestTimeByTrack[r.track_id] = r.finish_time_ms;
    }
  }

  return {
    totalScore: myRow ? myRow.total_score : totalScore,
    globalRank: myRow ? myRow.rank : null,
    racesCount: racesList.length,
    winsCount,
    podiumsCount,
    bestTimeByTrack,
    recentRaces: racesList.slice(0, 10),
  };
}
