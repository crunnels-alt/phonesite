'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import SectionNavigation from '@/components/SectionNavigation';
import styles from './ListeningSection.module.css';

interface Track {
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  url: string;
  nowPlaying: boolean;
  playedAt?: string;
}

interface Album {
  name: string;
  artist: string;
  playCount: number;
  albumArt: string;
  url: string;
}

interface ListeningSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function ListeningSection({ onSectionChange }: ListeningSectionProps) {
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [topAlbums, setTopAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Refresh every 60 seconds for now playing updates
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/lastfm');
      const data = await response.json();
      if (data.success) {
        setRecentTracks(data.recentTracks || []);
        setTopAlbums(data.topAlbums || []);
      }
    } catch (error) {
      console.error('Error fetching listening data:', error);
    } finally {
      setLoading(false);
    }
  };

  const nowPlaying = recentTracks.find(t => t.nowPlaying);
  const recentList = recentTracks.filter(t => !t.nowPlaying).slice(0, 19);

  return (
    <div className={styles.container}>
      <SectionNavigation
        currentSection="listening"
        onSectionChange={onSectionChange}
      />

      {loading ? (
        <div className={styles.loading}>
          <div className="type-serif-italic">Loading listening data...</div>
        </div>
      ) : (
        <>
          {/* Now Playing */}
          {nowPlaying && (
            <div className={styles.nowPlaying}>
              <div className={`type-mono ${styles.nowPlayingLabel}`}>
                NOW PLAYING
              </div>
              <a
                href={nowPlaying.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.nowPlayingCard}
              >
                {nowPlaying.albumArt && (
                  <div className={styles.nowPlayingArt}>
                    <Image
                      src={nowPlaying.albumArt}
                      alt={nowPlaying.album}
                      width={120}
                      height={120}
                      className={styles.albumImage}
                    />
                  </div>
                )}
                <div className={styles.nowPlayingInfo}>
                  <div className={`type-display ${styles.trackName}`}>
                    {nowPlaying.name}
                  </div>
                  <div className={`type-sans ${styles.artistName}`}>
                    {nowPlaying.artist}
                  </div>
                  {nowPlaying.album && (
                    <div className={`type-serif-italic ${styles.albumName}`}>
                      {nowPlaying.album}
                    </div>
                  )}
                </div>
              </a>
            </div>
          )}

          {/* Recent Tracks */}
          <div className={styles.section}>
            <h2 className={`type-mono ${styles.sectionTitle}`}>
              RECENT
            </h2>
            {recentList.length === 0 ? (
              <div className={`type-serif-italic ${styles.empty}`}>
                No recent tracks yet. Start listening!
              </div>
            ) : (
              <div className={styles.trackList}>
                {recentList.map((track, index) => (
                  <a
                    key={`${track.name}-${index}`}
                    href={track.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.trackItem}
                  >
                    {track.albumArt && (
                      <div className={styles.trackArt}>
                        <Image
                          src={track.albumArt}
                          alt={track.album}
                          width={48}
                          height={48}
                          className={styles.trackImage}
                        />
                      </div>
                    )}
                    <div className={styles.trackInfo}>
                      <div className={`type-sans ${styles.trackTitle}`}>
                        {track.name}
                      </div>
                      <div className={`type-serif-italic ${styles.trackArtist}`}>
                        {track.artist}
                      </div>
                    </div>
                    {track.playedAt && (
                      <div className={`type-mono ${styles.trackTime}`}>
                        {formatTime(track.playedAt)}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Top Albums */}
          <div className={styles.section}>
            <h2 className={`type-mono ${styles.sectionTitle}`}>
              TOP ALBUMS (6 MONTHS)
            </h2>
            {topAlbums.length === 0 ? (
              <div className={`type-serif-italic ${styles.empty}`}>
                No album data yet.
              </div>
            ) : (
              <div className={styles.albumGrid}>
                {topAlbums.map((album, index) => (
                  <a
                    key={`${album.name}-${index}`}
                    href={album.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.albumCard}
                  >
                    {album.albumArt ? (
                      <Image
                        src={album.albumArt}
                        alt={album.name}
                        width={200}
                        height={200}
                        className={styles.albumCover}
                      />
                    ) : (
                      <div className={styles.albumPlaceholder} />
                    )}
                    <div className={styles.albumInfo}>
                      <div className={`type-sans ${styles.albumTitle}`}>
                        {album.name}
                      </div>
                      <div className={`type-serif-italic ${styles.albumArtist}`}>
                        {album.artist}
                      </div>
                      <div className={`type-mono ${styles.playCount}`}>
                        {album.playCount} plays
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
