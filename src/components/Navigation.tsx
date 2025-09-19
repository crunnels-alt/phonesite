'use client';

interface NavigationProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  { id: 'about', label: 'About', key: '1' },
  { id: 'projects', label: 'Projects', key: '2' },
  { id: 'photo', label: 'Photo', key: '3' },
  { id: 'writing', label: 'Writing', key: '4' },
];

export default function Navigation({ currentSection, onSectionChange }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Minimal abstract layout inspired by katiechiou.xyz */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">

          {/* Name/Logo - asymmetric placement */}
          <div className="md:col-span-4">
            <div
              className="text-lg font-medium text-gray-900 cursor-pointer hover:opacity-60 transition-opacity"
              onClick={() => onSectionChange('about')}
            >
              <span className="blink-name">crunnels</span>
            </div>
          </div>

          {/* Abstract navigation links */}
          <div className="md:col-span-5 md:col-start-7">
            <div className="space-y-2">
              {sections.map((section, index) => (
                <div key={section.id} className="flex items-center">
                  <button
                    onClick={() => onSectionChange(section.id)}
                    className={`text-sm hover:opacity-60 transition-opacity ${
                      currentSection === section.id
                        ? 'text-red-500 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {section.label}
                  </button>
                  {index < sections.length - 1 && (
                    <span className="ml-3 w-1 h-1 bg-gray-400 rounded-full"></span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Phone number - minimal placement */}
          <div className="md:col-span-3 text-right">
            <div className="text-xs text-gray-500 font-mono">
              (415) 680-9353
            </div>
          </div>
        </div>

        {/* Current section indicator - very subtle */}
        <div className="mt-8 opacity-50">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <div className="text-center mt-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              {sections.find(s => s.id === currentSection)?.label || 'About'}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}