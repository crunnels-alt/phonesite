export interface PointGroup {
  heading: string;
  points: string[];
}

export interface Role {
  title: string;
  dates: string;
  points?: string[];
  groups?: PointGroup[];
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
        groups: [
          {
            heading: 'Transcription for voice AI',
            points: [
              "Led the migration of call transcription to a self-hosted platform behind a provider-agnostic API, lowering the contracted rate and removing the previous provider's throttling ceiling. Existing AI products needed no changes, and the platform now serves AI and product teams across the company.",
              'Rolled out transcription of every call on the core phone product with a volume-tiered ramp, including every Contact Center call.',
            ],
          },
          {
            heading: 'Contact Center onboarding',
            points: [
              'Led delivery of an automated go-live wizard that replaced a long manual setup across several systems with gated pre-flight checks, one-click fixes, and batch rollback. It targets the go-live misconfigurations behind a large share of churn-related interactions.',
              "Defined and launched desk-phone provisioning, the product's most-requested feature, to private preview. It replaced a manual, single-engineer process with APIs, an admin UI, and an audit trail. Led the first customer onboarding and wrote the sales enablement.",
              'Designed one lifecycle wizard covering four onboarding and offboarding flows, and wrote the churn-pathway playbooks behind a production teardown tool that keeps a reversal path open.',
            ],
          },
          {
            heading: 'Reliability and investigation',
            points: [
              'Led the voice observability program: audited the monitoring tools, found that Support was first to spot most incidents, and drove the plan that put SIP call logs into central logging with no new vendor spend.',
              "Ran a self-service audit of every account's carrier-hosted numbers that traced a customer outage to a provisioning failure. Separated the few true failures from cleanup gaps and delivered the root-cause analysis to leadership with no engineering tickets.",
              'Launched an in-product webphone network test to private preview, and rebuilt the pre-sales network test after finding it probed the wrong servers. Network issues were a top support escalation category.',
              'Built four dashboards covering platform health, call investigation, WebRTC quality, and queue and agent state, giving Support and Ops access without a VPN.',
              'Built an AI-assisted investigation toolkit for the voice team: read-only MCP connectors across log, SIP-capture, metrics, carrier, and call-quality systems, a shared Claude skills repo of investigation playbooks, and a platform knowledge base.',
              'Partnered with an engineer on a call-flow tool that rebuilds every leg of a call from SIP captures, carrier records, and Contact Center data in one view. Shaped the user experience and guided the carrier integrations; it shipped to every employee within a day of its first demo.',
            ],
          },
          {
            heading: 'Caller ID and compliance',
            points: [
              "Selected the STIR/SHAKEN certificate authority (lower cost, no lock-in) and defined the call-signing and attestation strategy for customer caller IDs. The certificate went live ahead of schedule.",
              'Owned the FCC Robocall Mitigation Database refiling as a voice provider: drafted the mitigation plan and filed it on time.',
            ],
          },
          {
            heading: 'Admin tooling and planning',
            points: [
              'Shipped a standalone, role-based telecom admin app for Support and Telecom Operations that replaced the legacy admin and several carrier-portal hops.',
              'Wrote PRDs spanning transcription, observability, admin tooling, devices, and routing, and took on routing and workflow scope mid-quarter.',
              'Benchmarked the contact center product against four major CCaaS and UCaaS competitors feature by feature.',
            ],
          },
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
        groups: [
          {
            heading: 'Go-to-market and carrier business',
            points: [
              "Owned North America Voice go-to-market as forward deployed product manager. Hit the 20-closed-won-deal goal six weeks early (vs. 16 the prior year, +25%) and delivered the region's record revenue month.",
              'Diagnosed a wholesale margin leak in which one account was arbitraging flat-rate US pricing into routes costing up to ~75x what it paid. Restricted it to dedicated routes instead of a customer-wide rate increase, and gross profit came back on track for positive margin.',
              'Unblocked onboarding for a wave of new wholesale voice carriers: coordinated data-center capacity and CLI gateway enablement, and set up capacity forecasting with sales as accounts ramped.',
            ],
          },
          {
            heading: 'Customer escalations',
            points: [
              "Analyzed 844K calls for a major enterprise customer reporting failures and showed a 0.025% rejection rate, most of it calls that destination-country operators forbid. Benchmarked the carrier's FCC Robocall Mitigation Plan against two competitors' public filings to show the blocking was standard practice.",
              'Recovered a strategic UCaaS account by finding an SBC failover bug and negotiating an interim service-credit plan the customer accepted, backed by a shared engineering channel and white-glove support.',
            ],
          },
          {
            heading: 'Caller ID and compliance',
            points: [
              'Led 0-to-1 Branded Calling (CTIA BCID and Apple Branded Caller ID): vendor and settlement-platform selection, contract redlines, the pricing model, and a private-beta recruitment campaign with sales. Represented the company in the industry working group and set direction for the core PM team.',
              "Operationalized the FCC's 2024 third-party authentication order at Peerless Network, letting carrier customers obtain their own STIR/SHAKEN certificates and host them on the network so their calls stayed compliant.",
            ],
          },
          {
            heading: 'Voice AI and partners',
            points: [
              "Built two AI voice-agent demos on Infobip's Voice API for developer events: a voice-banking agent for Dev Days NYC 2025 (ElevenLabs Conversational AI) that identified callers by phone number and greeted each by name with live account data, and a LeadDev New York conference assistant (OpenAI Realtime API over SIP) that answered schedule and speaker questions through function calls.",
              'Negotiated the contract terms for a contact-center marketplace listing.',
            ],
          },
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
        groups: [
          {
            heading: 'Anti-fraud program',
            points: [
              'Led an executive-sponsored, cross-product telephony anti-fraud program across Growth, Payments, Data Science, Trust & Safety, and Legal. It cut toll fraud (IRSF) 90%, carrier ToS and AUP violations 80%, and fraudulent sign-ups 80%, with no rise in reinstatement or limit-increase requests over 6 months.',
              'Won sponsorship from the President of Product & Engineering and the Chief Compliance Officer for siloed teams to share one fraud roadmap with team-owned KPI dashboards. The template spawned two more working groups and justified new anti-fraud headcount.',
              'Ran a twice-monthly forum with carrier partners on robocall-related acceptable-use violations, reporting the action plan back to them, after a carrier called an emergency meeting over robocall traffic on the network.',
            ],
          },
          {
            heading: 'Fraud controls',
            points: [
              'Walked the account lifecycle gate by gate with data on where fraud accounts slipped through, and aligned Payments, Trust & Safety, Data, and Sales on one fraud roadmap that cut time-to-suspend for new fraud accounts from ~3 months to ~1 week.',
              'Traced telephony fraud to the self-serve Online sales channel, where 35% of new phone accounts were identified as fraudulent within 3 months, and made the case for identity checks at sign-up, including phone-number collection in the buy flow. Deprioritized card chargebacks (~2%) as a smaller loss driver.',
              'Shipped platform fraud guardrails: outbound concurrency caps and per-account spend limits, with grandfathering for legitimate high spenders. Validated a higher auto-suspension threshold through 6 months of shadow evaluation with one false positive.',
              "Designed a platform-wide suspension pipeline that connected separate security teams' systems through internal APIs, DynamoDB, and Kafka, so one suspension reached billing, account services, and finance.",
              'Closed two call-flow loopholes fraudsters used to hold expensive calls open: forwarded calls left open on the originating leg, and calls kept alive by deleted users.',
              'Proposed trust-tiered account profiles that unlock calling limits, international minutes, and concurrency as identity is verified, and sourced three vendors for new-account risk underwriting.',
            ],
          },
          {
            heading: 'Compliance and international',
            points: [
              'Designed a shared KYC compliance data model and service for Zoom Phone and Contact Center so customers could reuse verified business data across products. Shipped self-serve module creation for Ops, cutting new country and number-type launch time from ~2 months to ~2 weeks.',
              'Launched Zoom Phone local (0ABJ) numbers in Japan ~5.5 months after joining, with a local carrier partner. Ran three weekly forums across legal, licensing, network engineering, ops, and sales, plus an 8-week private beta with 7 customers.',
              'Led the France STIR/SHAKEN (MAN) compliance plan, defining regulatory operator roles and certificate-signing arrangements with carrier partners.',
            ],
          },
          {
            heading: 'Number reputation',
            points: [
              'Launched outbound call reputation with a reputation vendor, after designing the proof of concept that selected test accounts by call pattern (100+ calls a month with an answer rate below 50%).',
              "Took Zoom Phone's inbound spam labeling from beta (300 accounts, 60K labeled numbers) toward GA. Defined admin and user treatment and the precedence between vendor-sourced and crowdsourced labels.",
            ],
          },
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
          "Launched TrustHub, Twilio's cross-product KYC platform, with CNAM and STIR/SHAKEN as its first use cases. Coordinated a 3-engineer platform team and an 8-engineer SIP call-flow team to get 100% of Twilio voice traffic STIR/SHAKEN-compliant by the FCC deadline, with 80% at A-level attestation.",
          'Led product and pricing on contract negotiations for 5 of the top 10 SIP Trunking customers. Used negotiation feedback to cut the US48 list price, which drove a 7% quarterly rise in organic SIP sign-ups.',
          "Shipped Calls-Per-Second capacity for Twilio's standalone Ireland and Australia regions on an executive deadline. Modeled per-service capacity across the SIP microservice stack and replaced an unavailable in-region billing dependency with a free 10-CPS tier sized to the 95th–99th percentile of usage.",
          'Launched the Elastic SIP Trunking Pricing API, a read-only REST rates API with country filtering for least-cost-routing auctions. Built in response to ~7 customer requests, it helped win more routes at auction with a top-10 LCR customer.',
          'Rebuilt the Calls-Per-Second provisioning and purchasing model after building an internal usage tool that exposed network oversubscription, and re-priced at-risk, low-usage customers to restore ASP.',
          "Rebuilt Twilio's Voice and SIP Trunking Call Logs into one troubleshooting experience on the new design system. Interviewed power users, drove data engineering to expose the SIP Call ID, and shipped by the design org's deadline.",
        ],
      },
      {
        title: 'Technical Project Manager, Elastic SIP Trunking',
        dates: 'Jul 2019 – Dec 2020',
        points: [],
      },
      {
        title: 'Senior Product Operations Analyst',
        dates: 'Jun 2017 – Jul 2019',
        points: [],
      },
    ],
  },
  {
    id: 'lendup',
    company: 'LendUp',
    dates: 'Aug 2015 – Jun 2017',
    roles: [
      {
        title: 'Operations, Account Management and Workforce Analytics',
        dates: 'Aug 2015 – Jun 2017',
        points: [],
      },
    ],
  },
];

export const EDUCATION = 'University of California, Merced · B.S. Management · 2015';
