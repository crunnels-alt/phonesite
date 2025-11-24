'use client';

import { useState, useEffect } from 'react';
import SectionNavigation from '@/components/SectionNavigation';
import ContentCard from '@/components/ContentCard';

interface Photo {
  id: string;
  url: string;
  title: string;
  location: string;
  date: string;
  width: number;
  height: number;
}

interface HomeSectionProps {
  onSectionChange?: (section: string) => void;
}

// Sample data from other sections
const sampleProjects = [
  {
    title: "Phone Navigation",
    subtitle: "TELEPHONIC INTERFACE",
    excerpt: "This website. Bridging analog and digital interaction through voice commands.",
  },
  {
    title: "Neural Synthesis",
    subtitle: "MACHINE LEARNING",
    excerpt: "Algorithmic composition through machine learning models.",
  },
];

const sampleWriting = [
  {
    title: "Communication Protocols",
    subtitle: "INTERFACE DESIGN",
    excerpt: "Investigating telephonic navigation as speculative design.",
  },
  {
    title: "Signal Processing",
    subtitle: "NOISE AS MEDIUM",
    excerpt: "When AI systems develop their own aesthetic preferences.",
  },
];

export default function HomeSection({ onSectionChange }: HomeSectionProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos');
      const data = await response.json();
      if (data.success) {
        setPhotos(data.photos);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mixed positions for all content
  const allPositions = [
    { x: 10, y: 100, size: 'large' as const },
    { x: 50, y: 50, size: 'medium' as const },
    { x: 75, y: 250, size: 'small' as const },
    { x: 15, y: 500, size: 'medium' as const },
    { x: 60, y: 600, size: 'large' as const },
    { x: 85, y: 800, size: 'small' as const },
    { x: 20, y: 1000, size: 'large' as const },
    { x: 55, y: 1200, size: 'medium' as const },
  ];

  // Mix all content types
  const mixedContent: Array<{
    type: string;
    data: unknown;
    position: { x: number; y: number; size: 'small' | 'medium' | 'large' };
  }> = [];
  let positionIndex = 0;

  // Add photos
  photos.slice(0, 2).forEach((photo) => {
    mixedContent.push({
      type: 'photo',
      data: photo,
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
    <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: '4rem' }}>
      <SectionNavigation
        currentSection="home"
        onSectionChange={onSectionChange}
      />

      {loading ? (
        <div className="type-mono text-sm" style={{
          textAlign: 'center',
          padding: '4rem',
          opacity: 0.6
        }}>
          Loading...
        </div>
      ) : (
        <div style={{
          position: 'relative',
          width: '100%',
          minHeight: '150vh',
          padding: '2rem 0'
        }}>
          {mixedContent.map((item, index) => {
            if (item.type === 'photo') {
              const photo = item.data as Photo;
              return (
                <ContentCard
                  key={`photo-${photo.id}`}
                  position={item.position}
                  imageUrl={photo.url}
                  imageAlt={photo.title}
                  imageWidth={photo.width}
                  imageHeight={photo.height}
                  title={photo.title}
                  onClick={() => onSectionChange?.('photo')}
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
