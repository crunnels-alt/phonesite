'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import styles from './ContentCard.module.css';

interface Position {
  x: number;
  y: number;
  size: 'small' | 'medium' | 'large';
}

interface ContentCardProps {
  position: Position;
  children?: ReactNode;
  onClick?: () => void;
  // For image cards
  imageUrl?: string;
  imageAlt?: string;
  imageBlurDataUrl?: string;
  // For text cards
  title?: string;
  subtitle?: string;
  excerpt?: string | ReactNode;
}

export default function ContentCard({
  position,
  children,
  onClick,
  imageUrl,
  imageAlt,
  imageBlurDataUrl,
  title,
  subtitle,
  excerpt,
}: ContentCardProps) {
  const isImageCard = !!imageUrl;

  const getSizeClass = () => {
    if (isImageCard) {
      switch (position.size) {
        case 'small': return styles.imageSmall;
        case 'medium': return styles.imageMedium;
        case 'large': return styles.imageLarge;
      }
    } else {
      switch (position.size) {
        case 'small': return styles.textSmall;
        case 'medium': return styles.textMedium;
        case 'large': return styles.textLarge;
      }
    }
  };

  return (
    <div
      onClick={onClick}
      className={`${styles.wrapper} ${onClick ? styles.wrapperClickable : ''}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}px`,
      }}
    >
      <div className={`mobile-card ${styles.card} ${getSizeClass()}`}>
        {isImageCard ? (
          <>
            {/* Image content */}
            <div className={styles.imageContainer}>
              <Image
                src={imageUrl}
                alt={imageAlt || ''}
                fill
                className={styles.image}
                placeholder={imageBlurDataUrl ? 'blur' : 'empty'}
                blurDataURL={imageBlurDataUrl}
              />
            </div>
            {/* Image caption */}
            {title && (
              <div className={`type-serif-italic ${styles.imageCaption}`}>
                {title}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Text content */}
            <div className={styles.textContent}>
              {title && (
                <h3 className={styles.title}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <div className={`type-serif-italic ${styles.subtitle}`}>
                  {subtitle}
                </div>
              )}
              {excerpt && (
                <p className={styles.excerpt}>
                  {excerpt}
                </p>
              )}
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
