'use client';

import { useState, useEffect } from 'react';
import SectionNavigation from '@/components/SectionNavigation';
import ContentCard from '@/components/ContentCard';
import { CardSkeleton } from '@/components/Skeleton';
import type { Project } from '@/lib/projects';
import { useContentRegistry } from '@/lib/content-context';
import styles from './Section.module.css';

interface ProjectsSectionProps {
  onSectionChange?: (section: string) => void;
  spotlightId?: string;
}

export default function ProjectsSection({ onSectionChange, spotlightId }: ProjectsSectionProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { registerContent } = useContentRegistry();

  // Auto-select spotlighted project when spotlightId changes
  useEffect(() => {
    if (spotlightId && projects.length > 0) {
      const spotlightProject = projects.find(p => p.id === spotlightId);
      if (spotlightProject) {
        setSelectedProject(spotlightProject);
      }
    }
  }, [spotlightId, projects]);

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

  // Register projects with content registry for session tracking
  useEffect(() => {
    if (projects.length > 0) {
      registerContent('projects', 'project', projects.map(p => p.id));
    }
  }, [projects, registerContent]);

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

      {/* Project Spotlight Overlay */}
      {selectedProject && (
        <div
          onClick={() => setSelectedProject(null)}
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
              {selectedProject.title}
            </h2>
            {selectedProject.subtitle && (
              <p className="type-serif-italic" style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                {selectedProject.subtitle}
              </p>
            )}
            <div style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {selectedProject.excerpt}
            </div>
            {selectedProject.tech && (
              <p className="type-sans" style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
                {selectedProject.tech}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="type-sans" style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                {selectedProject.year}
              </span>
              <span className="type-serif-italic" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {selectedProject.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
