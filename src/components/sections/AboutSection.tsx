'use client';

interface AboutSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function AboutSection({ onSectionChange }: AboutSectionProps) {
  const sections = [
    { id: 'about', label: 'About', key: '1' },
    { id: 'projects', label: 'Projects', key: '2' },
    { id: 'photo', label: 'Photo', key: '3' },
    { id: 'writing', label: 'Writing', key: '4' },
  ];

  return (
    <section className="min-h-screen p-8 md:p-16">
      <div className="max-w-4xl mx-auto">

        {/* Navigation */}
        <div className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => onSectionChange?.(section.id)}
                className="text-left text-sm hover:opacity-60 transition-opacity text-gray-700"
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8">
              Hi, I&apos;m <span className="blink-name">crunnels</span>
            </h1>
            <div className="space-y-6 text-base text-gray-700 leading-relaxed font-light">
              <p>
                I&apos;m a [your role/description here]. Welcome to my personal website where you can explore my work, thoughts, and projects.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Phone Directory */}
            <div>
              <div className="font-mono text-2xl text-red-500 mb-4">
                (415) 680-9353
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                {sections.map((section) => (
                  <div key={section.id} className="flex items-center">
                    <span className="font-mono text-red-500 mr-3">{section.key}</span>
                    <span>{section.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Get in touch</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>email@example.com</p>
                <p>twitter.com/username</p>
                <p>github.com/username</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}