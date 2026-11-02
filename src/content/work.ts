// Text fields accept [label](url) links.

export interface Proof {
  company: string;
  text: string;
}

export interface Theme {
  heading: string;
  problem: string;
  proofs: Proof[];
}

export interface Story {
  id: string;
  company: string;
  years: string;
  title: string;
  problem: string;
  decision: string;
  result: string;
  differently: string;
}

export interface Principle {
  heading: string;
  text: string;
}

const STIR_SHAKEN = 'https://www.fcc.gov/call-authentication';

export const THESIS =
  "For nine years I've owned the problems under the phone call at Twilio, Zoom, Infobip, and ServiceTitan: whether a call connects, whether the person who answers can trust it, and whether the business makes money on it once carrier costs, pricing, and fraud are counted. AI agents that talk on the phone are the next version of those problems, and they're what I'm working on now.";

export const THEMES: Theme[] = [
  {
    heading: 'Caller trust and identity',
    problem: `Who is calling, and can you believe it? Regulators, carriers, and phone makers each hold part of the answer: [STIR/SHAKEN](${STIR_SHAKEN}) call signing, business verification, number rules in every country, and the name on the screen. I've owned that problem at four companies.`,
    proofs: [
      { company: 'Twilio', text: `Twilio's response to the FCC's [STIR/SHAKEN](${STIR_SHAKEN}) mandate across its voice network, and [TrustHub](https://www.twilio.com/docs/trust-hub), the platform that verifies businesses for every Twilio product.` },
      { company: 'Zoom', text: 'International compliance, fraud, trust and safety, and number reputation for the telephony platform under Zoom Phone, Meetings, and Contact Center.' },
      {
        company: 'Infobip',
        text: 'Caller authentication and branded calling for the [Peerless Network](https://www.peerlessnetwork.com/) carrier business, from the FCC\'s [2024 signing rules](https://transnexus.com/blog/2024/fcc-adopts-new-rules-shaken-3rd-party-signing/) to [Branded Calling ID](https://www.ctia.org/branded-calling-id) and [Apple Branded Caller ID](https://www.apple.com/business/connect/).',
      },
      { company: 'ServiceTitan', text: "Caller ID, call signing, and FCC robocall compliance for ServiceTitan as a voice provider." },
    ],
  },
  {
    heading: 'The economics of the network',
    problem:
      'Every minute has a carrier cost under it, a price on top, and fraud trying to get in between. Get any of the three wrong and the product grows into a loss. I own pricing, fraud, and margin as one problem, because a change to one moves the others.',
    proofs: [
      { company: 'Twilio', text: 'Pricing for [Elastic SIP Trunking](https://www.twilio.com/docs/sip-trunking), from the US list price to capacity pricing and the contracts with its largest customers.' },
      { company: 'Zoom', text: "The executive-sponsored anti-fraud program for Zoom's telephony platform, across Growth, Payments, Data Science, Trust and Safety, and Legal." },
      { company: 'Infobip', text: 'North America voice go-to-market, and the pricing model for branded calling.' },
      { company: 'ServiceTitan', text: "The transcription pipeline behind ServiceTitan's AI products, and choosing and managing the vendors underneath it." },
    ],
  },
  {
    heading: 'Voice platforms, and the AI built on them',
    problem:
      "The phone network is what voice AI runs on. I've owned the platforms that other teams and other companies build calls on, and now the telephony and transcription that AI products depend on.",
    proofs: [
      { company: 'Twilio', text: '[Elastic SIP Trunking](https://www.twilio.com/docs/sip-trunking), the product businesses use to connect their own phone systems to Twilio\'s network.' },
      { company: 'Zoom', text: 'The carrier platform under [Zoom Phone](https://www.zoom.com/en/products/voip-phone/), including its expansion into new countries.' },
      { company: 'Infobip', text: "Infobip's [voice platform](https://www.infobip.com/voice) in North America, as a network customers could build their own voice AI products on." },
      { company: 'ServiceTitan', text: 'Voice telephony and Contact Center across three phone products, and the transcription, admin, and observability platforms that operators and AI teams build on.' },
      { company: 'This site', text: '[The AI that answers my phone](/projects), built three times on Twilio, Pipecat, and LiveKit.' },
    ],
  },
];

export const STORIES: Story[] = [
  {
    id: 'servicetitan-transcription',
    company: 'ServiceTitan',
    years: '2026',
    title: 'A transcription platform for the company\'s AI',
    problem:
      "ServiceTitan's AI products all depended on call transcription, and the provider underneath capped how far they could scale and what they cost.",
    decision:
      'I made the case to run transcription on our own platform, behind an API we define, so no product team calls the vendor directly and the vendor can change without anyone noticing. I led the negotiation with my engineering lead, turned down an offer sized well above our real usage, and ran the cutover.',
    result: 'Every Contact Center call is now transcribed, at a much lower rate, and the AI teams changed nothing on their side.',
    differently: 'Write the usage forecast into the first contract instead of negotiating it afterward.',
  },
  {
    id: 'zoom-fraud',
    company: 'Zoom',
    years: '2022–2023',
    title: 'A cross-company anti-fraud program',
    problem: 'Fraud on Zoom Phone was costing real money, and five teams each owned a piece of it. Nobody owned the whole thing.',
    decision:
      'I sized it in SQL with an analyst and traced most of it to one door, self-serve sign-ups. Then I walked the heads of product, engineering, and compliance through the customer journey gate by gate, showing where fraud got in at each one. That turned five partial fixes into one roadmap with a metric per team. My piece was the guardrails: limits on new accounts that left good customers alone.',
    result: 'Toll fraud fell 90% and fraudulent sign-ups 80%. Suspending a new fraud account went from about three months to about a week.',
    differently: 'Share partial findings earlier instead of waiting until I had every answer.',
  },
  {
    id: 'twilio-stir-shaken',
    company: 'Twilio',
    years: '2020–2021',
    title: 'STIR/SHAKEN readiness across Twilio\'s voice network',
    problem: `The FCC gave US carriers a hard deadline to sign calls under [STIR/SHAKEN](${STIR_SHAKEN}). Twilio had to vouch for its customers' calls and had no central record of who those customers were.`,
    decision:
      'We built [TrustHub](https://www.twilio.com/docs/trust-hub) so a business verifies once and every Twilio product can rely on it. Most traffic came from a handful of large customers, so we onboarded them by hand while the self-serve API was built, and ran caller name display as a manual service until the platform caught up.',
    result: "All of Twilio's voice traffic was compliant by the deadline, 80% at the highest attestation level, and every caller name beta customer renewed.",
    differently: 'Line up senior engineering support earlier.',
  },
];

export const PRINCIPLES: Principle[] = [
  { heading: 'I size the problem myself.', text: 'Before asking anyone for a team, I pull the data and know how big it is.' },
  { heading: 'Shared problems get one answer.', text: 'If three products need the same thing, build it once and let all of them rely on it.' },
  { heading: 'Start by hand.', text: 'The biggest customers get done manually first. Automation comes once we know what they need.' },
  { heading: 'Find the cause before changing the rules.', text: 'One account or one step usually explains the number. Look for it before changing policy for everyone.' },
  { heading: 'Own the interface.', text: "Vendors change. The API our teams build on shouldn't." },
];
