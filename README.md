# Phone-Controlled Portfolio Website

A portfolio website with two phone lines. Call the keypad line and use your dial pad to move around the site in real time, or call the AI agent line and talk to an assistant while the site shows the call live. Built with Next.js, Twilio, Pusher, and Vercel Postgres.

Live at [crunnels.online](https://www.crunnels.online).

## Features

- **Keypad navigation**: call the site's number and press digits to change the page every open browser is showing
- **Real-time updates**: Pusher websockets push each key press to the site as it happens
- **Pages**: Home, About, Resume, Photo (with photo groups), Reading, Listening
- **Contact form**: messages are stored in Postgres and emailed through Resend
- **Photo gallery**: uploads to Vercel Blob, with dimensions detected by Sharp
- **Reading**: Readwise highlights synced to Postgres daily by a Vercel cron, plus a bookshelf that merges Readwise books with a Goodreads export (`src/content/goodreads.ts`), with covers from Open Library
- **Listening**: an Apple Music playlist when configured, otherwise top albums from Last.fm
- **AI agent line**: a voice agent on its own number, with a live "under the hood" feed panel on the site (see below)
- **Admin**: a password-protected panel for photos, contact messages, and webhook testing, plus private call timelines for the agent line

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4
- **Backend**: Next.js API routes
- **Database**: Vercel Postgres with Drizzle ORM
- **Storage**: Vercel Blob (photos)
- **Cache and rate limiting**: Upstash Redis, provisioned as Vercel KV
- **Real-time**: Pusher
- **Telephony**: Twilio
- **Email**: Resend

## Getting Started

### Prerequisites

- Node.js 20+
- A Vercel account (Postgres, Blob, and optionally KV)

### Environment Variables

Create a `.env.local` file (or run `vercel env pull .env.local` once the project is linked):

```bash
# Database
POSTGRES_URL=                 # Vercel Postgres connection string

# Vercel Blob
BLOB_READ_WRITE_TOKEN=        # Photo uploads

# Vercel KV / Upstash Redis (optional: rate limiting and the Last.fm cache)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Twilio
TWILIO_AUTH_TOKEN=            # Verifies that webhooks really came from Twilio

# Pusher
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# Readwise (optional)
READWISE_ACCESS_TOKEN=        # From https://readwise.io/access_token
CRON_SECRET=                  # Vercel cron auth for /api/cron/readwise

# Listening (optional; Apple Music first, Last.fm as the fallback)
APPLE_MUSIC_PLAYLIST_URL=
APPLE_MUSIC_TEAM_ID=
APPLE_MUSIC_KEY_ID=
APPLE_MUSIC_PRIVATE_KEY=
LASTFM_API_KEY=
LASTFM_USERNAME=

# Email (optional)
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CONTACT_NOTIFICATION_EMAIL=

# Voice agent (shared with the separate voice servers)
VOICE_API_SECRET=             # Bearer token the voice servers use for /api/voice/*
PHONE_HASH_KEY=               # HMAC key for hashing caller numbers

# Admin
ADMIN_PASSWORD=               # For /admin and /calls
```

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up Vercel Storage**: in the Vercel dashboard, create a Postgres database (required) and a KV database (optional), and copy their variables into `.env.local`. Without KV, rate limiting is off and Last.fm results aren't cached.

3. **Create the database tables**:
```bash
npm run db:init         # photos, projects, writings, Readwise, contact messages
npm run db:init-voice   # agent line tables (additive, safe to re-run)
```

4. **Run the development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other scripts

```bash
# Pull Readwise highlights now (the cron does this daily at 09:00 UTC)
npm run readwise:sync
```

## Project Structure

```
src/
├── app/
│   ├── (site)/          # Public pages: home, about, resume, photo, photos/[groupName], reading, listening
│   ├── admin/           # Admin login and panel
│   ├── calls/           # Private agent-line call timelines (admin password)
│   ├── session/[id]/    # Recap of a keypad call session
│   └── api/
│       ├── admin/       # Admin auth and contact messages
│       ├── contact/     # Contact form
│       ├── cron/        # Daily Readwise sync (Vercel cron)
│       ├── photos/      # Photo CRUD and uploads
│       ├── readwise/    # Readwise highlights and manual sync
│       ├── session/     # Keypad session data
│       ├── upload/      # Blob uploads
│       ├── voice/       # Agent line: pairing, events, calls, replays, messages, Twilio status
│       └── webhook/     # Twilio webhooks for the keypad line
├── components/
│   ├── AdminPanel.tsx   # Webhook simulation and data tools
│   ├── ContactForm.tsx
│   ├── ContactMessages.tsx
│   ├── PhotoManager.tsx # Photo uploader
│   ├── photo/           # Collage, grid, wall, lightbox
│   ├── site/            # Site navigation and keypad listener
│   └── voice/           # Live feed panel for the agent line
├── content/             # Static content: resume, Goodreads export, covers
└── lib/
    ├── db.ts, schema.ts # Database connection and Drizzle schema
    ├── sections.ts      # Pages, their keypad digits, and the two phone numbers
    ├── twilio.ts        # Twilio signature validation
    ├── pusher.ts        # Server-side Pusher
    ├── ratelimit.ts     # Tiered rate limits
    ├── readwise.ts      # Readwise API and sync
    ├── books.ts         # Bookshelf: Readwise + Goodreads merge
    ├── music.ts, lastfm.ts # Listening page sources
    └── voice.ts         # Agent line helpers (feed events, pairing, phone hashing)
```

## Usage

### Keypad Navigation

1. Call the number shown on the site
2. Press digits to navigate:
   - `0` - Home
   - `1` - About
   - `2` - Resume
   - `3` - Photo
   - `5` - Reading
   - `6` - Listening

Digit `4` is unused (it belonged to a retired page). Pressing the same digit again on Photo or Reading shows a random photo or highlight.

### AI Agent Line

The agent number is answered by voice servers that live in a separate repository. This site is the agent's display and record:

1. A visitor opens the feed panel and picks a stack: **Twilio** (ConversationRelay), **Pipecat**, or **LiveKit** (LiveKit Agents, reached over SIP). The panel shows a 4-digit pairing code.
2. On the call, the voice server listens silently for 3 seconds. A typed code is claimed through `/api/voice/pair/claim`, and the call goes to the stack the code was made for. No code, or a used code, goes to Twilio.
3. All three stacks post events to `/api/voice/events`. The site stores them and pushes the public ones over Pusher to the paired browser's private channel, which shows the transcript, turn state, latency, and on Pipecat calls, tone readings and the caller's waveform.
4. Calls nobody paired never appear publicly. Visitors who don't call can watch replays of featured calls (`/api/voice/replays`). Messages a caller leaves are kept out of the public feed and emailed to the site owner.

Pairings live in `voice_pairings` (with a `path` column: `A` Twilio, `B` Pipecat, `C` LiveKit); calls in `callers`, `calls`, `call_events`, `call_transcripts`, and `messages`. Caller numbers are stored as an HMAC (`PHONE_HASH_KEY`), not in plain text.

### Admin

Sign in at `/admin` with `ADMIN_PASSWORD` to:
- Upload and manage photos
- Read contact form messages
- Simulate keypad webhook presses

Agent-line call timelines are at `/calls`, behind the same password.

## Data Storage

- **Content**: Vercel Postgres (photo metadata, Readwise books and highlights, contact messages, keypad sessions, agent-line calls)
- **Photo files**: Vercel Blob
- **Readwise**: synced from the Readwise API into Postgres by a daily cron (`/api/cron/readwise`) or `npm run readwise:sync`; pages read from Postgres
- **Redis (Vercel KV)**: rate-limit counters and a cache for Last.fm results

## Deployment

1. **Import the repository into Vercel** and add the environment variables above.
2. **Create the storage** in the Vercel project: Postgres (required), Blob (for photos), KV (optional). Their variables are added automatically.
3. **Create the tables** against the production database:
```bash
vercel env pull .env.local
npm run db:init
npm run db:init-voice
```
4. **Configure the keypad number in Twilio**:
   - Voice webhook: `https://your-domain/api/webhook/twilio`
   - Status callback: `https://your-domain/api/webhook/twilio/status`

The Readwise cron is defined in `vercel.json`.

## Security

### Twilio Webhook Signature Validation

Twilio webhooks are verified with HMAC-SHA1 per [Twilio's security docs](https://www.twilio.com/docs/usage/webhooks/webhooks-security):

- **Production**: every request must carry a valid `X-Twilio-Signature`
- **Development**: the keypad webhook skips validation so the admin panel can simulate key presses against a local server
- **Testing**: `npx tsx scripts/test-signature-validation.ts`

The voice routes use a shared bearer secret (`VOICE_API_SECRET`) for the voice servers, Twilio signatures for status callbacks, and the admin password for call timelines.

### Rate Limiting

API routes use tiered sliding-window limits stored in Redis:

| Tier | Limit | Used by |
|---|---|---|
| Strict | 5 per minute | `/api/admin/auth`, `/api/contact`, `POST /api/readwise` |
| Upload | 10 per hour | `/api/photos/upload` |
| Standard | 30 per minute | `/api/photos` writes, `/api/upload`, `/api/voice/pair` |
| Lenient | 60 per minute | `GET /api/photos`, `GET /api/readwise` |

Limits are skipped in development and when Redis isn't configured. Over the limit returns `429` with `X-RateLimit-*` headers. Test with `npx tsx scripts/test-rate-limiting.ts`.

## Image Processing

Photo uploads use [Sharp](https://sharp.pixelplumbing.com/) to detect width and height (JPEG, PNG, WebP, GIF, and more), falling back to 1600x1200 if detection fails. Test with `npx tsx scripts/test-sharp.ts`.

## License

Private project

## Contact

[crunnels.online](https://www.crunnels.online)
