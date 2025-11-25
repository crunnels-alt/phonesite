'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SectionNavigation from '@/components/SectionNavigation';
import { PhotoSkeleton } from '@/components/Skeleton';
import type { Photo } from '@/lib/photos';
import styles from './PhotoSection.module.css';

interface PhotoSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function PhotoSection({ onSectionChange }: PhotoSectionProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const handlePhotoClick = (photo: Photo) => {
    if (photo.groupName) {
      // Navigate to group page with normalized slug
      const slug = photo.groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      router.push(`/photos/${encodeURIComponent(slug)}`);
    } else {
      // Open lightbox for ungrouped photos
      setSelectedPhoto(photo);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = photos.findIndex(p => p.id === selectedPhoto.id);

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % photos.length;
        setSelectedPhoto(photos[nextIndex]);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
        setSelectedPhoto(photos[prevIndex]);
      } else if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, photos]);

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

  const getSizeClass = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small': return styles.photoSmall;
      case 'medium': return styles.photoMedium;
      case 'large': return styles.photoLarge;
    }
  };

  return (
    <>
      <div className={styles.container}>
        <SectionNavigation
          currentSection="photo"
          onSectionChange={onSectionChange}
        />

        {/* Gallery */}
        <div className={`mobile-content-grid ${styles.gallery}`}>
          {loading ? (
            <div className={styles.loadingContainer}>
              {[...Array(4)].map((_, i) => (
                <PhotoSkeleton key={i} size={(['small', 'medium', 'large'] as const)[i % 3]} />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className={`type-serif-italic ${styles.emptyMessage}`}>
              No photos yet.
            </div>
          ) : (
            photos.map((photo) => {
              const position = photo.position || { x: 10, y: 50, size: 'medium' as const };

              return (
                <div
                  key={photo.id}
                  onClick={() => handlePhotoClick(photo)}
                  className={styles.photoWrapper}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}px`,
                  }}
                >
                  <div className={`${styles.photoCard} ${getSizeClass(position.size)}`}>
                    <div className={styles.photoImageContainer}>
                      <Image
                        src={photo.url}
                        alt={photo.title}
                        fill
                        className={styles.photoImage}
                        placeholder={photo.blurDataUrl ? 'blur' : 'empty'}
                        blurDataURL={photo.blurDataUrl}
                      />
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
          className={`mobile-lightbox ${styles.lightbox}`}
        >
          <div className={styles.lightboxContent}>
            <Image
              src={selectedPhoto.url}
              alt={selectedPhoto.title}
              width={selectedPhoto.width}
              height={selectedPhoto.height}
              className={styles.lightboxImage}
              placeholder={selectedPhoto.blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={selectedPhoto.blurDataUrl}
            />
            <div className={styles.lightboxCaption}>
              {selectedPhoto.description && (
                <div className={`type-serif-italic ${styles.lightboxTitle}`}>
                  {selectedPhoto.description}
                </div>
              )}
              {(selectedPhoto.location || selectedPhoto.date) && (
                <div className={`type-sans ${styles.lightboxMeta}`}>
                  {selectedPhoto.location}{selectedPhoto.location && selectedPhoto.date && ' · '}{selectedPhoto.date}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
