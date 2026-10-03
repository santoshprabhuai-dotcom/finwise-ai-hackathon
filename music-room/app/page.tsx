"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase, type MusicSong } from "@/lib/supabase";

const STARTER_VIDEO = "lk3hR_2PaCE";
const STARTER_URL = "https://www.youtube.com/watch?v=lk3hR_2PaCE&t=339s";

type Playlist = { id: string; name: string; created_at: string };
type SavedSong = MusicSong & { created_at?: string; playlist_id?: string };

function videoIdFrom(input: string): string | null {
  try {
    const url = new URL(input.trim());
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
    if (url.hostname.endsWith("youtube.com") || url.hostname.endsWith("youtube-nocookie.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?]+)/);
      return match?.[1] ?? null;
    }
  } catch {
    if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
  }
  return null;
}

function videoUrl(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

export default function Home() {
  const supabase = useMemo(() => getSupabase(), []);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authMessage, setAuthMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"discover" | "favorites" | "playlists">("discover");
  const [videoId, setVideoId] = useState(STARTER_VIDEO);
  const [currentTitle, setCurrentTitle] = useState("Your first track");
  const [startAt, setStartAt] = useState(339);
  const [songInput, setSongInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [favorites, setFavorites] = useState<SavedSong[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [tracks, setTracks] = useState<SavedSong[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const refreshLibrary = useCallback(async (userId: string) => {
    if (!supabase) return;
    const [fav, lists, songs] = await Promise.all([
      supabase.from("music_favorites").select("id,title,youtube_video_id,youtube_url,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("music_playlists").select("id,name,created_at").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("music_playlist_tracks").select("id,title,youtube_video_id,youtube_url,created_at,playlist_id").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    if (fav.error || lists.error || songs.error) {
      setNotice("Your account is signed in, but the music tables are not ready yet. Apply the SQL migration in the README.");
      return;
    }
    setFavorites((fav.data ?? []) as SavedSong[]);
    setPlaylists((lists.data ?? []) as Playlist[]);
    setTracks((songs.data ?? []) as SavedSong[]);
    setSelectedPlaylist((current) => current || lists.data?.[0]?.id || "");
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const sessionUser = data.session?.user;
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email } : null);
      setAuthReady(true);
      if (sessionUser) void refreshLibrary(sessionUser.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email } : null);
      if (sessionUser) {
        window.setTimeout(() => void refreshLibrary(sessionUser.id), 0);
      } else {
        setFavorites([]);
        setPlaylists([]);
        setTracks([]);
      }
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase, refreshLibrary]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setAuthMessage("");
    const result = authMode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) {
      setAuthMessage(result.error.message);
    } else if (authMode === "signup" && !result.data.session) {
      setAuthMessage("Check your email to confirm your account, then sign in.");
    } else {
      setAuthMessage("You're in. Your music library is ready.");
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setNotice("Signed out.");
  }

  async function addFavorite() {
    if (!supabase || !user) {
      setNotice("Sign in to save this song to your favorites.");
      return;
    }
    const result = await supabase.from("music_favorites").upsert({
      user_id: user.id,
      title: currentTitle.trim() || "Untitled track",
      youtube_video_id: videoId,
      youtube_url: videoUrl(videoId),
    }, { onConflict: "user_id,youtube_video_id" });
    setNotice(result.error ? result.error.message : "Added to your favorites.");
    if (!result.error) await refreshLibrary(user.id);
  }

  async function removeFavorite(songId: string) {
    if (!supabase || !user) return;
    const result = await supabase.from("music_favorites").delete().eq("id", songId).eq("user_id", user.id);
    setNotice(result.error ? result.error.message : "Removed from favorites.");
    if (!result.error) await refreshLibrary(user.id);
  }

  async function addSong(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = videoIdFrom(songInput);
    if (!id) {
      setNotice("Enter a valid YouTube video URL or 11-character video ID.");
      return;
    }
    setVideoId(id);
    setCurrentTitle(titleInput.trim() || "Your selected track");
    setStartAt(0);
    setSongInput("");
    setTitleInput("");
    setNotice("Track loaded. Press play in the YouTube player to listen.");
  }

  async function createPlaylist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) {
      setNotice("Sign in to create playlists.");
      return;
    }
    const name = playlistName.trim();
    if (!name) return;
    const { data, error } = await supabase.from("music_playlists").insert({ user_id: user.id, name }).select("id,name,created_at").single();
    if (error) {
      setNotice(error.message);
      return;
    }
    setPlaylistName("");
    setSelectedPlaylist(data.id);
    setNotice(`Playlist “${name}” created.`);
    await refreshLibrary(user.id);
  }

  async function addToPlaylist() {
    if (!supabase || !user) {
      setNotice("Sign in to manage playlists.");
      return;
    }
    if (!selectedPlaylist) {
      setNotice("Create a playlist first.");
      return;
    }
    const { error } = await supabase.from("music_playlist_tracks").insert({
      user_id: user.id,
      playlist_id: selectedPlaylist,
      title: currentTitle.trim() || "Untitled track",
      youtube_video_id: videoId,
      youtube_url: videoUrl(videoId),
    });
    setNotice(error ? error.message : "Track added to playlist.");
    if (!error) await refreshLibrary(user.id);
  }

  async function deletePlaylist(id: string) {
    if (!supabase || !user) return;
    const { error } = await supabase.from("music_playlists").delete().eq("id", id).eq("user_id", user.id);
    setNotice(error ? error.message : "Playlist deleted.");
    if (!error) {
      setSelectedPlaylist("");
      await refreshLibrary(user.id);
    }
  }

  function playSong(song: SavedSong) {
    setVideoId(song.youtube_video_id);
    setCurrentTitle(song.title);
    setStartAt(0);
    setActiveTab("discover");
    setNotice(`Loaded “${song.title}”. Press play to listen.`);
  }

  const activePlaylistTracks = tracks.filter((track) => track.playlist_id === selectedPlaylist);
  const playerUrl = `https://www.youtube-nocookie.com/embed/${videoId}?start=${startAt}&rel=0&playsinline=1`;
  const configured = Boolean(supabase);

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#" aria-label="My Music Room home">
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <span>music<span className="brand-light">room</span></span>
        </a>
        <nav className="top-nav" aria-label="Main navigation">
          <button className={activeTab === "discover" ? "nav-link active" : "nav-link"} onClick={() => setActiveTab("discover")}>Discover</button>
          <button className={activeTab === "favorites" ? "nav-link active" : "nav-link"} onClick={() => setActiveTab("favorites")}>Favorites</button>
          <button className={activeTab === "playlists" ? "nav-link active" : "nav-link"} onClick={() => setActiveTab("playlists")}>Playlists</button>
        </nav>
        <div className="account-area">
          {user ? <><span className="user-pill"><span className="online-dot" />{user.email}</span><button className="button button-quiet button-small" onClick={signOut}>Sign out</button></> : <a className="button button-outline button-small" href="#account">Sign in</a>}
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> YOUR SPACE. YOUR SOUND.</div>
          <h1>Find your<br /><span>own rhythm.</span></h1>
          <p>A little space for the songs that make a moment yours. Press play, settle in, and stay awhile.</p>
          <button className="button button-primary" onClick={() => { setActiveTab("discover"); document.getElementById("player")?.scrollIntoView({ behavior: "smooth" }); }}>
            <span className="button-play">▶</span> Return to your music <span aria-hidden="true">↗</span>
          </button>
          <div className="hero-note"><span className="pulse-dot" /> A quieter corner of the internet</div>
        </div>
        <div className="hero-art" aria-label="Abstract album artwork">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="art-sun" /><div className="art-horizon" />
          <div className="art-grain" />
          <div className="art-label"><span>VOL. 001</span><span>THE INNER ROOM</span></div>
          <div className="art-caption">let the<br /><i>sound</i> stay.</div>
          <div className="art-equalizer">{[20,34,15,43,25,52,31,17,39,24,46,18,33,14,42,22,36,16,28].map((height, i) => <span key={i} style={{ height: `${height}px` }} />)}</div>
        </div>
      </section>

      {notice && <div className="notice" role="status"><span>✳</span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}

      <section className="workspace" id="player">
        <div className="section-heading">
          <div><div className="eyebrow">THE LISTENING ROOM</div><h2>{activeTab === "favorites" ? "Your favorites" : activeTab === "playlists" ? "Made by you" : "Now playing"}</h2></div>
          <span className="section-index">01 / 03</span>
        </div>
        {activeTab === "discover" && <div className="player-layout">
          <div className="player-card">
            <div className="player-topline"><span className="live-indicator" /> READY WHEN YOU ARE <span className="player-duration">YOUTUBE PLAYER</span></div>
            <div className="video-frame"><iframe key={videoId} src={playerUrl} title={currentTitle} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
            <div className="track-meta">
              <div className="track-art"><span>♫</span><i /></div>
              <div className="track-copy"><span className="track-label">CURRENT SELECTION</span><h3>{currentTitle}</h3><p>Streaming via YouTube</p></div>
              <button className="icon-button favorite-action" onClick={addFavorite} aria-label="Save current song to favorites" title="Save to favorites">♡</button>
            </div>
            <div className="player-actions"><button className="button button-primary" onClick={() => window.open(videoUrl(videoId) + (startAt ? `&t=${startAt}s` : ""), "_blank", "noopener,noreferrer")}>↗ Open on YouTube</button><button className="button button-outline" onClick={addToPlaylist}>＋ Add to playlist</button></div>
            <p className="player-footnote">Playback controls are provided by YouTube. Some videos may restrict embedded playback.</p>
          </div>
          <aside className="side-panel">
            <div className="side-heading"><div><span className="eyebrow">YOUR COLLECTION</span><h3>Keep close</h3></div><span className="side-spark">✳</span></div>
            <div className="collection-row"><div className="collection-icon violet">♡</div><div className="collection-copy"><strong>Favorites</strong><span>{favorites.length} saved {favorites.length === 1 ? "track" : "tracks"}</span></div><button onClick={() => setActiveTab("favorites")} aria-label="View favorites">↗</button></div>
            <div className="collection-row"><div className="collection-icon peach">♫</div><div className="collection-copy"><strong>Playlists</strong><span>{playlists.length} personal mixes</span></div><button onClick={() => setActiveTab("playlists")} aria-label="View playlists">↗</button></div>
            <div className="side-divider" />
            <form className="add-track-form" onSubmit={addSong}>
              <span className="eyebrow">ADD A TRACK</span><h4>Bring your own sound.</h4><p>Paste a YouTube link and make it part of your room.</p>
              <label htmlFor="track-url">YouTube link</label><input id="track-url" value={songInput} onChange={(e) => setSongInput(e.target.value)} placeholder="https://youtube.com/watch?v=…" />
              <label htmlFor="track-title">Track name <span>(optional)</span></label><input id="track-title" value={titleInput} onChange={(e) => setTitleInput(e.target.value)} placeholder="Give it a name" />
              <button className="button button-primary button-full" type="submit">Load track <span>↗</span></button>
            </form>
          </aside>
        </div>}

        {activeTab === "favorites" && <div className="library-panel">
          {!user ? <EmptyState title="Your favorites live here." body="Sign in below to save songs and bring your collection to any device." /> : favorites.length === 0 ? <EmptyState title="A space for the songs you love." body="Play a track and tap the heart to save it here." /> : <div className="song-list">{favorites.map((song, index) => <SongRow key={song.id} song={song} index={index} onPlay={playSong} onRemove={removeFavorite} />)}</div>}
          <button className="button button-outline" onClick={() => setActiveTab("discover")}>← Back to player</button>
        </div>}

        {activeTab === "playlists" && <div className="library-panel playlist-library">
          {!user ? <EmptyState title="Your own mixes, your own mood." body="Sign in to create playlists and save tracks to them." /> : <>
            <form className="create-playlist-form" onSubmit={createPlaylist}><div><span className="eyebrow">START A COLLECTION</span><h3>Give a mood a name.</h3></div><input aria-label="New playlist name" value={playlistName} onChange={(e) => setPlaylistName(e.target.value)} placeholder="e.g. Late night listening" maxLength={80} /><button className="button button-primary" type="submit">＋ Create playlist</button></form>
            {playlists.length === 0 ? <EmptyState title="Your first playlist starts here." body="Create a playlist, then load a track and add it from the player." /> : <div className="playlist-browser"><div className="playlist-list">{playlists.map((list) => <button key={list.id} className={selectedPlaylist === list.id ? "playlist-choice selected" : "playlist-choice"} onClick={() => setSelectedPlaylist(list.id)}><span className="playlist-thumb">♫</span><span className="playlist-choice-copy"><strong>{list.name}</strong><small>{tracks.filter((t) => t.playlist_id === list.id).length} tracks</small></span><span>↗</span></button>)}</div><div className="playlist-detail"><div className="playlist-cover"><span>♫</span><small>YOUR MIX</small></div><div className="playlist-detail-heading"><div><span className="eyebrow">SELECTED PLAYLIST</span><h3>{playlists.find((p) => p.id === selectedPlaylist)?.name ?? "Choose a playlist"}</h3></div>{selectedPlaylist && <button className="text-danger" onClick={() => deletePlaylist(selectedPlaylist)}>Delete</button>}</div>{activePlaylistTracks.length ? <div className="song-list compact">{activePlaylistTracks.map((song, index) => <SongRow key={song.id} song={song} index={index} onPlay={playSong} />)}</div> : <p className="muted-copy">No tracks yet. Load a song in the player and choose “Add to playlist”.</p>}<button className="button button-outline" onClick={() => setActiveTab("discover")}>＋ Find a track</button></div></div>}
          </>}
        </div>}
      </section>

      <section className="account-section" id="account">
        <div className="account-intro"><div className="eyebrow">YOUR ROOM, REMEMBERED</div><h2>Your music should<br /><span>feel like yours.</span></h2><p>Sign in to keep your favorites and playlists safe in your own private library.</p><div className="privacy-note"><span>✳</span><span><strong>Your library stays yours.</strong><br />Your saved music is private to your account.</span></div></div>
        <div className="auth-card">
          {!configured ? <><div className="auth-icon">♫</div><h3>One small setup step</h3><p>Connect a Supabase project to enable accounts, favorites, and cloud playlists. See the setup guide in the README.</p><a className="button button-primary button-full" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Open Supabase ↗</a></> : user ? <><div className="auth-icon">✳</div><h3>Welcome to your room.</h3><p className="auth-subtitle">Signed in as {user.email}</p><div className="account-stats"><div><strong>{favorites.length}</strong><span>Favorites</span></div><div><strong>{playlists.length}</strong><span>Playlists</span></div></div><button className="button button-outline button-full" onClick={signOut}>Sign out</button></> : <><div className="auth-icon">♫</div><h3>{authMode === "signin" ? "Come on in." : "Make it yours."}</h3><p className="auth-subtitle">{authMode === "signin" ? "Pick up right where your music left you." : "Create an account for your personal library."}</p><form className="auth-form" onSubmit={handleAuth}><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /><label htmlFor="password">Password</label><input id="password" type="password" autoComplete={authMode === "signin" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /><button className="button button-primary button-full" type="submit" disabled={busy}>{busy ? "One moment…" : authMode === "signin" ? "Sign in →" : "Create account →"}</button></form>{authMessage && <p className="auth-message" role="status">{authMessage}</p>}<p className="auth-switch">{authMode === "signin" ? "New to the room?" : "Already have an account?"} <button onClick={() => { setAuthMode(authMode === "signin" ? "signup" : "signin"); setAuthMessage(""); }}>{authMode === "signin" ? "Create account" : "Sign in"}</button></p></>}
        </div>
      </section>

      <footer className="footer"><a className="brand footer-brand" href="#"><span className="brand-mark"><span /><span /><span /><span /></span><span>music<span className="brand-light">room</span></span></a><span>A little more room for what moves you.</span><span>Built for listening. Powered by YouTube.</span></footer>
      {!authReady && <div className="loading-strip">Opening your music room…</div>}
    </main>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="empty-state"><div className="empty-symbol">♫</div><h3>{title}</h3><p>{body}</p></div>;
}

function SongRow({ song, index, onPlay, onRemove }: { song: SavedSong; index: number; onPlay: (song: SavedSong) => void; onRemove?: (id: string) => void }) {
  return <div className="song-row"><span className="song-number">{String(index + 1).padStart(2, "0")}</span><button className="song-play-art" onClick={() => onPlay(song)} aria-label={`Play ${song.title}`}>▶</button><button className="song-row-title" onClick={() => onPlay(song)}><strong>{song.title}</strong><span>YouTube track</span></button><a className="song-open" href={song.youtube_url} target="_blank" rel="noreferrer" aria-label="Open track on YouTube">↗</a>{onRemove && <button className="song-remove" onClick={() => onRemove(song.id)} aria-label={`Remove ${song.title} from favorites`}>×</button>}</div>;
}
