import type { Metadata } from 'next';
import Image from 'next/image';
import { getListening } from '@/lib/music';
import { scatter, type Slot } from '@/lib/scatter';

export const revalidate = 3600;
export const metadata: Metadata = { title: 'Listening · Connor Runnels' };

const PATTERN: Slot[] = [
  { x: 4, y: 30, width: 300 },
  { x: 31, y: 0, width: 240 },
  { x: 52, y: 90, width: 280 },
  { x: 78, y: 20, width: 220 },
  { x: 15, y: 290, width: 220 },
  { x: 36, y: 330, width: 300 },
  { x: 63, y: 420, width: 240 },
  { x: 82, y: 300, width: 200 },
];

export default async function ListeningPage() {
  const { title, url, albums } = await getListening();
  const { placements, height } = scatter(albums.length, PATTERN, 700);

  return (
    <main className="px-4 pb-24 pt-14 sm:px-[5%]">
      <h1 className="mb-10 text-[13px] text-ink-3 md:ml-[4%]">
        {title}
        {url && (
          <>
            {' · '}
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-4">
              Open in Apple Music
            </a>
          </>
        )}
      </h1>

      {albums.length === 0 ? (
        <p className="text-ink-3">Nothing playing right now.</p>
      ) : (
        <ul
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:relative md:block md:h-[var(--wall-h)] md:overflow-hidden"
          style={{ '--wall-h': `${height + 100}px` } as React.CSSProperties}
        >
          {placements.map(({ index, x, y, width }) => {
            const album = albums[index];
            return (
              <li
                key={album.key}
                className="md:absolute md:left-[var(--x)] md:top-[var(--y)] md:w-[var(--w)]"
                style={{ '--x': `${x}%`, '--y': `${y}px`, '--w': `${width}px` } as React.CSSProperties}
              >
                <Image
                  src={album.artworkUrl}
                  alt={`${album.name}, ${album.artist}`}
                  title={`${album.name}, ${album.artist}`}
                  width={width}
                  height={width}
                  sizes={`(min-width: 768px) ${width}px, 45vw`}
                  className="aspect-square h-auto w-full object-cover"
                />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
