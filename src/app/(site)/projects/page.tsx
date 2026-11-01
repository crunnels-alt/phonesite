import type { Metadata } from 'next';
import { PROJECTS, PROJECTS_INTRO, type Project } from '@/content/projects';
import { getRepoActivity, type RepoActivity } from '@/lib/github';

export const metadata: Metadata = { title: 'Projects · Connor Runnels' };
export const revalidate = 86400;

const HEADING = 'text-xs uppercase tracking-[0.1em] text-ink-3';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });

interface RepoLogProps {
  activity: RepoActivity;
}

function RepoLog({ activity }: RepoLogProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className={HEADING}>Recent changes</h3>
      <p className="text-[13px] text-ink-3">
        Last updated {formatDate(activity.updatedAt)}
        {activity.url && (
          <>
            {' · '}
            <a href={activity.url} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              GitHub
            </a>
          </>
        )}
      </p>
      {activity.commits.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {activity.commits.map((commit) => (
            <li key={commit.sha} className="grid grid-cols-[5.5em_1fr] gap-x-3 text-[13px] leading-snug">
              <span className="text-ink-3">{formatDate(commit.date).replace(/, \d{4}$/, '')}</span>
              <span className="text-ink-2">{commit.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ProjectEntryProps {
  project: Project;
  activity: RepoActivity | null;
}

function ProjectEntry({ project, activity }: ProjectEntryProps) {
  return (
    <article id={project.id} className="grid scroll-mt-8 grid-cols-1 gap-y-8 border-t border-rule py-12 md:grid-cols-10 md:gap-x-6">
      <header className="flex flex-col gap-2 md:col-span-3">
        <h2 className="text-[28px] leading-[1.1] tracking-[-0.01em]">{project.name}</h2>
        <p className="text-base leading-normal text-ink-2">{project.tagline}</p>
      </header>

      <div className="flex flex-col gap-10 md:col-span-6">
        <section className="flex flex-col gap-3.5">
          <h3 className={HEADING}>What it is</h3>
          {project.about.map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>

        <section className="flex flex-col gap-3.5">
          <h3 className={HEADING}>How it works</h3>
          <ol aria-label="Flow" className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] text-ink-2">
            {project.flow.map((step, i) => (
              <li key={step} className="flex items-baseline gap-2">
                {i > 0 && (
                  <span aria-hidden="true" className="text-ink-3">
                    →
                  </span>
                )}
                {step}
              </li>
            ))}
          </ol>
          {project.howItWorks.map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed">
              {paragraph}
            </p>
          ))}
          <dl className="mt-2 border-t border-rule">
            {project.stack.map(({ layer, pieces }) => (
              <div key={layer} className="grid grid-cols-1 gap-1.5 border-b border-rule py-2.5 sm:grid-cols-[9em_1fr] sm:gap-4">
                <dt className="text-[13px] text-ink-3">{layer}</dt>
                <dd className="m-0 flex flex-wrap gap-1.5">
                  {pieces.map((piece) => (
                    <span key={piece} className="border border-rule px-2 py-px text-[12px] leading-[1.6]">
                      {piece}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="flex flex-col gap-3.5">
          <h3 className={HEADING}>What I learned</h3>
          {project.learned.map((point) => (
            <p key={point} className="text-base leading-relaxed">
              {point}
            </p>
          ))}
        </section>

        {activity && <RepoLog activity={activity} />}
      </div>
    </article>
  );
}

export default async function ProjectsPage() {
  const activity = await Promise.all(PROJECTS.map((project) => getRepoActivity(project.repo)));

  return (
    <main className="grid grid-cols-1 px-4 pb-24 pt-16 sm:px-[5%] md:grid-cols-12 md:gap-x-6 md:pt-[72px]">
      <header className="flex flex-col gap-5 md:col-span-6 md:col-start-2">
        <h1 className="text-[44px] leading-[1.05] tracking-[-0.02em]">Projects</h1>
        <p className="max-w-[34em] text-[19px] leading-normal text-ink-2">{PROJECTS_INTRO}</p>
        <nav aria-label="Projects" className="flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-ink-3">
          {PROJECTS.map((project) => (
            <a key={project.id} href={`#${project.id}`} className="hover:text-ink">
              {project.name}
            </a>
          ))}
        </nav>
      </header>

      <div className="mt-16 md:col-span-10 md:col-start-2 md:mt-[72px]">
        {PROJECTS.map((project, i) => (
          <ProjectEntry key={project.id} project={project} activity={activity[i]} />
        ))}
      </div>
    </main>
  );
}
