import crypto from 'crypto';
import { getTopAlbums } from './lastfm';

export interface ShelfAlbum {
  key: string;
  name: string;
  artist: string;
  artworkUrl: string;
}

export interface Listening {
  source: 'apple-music' | 'lastfm';
  title: string;
  url?: string;
  albums: ShelfAlbum[];
}

interface AppleTrack {
  attributes?: {
    albumName: string;
    artistName: string;
    artwork?: { url: string };
  };
}

interface ApplePage<T> {
  data: T[];
  next?: string;
}

interface ApplePlaylist {
  attributes?: { name: string; url: string };
}

const APPLE_API = 'https://api.music.apple.com';
const ARTWORK_PX = 600;
const MAX_ALBUMS = 120;
const base64url = (input: string | Buffer) => Buffer.from(input).toString('base64url');

/** MusicKit developer token: an ES256 JWT signed with the key from the Apple Developer account. */
function developerToken(): string | null {
  const { APPLE_MUSIC_TEAM_ID: teamId, APPLE_MUSIC_KEY_ID: keyId, APPLE_MUSIC_PRIVATE_KEY: privateKey } = process.env;
  if (!teamId || !keyId || !privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64url(JSON.stringify({ alg: 'ES256', kid: keyId }))}.${base64url(JSON.stringify({ iss: teamId, iat: now, exp: now + 3600 }))}`;
  const signature = crypto.sign('sha256', Buffer.from(unsigned), {
    key: privateKey.replace(/\\n/g, '\n'),
    dsaEncoding: 'ieee-p1363',
  });
  return `${unsigned}.${base64url(signature)}`;
}

/** "https://music.apple.com/us/playlist/2026/pl.u-abc" -> { storefront: "us", id: "pl.u-abc" } */
function parsePlaylistUrl(url: string): { storefront: string; id: string } | null {
  const match = url.match(/music\.apple\.com\/([a-z]{2})\/playlist\/(?:[^/]+\/)?(pl\.[\w-]+)/i);
  return match ? { storefront: match[1].toLowerCase(), id: match[2] } : null;
}

async function appleGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${APPLE_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`Apple Music ${response.status} for ${path}`);
  return response.json();
}

async function getApplePlaylist(): Promise<Listening | null> {
  const token = developerToken();
  const playlist = parsePlaylistUrl(process.env.APPLE_MUSIC_PLAYLIST_URL ?? '');
  if (!token || !playlist) return null;

  const base = `/v1/catalog/${playlist.storefront}/playlists/${playlist.id}`;
  const meta = await appleGet<ApplePage<ApplePlaylist>>(base, token);

  const tracks: AppleTrack[] = [];
  let next: string | undefined = `${base}/tracks?limit=100`;
  while (next) {
    const page: ApplePage<AppleTrack> = await appleGet(next, token);
    tracks.push(...page.data);
    next = page.next;
  }

  // The collage shows albums, so tracks from the same album collapse into one cover. New songs are added at the end
  // of the playlist, so walking it backwards puts the latest finds first.
  const albums = new Map<string, ShelfAlbum>();
  for (const { attributes } of tracks.toReversed()) {
    if (!attributes?.artwork) continue;
    const key = `${attributes.artistName}|${attributes.albumName}`.toLowerCase();
    if (albums.has(key)) continue;
    albums.set(key, {
      key,
      name: attributes.albumName,
      artist: attributes.artistName,
      artworkUrl: attributes.artwork.url.replace('{w}', String(ARTWORK_PX)).replace('{h}', String(ARTWORK_PX)),
    });
  }

  return {
    source: 'apple-music',
    title: meta.data[0]?.attributes?.name ?? 'Playlist',
    url: meta.data[0]?.attributes?.url ?? process.env.APPLE_MUSIC_PLAYLIST_URL,
    albums: [...albums.values()].slice(0, MAX_ALBUMS),
  };
}

/** The yearly Apple Music playlist when MusicKit is configured; Last.fm's top albums until then. */
export async function getListening(): Promise<Listening> {
  try {
    const apple = await getApplePlaylist();
    if (apple) return apple;
  } catch (error) {
    console.error('Apple Music playlist failed, falling back to Last.fm:', error);
  }

  try {
    const albums = await getTopAlbums('12month', 24);
    return {
      source: 'lastfm',
      title: 'Most played this year',
      albums: albums
        .filter((album) => album.albumArt)
        .map((album) => ({ key: album.url, name: album.name, artist: album.artist, artworkUrl: album.albumArt })),
    };
  } catch (error) {
    console.error('Last.fm albums failed:', error);
    return { source: 'lastfm', title: 'Most played this year', albums: [] };
  }
}
