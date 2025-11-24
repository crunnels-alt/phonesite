'use client';

import { useState, useEffect } from 'react';
import SectionNavigation from '@/components/SectionNavigation';
import ContentCard from '@/components/ContentCard';

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
      <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: '4rem' }}>
        <SectionNavigation
          currentSection="writing"
          onSectionChange={onSectionChange}
        />
        <div className="type-mono text-xs" style={{ padding: '2rem', opacity: 0.6 }}>
          LOADING_WRITINGS...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: '4rem' }}>
      <SectionNavigation
        currentSection="writing"
        onSectionChange={onSectionChange}
      />

      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '160vh',
        padding: '2rem 0'
      }}>
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
                  <div style={{ marginBottom: '1rem' }}>
                    {post.excerpt}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--accent-gray)'
                  }}>
                    <span className="type-mono" style={{ fontSize: '11px', opacity: 0.6 }}>
                      {post.date}
                    </span>
                    <span className="type-mono" style={{ fontSize: '11px', opacity: 0.6 }}>
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
