'use client';

import { useState, useEffect } from 'react';
import SectionNavigation from '@/components/SectionNavigation';
import ContentCard from '@/components/ContentCard';

interface ProjectsSectionProps {
  onSectionChange?: (section: string) => void;
}

interface Project {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  tech: string;
  year: string;
  status: string;
  position?: {
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
  };
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
      <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: '4rem' }}>
        <SectionNavigation
          currentSection="projects"
          onSectionChange={onSectionChange}
        />
        <div className="type-serif-italic" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          Loading projects...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: '4rem' }}>
      <SectionNavigation
        currentSection="projects"
        onSectionChange={onSectionChange}
      />

      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '120vh',
        padding: '2rem 0'
      }}>
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
                  <div style={{ marginBottom: '1rem' }}>
                    {project.excerpt}
                  </div>
                  <div className="type-sans" style={{
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                    marginBottom: '0.75rem'
                  }}>
                    {project.tech}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-light)'
                  }}>
                    <span className="type-sans" style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {project.year}
                    </span>
                    <span className="type-serif-italic" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
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
