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
  "I've spent nine years on the infrastructure under the phone call, at Twilio, Zoom, Infobip, and ServiceTitan. My work decides whether a call goes through, whether the person who answers can trust who's calling, and whether the business makes money on it once carrier costs, pricing, and fraud are counted. AI agents that talk on the phone are the next version of that problem, and it's the one I'm working on now.";

export const THEMES: Theme[] = [
  {
    heading: 'Making phone calls trustworthy again',
    problem: `Robocalls and [spoofed caller ID](https://en.wikipedia.org/wiki/Caller_ID_spoofing) taught people to stop answering. The fix has to be industry-wide: carriers sign every call under [STIR/SHAKEN](${STIR_SHAKEN}), businesses prove who they are, and phones show a name people can believe. I've built that system at three companies.`,
    proofs: [
      { company: 'Twilio', text: `Brought every voice call Twilio carries under [STIR/SHAKEN](${STIR_SHAKEN}) by the FCC's deadline, most of them signed at the highest level of trust.` },
      { company: 'Zoom', text: 'Ran the company-wide program that cut toll fraud on [Zoom Phone](https://www.zoom.com/en/products/voip-phone/) by 90%.' },
      {
        company: 'Infobip',
        text: 'Led the push to bring [Branded Calling ID](https://www.ctia.org/branded-calling-id) and [Apple Branded Caller ID](https://www.apple.com/business/connect/) to [Peerless Network](https://www.peerlessnetwork.com/), and took the carrier through the FCC\'s [2024 rules](https://transnexus.com/blog/2024/fcc-adopts-new-rules-shaken-3rd-party-signing/) on who may sign a call.',
      },
      { company: 'ServiceTitan', text: "Set how ServiceTitan signs and vouches for its customers' caller IDs." },
    ],
  },
  {
    heading: 'One identity system for every product',
    problem:
      'Every phone product has to know who its customers are. Regulators require it before handing out numbers, carriers require it before signing calls, and fraud teams need it to act. Built product by product, it slows every launch. I have built it as a shared platform twice.',
    proofs: [
      { company: 'Twilio', text: "Launched [TrustHub](https://www.twilio.com/docs/trust-hub), the business verification platform Twilio's products share." },
      {
        company: 'Zoom',
        text: 'Designed the compliance model shared by Zoom Phone and Contact Center, which cut the time to open a new country from about two months to two weeks. Used it to launch Zoom Phone local numbers in Japan.',
      },
      { company: 'ServiceTitan', text: 'Moved call transcription onto a platform ServiceTitan runs, behind its own API, so every AI product reads from one source.' },
    ],
  },
  {
    heading: 'The phone network under AI agents',
    problem:
      'An AI agent on the phone succeeds or fails on telephony: how fast it answers, whether it stops when you cut in, how well it hears a bad connection, and when it hands you to a person. Those are the problems I have worked on my whole career.',
    proofs: [
      { company: 'ServiceTitan', text: "Own voice telephony and Contact Center across ServiceTitan's three phone products, including the transcription its AI products are built on." },
      { company: 'Infobip', text: "Took Infobip's [voice platform](https://www.infobip.com/voice) to market in North America, and built voice agents on it for developer events." },
      { company: 'This site', text: 'Built [the AI that answers my phone](/projects) three times, on Twilio, Pipecat, and LiveKit, to see where each one breaks.' },
    ],
  },
];

export const STORIES: Story[] = [
  {
    id: 'servicetitan-transcription',
    company: 'ServiceTitan',
    years: '2026',
    title: "Putting the company's AI on ground it owns",
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
    title: 'Turning five fraud fixes into one program',
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
    title: 'Getting a whole carrier ready for a federal mandate',
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
