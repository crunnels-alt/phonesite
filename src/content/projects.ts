export interface StackLayer {
  layer: string;
  pieces: string[];
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  repo: string;
  about: string[];
  flow: string[];
  howItWorks: string[];
  stack: StackLayer[];
  learned: string[];
}

export const PROJECTS_INTRO =
  'Things I have built for myself. I decide what to make, test it, and review each change; Claude Code writes the code.';

export const PROJECTS: Project[] = [
  {
    id: 'phonesite',
    name: 'phonesite',
    tagline: 'This website. You can browse it with a phone call.',
    repo: 'phonesite',
    about: [
      'I wanted a personal site that did something a normal portfolio does not. Call the number at the top of the page and press a digit, and the site moves to that section in your browser while you are still on the line. When you hang up, you get a page that shows where the call went.',
      'The first version went up in September 2025. I came back to it a year later to redo the design, swap out the Reading and Listening pages, and connect a second line that reaches an AI agent (see voice-relay-lab below).',
    ],
    flow: ['You press a key', 'Twilio', 'Webhook on Vercel', 'Pusher', 'The page changes'],
    howItWorks: [
      'Next.js on Vercel serves the pages and the webhook Twilio calls each time a caller presses a key. The webhook looks up the section for that digit and publishes it to a Pusher channel. The open page listens on that channel and changes route. The number keys on your keyboard do the same thing without a call.',
      'Content lives in Postgres through Drizzle, and photos in Vercel Blob. Reading combines Readwise highlights, synced by a daily cron job, with books from a Goodreads export, and pulls covers from Open Library. Listening shows the albums on my Apple Music playlist for the year and falls back to Last.fm.',
    ],
    stack: [
      { layer: 'Frameworks', pieces: ['Next.js', 'React', 'Tailwind CSS'] },
      { layer: 'Compute', pieces: ['Vercel Functions', 'Vercel Cron'] },
      { layer: 'Data', pieces: ['Postgres (Neon)', 'Drizzle', 'Redis (Upstash)', 'Vercel Blob'] },
      { layer: 'Communications', pieces: ['Twilio Voice', 'Pusher', 'Resend'] },
      { layer: 'Outside data', pieces: ['Readwise', 'Goodreads', 'Open Library', 'Apple MusicKit', 'Last.fm'] },
    ],
    learned: [
      'A phone call and a web page are two separate systems. Twilio only tells my server which key was pressed. Getting that to an open browser takes its own real-time channel, which is what Pusher is for.',
      'Not everything has an API. Goodreads shut down its public API and its RSS feed returns errors, so the book list comes from a CSV export saved in the repo.',
      'Before changing year-old code, I had Claude Code do a read-only review of it. We fixed what it found first and then started on the new pages, which kept the redesign from stacking on top of old problems.',
    ],
  },
  {
    id: 'roxie-digest',
    name: 'roxie-digest',
    tagline: 'A Sunday morning email of what is showing at the Roxie Theater.',
    repo: 'roxie-digest',
    about: [
      'The Roxie is a small independent cinema in San Francisco that shows repertory films, restorations and short runs. I wanted its whole week in one email on Sunday morning, so I could plan around it without checking the website.',
      'Each email starts with the films (director, year, runtime, a short description, and notes like a 4K restoration), followed by a day-by-day schedule with showtimes.',
    ],
    flow: ['Sunday cron', 'Roxie calendar', 'Each film page', 'Build the email', 'Resend'],
    howItWorks: [
      'A Vercel Cron job calls one API route every Sunday at 7am Pacific. The route fetches the Roxie calendar, then each film\'s own page, and parses the HTML with Cheerio. It builds the email from what it found and sends it through Resend.',
      'I am testing a branch that adds ten more Bay Area venues and event listings to the same email.',
    ],
    stack: [
      { layer: 'Frameworks', pieces: ['Next.js', 'Cheerio'] },
      { layer: 'Compute', pieces: ['Vercel Functions', 'Vercel Cron'] },
      { layer: 'Communications', pieces: ['Resend'] },
      { layer: 'Outside data', pieces: ['Roxie Theater calendar'] },
    ],
    learned: [
      'The first plan was a text message through Twilio. I switched to email because a week of films does not fit in a text, and email can have formatting.',
      'The Roxie calendar is plain HTML rendered on the server, so a simple parser is enough. A headless browser would have been slower and harder to run on Vercel.',
      'Scrapers break when a site changes its markup. On the multi-venue branch, four of the ten new sources still do not parse cleanly and are switched off until they do.',
    ],
  },
  {
    id: 'voice-relay-lab',
    name: 'voice-relay-lab',
    tagline: 'An AI phone agent that runs on three voice stacks behind one number.',
    repo: 'voice-relay-lab',
    about: [
      'I wanted to understand how voice AI agents work under the demo: what happens between the caller going quiet and the agent starting to talk, and where the phone call and the agent lose track of each other. So I built a line that reaches an AI assistant. It answers questions about my background and takes messages, and it says at the start that it is an AI.',
      'The same agent runs three ways, on Twilio ConversationRelay, Pipecat and LiveKit, so I can compare them on the same calls. The number is on my Resume page, next to a panel that shows each call under the hood as it happens: the transcript, tool calls and latency.',
    ],
    flow: ['Caller', 'Twilio number', 'Router reads the pairing code', 'Twilio, Pipecat or LiveKit', 'Model through AI Gateway', 'Live feed on this site'],
    howItWorks: [
      'Every call hits a small router on Railway. It waits three seconds for a pairing code typed from the website, and the code picks the stack. With no code, the call stays on Twilio.',
      'On the Twilio path, ConversationRelay turns speech into text and reads the replies aloud, so my server only handles text. On the Pipecat path, Twilio streams the raw audio and the service does its own speech recognition with Deepgram, then speaks in a cloned version of my voice through ElevenLabs. The LiveKit path dials the call into LiveKit Cloud over SIP, where a Python agent joins the room.',
      'All three send each turn to the same model through Vercel AI Gateway, and every event goes to the live feed on this site through Pusher. The servers run on Railway because a call holds a connection open for minutes, which Vercel functions cannot do.',
    ],
    stack: [
      { layer: 'Frameworks', pieces: ['Node.js', 'Vercel AI SDK', 'Pipecat (Python)', 'LiveKit Agents (Python)'] },
      { layer: 'Compute', pieces: ['Railway', 'LiveKit Cloud'] },
      { layer: 'Communications', pieces: ['Twilio ConversationRelay', 'Twilio Media Streams', 'Pusher'] },
      { layer: 'AI', pieces: ['Vercel AI Gateway', 'GPT-4.1 mini', 'Deepgram Nova-3', 'ElevenLabs'] },
    ],
    learned: [
      'Whoever owns the audio owns the context. With ConversationRelay, Twilio handles speech in both directions, so the agent never hears tone or hesitation. On Pipecat the service has the raw audio and can read how something was said as well as what was said.',
      'Deciding when the caller has finished talking is a model of its own, and each stack does it differently: Twilio has it built in, Pipecat uses Smart Turn, and LiveKit uses a turn detector that reads the transcript.',
      'Latency adds up across the chain. The first Pipecat reply took 1.3 seconds to start against about 0.7 on Twilio, until the service opened its model connection during the greeting.',
      'Prompts shape behavior, but code has to enforce what must never happen. One model sometimes wrote its tool calls out as text, and the phone read them aloud, so a filter now blocks code-like output before it reaches the voice.',
    ],
  },
  {
    id: 'echo',
    name: 'Echo',
    tagline: 'A dream journal for iPhone that you can use half asleep.',
    repo: 'deutung',
    about: [
      'I wanted a dream journal I could use right after waking up. You tap once and talk. The app saves the recording right away and transcribes it in the background, so you can go back to sleep and fix the text later.',
      'Afterward you can ask for a reading of the dream through a Freudian, Jungian or CBT lens. Each saved dream also adds the public domain painting behind the record screen to a collection. It is in testing on TestFlight.',
    ],
    flow: ['Record', 'Whisper transcript', 'Saved to Supabase', 'Pick a lens', 'Claude analysis'],
    howItWorks: [
      'Echo is a React Native app built with Expo, so one TypeScript codebase produces the iOS app, and Expo\'s EAS service builds it and submits it to TestFlight. There is no server of my own. Supabase handles sign-in (Apple, Google or email), the dream database and the stored artwork.',
      'Whisper turns voice recordings into text, and Claude writes the analysis, with a separate prompt for each lens. Sentry reports crashes and PostHog shows how the app gets used.',
    ],
    stack: [
      { layer: 'Frameworks', pieces: ['React Native', 'Expo', 'TypeScript'] },
      { layer: 'Compute', pieces: ['EAS Build', 'TestFlight'] },
      { layer: 'Data', pieces: ['Supabase Postgres', 'Supabase Auth', 'Supabase Storage'] },
      { layer: 'AI', pieces: ['Claude', 'Whisper'] },
      { layer: 'Monitoring', pieces: ['Sentry', 'PostHog'] },
    ],
    learned: [
      'Design for the person using it at 6am. Haptic pulses tell you the app is ready, still recording, and saved, so you can record with your eyes closed.',
      'The analysis is much better when the dreamer first says what the people and places in the dream mean to them. The flow asks for that, and lets you skip it.',
      'I chose the stack partly for how I build. Claude Code is strongest in TypeScript and React, which is a big reason I picked Expo over Swift or Flutter.',
    ],
  },
];
