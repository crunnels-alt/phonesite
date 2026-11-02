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

export const THESIS =
  "I work underneath the phone call: the carrier networks, caller identity, and fraud controls that decide whether a call connects and whether anyone trusts it. I've built that layer for nine years at Twilio, Zoom, Infobip, and ServiceTitan. Now I'm focused on the part AI voice agents run on.";

export const THEMES: Theme[] = [
  {
    heading: 'Trust on the phone network',
    problem:
      "Most people stopped answering unknown numbers, and regulators and carriers responded with rules most businesses can't follow on their own. The product work is making a legitimate call look legitimate, and making fraud expensive, without slowing down the customers who play by the rules.",
    proofs: [
      { company: 'Twilio', text: "Got all of Twilio's voice traffic STIR/SHAKEN-compliant by the FCC deadline." },
      { company: 'Zoom', text: 'Cut toll fraud 90% with one cross-team program and guardrails that left good customers alone.' },
      { company: 'Infobip', text: "Launched branded calling, so a business's name and logo show on the calls it makes." },
      { company: 'ServiceTitan', text: 'Set the call-signing and attestation strategy for customer caller IDs.' },
    ],
  },
  {
    heading: 'Platforms other teams build on',
    problem:
      'The same need shows up in every product: verify this business, transcribe this call, route this number. Solving it once, behind a stable interface, lets every team after the first move faster and lets the vendor underneath change.',
    proofs: [
      { company: 'Twilio', text: "Launched TrustHub, verify once and reuse it across Twilio's products." },
      { company: 'Zoom', text: 'Designed a shared compliance model that cut new country launches from about two months to two weeks.' },
      { company: 'ServiceTitan', text: "Moved call transcription behind a provider-agnostic API that the company's AI products call." },
    ],
  },
  {
    heading: 'The voice layer under AI agents',
    problem:
      "A voice agent is only as good as what's under it: latency, interruptions, transcription, and knowing when to hand off to a person. Those are telephony problems more than model problems, and they're the ones I know.",
    proofs: [
      { company: 'ServiceTitan', text: 'Rolled out transcription of every call, the layer its AI products run on.' },
      { company: 'Infobip', text: 'Built two voice agents for developer events: a banking agent and a conference assistant.' },
      { company: 'This site', text: 'Built the AI that answers my phone, three ways: Twilio, Pipecat, and LiveKit.' },
    ],
  },
];

export const STORIES: Story[] = [
  {
    id: 'zoom-fraud',
    company: 'Zoom',
    years: '2022–2023',
    title: 'Five teams, one fraud problem',
    problem:
      'Zoom Phone was losing real money to toll fraud. Five teams each had a partial fix, and nobody owned the whole problem.',
    decision:
      'I sized it myself in SQL with an analyst and found that self-serve sign-ups drove most fraud suspensions. I took that to the heads of product, engineering, and compliance, which got us one roadmap with a metric for each team. My part was the product guardrails: caps on simultaneous calls and spend for new self-serve accounts, with good high spenders left alone.',
    result: 'Toll fraud fell 90% and fraudulent sign-ups 80%, with no rise in reinstatement requests.',
    differently: "Share partial findings earlier instead of waiting until I had every answer.",
  },
  {
    id: 'twilio-stir-shaken',
    company: 'Twilio',
    years: '2020–2021',
    title: 'A federal deadline with no platform under it',
    problem:
      'The FCC set a fixed date for STIR/SHAKEN call signing, and Twilio had no central place for customers to verify their business.',
    decision:
      "We built TrustHub: verify once, reuse everywhere. Most traffic came from about ten customers, so we onboarded those by hand first and shipped the API for everyone else after. I also ran caller name display as a manual service so customers could start before the platform was ready.",
    result: "All of Twilio's voice traffic was compliant by the deadline, 80% at full attestation, and every beta customer re-signed.",
    differently: 'Line up senior engineering allies earlier.',
  },
  {
    id: 'infobip-margin',
    company: 'Infobip',
    years: '2024–2025',
    title: 'Pushing back on a price increase',
    problem:
      'Carrier costs spiked, wholesale margin went negative, and the default plan was a rate increase for every customer.',
    decision:
      "I sorted the carrier cost report by per-minute rate and traced the most expensive destinations back through the logs to one wholesale account. It was routing traffic to destinations that cost far more than its flat US rate. I recommended restricting that account instead of raising prices on everyone, and moved wholesale accounts onto routes that block high-cost destinations by design.",
    result: 'Margin came back without a customer-wide increase.',
    differently: 'It happened once more with another account, so I would push harder for automatic detection.',
  },
];

export const PRINCIPLES: Principle[] = [
  { heading: 'Size it myself first.', text: 'Before I ask for a team, I pull the data and know how big the problem is.' },
  { heading: 'Build the platform, then the use case.', text: 'Solve the shared need once, behind an interface teams can trust.' },
  { heading: 'Do the biggest customers by hand.', text: 'Manual first for the few that matter most, then automate for everyone else.' },
  { heading: 'Fix the cause, not everyone’s price.', text: 'Find the one account or step behind the number before changing the rules for all.' },
  { heading: 'Keep the vendor behind my own API.', text: 'So the business can switch providers without every product team rewriting.' },
];
