# Phone-Controlled Portfolio Website

A unique portfolio website with phone navigation - call a number and use your dial pad to navigate sections in real-time. Built with Next.js, Twilio, Pusher, and Vercel Postgres.

## Features

- **Phone Navigation**: Call a number and navigate using dial pad (1-5 for sections)
- **Real-time Updates**: WebSocket integration for live section changes
- **Content Sections**: About, Projects, Photos, Writing, Reading Notes
- **Admin Panel**: Manage photos, projects, and writings with CRUD operations
- **Photo Gallery**: Upload to Vercel Blob with Montessori-style layout
- **Readwise Integration**: Sync and display reading highlights

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS 4
- **Backend**: Next.js API Routes
- **Database**: Vercel Postgres (with Drizzle ORM)
- **Storage**: Vercel Blob (for photos)
- **Real-time**: Pusher (WebSockets)
- **Telephony**: Twilio

## Getting Started

### Prerequisites

- Node.js 20+
- npm/yarn/pnpm
- Vercel account (for Postgres and Blob)

### Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
# Database
POSTGRES_URL=          # Vercel Postgres connection string

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN= # For photo uploads

# Vercel KV (Redis Cache)
KV_URL=                # Vercel KV connection string
KV_REST_API_URL=       # For REST API access
KV_REST_API_TOKEN=     # Auth token
KV_REST_API_READ_ONLY_TOKEN= # Read-only token

# Twilio (Phone Navigation)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Pusher (Real-time)
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=

# Readwise (Optional)
READWISE_ACCESS_TOKEN= # Get from https://readwise.io/access_token

# Admin
ADMIN_PASSWORD=        # For /admin access
```

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up Vercel Storage**:

   **a. Vercel Postgres:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to Storage → Create Database → Postgres
   - Copy the `POSTGRES_URL` to your `.env.local`

   **b. Vercel KV (Optional but recommended for Readwise caching):**
   - In Vercel Dashboard, go to Storage → Create Database → KV
   - Copy all KV environment variables to your `.env.local`
   - If you skip this, Readwise will fall back to in-memory cache only

3. **Initialize the database**:
```bash
npm run db:setup
```

This will:
- Create tables (photos, projects, writings)
- Migrate your existing JSON data to the database

4. **Run the development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Database Management

```bash
# Initialize database tables
npm run db:init

# Migrate JSON data to database
npm run db:migrate

# Run both (complete setup)
npm run db:setup
```

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin authentication page
│   ├── api/            # API routes
│   │   ├── photos/     # Photo CRUD
│   │   ├── projects/   # Project CRUD
│   │   ├── writings/   # Writing CRUD
│   │   ├── readwise/   # Readwise sync
│   │   └── webhook/    # Twilio webhooks
│   ├── page.tsx        # Main app (phone navigation)
│   └── layout.tsx
├── components/
│   ├── AdminPanel.tsx      # Dev interface
│   ├── ContentManager.tsx  # CRUD UI for all content
│   ├── PhotoManager.tsx    # Photo uploader
│   ├── PhoneStateMonitor.tsx # HUD for phone state
│   └── sections/           # Content sections
├── lib/
│   ├── db.ts           # Database connection
│   ├── schema.ts       # Drizzle schema
│   ├── photos.ts       # Photo model
│   ├── projects.ts     # Project model
│   ├── writings.ts     # Writing model
│   └── readwise.ts     # Readwise integration
└── data/               # JSON data (legacy, can be deleted after migration)
```

## Usage

### Phone Navigation

1. Call your Twilio number
2. Press digits to navigate:
   - `0` - Home
   - `1` - About
   - `2` - Projects
   - `3` - Photos
   - `4` - Writing
   - `5` - Reading Notes

### Admin Panel

Access `/admin` with your `ADMIN_PASSWORD` to:
- Upload photos in bulk
- Manage projects (view/delete)
- Manage writings (view/delete)
- Test webhooks
- View navigation data

## Data Storage

### Current Architecture

- **Text Content**: Stored in Vercel Postgres (projects, writings, photo metadata)
- **Photo Files**: Stored in Vercel Blob
- **Readwise Cache**: Multi-tier caching with Vercel KV
  - **Tier 1**: In-memory cache (1 hour)
  - **Tier 2**: Vercel KV (Redis) - 24 hour expiration
  - **Fallback**: Mock data in development if API unavailable

### Migration from JSON

The project previously used JSON files (`src/data/*.json`). After running `npm run db:setup`, all data is migrated to Postgres.

**After verifying the migration, you can delete:**
- `src/data/photos.json` - Now in Postgres
- `src/data/projects.json` - Now in Postgres
- `src/data/writings.json` - Now in Postgres
- `src/data/readwise-cache.json` - Now using Vercel KV (if configured)

## Deployment

### Deploy to Vercel

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Import to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Import your repository
   - Add all environment variables
   - Deploy

3. **Set up Vercel Storage** (if not already done):
   - In your Vercel project, go to Storage
   - Create a **Postgres database** (required)
   - Create a **KV database** (optional, for Readwise caching)
   - Environment variables will be automatically added

4. **Initialize database on Vercel**:
```bash
# After deployment, run migrations
vercel env pull .env.local
npm run db:setup
```

5. **Configure Twilio webhook**:
   - In Twilio Console, set webhook URL to:
     `https://your-domain.vercel.app/api/webhook/twilio`

## Security

### Twilio Webhook Signature Validation

The Twilio webhook endpoint (`/api/webhook/twilio`) implements signature validation using HMAC-SHA1 to verify requests are genuinely from Twilio:

- **Development**: Validation is skipped for easier testing (logs `[Dev Mode] Skipping...`)
- **Production**: Full signature validation is enabled automatically
- **Algorithm**: HMAC-SHA1 with base64 encoding per [Twilio's security docs](https://www.twilio.com/docs/usage/security#validating-requests)
- **Testing**: Run `npx tsx scripts/test-signature-validation.ts` to verify the validation logic

## Rate Limiting

### API Protection

All API endpoints are protected with tiered rate limiting using Vercel KV (Redis):

**Rate Limit Tiers:**
- **Strict** (Auth endpoints): 5 requests/minute - Prevents brute force attacks
- **Upload** (Photo uploads): 10 requests/hour - Protects expensive file operations
- **Standard** (CRUD operations): 30 requests/minute - Normal write/delete operations
- **Lenient** (Read operations): 60 requests/minute - GET endpoints

**Behavior:**
- **Development**: Rate limiting is skipped for easier testing
- **Production**: All limits are enforced, returns 429 status when exceeded
- **Headers**: Rate limit info included in response headers (`X-RateLimit-*`)

**Testing:**
```bash
npx tsx scripts/test-rate-limiting.ts
```

**Protected Endpoints:**
- `/api/admin/auth` - Strict (5/min)
- `/api/photos/upload` - Upload (10/hour)
- `/api/photos` (GET/PUT/DELETE) - Lenient reads, Standard writes
- `/api/projects` (GET/POST/PUT/DELETE) - Lenient reads, Standard writes
- `/api/writings` (GET/POST/PUT/DELETE) - Lenient reads, Standard writes

## Image Processing

### Sharp Integration

Photo uploads use [Sharp](https://sharp.pixelplumbing.com/) for automatic image dimension detection:

- **Automatic detection**: Width and height are detected from uploaded images
- **Format support**: Works with JPEG, PNG, WebP, GIF, and more
- **Fallback**: Uses default dimensions (1600x1200) if detection fails
- **Testing**: Run `npx tsx scripts/test-sharp.ts` to verify Sharp is working

When you upload a photo, you'll see logs like:
```
Detected image dimensions: 640x480 (png)
```

## TODOs

- [x] ~~Enable Twilio signature validation~~ ✅ Implemented with dev/prod modes
- [x] ~~Implement Sharp for proper image dimension detection~~ ✅ Implemented
- [x] ~~Add rate limiting to API endpoints~~ ✅ Implemented with tiered limits
- [ ] Add proper admin authentication (currently simple password)
- [ ] Implement edit UI for projects/writings (currently delete-only)
- [ ] Add UI for creating new projects/writings (currently via API only)

## License

Private project

## Contact

[Your contact information]
