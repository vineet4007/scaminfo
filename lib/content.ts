export type TopicContent = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  intro: string;
  sections: Array<{
    title: string;
    body: string;
    items: string[];
  }>;
  examples: Array<{
    title: string;
    description: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export const navItems = [
  { href: "/", label: "Home" },
  { href: "/crypto-scams", label: "Crypto" },
  { href: "/romance-scams", label: "Romance" },
  { href: "/dating-scams", label: "Dating" },
  { href: "/fake-websites", label: "Fake Sites" },
  { href: "/verify", label: "Verify URL" },
  { href: "/report-scam", label: "Report" },
  { href: "/dashboard", label: "Dashboard" },
];

export const scamStats = [
  { label: "FBI IC3 losses reported in 2024", value: "$16B+", detail: "Reported cyber-enabled fraud keeps rising year over year." },
  { label: "Common first contact channels", value: "Email, SMS, social", detail: "Scammers follow people across inboxes, apps, marketplaces, and search." },
  { label: "Best first move", value: "Pause", detail: "Slow down, verify independently, and never let urgency drive payment." },
];

export const scamCategories = [
  {
    title: "Crypto investment scams",
    href: "/crypto-scams",
    summary: "Fake exchanges, wallet drains, pig-butchering investments, and recovery scams.",
  },
  {
    title: "Romance scams",
    href: "/romance-scams",
    summary: "Trust-building scripts that move from affection to money, gifts, or account access.",
  },
  {
    title: "Dating app scams",
    href: "/dating-scams",
    summary: "Fake profiles, sextortion traps, subscription bait, and off-platform pressure.",
  },
  {
    title: "Fake websites",
    href: "/fake-websites",
    summary: "Clone stores, fake login portals, copied brands, and too-good-to-be-true offers.",
  },
];

export const latestAlerts = [
  "Fake delivery texts asking for small redelivery fees and harvesting card details.",
  "AI voice calls pretending to be family members in urgent trouble.",
  "Crypto recovery firms asking for upfront fees to retrieve lost funds.",
  "Search ads that mimic bank, exchange, wallet, and government login pages.",
];

export const educationCards = [
  {
    title: "Verify outside the message",
    body: "Do not use links or phone numbers sent by the person pressuring you. Navigate to the official site or app yourself.",
  },
  {
    title: "Treat urgency as evidence",
    body: "Scammers use deadlines, threats, romance, and exclusivity to shorten your thinking window.",
  },
  {
    title: "Protect credentials first",
    body: "Never share one-time passwords, seed phrases, remote access, or screen-sharing access with an unknown party.",
  },
];

export const topicPages: Record<string, TopicContent> = {
  "crypto-scams": {
    slug: "crypto-scams",
    title: "Crypto Scam Safety",
    eyebrow: "High-risk payments",
    description: "Learn how crypto scams work, how to spot wallet and exchange traps, and what to do before sending funds.",
    intro:
      "Crypto transactions are fast, global, and usually irreversible. That makes them attractive to criminals who combine fake profit stories with pressure, romance, impersonation, or technical confusion.",
    sections: [
      {
        title: "What counts as a crypto scam",
        body: "A crypto scam is any scheme that uses digital assets, wallets, exchanges, or blockchain language to steal money, credentials, or private keys.",
        items: [
          "Fake investment platforms showing fabricated gains.",
          "Wallet-draining links that request malicious approvals.",
          "Impersonators posing as exchange support or regulators.",
          "Recovery firms promising impossible fund retrieval for a fee.",
        ],
      },
      {
        title: "Red flags",
        body: "Most crypto scams reuse the same pressure patterns even when the website looks polished.",
        items: [
          "Guaranteed returns, insider allocation, or risk-free trading claims.",
          "Pressure to move chat to encrypted apps or keep the opportunity secret.",
          "Requests for seed phrases, private keys, OTPs, or remote access.",
          "Small withdrawals allowed at first, followed by fees, taxes, or unlock deposits.",
        ],
      },
      {
        title: "Prevention tips",
        body: "A few checks can stop the most expensive mistakes.",
        items: [
          "Verify exchange domains manually and bookmark official URLs.",
          "Use hardware wallets and separate hot wallets for testing new apps.",
          "Review token approvals and revoke permissions you no longer need.",
          "Search the company name with terms like scam, complaint, and regulator warning.",
        ],
      },
      {
        title: "After a suspected loss",
        body: "Speed matters, but avoid anyone who claims they can reverse blockchain transactions for an upfront payment.",
        items: [
          "Record wallet addresses, transaction hashes, screenshots, and chat logs.",
          "Report to your exchange, wallet provider, bank, local cybercrime portal, and law enforcement.",
          "Move remaining funds to clean wallets and rotate account credentials.",
          "Do not pay recovery services that guarantee results.",
        ],
      },
    ],
    examples: [
      {
        title: "Pig-butchering investment platform",
        description: "A friendly contact introduces a trading dashboard, shows staged gains, then demands tax or unlock fees before withdrawal.",
      },
      {
        title: "Airdrop wallet drain",
        description: "A fake token claim page asks for wallet approval that grants an attacker permission to transfer assets.",
      },
    ],
    faqs: [
      {
        question: "Can crypto be recovered after sending it?",
        answer: "Sometimes exchanges can freeze funds if notified quickly, but confirmed transfers cannot simply be reversed like a card chargeback.",
      },
      {
        question: "Is a verified social profile proof?",
        answer: "No. Scammers buy ads, steal accounts, and spoof support pages. Verify through official apps and published domains.",
      },
    ],
  },
  "romance-scams": {
    slug: "romance-scams",
    title: "Romance Scam Awareness",
    eyebrow: "Trust manipulation",
    description: "Understand how romance scammers build intimacy, isolate victims, and turn emotional trust into financial loss.",
    intro:
      "Romance scams are long-form social engineering. The scammer creates emotional closeness, then introduces a crisis, investment, travel need, customs fee, or medical emergency.",
    sections: [
      {
        title: "How the setup works",
        body: "The scam usually starts with intense attention and moves quickly into private channels.",
        items: [
          "Rapid affection, future plans, and constant messaging.",
          "Excuses for avoiding live video or in-person meetings.",
          "A job or family situation that explains distance and emergencies.",
          "Requests for gift cards, wire transfers, crypto, or mule account help.",
        ],
      },
      {
        title: "Warning signs",
        body: "The emotional story changes, but the transaction pressure is predictable.",
        items: [
          "They ask you to keep the relationship or money request secret.",
          "They want funds sent to another person, courier, exchange, or wallet.",
          "They react with guilt, anger, or panic when you slow down.",
          "Photos look professional, inconsistent, or reused across profiles.",
        ],
      },
      {
        title: "Prevention",
        body: "Protect both your money and your sense of reality by adding independent checks.",
        items: [
          "Reverse-search profile images and compare stories across platforms.",
          "Speak with a trusted friend before sending money or documents.",
          "Never receive or move funds for someone you have not met.",
          "Keep dating and social accounts protected with strong passwords and MFA.",
        ],
      },
    ],
    examples: [
      {
        title: "Travel emergency",
        description: "A person claims they are finally visiting but needs fees, tickets, customs money, or medical costs paid first.",
      },
      {
        title: "Investment romance",
        description: "A romantic contact introduces a crypto platform, starts with small gains, then escalates deposits.",
      },
    ],
    faqs: [
      {
        question: "Should I confront the person?",
        answer: "Prioritize safety and records. Stop sending money, preserve evidence, report, and seek support from trusted people.",
      },
      {
        question: "Why do smart people get caught?",
        answer: "These scams target trust, hope, loneliness, and stress. Intelligence does not make anyone immune to manipulation.",
      },
    ],
  },
  "dating-scams": {
    slug: "dating-scams",
    title: "Dating App Scam Guide",
    eyebrow: "App safety",
    description: "Spot fake profiles, sextortion traps, subscription bait, and off-platform pressure before they escalate.",
    intro:
      "Dating app scams move quickly because scammers want to leave the platform, avoid moderation, and create a situation where the victim feels embarrassed or rushed.",
    sections: [
      {
        title: "Common dating scams",
        body: "The hook may look romantic, flirtatious, businesslike, or casual.",
        items: [
          "Fake profiles using stolen photos and generic bios.",
          "Sextortion after intimate images or video calls.",
          "Verification or premium-site links that steal card details.",
          "Crypto, forex, or side-income pitches disguised as dating.",
        ],
      },
      {
        title: "Fake profile tells",
        body: "No single clue proves fraud, but patterns matter.",
        items: [
          "Very few local details despite claiming to live nearby.",
          "Profile photos that look too polished or inconsistent.",
          "Immediate requests to move to another app.",
          "Avoiding normal conversation while pushing links, photos, or money topics.",
        ],
      },
      {
        title: "Safety checklist",
        body: "The safest dating workflow is slow, local, and verifiable.",
        items: [
          "Keep early conversations inside the app.",
          "Do not share intimate images with strangers or new contacts.",
          "Use video calls cautiously and avoid showing identifying details.",
          "Meet in public, tell someone your plan, and control your own transport.",
        ],
      },
    ],
    examples: [
      {
        title: "Sextortion trap",
        description: "A match pushes sexual chat, records or fabricates content, then threatens to send it to contacts unless paid.",
      },
      {
        title: "Verification link",
        description: "A match sends a safety verification site that is actually a card-harvesting page.",
      },
    ],
    faqs: [
      {
        question: "Should I pay a sextortion demand?",
        answer: "Payment rarely ends the threat. Preserve evidence, block, report to the platform and law enforcement, and ask for help quickly.",
      },
      {
        question: "Are paid dating verifications legitimate?",
        answer: "Treat off-platform payment or identity links from matches as unsafe. Use only the dating app's own published verification tools.",
      },
    ],
  },
  "fake-websites": {
    slug: "fake-websites",
    title: "Fake Website Detection",
    eyebrow: "Domain checks",
    description: "Learn how clone stores, phishing portals, and fake login pages use design polish to hide weak signals.",
    intro:
      "A fake website can look almost identical to a real brand. Domain details, payment behavior, page quality, and independent reputation checks matter more than visual confidence.",
    sections: [
      {
        title: "Common fake websites",
        body: "Fraud sites often target moments when people are already ready to act.",
        items: [
          "Clone stores promoted through ads or social posts.",
          "Fake banking, exchange, wallet, tax, courier, and government login pages.",
          "Ticket, rental, job, charity, and grant pages collecting upfront fees.",
          "Tech support pages that push downloads or remote access.",
        ],
      },
      {
        title: "Domain verification",
        body: "Look at the full hostname, not just the logo or page title.",
        items: [
          "Watch for misspellings, extra hyphens, odd subdomains, and unusual TLDs.",
          "Check domain age and registrar details when available.",
          "Compare against the official domain listed in trusted app stores, statements, or regulator sites.",
          "Search the exact domain with complaint and scam terms.",
        ],
      },
      {
        title: "HTTPS myths",
        body: "A padlock only means the connection is encrypted. It does not prove the operator is honest.",
        items: [
          "Scammers can get free TLS certificates.",
          "Certificate names often do not verify the brand behind the page.",
          "A missing HTTPS connection is a major warning for forms and payments.",
          "A present HTTPS connection is only one small positive signal.",
        ],
      },
      {
        title: "WHOIS explanation",
        body: "WHOIS and RDAP records can reveal registration dates, registrar, and nameserver patterns, but many owners use privacy services.",
        items: [
          "A very new domain selling expensive goods at extreme discounts is risky.",
          "Privacy protection is common and not proof of fraud by itself.",
          "Recently changed nameservers can be a clue when paired with other signals.",
          "Always combine WHOIS with content, payment, and reputation checks.",
        ],
      },
    ],
    examples: [
      {
        title: "Clone outlet store",
        description: "A site copies brand imagery, uses deep discounts, accepts only irreversible payment, and ships nothing.",
      },
      {
        title: "Fake login portal",
        description: "A search result leads to a lookalike login page that captures credentials and one-time codes.",
      },
    ],
    faqs: [
      {
        question: "Is a domain age check enough?",
        answer: "No. It is one signal. Old domains can be compromised and new legitimate businesses exist.",
      },
      {
        question: "Can I trust a site because it appears in search ads?",
        answer: "No. Scam ads can pass review temporarily. Type known domains directly for sensitive accounts.",
      },
    ],
  },
};

export const reportingResources = [
  {
    region: "India",
    title: "National Cyber Crime Portal",
    href: "https://cybercrime.gov.in/",
    detail: "Report cyber fraud, financial fraud, identity misuse, and online harassment.",
  },
  {
    region: "United States",
    title: "FTC ReportFraud",
    href: "https://reportfraud.ftc.gov/",
    detail: "Report scams, bad business practices, identity theft, and fraud attempts.",
  },
  {
    region: "United States",
    title: "FBI IC3",
    href: "https://www.ic3.gov/",
    detail: "Report internet-enabled crime including crypto, romance, phishing, and business email compromise.",
  },
  {
    region: "United Kingdom",
    title: "Action Fraud",
    href: "https://www.actionfraud.police.uk/",
    detail: "National reporting center for fraud and cyber crime.",
  },
  {
    region: "Canada",
    title: "Canadian Anti-Fraud Centre",
    href: "https://antifraudcentre-centreantifraude.ca/",
    detail: "Report fraud attempts and find current alerts.",
  },
  {
    region: "Australia",
    title: "ReportCyber",
    href: "https://www.cyber.gov.au/report-and-recover/report",
    detail: "Australian cybercrime reporting and recovery guidance.",
  },
];
