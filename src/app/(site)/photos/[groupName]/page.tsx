import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PhotoGrid } from '@/components/photo/PhotoGrid';
import { getPhotosByGroup } from '@/lib/photos';

export const revalidate = 300;

interface PhotoGroupPageProps {
  params: Promise<{ groupName: string }>;
}

export async function generateMetadata({ params }: PhotoGroupPageProps): Promise<Metadata> {
  const [first] = await getPhotosByGroup((await params).groupName);
  return { title: first?.groupName ? `${first.groupName} · Connor Runnels` : 'Photo · Connor Runnels' };
}

export default async function PhotoGroupPage({ params }: PhotoGroupPageProps) {
  const photos = await getPhotosByGroup((await params).groupName);
  if (!photos.length) notFound();
  const [{ groupName, description }] = photos;

  return (
    <main className="px-4 pb-24 pt-14 sm:px-[5%]">
      <header className="mb-12 flex flex-col gap-3 md:ml-[8%] md:max-w-[40em]">
        <Link href="/photo" className="text-[13px] text-ink-3 hover:text-ink">
          ← Photo
        </Link>
        <h1 className="text-[44px] leading-[1.05] tracking-[-0.02em]">{groupName}</h1>
        {description && <p className="text-[19px] leading-normal text-ink-2">{description}</p>}
        <p className="text-[13px] text-ink-3">
          {photos.length} photo{photos.length === 1 ? '' : 's'}
        </p>
      </header>
      <PhotoGrid photos={photos} />
    </main>
  );
}
