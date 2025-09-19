'use client';

interface WritingSectionProps {
  onSectionChange?: (section: string) => void;
}

const writings = [
  {
    title: "Your First Blog Post",
    excerpt: "This is where you can share your thoughts, experiences, or expertise. Write about anything that interests you or your audience.",
    date: "2024-01-15",
    readTime: "5 min read",
    link: "#"
  },
  {
    title: "Thoughts on Technology",
    excerpt: "Share your perspective on technology trends, programming experiences, or industry insights that matter to you.",
    date: "2024-01-10",
    readTime: "8 min read",
    link: "#"
  },
  {
    title: "Building This Website",
    excerpt: "The story behind creating this unique phone-navigable website. Technical challenges, design decisions, and lessons learned.",
    date: "2024-01-05",
    readTime: "12 min read",
    link: "#"
  },
  {
    title: "Random Thoughts",
    excerpt: "Sometimes the best writing comes from random observations and thoughts. This is a space for those moments.",
    date: "2024-01-01",
    readTime: "3 min read",
    link: "#"
  }
];

export default function WritingSection({ onSectionChange }: WritingSectionProps) {
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

        <div className="mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Writing
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl">
            Thoughts, experiences, and insights. A collection of writing on topics that matter to me.
          </p>
        </div>

        <div className="space-y-8">
          {writings.map((post, index) => (
            <article
              key={index}
              className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>

              <h3 className="text-2xl font-semibold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                <a href={post.link}>{post.title}</a>
              </h3>

              <p className="text-gray-600 leading-relaxed mb-4">
                {post.excerpt}
              </p>

              <a
                href={post.link}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Read more →
              </a>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500">
            More writing coming soon...
          </p>
        </div>
      </div>
    </section>
  );
}