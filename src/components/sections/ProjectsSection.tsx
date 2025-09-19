'use client';

interface ProjectsSectionProps {
  onSectionChange?: (section: string) => void;
}

const projects = [
  {
    title: "NEURAL SYNTHESIS",
    description: "ALGORITHMIC COMPOSITION THROUGH MACHINE LEARNING MODELS. EXPLORING THE BOUNDARIES BETWEEN HUMAN AND ARTIFICIAL CREATIVITY.",
    tech: ["PYTHON", "TENSORFLOW", "MAX/MSP"],
    link: "#",
    year: "2024",
    status: "ONGOING"
  },
  {
    title: "DIGITAL ARCHAEOLOGY",
    description: "EXCAVATING FORGOTTEN INTERNET PROTOCOLS. A STUDY OF OBSOLETE COMMUNICATION METHODS.",
    tech: ["C++", "ASSEMBLY", "RETROCOMPUTING"],
    link: "#",
    year: "2023",
    status: "ARCHIVED"
  },
  {
    title: "PHONE NAVIGATION",
    description: "THIS WEBSITE. TELEPHONIC INTERFACE FOR WEB NAVIGATION. BRIDGING ANALOG AND DIGITAL INTERACTION.",
    tech: ["NEXT.JS", "TWILIO", "WEBSOCKETS"],
    link: "#",
    year: "2024",
    status: "LIVE"
  },
  {
    title: "GLITCH AESTHETICS",
    description: "CORRUPTED DATA AS ARTISTIC MEDIUM. SYSTEMATIC DESTRUCTION OF DIGITAL IMAGES.",
    tech: ["PROCESSING", "FFMPEG", "IMAGEMAGICK"],
    link: "#",
    year: "2023",
    status: "EXPERIMENTAL"
  }
];

export default function ProjectsSection({ onSectionChange }: ProjectsSectionProps) {
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
            color: section.id === 'projects' ? 'var(--accent-red)' : 'var(--foreground)'
          }}
        >
          {section.label}
        </button>
      ))}

      {/* Projects laid out asymmetrically */}
      {projects.map((project, index) => {
        const gridPositions = [
          { column: '1 / 12', row: '2', offset: '0vh' },
          { column: '8 / 20', row: '2', offset: '15vh' },
          { column: '3 / 15', row: '2', offset: '30vh' },
          { column: '12 / 24', row: '2', offset: '45vh' }
        ];

        const position = gridPositions[index];

        return (
          <div
            key={index}
            className="hover-glitch"
            style={{
              gridColumn: position.column,
              gridRow: position.row,
              marginTop: position.offset,
              border: '1px solid transparent',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = '1px solid var(--accent-red)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = '1px solid transparent';
            }}
          >
            {/* Project header */}
            <div className="mb-4">
              <div
                className="type-display text-lg mb-2"
                style={{
                  fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
                  lineHeight: '0.9'
                }}
              >
                {project.title}
              </div>

              <div className="flex justify-between items-center mb-3">
                <span
                  className="type-mono text-xs"
                  style={{ color: 'var(--accent-red)' }}
                >
                  {project.year}
                </span>
                <span
                  className="type-mono text-xs uppercase"
                  style={{
                    opacity: 0.6,
                    transform: 'rotate(-90deg)',
                    transformOrigin: 'center'
                  }}
                >
                  {project.status}
                </span>
              </div>
            </div>

            {/* Description */}
            <div
              className="type-body mb-4"
              style={{
                fontSize: '0.8rem',
                lineHeight: '1.3',
                opacity: 0.8
              }}
            >
              {project.description}
            </div>

            {/* Tech stack - vertical list */}
            <div className="mb-4">
              {project.tech.map((tech, techIndex) => (
                <div
                  key={techIndex}
                  className="type-mono text-xs mb-1"
                  style={{
                    opacity: 0.5,
                    transform: `translateX(${techIndex * 5}px)`
                  }}
                >
                  {tech}
                </div>
              ))}
            </div>

            {/* Link */}
            <a
              href={project.link}
              className="type-mono text-xs uppercase tracking-wide hover-glitch"
              style={{
                color: 'var(--accent-blue)',
                textDecoration: 'none'
              }}
            >
              VIEW →
            </a>
          </div>
        );
      })}

      {/* Decorative elements */}
      <div
        style={{
          gridColumn: '22 / 24',
          gridRow: '2',
          alignSelf: 'start',
          justifySelf: 'center',
          marginTop: '20vh'
        }}
      >
        <div
          style={{
            width: '1px',
            height: '40vh',
            background: 'var(--accent-gray)',
            opacity: 0.2
          }}
        />
      </div>

    </div>
  );
}