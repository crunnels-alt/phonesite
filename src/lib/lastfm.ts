import { kv } from '@vercel/kv';

const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';
const API_KEY = process.env.LASTFM_API_KEY;
const USERNAME = process.env.LASTFM_USERNAME;

// Cache TTLs in seconds
const RECENT_TRACKS_TTL = 60; // 1 minute for recent/now playing
const TOP_ALBUMS_TTL = 3600; // 1 hour for top albums

export interface Track {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  url: string;
  nowPlaying: boolean;
  playedAt?: string;
}

export interface Album {
  name: string;
  artist: string;
  playCount: number;
  albumArt: string;
  url: string;
}

interface LastFmImage {
  '#text': string;
  size: string;
}

interface LastFmTrack {
  name: string;
  artist: { '#text': string } | string;
  album?: { '#text': string };
  image?: LastFmImage[];
  url: string;
  '@attr'?: { nowplaying: string };
  date?: { '#text': string };
}

interface LastFmAlbum {
  name: string;
  artist: { name: string };
  playcount: string;
  image?: LastFmImage[];
  url: string;
}

function getImageUrl(images: LastFmImage[] | undefined, size: string = 'extralarge'): string {
  if (!images) return '';
  const img = images.find(i => i.size === size) || images[images.length - 1];
  return img?.['#text'] || '';
}

async function fetchFromLastFm(method: string, params: Record<string, string> = {}) {
  const url = new URL(LASTFM_API_BASE);
  url.searchParams.set('method', method);
  url.searchParams.set('user', USERNAME || '');
  url.searchParams.set('api_key', API_KEY || '');
  url.searchParams.set('format', 'json');

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Last.fm API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Get recent tracks with now playing indicator
 */
export async function getRecentTracks(limit: number = 20): Promise<Track[]> {
  const cacheKey = `lastfm:recent:${limit}`;

  // Try cache first
  try {
    const cached = await kv.get<Track[]>(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (e) {
    console.log('KV cache miss or error, fetching fresh');
  }

  // Fetch from Last.fm
  const data = await fetchFromLastFm('user.getrecenttracks', { limit: String(limit) });

  const tracks: Track[] = (data.recenttracks?.track || []).map((t: LastFmTrack) => ({
    name: t.name,
    artist: typeof t.artist === 'string' ? t.artist : t.artist['#text'],
    album: t.album?.['#text'] || '',
    albumArt: getImageUrl(t.image),
    url: t.url,
    nowPlaying: t['@attr']?.nowplaying === 'true',
    playedAt: t.date?.['#text'],
  }));

  // Cache the result
  try {
    await kv.set(cacheKey, tracks, { ex: RECENT_TRACKS_TTL });
  } catch (e) {
    console.error('Failed to cache recent tracks:', e);
  }

  return tracks;
}

/**
 * Get top albums for a time period
 */
export async function getTopAlbums(period: '1month' | '3month' | '6month' | '12month' | 'overall' = '6month', limit: number = 20): Promise<Album[]> {
  const cacheKey = `lastfm:topalbums:${period}:${limit}`;

  // Try cache first
  try {
    const cached = await kv.get<Album[]>(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (e) {
    console.log('KV cache miss or error, fetching fresh');
  }

  // Fetch from Last.fm
  const data = await fetchFromLastFm('user.gettopalbums', { period, limit: String(limit) });

  const albums: Album[] = (data.topalbums?.album || []).map((a: LastFmAlbum) => ({
    name: a.name,
    artist: a.artist.name,
    playCount: parseInt(a.playcount, 10),
    albumArt: getImageUrl(a.image),
    url: a.url,
  }));

  // Cache the result
  try {
    await kv.set(cacheKey, albums, { ex: TOP_ALBUMS_TTL });
  } catch (e) {
    console.error('Failed to cache top albums:', e);
  }

  return albums;
}

/**
 * Get current now playing track (if any)
 */
export async function getNowPlaying(): Promise<Track | null> {
  const tracks = await getRecentTracks(1);
  const current = tracks[0];
  return current?.nowPlaying ? current : null;
}
