'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import type { Photo } from '@/lib/photos';

interface LightboxProps {
  photos: Photo[];
  index: number;
  onChange: (index: number | null) => void;
}

/** Full-screen photo with arrow keys to step through the set and Escape to close. */
export function Lightbox({ photos, index, onChange }: LightboxProps) {
  const photo = photos[index];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onChange(null);
      if (event.key === 'ArrowRight') onChange((index + 1) % photos.length);
      if (event.key === 'ArrowLeft') onChange((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [index, photos.length, onChange]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.description || photo.title}
      onClick={() => onChange(null)}
      className="fixed inset-0 z-50 flex cursor-zoom-out flex-col items-center justify-center gap-4 bg-background/95 p-4"
    >
      <Image
        src={photo.url}
        alt={photo.description || photo.title}
        width={photo.width}
        height={photo.height}
        className="max-h-[80vh] w-auto object-contain"
        placeholder={photo.blurDataUrl ? 'blur' : 'empty'}
        blurDataURL={photo.blurDataUrl}
      />
      <p className="text-center text-[13px] text-ink-3">
        {[photo.description, photo.location, photo.date].filter(Boolean).join(' · ')}
      </p>
    </div>
  );
}
