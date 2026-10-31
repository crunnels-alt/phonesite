export interface Role {
  title: string;
  dates: string;
  points: string[];
}

export interface Job {
  id: string;
  company: string;
  dates: string;
  summary?: string;
  roles: Role[];
}

export const RESUME_INTRO =
  'Senior product manager for voice, contact center, and telephony products, with nine years at Twilio, Zoom, Infobip, and ServiceTitan across SIP trunking, carrier compliance (STIR/SHAKEN, KYC), fraud, and voice AI infrastructure.';

export const JOBS: Job[] = [
  {
    id: 'servicetitan',
    company: 'ServiceTitan',
    dates: 'Dec 2025 – Present',
    summary: 'Voice telephony and Contact Center Pro for trades businesses, across three phone products and carrier stacks.',
    roles: [
      {
        title: 'Senior Product Manager, Voice and Contact Center',
        dates: 'Dec 2025 – Present',
        points: [
          'Transcription for voice AI: moved call transcription to a provider-agnostic, self-hosted platform shared by AI and product teams, lowering cost and removing single-vendor dependence, then rolled it out to every Contact Center call and the core phone product.',
          'Getting customers live: led an automated go-live wizard with pre-flight checks and rollback in place of a long manual setup, designed one onboarding and offboarding flow with churn playbooks behind it, and rebuilt the pre-sales and in-product network tests.',
          'Admin and devices: shipped a role-based telecom admin app for Support and Telecom Operations that replaced legacy screens and carrier-portal hops, and launched desk-phone provisioning, the most-requested feature, to private preview.',
          "Caller ID trust: selected the STIR/SHAKEN certificate authority, set the attestation strategy for customers' outbound caller IDs, and owned the FCC Robocall Mitigation Database filing.",
          'Reliability and troubleshooting: led the voice observability program that brought SIP call logs into central logging, built an AI-assisted investigation toolkit for the voice team, and partnered on a tool that shows every leg of a call in one view.',
        ],
      },
    ],
  },
  {
    id: 'infobip',
    company: 'Infobip',
    dates: 'Apr 2024 – Nov 2025',
    summary: "Product lead for programmable Voice and Video in North America, including Peerless Network's carrier business.",
    roles: [
      {
        title: 'Senior Product Manager, Voice and Video',
        dates: 'Apr 2024 – Nov 2025',
        points: [
          "Owned North America Voice go-to-market as product lead and de facto solutions engineer; hit the 20-closed-won-deal goal six weeks early (+25% YoY) and delivered the region's record revenue month.",
          'Diagnosed a wholesale margin leak where one account arbitraged flat-rate US pricing into high-cost routes; restricted it to dedicated routes instead of a customer-wide rate increase, putting gross margin back on track.',
          'Led 0-to-1 Branded Calling (CTIA BCID, Apple Branded Caller ID): vendor and settlement-platform selection, contract redlines, pricing model, and private-beta recruitment with sales.',
        ],
      },
    ],
  },
  {
    id: 'zoom',
    company: 'Zoom',
    dates: 'Jan 2022 – May 2023',
    summary: 'Telephony platform under Zoom Phone, Meetings, and Contact Center: compliance, fraud, and number reputation.',
    roles: [
      {
        title: 'Senior Product Manager, Carrier Platform',
        dates: 'Jan 2022 – May 2023',
        points: [
          'Led an executive-sponsored, cross-product anti-fraud program across Growth, Payments, Data Science, Trust & Safety, and Legal, cutting toll-fraud spend 90% and fraudulent sign-ups 80%.',
          'Designed a shared KYC compliance data model for Zoom Phone and Contact Center, with self-serve tooling for Ops that cut new country and number-type launch time from about two months to about two weeks.',
        ],
      },
    ],
  },
  {
    id: 'twilio',
    company: 'Twilio',
    dates: 'Jun 2017 – Jan 2022',
    summary: 'Four and a half years, from product operations to owning Elastic SIP Trunking.',
    roles: [
      {
        title: 'Product Manager, Elastic SIP Trunking',
        dates: 'Dec 2020 – Jan 2022',
        points: [
          "Launched TrustHub, Twilio's cross-product KYC platform, with CNAM and STIR/SHAKEN as its first use cases; got 100% of Twilio voice traffic STIR/SHAKEN-compliant by the FCC deadline, with 80% at A-level attestation.",
          'Rebuilt the Calls-Per-Second provisioning and pricing model after building a usage tool that exposed network oversubscription, and launched the SIP Trunking Pricing API for least-cost-routing customers.',
        ],
      },
      { title: 'Technical Project Manager, Elastic SIP Trunking', dates: 'Jul 2019 – Dec 2020', points: [] },
      { title: 'Senior Product Operations Analyst', dates: 'Jun 2017 – Jul 2019', points: [] },
    ],
  },
  {
    id: 'lendup',
    company: 'LendUp',
    dates: 'Aug 2015 – Jun 2017',
    roles: [{ title: 'Operations, Account Management and Workforce Analytics', dates: 'Aug 2015 – Jun 2017', points: [] }],
  },
];

export const EDUCATION = 'University of California, Merced · B.S. Management · 2015';
