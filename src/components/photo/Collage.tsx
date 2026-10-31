import Image from 'next/image';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type CollageSize = 'small' | 'medium' | 'large';

export interface CollagePosition {
  x: number;
  y: number;
  size: CollageSize;
}

export interface CollageItem {
  key: string;
  src: string;
  alt: string;
  blurDataUrl?: string;
  caption?: string;
  position: CollagePosition;
}

const SIZES: Record<CollageSize, { width: number; height: number }> = {
  small: { width: 220, height: 260 },
  medium: { width: 320, height: 380 },
  large: { width: 420, height: 520 },
};

const SIZE_CLASSES: Record<CollageSize, string> = {
  small: 'md:w-[220px]',
  medium: 'md:w-[320px]',
  large: 'md:w-[420px]',
};

const HEIGHT_CLASSES: Record<CollageSize, string> = {
  small: 'md:h-[260px]',
  medium: 'md:h-[380px]',
  large: 'md:h-[520px]',
};

interface CollageProps {
  items: CollageItem[];
  /** Wraps each image, e.g. in a link or button. */
  renderItem: (item: CollageItem, image: ReactNode) => ReactNode;
}

/**
 * Off-grid image collage: placed absolutely by x (percent) and y (px) on wide screens, one column on phones.
 */
export function Collage({ items, renderItem }: CollageProps) {
  const height = Math.max(0, ...items.map(({ position }) => position.y + SIZES[position.size].height)) + 96;

  return (
    <div
      className="flex flex-col gap-10 px-4 pb-24 pt-6 md:relative md:block md:h-[var(--collage-h)] md:px-0 md:pb-0"
      style={{ '--collage-h': `${height}px` } as React.CSSProperties}
    >
      {items.map((item) => {
        const { size } = item.position;
        const image = (
          <figure className={cn('m-0 w-full', SIZE_CLASSES[size])}>
            <div className={cn('relative aspect-[4/5] w-full md:aspect-auto', HEIGHT_CLASSES[size])}>
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes={`(min-width: 768px) ${SIZES[size].width}px, 100vw`}
                className="object-cover"
                placeholder={item.blurDataUrl ? 'blur' : 'empty'}
                blurDataURL={item.blurDataUrl}
              />
            </div>
            {item.caption && <figcaption className="mt-3 text-[13px] text-ink-3">{item.caption}</figcaption>}
          </figure>
        );
        return (
          <div
            key={item.key}
            className="md:absolute md:left-[var(--x)] md:top-[var(--y)]"
            style={{ '--x': `${item.position.x}%`, '--y': `${item.position.y}px` } as React.CSSProperties}
          >
            {renderItem(item, image)}
          </div>
        );
      })}
    </div>
  );
}
