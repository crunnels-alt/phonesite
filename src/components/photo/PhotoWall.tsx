'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Collage } from '@/components/photo/Collage';
import { Lightbox } from '@/components/photo/Lightbox';
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


  if (!photos.length) return <p className="px-4 py-24 text-ink-3 sm:px-[5%]">No photos yet.</p>;


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

      {openIndex !== null && <Lightbox photos={photos} index={openIndex} onChange={setOpenIndex} />}
    </>
  );
}
