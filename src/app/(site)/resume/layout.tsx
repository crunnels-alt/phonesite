import { LiveFeedPanel } from '@/components/voice/LiveFeedPanel';

// The voice agent's live feed sits beside the resume, since that's what callers to the agent line ask about.
export default function ResumeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <LiveFeedPanel />
    </>
  );
}
