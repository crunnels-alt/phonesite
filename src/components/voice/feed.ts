import type { FeedEvent } from '@/lib/voice';

export type CallState = 'waiting' | 'listening' | 'thinking' | 'tool' | 'speaking' | 'ended';

/** An RCS reading of how a caller turn was meant: the likeliest emotions with their confidence, and how likely it's sarcastic. */
export interface Tone {
  emotion: [string, number][];
  sarcasm: number | null;
  /** Measured from the caller's audio, not their words: words per second, and changes against their own level earlier in the call. */
  voice: { speechRate?: number; pitchChange?: number; pitchRange?: number; loudnessChange?: number };
}

export interface TranscriptEntry {
  id: string;
  role: 'caller' | 'agent' | 'system';
  text: string;
  /** Text the model wrote that the caller never heard, because they interrupted. */
  unheard?: string;
  blocked?: boolean;
  tone?: Tone;
  /** The RCS delivery tags the reply was voiced with, such as warm or laugh. */
  delivery?: string[];
  turn: number | null;
}

export interface ToolCall {
  tool: string;
  input: unknown;
  output?: unknown;
  error?: string;
  ms?: number;
  cancelled?: boolean;
}

export interface FeedState {
  state: CallState;
  model: string | null;
  transcript: TranscriptEntry[];
  toolCounts: Record<string, number>;
  lastTool: ToolCall | null;
  ttfts: number[];
  /** Speech-to-text and voice latency, which only stacks that run those stages themselves (Pipecat) report. */
  sttMs: number[];
  ttsMs: number[];
  /** The latest caller turn's tone, and its loudness every 100 ms, from 0 to 1. Pipecat only. */
  tone: Tone | null;
  levels: number[];
}

export const eventKey = (event: FeedEvent) => `${event.at}|${event.type}|${event.turn ?? ''}`;

const str = (value: unknown) => (typeof value === 'string' ? value : '');
const strings = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []);

function parseTone(data: Record<string, unknown>): Tone | null {
  const emotion = Array.isArray(data.emotion)
    ? data.emotion.filter((pair): pair is [string, number] => Array.isArray(pair) && typeof pair[0] === 'string' && typeof pair[1] === 'number')
    : [];
  if (!emotion.length) return null;
  const num = (value: unknown) => (typeof value === 'number' ? value : undefined);
  return {
    emotion,
    sarcasm: num(data.sarcasm) ?? null,
    voice: {
      speechRate: num(data.speech_rate),
      pitchChange: num(data.pitch_change),
      pitchRange: num(data.pitch_range),
      loudnessChange: num(data.loudness_change),
    },
  };
}

/** Whatever of `full` comes after `heard`, if `heard` is how `full` begins. All of it when nothing was heard. */
function unheardPart(full: string, heard: string): string {
  const prefix = heard.trimEnd();
  if (!prefix) return full.trim();
  return full.startsWith(prefix) ? full.slice(prefix.length).trim() : '';
}

/** Turns a call's public events into what the panel shows. Pure, so live calls and replays share it. */
export function buildFeed(events: FeedEvent[]): FeedState {
  const feed: FeedState = { state: 'waiting', model: null, transcript: [], toolCounts: {}, lastTool: null, ttfts: [], sttMs: [], ttsMs: [], tone: null, levels: [] };
  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at));

  sorted.forEach((event, index) => {
    const { data, turn } = event;
    const id = `${index}-${event.type}`;
    if (feed.state === 'waiting') feed.state = 'listening';

    switch (event.type) {
      case 'caller.final': {
        const last = feed.transcript.at(-1);
        // A late speech-to-text segment of the same question joins the caller's bubble.
        if (data.continues && last?.role === 'caller' && last.turn === turn) last.text = `${last.text} ${str(data.text)}`;
        else feed.transcript.push({ id, role: 'caller', text: str(data.text), turn });
        if (Array.isArray(data.levels) && !data.continues) feed.levels = data.levels.filter((level): level is number => typeof level === 'number');
        break;
      }
      case 'caller.tone': {
        const tone = parseTone(data);
        const entry = [...feed.transcript].reverse().find((e) => e.role === 'caller' && e.turn === turn);
        if (tone && entry) entry.tone = tone;
        if (tone) feed.tone = tone;
        break;
      }
      case 'agent.turn_start':
        feed.model = str(data.model) || feed.model;
        feed.state = 'thinking';
        break;
      case 'agent.first_token':
        if (typeof data.ttftMs === 'number') feed.ttfts.push(data.ttftMs);
        feed.state = 'speaking';
        break;
      case 'stt.latency':
        if (typeof data.ms === 'number') feed.sttMs.push(data.ms);
        break;
      case 'tts.latency':
        // Pipecat reports the model's first token once the reply is heard, so the voice starting marks speaking.
        if (typeof data.ms === 'number') feed.ttsMs.push(data.ms);
        feed.state = 'speaking';
        break;
      case 'tool.start': {
        const tool = str(data.tool);
        feed.toolCounts[tool] = (feed.toolCounts[tool] ?? 0) + 1;
        feed.lastTool = { tool, input: data.input };
        feed.state = 'tool';
        break;
      }
      case 'tool.end': {
        const { lastTool } = feed;
        if (lastTool && lastTool.tool === data.tool) {
          feed.lastTool = {
            ...lastTool,
            output: data.output,
            error: str(data.error) || undefined,
            ms: typeof data.ms === 'number' ? data.ms : undefined,
          };
        }
        feed.state = 'thinking';
        break;
      }
      case 'agent.reply_done':
        feed.transcript.push({ id, role: 'agent', text: str(data.text), delivery: strings(data.delivery), turn });
        feed.state = 'listening';
        break;
      case 'agent.reply_blocked':
        feed.transcript.push({ id, role: 'agent', text: str(data.spoken), blocked: true, turn });
        feed.state = 'listening';
        break;
      case 'agent.turn_cancel':
        if (feed.lastTool && feed.lastTool.output === undefined && !feed.lastTool.error) {
          feed.lastTool = { ...feed.lastTool, cancelled: true };
        }
        feed.state = 'listening';
        break;
      case 'caller.interrupt': {
        const heard = str(data.heard);
        if (data.generationFinished) {
          const reply = [...feed.transcript].reverse().find((entry) => entry.role === 'agent');
          if (reply) {
            const full = str(data.sent) || reply.text;
            reply.unheard = unheardPart(full, heard);
            reply.text = reply.unheard ? heard.trimEnd() : reply.text;
            if (strings(data.delivery).length) reply.delivery = strings(data.delivery);
          }
        } else if (heard || data.sent) {
          feed.transcript.push({ id, role: 'agent', text: heard.trimEnd(), unheard: unheardPart(str(data.sent), heard), delivery: strings(data.delivery), turn });
        }
        feed.state = 'listening';
        break;
      }
      case 'message.private':
        feed.transcript.push({ id, role: 'system', text: 'Taking a message · the next few turns stay private', turn });
        break;
      case 'pairing.claimed':
        feed.transcript.push({ id, role: 'system', text: 'Website connected', turn });
        break;
      case 'relay.closed':
      case 'call.completed':
        feed.state = 'ended';
        break;
    }
  });

  return feed;
}
