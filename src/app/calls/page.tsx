'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AdminGate } from '@/components/voice/AdminGate';
import type { Call } from '@/lib/schema';

function CallList({ password }: { password: string }) {
  const [calls, setCalls] = useState<Call[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/voice/calls', { headers: { Authorization: `Bearer ${password}` } });
      if (!response.ok) {
        setError(`Couldn't load calls (${response.status}).`);
        return;
      }
      setCalls((await response.json()).calls);
    };
    load();
  }, [password]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!calls) return <p className="text-sm text-[var(--text-tertiary)]">Loading calls…</p>;
  if (calls.length === 0) {
    return <p className="text-sm text-[var(--text-secondary)]">No calls yet. Call the agent line and it will appear here.</p>;
  }

  return (
    <ul className="divide-y divide-[var(--border-light)] border-y border-[var(--border-light)]">
      {calls.map((call) => (
        <li key={call.callSid}>
          <Link href={`/calls/${call.callSid}`} className="grid grid-cols-[1fr_auto] gap-1 py-3 hover:opacity-70">
            <span className="text-sm">{new Date(call.startedAt).toLocaleString()}</span>
            <span className="text-xs text-[var(--text-tertiary)]">
              Path {call.path ?? '?'} · {call.durationSec != null ? `${call.durationSec}s` : call.endedAt ? 'ended' : 'live'}
            </span>
            <span className="col-span-2 font-mono text-xs text-[var(--text-tertiary)]">
              {call.callSid} · {call.model ?? 'model unknown'} · {call.endReason ?? ''}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function CallsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 font-sans">
      <h1 className="mb-6 font-serif text-3xl">Calls</h1>
      <AdminGate>{(password) => <CallList password={password} />}</AdminGate>
    </main>
  );
}
