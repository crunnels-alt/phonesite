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
        <div className="type-mono text-xs" style={{ padding: '2rem', opacity: 0.6 }}>
          LOADING_PROJECTS...
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
                  <div className="type-mono" style={{
                    fontSize: '11px',
                    opacity: 0.5,
                    marginBottom: '0.5rem'
                  }}>
                    {project.tech}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span className="type-mono" style={{ fontSize: '11px', opacity: 0.6 }}>
                      {project.year}
                    </span>
                    <span className="type-mono" style={{ fontSize: '11px', opacity: 0.6 }}>
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
