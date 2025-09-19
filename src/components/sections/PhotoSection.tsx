'use client';

import Image from 'next/image';

interface PhotoSectionProps {
  onSectionChange?: (section: string) => void;
}

const photos = [
  {
    id: 1,
    title: "DECAY.JPEG",
    series: "DIGITAL ARTIFACTS",
    location: "BROOKLYN, NY",
    date: "2024.03",
    src: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=1200&fit=crop&q=80",
    alt: "Digital decay documentation"
  },
  {
    id: 2,
    title: "FREQUENCY_MODULATION",
    series: "SIGNAL/NOISE",
    location: "REMOTE",
    date: "2023.11",
    src: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=800&fit=crop&q=80",
    alt: "Audio visualization"
  },
  {
    id: 3,
    title: "URBAN_INTERFERENCE",
    series: "ELECTROMAGNETIC",
    location: "MANHATTAN, NY",
    date: "2024.01",
    src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=700&h=500&fit=crop&q=80",
    alt: "Urban electromagnetic fields"
  },
  {
    id: 4,
    title: "NEURAL_PATHWAYS",
    series: "BIOMETRIC",
    location: "LAB",
    date: "2023.09",
    src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=900&h=600&fit=crop&q=80",
    alt: "Neural network visualization"
  },
  {
    id: 5,
    title: "FEEDBACK_LOOP",
    series: "RECURSIVE",
    location: "STUDIO",
    date: "2024.02",
    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=500&h=700&fit=crop&q=80",
    alt: "Audio feedback visualization"
  },
  {
    id: 6,
    title: "COMPRESSION_STUDY",
    series: "DATA_LOSS",
    location: "DIGITAL",
    date: "2023.12",
    src: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop&q=20",
    alt: "Digital compression artifacts"
  }
];

export default function PhotoSection({ onSectionChange }: PhotoSectionProps) {
  const sections = [
    { id: 'about', label: 'ABOUT', key: '1' },
    { id: 'projects', label: 'PROJECTS', key: '2' },
    { id: 'photo', label: 'PHOTO', key: '3' },
    { id: 'writing', label: 'WRITING', key: '4' },
  ];

  return (
    <div className="experimental-grid" style={{ gridTemplateRows: 'auto 1fr' }}>

      {/* Navigation scattered across top */}
      {sections.map((section, index) => (
        <button
          key={section.id}
          onClick={() => onSectionChange?.(section.id)}
          className="type-mono text-xs uppercase tracking-wide hover-glitch"
          style={{
            gridColumn: index === 0 ? '1 / 4' :
                       index === 1 ? '6 / 9' :
                       index === 2 ? '11 / 14' : '16 / 19',
            gridRow: '1',
            justifySelf: 'start',
            transform: `rotate(${Math.random() * 2 - 1}deg)`,
            color: section.id === 'photo' ? 'var(--accent-red)' : 'var(--foreground)'
          }}
        >
          {section.label}
        </button>
      ))}

      {/* Photos in experimental masonry layout */}
      {photos.map((photo, index) => {
        const gridPositions = [
          { column: '1 / 8', row: '2', width: '100%', height: '60vh', rotate: '-2deg' },
          { column: '6 / 12', row: '2', width: '100%', height: '40vh', rotate: '1deg' },
          { column: '10 / 16', row: '2', width: '100%', height: '70vh', rotate: '-1deg' },
          { column: '14 / 20', row: '2', width: '100%', height: '45vh', rotate: '2deg' },
          { column: '18 / 24', row: '2', width: '100%', height: '55vh', rotate: '-1.5deg' },
          { column: '3 / 9', row: '2', width: '100%', height: '35vh', rotate: '0.5deg', marginTop: '50vh' }
        ];

        const position = gridPositions[index];
        if (!position) return null;

        return (
          <div
            key={photo.id}
            className="hover-glitch cursor-pointer"
            style={{
              gridColumn: position.column,
              gridRow: position.row,
              marginTop: position.marginTop || '0',
              transform: `rotate(${position.rotate})`,
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = `rotate(0deg) scale(1.02)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = `rotate(${position.rotate}) scale(1)`;
            }}
          >
            {/* Image container */}
            <div
              style={{
                width: position.width,
                height: position.height,
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid var(--foreground)',
                borderStyle: 'solid'
              }}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                style={{
                  objectFit: 'cover',
                  filter: 'grayscale(20%) contrast(110%)'
                }}
              />

              {/* Overlay info */}
              <div
                style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '100%',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '1rem',
                  opacity: '0',
                  transition: 'opacity 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                className="overlay"
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0';
                }}
              >
                <div>
                  <div className="type-display text-sm mb-2">
                    {photo.title}
                  </div>
                  <div className="type-mono text-xs opacity-80">
                    {photo.series}
                  </div>
                </div>

                <div>
                  <div className="type-mono text-xs opacity-60 mb-1">
                    {photo.location}
                  </div>
                  <div className="type-mono text-xs opacity-60">
                    {photo.date}
                  </div>
                </div>
              </div>
            </div>

            {/* External metadata */}
            <div
              className="type-mono text-xs mt-2"
              style={{
                opacity: 0.6,
                transform: 'rotate(-90deg)',
                transformOrigin: 'left top',
                position: 'absolute',
                left: '-2rem',
                top: '2rem',
                whiteSpace: 'nowrap'
              }}
            >
              {String(photo.id).padStart(2, '0')}
            </div>
          </div>
        );
      })}

      {/* Technical annotations */}
      <div
        className="type-mono text-xs"
        style={{
          gridColumn: '20 / 24',
          gridRow: '2',
          alignSelf: 'end',
          justifySelf: 'end',
          opacity: 0.4,
          lineHeight: '1.6',
          textAlign: 'right'
        }}
      >
        <div>DOCUMENTATION</div>
        <div>SERIES: 2023-2024</div>
        <div>FORMAT: DIGITAL</div>
        <div>RESOLUTION: VARIABLE</div>
      </div>

      {/* Series index */}
      <div
        className="type-mono text-xs"
        style={{
          gridColumn: '1 / 3',
          gridRow: '2',
          alignSelf: 'end',
          opacity: 0.3,
          lineHeight: '2',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed'
        }}
      >
        <div>DIGITAL_ARTIFACTS</div>
        <div>SIGNAL/NOISE</div>
        <div>ELECTROMAGNETIC</div>
        <div>BIOMETRIC</div>
        <div>RECURSIVE</div>
        <div>DATA_LOSS</div>
      </div>

    </div>
  );
}