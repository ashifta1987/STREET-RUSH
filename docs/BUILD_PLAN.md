# Street Rush — Racing Game Build Plan

**Oct 31, 2026 · @ASHIF**

## Overview
Street Rush is a single-player browser racing game: one human driver races four computer drivers, and every finished race is scored and saved to a global ranking. It is built in React, stores players and scores in Supabase, deploys on Vercel, and is coded with the Google Antigravity agent IDE.

### v1 goals
- A player picks a name and password once, then logs back in any time to race again.
- Before each race the player selects a city, a track and a car.
- Each race has exactly 5 racers: the player plus 4 AI drivers.
- Every race result is saved on the server with a score that the server calculates, not the browser.
- A global leaderboard ranks all players, with filters by track and city.
- Out of scope for v1: live multiplayer, in-game purchases, mobile app store builds. The game will still run in a phone browser with touch controls.

## Tech stack and Antigravity workflow
The game runs entirely in the browser; Supabase handles login, data and score calculation; Vercel hosts the built site. A top-down 2D racer on HTML5 Canvas is the recommended v1: it is far easier for an AI agent to build reliably than a 3D game, and it runs smoothly on low-end phones.

| Layer | Choice | Why |
| --- | --- | --- |
| Front end | React 18 + Vite + TypeScript | Fast dev server, simple Vercel build |
| Game rendering | HTML5 Canvas 2D inside a React component, `requestAnimationFrame` loop | Smooth 60 fps, no heavy engine |
| UI styling | Tailwind CSS | Quick, consistent menus and HUD |
| Routing | React Router | Separate screens: login, setup, race, results, leaderboard |
| State | Zustand | Small store for player, selections, race result |
| Sound | Howler.js | Engine, countdown, finish sounds |
| Backend | Supabase (Postgres, Auth, Row Level Security, RPC functions) | Login with password, stored scores, server-side scoring |
| Hosting | Vercel | Auto-deploy from GitHub on every push |
| Code editor | Google Antigravity | Agent writes, runs and browser-tests the code |

## Functionalities
Every feature below is in v1 unless marked "Nice to have".

| # | Feature | What the player sees | Saved on server |
| --- | --- | --- | --- |
| F1 | Create player | Enter a unique driver name + password (min 6 characters) + confirm password | Yes: account and profile |
| F2 | Log in / rejoin | Enter driver name + password to continue with all past scores | Session only |
| F3 | Stay logged in | Returning to the site on the same device skips login | No (browser session) |
| F4 | Log out | Button on the main menu | No |
| F5 | Select city | Choose 1 of 5 cities; changes scenery, colours and music | Yes, with each race |
| F6 | Select track | Choose 1 of 4 tracks; shows length, laps, difficulty, your best time | Yes, with each race |
| F7 | Select car | Choose 1 of 5 cars; shows speed, acceleration, handling bars | Yes, with each race |
| F8 | Race | 3-2-1-GO countdown, 3 laps, 5 cars on track, live position and lap timer | No (in browser) |
| F9 | Pause / quit | Esc or pause button; quitting gives no score | No |
| F10 | Results screen | Final positions of all 5 racers, your time, best lap, score breakdown | Yes: race record + score |
| F11 | Player profile | Total score, races, wins, podiums, best time per track, last 10 races | Read from server |
| F12 | Global leaderboard | Top 100 players by total score; your own rank always shown | Read from server |
| F13 | Leaderboard filters | All tracks / one track; all cities / one city; all time / this week | Read from server |
| F14 | Touch controls | On-screen left, right, gas and brake buttons on phones | No |
| F15 | Sound on/off | Toggle on menu and pause screen | Browser only |
| F16 | Change password | In profile, enter old + new password | Yes |
| F17 | Ghost of best lap | Nice to have: faint replay of your best lap | Nice to have |

## Race design: 5 racers
Each race is 3 laps with 5 cars on a 2-wide starting grid: the player starts 5th so there is always someone to overtake. Race ends when the player finishes 3 laps; AI cars still running get a projected finish time from their current progress.

### Player controls
- **Keyboard**: Up / W = accelerate, Down / S = brake and reverse, Left / A and Right / D = steer, Space = handbrake, Esc = pause.
- **Phone**: four on-screen buttons, multi-touch so steering and gas work together.

### Car physics (arcade, not realistic)
- Each car has `maxSpeed`, `acceleration`, `handling` (turn rate) and `grip`.
- Off-road (grass, sand) multiplies max speed by 0.5.
- Car-to-car bumps push both cars apart and cut speed by 20%.
- Wall hits stop the car's forward speed and count as a "crash" for the clean-driving bonus.
- Run physics on a fixed 1/60 s timestep so results are the same on fast and slow devices.

### The 4 AI drivers
AI cars follow a list of waypoints placed along the racing line of each track. Each frame they steer toward the next waypoint and slow down before sharp corners.

| AI driver | Personality | Speed vs player car | Mistakes |
| --- | --- | --- | --- |
| Viper | Aggressive, takes inside lines | 100% | Rare |
| Blaze | Fast on straights, brakes late | 96% | Sometimes runs wide |
| Storm | Smooth and consistent | 93% | Very rare |
| Rookie | Cautious, brakes early | 88% | Often runs wide |

- **Rubber-band**: AI more than 300 m ahead slow by 5%; AI far behind speed up by 5%. Keeps races close without feeling unfair.
- **Difficulty**: track difficulty (Easy / Medium / Hard) scales all AI speeds by 0.92 / 1.0 / 1.06.
- **Random names**: AI driver names and car colours are picked at random each race from a pool of 12, so races feel different.

### Position and lap logic
- Each track has a centre line split into checkpoints. A lap only counts when all checkpoints are passed in order (stops shortcut cheating).
- Race position = laps completed, then checkpoint index, then distance to next checkpoint.
- HUD shows: position (e.g. 2/5), lap (2/3), current lap time, best lap, speed, and a minimap with 5 dots.

## Content: cities, tracks, cars
Any city can be combined with any track: 5 cities × 4 tracks = 20 race settings. The city is a visual theme (scenery, colours, music); the track sets the layout and difficulty. All content lives in one config file `src/game/content.ts` and is mirrored in Supabase tables so the server can validate and score races.

### Cities
| City | Theme | Look |
| --- | --- | --- |
| Kochi | Backwaters | Coconut palms, canals, monsoon-green |
| Mumbai | Marine Drive | Sea wall, city lights, evening orange |
| Dubai | Desert Boulevard | Sand edges, glass towers, gold tones |
| Tokyo | Neon Night | Dark roads, neon signs, purple and pink |
| New York | Downtown Grid | Yellow cabs, steel bridges, grey and red |

### Tracks
| Track | Difficulty | Laps | Lap length | Score multiplier | Shape |
| --- | --- | --- | --- | --- | --- |
| Harbour Loop | Easy | 3 | 1.2 km | 1.0× | Wide oval, two gentle chicanes |
| Night Highway | Medium | 3 | 1.6 km | 1.2× | Long straights, fast sweepers |
| Old Town Sprint | Medium | 3 | 1.4 km | 1.3× | Tight 90° street corners |
| Hillside Hairpins | Hard | 3 | 1.8 km | 1.5× | Hairpins, narrow sections |

Each track is stored as: a centre-line spline (array of x, y points), road width, checkpoint list, AI waypoint list, 5 grid start positions and a par time used for scoring.

### Cars (stats out of 10)
| Car | Speed | Acceleration | Handling | Best for |
| --- | --- | --- | --- | --- |
| Bolt GT | 9 | 6 | 5 | Highways |
| Falcon RS | 7 | 8 | 7 | All-rounder |
| Drift King | 6 | 7 | 10 | Hairpins |
| Thunder V8 | 10 | 5 | 5 | Experts only |
| City Hopper | 5 | 10 | 8 | Beginners, street corners |

Every car's stats add up to between 20 and 23 points, so no car is simply best. AI drivers get random cars from the same list.

## Player accounts: name + password
Players log in with only a driver name and a password, but behind the scenes Supabase Auth does the work, so passwords are hashed securely and never stored as plain text. The game turns the driver name into a hidden email address that the player never sees.

### How it works
- Player types driver name `Arjun_K` and a password.
- The app lower-cases the name and builds a hidden login email: `arjun_k@players.streetrush.app` (the domain does not need to exist).
- **New player**: app calls `supabase.auth.signUp({ email, password, options: { data: { username: 'Arjun_K' } } })`. A database trigger creates the matching row in `profiles`.
- **Returning player (rejoin)**: app calls `supabase.auth.signInWithPassword({ email, password })`. All their past races and total score are already linked to their account.
- Supabase keeps the session in the browser, so the player stays logged in until they log out.

### Rules
- Driver name: 3–16 characters, letters, numbers and underscore only, unique (case-insensitive). Checked before sign-up with a quick `profiles` lookup and enforced by a unique index.
- Password: minimum 6 characters (Supabase default), shown with a show/hide eye icon.
- Wrong password message: `"Name or password is wrong"` (never say which one).

## Scoring and global rank list
Every finished race earns a score from finishing position, speed against the track's par time and clean driving, multiplied by track difficulty. The server calculates it, so a player cannot send a fake score from the browser.

$$\text{score} = \operatorname{round}\big( (P_{\text{position}} + B_{\text{time}} + B_{\text{clean}}) \times M_{\text{track}} \big)$$

| Part | Rule |
| --- | --- |
| Position points | 1st = 1000, 2nd = 700, 3rd = 500, 4th = 300, 5th = 150 |
| Time bonus | 10 points per second faster than par time, max 500, never negative |
| Clean bonus | 0 wall hits = 200, 1–2 hits = 100, 3 or more = 0 |
| Track multiplier | Easy 1.0, Medium 1.2 or 1.3, Hard 1.5 (see Tracks table) |

## Supabase database SQL
```sql
-- 1. CONTENT TABLES
create table public.cities (
  id text primary key,
  name text not null
);
create table public.tracks (
  id text primary key,
  name text not null,
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  laps int not null default 3,
  par_time_ms int not null,
  multiplier numeric(3,2) not null
);
create table public.cars (
  id text primary key,
  name text not null,
  speed int not null,
  accel int not null,
  handling int not null
);

insert into public.cities (id, name) values
  ('kochi','Kochi'), ('mumbai','Mumbai'), ('dubai','Dubai'),
  ('tokyo','Tokyo'), ('newyork','New York');

insert into public.tracks (id, name, difficulty, laps, par_time_ms, multiplier) values
  ('harbour-loop','Harbour Loop','easy',3,120000,1.00),
  ('night-highway','Night Highway','medium',3,140000,1.20),
  ('old-town-sprint','Old Town Sprint','medium',3,150000,1.30),
  ('hillside-hairpins','Hillside Hairpins','hard',3,180000,1.50);

insert into public.cars (id, name, speed, accel, handling) values
  ('bolt-gt','Bolt GT',9,6,5),
  ('falcon-rs','Falcon RS',7,8,7),
  ('drift-king','Drift King',6,7,10),
  ('thunder-v8','Thunder V8',10,5,5),
  ('city-hopper','City Hopper',5,10,8);

-- 2. PLAYERS
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,16}$'),
  created_at timestamptz not null default now()
);
create unique index profiles_username_lower on public.profiles (lower(username));

-- create a profile automatically when a player signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. RACES
create table public.races (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.profiles(id) on delete cascade,
  track_id text not null references public.tracks(id),
  car_id text not null references public.cars(id),
  city_id text not null references public.cities(id),
  position smallint not null check (position between 1 and 5),
  finish_time_ms int not null,
  best_lap_ms int not null,
  wall_hits int not null default 0,
  score int not null,
  created_at timestamptz not null default now()
);
create index races_player_idx on public.races (player_id, created_at desc);
create index races_track_idx on public.races (track_id, score desc);

-- 4. SECURITY: everyone can read, nobody can write directly
alter table public.cities   enable row level security;
alter table public.tracks   enable row level security;
alter table public.cars     enable row level security;
alter table public.profiles enable row level security;
alter table public.races    enable row level security;

create policy "read cities"   on public.cities   for select using (true);
create policy "read tracks"   on public.tracks   for select using (true);
create policy "read cars"     on public.cars     for select using (true);
create policy "read profiles" on public.profiles for select using (true);
create policy "read races"    on public.races    for select using (true);

-- 5. SAVE A RACE (server calculates the score)
create or replace function public.submit_race(
  p_track_id text, p_car_id text, p_city_id text,
  p_position int, p_finish_time_ms int, p_best_lap_ms int, p_wall_hits int
) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_track public.tracks%rowtype;
  v_pos_points int;
  v_time_bonus int;
  v_clean int;
  v_score int;
begin
  if v_uid is null then raise exception 'Not logged in'; end if;
  select * into v_track from public.tracks where id = p_track_id;
  if not found then raise exception 'Unknown track'; end if;
  if not exists (select 1 from public.cars where id = p_car_id) then raise exception 'Unknown car'; end if;
  if not exists (select 1 from public.cities where id = p_city_id) then raise exception 'Unknown city'; end if;
  if p_position not between 1 and 5 then raise exception 'Bad position'; end if;
  if p_finish_time_ms < v_track.par_time_ms * 0.7 then raise exception 'Time not possible'; end if;
  if p_best_lap_ms <= 0 or p_best_lap_ms * v_track.laps > p_finish_time_ms + 1000 then
    raise exception 'Lap time not possible';
  end if;
  if exists (select 1 from public.races
             where player_id = v_uid and created_at > now() - interval '30 seconds') then
    raise exception 'Too many races, wait a moment';
  end if;

  v_pos_points := (array[1000,700,500,300,150])[p_position];
  v_time_bonus := least(500, greatest(0, (v_track.par_time_ms - p_finish_time_ms) / 100));
  v_clean := case when p_wall_hits <= 0 then 200 when p_wall_hits <= 2 then 100 else 0 end;
  v_score := round((v_pos_points + v_time_bonus + v_clean) * v_track.multiplier);

  insert into public.races (player_id, track_id, car_id, city_id, position,
                            finish_time_ms, best_lap_ms, wall_hits, score)
  values (v_uid, p_track_id, p_car_id, p_city_id, p_position,
          p_finish_time_ms, p_best_lap_ms, greatest(p_wall_hits, 0), v_score);
  return v_score;
end;
$$;

revoke execute on function public.submit_race from public, anon;
grant execute on function public.submit_race to authenticated;

-- 6. GLOBAL LEADERBOARD (all filters optional)
create or replace function public.get_leaderboard(
  p_track_id text default null,
  p_city_id text default null,
  p_since timestamptz default null,
  p_limit int default 100
) returns table (
  rank bigint, player_id uuid, username text, total_score bigint,
  races bigint, wins bigint, podiums bigint, best_score int, best_lap_ms int
)
language sql stable as $$
  with filtered as (
    select * from public.races r
    where (p_track_id is null or r.track_id = p_track_id)
      and (p_city_id  is null or r.city_id  = p_city_id)
      and (p_since    is null or r.created_at >= p_since)
  ), agg as (
    select f.player_id,
           sum(f.score) as total_score,
           count(*) as races,
           count(*) filter (where f.position = 1) as wins,
           count(*) filter (where f.position <= 3) as podiums,
           max(f.score) as best_score,
           min(f.best_lap_ms) as best_lap_ms
    from filtered f
    group by f.player_id
  )
  select rank() over (
           order by case when p_track_id is null then a.total_score else a.best_score end desc,
                    a.wins desc, a.best_score desc),
         a.player_id, p.username, a.total_score, a.races, a.wins,
         a.podiums, a.best_score, a.best_lap_ms
  from agg a join public.profiles p on p.id = a.player_id
  order by 1
  limit p_limit;
$$;
```

## App screens
| Route | Screen | Main job |
| --- | --- | --- |
| `/login` | Login / Sign up | Two tabs: New driver, Returning driver |
| `/` | Main menu | Shows driver name, total score, global rank; buttons Race, Leaderboard, Profile, Log out |
| `/setup` | Race setup | 3 steps with Back / Next: city cards, track cards, car cards with stat bars |
| `/race` | Race | Canvas game, HUD, pause menu |
| `/results` | Results | Final order of 5 racers, score breakdown, Race again / Change setup / Leaderboard |
| `/leaderboard` | Leaderboard | Filters, top 100 table, your rank row |
| `/profile` | Profile | Stats, best time per track, last 10 races, change password |
