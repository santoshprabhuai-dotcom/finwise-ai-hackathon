# My Music Room

A standalone Next.js app inside the FinWise repository. It lives in `music-room/` so the existing finance app and its root files are untouched.

## Features

- Responsive dark listening-room UI
- YouTube embedded player, with the supplied track loaded at 5:39
- Load another YouTube video by URL or video ID
- Supabase email/password sign-up and sign-in
- Private, cloud-synced favorites and playlists
- Row-level security and indexes for each user's library

## Requirements

- Node.js 20.9+ recommended for Next.js 15
- npm
- Supabase project
- GitHub and Vercel access

## Run locally

```bash
cd music-room
npm install
cp .env.example .env.local
```

Fill in `.env.local` with the **Project URL** and **publishable key** from Supabase Dashboard → Project Settings → API Keys (or Connect). The publishable key is intended for browser use when RLS is correctly enabled. Never use a service-role or secret key in a `NEXT_PUBLIC_*` variable.

```bash
npm run dev
```

Open http://localhost:3000.

## Database setup

In Supabase Dashboard → SQL Editor, open and run:

`supabase/migrations/202610030001_music_room.sql`

This creates only `music_favorites`, `music_playlists`, and `music_playlist_tracks`. It does not modify the existing FinWise tables. Row-level security restricts library rows to the authenticated owner. Playlist tracks are additionally checked against the owner's playlist.

Then visit Authentication → URL Configuration and add your local URL (`http://localhost:3000`) plus the deployed Vercel URL to the allowed redirect URLs. Configure email confirmation according to your preferences.

## Deploy on Vercel

1. Import `santoshprabhuai-dotcom/finwise-ai-hackathon` into Vercel, or create a separate Vercel project from that repository.
2. Set **Root Directory** to `music-room`.
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy the `music-room` branch for a preview. After testing, select that branch for production or merge it into `main` only when ready.
5. Add the Vercel production domain to Supabase Auth's allowed redirect URLs.

## Notes

- YouTube playback remains subject to video availability, embedding settings, regional restrictions, and YouTube's terms. The app embeds YouTube's official player; it does not download or rehost audio.
- The initial player seeks to 339 seconds (5:39). YouTube seeks to a nearby keyframe, so the exact start can vary slightly.
- The app's library requires the SQL migration and Supabase environment variables. Without those, the player and visual interface still render, but account features are disabled.
