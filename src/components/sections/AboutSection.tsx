'use client';

export default function AboutSection() {
  return (
    <section className="min-h-screen p-8 md:p-16">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Hi, I'm crunnels
            </h1>
            <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
              <p>
                I'm a [your role/description here]. Welcome to my personal website where you can explore my work, thoughts, and projects.
              </p>
              <p>
                This site features a unique phone navigation system - you can call <span className="font-mono text-black">(415) 680-9353</span> and navigate through different sections by pressing numbers on your phone.
              </p>
              <p>
                Feel free to browse traditionally or try calling for a different experience.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Get in touch</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>email@example.com</p>
                <p>twitter.com/username</p>
                <p>github.com/username</p>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">📞 Try Phone Navigation</h3>
              <p className="text-sm text-blue-700 mb-3">
                Call this number and press digits to navigate:
              </p>
              <p className="font-mono text-xl text-blue-900">(415) 680-9353</p>
              <div className="mt-3 text-xs text-blue-600 space-y-1">
                <p>• Press 1 for About</p>
                <p>• Press 2 for Projects</p>
                <p>• Press 3 for Photo</p>
                <p>• Press 4 for Writing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}