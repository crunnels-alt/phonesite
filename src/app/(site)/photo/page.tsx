import type { Metadata } from 'next';
import { PhotoWall } from '@/components/photo/PhotoWall';
import { getPhotos } from '@/lib/photos';

export const revalidate = 300;
export const metadata: Metadata = { title: 'Photo · Connor Runnels' };

export default async function PhotoPage() {
  const photos = await getPhotos();

  return (
    <main>
      <h1 className="sr-only">Photo</h1>
      <PhotoWall photos={photos} />
    </main>
  );
}
