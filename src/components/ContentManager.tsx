'use client';

import { useState, useEffect } from 'react';

type ContentType = 'photos' | 'projects' | 'writings';

interface Photo {
  id: string;
  url: string;
  title: string;
  location: string;
  date: string;
}

interface Project {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  tech: string;
  year: string;
  status: string;
}

interface Writing {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  date: string;
  category: string;
}

export default function ContentManager() {
  const [activeTab, setActiveTab] = useState<ContentType>('photos');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [writings, setWritings] = useState<Writing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadContent = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/${activeTab}`);
      const data = await response.json();
      if (data.success) {
        if (activeTab === 'photos') setPhotos(data.photos);
        else if (activeTab === 'projects') setProjects(data.projects);
        else if (activeTab === 'writings') setWritings(data.writings);
      }
    } catch (error) {
      console.error(`Error loading ${activeTab}:`, error);
      setMessage({ type: 'error', text: `Failed to load ${activeTab}` });
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/${activeTab}?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: `${activeTab.slice(0, -1)} deleted successfully` });
        loadContent();
      } else {
        setMessage({ type: 'error', text: data.error || 'Delete failed' });
      }
    } catch (error) {
      console.error('Error deleting:', error);
      setMessage({ type: 'error', text: 'Delete failed' });
    }
  };

  const renderPhotosList = () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {photos.length === 0 ? (
        <div className="type-mono text-xs opacity-60">NO_PHOTOS_FOUND</div>
      ) : (
        photos.map((photo) => (
          <div
            key={photo.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr auto',
              gap: '1rem',
              padding: '1rem',
              border: '1px solid var(--accent-gray)',
              alignItems: 'center',
            }}
          >
            <img
              src={photo.url}
              alt={photo.title}
              style={{
                width: '100px',
                height: '75px',
                objectFit: 'cover',
                border: '1px solid var(--accent-gray)',
              }}
            />
            <div>
              <div className="type-mono text-sm" style={{ marginBottom: '0.25rem' }}>
                {photo.title}
              </div>
              <div className="type-mono text-xs opacity-60">
                {photo.location && `${photo.location} · `}{photo.date}
              </div>
            </div>
            <button
              onClick={() => handleDelete(photo.id)}
              className="type-mono text-xs uppercase tracking-wide hover-glitch"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--accent-red)',
                background: 'transparent',
                color: 'var(--accent-red)',
                cursor: 'pointer',
              }}
            >
              DELETE
            </button>
          </div>
        ))
      )}
    </div>
  );

  const renderProjectsList = () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {projects.length === 0 ? (
        <div className="type-mono text-xs opacity-60">NO_PROJECTS_FOUND</div>
      ) : (
        projects.map((project) => (
          <div
            key={project.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '1rem',
              padding: '1rem',
              border: '1px solid var(--accent-gray)',
            }}
          >
            <div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span className="type-mono text-sm">{project.title}</span>
                <span className="type-mono text-xs opacity-60" style={{ marginLeft: '0.5rem' }}>
                  {project.subtitle}
                </span>
              </div>
              <div className="type-mono text-xs opacity-60" style={{ marginBottom: '0.5rem' }}>
                {project.excerpt}
              </div>
              <div className="type-mono text-xs opacity-40">
                {project.tech} · {project.year} · {project.status}
              </div>
            </div>
            <button
              onClick={() => handleDelete(project.id)}
              className="type-mono text-xs uppercase tracking-wide hover-glitch"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--accent-red)',
                background: 'transparent',
                color: 'var(--accent-red)',
                cursor: 'pointer',
                height: 'fit-content',
              }}
            >
              DELETE
            </button>
          </div>
        ))
      )}
    </div>
  );

  const renderWritingsList = () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {writings.length === 0 ? (
        <div className="type-mono text-xs opacity-60">NO_WRITINGS_FOUND</div>
      ) : (
        writings.map((writing) => (
          <div
            key={writing.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '1rem',
              padding: '1rem',
              border: '1px solid var(--accent-gray)',
            }}
          >
            <div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span className="type-mono text-sm">{writing.title}</span>
                <span className="type-mono text-xs opacity-60" style={{ marginLeft: '0.5rem' }}>
                  {writing.subtitle}
                </span>
              </div>
              <div className="type-mono text-xs opacity-60" style={{ marginBottom: '0.5rem' }}>
                {writing.excerpt}
              </div>
              <div className="type-mono text-xs opacity-40">
                {writing.date} · {writing.category}
              </div>
            </div>
            <button
              onClick={() => handleDelete(writing.id)}
              className="type-mono text-xs uppercase tracking-wide hover-glitch"
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--accent-red)',
                background: 'transparent',
                color: 'var(--accent-red)',
                cursor: 'pointer',
                height: 'fit-content',
              }}
            >
              DELETE
            </button>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div
      style={{
        border: '1px solid var(--accent-gray)',
        padding: '1.5rem',
        marginTop: '2rem',
      }}
    >
      <div className="type-mono text-xs mb-4 opacity-60">CONTENT_MANAGER</div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--accent-gray)' }}>
        {(['photos', 'projects', 'writings'] as ContentType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="type-mono text-xs uppercase tracking-wide"
            style={{
              padding: '0.75rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--accent-blue)' : 'var(--foreground)',
              opacity: activeTab === tab ? 1 : 0.5,
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Messages */}
      {message && (
        <div
          className="type-mono text-xs"
          style={{
            padding: '0.75rem',
            border: `1px solid ${message.type === 'success' ? 'var(--accent-blue)' : 'var(--accent-red)'}`,
            color: message.type === 'success' ? 'var(--accent-blue)' : 'var(--accent-red)',
            marginBottom: '1rem',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="type-mono text-xs opacity-60">LOADING_{activeTab.toUpperCase()}...</div>
      )}

      {/* Content Lists */}
      {!isLoading && (
        <>
          {activeTab === 'photos' && renderPhotosList()}
          {activeTab === 'projects' && renderProjectsList()}
          {activeTab === 'writings' && renderWritingsList()}
        </>
      )}
    </div>
  );
}
