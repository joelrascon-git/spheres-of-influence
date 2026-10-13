# Prompt Used (Context)

```
AmEx Orgs/Domains

Task:
Research and find all the major orgs/domains AmEx has that would be highly relevant for selling Factory into OR even relevance of an org/domain that would directly benefit from an investment into Factory even if it's coming from somewhere else.

Context:
Use the other chats in this project to get any context that would help you with this task.
Attaching various markdown files that come from other chats in this project to help make things easier.

Goal:
As a strategic seller, I need to be able to navigate a massive account like AmEx. Understanding things like relationships between these orgs, which are most relevant to selling Factory, what are the names of these orgs/domains inside of AmEx (as in what they call those orgs/domains) to document that for navigating.

Format:
* Markdown file
* Context of this output will be for AI agents to analyze and understand this data quickly and efficiently.
* Where it makes sense, please include inline sources/links to verify information
* If found, and is deterministic, also highlight where any other relevant inititivates/challenges/pains/etc... are related to this org/domain

Order of importance:
* For each org/domain you surface, explain what they are, what they do, and how they relate to AmEx.
* If found, provide the relevant key people and why they're relevant

You have autonomy on how you go about this and what you look for to generate in your output and should not be limited to just the information I have provided you.
```

**Attached context files:** `AmEx - Account Mapping.md`, `AmEx - Initiatives.md`, `AmEx - Challenges:Pains.md`, `Factory - Knowledgebase.md`
**Generated:** October 12, 2026

**Cross-reference keys used below:**
- **I1–I14** = initiatives from `AmEx - Initiatives.md`. I1 Agentic SDLC/AI Transformation; I2 Tech backlog pull-forward; I3 Agentic commerce (ACE); I4 Commercial roadmap (Center/Hyper/Amex Corporate); I5 Financial-crimes remediation; I6 BigQuery migration; I7 Payments network modernization; I8 Servicing AI; I9 Credit & fraud AI; I10 Marketing AI; I11 Dining (Resy/Tock/TheFork); I12 Premium product refresh; I13 International/EU regulation; I14 Agentic AI platform engineering & governance.
- **Ch1–Ch16** = challenges from `AmEx - Challenges:Pains.md`. Ch1 BSA/AML/OFAC consent orders; Ch2 Tech backlog; Ch3 Assisted→agentic SDLC; Ch4 BigQuery app-migration tail; Ch5 Category II; Ch6 Middle-market vs Ramp/Brex; Ch7 Cost/margin; Ch8 Agentic-commerce trust; Ch9 Sales-practices legacy; Ch10 Third-party & cyber risk; Ch11 Cobrand concentration; Ch12 Legacy IVR; Ch13 International regulation & M&A; Ch14 Network resiliency; Ch15 Talent/culture; Ch16 Amex GBT.

**Confidence labels:** Confirmed = primary or reputable source; Secondhand = single secondary profile/aggregator; Inference = analyst reasoning; Unverified = not found or not re-checked.

---

# Output

# American Express (AXP) Org & Domain Navigation Map for Selling Factory (October 2026)

The org that best fits Factory, and has the money, is **Enterprise Technology Services (ETS)**, run by EVP & CIO **Ravi Radhakrishnan**. He reports to **Howard Grosfield**, Group President of U.S. Consumer Services, who also "leads American Express' enterprise-wide technology" and is "leading the AI transformation program strategy for the enterprise" ([AmEx IR](https://ir.americanexpress.com/governance-and-corporate-responsibility/executive-committee-and-directors/default.aspx)). The day-to-day AI agenda is shaped by the **AI Transformation Office (AITO)** under **Jon Gantman** and by the **Developer Experience / Developer Enablement** team under **Michelle Swartz**. Expect **Information Security (CISO Gleb Reznik)**, **Global Risk & Compliance (CRO Doug Tabish)** and **Global Supply Management (CPO Miguel Gonzalez)** to act as gatekeepers. The best near-term entry is to pitch Factory as the "agentic execution layer" for AmEx's own spec-driven "Ideation to Implementation" SDLC. Funded wedges that can lead in are BigQuery app migration and financial-crimes remediation.

---

## TL;DR
- **Where the money and the decision sit:** Grosfield (Group President USCS) owns enterprise technology and AI-transformation strategy. CIO Radhakrishnan runs ETS, which covers delivery and operations, technology risk and information security, core enterprise platforms, enterprise data governance and platforms, digital product and design, and enterprise AI platforms ([AmEx IR](https://ir.americanexpress.com/governance-and-corporate-responsibility/executive-committee-and-directors/default.aspx)). So the economic buyer is ETS/CIO. Grosfield and the AI Transformation Office are the executive sponsors. Confidence: Confirmed.
- **Why now:** According to AmEx's FY2025 Annual Report and Squeri's 2026 Chairman's Letter, the company has "scaled AI-assisted development tools to more than 11,000 engineering professionals, reducing coding cycle time by over 30 percent, and are scaling agentic coding tools" ([FY2025 Annual Report](https://www.sec.gov/Archives/edgar/data/4962/000110465926034161/tm265890d2_ars.pdf)). In May 2026 it published a spec-driven SDLC whose own conclusion was "the biggest challenge is not engineering complexity – It's mindset" ([americanexpress.io](https://americanexpress.io/reimagining-software-delivery-with-ai/)). It is also moving "a core on-premise warehouse and hundreds of production applications to BigQuery" ([Google Cloud Next '26](https://cloud.google.com/blog/topics/google-cloud-next/welcome-to-google-cloud-next26)). In addition, on Oct 8, 2026 the OCC issued a cease-and-desist order and a $350M civil money penalty against AENB, and the Fed issued a parallel C&D naming American Express Company and TRS; Comptroller Jonathan Gould said AmEx "failed to maintain a BSA/AML compliance program properly aligned with the money laundering risks of its operations" ([OCC](https://www.occ.gov/news-issuances/news-releases/2026/nr-occ-2026-87.html)). Each of these maps to a Factory capability: autonomous agents, Missions for migrations, review and QA automation, and auditable delivery. Confidence: Confirmed.
- **How to navigate:** Multi-thread top-down (Grosfield → Radhakrishnan → Gantman/AITO) and bottom-up (Swartz's Developer Enablement plus the segment unit CIOs: Kensey for Global Servicing/Corporate, Sharples for GMNS). Run the security, model-governance and procurement gates in parallel from day one. Use Center/Hyper (commercial) and Resy/Tock/TheFork (dining) as fast, lower-risk lighthouse projects. Confidence: Inference.

---

## Key Findings

1. **Technology now reports into a business president.** Since February 2025, the CIO, the EVP of Enterprise Digital & Data Services (EDDS) and the EVP of Amex Digital Labs all report to Howard Grosfield. Squeri's memo calls it "an expanded role that will include leadership of Technology, Enterprise Digital & Data Services (EDDS) and Digital Labs." Factory must therefore sell to a business-outcome sponsor, not only to IT. Confidence: Confirmed ([Jan 30, 2025 8-K, Exhibit 99.1](https://www.sec.gov/Archives/edgar/data/4962/000000496225000010/exhibit991jan302025executi.htm)).
2. **"Enterprise Technology Services" is AmEx's official name for the central technology organization.** The CIO bio on AmEx's IR site says he "oversees the Enterprise Technology Services organization" ([AmEx IR](https://ir.americanexpress.com/governance-and-corporate-responsibility/executive-committee-and-directors/default.aspx)). The same name appears in India apprenticeship programs ("Enterprise Technology Services Apprenticeship 2026", Bengaluru/Gurugram/Chennai) ([listing](https://www.globalsouthopportunities.com/2026/09/27/technology-3/)). Confidence: Confirmed.
3. **The enterprise AI program has a named office.** The "Enterprise AI Transformation Office" (AITO) "will lead enterprise-wide measurement and governance... and modernize core business enablement processes (e.g., TLM, New Product Development, Model Governance)." The AITO "is leading an enterprise-wide effort to reimagine and modernize core risk and governance processes for an AI-enabled organization, working across all lines of defense" ([job posting](https://simplify.jobs/p/0997e645-427b-43ef-a8d9-9f32957ed250/Director-of-Strategic-Planning)). Radhakrishnan held an ETS town hall featuring "Jon Gantman from our American Express AI Transformation Office" ([CIO LinkedIn](https://www.linkedin.com/in/ravikumar-radhakrishnan/)). Confidence: Confirmed. Gantman's exact title, "EVP – Cobrand, Product Development and AI Transformation Office", is Secondhand ([RocketReach](https://rocketreach.co/jon-gantman-email_56972201)).
4. **The CTO seat is ambiguous.** Hilary Packer was EVP & CTO, and VentureBeat (Feb 2025) called the CTO organization the "technical heartbeat" of Technology ([VentureBeat via X](https://x.com/VentureBeat/status/1890184450794721296?lang=en)). Secondary profiles say she became "EVP, Head of Enterprise Data & AI" around August 2025 ([Humantic](https://humantic.ai/public-profile/hilary-packer-9f3f75955dbd6ea4)). No successor CTO was found. The CIO's IR bio now explicitly covers data, AI and digital, which suggests consolidation under the CIO. Confidence: Inference / Unverified successor.
5. **Segment-aligned "unit CIOs" exist and are the mid-level buyers.** Gary Kensey is "EVP and unit CIO of global servicing and corporate technology" ([CIO.com, 2025](https://www.cio.com/article/4062034/american-express-credits-ai-with-improving-customer-experiences.html)). His corporate remit includes Finance, Global Supply Management, Global Risk & Compliance and Internal Audit technology ([Qwoted bio](https://app.qwoted.com/sources/gary-kensey)). Jason Sharples is listed as "Senior Vice President and Unit CIO, Global Merchant and Network Services" ([theorg.com](https://theorg.com/org/american-express/person/jason-sharples); Secondhand). The heads of Global Commercial Services Technology and Consumer Services & Enterprise Digital & Data Technology were not found.
6. **The gatekeepers are named.**
   - CISO Gleb Reznik replaced Fred Gibbins in March 2026 ([SecurityWeek](https://www.securityweek.com/industry-moves/mar-16-2026/)). Reznik joined in August 2024 as SVP, Technology Risk and Information Security, and the CISO reports to the CIO.
   - Technology risk is overseen by the Technology, Data, Resiliency Risk Committee (TDRRC), co-chaired by the CIO and the Head of Technical Risk Management ([FY2025 10-K Item 1C summary](https://www.board-cybersecurity.com/annual-reports/tracker/20260206-american-express-cybersecurity-10k)).
   - AmEx's FY2023 annual report says it formed "an internal Generative AI Council that includes leaders across our technology, data science, risk management, legal, and strategy teams to assess and approve the deployment of Generative AI use cases" ([FY2023 Annual Report](https://www.sec.gov/Archives/edgar/data/4962/000000496224000018/americanexpressannualrepor.pdf)).
   - Procurement is Global Supply Management under Miguel Gonzalez (SVP, CPO), who reports to Denise Pickett (President, Enterprise Shared Services) ([LinkedIn](https://www.linkedin.com/in/miguel-gonzalez-nacd/)).
7. **There are fresh, funded transformation programs.** The BigQuery migration ([Google Cloud Next '26](https://cloud.google.com/blog/topics/google-cloud-next/welcome-to-google-cloud-next26)), the ACE agentic-commerce kit (April 14, 2026) ([AmEx](https://www.americanexpress.com/en-us/newsroom/articles/innovation/american-express-debuts-agentic-commerce-experiences--ace--devel.html)), the Hyper acquisition (announced April 16, 2026, terms undisclosed; Raymond Joabar said Hyper's AI-agent expertise would feed "our expense management platform launching later this year", and no report of the deal closing was found) ([FinTech Futures](https://www.fintechfutures.com/m-a/american-express-acquires-hyper)), TheFork ($700M, announced June 15, 2026; close expected by end of 2026) ([PYMNTS](https://www.pymnts.com/partnerships/2026/amex-looks-to-spend-700-million-to-buy-thefork-from-tripadvisor/)) and the OCC/Fed consent orders (Oct 8, 2026) each create bounded engineering backlogs where Factory can show measurable throughput.

---

## 1. Corporate & Legal Structure (context)

| Entity | Role | Relevance to Factory contracting | Confidence |
|---|---|---|---|
| American Express Company (AXP), 200 Vesey St, New York | Parent and bank holding company; named in the Fed C&D (Oct 8, 2026) | Board and Executive Committee level | Confirmed |
| American Express Travel Related Services Company, Inc. (TRS) | Principal operating subsidiary; also a registered bank holding company named in the Fed C&D | Likely vendor-contracting entity | Inference |
| American Express National Bank (AENB), Sandy, UT | OCC-regulated bank; $350M civil money penalty plus C&D (Oct 8, 2026) ([OCC](https://www.occ.gov/news-issuances/news-releases/2026/nr-occ-2026-87.html)); Squeri is CEO; Raj Bharadwaj is EVP & COO | Bank-level third-party risk and OCC expectations apply to vendors touching bank systems | Confirmed |
| American Express (India) Pvt Ltd: Gurugram, Bengaluru, Chennai, plus Delhi, Mumbai, Pune | Largest campus worldwide (~1M sq ft, Gurugram, opened 2024) ([Business Standard](https://www.business-standard.com/companies/news/american-express-opens-its-largest-campus-worldwide-in-gurugram-india-124050200575_1.html)); Bengaluru office is mostly the Technology group ([AmEx careers](https://www.americanexpress.com/en-us/careers/locations/bangalore/)); Sanjay Khanna is CEO & Country Manager, India | Large share of engineering capacity; RBI data-localization considerations | Confirmed (campus, Bengaluru = tech); headcount Unverified |
| American Express Global Business Travel (Amex GBT) | Separate company (CTO Michael Esquibel, appointed Sept 2026) ([BTN Europe](https://www.businesstravelnewseurope.com/On-the-Move/Amex-GBT-names-Esquibel-as-chief-technology-officer)); Joabar sits on the GBTG board | Out of scope / separate account | Confirmed |

---

## 2. Org Hierarchy Tree (AmEx's own names)

```
American Express Company — Stephen J. Squeri, Chairman & CEO (also CEO, AENB)
│
├── U.S. Consumer Services (USCS) — Howard Grosfield, Group President  [Confirmed]
│   ├── USCS businesses: U.S. Consumer Card, Amex Travel, Centurion Lounges, Global Dining (Resy/Tock/[TheFork pending]), U.S. Consumer Banking, Amex Offers Digital Media
│   ├── Enterprise-wide Technology → Ravi Radhakrishnan, EVP & CIO (AXP + AENB)  [Confirmed reporting line, Jan 2025 8-K]
│   │   └── ENTERPRISE TECHNOLOGY SERVICES (ETS)  [Confirmed name]
│   │       ├── Technology Risk & Information Security (TRIS) — Gleb Reznik, CISO (since Mar 2026)  [Secondhand: SecurityWeek]
│   │       ├── Enterprise Data & AI — Hilary Packer, EVP, Head of Enterprise Data & AI  [Secondhand]
│   │       │   └── Chief Data Office — Chris Gifford, Chief Data Officer (since Sept 2025)  [Confirmed appointment; reporting line Inference]
│   │       ├── (former) CTO Organization → Developer Experience
│   │       │   └── Developer Enablement — Michelle Swartz, VP  [Confirmed title; parent post-2025 Inference]
│   │       ├── Unit CIO, Global Servicing & Corporate Technology — Gary Kensey, EVP  [Confirmed via CIO.com]
│   │       ├── Unit CIO, Global Merchant & Network Services (GMST / GMNS Technology) — Jason Sharples, SVP  [Secondhand]
│   │       ├── Global Commercial Services Technology — head Unverified
│   │       ├── Consumer Services & Enterprise Digital & Data Technology — head Unverified
│   │       ├── Mainframe & Data Center Infrastructure / Enterprise Platforms — head Unverified
│   │       └── Enterprise AI platforms (agentic AI platform teams; Distinguished Engineers e.g. Michael J. Bailey)
│   ├── Enterprise Digital & Data Services (EDDS) — Pascale Voldman Hutz, EVP  [Confirmed Jan 2025; current status Unverified]
│   ├── Amex Digital Labs / Global Innovation — Luke Gebb, EVP & Head of Global Innovation  [Confirmed]
│   ├── Global Advertising & Brand Management; Corporate Development  [Confirmed]
│   └── Enterprise AI Transformation Office (AITO) — Jon Gantman, EVP (Cobrand, Product Development & AITO)  [Office Confirmed; title Secondhand; reporting line Inference]
│
├── Global Commercial Services (GCS) + Global Servicing — Raymond Joabar, Group President  [Confirmed]
│   ├── U.S. SME, Global Commercial Card, B2B payments, working capital, spend mgmt (Center, Hyper, Amex One AP)
│   └── Global Servicing — Mohammed Badi, President (card, travel & concierge, credit & collections, fraud and financial-crimes ops)  [Confirmed]
│       └── Global Support, Enablement & Control — Anthony Devane  [Confirmed via Payments Dive]
│
├── Global Merchant & Network Services (GMNS) — Anna Marrs, Group President  [Confirmed]
│   ├── Global Merchant Services, Global Network Services, Global Strategic Partnerships (Glenda McNeal, Chief Partner Officer), China JV
│   └── Credit & Fraud Risk (CFR) — David Nigro, Chief Credit Officer (EC member)  [Confirmed]
│
├── International Card Services (ICS) — Rafael Marquez, President (sponsor of TheFork deal)  [Confirmed]
│
├── Enterprise Shared Services (ESS) — Denise Pickett, President  [Confirmed]
│   ├── Global Supply Management — Miguel Gonzalez, SVP & Chief Procurement Officer
│   ├── Global Security — Jeff Irvine, SVP; Business Continuity (Brian Zerr, SVP) → "Business Resilience & Corporate Functions Management"
│   ├── Global Real Estate & Workplace Experience — Paul Gioioso, SVP; Aviation; Internal Fraud
│
├── Global Risk & Compliance — Doug Tabish, Chief Risk Officer (AXP + AENB; regulatory exams; Global Privacy Program)  [Confirmed]
│   └── Project Guardian Program Office — Gina Taylor, EVP  [Confirmed]
├── Finance — Christophe Le Caillec, CFO  [Confirmed]
├── General Counsel's Organization — Laureen Seeger, Chief Legal Officer (ERMC member)  [Confirmed]
├── Internal Audit Group — Alan Gallo, Chief Audit Executive (reports to Audit & Compliance Committee)  [Confirmed]
├── Colleague Experience Group — Monique Herena, Chief Colleague Experience Officer  [Confirmed]
├── Strategy — Nicole Hildebrandt, Chief Strategy Officer (enterprise, BU and M&A strategy)  [Confirmed]
├── Marketing — Elizabeth Rutledge, CMO; Corporate Affairs — Jennifer Skyler  [Confirmed]
└── AENB — Raj Bharadwaj, EVP & COO (reports to Squeri)  [Confirmed]
```

Note: Vice Chairman Doug Buckminster retired on March 6, 2026 ([FY2026 proxy](https://www.sec.gov/Archives/edgar/data/4962/000110465926034163/tm2519434-8_def14a.htm)). Corporate Development and brand now sit with Grosfield.

Primary sources for the tree: [AmEx IR Executive Committee](https://ir.americanexpress.com/governance-and-corporate-responsibility/executive-committee-and-directors/default.aspx); [Jan 30, 2025 8-K Exhibit 99.1](https://www.sec.gov/Archives/edgar/data/4962/000000496225000010/exhibit991jan302025executi.htm); [FY2026 proxy](https://www.sec.gov/Archives/edgar/data/4962/000110465926034163/tm2519434-8_def14a.htm).

---

## 3. Ranked Summary Table: Orgs/Domains by Factory Relevance

| Rank | AmEx org name | Parent / reporting line | Leader(s) | What it does | Factory fit | Linked initiatives / challenges | Buying role | Confidence |
|---|---|---|---|---|---|---|---|---|
| 1 | Enterprise Technology Services (ETS) | CIO → Grosfield | Ravi Radhakrishnan | Global tech delivery and ops, platforms, TRIS, data, digital, enterprise AI platforms | Very High: whole Droid platform, Factory Private, Analytics, Router | I1, I2, I6, I7, I14; Ch2, Ch3, Ch7, Ch15 | Economic buyer | Confirmed |
| 2 | Enterprise AI Transformation Office (AITO) | Enterprise program led by Grosfield | Jon Gantman | Enterprise AI measurement, governance, modernization of TLM/NPD/Model Governance | Very High: ROI measurement (Factory Analytics), governance-friendly agent rollout | I1, I14; Ch3, Ch5 | Executive sponsor / influencer | Confirmed office; title Secondhand |
| 3 | Developer Experience / Developer Enablement | ETS (historically the CTO org) | Michelle Swartz (VP) | Copilot rollout, onboarding bootcamps, paved roads, Amex Way Library, guilds, DevCon, sentiment survey, OSPO | Very High: technical champion; paved-road integration of Droids, Droid Exec in CI | I1; Ch3, Ch15 | Champion / evaluator | Confirmed |
| 4 | Enterprise Data & AI / Chief Data Office | ETS | Hilary Packer (EVP, Head of Enterprise Data & AI), Chris Gifford (CDO) | Data governance, data platforms, AI engineering, GenAI enablement, BigQuery migration | Very High: Missions for app migration to BigQuery; Docs Refresh; context unification | I6, I1; Ch4 | Co-buyer / project owner | Gifford Confirmed; Packer Secondhand |
| 5 | Global Merchant & Network Services Technology (GMST) | ETS unit CIO ↔ GMNS | Jason Sharples (SVP Unit CIO), Secondhand | Low-latency 24x7 card transaction platform; network modernization; ACE agentic commerce | High: Missions for modernization, Alert Responder, CI Failure Triage, Security Review | I3, I7; Ch8, Ch14 | Project buyer / user | Secondhand |
| 6 | Global Servicing & Corporate Technology | ETS unit CIO ↔ Global Servicing + corporate functions | Gary Kensey (EVP Unit CIO) | Tech for servicing, fraud/financial-crimes ops, Finance, GRC, Audit, Supply Mgmt, HR | High: financial-crimes remediation backlog, IVR replacement, regulatory reporting code | I5, I8; Ch1, Ch5, Ch12 | Project buyer | Confirmed |
| 7 | Global Commercial Services Technology | ETS ↔ GCS (Joabar) | Head Unverified (former: Allegra Driscoll) | SME & commercial card platforms, "Business Blueprint", Center/Hyper integration (Seattle-area engineering) | High: acquisition integration Missions, Ticket-to-PR for Next-gen Corporate roadmap | I4; Ch6, Ch13 | Project buyer | Org Confirmed; head Unverified |
| 8 | Consumer Services & Enterprise Digital & Data Technology | ETS ↔ USCS/EDDS | Head Unverified; EDDS EVP Pascale Voldman Hutz | Mobile/web, AI/ML, marketing tech, enterprise comms, travel & lifestyle, automation | High: front-end refactors, Automated QA, Resy/Tock merge | I10, I11, I12; Ch2 | Project buyer | Org Confirmed |
| 9 | Technology Risk & Information Security (TRIS) | CISO → CIO | Gleb Reznik (CISO) | Cyber strategy, engineering, ops; tech risk | Gate plus a use case: Security Review automation, "Agentic AI Engineer – Cybersecurity" team | I14; Ch10 | Gatekeeper / possible buyer | Secondhand (Reznik) |
| 10 | Global Risk & Compliance + Project Guardian Program Office | CRO | Doug Tabish, Gina Taylor | Second line, regulatory exams, privacy, remediation program | Indirect beneficiary: faster, auditable remediation of BSA/AML systems | I5; Ch1, Ch5, Ch9 | Gatekeeper / indirect funder | Confirmed |
| 11 | Amex Digital Labs / Global Innovation | Grosfield | Luke Gebb | Agentic commerce (ACE kit), Agent Purchase Protection | Medium–High: rapid prototyping, spec mode | I3; Ch8 | Influencer / user | Confirmed |
| 12 | Global Supply Management | ESS (Pickett) | Miguel Gonzalez | Procurement, supplier management | Gate | Ch10 | Gatekeeper | Confirmed |
| 13 | Credit & Fraud Risk (CFR) | GMNS (Marrs) | David Nigro | Credit/fraud models, predictive decisioning | Medium: model-platform code; model risk constraints | I9 | Indirect beneficiary | Confirmed |
| 14 | Acquired engineering orgs (Center, Hyper, Resy/Tock/Rooam, TheFork) | GCS / USCS / ICS | Marc Baghadjian (Hyper) | Product engineering at fintech/consumer-app speed | High as lighthouse projects | I4, I11; Ch6, Ch13 | Lighthouse users | Confirmed deals |
| 15 | General Counsel's Org / Privacy / Internal Audit | CLO / CRO / CAE | Seeger, Tabish, Gallo | Contract, data use, AI regulation, audit | Gate | Ch5, Ch13 | Gatekeeper | Confirmed |

---

## 4. Detailed Org Profiles (consistent schema)

### 4.1 Enterprise Technology Services (ETS)
- **AmEx name / aliases:** Enterprise Technology Services; "Technology"; "#AmexTech"; Office of the CIO
- **Type:** Central enterprise technology organization
- **Parent & reporting line:** CIO Ravi Radhakrishnan → Howard Grosfield, Group President USCS (since Feb 2025) ([8-K](https://www.sec.gov/Archives/edgar/data/4962/000000496225000010/exhibit991jan302025executi.htm)). Confirmed.
- **Segment/P&L served:** All four segments plus Corporate & Other; the CIO is also an officer of AENB.
- **What it does:** Per the [IR bio](https://ir.americanexpress.com/governance-and-corporate-responsibility/executive-committee-and-directors/default.aspx), "leading the delivery and operations of technology capabilities, platforms, and services globally; technology risk and information security; product management for core enterprise platforms; enterprise data governance and platforms; digital product and design; and enterprise AI platforms." Confirmed.
- **Size / locations:** 11,000+ engineering professionals have AI-assisted development tools ([FY2025 annual report](https://www.sec.gov/Archives/edgar/data/4962/000110465926034161/tm265890d2_ars.pdf); Squeri shareholder letter, March 2026). Hubs: New York, Phoenix, Sunrise FL, Salt Lake City area, Seattle/Bellevue (GCS/Center), Reading UK, Gurugram/Bengaluru/Chennai India. Locations come from job postings and are Confirmed where cited; total headcount is Unverified.
- **Tech stack signals:**
  - GitHub Copilot: 6,000 engineers had access by mid-2024 (American Banker). VentureBeat later quoted then-CTO Hilary Packer: "Amex's 9,000 engineers now use GitHub Copilot, mainly for testing and code completions" ([MarketScreener/VentureBeat](https://www.marketscreener.com/quote/stock/AMERICAN-EXPRESS-COMPANY-4814/news/Amex-CTO-Hilary-Packer-on-AI-Strategy-49946377/)).
  - Paved roads for JVM, Go and Python; Amex Way Library ([americanexpress.io](https://americanexpress.io/empowering-innovation-the-python-paved-road/)).
  - GCP/BigQuery migration.
  - Kubernetes; observability via Splunk, Grafana, Dynatrace and ELK; RAG, agentic workflows and MCP integrations (UK Senior AI Engineer posting via [ITJobsWatch](https://www.itjobswatch.co.uk/jv/American-Express/Senior-AI-Engineer-I-Job-Reading-Berkshire-UK-4wz612)).
- **Key people:**
  - Ravi Radhakrishnan (EVP & CIO since Jan 2022; ex-Wells Fargo Enterprise CIO; ran research partnerships with Stanford HAI and the MIT-IBM Watson AI Lab). Economic buyer. Publicly champions "continuous modernization" and AI governance ([Metis Strategy, Apr 2025](https://www.metisstrategy.com/interview/ravi-radhakrishnan/)).
- **Factory relevance:** Very High. Fits the full platform: Droids across the SDLC, Factory Private (VPC/on-prem) for a regulated bank, a model-agnostic Router that complements Copilot, and Factory Analytics to prove the ">30% coding time" claim at the delivery level.
- **Linked initiatives/challenges:** I1, I2, I6, I7, I14; Ch2, Ch3, Ch7, Ch10, Ch15
- **Buying role:** Economic buyer
- **Confidence:** Confirmed

### 4.2 Enterprise AI Transformation Office (AITO)
- **AmEx name / aliases:** Enterprise AI Transformation Office; "American Express AI Transformation Office"; AITO
- **Type:** Enterprise program office
- **Parent & reporting line:** Grosfield is "leading the AI transformation program strategy for the enterprise" ([IR](https://ir.americanexpress.com/governance-and-corporate-responsibility/executive-committee-and-directors/default.aspx)). Gantman's title combines Cobrand, Product Development and AITO, which suggests AITO sits in USCS under Grosfield. Inference.
- **What it does:** "Lead enterprise-wide measurement and governance, cultivate a future pipeline of transformation opportunities, and modernize core business enablement processes (e.g., TLM, New Product Development, Model Governance)." It also leads an effort "to reimagine and modernize core risk and governance processes for an AI-enabled organization, working across all lines of defense, legal, regulatory, and technology partners." Confirmed ([Director of Strategic Planning – Enterprise AI Transformation Office posting](https://simplify.jobs/p/0997e645-427b-43ef-a8d9-9f32957ed250/Director-of-Strategic-Planning)).
- **Key people:**
  - Jon Gantman. [RocketReach](https://rocketreach.co/jon-gantman-email_56972201) lists him as EVP – Cobrand, Product Development and AI Transformation Office (2026) and EVP – Cobrand Products and NPD (2025–26) (Secondhand). He presented at the ETS town hall ([CIO LinkedIn](https://www.linkedin.com/in/ravikumar-radhakrishnan/), Confirmed). He is the executive sponsor for "AI-enabled operating model" outcomes.
- **Factory relevance:** Very High. AITO owns enterprise AI measurement, so Factory Analytics (adoption, PR throughput, cycle time) speaks its language. AITO is also simplifying "approval and enablement pathways", which can shorten Factory's governance review.
- **Linked:** I1, I14; Ch3, Ch5, Ch7
- **Buying role:** Executive sponsor / influencer; possible co-funder
- **Confidence:** Office Confirmed; leader title Secondhand

### 4.3 Developer Experience / Developer Enablement
- **AmEx name / aliases:** Developer Experience (DevEx); Developer Enablement; "Building Software" program; Paved Roads; Amex Way Library; Open Source Program Office
- **Parent:** Swartz said in 2024 that the org "falls underneath our chief technology office" ([DX podcast](https://getdx.com/podcast/developer-experience-american-express/)). With the CTO role now unclear, it is likely in ETS under the CIO or Enterprise Data & AI. Inference.
- **What it does:** Onboarding, experienced-engineer bootcamps, guilds and communities of practice, DevCon and GuildCon, the Technologist Sentiment Survey, the americanexpress.io blog and the OSPO. Swartz's "most recent accomplishment was rolling out GitHub Copilot to thousands of engineers." There is a sister Platform Development team that builds tooling. Confirmed ([americanexpress.io author page](https://americanexpress.io/u/michelleswartz/); [DX podcast](https://getdx.com/podcast/developer-experience-american-express/); [LinearB](https://linearb.io/blog/elevating-developer-experience-american-express-engineering-culture)).
- **Key people:**
  - Michelle Swartz, VP Developer Enablement (Phoenix; at AmEx 19+ years; formerly Chief of Staff, Office of the CIO, 2018–2020) ([LinkedIn](https://www.linkedin.com/in/michelle-swartz-9a5941/)). Technical champion and route to the CIO's staff. She uses the "paved road" philosophy: "We try not to use the four-letter word 'must'."
  - Distinguished Engineers who own the paved roads (e.g., JVM and Go guilds), and Michael J. Bailey (Distinguished Engineer, [americanexpress.io](https://americanexpress.io/) author).
- **Factory relevance:** Very High. Make Factory a paved road: Droid Exec in CI, Code Review and CI Failure Triage Automations, and an onboarding bootcamp module. The sentiment survey and usage metrics give a baseline for Factory Analytics.
- **Linked:** I1; Ch3, Ch15
- **Buying role:** Champion / technical evaluator / rollout owner
- **Confidence:** Confirmed

### 4.4 Enterprise Data & AI and the Chief Data Office
- **AmEx name / aliases:** Enterprise Data & AI; Chief Data Office (CDO); "American Express Data Management and Products teams"; EDDS (legacy name: Enterprise Digital & Data Solutions/Services)
- **Parent:** ETS. Radhakrishnan's role "recently expanded to include product management of enterprise data platforms and the Chief Data Office" ([Metis Strategy, Apr 2025](https://www.metisstrategy.com/interview/ravi-radhakrishnan/)).
- **What it does:** Per an AmEx job ad reposted on a third-party board (Secondhand, [Techstars jobs](https://jobs.techstars.com/companies/hackajob/jobs/69842342-data-engineer)), "unites the data governance, strategy, engineering, and product teams with those responsible for AI engineering, generative AI enablement, and automation product and engineering." Owns the BigQuery program: AmEx "is moving a core on-premise warehouse and hundreds of production applications to BigQuery to enable trusted agentic commerce at scale" ([Google Cloud Next '26 keynote blog](https://cloud.google.com/blog/topics/google-cloud-next/welcome-to-google-cloud-next26), Confirmed).
- **Key people:**
  - Hilary Packer: EVP, Head of Enterprise Data & AI from Aug 2025 (Secondhand, [Humantic](https://humantic.ai/public-profile/hilary-packer-9f3f75955dbd6ea4)); EVP & CTO 2019–2025. Senior technical executive and probable sponsor of GenAI enablement.
  - Chris Gifford: CDO since Sept 2025, previously Deputy CDO, ex-USAA and JPMorgan ([CDO Magazine](https://www.cdomagazine.tech/leadership-moves/american-express-appoints-chris-gifford-as-chief-data-officer)). He is building a data-readiness grading layer for GenAI/agentic AI and "golden source" pointers for agents ([CIO.com](https://www.cio.com/article/4177594/american-express-democratize-analytics-not-data.html)). Owns data governance, so he is both a co-buyer and a data-access gatekeeper.
  - Pascale Voldman Hutz: EVP EDDS as of Jan 2025; previously CDO. Current role Unverified.
- **Factory relevance:** Very High. "Hundreds of production applications" moving to BigQuery is a textbook Missions workload: SQL dialect conversion, connector rewrites, test generation, and documentation refresh with Docs Refresh Automation.
- **Linked:** I6, I1; Ch4
- **Buying role:** Co-buyer / project owner
- **Confidence:** Gifford and BigQuery Confirmed; Packer title Secondhand

### 4.5 Global Merchant & Network Services Technology (GMST)
- **AmEx name / aliases:** Global Merchant Services Technology (GMST); GMNS Technology; Global Network Services technology
- **Parent:** ETS unit CIO aligned to the GMNS segment (Anna Marrs)
- **What it does:** "The Merchant platform is a distributed near real time low latency system that is always available and highly resilient, processing transactions from around the world 24x7" ([GMST job posting](https://jobs.anitab.org/companies/american-express/jobs/56955037-software-engineer-ii-global-merchant-services-technology)). It runs network modernization and the agentic-commerce rails: the ACE Developer Kit (Apr 14, 2026), Agent Purchase Protection, and the Amex Business Playbook for Agentic Commerce (Oct 6, 2026) ([AmEx agentic commerce](https://www.americanexpress.com/en-us/company/agentic-commerce/)).
- **Locations:** Phoenix (Manager-Software Engineering, GMST postings) ([Glassdoor](https://www.glassdoor.com/Jobs/American-Express-global-merchant-services-Jobs-EI_IE35.0,16_KO17,41.htm))
- **Stack:** Distributed cloud, GCP, Informatica (postings). Kubernetes, Envoy, Istio and Go per the user's prior research (Unverified here).
- **Key people:**
  - Jason Sharples, SVP & Unit CIO GMNS ([theorg.com](https://theorg.com/org/american-express/person/jason-sharples), Secondhand). Project buyer.
  - Anna Marrs, Group President (business owner) ([Fortune](https://fortune.com/ranking/most-powerful-rising-executives/2025/anna-marrs)).
  - Luke Gebb (agentic-commerce partner).
- **Factory relevance:** High. Missions for cell-based modernization, Alert Responder and incident Automations for resiliency, Security Review on payment code, Automated QA for regression.
- **Linked:** I3, I7; Ch8, Ch14
- **Buying role:** Project buyer / user
- **Confidence:** Org Confirmed; leader Secondhand

### 4.6 Global Servicing & Corporate Technology
- **AmEx name / aliases:** Global Servicing Technology; Corporate Technology
- **Parent:** ETS unit CIO; business partners are Badi (Global Servicing) and the corporate functions
- **What it does:** Kensey is "Executive Vice President and Unit CIO for Global Servicing and the company's corporate functions, including Finance, Colleague Experience Group, General Counsel's Organization, Corporate Affairs & Communications, Global Real Estate & Workplace Experience, Global Supply Management, Global Risk and Compliance, and Internal Audit" ([Qwoted bio](https://app.qwoted.com/sources/gary-kensey); [CIO.com, 2025](https://www.cio.com/article/4062034/american-express-credits-ai-with-improving-customer-experiences.html)).
- **Why it matters now:**
  - Global Servicing runs "fraud, and financial crimes operations" ([Badi IR bio](https://ir.americanexpress.com/governance-and-corporate-responsibility/executive-committee-and-directors/default.aspx)). The OCC found "systemic breakdowns in suspicious activity monitoring and reporting processes" (Oct 8, 2026) ([OCC](https://www.occ.gov/news-issuances/news-releases/2026/nr-occ-2026-87.html)).
  - AmEx is piloting conversational AI agents to replace its legacy IVR ([FY2025 annual report](https://www.sec.gov/Archives/edgar/data/4962/000110465926034161/tm265890d2_ars.pdf)).
- **Key people:**
  - Gary Kensey (EVP Unit CIO): project buyer for remediation tech.
  - Mohammed Badi (President, Global Servicing): business owner.
  - Anthony Devane (head of global support, enablement & control): change and adoption ([Payments Dive](https://www.paymentsdive.com/news/how-amex-exploits-new-ai-tools/816000/)).
- **Factory relevance:** High. Remediation workloads are bounded and spec-heavy (monitoring rules, data lineage, SAR pipeline fixes), which suits Specification Mode and Missions, with auditable PR trails. Finance and regulatory-reporting code (Category II) are also in his remit.
- **Linked:** I5, I8; Ch1, Ch5, Ch12
- **Buying role:** Project buyer (funding often comes from remediation budgets)
- **Confidence:** Confirmed

### 4.7 Global Commercial Services Technology
- **AmEx name / aliases:** Global Commercial Services Technology; "SME & Business Blueprint Engineering Organization"; GCS AI engineering
- **Parent:** ETS ↔ GCS (Joabar)
- **What it does:** Platforms for U.S. SME, commercial card, B2B payments and spend management, including the expense-management platform built on Center and the Hyper acquisition ([PYMNTS](https://www.pymnts.com/acquisitions/2026/amex-acquires-hyper-to-boost-ai-and-expense-management-offerings/)).
- **Locations:** Seattle, WA ("Senior Backend Software Engineer – Global Commercial Services Technology") ([Himalayas](https://himalayas.app/companies/american-express-company/jobs/sr-software-engineer-ii-global-commercial-services-technology); [RemoteFront](https://www.remotefront.com/remote-jobs/american-express-engineering-director-global-commercial-services-technology-ptg6m)), likely the Center legacy team (Bellevue). Inference.
- **Key people:**
  - Raymond Joabar (business sponsor; quoted on Hyper) ([Yahoo Finance](https://finance.yahoo.com/sectors/technology/articles/american-express-buy-sam-altman-133955553.html)).
  - Head of GCS Technology not found. The former SVP/CIO, Allegra Driscoll, left for Bread Financial ([FinTech Futures](https://www.fintechfutures.com/wealthtech/bread-financial-names-former-amex-cio-allegra-driscoll-as-new-cto)).
- **Factory relevance:** High. Integrating Center and Hyper into AmEx platforms is a bounded brownfield Missions use case, and Ticket-to-PR fits the roadmap velocity needed against Ramp and Brex.
- **Linked:** I4; Ch6, Ch13
- **Buying role:** Project buyer
- **Confidence:** Org Confirmed; leader Unverified

### 4.8 Consumer Services & Enterprise Digital & Data Technology
- **AmEx name / aliases:** "Consumer Services and Enterprise Digital & Data Technology"; "U.S. Consumer Services and Enterprise Digital Technology"
- **What it does:** "Digital experience engineering (Mobile and Web), AI/ML, marketing technology, enterprise communications, travel and lifestyle, and automation" ([job posting via themuse.com](https://www.themuse.com/jobs/americanexpress/senior-engineer-javapythoncloudaiml-machine-learning-53f7bb)). Covers the Platinum/Gold refresh, the app, personalization and Global Dining engineering ("Senior AI Engineer I – Global Dining", NY) ([LinkedIn jobs](https://www.linkedin.com/jobs/american-express-jobs-new-york)).
- **Key people:** Head Unverified (a "Senior Executive Assistant" posting implies an EVP-level leader). EDDS EVP Pascale Voldman Hutz.
- **Factory relevance:** High. Front-end refactors, Automated QA and the Resy/Tock front-end merge.
- **Linked:** I10, I11, I12; Ch2
- **Confidence:** Org Confirmed; leader Unverified

### 4.9 Technology Risk & Information Security (TRIS): Gatekeeper and buyer
- **AmEx name:** Technology Risk and Information Security (TRIS) program
- **Reporting:** The CISO reports to the CIO. Oversight is by the Technology, Data, Resiliency Risk Committee (TDRRC), co-chaired by the CIO and the Head of Technical Risk Management (FY2025 10-K Item 1C, via [Board Cybersecurity](https://www.board-cybersecurity.com/annual-reports/tracker/20260206-american-express-cybersecurity-10k)).
- **Key people:**
  - Gleb Reznik, CISO from March 2026 (joined Aug 2024 as SVP, Technology Risk and Information Security; ex-JPMorgan, Synchrony, Capital One). Secondhand ([SecurityWeek](https://www.securityweek.com/industry-moves/mar-16-2026/)). Gatekeeper.
  - Fred Gibbins, former CISO (13 years), retiring Oct 2026 ([LinkedIn](https://www.linkedin.com/in/fred-gibbins-b76a1963/)).
- **Signals:** "Agentic AI Engineer III – Cybersecurity" (NY) posting; the CIO's town hall included the CISO on "how AI is reshaping cybersecurity."
- **Factory relevance:** Gatekeeper first; possible buyer for the Security Review Automation.
- **Linked:** I14; Ch10
- **Confidence:** Structure Confirmed; Reznik Secondhand

### 4.10 Global Risk & Compliance / Project Guardian / Model Risk: Gatekeeper and indirect beneficiary
- **Leaders:** Doug Tabish (CRO; "manage regulatory exams and the Global Privacy Program"); Gina Taylor (EVP, Project Guardian Program Office, reports to Tabish) ([8-K](https://www.sec.gov/Archives/edgar/data/4962/000000496225000010/exhibit991jan302025executi.htm)). Confirmed.
- **Model risk:** "The Enterprise-Wide Model Risk Policy establishes the comprehensive framework for governing model risk... approved by the ERMC." It covers AI/ML and GenAI tools ([FY2024 10-K](https://www.sec.gov/Archives/edgar/data/4962/000000496225000016/axp-20241231.htm)). No named head of model risk was found.
- **GenAI governance:** The Generative AI Council "assess[es] and approve[s] the deployment of Generative AI use cases." Membership spans technology, data science, risk, legal and strategy ([FY2023 annual report](https://www.sec.gov/Archives/edgar/data/4962/000000496224000018/americanexpressannualrepor.pdf)). No chair is named.
- **Consent-order context:** The Fed order requires an enterprise BSA/AML plan that includes oversight of third parties supporting BSA/AML compliance ([Daybreak Wire summary](https://daybreakwire.com/business/amex-350-million-aml-fine-consent-orders/)). A vendor touching BSA/AML code will face enhanced third-party scrutiny.
- **Factory relevance:** Indirect beneficiary and funder of remediation engineering. Position Factory as reducing remediation risk: spec-traceable changes, human-approved PRs, audit logs.
- **Linked:** I5; Ch1, Ch5, Ch9
- **Confidence:** Confirmed; order details are from secondary summaries

### 4.11 Amex Digital Labs / Global Innovation
- **Leader:** Luke Gebb, EVP & Head of Global Innovation (EVP, Amex Digital Labs in the Jan 2025 8-K). He said "As commerce becomes more agent-powered, trust becomes the defining factor" ([AmEx newsroom](https://www.americanexpress.com/en-us/newsroom/articles/innovation/american-express-debuts-agentic-commerce-experiences--ace--devel.html)). Confirmed.
- **Work:** ACE Developer Kit (Account Enablement, Intent Intelligence and Payment Credentials specs available 4/14/2026; Agent Registration and Cart Context still in development), Agent Purchase Protection ([PYMNTS](https://www.pymnts.com/news/artificial-intelligence/2026/american-express-to-back-purchases-made-by-customers-ai-agents/)), and the americanexpress.io "Building Trust..." post (Apr 22, 2026) ([americanexpress.io](https://americanexpress.io/building-trust-in-ai-powered-transactions-with-amex-agentic-commerce-experiences/)).
- **Factory relevance:** Medium–High. Fast prototyping with Specification Mode; a credible "agents building agentic-commerce" narrative.
- **Linked:** I3; Ch8

### 4.12 Enterprise Shared Services → Global Supply Management: Gatekeeper
- **Leaders:** Denise Pickett (President ESS, since Feb 2025); Miguel Gonzalez (SVP, CPO, joined 2024) ([LinkedIn](https://www.linkedin.com/in/miguel-gonzalez-nacd/)). ESS also covers Global Security (Jeff Irvine), Business Resilience & Corporate Functions Management, and Internal Fraud. Confirmed.
- **Role:** Vendor onboarding, contracting, third-party risk intake. Technology for Supply Management sits with Kensey.
- **Factory action:** Pre-stage the SIG/TPRM package, SOC 2, data-flow diagrams, Factory Private deployment option, and marketplace routes (AWS, Anthropic, OpenAI) to use existing commit or paper.

### 4.13 Credit & Fraud Risk (CFR)
- **Leader:** David Nigro, Chief Credit Officer; "credit and fraud risk management, and predictive decisioning functions." Reports to Marrs ([AmEx IR](https://ir.americanexpress.com/governance-and-corporate-responsibility/executive-committee-and-directors/default.aspx)). Confirmed.
- **Factory relevance:** Medium. Maintenance of decisioning-platform code; must work within model-risk policy.
- **Linked:** I9

### 4.14 Finance (incl. regulatory reporting), Colleague Experience, Legal, Internal Audit: Indirect beneficiaries and gates
- Finance (Le Caillec): Category II regulatory reporting load; Finance tech is served by Kensey's unit CIO org. Indirect beneficiary. (Ch5)
- General Counsel's Organization (Seeger, ERMC member): contract, IP and AI-regulation review. Gate. (Ch13)
- Internal Audit (Gallo): will test AI-in-SDLC controls. Engage early with auditability features.
- Colleague Experience (Herena): AI fluency and training. Partner on rollout and enablement. (Ch15)

---

## 5. Acquired / Subsidiary Engineering Orgs

| Org | Status | Segment / owner | Key people | Factory angle | Confidence |
|---|---|---|---|---|---|
| Center (Center ID Corp, Bellevue WA) | Acquired 2025; basis of the expense-management platform "launching later this year" | GCS (Joabar) | Co-founder Steve Singh (Concur veteran) per secondary source | Integration Missions; Ticket-to-PR | Confirmed deal; people Secondhand |
| Hyper (Hypercard) | Agreement announced Apr 16, 2026, terms undisclosed ([FinTech Futures](https://www.fintechfutures.com/m-a/american-express-acquires-hyper)); Joabar cited Hyper's "deep expertise in designing and deploying AI agents" ([TSG](https://tsgpayments.com/american-express-to-acquire-hyper-adding-to-its-ai-expertise-and-expense-management-capabilities/)); no report of closing found | GCS | Marc Baghadjian, CEO & co-founder | AI-native team as internal champions for agentic tooling | Confirmed |
| Resy / Tock / Rooam | Resy (2019), Tock and Rooam (2024); Resy and Tock venue networks being integrated (Q1 2026) ([Q1 2026 8-K](https://www.sec.gov/Archives/edgar/data/0000004962/000000496226000188/q126exhibit991.htm)) | USCS Global Dining | Unverified | Front-end/platform merge Missions; Automated QA | Confirmed |
| TheFork | $700M from Tripadvisor, announced June 15, 2026; close expected by end of 2026; to run under existing leadership as a standalone European brand ([PYMNTS](https://www.pymnts.com/partnerships/2026/amex-looks-to-spend-700-million-to-buy-thefork-from-tripadvisor/); [Skift](https://skift.com/2026/07/27/why-american-express-wants-to-buy-thefork-new-cardmembers/)) | ICS (Marquez) | TheFork management (Paris) | Post-close integration (EU data, DORA/GDPR); Factory Private for EU | Confirmed; close pending |
| Amex GBT | Separate company | n/a | Michael Esquibel (CTO) ([Travolution](https://www.travolution.com/news/people/amex-gbt-appoints-michael-esquibel-as-chief-technology-officer/)) | Separate account; deprioritize | Confirmed |
| Loyalty Partner/PAYBACK, AE Innovation Labs (Ireland), Amex Ventures, Kabbage | Not researched in this pass | — | — | Validate before outreach | Unverified |

---

## 6. Relationship / Influence Map

| Function | Who | Notes |
|---|---|---|
| Sets AI and technology strategy (sponsor) | Grosfield; AITO (Gantman) | AITO measures enterprise AI value and modernizes governance |
| Funds and owns the platform decision (economic buyer) | Radhakrishnan (ETS) | Co-chairs TDRRC; CISO reports to him |
| Builds and adopts (champions/users) | Swartz (DevEx); unit CIOs Kensey, Sharples; GCS/Consumer tech heads; Distinguished Engineers; India ETS | Paved roads decide adoption at scale |
| Funds specific programs (project budgets) | CDO/Enterprise Data & AI (BigQuery); CRO/Project Guardian (remediation); GCS (Center/Hyper); ICS (TheFork) | Wedge budgets outside the central tooling line |
| Approves/gates | CISO Reznik (TRIS), TDRRC, Generative AI Council, Model Risk (ERMC policy), CRO Tabish, CLO Seeger, CPO Gonzalez, Internal Audit Gallo | Run in parallel; AITO is simplifying these pathways |
| Indirectly benefits | Finance (Cat II reporting), Global Servicing (IVR, fraud ops), CFR, Colleague Experience | Use as ROI evidence |

Key dynamics:
- (a) Copilot is the incumbent assistant across 11,000+ engineers. Position Factory as complementary and model-agnostic for autonomous, multi-step delivery, not as a replacement.
- (b) AmEx's own SDLC blog ([americanexpress.io](https://americanexpress.io/reimagining-software-delivery-with-ai/)) lists what Factory automates: "contextual analysis of build failures... identify flaky tests," architecture-drift detection, test generation from acceptance criteria, and Gherkin specs. This is a near-perfect requirements match. Inference.
- (c) The Jul 30, 2026 "Tool Sequence Guardrails" post ([americanexpress.io](https://americanexpress.io/improving-correctness-in-agentic-ai-with-execution-guardrails/)) signals that AmEx engineers expect execution-time controls on agents. Lead with Factory's permissioning and audit features.

---

## 7. Gatekeeper Navigation

1. **Information Security (TRIS, CISO Reznik):** Expect review of code-exfiltration and model-data paths. Lead with Factory Private (VPC/on-prem), no training on customer code, SSO/SCIM, audit logs, and Router control over which models touch which repos.
2. **Generative AI Council / AITO governance:** Submit as a GenAI use case with a defined scope (e.g., one migration Mission plus a Code Review Automation), human-in-the-loop PR approval, and metrics. AITO's mandate to streamline "approval and enablement pathways" can help.
3. **Model Risk (Enterprise-Wide Model Risk Policy):** Clarify that Droids are development tooling, not decisioning models. Document the models used and the evaluation approach.
4. **Global Supply Management (Gonzalez) and third-party risk:** Expect heightened TPRM after the consent orders, especially for anything touching BSA/AML systems. Pre-package security documentation and consider marketplace procurement.
5. **Legal / Privacy (Seeger; Tabish's Global Privacy Program):** EU (TheFork, ICS), India (RBI localization) and DORA requirements. Offer regional deployment.
6. **Internal Audit (Gallo):** Show PR-level traceability from spec to change to test to approval.

---

## 8. Recommended Navigation Path / Multi-Threading Plan

1. **Week 0–2, champion entry:** Approach Michelle Swartz (Developer Enablement) and the authors of the "Ideation to Implementation" post. Offer a paved-road pilot with Droid Exec in CI, Code Review and CI Failure Triage, measured against her sentiment-survey baselines.
2. **Week 2–6, wedge selection (choose 1–2):**
   - (a) A BigQuery app-migration Mission with the Chief Data Office (Gifford/Packer).
   - (b) A remediation-adjacent backlog with Kensey's Global Servicing & Corporate Technology.
   - (c) A Center/Hyper integration Mission in GCS Technology.
3. **In parallel, governance track:** Open TRIS/CISO and Generative AI Council reviews and the procurement intake through Gonzalez's team. Engage AITO (Gantman) on measurement design.
4. **Executive alignment:** Brief Radhakrishnan with pilot metrics framed as "agentic SDLC at enterprise scale." Use AITO to reach Grosfield. Optionally use partners (EY, Wipro) if they are already AmEx SIs (Unverified).
5. **Expansion:** GMST (resiliency and modernization), Consumer/Dining tech, and India ETS hubs for scale.

---

## Caveats
- **Unverified titles and people:**
  - Hilary Packer's current title and Jon Gantman's AITO title come from secondary profiles.
  - Jason Sharples (GMNS Unit CIO) is from theorg.com only.
  - Gleb Reznik's CISO appointment is reported by SecurityWeek ("Industry Moves for the week of March 16, 2026") and Gibbins confirmed it on LinkedIn ("I'll still be at American Express until my retirement in October"); there is no AmEx press release.
  - Pascale Voldman Hutz's current role is unknown.
  - No current AmEx CTO was found.
  - Federico Formica, Sunny Hirani, Benjamin Cane and Evan Kotsovinos (from prior research) were not re-verified in this pass.
- **Org-chart inference:** Exact parentage of AITO, Developer Experience and the Chief Data Office after the 2025 reorganization is inferred.
- **Headcount:** Third-party claims (e.g., India GCC "8,000" / ">30% of engineering") are low-quality and unverified ([Business of GCC](https://www.businessofgcc.com/gcc-data/companies/american-express-india)). The only confirmed engineering figure is "more than 11,000" engineering professionals on AI-assisted tools.
- **Deal status:** The Hyper close (expected Q2 2026) and TheFork close (expected by end of 2026) were not confirmed as completed.
- **Tool stack:** Claims that job posts name Devin, Claude or Cursor were not re-verified. Low-quality aggregator claims about GCP workloads (LUMI credit reserving, Apigee for api.americanexpress.com) are Unverified ([Bloomberry](https://bloomberry.com/data/google-cloud/)).
- **Sumble:** No Sumble connector was available, so no Sumble-derived data is included.
- **Consent orders:** The OCC findings ("systemic breakdowns...") are Confirmed via the [OCC release](https://www.occ.gov/news-issuances/news-releases/2026/nr-occ-2026-87.html) and coverage ([PYMNTS](https://www.pymnts.com/legal/aml/2026/occ-and-fed-fine-american-express-350-million-over-aml-deficiencies/); [FinCrime Agent](https://fincrimeagent.com/news/issue-20/occ-fines-american-express-national-bank-350-million-aml/)). The detailed plan requirements come from secondary summaries. Banking Dive (Oct 8, 2026), citing the OCC, reports that the breakdowns involved "roughly $13 billion of suspected trade-based money laundering activity between June 2014 and May 2025," and that this is the OCC's first civil money penalty since TD Bank's $450M in October 2024.

---

## Sources

1. [AmEx IR – Executive Committee & Directors](https://ir.americanexpress.com/governance-and-corporate-responsibility/executive-committee-and-directors/default.aspx)
2. [AXP 8-K Exhibit 99.1 – Executive changes (Jan 30, 2025)](https://www.sec.gov/Archives/edgar/data/4962/000000496225000010/exhibit991jan302025executi.htm)
3. [ETS Apprenticeship 2026 listing](https://www.globalsouthopportunities.com/2026/09/27/technology-3/)
4. [Director of Strategic Planning – Enterprise AI Transformation Office (Simplify)](https://simplify.jobs/p/0997e645-427b-43ef-a8d9-9f32957ed250/Director-of-Strategic-Planning)
5. [Ravi Radhakrishnan – LinkedIn](https://www.linkedin.com/in/ravikumar-radhakrishnan/)
6. [Jon Gantman – RocketReach](https://rocketreach.co/jon-gantman-email_56972201)
7. [Amex CTO Hilary Packer on AI Strategy – MarketScreener](https://www.marketscreener.com/quote/stock/AMERICAN-EXPRESS-COMPANY-4814/news/Amex-CTO-Hilary-Packer-on-AI-Strategy-49946377/)
8. [VentureBeat on X](https://x.com/VentureBeat/status/1890184450794721296?lang=en)
9. [Hilary Packer – Humantic profile](https://humantic.ai/public-profile/hilary-packer-9f3f75955dbd6ea4)
10. [CIO.com – American Express credits AI with improving customer experiences](https://www.cio.com/article/4062034/american-express-credits-ai-with-improving-customer-experiences.html)
11. [Gary Kensey – Qwoted](https://app.qwoted.com/sources/gary-kensey)
12. [Jason Sharples – theorg.com](https://theorg.com/org/american-express/person/jason-sharples)
13. [SecurityWeek – Industry Moves, Mar 16, 2026](https://www.securityweek.com/industry-moves/mar-16-2026/)
14. [Board Cybersecurity – AmEx FY2025 10-K cyber disclosure](https://www.board-cybersecurity.com/annual-reports/tracker/20260206-american-express-cybersecurity-10k)
15. [AmEx FY2023 Annual Report](https://www.sec.gov/Archives/edgar/data/4962/000000496224000018/americanexpressannualrepor.pdf)
16. [OCC News Release 2026-87](https://www.occ.gov/news-issuances/news-releases/2026/nr-occ-2026-87.html)
17. [FinCrime Agent – OCC fines AENB $350M](https://fincrimeagent.com/news/issue-20/occ-fines-american-express-national-bank-350-million-aml/)
18. [Business Standard – Gurugram campus](https://www.business-standard.com/companies/news/american-express-opens-its-largest-campus-worldwide-in-gurugram-india-124050200575_1.html)
19. [AmEx Careers – Bangalore](https://www.americanexpress.com/en-us/careers/locations/bangalore/)
20. [BTN Europe – Amex GBT names Esquibel CTO](https://www.businesstravelnewseurope.com/On-the-Move/Amex-GBT-names-Esquibel-as-chief-technology-officer)
21. [Fundz – Amex GBT exec hire](https://app.fundz.net/executives/american-express-global-business-travel-hired-c9e0)
22. [AXP FY2026 Proxy (DEF 14A)](https://www.sec.gov/Archives/edgar/data/4962/000110465926034163/tm2519434-8_def14a.htm)
23. [Chris Gifford – American Banker profile](https://digital-banking.americanbanker.com/profile/chris-gifford/)
24. [Google Cloud – Welcome to Next '26](https://cloud.google.com/blog/topics/google-cloud-next/welcome-to-google-cloud-next26)
25. [americanexpress.io – Building Trust in AI-Powered Transactions (ACE)](https://americanexpress.io/building-trust-in-ai-powered-transactions-with-amex-agentic-commerce-experiences/)
26. [Software Engineer II – Global Merchant Services Technology (AnitaB)](https://jobs.anitab.org/companies/american-express/jobs/56955037-software-engineer-ii-global-merchant-services-technology)
27. [AmEx – ACE Developer Kit announcement](https://www.americanexpress.com/en-us/newsroom/articles/innovation/american-express-debuts-agentic-commerce-experiences--ace--devel.html)
28. [PYMNTS – AmEx to back purchases made by AI agents](https://www.pymnts.com/news/artificial-intelligence/2026/american-express-to-back-purchases-made-by-customers-ai-agents/)
29. [AmEx FY2025 Annual Report](https://www.sec.gov/Archives/edgar/data/4962/000110465926034161/tm265890d2_ars.pdf)
30. [Payments Dive – How Amex exploits new AI tools](https://www.paymentsdive.com/news/how-amex-exploits-new-ai-tools/816000/)
31. [Emerj – AI at American Express](https://emerj.com/artificial-intelligence-at-american-express-2/)
32. [americanexpress.io – Python Paved Road](https://americanexpress.io/empowering-innovation-the-python-paved-road/)
33. [Senior AI Engineer I – Reading UK (ITJobsWatch)](https://www.itjobswatch.co.uk/jv/American-Express/Senior-AI-Engineer-I-Job-Reading-Berkshire-UK-4wz612)
34. [CEG – Ravi Radhakrishnan session](https://cegconnect.com/event/ceg-c-level-connect-series-45-mr-ravi-radhakrishnan-chief-information-officer-cio-at-american-express-usa/)
35. [Metis Strategy – Ravi Radhakrishnan interview](https://www.metisstrategy.com/interview/ravi-radhakrishnan/)
36. [DX Podcast – Developer Experience at American Express](https://getdx.com/podcast/developer-experience-american-express/)
37. [americanexpress.io – Michelle Swartz author page](https://americanexpress.io/u/michelleswartz/)
38. [LinearB – Elevating DevEx at American Express](https://linearb.io/blog/elevating-developer-experience-american-express-engineering-culture)
39. [Michelle Swartz – LinkedIn](https://www.linkedin.com/in/michelle-swartz-9a5941/)
40. [americanexpress.io (AmEx Technology blog)](https://americanexpress.io/)
41. [CDO Magazine – AmEx appoints Chris Gifford](https://www.cdomagazine.tech/leadership-moves/american-express-appoints-chris-gifford-as-chief-data-officer)
42. [Data Engineer posting (Techstars jobs)](https://jobs.techstars.com/companies/hackajob/jobs/69842342-data-engineer)
43. [CIO.com – Democratize analytics, not data](https://www.cio.com/article/4177594/american-express-democratize-analytics-not-data.html)
44. [AmEx – J.D. Power No. 1 ranking](https://www.americanexpress.com/en-us/newsroom/articles/products-and-services/american-express-ranks-no--1-in-the-j-d--power-u-s--credit-card-.html)
45. [cloudmagazin – Google Agentic Data Cloud](https://www.cloudmagazin.com/en/2026/05/03/google-agentic-data-cloud-bigquery-lakehouse-databricks-dach/)
46. [AmEx – Agentic Commerce Experiences](https://www.americanexpress.com/en-us/company/agentic-commerce/)
47. [Yahoo Finance – AmEx telling merchants to prepare (agentic commerce)](https://finance.yahoo.com/technology/ai/articles/american-express-telling-merchants-prepare-134818873.html)
48. [Glassdoor – AmEx Global Merchant Services jobs](https://www.glassdoor.com/Jobs/American-Express-global-merchant-services-Jobs-EI_IE35.0,16_KO17,41.htm)
49. [Fortune – Anna Marrs](https://fortune.com/ranking/most-powerful-rising-executives/2025/anna-marrs)
50. [PYMNTS – OCC and Fed fine AmEx $350M](https://www.pymnts.com/legal/aml/2026/occ-and-fed-fine-american-express-350-million-over-aml-deficiencies/)
51. [RemoteFront – Engineering Director, GCS Technology](https://www.remotefront.com/remote-jobs/american-express-engineering-director-global-commercial-services-technology-ptg6m)
52. [Himalayas – Sr Software Engineer II, GCS Technology](https://himalayas.app/companies/american-express-company/jobs/sr-software-engineer-ii-global-commercial-services-technology)
53. [FinTech Futures – AmEx acquires Hyper](https://www.fintechfutures.com/m-a/american-express-acquires-hyper)
54. [Yahoo Finance – AmEx to buy Sam Altman-backed Hypercard](https://finance.yahoo.com/sectors/technology/articles/american-express-buy-sam-altman-133955553.html)
55. [Glassdoor – AmEx commercial jobs](https://www.glassdoor.com/Jobs/American-Express-commercial-Jobs-EI_IE35.0,16_KO17,27.htm)
56. [PYMNTS – AmEx acquires Hyper](https://www.pymnts.com/acquisitions/2026/amex-acquires-hyper-to-boost-ai-and-expense-management-offerings/)
57. [FinTech Futures – Bread Financial names former AmEx CIO Allegra Driscoll CTO](https://www.fintechfutures.com/wealthtech/bread-financial-names-former-amex-cio-allegra-driscoll-as-new-cto)
58. [The Muse – Senior Engineer posting (Consumer Services & EDDT)](https://www.themuse.com/jobs/americanexpress/senior-engineer-javapythoncloudaiml-machine-learning-53f7bb)
59. [Glassdoor – Global Merchant Services jobs search](https://www.glassdoor.com/Job/global-merchant-services-american-express-jobs-SRCH_KO0,24_KE25,41.htm)
60. [LinkedIn – AmEx jobs New York](https://www.linkedin.com/jobs/american-express-jobs-new-york)
61. [Fred Gibbins – LinkedIn](https://www.linkedin.com/in/fred-gibbins-b76a1963/)
62. [AXP FY2024 10-K](https://www.sec.gov/Archives/edgar/data/4962/000000496225000016/axp-20241231.htm)
63. [Daybreak Wire – What the OCC and Fed orders require](https://daybreakwire.com/business/amex-350-million-aml-fine-consent-orders/)
64. [americanexpress.io – Agentic AI posts](https://americanexpress.io/posts/agentic-ai/)
65. [Miguel Gonzalez – LinkedIn](https://www.linkedin.com/in/miguel-gonzalez-nacd/)
66. [BERI – AmEx Hyper acquisition](https://www.beri.net/article/amex-hyper-acquisition-agentic-expense-management-2026)
67. [TSG Payments – AmEx to acquire Hyper](https://tsgpayments.com/american-express-to-acquire-hyper-adding-to-its-ai-expertise-and-expense-management-capabilities/)
68. [PYMNTS – AmEx to buy TheFork for $700M](https://www.pymnts.com/partnerships/2026/amex-looks-to-spend-700-million-to-buy-thefork-from-tripadvisor/)
69. [AXP Q1 2026 8-K Exhibit 99.1](https://www.sec.gov/Archives/edgar/data/0000004962/000000496226000188/q126exhibit991.htm)
70. [Doctor of Credit – AmEx to acquire TheFork](https://www.doctorofcredit.com/american-express-to-acquire-thefork-for-700-million/)
71. [Skift – Why AmEx wants TheFork](https://skift.com/2026/07/27/why-american-express-wants-to-buy-thefork-new-cardmembers/)
72. [EFA News – AmEx wants to acquire TheFork](https://www.efanews.eu/item/60981-american-express-wants-to-acquire-the-fork.html)
73. [Travolution – Amex GBT appoints Michael Esquibel CTO](https://www.travolution.com/news/people/amex-gbt-appoints-michael-esquibel-as-chief-technology-officer/)
74. [americanexpress.io – Reimagining Software Delivery with AI](https://americanexpress.io/reimagining-software-delivery-with-ai/)
75. [americanexpress.io – Improving Correctness in Agentic AI with Execution Guardrails](https://americanexpress.io/improving-correctness-in-agentic-ai-with-execution-guardrails/)
76. [Business of GCC – American Express India](https://www.businessofgcc.com/gcc-data/companies/american-express-india)
77. [Bloomberry – Google Cloud customers](https://bloomberry.com/data/google-cloud/)
