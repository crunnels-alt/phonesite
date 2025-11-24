'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import SectionNavigation from '@/components/SectionNavigation';

interface Photo {
  id: string;
  url: string;
  title: string;
  location: string;
  date: string;
  width: number;
  height: number;
  uploadedAt: string;
  position?: {
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
    rotate?: number;
  };
}

interface PhotoSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function PhotoSection({ onSectionChange }: PhotoSectionProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

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

  const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small':
        return { width: '220px', height: '300px' };
      case 'medium':
        return { width: '320px', height: '420px' };
      case 'large':
        return { width: '420px', height: '560px' };
    }
  };

  return (
    <>
      <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: '4rem' }}>
        <SectionNavigation
          currentSection="photo"
          onSectionChange={onSectionChange}
        />

        {/* Gallery */}
        <div style={{
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
          padding: '2rem 0'
        }}>
          {loading ? (
            <div className="type-serif-italic" style={{
              textAlign: 'center',
              padding: '4rem',
              color: 'var(--text-secondary)'
            }}>
              Loading photos...
            </div>
          ) : photos.length === 0 ? (
            <div className="type-serif-italic" style={{
              textAlign: 'center',
              padding: '4rem',
              color: 'var(--text-secondary)'
            }}>
              No photos yet.
            </div>
          ) : (
            photos.map((photo) => {
              const position = photo.position || { x: 10, y: 50, size: 'medium' as const };
              const sizeStyles = getSizeStyles(position.size);

              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  style={{
                    position: 'absolute',
                    left: `${position.x}%`,
                    top: `${position.y}px`,
                    transition: 'opacity 0.2s ease',
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.85';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <div style={{
                    ...sizeStyles,
                    position: 'relative',
                    background: '#ffffff',
                  }}>
                    {/* Image */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: 'calc(100% - 36px)',
                      overflow: 'hidden'
                    }}>
                      <Image
                        src={photo.url}
                        alt={photo.title}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>

                    {/* Caption */}
                    <div className="type-serif-italic" style={{
                      marginTop: '10px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      textAlign: 'center'
                    }}>
                      {photo.title}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255,255,255,0.97)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem',
            cursor: 'pointer'
          }}
        >
          <div style={{
            maxWidth: '85vw',
            maxHeight: '85vh',
            position: 'relative'
          }}>
            <Image
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              width={selectedPhoto.width}
              height={selectedPhoto.height}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain'
              }}
            />
            <div style={{
              marginTop: '1.5rem',
              textAlign: 'center',
            }}>
              <div className="type-serif-italic" style={{ fontSize: '18px', marginBottom: '0.5rem' }}>
                {selectedPhoto.title}
              </div>
              {selectedPhoto.location && (
                <div className="type-sans" style={{
                  fontSize: '13px',
                  color: 'var(--text-tertiary)',
                }}>
                  {selectedPhoto.location} · {selectedPhoto.date}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
