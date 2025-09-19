'use client';

interface AboutSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function AboutSection({ onSectionChange }: AboutSectionProps) {
  const sections = [
    { id: 'about', label: 'ABOUT', key: '1', position: 'grid-column: 1 / 4; grid-row: 1;' },
    { id: 'projects', label: 'PROJECTS', key: '2', position: 'grid-column: 5 / 9; grid-row: 1;' },
    { id: 'photo', label: 'PHOTO', key: '3', position: 'grid-column: 10 / 13; grid-row: 1;' },
    { id: 'writing', label: 'WRITING', key: '4', position: 'grid-column: 14 / 18; grid-row: 1;' },
  ];

  return (
    <div className="experimental-grid" style={{ gridTemplateRows: 'auto auto 1fr auto auto' }}>

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
            color: section.id === 'about' ? 'var(--accent-red)' : 'var(--foreground)'
          }}
        >
          {section.label}
        </button>
      ))}

      {/* Main name - large, prominent */}
      <div
        className="type-display"
        style={{
          gridColumn: '1 / 15',
          gridRow: '2',
          fontSize: 'clamp(3rem, 12vw, 8rem)',
          lineHeight: '0.8',
          marginTop: '4vh',
          transform: 'rotate(-1deg)'
        }}
      >
        <span className="blink-name">CRUNNELS</span>
      </div>

      {/* Phone number - positioned asymmetrically */}
      <div
        className="type-mono"
        style={{
          gridColumn: '16 / 24',
          gridRow: '2',
          fontSize: '1.2rem',
          color: 'var(--accent-red)',
          alignSelf: 'end',
          transform: 'rotate(90deg)',
          transformOrigin: 'left bottom',
          whiteSpace: 'nowrap'
        }}
      >
        (415) 680-9353
      </div>

      {/* Directory - minimal, scattered */}
      <div
        style={{
          gridColumn: '1 / 8',
          gridRow: '3',
          display: 'grid',
          gap: '1rem',
          alignContent: 'center'
        }}
      >
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="type-mono text-xs"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              opacity: 0.7,
              transform: `translateX(${index * 10}px)`
            }}
          >
            <span style={{ color: 'var(--accent-red)' }}>{section.key}</span>
            <span>{section.label}</span>
          </div>
        ))}
      </div>

      {/* Bio text - fragmented */}
      <div
        className="type-body"
        style={{
          gridColumn: '10 / 18',
          gridRow: '3',
          fontSize: '0.9rem',
          lineHeight: '1.4',
          alignSelf: 'center'
        }}
      >
        <div className="text-fragment">DIGITAL</div>{' '}
        <div className="text-fragment">PRACTITIONER</div>{' '}
        <div className="text-fragment">WORKING</div>{' '}
        <div className="text-fragment">ACROSS</div>{' '}
        <div className="text-fragment">MEDIA</div>
        <br /><br />
        <div className="text-fragment">CALL</div>{' '}
        <div className="text-fragment">TO</div>{' '}
        <div className="text-fragment">NAVIGATE</div>
      </div>

      {/* Contact info - bottom corner */}
      <div
        className="type-mono"
        style={{
          gridColumn: '19 / 24',
          gridRow: '4',
          fontSize: '0.7rem',
          textAlign: 'right',
          opacity: 0.6,
          lineHeight: '1.6'
        }}
      >
        <div>EMAIL@EXAMPLE.COM</div>
        <div>@USERNAME</div>
        <div>GITHUB.COM/USERNAME</div>
      </div>

      {/* Decorative elements */}
      <div
        style={{
          gridColumn: '20 / 24',
          gridRow: '3',
          alignSelf: 'start',
          justifySelf: 'end'
        }}
      >
        <div
          style={{
            width: '2px',
            height: '20vh',
            background: 'var(--accent-red)',
            transform: 'rotate(15deg)'
          }}
        ></div>
      </div>

      <div
        style={{
          gridColumn: '5 / 6',
          gridRow: '4',
          alignSelf: 'end'
        }}
      >
        <div
          style={{
            width: '15vw',
            height: '1px',
            background: 'var(--accent-gray)',
            opacity: 0.3
          }}
        ></div>
      </div>

    </div>
  );
}