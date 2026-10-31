import { pgTable, text, integer, timestamp, uuid, jsonb, index, boolean } from 'drizzle-orm/pg-core';

// Photos table
export const photos = pgTable('photos', {
  id: uuid('id').primaryKey(),
  url: text('url').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull().default(''), // Caption/blurb for the photo
  location: text('location').notNull().default(''),
  date: text('date').notNull(),
  width: integer('width').notNull().default(1600),
  height: integer('height').notNull().default(1200),
  blurDataUrl: text('blur_data_url'), // Base64 blur placeholder for fast loading
  uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  groupId: text('group_id'), // UUID for grouping batch uploads
  groupName: text('group_name'), // Display name for the group (used in URL slug)
  position: jsonb('position').$type<{
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
  }>(),
});

// Projects table
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  excerpt: text('excerpt').notNull(),
  tech: text('tech').notNull().default(''),
  year: text('year').notNull(),
  status: text('status').notNull(),
  position: jsonb('position').$type<{
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
  }>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Writings table
export const writings = pgTable('writings', {
  id: uuid('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  excerpt: text('excerpt').notNull(),
  date: text('date').notNull(),
  category: text('category').notNull().default('GENERAL'),
  position: jsonb('position').$type<{
    x: number;
    y: number;
    size: 'small' | 'medium' | 'large';
  }>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Readwise Books table (sources: kindle, web articles, podcasts, etc.)
export const readwiseBooks = pgTable('readwise_books', {
  id: integer('id').primaryKey(), // Readwise's book ID
  title: text('title').notNull(),
  author: text('author').notNull().default(''),
  category: text('category').notNull().default(''), // books, articles, podcasts, etc.
  source: text('source').notNull().default(''), // kindle, web, etc.
  coverImageUrl: text('cover_image_url'),
  sourceUrl: text('source_url'),
  asin: text('asin'),
  numHighlights: integer('num_highlights').notNull().default(0),
  lastHighlightAt: timestamp('last_highlight_at'),
  tags: jsonb('tags').$type<{ id: number; name: string }[]>().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Readwise Highlights table
export const readwiseHighlights = pgTable('readwise_highlights', {
  id: integer('id').primaryKey(), // Readwise's highlight ID
  bookId: integer('book_id').notNull().references(() => readwiseBooks.id),
  text: text('text').notNull(),
  note: text('note').default(''),
  location: integer('location'),
  locationType: text('location_type').default(''),
  highlightedAt: timestamp('highlighted_at'),
  url: text('url'),
  color: text('color').default('yellow'),
  tags: jsonb('tags').$type<{ id: number; name: string }[]>().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Contact messages table
export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  read: timestamp('read_at'),
});

// Phone navigation sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  callSid: text('call_sid').notNull().unique(), // Twilio's call identifier
  phoneNumberHash: text('phone_number_hash'), // Hashed for privacy
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
});

// Session events - what content was viewed during a session
export const sessionEvents = pgTable('session_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id),
  section: text('section').notNull(), // home, projects, photos, writing, reading, listening
  contentType: text('content_type'), // photo, project, writing, highlight, photoGroup
  contentIds: jsonb('content_ids').$type<string[]>().default([]), // IDs of visible items
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

// --- Voice agent (voice-relay-lab) ---

export type CallPath = 'A' | 'B' | 'C';
export type EventSource = 'twilio' | 'runtime' | 'console' | 'page';
export type EventStage = 'phone' | 'stt' | 'turn' | 'llm' | 'tool' | 'tts' | 'rcs' | 'control';
export type EventVisibility = 'public' | 'private';

// People who have called the agent line. Matched by a keyed hash of their number.
export const callers = pgTable('callers', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneHash: text('phone_hash').notNull().unique(),
  name: text('name'),
  notes: text('notes').notNull().default(''),
  callCount: integer('call_count').notNull().default(0),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
});

export const calls = pgTable('calls', {
  callSid: text('call_sid').primaryKey(),
  callerId: uuid('caller_id').references(() => callers.id),
  path: text('path').$type<CallPath>(),
  toNumber: text('to_number'),
  model: text('model'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  endReason: text('end_reason'),
  durationSec: integer('duration_sec'),
  summary: text('summary'),
  intent: text('intent'),
  handoff: jsonb('handoff').$type<Record<string, unknown>>(),
  recordingSid: text('recording_sid'),
  sessionId: uuid('session_id').references(() => sessions.id),
  // Featured calls are Connor's own sample calls, replayed publicly in the live feed.
  featured: boolean('featured').notNull().default(false),
});

// One row per thing that happened on a call, from any system. Drives the timeline and live feed.
export const callEvents = pgTable(
  'call_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    callSid: text('call_sid').notNull().references(() => calls.callSid),
    at: timestamp('at', { withTimezone: true, precision: 3 }).notNull(),
    source: text('source').$type<EventSource>().notNull(),
    stage: text('stage').$type<EventStage>().notNull(),
    visibility: text('visibility').$type<EventVisibility>().notNull().default('private'),
    type: text('type').notNull(),
    turn: integer('turn'),
    data: jsonb('data').$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => [index('call_events_call_sid_at_idx').on(t.callSid, t.at)]
);

export const callTranscripts = pgTable('call_transcripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  callSid: text('call_sid').notNull().references(() => calls.callSid),
  kind: text('kind').$type<'live' | 'post'>().notNull(),
  provider: text('provider'),
  segments: jsonb('segments')
    .$type<{ speaker: 'caller' | 'agent'; text: string; startMs?: number; endMs?: number }[]>()
    .notNull()
    .default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  callSid: text('call_sid').references(() => calls.callSid),
  callerId: uuid('caller_id').references(() => callers.id),
  name: text('name'),
  callbackNumber: text('callback_number'),
  body: text('body').notNull(),
  urgency: text('urgency').$type<'low' | 'normal' | 'high'>().notNull().default('normal'),
  status: text('status').$type<'new' | 'read' | 'done'>().notNull().default('new'),
  todoistTaskId: text('todoist_task_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// A browser showing a code, waiting for a caller to type it. Claiming links the browser's channel to a call.
export const voicePairings = pgTable(
  'voice_pairings',
  {
    channel: text('channel').primaryKey(),
    code: text('code').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    callSid: text('call_sid'),
    claimedAt: timestamp('claimed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('voice_pairings_code_idx').on(t.code), index('voice_pairings_call_sid_idx').on(t.callSid)]
);

// The only facts the agent may say about Connor. Every row is reviewed by Connor.
export const agentProfile = pgTable('agent_profile', {
  id: uuid('id').primaryKey().defaultRandom(),
  topic: text('topic').notNull(),
  body: text('body').notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Export types
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Writing = typeof writings.$inferSelect;
export type NewWriting = typeof writings.$inferInsert;

export type ReadwiseBook = typeof readwiseBooks.$inferSelect;
export type NewReadwiseBook = typeof readwiseBooks.$inferInsert;

export type ReadwiseHighlight = typeof readwiseHighlights.$inferSelect;
export type NewReadwiseHighlight = typeof readwiseHighlights.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type SessionEvent = typeof sessionEvents.$inferSelect;
export type NewSessionEvent = typeof sessionEvents.$inferInsert;

export type Caller = typeof callers.$inferSelect;
export type Call = typeof calls.$inferSelect;
export type CallEvent = typeof callEvents.$inferSelect;
export type NewCallEvent = typeof callEvents.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type AgentProfileEntry = typeof agentProfile.$inferSelect;
export type VoicePairing = typeof voicePairings.$inferSelect;
