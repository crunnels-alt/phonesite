'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Lightbox } from '@/components/photo/Lightbox';
import type { Photo } from '@/lib/photos';

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button type="button" onClick={() => setOpenIndex(index)} className="relative block aspect-[4/5] w-full cursor-zoom-in hover:opacity-85">
              <Image
                src={photo.url}
                alt={photo.description || photo.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
                placeholder={photo.blurDataUrl ? 'blur' : 'empty'}
                blurDataURL={photo.blurDataUrl}
              />
            </button>
          </li>
        ))}
      </ul>
      {openIndex !== null && <Lightbox photos={photos} index={openIndex} onChange={setOpenIndex} />}
    </>
  );
}
