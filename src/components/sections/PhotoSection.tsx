'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import SectionNavigation from '@/components/SectionNavigation';
import { PhotoSkeleton } from '@/components/Skeleton';
import styles from './PhotoSection.module.css';

interface Photo {
  id: string;
  url: string;
  title: string;
  location: string;
  date: string;
  width: number;
  height: number;
  blurDataUrl?: string;
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
                  onClick={() => setSelectedPhoto(photo)}
                  className={styles.photoWrapper}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}px`,
                  }}
                >
                  <div className={`${styles.photoCard} ${getSizeClass(position.size)}`}>
                    {/* Image */}
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

                    {/* Caption */}
                    <div className={`type-serif-italic ${styles.photoCaption}`}>
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
              <div className={`type-serif-italic ${styles.lightboxTitle}`}>
                {selectedPhoto.title}
              </div>
              {selectedPhoto.location && (
                <div className={`type-sans ${styles.lightboxMeta}`}>
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
