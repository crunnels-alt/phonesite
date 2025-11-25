'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SectionNavigation from '@/components/SectionNavigation';
import ContentCard from '@/components/ContentCard';
import { CardSkeleton, PhotoSkeleton } from '@/components/Skeleton';
import styles from './HomeSection.module.css';

interface Photo {
  id: string;
  url: string;
  title: string;
  location: string;
  date: string;
  width: number;
  height: number;
  blurDataUrl?: string;
}

interface PhotoGroup {
  groupId: string;
  groupName: string;
  photoCount: number;
  coverPhoto: Photo;
}

interface HomeSectionProps {
  onSectionChange?: (section: string) => void;
}

// Sample data from other sections
const sampleProjects = [
  {
    title: "Phone Navigation",
    subtitle: "Telephonic Interface",
    excerpt: "This website. Bridging analog and digital interaction through voice commands.",
  },
  {
    title: "Neural Synthesis",
    subtitle: "Machine Learning",
    excerpt: "Algorithmic composition through machine learning models.",
  },
];

const sampleWriting = [
  {
    title: "Communication Protocols",
    subtitle: "Interface Design",
    excerpt: "Investigating telephonic navigation as speculative design.",
  },
  {
    title: "Signal Processing",
    subtitle: "Noise as Medium",
    excerpt: "When AI systems develop their own aesthetic preferences.",
  },
];

export default function HomeSection({ onSectionChange }: HomeSectionProps) {
  const router = useRouter();
  const [photoGroups, setPhotoGroups] = useState<PhotoGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotoGroups();
  }, []);

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

  const handleGroupClick = (group: PhotoGroup) => {
    const slug = group.groupName.toLowerCase().replace(/\s+/g, '-');
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
  photoGroups.slice(0, 2).forEach((group) => {
    mixedContent.push({
      type: 'photoGroup',
      data: group,
      position: allPositions[positionIndex++] || allPositions[0],
    });
  });

  // Add projects
  sampleProjects.forEach((project) => {
    mixedContent.push({
      type: 'project',
      data: project,
      position: allPositions[positionIndex++] || allPositions[0],
    });
  });

  // Add writing
  sampleWriting.forEach((writing) => {
    mixedContent.push({
      type: 'writing',
      data: writing,
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
          <PhotoSkeleton size="medium" />
          <div className={styles.skeletonBorder}>
            <CardSkeleton />
          </div>
          <PhotoSkeleton size="small" />
          <div className={styles.skeletonBorder}>
            <CardSkeleton />
          </div>
        </div>
      ) : (
        <div className={`mobile-content-grid ${styles.contentGrid}`}>
          {mixedContent.map((item, index) => {
            if (item.type === 'photoGroup') {
              const group = item.data as PhotoGroup;
              return (
                <ContentCard
                  key={`group-${group.groupId}`}
                  position={item.position}
                  imageUrl={group.coverPhoto.url}
                  imageAlt={group.groupName}
                  imageBlurDataUrl={group.coverPhoto.blurDataUrl}
                  title={group.groupName}
                  onClick={() => handleGroupClick(group)}
                />
              );
            } else if (item.type === 'project') {
              const project = item.data as typeof sampleProjects[0];
              return (
                <ContentCard
                  key={`project-${index}`}
                  position={item.position}
                  title={project.title}
                  subtitle={project.subtitle}
                  excerpt={project.excerpt}
                  onClick={() => onSectionChange?.('projects')}
                />
              );
            } else if (item.type === 'writing') {
              const writing = item.data as typeof sampleWriting[0];
              return (
                <ContentCard
                  key={`writing-${index}`}
                  position={item.position}
                  title={writing.title}
                  subtitle={writing.subtitle}
                  excerpt={writing.excerpt}
                  onClick={() => onSectionChange?.('writing')}
                />
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}
