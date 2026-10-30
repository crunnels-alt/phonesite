'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { AdminGate } from '@/components/voice/AdminGate';
import { cn } from '@/lib/cn';
import type { Call, CallEvent } from '@/lib/schema';

const SOURCE_STYLES: Record<string, string> = {
  twilio: 'bg-red-50 text-red-800',
  runtime: 'bg-teal-50 text-teal-800',
  console: 'bg-violet-50 text-violet-800',
  page: 'bg-blue-50 text-blue-800',
};

/** The most useful single line for an event; falls back to compact JSON. */
function summarize(event: CallEvent): string {
  const data = event.data as Record<string, unknown>;
  const text = data.text ?? data.userText ?? data.heard ?? data.description ?? data.error;
  if (typeof text === 'string') return text;
  const entries = Object.entries(data).filter(([, value]) => value !== null && value !== undefined);
  return entries.length ? JSON.stringify(Object.fromEntries(entries)) : '';
}

function Timeline({ sid, password }: { sid: string; password: string }) {
  const [call, setCall] = useState<Call | null>(null);
  const [events, setEvents] = useState<CallEvent[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/api/voice/calls/${sid}`, { headers: { Authorization: `Bearer ${password}` } });
      if (!response.ok) {
        setError(response.status === 404 ? 'No call with that ID.' : `Couldn't load the call (${response.status}).`);
        return;
      }
      const body = await response.json();
      setCall(body.call);
      setEvents(body.events);
    };
    load();
  }, [sid, password]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!call) return <p className="text-sm text-[var(--text-tertiary)]">Loading call…</p>;

  const start = events.length ? new Date(events[0].at).getTime() : new Date(call.startedAt).getTime();

  return (
    <>
      <p className="mb-6 font-mono text-xs text-[var(--text-tertiary)]">
        {call.callSid} · Path {call.path ?? '?'} · {call.model ?? 'model unknown'} ·{' '}
        {call.durationSec != null ? `${call.durationSec}s` : 'no duration yet'} · {call.endReason ?? 'no end reason yet'}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs text-[var(--text-tertiary)]">
            <tr className="border-b border-[var(--border-light)]">
              <th className="py-2 pr-3 font-normal">+ms</th>
              <th className="py-2 pr-3 font-normal">Source</th>
              <th className="py-2 pr-3 font-normal">Stage</th>
              <th className="py-2 pr-3 font-normal">Event</th>
              <th className="py-2 pr-3 font-normal">Turn</th>
              <th className="py-2 font-normal">Detail</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b border-[var(--border-light)] align-top">
                <td className="py-2 pr-3 font-mono text-xs tabular-nums">{new Date(event.at).getTime() - start}</td>
                <td className="py-2 pr-3">
                  <span className={cn('rounded px-1.5 py-0.5 text-xs', SOURCE_STYLES[event.source])}>{event.source}</span>
                </td>
                <td className="py-2 pr-3 text-xs text-[var(--text-secondary)]">{event.stage}</td>
                <td className="py-2 pr-3 font-mono text-xs">
                  {event.type}
                  {event.visibility === 'private' && <span className="ml-1 text-[var(--text-tertiary)]">(private)</span>}
                </td>
                <td className="py-2 pr-3 font-mono text-xs">{event.turn ?? ''}</td>
                <td className="py-2 break-words">{summarize(event)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function CallPage({ params }: { params: Promise<{ sid: string }> }) {
  const { sid } = use(params);
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 font-sans">
      <Link href="/calls" className="text-xs text-[var(--text-tertiary)] hover:underline">
        All calls
      </Link>
      <h1 className="mb-2 mt-2 font-serif text-3xl">Call timeline</h1>
      <AdminGate>{(password) => <Timeline sid={sid} password={password} />}</AdminGate>
    </main>
  );
}
