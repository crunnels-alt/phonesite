'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPusherClient } from '@/lib/pusher-client';
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
    <div className="mb-2 flex items-baseline justify-between text-[11px] uppercase tracking-[0.1em] text-ink-3">
      <span>{children}</span>
      {note && <span className="normal-case tracking-normal">{note}</span>}
    </div>
  );
}

/** A row this path can't fill. Kept visible so the difference between paths shows. */
function PathBOnly({ label, reason }: { label: string; reason: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-ink-3" title={reason}>
      <span>{label}</span>
      <span className="text-xs">Path B only</span>
    </div>
  );
}

function LastTool({ call }: { call: ToolCall }) {
  const result = call.cancelled ? 'cancelled' : call.error ? `error: ${call.error}` : call.output !== undefined ? formatValue(call.output) : '…';
  return (
    <p className="mt-2 break-words text-[13px] leading-relaxed text-ink-2">
      {call.tool}({formatValue(call.input)}) <span className="text-ink-3">→</span>{' '}
      <span className={cn(call.cancelled && 'text-ink-3')}>{result}</span>
      {call.ms !== undefined && <span className="text-ink-3"> · {(call.ms / 1000).toFixed(1)}s</span>}
    </p>
  );
}

export function LiveFeedPanel() {
  const [open, setOpen] = useState(false);
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
    const pusher = getPusherClient();
    const channel = pusher.subscribe(pairing.channel);
    channel.bind('paired', ({ callSid }: { callSid: string }) => {
      stopReplay();
      setEvents([]);
      setMode({ kind: 'live', callSid });
    });
    channel.bind('events', ({ events: incoming }: { callSid: string; events: FeedEvent[] }) => addEvents(incoming));
    return () => {
      pusher.unsubscribe(pairing.channel);
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
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 bg-background px-3 py-4 text-xs uppercase tracking-[0.1em] text-ink-3 [writing-mode:vertical-rl] hover:text-ink"
      >
        Under the hood
      </button>
    );
  }

  const latestTtft = feed.ttfts.at(-1);
  const maxTtft = Math.max(...feed.ttfts, 1);

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-rule bg-background text-sm sm:w-[380px]">
      <header className="px-5 pb-3 pt-6">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.1em] text-ink-3">Under the hood</span>
          <button type="button" onClick={toggle} className="text-[13px] text-ink-3 hover:text-ink">
            Hide
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[13px] text-ink-2">
            Path A · Twilio ConversationRelay{feed.model ? ` · ${feed.model}` : ''}
          </span>
          <span
            className={cn(
              'shrink-0 text-[13px]',
              feed.state === 'speaking' || feed.state === 'tool' ? 'text-ink' : 'text-ink-3'
            )}
          >
            {mode.kind === 'replay' && feed.state !== 'ended' ? 'Replay · ' : ''}
            {STATE_LABELS[feed.state]}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {mode.kind === 'waiting' && (
          <div className="space-y-6">
            <div>
              <p className="text-lg leading-snug">
                Call <span className="whitespace-nowrap">{VOICE_NUMBER}</span>, then type this code on the keypad to watch your call here.
              </p>
              <p className="mt-4 text-[40px] tabular-nums tracking-[0.2em]">{pairing?.code ?? '····'}</p>
              {pairingError && <p role="alert" className="mt-2 text-[13px] text-ink">{pairingError}</p>}
            </div>
            {replays.length > 0 && (
              <div>
                <SectionLabel>Or watch a sample call</SectionLabel>
                <ul className="space-y-1">
                  {replays.map((replay) => (
                    <li key={replay.callSid}>
                      <button type="button" onClick={() => playReplay(replay.callSid)} className="text-left underline-offset-2 hover:underline">
                        {new Date(replay.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {replay.durationSec != null && <span className="text-ink-3"> · {replay.durationSec}s</span>}
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
                <p key={entry.id} className="text-center text-xs text-ink-3">
                  {entry.text}
                </p>
              ) : (
                <div key={entry.id} className={cn(entry.role === 'caller' && 'pl-8 text-right')}>
                  <div className="mb-0.5 text-[11px] uppercase tracking-[0.1em] text-ink-3">
                    {entry.role === 'caller' ? 'Caller' : 'Agent'}
                  </div>
                  <p className="text-base leading-snug">
                    {entry.text}
                    {entry.unheard && (
                      <span className="text-ink-3" title="Written by the model but not heard: the caller interrupted">
                        {' '}
                        {entry.unheard}
                      </span>
                    )}
                  </p>
                  {entry.blocked && <p className="mt-0.5 text-xs text-ink-3">Rest of reply blocked by the output guard</p>}
                  {entry.unheard && <p className="mt-0.5 text-xs text-ink-3">Grey text was cut off by the caller</p>}
                </div>
              )
            )}
            <div ref={transcriptEnd} />
            {(feed.state === 'ended' || mode.kind === 'replay') && (
              <button type="button" onClick={startOver} className="text-[13px] text-ink-2 underline underline-offset-4 hover:text-ink">
                {mode.kind === 'replay' ? 'Back' : 'Start over'}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-5 border-t border-rule px-5 py-5">
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
                <span key={i} className="w-1 bg-ink-3" style={{ height: `${Math.max(2, (ms / maxTtft) * 14)}px` }} />
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
