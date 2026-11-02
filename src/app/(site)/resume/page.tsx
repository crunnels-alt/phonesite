import type { Metadata } from 'next';
import { EDUCATION, JOBS } from '@/content/resume';
import { STORIES, THEMES, THESIS } from '@/content/work';
import { AGENT_PHONE_NUMBER } from '@/lib/sections';
import { OpenFeedButton } from '@/components/voice/OpenFeedButton';

export const metadata: Metadata = { title: 'Resume · Connor Runnels' };

const HEADING = 'text-xs uppercase tracking-[0.1em] text-ink-3';

interface PointProps {
  text: string;
}

function Point({ text }: PointProps) {
  return <p className="text-base leading-relaxed">{text}</p>;
}

const LINK = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Renders [label](url) as links; site paths stay in the tab, everything else opens a new one. */
function Linked({ text }: { text: string }) {
  const parts = text.split(LINK);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 3 === 0) return part;
        if (i % 3 === 2) return null;
        const href = parts[i + 1];
        const external = !href.startsWith('/');
        return (
          <a
            key={href + part}
            href={href}
            className="underline! decoration-ink-3 underline-offset-4 hover:decoration-ink"
            {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
          >
            {part}
          </a>
        );
      })}
    </>
  );
}

interface StoryPartProps {
  label: string;
  text: string;
}

function StoryPart({ label, text }: StoryPartProps) {
  return (
    <div className="grid grid-cols-1 gap-1 md:grid-cols-7 md:gap-x-6">
      <h4 className="text-[13px] text-ink-3 md:col-span-2">{label}</h4>
      <p className="text-base leading-relaxed md:col-span-5">
        <Linked text={text} />
      </p>
    </div>
  );
}

export default function ResumePage() {
  return (
    <main className="grid grid-cols-1 px-4 pb-24 pt-16 sm:px-[5%] md:grid-cols-12 md:gap-x-6 md:pt-[72px] lg:[[data-feed-open]_&]:pr-[400px]">
      <header className="flex flex-col gap-5 md:col-span-6 md:col-start-2">
        <h1 className="text-[44px] leading-[1.05] tracking-[-0.02em]">Connor Runnels</h1>
        <p className="max-w-[34em] text-[22px] leading-snug">{THESIS}</p>
        <p className="text-[13px] text-ink-3">
          San Francisco · <a href="mailto:connorrunnels@gmail.com" className="hover:text-ink">connorrunnels@gmail.com</a> ·{' '}
          <a href="https://linkedin.com/in/connor-runnels" target="_blank" rel="noopener noreferrer" className="hover:text-ink">
            linkedin.com/in/connor-runnels
          </a>
        </p>
        <p className="max-w-[34em] border-l border-ink pl-4 text-base leading-relaxed">
          Call{' '}
          <a href={`tel:${AGENT_PHONE_NUMBER.replace(/\s/g, '')}`} className="whitespace-nowrap underline! underline-offset-4">
            {AGENT_PHONE_NUMBER}
          </a>{' '}
          with questions about any of this, and <OpenFeedButton>watch the call under the hood</OpenFeedButton> as it happens.
        </p>
      </header>

      <section className="mt-20 md:col-span-10 md:col-start-2 md:mt-[88px]">
        <h2 className={`${HEADING} mb-6`}>Problem spaces I own</h2>
        {THEMES.map((theme) => (
          <div key={theme.heading} className="grid grid-cols-1 gap-6 border-t border-ink py-10 md:grid-cols-10 md:gap-x-6">
            <div className="flex flex-col gap-4 md:col-span-4">
              <h3 className="text-[26px] leading-tight tracking-[-0.01em]">{theme.heading}</h3>
              <p className="text-base leading-relaxed text-ink-2">
                <Linked text={theme.problem} />
              </p>
            </div>
            <dl className="flex flex-col gap-4 md:col-span-6">
              {theme.proofs.map((proof) => (
                <div key={proof.text} className="grid grid-cols-1 gap-1 sm:grid-cols-[6.5rem_1fr] sm:gap-x-4">
                  <dt className="text-[13px] text-ink-3 sm:pt-0.5">{proof.company}</dt>
                  <dd className="text-base leading-relaxed">
                    <Linked text={proof.text} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>

      <section className="mt-20 md:col-span-10 md:col-start-2 md:mt-[88px]">
        <h2 className={`${HEADING} mb-6`}>Programs I&apos;ve led</h2>
        <div className="flex flex-col">
          {STORIES.map((story) => (
            <article key={story.id} className="grid grid-cols-1 gap-5 border-t border-rule py-10 md:grid-cols-10 md:gap-x-6">
              <header className="flex flex-col gap-2 md:col-span-3">
                <p className="text-[13px] text-ink-3">
                  {story.company} · {story.years}
                </p>
                <h3 className="text-[22px] leading-tight tracking-[-0.01em]">{story.title}</h3>
              </header>
              <div className="flex flex-col gap-5 md:col-span-7">
                <StoryPart label="The problem" text={story.problem} />
                <StoryPart label="What I did" text={story.decision} />
                <StoryPart label="What happened" text={story.result} />
                <StoryPart label="Next time" text={story.differently} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-20 md:col-span-10 md:col-start-2 md:mt-[88px]">
        <h2 className={`${HEADING} mb-3`}>Experience</h2>
        {JOBS.map((job) => (
          <details key={job.id} className="group border-t border-rule last:border-b">
            <summary className="grid min-h-16 cursor-pointer list-none grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 py-5 md:grid-cols-10 [&::-webkit-details-marker]:hidden">
              <span className="text-[22px] tracking-[-0.01em] md:col-span-3">{job.company}</span>
              <span aria-hidden="true" className="text-xl text-ink-3 md:order-last md:col-span-1 md:justify-self-end">
                <span className="group-open:hidden">+</span>
                <span className="hidden group-open:inline">−</span>
              </span>
              <span className="col-span-2 text-base text-ink-2 md:col-span-4">{job.roles[0].title}</span>
              <span className="col-span-2 text-sm text-ink-3 md:col-span-2">{job.dates}</span>
            </summary>
            <div className="flex flex-col gap-3.5 pb-8 md:ml-[30%] md:w-[60%]">
              {job.summary && <p className="text-base leading-relaxed text-ink-2">{job.summary}</p>}
              {job.roles.map((role) => (
                <div key={role.title} className="flex flex-col gap-3.5">
                  {job.roles.length > 1 && (
                    <p className="mt-2 text-[13px] text-ink-3">
                      {role.title} · {role.dates}
                    </p>
                  )}
                  {role.points?.map((point) => <Point key={point} text={point} />)}
                  {role.groups?.map((group) => (
                    <div key={group.heading} className="mt-4 flex flex-col gap-3.5">
                      <h3 className={HEADING}>{group.heading}</h3>
                      {group.points.map((point) => (
                        <Point key={point} text={point} />
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </details>
        ))}
      </section>

      <section className="mt-[72px] grid grid-cols-1 gap-2 md:col-span-10 md:col-start-2 md:grid-cols-10 md:gap-x-6">
        <h2 className={`${HEADING} md:col-span-3`}>Education</h2>
        <p className="text-base md:col-span-7">{EDUCATION}</p>
      </section>
    </main>
  );
}
