'use client';

import { useState, useEffect } from 'react';
import SectionNavigation from '@/components/SectionNavigation';
import ContentCard from '@/components/ContentCard';
import { CardSkeleton } from '@/components/Skeleton';
import type { Project } from '@/lib/projects';
import styles from './Section.module.css';

interface ProjectsSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function ProjectsSection({ onSectionChange }: ProjectsSectionProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProjects(data.projects);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <SectionNavigation
          currentSection="projects"
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
        currentSection="projects"
        onSectionChange={onSectionChange}
      />

      <div className={`mobile-content-grid ${styles.contentGrid}`} style={{ minHeight: '120vh' }}>
        {projects.map((project) => {
          const position = project.position || { x: 10, y: 100, size: 'medium' as const };

          return (
            <ContentCard
              key={project.id}
              position={position}
              title={project.title}
              subtitle={project.subtitle}
              excerpt={
                <>
                  <div className={styles.cardBody}>
                    {project.excerpt}
                  </div>
                  <div className={`type-sans ${styles.cardTech}`}>
                    {project.tech}
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={`type-sans ${styles.cardDate}`}>
                      {project.year}
                    </span>
                    <span className={`type-serif-italic ${styles.cardStatus}`}>
                      {project.status}
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
