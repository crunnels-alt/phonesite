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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <div
            className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onSectionChange('about')}
          >
            crunnels
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={`text-sm font-medium transition-colors ${
                  currentSection === section.id
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {section.label}
                <span className="ml-1 text-xs text-gray-400">({section.key})</span>
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                📞 (415) 680-9353
              </div>
              <div className="text-xs text-gray-500">
                Call to navigate
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Phone navigation indicator */}
        <div className="mt-3 text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            currentSection === 'about' ? 'bg-blue-100 text-blue-800' :
            currentSection === 'projects' ? 'bg-green-100 text-green-800' :
            currentSection === 'photo' ? 'bg-pink-100 text-pink-800' :
            currentSection === 'writing' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            Currently viewing: {sections.find(s => s.id === currentSection)?.label || 'About'}
          </div>
        </div>
      </div>
    </nav>
  );
}