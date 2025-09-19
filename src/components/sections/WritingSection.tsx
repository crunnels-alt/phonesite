'use client';

interface WritingSectionProps {
  onSectionChange?: (section: string) => void;
}

const writings = [
  {
    title: "COMMUNICATION_PROTOCOLS",
    subtitle: "BEYOND_HUMAN_INTERFACE",
    excerpt: "INVESTIGATING TELEPHONIC NAVIGATION AS SPECULATIVE DESIGN. HOW VOICE COMMANDS MIGHT RESHAPE DIGITAL INTERACTION PARADIGMS.",
    date: "2024.03.15",
    length: "2400_CHARS",
    category: "INTERFACE",
    status: "PUBLISHED",
    link: "#"
  },
  {
    title: "SIGNAL_PROCESSING",
    subtitle: "NOISE_AS_MEDIUM",
    excerpt: "ALGORITHMIC COMPOSITION THROUGH MACHINE LEARNING. WHEN AI SYSTEMS DEVELOP THEIR OWN AESTHETIC PREFERENCES.",
    date: "2024.02.08",
    length: "3200_CHARS",
    category: "TECHNICAL",
    status: "PUBLISHED",
    link: "#"
  },
  {
    title: "DIGITAL_ARCHAEOLOGY",
    subtitle: "EXCAVATING_PROTOCOLS",
    excerpt: "DOCUMENTATION OF OBSOLETE INTERNET INFRASTRUCTURE. PRESERVING THE ARTIFACTS OF EARLY NETWORKED COMMUNICATION.",
    date: "2023.12.22",
    length: "1800_CHARS",
    category: "RESEARCH",
    status: "ARCHIVED",
    link: "#"
  },
  {
    title: "GLITCH_AESTHETICS",
    subtitle: "SYSTEMATIC_CORRUPTION",
    excerpt: "ON THE BEAUTY OF DEGRADED DATA. WHEN TECHNICAL FAILURES BECOME ARTISTIC STATEMENTS.",
    date: "2023.11.04",
    length: "2900_CHARS",
    category: "THEORY",
    status: "PUBLISHED",
    link: "#"
  },
  {
    title: "NEURAL_SYNTHESIS",
    subtitle: "HUMAN_MACHINE_COLLABORATION",
    excerpt: "REAL-TIME COMPOSITION THROUGH BIOMETRIC FEEDBACK. EXPLORING THE BOUNDARY BETWEEN CONSCIOUS AND UNCONSCIOUS CREATION.",
    date: "2023.10.17",
    length: "4100_CHARS",
    category: "EXPERIMENTAL",
    status: "DRAFT",
    link: "#"
  }
];

export default function WritingSection({ onSectionChange }: WritingSectionProps) {
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
            color: section.id === 'writing' ? 'var(--accent-red)' : 'var(--foreground)'
          }}
        >
          {section.label}
        </button>
      ))}

      {/* Writing entries in experimental layout */}
      {writings.map((post, index) => {
        const gridPositions = [
          { column: '1 / 13', row: '2', offset: '0vh' },
          { column: '10 / 22', row: '2', offset: '25vh' },
          { column: '1 / 14', row: '2', offset: '50vh' },
          { column: '12 / 24', row: '2', offset: '75vh' },
          { column: '3 / 16', row: '2', offset: '100vh' }
        ];

        const position = gridPositions[index];
        if (!position) return null;

        return (
          <article
            key={index}
            className="hover-glitch cursor-pointer"
            style={{
              gridColumn: position.column,
              gridRow: position.row,
              marginTop: position.offset,
              border: `1px solid ${post.status === 'PUBLISHED' ? 'var(--accent-red)' : 'var(--accent-gray)'}`,
              borderStyle: post.status === 'DRAFT' ? 'dashed' : 'solid',
              padding: '2rem',
              transition: 'all 0.3s ease',
              transform: `rotate(${Math.random() * 1 - 0.5}deg)`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)';
              e.currentTarget.style.borderColor = 'var(--accent-red)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = `rotate(${Math.random() * 1 - 0.5}deg) scale(1)`;
              e.currentTarget.style.borderColor = post.status === 'PUBLISHED' ? 'var(--accent-red)' : 'var(--accent-gray)';
            }}
          >
            {/* Header metadata */}
            <div className="flex justify-between items-start mb-4">
              <div className="type-mono text-xs opacity-60">
                {post.date}
              </div>
              <div className="type-mono text-xs uppercase">
                <span style={{ color: 'var(--accent-red)' }}>{post.status}</span>
              </div>
            </div>

            {/* Title */}
            <div className="mb-3">
              <h3 className="type-display text-lg mb-1" style={{ lineHeight: '0.9' }}>
                <a href={post.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {post.title}
                </a>
              </h3>
              <div className="type-body text-sm opacity-70">
                {post.subtitle}
              </div>
            </div>

            {/* Excerpt */}
            <div
              className="type-body mb-4"
              style={{
                fontSize: '0.85rem',
                lineHeight: '1.4',
                opacity: 0.8
              }}
            >
              {post.excerpt}
            </div>

            {/* Footer metadata */}
            <div className="flex justify-between items-end">
              <div className="type-mono text-xs opacity-50">
                {post.category}
              </div>
              <div className="type-mono text-xs opacity-50">
                {post.length}
              </div>
            </div>

            {/* Index number */}
            <div
              className="type-mono text-xs"
              style={{
                position: 'absolute',
                top: '-1rem',
                left: '-1rem',
                color: 'var(--accent-red)',
                transform: 'rotate(-90deg)',
                transformOrigin: 'center'
              }}
            >
              {String(index + 1).padStart(2, '0')}
            </div>
          </article>
        );
      })}

      {/* Archive index */}
      <div
        className="type-mono text-xs"
        style={{
          gridColumn: '22 / 24',
          gridRow: '2',
          alignSelf: 'start',
          justifySelf: 'end',
          opacity: 0.3,
          lineHeight: '2',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          marginTop: '10vh'
        }}
      >
        <div>INTERFACE</div>
        <div>TECHNICAL</div>
        <div>RESEARCH</div>
        <div>THEORY</div>
        <div>EXPERIMENTAL</div>
      </div>

      {/* Status legend */}
      <div
        className="type-mono text-xs"
        style={{
          gridColumn: '1 / 6',
          gridRow: '2',
          alignSelf: 'end',
          opacity: 0.4,
          lineHeight: '1.8'
        }}
      >
        <div style={{ color: 'var(--accent-red)' }}>● PUBLISHED</div>
        <div style={{ color: 'var(--accent-gray)' }}>○ ARCHIVED</div>
        <div style={{ color: 'var(--accent-gray)' }}>◌ DRAFT</div>
      </div>

      {/* Technical specs */}
      <div
        className="type-mono text-xs"
        style={{
          gridColumn: '19 / 24',
          gridRow: '2',
          alignSelf: 'end',
          justifySelf: 'end',
          opacity: 0.3,
          textAlign: 'right',
          lineHeight: '1.6'
        }}
      >
        <div>TEXT_FORMAT: MARKDOWN</div>
        <div>ENCODING: UTF-8</div>
        <div>ARCHIVE: 2023-2024</div>
        <div>STATUS: ACTIVE</div>
      </div>

    </div>
  );
}