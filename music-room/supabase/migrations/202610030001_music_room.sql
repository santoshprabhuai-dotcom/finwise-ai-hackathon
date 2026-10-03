-- My Music Room schema. Names are intentionally prefixed to avoid touching FinWise tables.
create table if not exists public.music_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  youtube_video_id text not null check (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  youtube_url text not null,
  created_at timestamptz not null default now(),
  constraint music_favorites_user_video_unique unique (user_id, youtube_video_id)
);

create table if not exists public.music_playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table if not exists public.music_playlist_tracks (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.music_playlists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  youtube_video_id text not null check (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  youtube_url text not null,
  created_at timestamptz not null default now(),
  constraint music_playlist_tracks_playlist_video_unique unique (playlist_id, youtube_video_id)
);

create index if not exists music_favorites_user_created_idx
  on public.music_favorites (user_id, created_at desc);
create index if not exists music_playlists_user_created_idx
  on public.music_playlists (user_id, created_at desc);
create index if not exists music_playlist_tracks_user_playlist_idx
  on public.music_playlist_tracks (user_id, playlist_id, created_at desc);

alter table public.music_favorites enable row level security;
alter table public.music_playlists enable row level security;
alter table public.music_playlist_tracks enable row level security;

drop policy if exists "Users manage their own music favorites" on public.music_favorites;
create policy "Users manage their own music favorites"
  on public.music_favorites for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own music playlists" on public.music_playlists;
create policy "Users manage their own music playlists"
  on public.music_playlists for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own playlist tracks" on public.music_playlist_tracks;
create policy "Users manage their own playlist tracks"
  on public.music_playlist_tracks for all to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.music_playlists p
      where p.id = playlist_id and p.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.music_playlists p
      where p.id = playlist_id and p.user_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.music_favorites to authenticated;
grant select, insert, update, delete on public.music_playlists to authenticated;
grant select, insert, update, delete on public.music_playlist_tracks to authenticated;
