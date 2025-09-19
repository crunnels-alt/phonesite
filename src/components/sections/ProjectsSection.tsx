'use client';

interface ProjectsSectionProps {
  onSectionChange?: (section: string) => void;
}

const projects = [
  {
    title: "Project One",
    description: "Description of your first project. This could be work, side projects, or anything you want to showcase.",
    tech: ["React", "Next.js", "TypeScript"],
    link: "#",
    year: "2024"
  },
  {
    title: "Project Two",
    description: "Another project description. Add details about what you built and why.",
    tech: ["Python", "Django", "PostgreSQL"],
    link: "#",
    year: "2023"
  },
  {
    title: "Project Three",
    description: "A third project showcasing different skills or interests.",
    tech: ["Node.js", "Express", "MongoDB"],
    link: "#",
    year: "2023"
  }
];

export default function ProjectsSection({ onSectionChange }: ProjectsSectionProps) {
  const sections = [
    { id: 'about', label: 'About', key: '1' },
    { id: 'projects', label: 'Projects', key: '2' },
    { id: 'photo', label: 'Photo', key: '3' },
    { id: 'writing', label: 'Writing', key: '4' },
  ];

  return (
    <section className="min-h-screen p-8 md:p-16">
      <div className="max-w-6xl mx-auto">

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

        <div className="mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Projects
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl">
            A collection of work and side projects. Each represents different challenges, learnings, and interests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  {project.title}
                </h3>
                <span className="text-sm text-gray-500">{project.year}</span>
              </div>

              <p className="text-gray-600 mb-4 leading-relaxed">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {project.tech.map((tech, techIndex) => (
                  <span
                    key={techIndex}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <a
                href={project.link}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Project →
              </a>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500">
            More projects coming soon...
          </p>
        </div>
      </div>
    </section>
  );
}