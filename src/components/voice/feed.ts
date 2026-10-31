import type { FeedEvent } from '@/lib/voice';

export type CallState = 'waiting' | 'listening' | 'thinking' | 'tool' | 'speaking' | 'ended';

export interface TranscriptEntry {
  id: string;
  role: 'caller' | 'agent' | 'system';
  text: string;
  /** Text the model wrote that the caller never heard, because they interrupted. */
  unheard?: string;
  blocked?: boolean;
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
}

export const eventKey = (event: FeedEvent) => `${event.at}|${event.type}|${event.turn ?? ''}`;

const str = (value: unknown) => (typeof value === 'string' ? value : '');

/** Whatever of `full` comes after `heard`, if `heard` is how `full` begins. */
function unheardPart(full: string, heard: string): string {
  const prefix = heard.trimEnd();
  return prefix && full.startsWith(prefix) ? full.slice(prefix.length).trim() : '';
}

/** Turns a call's public events into what the panel shows. Pure, so live calls and replays share it. */
export function buildFeed(events: FeedEvent[]): FeedState {
  const feed: FeedState = { state: 'waiting', model: null, transcript: [], toolCounts: {}, lastTool: null, ttfts: [] };
  const sorted = [...events].sort((a, b) => a.at.localeCompare(b.at));

  sorted.forEach((event, index) => {
    const { data, turn } = event;
    const id = `${index}-${event.type}`;
    if (feed.state === 'waiting') feed.state = 'listening';

    switch (event.type) {
      case 'caller.final':
        feed.transcript.push({ id, role: 'caller', text: str(data.text), turn });
        break;
      case 'agent.turn_start':
        feed.model = str(data.model) || feed.model;
        feed.state = 'thinking';
        break;
      case 'agent.first_token':
        if (typeof data.ttftMs === 'number') feed.ttfts.push(data.ttftMs);
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
        feed.transcript.push({ id, role: 'agent', text: str(data.text), turn });
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
          }
        } else if (heard || data.sent) {
          feed.transcript.push({ id, role: 'agent', text: heard.trimEnd(), unheard: unheardPart(str(data.sent), heard), turn });
        }
        feed.state = 'listening';
        break;
      }
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
