'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';

interface Photo {
  id: string;
  url: string;
  title: string;
  description?: string;
  location?: string;
  date: string;
}

interface Project {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  year: string;
}

interface Writing {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  date: string;
}

interface Highlight {
  id: number;
  text: string;
  book?: {
    title: string;
    author: string;
  };
}

interface SessionData {
  session: {
    id: string;
    startedAt: string;
    endedAt: string | null;
  };
  journey: string[];
  content: {
    photos: Photo[];
    projects: Project[];
    writings: Writing[];
    highlights: Highlight[];
  };
}

export default function SessionArtifactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch(`/api/session/${id}`);
        const data = await response.json();
        if (data.success) {
          setSessionData(data);
        } else {
          setError(data.error || 'Failed to load session');
        }
      } catch {
        setError('Failed to load session');
      } finally {
        setIsLoading(false);
      }
    }
    fetchSession();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
      }}>
        <span className="type-serif-italic" style={{ color: 'var(--text-tertiary)' }}>
          Loading your journey...
        </span>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
      }}>
        <span className="type-serif-italic" style={{ color: 'var(--text-tertiary)' }}>
          {error || 'Session not found'}
        </span>
      </div>
    );
  }

  const { content, journey } = sessionData;
  const hasContent = content.photos.length > 0 ||
                     content.projects.length > 0 ||
                     content.writings.length > 0 ||
                     content.highlights.length > 0;

  // Format date subtly
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      padding: '4rem 2rem',
    }}>
      {/* Subtle header */}
      <header style={{
        textAlign: 'center',
        marginBottom: '4rem',
      }}>
        <h1 className="type-serif-italic" style={{
          fontSize: '14px',
          color: 'var(--text-tertiary)',
          fontWeight: 'normal',
          marginBottom: '0.5rem',
        }}>
          A Journey Through
        </h1>
        <div className="type-sans" style={{
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          {formatDate(sessionData.session.startedAt)}
        </div>
      </header>

      {/* Journey path - subtle visualization */}
      {journey.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '2rem',
          marginBottom: '4rem',
          flexWrap: 'wrap',
        }}>
          {journey.map((section, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <span className="type-serif-italic" style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                opacity: 0.8,
              }}>
                {section}
              </span>
              {i < journey.length - 1 && (
                <span style={{
                  color: 'var(--border-light)',
                  fontSize: '10px',
                }}>
                  &rarr;
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {!hasContent ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem',
        }}>
          <span className="type-serif-italic" style={{
            color: 'var(--text-tertiary)',
            fontSize: '14px',
          }}>
            A quiet passage through the site
          </span>
        </div>
      ) : (
        /* Content mosaic - artful scattered layout */
        <div style={{
          position: 'relative',
          maxWidth: '1200px',
          margin: '0 auto',
          minHeight: '600px',
        }}>
          {/* Photos - scattered positions */}
          {content.photos.map((photo, i) => {
            const positions = [
              { top: '0%', left: '5%', width: '35%' },
              { top: '15%', right: '0%', width: '40%' },
              { top: '45%', left: '15%', width: '30%' },
              { top: '60%', right: '10%', width: '35%' },
              { top: '80%', left: '0%', width: '45%' },
            ];
            const pos = positions[i % positions.length];

            return (
              <div
                key={photo.id}
                style={{
                  position: i === 0 ? 'relative' : 'relative',
                  marginBottom: '3rem',
                  width: pos.width,
                  marginLeft: pos.left || 'auto',
                  marginRight: pos.right || 'auto',
                }}
              >
                <div style={{
                  position: 'relative',
                  aspectRatio: '4/3',
                  overflow: 'hidden',
                }}>
                  <Image
                    src={photo.url}
                    alt={photo.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                {photo.title && (
                  <div className="type-serif-italic" style={{
                    marginTop: '0.5rem',
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                  }}>
                    {photo.title}
                  </div>
                )}
              </div>
            );
          })}

          {/* Projects - minimal cards */}
          {content.projects.length > 0 && (
            <div style={{
              marginTop: '4rem',
              marginBottom: '4rem',
            }}>
              {content.projects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    padding: '2rem 0',
                    borderTop: '1px solid var(--border-light)',
                  }}
                >
                  <div className="type-sans" style={{
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                  }}>
                    {project.year}
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'normal',
                    marginBottom: '0.25rem',
                  }}>
                    {project.title}
                  </h3>
                  <div className="type-serif-italic" style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                  }}>
                    {project.subtitle}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Writings - elegant excerpts */}
          {content.writings.length > 0 && (
            <div style={{
              marginTop: '4rem',
              marginBottom: '4rem',
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              {content.writings.map((writing) => (
                <div
                  key={writing.id}
                  style={{
                    padding: '2rem 0',
                    textAlign: 'center',
                  }}
                >
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 'normal',
                    marginBottom: '0.5rem',
                  }}>
                    {writing.title}
                  </h3>
                  <div className="type-serif-italic" style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                  }}>
                    {writing.excerpt.substring(0, 200)}...
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Highlights - floating quotes */}
          {content.highlights.length > 0 && (
            <div style={{
              marginTop: '4rem',
            }}>
              {content.highlights.map((highlight, i) => (
                <div
                  key={highlight.id}
                  style={{
                    padding: '2rem',
                    marginBottom: '2rem',
                    marginLeft: i % 2 === 0 ? '0' : '20%',
                    marginRight: i % 2 === 0 ? '20%' : '0',
                    borderLeft: '2px solid var(--border-light)',
                  }}
                >
                  <blockquote className="type-serif-italic" style={{
                    fontSize: '14px',
                    lineHeight: 1.7,
                    color: 'var(--text-secondary)',
                    margin: 0,
                  }}>
                    &ldquo;{highlight.text.substring(0, 300)}{highlight.text.length > 300 ? '...' : ''}&rdquo;
                  </blockquote>
                  {highlight.book && (
                    <div className="type-sans" style={{
                      marginTop: '1rem',
                      fontSize: '11px',
                      color: 'var(--text-tertiary)',
                    }}>
                      {highlight.book.title} &mdash; {highlight.book.author}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        marginTop: '6rem',
        paddingTop: '2rem',
        borderTop: '1px solid var(--border-light)',
      }}>
        <a
          href="/"
          className="type-sans"
          style={{
            fontSize: '11px',
            color: 'var(--text-tertiary)',
            textDecoration: 'none',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Return to site
        </a>
      </footer>
    </div>
  );
}
