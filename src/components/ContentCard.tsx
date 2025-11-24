'use client';

import { ReactNode } from 'react';
import Image from 'next/image';

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
  imageWidth?: number;
  imageHeight?: number;
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
  imageWidth,
  imageHeight,
  title,
  subtitle,
  excerpt,
}: ContentCardProps) {
  const getSizeStyles = (size: 'small' | 'medium' | 'large', isImage: boolean) => {
    if (isImage) {
      switch (size) {
        case 'small':
          return { width: '220px', height: '300px' };
        case 'medium':
          return { width: '320px', height: '420px' };
        case 'large':
          return { width: '420px', height: '560px' };
      }
    } else {
      switch (size) {
        case 'small':
          return { width: '260px', minHeight: '180px' };
        case 'medium':
          return { width: '340px', minHeight: '240px' };
        case 'large':
          return { width: '420px', minHeight: '300px' };
      }
    }
  };

  const isImageCard = !!imageUrl;
  const sizeStyles = getSizeStyles(position.size, isImageCard);

  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}px`,
        transition: 'opacity 0.2s ease',
        cursor: onClick ? 'pointer' : 'default',
        zIndex: 10
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.opacity = '0.7';
        }
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
        {isImageCard ? (
          <>
            {/* Image content */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: 'calc(100% - 40px)',
              overflow: 'hidden'
            }}>
              <Image
                src={imageUrl}
                alt={imageAlt || ''}
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            {/* Image caption */}
            {title && (
              <div className="type-serif-italic" style={{
                marginTop: '12px',
                fontSize: '14px',
                color: 'var(--text-secondary)',
                textAlign: 'center'
              }}>
                {title}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Text content */}
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {title && (
                <h3 style={{
                  fontSize: '22px',
                  fontWeight: 400,
                  margin: 0,
                  lineHeight: 1.3
                }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <div className="type-serif-italic" style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                }}>
                  {subtitle}
                </div>
              )}
              {excerpt && (
                <p style={{
                  fontSize: '16px',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)',
                  margin: '0.5rem 0 0 0',
                  flex: 1
                }}>
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
