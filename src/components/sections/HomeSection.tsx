'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SectionNavigation from '@/components/SectionNavigation';
import ContentCard from '@/components/ContentCard';
import { PhotoSkeleton } from '@/components/Skeleton';
import type { PhotoGroup } from '@/lib/photos';
import styles from './HomeSection.module.css';

interface HomeSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function HomeSection({ onSectionChange }: HomeSectionProps) {
  const router = useRouter();
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhotoGroups = async () => {
      try {
        const response = await fetch('/api/photos/group');
        const data = await response.json();
        if (data.success) {
          setPhotoGroups(data.groups);
        }
      } catch (error) {
        console.error('Error fetching photo groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotoGroups();
  }, []);

  const handleGroupClick = (group: PhotoGroup) => {
    // Normalize to URL-safe slug (lowercase, alphanumeric and dashes only)
    const slug = group.groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    router.push(`/photos/${encodeURIComponent(slug)}`);
  };

  // Generate mixed positions for all content
  const allPositions = [
    { x: 8, y: 80, size: 'large' as const },
    { x: 55, y: 40, size: 'medium' as const },
    { x: 70, y: 280, size: 'small' as const },
    { x: 12, y: 520, size: 'medium' as const },
    { x: 58, y: 580, size: 'large' as const },
    { x: 5, y: 900, size: 'small' as const },
    { x: 45, y: 1000, size: 'medium' as const },
    { x: 75, y: 1100, size: 'small' as const },
  ];

  // Mix all content types
  const mixedContent: Array<{
    type: string;
    data: unknown;
    position: { x: number; y: number; size: 'small' | 'medium' | 'large' };
  }> = [];
  let positionIndex = 0;

  // Add photo groups (one photo per group)
  photoGroups.forEach((group) => {
    mixedContent.push({
      type: 'photoGroup',
      data: group,
      position: allPositions[positionIndex++] || allPositions[0],
    });
  });

  return (
    <div className={styles.container}>
      <SectionNavigation
        currentSection="home"
        onSectionChange={onSectionChange}
      />

      {loading ? (
        <div className={styles.loadingContainer}>
          <PhotoSkeleton size="large" />
          <PhotoSkeleton size="medium" />
          <PhotoSkeleton size="small" />
        </div>
      ) : (
        <div className={`mobile-content-grid ${styles.contentGrid}`}>
          {mixedContent.map((item) => {
            const group = item.data as PhotoGroup;
            return (
              <ContentCard
                key={`group-${group.groupId}`}
                position={item.position}
                imageUrl={group.coverPhoto.url}
                imageAlt={group.groupName}
                imageBlurDataUrl={group.coverPhoto.blurDataUrl}
                onClick={() => handleGroupClick(group)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
