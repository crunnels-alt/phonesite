'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getPusherClient } from '@/lib/pusher-client';
import { cn } from '@/lib/cn';
import { AGENT_PHONE_NUMBER as VOICE_NUMBER } from '@/lib/sections';
import type { CallPath } from '@/lib/schema';
import type { FeedEvent } from '@/lib/voice';
import { buildFeed, eventKey } from './feed';
import type { CallState, ToolCall } from './feed';

/** Window event that opens the panel, so links elsewhere on the page can point at it. */
export const OPEN_FEED_EVENT = 'voice-feed:open';
const OPEN_KEY = 'voice-feed-open';
const STACK_KEY = 'voice-feed-stack';

/** The ways the same agent is built. A stack shows up here once it takes calls; LiveKit joins when it's built. */
const STACKS: { path: CallPath; label: string; line: string }[] = [
  { path: 'A', label: 'Twilio', line: 'Twilio hears and speaks. My code does the thinking.' },
  { path: 'B', label: 'Pipecat', line: 'My server does all of it: hearing, thinking, speaking.' },
];
const stackFor = (path: CallPath | null | undefined) => STACKS.find((stack) => stack.path === path) ?? STACKS[0];
// Long silences in a replay are shortened to this, so it stays watchable.
const MAX_REPLAY_GAP_MS = 3000;

interface Pairing {
  code: string;
  channel: string;
  path: CallPath;
  expiresAt: string;
}

interface Replay {
  callSid: string;
  path: CallPath | null;
  startedAt: string;
  durationSec: number | null;
}

type Mode = { kind: 'waiting' } | { kind: 'live'; callSid: string; path: CallPath } | { kind: 'replay'; callSid: string; path: CallPath };

const STATE_LABELS: Record<CallState, string> = {
  waiting: 'Waiting for a call',
  listening: 'Listening',
  thinking: 'Thinking',
  tool: 'Using a tool',
  speaking: 'Speaking',
  ended: 'Call ended',
};

const readStack = (): CallPath => {
  try {
    const saved = localStorage.getItem(STACK_KEY);
    return STACKS.some((stack) => stack.path === saved) ? (saved as CallPath) : 'A';
  } catch {
    return 'A';
  }
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

/** A row this stack can't fill. Kept visible so the difference between stacks shows. */
function Unavailable({ label, note, reason }: { label: string; note: string; reason: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 text-ink-3" title={reason}>
      <span>{label}</span>
      <span className="text-xs">{note}</span>
    </div>
  );
}

function LatencyRow({ label, values }: { label: string; values: number[] }) {
  const latest = values.at(-1);
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span>{label}</span>
      <span className="flex items-end gap-px" aria-hidden>
        {values.slice(-12).map((ms, i) => (
          <span key={i} className="w-1 bg-ink-3" style={{ height: `${Math.max(2, (ms / max) * 14)}px` }} />
        ))}
      </span>
      <span className="w-16 text-right tabular-nums">{latest !== undefined ? `${latest} ms` : '—'}</span>
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
  const [stack, setStack] = useState<CallPath>('A');
  const [mode, setMode] = useState<Mode>({ kind: 'waiting' });
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [pairingError, setPairingError] = useState('');
  const [replays, setReplays] = useState<Replay[]>([]);
  const replayTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const transcriptEnd = useRef<HTMLDivElement>(null);

  const feed = useMemo(() => buildFeed(events), [events]);

  useEffect(() => {
    setOpen(readOpen());
    setStack(readStack());
  }, []);

  // A code belongs to one stack, so picking another one fetches a fresh code.
  const pickStack = (path: CallPath) => {
    if (path === stack) return;
    try {
      localStorage.setItem(STACK_KEY, path);
    } catch {}
    setStack(path);
    setPairing(null);
  };

  useEffect(() => {
    const show = () => {
      setOpen(true);
      try {
        localStorage.setItem(OPEN_KEY, 'true');
      } catch {}
    };
    window.addEventListener(OPEN_FEED_EVENT, show);
    return () => window.removeEventListener(OPEN_FEED_EVENT, show);
  }, []);

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
      const response = await fetch('/api/voice/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: stack }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setPairing(await response.json());
    } catch {
      setPairingError("Couldn't get a code. Reload to try again.");
    }
  }, [stack]);

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
    channel.bind('paired', ({ callSid, path }: { callSid: string; path?: CallPath }) => {
      stopReplay();
      setEvents([]);
      setMode({ kind: 'live', callSid, path: path ?? pairing.path });
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

  const playReplay = async (callSid: string, path: CallPath | null) => {
    stopReplay();
    const response = await fetch(`/api/voice/replays/${callSid}`);
    if (!response.ok) return;
    const { events: recorded } = (await response.json()) as { events: FeedEvent[] };
    setEvents([]);
    setMode({ kind: 'replay', callSid, path: path ?? 'A' });
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
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 border-y border-l border-ink bg-background px-3 py-5 text-xs uppercase tracking-[0.1em] text-ink [writing-mode:vertical-rl] hover:bg-ink hover:text-background"
      >
        Call my AI · under the hood
      </button>
    );
  }

  const current = stackFor(mode.kind === 'waiting' ? stack : mode.path);
  // Every stack except Twilio runs its own speech to text and text to speech, so it can time them.
  const runsOwnSpeech = current.path !== 'A';

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
            {current.label}
            {feed.model ? ` · ${feed.model}` : ''}
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
            {STACKS.length > 1 && (
              <div>
                <div role="tablist" aria-label="Which build answers your call" className="flex gap-5">
                  {STACKS.map((option) => (
                    <button
                      key={option.path}
                      type="button"
                      role="tab"
                      aria-selected={option.path === stack}
                      onClick={() => pickStack(option.path)}
                      className={cn(
                        'border-b pb-1 text-[15px]',
                        option.path === stack ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[13px] text-ink-2">{current.line}</p>
              </div>
            )}
            <div>
              <p className="text-lg leading-snug">
                Call <span className="whitespace-nowrap">{VOICE_NUMBER}</span> and type this code on the keypad right away to watch your call here.
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
                      <button type="button" onClick={() => playReplay(replay.callSid, replay.path)} className="text-left underline-offset-2 hover:underline">
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
          <SectionLabel>Latency · time to first result</SectionLabel>
          {runsOwnSpeech ? (
            <LatencyRow label="Speech to text" values={feed.sttMs} />
          ) : (
            <Unavailable label="Speech to text" note="Not on Twilio" reason="Twilio transcribes the audio and doesn't report how long it took." />
          )}
          <LatencyRow label="Language model" values={feed.ttfts} />
          {runsOwnSpeech ? (
            <LatencyRow label="Text to speech" values={feed.ttsMs} />
          ) : (
            <Unavailable label="Text to speech" note="Not on Twilio" reason="Twilio turns the reply into speech and doesn't report how long it took." />
          )}
        </div>

        <div>
          <SectionLabel>Caller tone and audio</SectionLabel>
          <Unavailable
            label="Tone and emotion"
            note={runsOwnSpeech ? 'Not shown yet' : 'Not on Twilio'}
            reason={runsOwnSpeech ? `${current.label} has the audio; reading tone from it is still to come.` : "Twilio sends the words, not the audio, so there's nothing to read tone from."}
          />
          <Unavailable
            label="Waveform"
            note={runsOwnSpeech ? 'Not shown yet' : 'Not on Twilio'}
            reason={runsOwnSpeech ? `${current.label} has the audio; drawing it is still to come.` : 'Twilio keeps the audio.'}
          />
        </div>
      </div>
    </aside>
  );
}
