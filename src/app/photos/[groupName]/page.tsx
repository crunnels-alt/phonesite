'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Photo } from '@/lib/photos';
import styles from './PhotoGroup.module.css';

export default function PhotoGroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupName = params.groupName as string;

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    if (groupName) {
      fetchPhotos();
    }
  }, [groupName]);

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
      const response = await fetch(`/api/photos/group?name=${encodeURIComponent(groupName)}`);
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

  const displayGroupName = photos[0]?.groupName || decodeURIComponent(groupName).replace(/-/g, ' ');

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← Back
        </button>
        <h1 className={`type-display ${styles.title}`}>
          {displayGroupName}
        </h1>
        {photos[0]?.description && (
          <div className={`type-serif-italic ${styles.description}`}>
            {photos[0].description}
          </div>
        )}
        <div className={`type-mono ${styles.photoCount}`}>
          {photos.length} photo{photos.length !== 1 ? 's' : ''}
        </div>
      </header>

      {/* Photo Grid */}
      {loading ? (
        <div className={styles.loading}>
          <div className="type-serif-italic">Loading photos...</div>
        </div>
      ) : photos.length === 0 ? (
        <div className={styles.empty}>
          <div className="type-serif-italic">No photos found in this group.</div>
        </div>
      ) : (
        <div className={styles.grid}>
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={styles.photoCard}
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className={styles.imageWrapper}>
                <Image
                  src={photo.url}
                  alt={photo.description || photo.title}
                  fill
                  className={styles.image}
                  placeholder={photo.blurDataUrl ? 'blur' : 'empty'}
                  blurDataURL={photo.blurDataUrl}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div className={styles.lightbox} onClick={() => setSelectedPhoto(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <Image
              src={selectedPhoto.url}
              alt={selectedPhoto.description || selectedPhoto.title}
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
              <div className={styles.lightboxNav}>
                ← → to navigate · ESC to close
              </div>
            </div>
          </div>
          <button className={styles.closeButton} onClick={() => setSelectedPhoto(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
