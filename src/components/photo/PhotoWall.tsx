'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Collage } from '@/components/photo/Collage';
import type { Photo } from '@/lib/photos';

const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// A caller who presses 3 again gets a random photo opened for them. Kept separate so reading the URL
// doesn't stop the gallery itself from rendering on the server.
function SpotlightListener({ photos, onOpen }: { photos: Photo[]; onOpen: (index: number) => void }) {
  const spotlight = useSearchParams().get('spotlight');
  useEffect(() => {
    const index = photos.findIndex((photo) => photo.id === spotlight);
    if (index >= 0) onOpen(index);
  }, [spotlight, photos, onOpen]);
  return null;
}

export function PhotoWall({ photos }: { photos: Photo[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const step = useCallback(
    (delta: number) => setOpenIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenIndex(null);
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openIndex, step]);

  if (!photos.length) return <p className="px-4 py-24 text-ink-3 sm:px-[5%]">No photos yet.</p>;

  const open = openIndex === null ? null : photos[openIndex];

  return (
    <>
      <Suspense>
        <SpotlightListener photos={photos} onOpen={setOpenIndex} />
      </Suspense>
      <Collage
        items={photos.map((photo) => ({
          key: photo.id,
          src: photo.url,
          alt: photo.title,
          blurDataUrl: photo.blurDataUrl,
          position: photo.position ?? { x: 10, y: 50, size: 'medium' },
        }))}
        renderItem={(item, image) => {
          const index = photos.findIndex((photo) => photo.id === item.key);
          const { groupName } = photos[index];
          return groupName ? (
            <Link href={`/photos/${slugify(groupName)}`} className="block hover:opacity-85">
              {image}
            </Link>
          ) : (
            <button type="button" onClick={() => setOpenIndex(index)} className="block cursor-zoom-in hover:opacity-85">
              {image}
            </button>
          );
        }}
      />

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={open.title}
          onClick={() => setOpenIndex(null)}
          className="fixed inset-0 z-50 flex cursor-zoom-out flex-col items-center justify-center gap-4 bg-background/95 p-4"
        >
          <Image
            src={open.url}
            alt={open.title}
            width={open.width}
            height={open.height}
            className="max-h-[80vh] w-auto object-contain"
            placeholder={open.blurDataUrl ? 'blur' : 'empty'}
            blurDataURL={open.blurDataUrl}
          />
          <p className="text-center text-[13px] text-ink-3">
            {[open.description, open.location, open.date].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}
    </>
  );
}
