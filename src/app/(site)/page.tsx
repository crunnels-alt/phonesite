import Link from 'next/link';
import { Collage, type CollagePosition } from '@/components/photo/Collage';
import { getPhotoGroups, normalizeForSlug } from '@/lib/photos';

export const revalidate = 300;

const POSITIONS: CollagePosition[] = [
  { x: 8, y: 80, size: 'large' },
  { x: 55, y: 40, size: 'medium' },
  { x: 70, y: 280, size: 'small' },
  { x: 12, y: 520, size: 'medium' },
  { x: 58, y: 580, size: 'large' },
  { x: 5, y: 900, size: 'small' },
  { x: 45, y: 1000, size: 'medium' },
  { x: 75, y: 1100, size: 'small' },
];

export default async function HomePage() {
  const groups = (await getPhotoGroups()).slice(0, POSITIONS.length);

  return (
    <main>
      <h1 className="sr-only">Connor Runnels</h1>
      <Collage
        items={groups.map((group, i) => ({
          key: group.groupId,
          src: group.coverPhoto.url,
          alt: group.groupName,
          blurDataUrl: group.coverPhoto.blurDataUrl,
          position: POSITIONS[i],
        }))}
        renderItem={(item, image) => (
          <Link href={`/photos/${normalizeForSlug(item.alt)}`} className="block hover:opacity-85">
            {image}
          </Link>
        )}
      />
    </main>
  );
}
