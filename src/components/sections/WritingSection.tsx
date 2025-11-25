'use client';

import { useState, useEffect } from 'react';
import SectionNavigation from '@/components/SectionNavigation';
import ContentCard from '@/components/ContentCard';
import { CardSkeleton } from '@/components/Skeleton';
import styles from './Section.module.css';

interface WritingSectionProps {
  onSectionChange?: (section: string) => void;
}

interface Writing {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  date: string;
  category: string;
  position?: {
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
  };
}

export default function WritingSection({ onSectionChange }: WritingSectionProps) {
  const [writings, setWritings] = useState<Writing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/writings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWritings(data.writings);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching writings:', err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <SectionNavigation
          currentSection="writing"
          onSectionChange={onSectionChange}
        />
        <div className={styles.loadingGrid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className={styles.skeletonBorder}>
              <CardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <SectionNavigation
        currentSection="writing"
        onSectionChange={onSectionChange}
      />

      <div className={`mobile-content-grid ${styles.contentGrid}`} style={{ minHeight: '160vh' }}>
        {writings.map((post) => {
          const position = post.position || { x: 10, y: 50, size: 'medium' as const };

          return (
            <ContentCard
              key={post.id}
              position={position}
              title={post.title}
              subtitle={post.subtitle}
              excerpt={
                <>
                  <div className={styles.cardBody}>
                    {post.excerpt}
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={`type-sans ${styles.cardDate}`}>
                      {post.date}
                    </span>
                    <span className={`type-serif-italic ${styles.cardStatus}`}>
                      {post.category}
                    </span>
                  </div>
                </>
              }
            />
          );
        })}
      </div>
    </div>
  );
}
