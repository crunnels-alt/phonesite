import type { Metadata } from 'next';
import { EDUCATION, JOBS, RESUME_INTRO } from '@/content/resume';
import { AGENT_PHONE_NUMBER } from '@/lib/sections';
import { OpenFeedButton } from '@/components/voice/OpenFeedButton';

export const metadata: Metadata = { title: 'Resume · Connor Runnels' };

const HEADING = 'text-xs uppercase tracking-[0.1em] text-ink-3';

export default function ResumePage() {
  return (
    <main className="grid grid-cols-1 px-4 pb-24 pt-16 sm:px-[5%] md:grid-cols-12 md:gap-x-6 md:pt-[72px]">
      <header className="flex flex-col gap-5 md:col-span-6 md:col-start-2">
        <h1 className="text-[44px] leading-[1.05] tracking-[-0.02em]">Connor Runnels</h1>
        <p className="max-w-[34em] text-[19px] leading-normal text-ink-2">{RESUME_INTRO}</p>
        <p className="text-[13px] text-ink-3">
          San Francisco · <a href="mailto:connorrunnels@gmail.com" className="hover:text-ink">connorrunnels@gmail.com</a> ·{' '}
          <a href="https://linkedin.com/in/connor-runnels" target="_blank" rel="noopener noreferrer" className="hover:text-ink">
            linkedin.com/in/connor-runnels
          </a>
        </p>
        <p className="max-w-[34em] border-l border-ink pl-4 text-base leading-relaxed">
          Ask my AI assistant about any of this: call{' '}
          <a href={`tel:${AGENT_PHONE_NUMBER.replace(/\s/g, '')}`} className="whitespace-nowrap underline underline-offset-4">
            {AGENT_PHONE_NUMBER}
          </a>
          . <OpenFeedButton>Watch the call under the hood</OpenFeedButton> as it happens: the transcript, tool calls, and latency.
        </p>
      </header>

      <section className="mt-20 md:col-span-10 md:col-start-2 md:mt-[88px]">
        <h2 className={`${HEADING} mb-3`}>Experience</h2>
        {JOBS.map((job, i) => (
          <details key={job.id} open={i === 1} className="group border-t border-rule last:border-b">
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
                  {role.points.map((point) => (
                    <p key={point} className="text-base leading-relaxed">
                      {point}
                    </p>
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
