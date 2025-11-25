'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import SectionNavigation from '@/components/SectionNavigation';
import ContentCard from '@/components/ContentCard';
import { CardSkeleton } from '@/components/Skeleton';
import type { Writing } from '@/lib/writings';
import { useContentRegistry } from '@/lib/content-context';
import styles from './Section.module.css';

interface WritingSectionProps {
  onSectionChange?: (section: string) => void;
  spotlightId?: string;
}

export default function WritingSection({ onSectionChange, spotlightId }: WritingSectionProps) {
  const [writings, setWritings] = useState<Writing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWriting, setSelectedWriting] = useState<Writing | null>(null);
  const { registerContent } = useContentRegistry();

  // Auto-select spotlighted writing when spotlightId changes
  useEffect(() => {
    if (spotlightId && writings.length > 0) {
      const spotlightWriting = writings.find(w => w.id === spotlightId);
      if (spotlightWriting) {
        setSelectedWriting(spotlightWriting);
      }
    }
  }, [spotlightId, writings]);

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

  // Register writings with content registry for session tracking
  useEffect(() => {
    if (writings.length > 0) {
      registerContent('writing', 'writing', writings.map(w => w.id));
    }
  }, [writings, registerContent]);

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
                    <ReactMarkdown>{post.excerpt}</ReactMarkdown>
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

      {/* Writing Spotlight Overlay */}
      {selectedWriting && (
        <div
          onClick={() => setSelectedWriting(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(255,255,255,0.98)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            cursor: 'pointer',
            overflow: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '600px',
              width: '100%',
              cursor: 'default',
            }}
          >
            <h2 className="type-serif" style={{ fontSize: '32px', marginBottom: '0.5rem' }}>
              {selectedWriting.title}
            </h2>
            {selectedWriting.subtitle && (
              <p className="type-serif-italic" style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                {selectedWriting.subtitle}
              </p>
            )}
            <div style={{ marginBottom: '1.5rem', lineHeight: 1.7 }}>
              <ReactMarkdown>{selectedWriting.excerpt}</ReactMarkdown>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="type-sans" style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                {selectedWriting.date}
              </span>
              <span className="type-serif-italic" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {selectedWriting.category}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
