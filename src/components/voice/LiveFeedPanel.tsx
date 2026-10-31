'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import { cn } from '@/lib/cn';
import type { FeedEvent } from '@/lib/voice';
import { buildFeed, eventKey } from './feed';
import type { CallState, ToolCall } from './feed';

const VOICE_NUMBER = '+1 646 941 7945';
const OPEN_KEY = 'voice-feed-open';
// Long silences in a replay are shortened to this, so it stays watchable.
const MAX_REPLAY_GAP_MS = 3000;

interface Pairing {
  code: string;
  channel: string;
  expiresAt: string;
}

interface Replay {
  callSid: string;
  startedAt: string;
  durationSec: number | null;
}

type Mode = { kind: 'waiting' } | { kind: 'live'; callSid: string } | { kind: 'replay'; callSid: string };

const STATE_LABELS: Record<CallState, string> = {
  waiting: 'Waiting for a call',
  listening: 'Listening',
  thinking: 'Thinking',
  tool: 'Using a tool',
  speaking: 'Speaking',
  ended: 'Call ended',
};

const readOpen = () => {
  try {
    return localStorage.getItem(OPEN_KEY) !== 'false';
  } catch {
    return true;
  }
};

const formatValue = (value: unknown) =>
  value && typeof value === 'object'
    ? Object.entries(value as Record<string, unknown>)
        .map(([key, v]) => `${key}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
        .join(', ')
    : String(value ?? '');

function SectionLabel({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
      <span>{children}</span>
      {note && <span className="normal-case tracking-normal">{note}</span>}
    </div>
  );
}

/** A row this path can't fill. Kept visible so the difference between paths shows. */
function PathBOnly({ label, reason }: { label: string; reason: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-[var(--text-tertiary)]" title={reason}>
      <span>{label}</span>
      <span className="text-xs">Path B only</span>
    </div>
  );
}

function LastTool({ call }: { call: ToolCall }) {
  const result = call.cancelled ? 'cancelled' : call.error ? `error: ${call.error}` : call.output !== undefined ? formatValue(call.output) : '…';
  return (
    <p className="mt-2 break-words font-mono text-xs leading-relaxed">
      {call.tool}({formatValue(call.input)}) <span className="text-[var(--text-tertiary)]">→</span>{' '}
      <span className={cn(call.cancelled && 'text-[var(--text-tertiary)]')}>{result}</span>
      {call.ms !== undefined && <span className="text-[var(--text-tertiary)]"> · {(call.ms / 1000).toFixed(1)}s</span>}
    </p>
  );
}

export function LiveFeedPanel() {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<Mode>({ kind: 'waiting' });
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [pairingError, setPairingError] = useState('');
  const [replays, setReplays] = useState<Replay[]>([]);
  const replayTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const transcriptEnd = useRef<HTMLDivElement>(null);

  const feed = useMemo(() => buildFeed(events), [events]);

  useEffect(() => setOpen(readOpen()), []);

  const toggle = () => {
    setOpen((current) => {
      try {
        localStorage.setItem(OPEN_KEY, String(!current));
      } catch {}
      return !current;
    });
  };

  const addEvents = useCallback((incoming: FeedEvent[]) => {
    setEvents((current) => {
      const seen = new Set(current.map(eventKey));
      const fresh = incoming.filter((event) => !seen.has(eventKey(event)));
      return fresh.length ? [...current, ...fresh] : current;
    });
  }, []);

  const stopReplay = () => {
    replayTimers.current.forEach(clearTimeout);
    replayTimers.current = [];
  };

  const requestPairing = useCallback(async () => {
    setPairingError('');
    try {
      const response = await fetch('/api/voice/pair', { method: 'POST' });
      if (!response.ok) throw new Error(String(response.status));
      setPairing(await response.json());
    } catch {
      setPairingError("Couldn't get a code. Reload to try again.");
    }
  }, []);

  useEffect(() => {
    if (open && mode.kind === 'waiting' && !pairing) requestPairing();
  }, [open, mode.kind, pairing, requestPairing]);

  // Codes expire after ten minutes; fetch a fresh one if nobody has used it.
  useEffect(() => {
    if (!pairing || mode.kind !== 'waiting') return;
    const timer = setTimeout(() => setPairing(null), new Date(pairing.expiresAt).getTime() - Date.now());
    return () => clearTimeout(timer);
  }, [pairing, mode.kind]);

  useEffect(() => {
    if (!pairing) return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
    const channel = pusher.subscribe(pairing.channel);
    channel.bind('paired', ({ callSid }: { callSid: string }) => {
      stopReplay();
      setEvents([]);
      setMode({ kind: 'live', callSid });
    });
    channel.bind('events', ({ events: incoming }: { callSid: string; events: FeedEvent[] }) => addEvents(incoming));
    return () => {
      pusher.unsubscribe(pairing.channel);
      pusher.disconnect();
    };
  }, [pairing, addEvents]);

  useEffect(() => {
    fetch('/api/voice/replays')
      .then((response) => (response.ok ? response.json() : { replays: [] }))
      .then((body) => setReplays(body.replays))
      .catch(() => setReplays([]));
  }, []);

  useEffect(() => stopReplay, []);

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ block: 'end' });
  }, [feed.transcript.length]);

  const playReplay = async (callSid: string) => {
    stopReplay();
    const response = await fetch(`/api/voice/replays/${callSid}`);
    if (!response.ok) return;
    const { events: recorded } = (await response.json()) as { events: FeedEvent[] };
    setEvents([]);
    setMode({ kind: 'replay', callSid });
    let delay = 0;
    let previous = recorded.length ? new Date(recorded[0].at).getTime() : 0;
    for (const event of recorded) {
      const at = new Date(event.at).getTime();
      delay += Math.min(at - previous, MAX_REPLAY_GAP_MS);
      previous = at;
      replayTimers.current.push(setTimeout(() => addEvents([event]), delay));
    }
  };

  const startOver = () => {
    stopReplay();
    setEvents([]);
    setPairing(null);
    setMode({ kind: 'waiting' });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l border border-r-0 border-[var(--border-light)] bg-white px-2 py-3 font-sans text-[11px] uppercase tracking-[0.08em] text-[var(--text-secondary)] [writing-mode:vertical-rl] hover:text-[var(--foreground)]"
      >
        Under the hood
      </button>
    );
  }

  const latestTtft = feed.ttfts.at(-1);
  const maxTtft = Math.max(...feed.ttfts, 1);

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-[var(--border-light)] bg-white font-sans text-sm sm:w-[380px]">
      <header className="border-b border-[var(--border-light)] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-secondary)]">Under the hood</span>
          <button type="button" onClick={toggle} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--foreground)]">
            Hide
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-[var(--text-secondary)]">
            Path A · Twilio ConversationRelay{feed.model ? ` · ${feed.model}` : ''}
          </span>
          <span
            className={cn(
              'shrink-0 rounded-full border px-2 py-0.5 text-[11px]',
              feed.state === 'speaking' || feed.state === 'tool'
                ? 'border-[var(--foreground)] text-[var(--foreground)]'
                : 'border-[var(--border-light)] text-[var(--text-secondary)]'
            )}
          >
            {mode.kind === 'replay' && feed.state !== 'ended' ? 'Replay · ' : ''}
            {STATE_LABELS[feed.state]}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {mode.kind === 'waiting' && (
          <div className="space-y-6">
            <div>
              <p className="font-serif text-lg leading-snug">
                Call <span className="whitespace-nowrap">{VOICE_NUMBER}</span>, then type this code on the keypad to watch your call here.
              </p>
              <p className="mt-3 font-mono text-3xl tracking-[0.3em]">{pairing?.code ?? '····'}</p>
              {pairingError && <p className="mt-2 text-xs text-red-600">{pairingError}</p>}
            </div>
            {replays.length > 0 && (
              <div>
                <SectionLabel>Or watch a sample call</SectionLabel>
                <ul className="space-y-1">
                  {replays.map((replay) => (
                    <li key={replay.callSid}>
                      <button type="button" onClick={() => playReplay(replay.callSid)} className="text-left underline-offset-2 hover:underline">
                        {new Date(replay.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {replay.durationSec != null && <span className="text-[var(--text-tertiary)]"> · {replay.durationSec}s</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {mode.kind !== 'waiting' && (
          <div className="space-y-4">
            {feed.transcript.map((entry) =>
              entry.role === 'system' ? (
                <p key={entry.id} className="text-center text-xs text-[var(--text-tertiary)]">
                  {entry.text}
                </p>
              ) : (
                <div key={entry.id} className={cn(entry.role === 'caller' && 'pl-8 text-right')}>
                  <div className="mb-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                    {entry.role === 'caller' ? 'Caller' : 'Agent'}
                  </div>
                  <p className="font-serif text-base leading-snug">
                    {entry.text}
                    {entry.unheard && (
                      <span className="text-[var(--text-tertiary)]" title="Written by the model but not heard: the caller interrupted">
                        {' '}
                        {entry.unheard}
                      </span>
                    )}
                  </p>
                  {entry.blocked && <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Rest of reply blocked by the output guard</p>}
                  {entry.unheard && <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">Grey text was cut off by the caller</p>}
                </div>
              )
            )}
            <div ref={transcriptEnd} />
            {(feed.state === 'ended' || mode.kind === 'replay') && (
              <button type="button" onClick={startOver} className="text-xs text-[var(--text-secondary)] underline-offset-2 hover:underline">
                {mode.kind === 'replay' ? 'Back' : 'Start over'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 border-t border-[var(--border-light)] px-4 py-4">
        <div>
          <SectionLabel note={feed.lastTool ? undefined : 'none yet'}>Tool calls</SectionLabel>
          {Object.entries(feed.toolCounts).map(([tool, count]) => (
            <div key={tool} className="flex justify-between py-0.5">
              <span>{tool}</span>
              <span className="tabular-nums">{count}</span>
            </div>
          ))}
          {feed.lastTool && <LastTool call={feed.lastTool} />}
        </div>

        <div>
          <SectionLabel>Latency · time to first token</SectionLabel>
          <PathBOnly label="Speech to text" reason="Twilio transcribes the audio and doesn't report how long it took." />
          <div className="flex items-center justify-between gap-3 py-1">
            <span>Language model</span>
            <span className="flex items-end gap-px" aria-hidden>
              {feed.ttfts.slice(-12).map((ms, i) => (
                <span key={i} className="w-1 bg-[var(--text-tertiary)]" style={{ height: `${Math.max(2, (ms / maxTtft) * 14)}px` }} />
              ))}
            </span>
            <span className="w-16 text-right tabular-nums">{latestTtft !== undefined ? `${latestTtft} ms` : '—'}</span>
          </div>
          <PathBOnly label="Text to speech" reason="Twilio turns the reply into speech and doesn't report how long it took." />
        </div>

        <div>
          <SectionLabel>Caller tone and audio</SectionLabel>
          <PathBOnly label="Tone and emotion" reason="Twilio sends the words, not the audio, so there's nothing to read tone from." />
          <PathBOnly label="Waveform" reason="Twilio keeps the audio." />
        </div>
      </div>
    </aside>
  );
}
