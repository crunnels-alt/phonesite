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
      // For images, use fixed heights matching PhotoSection
      switch (size) {
        case 'small':
          return { width: '250px', height: '350px' };
        case 'medium':
          return { width: '350px', height: '450px' };
        case 'large':
          return { width: '450px', height: '600px' };
      }
    } else {
      // For text cards, use min heights
      switch (size) {
        case 'small':
          return { width: '250px', minHeight: '200px' };
        case 'medium':
          return { width: '350px', minHeight: '280px' };
        case 'large':
          return { width: '450px', minHeight: '360px' };
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
        transition: 'opacity 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        zIndex: 10
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.opacity = '0.8';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1';
      }}
    >
      {/* Card frame */}
      <div style={{
        ...sizeStyles,
        position: 'relative',
        background: '#ffffff',
        padding: '16px',
      }}>
        {isImageCard ? (
          <>
            {/* Image content */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: 'calc(100% - 50px)',
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
              <div className="type-mono" style={{
                marginTop: '12px',
                fontSize: '11px',
                opacity: 0.7,
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
              padding: '1rem',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {title && (
                <h3 className="type-display" style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  margin: 0,
                  lineHeight: 1.2
                }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <div className="type-mono" style={{
                  fontSize: '11px',
                  opacity: 0.6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {subtitle}
                </div>
              )}
              {excerpt && (
                <p className="type-body" style={{
                  fontSize: '13px',
                  lineHeight: 1.5,
                  opacity: 0.8,
                  margin: 0,
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
