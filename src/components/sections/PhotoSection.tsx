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
        return { width: '250px', height: '350px' };
      case 'medium':
        return { width: '350px', height: '450px' };
      case 'large':
        return { width: '450px', height: '600px' };
    }
  };

  return (
    <>
      <div style={{ minHeight: '100vh', position: 'relative', paddingBottom: '4rem' }}>
        {/* Navigation */}
        <SectionNavigation
          currentSection="photo"
          onSectionChange={onSectionChange}
        />

        {/* Montessori Gallery */}
        <div style={{
          position: 'relative',
          width: '100%',
          minHeight: '100vh',
          padding: '2rem 0'
        }}>
          {loading ? (
            <div className="type-mono text-sm" style={{
              textAlign: 'center',
              padding: '4rem',
              opacity: 0.6
            }}>
              Loading photos...
            </div>
          ) : photos.length === 0 ? (
            <div className="type-mono text-sm" style={{
              textAlign: 'center',
              padding: '4rem',
              opacity: 0.6
            }}>
              No photos yet. Upload some from the admin panel.
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
                    transition: 'opacity 0.3s ease',
                    cursor: 'pointer',
                    zIndex: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  {/* Photo frame */}
                  <div style={{
                    ...sizeStyles,
                    position: 'relative',
                    background: '#ffffff',
                    padding: '12px'
                  }}>
                    {/* Image */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: 'calc(100% - 40px)',
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
                    <div className="type-mono" style={{
                      marginTop: '8px',
                      fontSize: '11px',
                      opacity: 0.7,
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
            background: 'rgba(0,0,0,0.95)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            cursor: 'pointer'
          }}
        >
          <div style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            position: 'relative'
          }}>
            <Image
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              width={selectedPhoto.width}
              height={selectedPhoto.height}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain'
              }}
            />
            <div className="type-mono" style={{
              color: 'white',
              marginTop: '1rem',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              <div>{selectedPhoto.title}</div>
              {selectedPhoto.location && (
                <div style={{ opacity: 0.7, fontSize: '12px', marginTop: '0.5rem' }}>
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