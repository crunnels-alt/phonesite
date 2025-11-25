'use client';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export default function Skeleton({
  width = '100%',
  height = '1rem',
  borderRadius = '2px',
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--border-light) 0%, rgba(26,26,26,0.05) 50%, var(--border-light) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

// Card skeleton for projects/writings
export function CardSkeleton() {
  return (
    <div style={{ padding: '1.5rem' }}>
      <Skeleton height={24} width="60%" />
      <div style={{ height: '0.5rem' }} />
      <Skeleton height={16} width="40%" />
      <div style={{ height: '1rem' }} />
      <Skeleton height={14} />
      <div style={{ height: '0.25rem' }} />
      <Skeleton height={14} width="80%" />
    </div>
  );
}

// Photo skeleton
export function PhotoSkeleton({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const dimensions = {
    small: { width: 220, height: 300 },
    medium: { width: 320, height: 420 },
    large: { width: 420, height: 560 },
  };
  const { width, height } = dimensions[size];

  return (
    <div style={{ width, height }}>
      <Skeleton width="100%" height="calc(100% - 36px)" />
      <div style={{ height: '10px' }} />
      <Skeleton height={14} width="50%" />
    </div>
  );
}

// Highlight skeleton for reading notes
export function HighlightSkeleton() {
  return (
    <div style={{ paddingBottom: '2rem', borderBottom: '1px solid var(--border-light)' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <Skeleton width={50} height={75} />
        <div style={{ flex: 1 }}>
          <Skeleton height={18} width="70%" />
          <div style={{ height: '0.25rem' }} />
          <Skeleton height={14} width="40%" />
          <div style={{ height: '0.5rem' }} />
          <Skeleton height={12} width="30%" />
        </div>
      </div>
      <Skeleton height={18} />
      <div style={{ height: '0.25rem' }} />
      <Skeleton height={18} width="90%" />
      <div style={{ height: '0.25rem' }} />
      <Skeleton height={18} width="70%" />
    </div>
  );
}
