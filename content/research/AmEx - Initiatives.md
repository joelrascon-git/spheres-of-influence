# AmEx Strategic Initiatives: Research Prompt and Output

*Research run: October 12, 2026. File regenerated: October 13, 2026.*
*Purpose: hand-off file for AI agents and follow-on tasks. Part 1 is the prompt that produced the research; Part 2 is the output.*

---

# Part 1: Prompt Used for Context

**Title of chat:**
AmEx - Initiatives

**Research Task:**
Find all active and on-going strategic initiatives that AmEx has across business and technology.

**Scope of research:**
The purpose of this research is to best position Factory.com as an investment for AmEx.

**Factory Context:**
Attached is context about Factory but also leverage any additional information found in other chats that help with this task.

**Company in question:**
I'm saying AmEx, but that's an incredibly complex entity with various parent/sub relationships. I have attached a markdown file on AmEx account mapping, but also leverage data found in other chats in this project.

**Sources:**
- Start with Web/articles/new/blog posts/etc...Find all credible initiatives online
- Sumble - Connector added. Find projects/initiatives that American Express and it's companies have. This data can supplement and add details from research on the web, but initiatives/projects found on Sumble are also indicators worth mentioning if determined to be possibly significant.

**Info requested:**
For each project I'd like the following but not limited to:
- The name of the project
- The summary of what that project is
- If found, why is that a project and how will it help AmEx
- What is the project solving for
- Are any key people mentioned as part of the project from ownership down to execution?
- Date in which this project was mentioned
- If found, technologies mentioned as part of the project
- Provide a hypothesis on how Factory will help that project

**Format:**
- Markdown file to help provide to AI agents to understand and quickly analyze the findings for other tasks.
- Every project/initiative mentioned should be cited with its source and link to validate manually.
- List out findings in order of importance to AmEx

**Attached context files:** `Factory - Knowledgebase.md` (Factory product, proof points, pricing, ICP) and `AmEx - Account Mapping.md` (AmEx entity hierarchy, segments, leadership, as of October 12, 2026).

---

# Part 2: Research Output

## American Express (AmEx): Active Strategic Initiatives Across Business and Technology, Ranked for Factory Positioning (as of Oct 12, 2026)

AmEx's single most Factory-relevant initiative is its enterprise-wide push to move engineering from AI-assisted coding to agentic, end-to-end software delivery. Squeri's 2026 shareholder letter says AmEx has "scaled AI-assisted development tools to more than 11,000 engineering professionals, reducing coding cycle time by over 30 percent, and are scaling agentic coding tools to help engineers accelerate end-to-end software development." On the Q2 2026 call he tied the 30–40% coding cycle-time gains to working down "a large backlog of technology projects" that AmEx is pulling into H2 2026. Every other major initiative (agentic commerce, the commercial software roadmap, the BigQuery data migration, the financial-crimes remediation, payments-network resiliency) creates engineering demand that lands on that same backlog.

## TL;DR
- **The opening is real and current.** AmEx publicly committed to "scaling agentic coding tools" across 11,000+ engineers, published a spec-driven "Ideation to Implementation" SDLC model in May 2026, and said it is reinvesting its H2 2026 revenue upside partly into technology platform refreshes. The only AI coding vendor AmEx has confirmed by name is GitHub Copilot (from 2025). Which agentic tool(s) it is now scaling has not been disclosed, so the agentic layer is contestable.
- **The best Factory entry points, in order:** (1) the agentic SDLC / AI Transformation program (owners: Howard Grosfield, CIO Ravi Radhakrishnan, Jon Gantman of the AI Transformation Office); (2) bounded brownfield migrations, where AmEx is moving "a core on-premises data warehouse and hundreds of production applications" to BigQuery; (3) review, security and compliance automation, made urgent by the Oct 8, 2026 OCC/Fed consent orders and $350M penalty on BSA/AML.
- **What to do now:** lead with Missions for the BigQuery app migration and with automated code and security review plus audit trails for regulated delivery. Position Factory as a model-agnostic orchestration layer that complements Copilot rather than replacing it. Time outreach around the Q3 2026 earnings call (Oct 23, 2026), where AI productivity and tech spend will be discussed again.

## Key Findings

1. **AI is now an enterprise operating-model program, not a tech experiment.** Howard Grosfield (Group President, USCS) "leads American Express' enterprise-wide technology… and is also leading the AI transformation program strategy for the enterprise" ([AmEx IR](https://ir.americanexpress.com/governance-and-corporate-responsibility/executive-committee-and-directors/default.aspx)). An Enterprise AI Transformation Office exists, with Jon Gantman (EVP, Cobrand, Product Development and AI Transformation Office) presenting to Enterprise Technology Services. This gives Factory a business-side economic buyer in addition to the CIO.
2. **AmEx says AI gains go to throughput, not cuts.** Squeri on Q2 2026: the 30–40% cycle-time reduction "is really not a savings because what that does is allows us to do more… we have a large backlog of technology projects, we are getting to more things quicker" ([Q2 2026 transcript](https://stockanalysis.com/stocks/axp/transcripts/546571-q2-2026/)). Factory's pitch should therefore be backlog burn-down and output per engineer, not headcount reduction.
3. **Brownfield migration demand is confirmed by a third party.** Google Cloud (Next '26, April 2026) states AmEx "is moving a core on-premises data warehouse and hundreds of production applications to BigQuery to power trusted agentic commerce at scale" ([Google Cloud](https://cloud.google.com/blog/products/data-analytics/whats-new-in-the-agentic-data-cloud)). This is the clearest bounded-migration target in the account.
4. **Regulatory pressure has spiked.** On Oct 8, 2026, the OCC issued a cease-and-desist and a $350M civil money penalty against AENB for BSA/AML deficiencies; the Fed issued orders to AXP and TRS requiring enterprise BSA/AML and OFAC remediation plans ([OCC](https://www.occ.gov/news-issuances/news-releases/2026/nr-occ-2026-87.html); [Banking Dive](https://www.bankingdive.com/news/amex-dinged-by-fed-occ-must-pay-350m-for-aml-failures/832570/)). Remediation will drive transaction-monitoring and data-lineage engineering work with heavy audit requirements.
5. **Commercial Services is shipping software, not just cards.** "Next generation of Amex Corporate" launched Sept 30, 2026 (expense management software built on the Center acquisition, Amex Expense app). AI agents are due "later this fall" and AP software after that ([AmEx newsroom](https://www.americanexpress.com/en-us/newsroom/articles/amex-for-business/american-express-delivers-the-next-generation-of-amex-corporate-.html)). AmEx now runs a SaaS-style product org competing with Ramp and Brex.
6. **The payments network is already modernized and keeps evolving.** AmEx moved from a legacy network to microservices (from 2018), then to new Kubernetes infrastructure, then to cell-based architecture, all with zero downtime ([AmEx Tech blog](https://americanexpress.io/migrating-the-payments-network-twice/)). This is a sophisticated engineering culture (Go, Envoy, Istio, IaC, shadow traffic). Factory must sell to senior engineers who will scrutinize quality, and CI-integrated review is the credible wedge.

## Details: Initiatives Ranked by Importance to AmEx

> Legend: **[C]** = confirmed in a cited source; **[I]** = inference by the author; **[U]** = unverified / carried from the account map, not re-verified this session. "Factory hypothesis" sections are explicitly hypotheses.

---

### 1. Enterprise AI Transformation & Agentic Software Delivery (Technology / AI Transformation Office)
- **Summary [C]:** AmEx has scaled AI-assisted development tools to 11,000+ engineers and is "scaling agentic coding tools to help engineers accelerate end-to-end software development." It also uses AI "to strengthen our cyber defense capabilities and enhance the resilience and availability of our critical platforms." AmEx "provided access to leading AI tools to nearly all colleagues globally" and has "explored hundreds of AI use cases." The AmEx Technology blog ("Reimagining Software Delivery with AI," May 20, 2026) describes a spec-driven lifecycle of Envision + Define → Verify + Specify → Build + Integrate → Test + Release. It says AmEx first "evaluate[d] tools, pilot[ed] agents, integrate[d] those agents into development workflows, and measure[d] productivity gains."
- **Why / how it helps AmEx [C]:** Squeri: responsible AI use "will help us drive operating leverage, make faster, better decisions." CFO Le Caillec (Q2 2026): "AI is going to play a critical role" in operating leverage.
- **Solving for:** A large backlog of technology projects across many platforms and countries. Squeri: "There is no shortage of technology investments or enhancements or refreshes that need to occur."
- **Key people:** Stephen Squeri (Chairman & CEO; former AmEx CIO) [C]. Howard Grosfield (Group President USCS; leads enterprise technology and the AI transformation program strategy) [C]. Ravi Radhakrishnan (EVP & CIO since 2022; owns Enterprise Technology Services, "enterprise AI platforms," enterprise data governance, digital product) [C]. Jon Gantman (EVP, AI Transformation Office) [C, via Radhakrishnan LinkedIn and RocketReach]. Hilary Packer (EVP & CTO from Sept 2019; TheOrg and ZoomInfo now list her as "EVP, Head of Enterprise Data & AI," which AmEx itself has not confirmed) [U]. Radhakrishnan chairs or uses a Generative AI Council for AI governance [C, Metis Strategy interview, Apr 28, 2025].
- **Dates:** Shareholder letter Mar 25, 2026; Q2 call Jul 24, 2026; tech blog May 20, 2026.
- **Technologies [C]:** GitHub Copilot (9,000 engineers as of Apr 2025, "mainly for testing and code completions," per VentureBeat). Internal "APR agent" that reviews pull requests and advises on merge readiness (VentureBeat, Jun 2025). A "core enablement layer" with orchestration that lets teams "swap models in and out" behind an "AI firewall." Open- and closed-source models. "Amex Way Library" and paved roads for JVM, Go and Python. A Phoenix job posting (around Sept 2026, aggregator copy only) lists "Devin AI, Claude, GitHub Copilot, or similar platforms" as preferred skills [U].
- **Factory hypothesis (strongest fit):** AmEx's spec-driven lifecycle maps almost one-to-one to Factory's Specification Mode → Missions → Automated QA → Code/Security Review. Because AmEx already has a model-swapping orchestration layer and an AI firewall, Factory's model-agnostic Droids, Factory Router and Factory Private (VPC) deployment fit its architecture rather than fighting it. Position Factory as the agentic orchestration layer above Copilot autocomplete, and use Factory Analytics (OTEL export) to feed the AI Transformation Office's "enterprise-wide measurement" mandate with ROI per outcome. Risk: AmEx has already built an in-house PR-review agent (APR), so lead with multi-step Missions and Ticket-to-PR rather than review alone.
- **Sources:** [2026 Chairman's Letter](https://www.americanexpress.com/content/dam/amex/en-us/newsroom/pdfs/AXP-2026-Chairmans-Letter-to-Shareholders.pdf) · [Q2 2026 earnings call transcript](https://stockanalysis.com/stocks/axp/transcripts/546571-q2-2026/) · [AmEx Tech blog: Reimagining Software Delivery with AI](https://americanexpress.io/reimagining-software-delivery-with-ai/) · [VentureBeat: How Amex uses AI](https://venturebeat.com/technology/how-amex-uses-ai-to-increase-efficiency-40-fewer-it-escalations-85-travel-assistance-boost) · [VentureBeat: Intuit and Amex production AI agents](https://venturebeat.com/ai/dont-wait-for-a-bake-off-how-intuit-and-amex-beat-competitors-to-production-ai-agents) · [AmEx IR executive committee](https://ir.americanexpress.com/governance-and-corporate-responsibility/executive-committee-and-directors/default.aspx) · [Ravi Radhakrishnan LinkedIn](https://www.linkedin.com/in/ravikumar-radhakrishnan/) · [RocketReach: Jon Gantman](https://rocketreach.co/jon-gantman-email_56972201) · [Metis Strategy interview](https://www.metisstrategy.com/interview/ravi-radhakrishnan/) · [AmEx Tech blog: Python paved road](https://americanexpress.io/empowering-innovation-the-python-paved-road/) · [Job posting (codingjobboard)](https://www.codingjobboard.com/job/sr-software-engineer-ii-at-american-express-usa/20231) · [Job posting (beBee)](https://bebee.com/us/jobs/sr-software-engineer-ii-gcp-java-python-the-personalization-brand-and-communications-technology-amer--t7xk-847618411)

### 2. Technology Backlog Acceleration & Platform Refreshes Pulled Into H2 2026
- **Summary [C]:** AmEx raised FY2026 revenue guidance to ~10% growth but held EPS at $17.30–$17.90 to reinvest in "technology, a little bit in TheFork, also in card acquisition." Squeri: "Across a wide range of technology platforms, we're able to pull some of those investments into the second half of the year… Why not make those investments sooner rather than later to update the platforms."
- **Why:** To sustain double-digit revenue growth at AmEx's current scale (2025 revenue was a record $72.2B, up 10%).
- **Solving for:** Ageing platforms across international, U.S. consumer, corporate, small business, merchant acquiring and network businesses.
- **Key people:** Squeri, CFO Christophe Le Caillec [C].
- **Date:** Jul 24, 2026 (Q2 call). In his Q4 2025 prepared remarks Squeri said: "We now spend $5 billion annually on technology… We're rolling out our new third-generation data and analytics platform, built on the public cloud, already reducing time for key processes by 90%." The 11% figure is a multi-year CAGR in tech spend, not 2025 growth (per 24/7 Wall St.).
- **Technologies:** Not specified.
- **Factory hypothesis:** Budget is already allocated to platform refreshes in H2 2026. Factory can be framed as a way to complete more of the pulled-forward refresh portfolio with the same headcount, for example through Missions for framework/library upgrades and Code Health automations for recurring maintenance. A paid pilot sized to a single platform refresh fits the H2 timing.
- **Sources:** [Q2 2026 earnings call transcript](https://stockanalysis.com/stocks/axp/transcripts/546571-q2-2026/) · [Payments Dive: Amex ups marketing, tech spend](https://www.paymentsdive.com/news/amex-ups-marketing-tech-spend/826146/) · [CIO Dive: Amex AI tool use in software](https://www.ciodive.com/news/amex-AI-tool-use-software/816150/)

### 3. Agentic Commerce (ACE Developer Kit, Agent Purchase Protection, AI-platform distribution)
- **Summary [C]:** On Apr 14, 2026, AmEx launched the Agentic Commerce Experiences (ACE) Developer Kit, which has five services: Agent Registration, Account Enablement, Intent Intelligence, Payment Credentials (tokenized) and Cart Context. It also launched Amex Agent Purchase Protection for registered-agent purchases. AmEx has three agentic-commerce priorities: (1) embed payments in AI ecosystems; (2) make Membership assets such as Resy, Amex Offers and Amex Travel discoverable on AI platforms; (3) build proprietary AI experiences (enhanced dining discovery in the Amex app, AI in the Resy and Amex Travel apps, a geolocation Offers pilot). It also partnered with Anthropic to make U.S. Resy restaurants discoverable in Claude (Apr 24, 2026), contributed to Google's Agent Payments Protocol (AP2), and published a Business Playbook for Agentic Commerce.
- **Why:** Squeri says the shift to AI agents is "one of the most significant changes in how people can discover and pay… since the advent of e-commerce." The closed loop gives AmEx an edge on intent, fraud and disputes.
- **Solving for:** Identity, authorization, fraud and liability in agent-initiated transactions.
- **Key people:** Luke Gebb (EVP, Head of Global Innovation, formerly Amex Digital Labs) [C]. Squeri [C].
- **Dates:** Mar 25, 2026 (letter); Apr 14, 2026 (ACE); Apr 24, 2026 (Anthropic/Resy); Q2 2026 call ("We're in preseason").
- **Technologies:** Tokenized credentials, agent registration, protocol interoperability (AP2, MCP/A2A-adjacent), Claude, ChatGPT [C].
- **Factory hypothesis:** ACE is a new, fast-moving external developer product with specifications, SDKs and integrations across emerging protocols, which is long-running feature work that changes weekly. Droids can generate and maintain SDK samples, protocol adapters and docs (Docs Refresh automation), and Security Review (STRIDE/CWE) suits agent-auth and tokenization code paths. Factory's MCP extensibility is also a credibility point with Gebb's team.
- **Sources:** [AmEx newsroom: ACE Developer Kit](https://www.americanexpress.com/en-us/newsroom/articles/innovation/american-express-debuts-agentic-commerce-experiences--ace--devel.html) · [Digital Commerce 360](https://www.digitalcommerce360.com/2026/04/14/american-express-agentic-commerce-developer-kit-purchase-protection/) · [Finextra](https://www.finextra.com/newsarticle/47579/amex-launches-agentic-commerce-development-kit) · [The Paypers](https://thepaypers.com/payments/news/american-express-launches-ace-developer-kit-and-agent-purchase-protection) · [AmEx agentic commerce page](https://www.americanexpress.com/en-us/company/agentic-commerce/) · [AmEx newsroom: Anthropic / Resy](https://www.americanexpress.com/en-us/newsroom/articles/travel-and-dining/american-express-partners-with-anthropic-to-make-u-s--resy-resta.html) · [Google Cloud: AP2 protocol](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol) · [AmEx Business Playbook for Agentic Commerce](https://www.americanexpress.com/en-us/newsroom/articles/amex-for-business/agentic-commerce-business-playbook.html) · [Yahoo Finance: AI changing Amex](https://finance.yahoo.com/technology/ai/articles/ai-changing-amex-162249905.html) · [2026 Chairman's Letter](https://www.americanexpress.com/content/dam/amex/en-us/newsroom/pdfs/AXP-2026-Chairmans-Letter-to-Shareholders.pdf)

### 4. Commercial Services Roadmap: "Amex Business Membership," Center, Hyper, Next-Gen Amex Corporate
- **Summary [C]:** On Mar 25, 2026, AmEx announced eight new or enhanced commercial products for 2026, "the most significant year for commercial product expansion in company history," starting with the Graphite Business Cash Unlimited Card. Center (expense management, acquired 2025) is the software base. AmEx agreed to acquire Hyper (Hypercard), an agentic expense startup, on Apr 16, 2026, with close expected in Q2 2026. A middle-market pilot ran in Q2 2026. On Sept 30, 2026, AmEx launched the next generation of Amex Corporate: Corporate Cashback Card, integrated Expense Management software (ERP integration, spend controls) and the Amex Expense app. Still to come: an expense agent and an insights agent "later this fall," then Accounts Payable software. Other pieces: a $300 ChatGPT Business credit on Business Platinum/Gold, and a Gen-AI-powered sales platform for Commercial Services sales teams.
- **Why:** Squeri says middle market is "where we have seen the softness," citing Ramp and Brex. Center "will help us not only retain business, but actually win new business."
- **Solving for:** Middle-market share loss to fintechs, and the shift from card-only to software-plus-card.
- **Key people:** Raymond Joabar (Group President, Global Commercial Services) [C]. Marc Baghadjian (Hyper CEO/co-founder) [C]. Radhakrishnan publicly credited the Amex Corporate launch to business, product and engineering teams [C].
- **Dates:** Mar 25, Apr 16, Sept 30, 2026.
- **Technologies:** Center platform, Hyper AI agents, ERP integrations, Amex Agile Partner Platform, Concur virtual cards [C].
- **Factory hypothesis:** Integrating acquisitions is classic Factory territory. Center and Hyper codebases must be merged into AmEx's paved roads, security standards and CI, while shipping agents and AP on a fintech-competitive cadence. Pitch Droids for the integration backlog (Missions), Ticket-to-PR for a startup-speed feature cadence, and Automated QA for ERP-integration regression suites. The Kabbage / Business Blueprint status remains unverified [U].
- **Sources:** [AmEx newsroom: Graphite Business Cash Unlimited](https://www.americanexpress.com/en-us/newsroom/articles/amex-for-business/american-express-launches-new-graphite-business-cash-unlimited-c.html) · [PYMNTS: Business Membership](https://www.pymnts.com/credit-cards/2026/amex-makes-its-biggest-commercial-bet-in-years-with-business-membership/) · [Stacking Capital: 2026 product expansion](https://www.stacking.capital/articles/amex-business-2026-product-expansion-graphite-chatgpt-credit-complete-guide) · [Transforml strategy cascade](https://strategy.transforml.co/amex-strategy-cascade-analysis) · [FinTech Futures: Hyper](https://www.fintechfutures.com/m-a/american-express-acquires-hyper) · [The Paypers: Hypercard](https://thepaypers.com/mergers-aquisitions-and-investments/news/american-express-acquires-agentic-expense-management-company-hypercard) · [PYMNTS: Hyper](https://www.pymnts.com/partnerships/2026/amex-acquires-hyper-to-boost-ai-and-expense-management-offerings/) · [AmEx newsroom: Next-gen Amex Corporate](https://www.americanexpress.com/en-us/newsroom/articles/amex-for-business/american-express-delivers-the-next-generation-of-amex-corporate-.html) · [Nasdaq press release](https://www.nasdaq.com/press-release/american-express-delivers-next-generation-amex-corporatetm-2026-09-30) · [MarketScreener](https://www.marketscreener.com/news/american-express-launches-the-next-generation-of-amex-corporate-with-new-american-express-corporate-ce785ad3d88ef320) · [PYMNTS: spend controls](https://www.pymnts.com/spend-management/2026/american-express-equips-corporate-card-program-with-new-spend-controls/) · [Yahoo Finance: next-gen Amex Corporate](https://finance.yahoo.com/small-business/articles/american-express-delivers-next-generation-110000142.html) · [AmEx: ChatGPT Business benefit](https://www.americanexpress.com/en-us/business/trends-and-insights/articles/how-to-get-more-done-with-chatgpt-business-a-new-benefit-for-american-express-business-platinum-card-and-business-gold-card-members/)

### 5. Financial Crimes Compliance Remediation (BSA/AML, OFAC), plus AI-enabled compliance workflows
- **Summary [C]:** On Oct 8, 2026, AENB consented to an OCC cease-and-desist and a $350M civil money penalty, which Banking Dive says is the OCC's first civil money penalty on a bank "since the $450 million penalty it levied against TD in October 2024." The OCC found the bank failed to tailor its BSA/AML risk assessment and had breakdowns in suspicious-activity monitoring and reporting. The OCC consent order (as quoted by Protos) says AENB processed "approximately $13 billion in suspected TBML activity, including a combination of suspicious card charges and associated repayments… including in certain instances through accounts associated with bank insiders," from about June 2014 to May 2025. According to Banking Dive (Oct 8, 2026), the OCC order requires AENB to "create an action plan within 90 days to address its compliance deficiencies" and "engage a third-party to conduct a suspicious activity review look-back." Under the Fed orders, AXP must submit an enterprise BSA/AML plan and TRS an OFAC compliance plan; Banking Dive gives no deadline for those. No asset cap was imposed, and AmEx says remediation costs will not affect 2027 guidance. Earlier, the "Project Guardian Program Office" (EVP Gina Taylor) was moved to report to CRO Doug Tabish "to strengthen our risk management culture and capabilities to ensure we meet all regulatory requirements" (8-K, Jan 30, 2025). Separately, the shareholder letter cites "AI-enabled workflows that reduce compliance review cycle times" in marketing.
- **Why / solving for:** Regulatory remediation with fixed deadlines; avoiding escalation such as an asset cap.
- **Key people:** Doug Tabish (CRO) [C]. Gina Taylor (EVP, Project Guardian Program Office) [C]. Squeri (also AENB CEO since 2025) [C]. Lynn Pike (AENB board chair) [C].
- **Dates:** Jan 30, 2025 (8-K); Oct 8, 2026 (consent orders).
- **Technologies:** Not disclosed. Inferred: transaction-monitoring systems, data lineage, case management, regulatory reporting [I]. Possible Category III → II regulatory shift and AENB resolution planning [U].
- **Factory hypothesis:** Remediation programs produce large volumes of rule changes, data-pipeline fixes, test evidence and documentation under examiner scrutiny. Factory's audit trails, Security Review, Automated QA and Docs Refresh can produce traceable, reviewable changes, and Factory Private with ZDR and BYOK addresses data sensitivity. Sell carefully: this buyer will prioritize control evidence over speed, so lead with governance features (ISO 42001, SOC 2, audit logs), not velocity claims.
- **Sources:** [OCC news release](https://www.occ.gov/news-issuances/news-releases/2026/nr-occ-2026-87.html) · [Banking Dive](https://www.bankingdive.com/news/amex-dinged-by-fed-occ-must-pay-350m-for-aml-failures/832570/) · [AmEx 8-K, Oct 8, 2026](https://www.sec.gov/Archives/edgar/data/0000004962/000000496226000376/axp-20261008.htm) · [AmEx 8-K, Jan 30, 2025 (Project Guardian)](https://www.sec.gov/Archives/edgar/data/4962/000000496225000010/exhibit991jan302025executi.htm) · [AlfaFinder: $350M penalty](https://news.alfafinderusa.com/news/american-express-350-million-penalty-occ-compliance-reviews) · [2026 Chairman's Letter](https://www.americanexpress.com/content/dam/amex/en-us/newsroom/pdfs/AXP-2026-Chairmans-Letter-to-Shareholders.pdf)

### 6. Enterprise Data Platform Migration to Google BigQuery & AI-Ready Data (Chief Data Office)
- **Summary [C]:** Google Cloud (Next '26 keynote blog and Agentic Data Cloud blog, April 2026) says AmEx "is moving a core on-premises data warehouse and hundreds of production applications to BigQuery to power trusted agentic commerce at scale." Google CEO commentary on Q1 2026 Alphabet results repeated that AmEx is moving "an enterprise data platform along with hundreds of production applications to BigQuery." CDO Chris Gifford (CIO.com) says AmEx uses AI to crawl data for "redundancy, obsolescence, and triviality" and identify golden sources. It has "turned 'talk to my data' on" in a governed environment and is building a data-management layer that grades data readiness for gen AI and agentic AI ("democratize analytics, not data").
- **Why / solving for:** Giving agents trusted data context; retiring an on-prem warehouse; governance (BCBS 239-style [U]).
- **Key people:** Chris Gifford (CDO since Sept 2025; ex-USAA, JPMorgan) [C]. Radhakrishnan (enterprise data platforms) [C].
- **Dates:** Sept 11, 2025 (Gifford appointment); April 2026 (Google Cloud Next '26).
- **Technologies [C]:** Google Cloud BigQuery and GCP. Job postings reference GCP and BigQuery; one aggregator lists Databricks, Tableau and AWS as detected stack [U].
- **Factory hypothesis (strongest migration fit):** "Hundreds of production applications" being repointed or rewritten for BigQuery is a textbook Factory Mission: a bounded brownfield project of many similar features (SQL dialect conversion, connector swaps, pipeline rewrites, test parity). Cite the Comarch proof point. Offer to run one application cluster as a pilot with shadow-validation tests, mirroring AmEx's own shadow-traffic discipline. Note that Google likely has forward-deployed engineers and SI partners (e.g., Deloitte, Accenture) on this. Factory should partner, not compete, possibly via Wipro or EY.
- **Sources:** [Google Cloud: Welcome to Next '26](https://cloud.google.com/blog/topics/google-cloud-next/welcome-to-google-cloud-next26) · [Google Cloud: What's new in the Agentic Data Cloud](https://cloud.google.com/blog/products/data-analytics/whats-new-in-the-agentic-data-cloud) · [Diginomica: Google Cloud growth](https://diginomica.com/google-cloud-growth-rates-surge-twice-rate-aws-and-now-topping-20-billion-quarter) · [TechDogs](https://www.techdogs.com/tech-news/td-newsdesk/google-wants-ai-agents-to-stop-just-thinking-start-doing-with-its-new-agentic-data-cloud) · [Cloudmagazin](https://www.cloudmagazin.com/en/2026/05/03/google-agentic-data-cloud-bigquery-lakehouse-databricks-dach/) · [CIO.com: Democratize analytics, not data](https://www.cio.com/article/4177594/american-express-democratize-analytics-not-data.html) · [CDO Magazine: Gifford appointment](https://www.cdomagazine.tech/leadership-moves/american-express-appoints-chris-gifford-as-chief-data-officer) · [American Banker: Chris Gifford](https://digital-banking.americanbanker.com/profile/chris-gifford/) · [RFP.wiki tech stack (aggregator)](https://www.rfp.wiki/financial-services-banking-fintech/banks-financial-institutions/american-express)

### 7. Payments Network Modernization & Resiliency (GMNS Technology)
- **Summary [C]:** A multi-year modernization begun in 2018 moved live card-authorization traffic from a legacy network to a microservices platform using a Global Transaction Router (GTR), shadow traffic and canary routing (1% → 5% → 10%…). A second zero-downtime migration moved to a new Kubernetes environment using infrastructure-as-code and Envoy-based multi-region canary routing. A cell-based architecture now isolates failures (blog, Jun 11, 2026). Related posts: "Optimizing Istio for Large-Scale Enterprise Applications" (Mar 30, 2026) and Go adoption. Shadow-traffic capability is being reused "to validate other downstream systems migrations."
- **Why / solving for:** Availability, low latency and scale for the network that underpins the closed-loop advantage.
- **Key people:** Benjamin Cane (Distinguished Engineer) [C]. Anna Marrs (Group President, GMNS) [C as GMNS head; not named in these posts]. Evan Kotsovinos (formerly SVP, global head of infrastructure, per a 2020 article; current role unverified) [U].
- **Dates:** Mar 12, 2026 (Monster Scale Summit talk and blog); Jun 11, 2026.
- **Technologies [C]:** ISO 8583 over long-lived TCP, gRPC, Kubernetes, Envoy, Istio, IaC, Go, Java. Mainframe and z/OS teams remain [U, job titles from account map].
- **Factory hypothesis:** Medium fit. The core network is already modern, so the opportunity is in "downstream systems migrations" that still use shadow validation, and in Incident Response / Alert Responder for SRE teams. Factory's on-call results (Empower -40%) are the angle. Don't pitch Factory as a rewrite tool for the authorization path.
- **Sources:** [AmEx Tech blog: Migrating the payments network twice](https://americanexpress.io/migrating-the-payments-network-twice/) · [AmEx Tech blog: Cell-based architecture](https://americanexpress.io/cell-based-architecture-for-resilient-payment-systems/) · [AmEx Tech blog index](https://americanexpress.io/posts/) · [HedgeThink](https://www.hedgethink.com/american-express-cell-based-payment-architecture-reliability/) · [ByteByteGo](https://blog.bytebytego.com/p/built-for-reliability-how-american) · [CIO Dive: Amex infrastructure (2020)](https://www.ciodive.com/news/american-express-infrastructure-remote/579690/)

### 8. AI in Customer Servicing & Travel (Enterprise Shared Services / Global Servicing)
- **Summary [C]:** AmEx "just launched a servicing portal for our CCPs" (Card Member service representatives) with AI embedded to reduce handle time (Q2 2026 call). It plans to pilot conversational AI agents to replace legacy IVR in 2026. An AI-optimized in-app search handles about 1M inquiries/month, and travel counselors in 19 countries use AI tools. Squeri: rep headcount "really has not grown" despite business growth.
- **Key people:** Denise Pickett (President, Enterprise Services) [U]. Anthony Devane (head of global support, enablement & control) [C, Payments Dive]. Radhakrishnan (earlier "Intuitive Servicing Portal") [C, Metis].
- **Dates:** Mar 25, 2026; Jul 24, 2026.
- **Factory hypothesis:** Indirect fit. The IVR replacement and portal integrations are integration-heavy work across legacy telephony and servicing systems ("put a layer above," in Squeri's words). Droids can build and maintain those integration layers and their test harnesses.
- **Sources:** [Q2 2026 earnings call transcript](https://stockanalysis.com/stocks/axp/transcripts/546571-q2-2026/) · [Payments Dive: How Amex exploits new AI tools](https://www.paymentsdive.com/news/how-amex-exploits-new-ai-tools/816000/) · [Metis Strategy interview](https://www.metisstrategy.com/interview/ravi-radhakrishnan/) · [Fortune: empathy and AI transformation](https://fortune.com/2025/10/20/empathy-most-under-hyped-factor-ai-transformation-era-american-express-exec-says) · [2026 Chairman's Letter](https://www.americanexpress.com/content/dam/amex/en-us/newsroom/pdfs/AXP-2026-Chairmans-Letter-to-Shareholders.pdf)

### 9. Credit & Fraud AI (Risk)
- **Summary [C]:** AI has been used in credit and fraud for 15–16 years. AmEx is now using AI on unstructured data for credit insights, and Fraud teams are piloting AI to classify incoming fraud claims. Squeri: "how do you implement sort of unstructured data agentic in that."
- **Key people:** Doug Tabish (CRO) [C].
- **Date:** Jul 24, 2026 (Q2 call).
- **Factory hypothesis:** Weak to medium fit. Model code is governed by model-risk management; Factory fits the surrounding feature pipelines and test coverage, not the models.
- **Sources:** [Q2 2026 earnings call transcript](https://stockanalysis.com/stocks/axp/transcripts/546571-q2-2026/) · [Payments Dive: How Amex exploits new AI tools](https://www.paymentsdive.com/news/how-amex-exploits-new-ai-tools/816000/)

### 10. Marketing AI (campaign creation, compliance review)
- **Summary [C]:** AI agents streamline campaign creation and personalization, and AI-enabled workflows cut compliance-review cycle time (letter; Q2 call: "time to money").
- **Dates:** Mar 25, 2026; Jul 24, 2026.
- **Factory hypothesis:** Low direct fit. Mention only as evidence of an enterprise-wide AI culture.
- **Sources:** [2026 Chairman's Letter](https://www.americanexpress.com/content/dam/amex/en-us/newsroom/pdfs/AXP-2026-Chairmans-Letter-to-Shareholders.pdf) · [Q2 2026 earnings call transcript](https://stockanalysis.com/stocks/axp/transcripts/546571-q2-2026/) · [Payments Dive: Amex ups marketing, tech spend](https://www.paymentsdive.com/news/amex-ups-marketing-tech-spend/826146/)

### 11. Dining Platform Expansion: Resy + Tock Integration, TheFork Acquisition
- **Summary [C]:** AmEx agreed to acquire TheFork from Tripadvisor for $700M cash (announced Jun 15, 2026; close expected before end of 2026, subject to labor consultation and regulatory approvals). TheFork has 50,000+ restaurants in 11 European countries and will stay standalone under existing leadership. Resy and Tock "will come together from a user experience perspective, especially… front-end." AmEx also has a multi-year partnership with Toast. Squeri says spend at Resy restaurants is roughly 2x that of other restaurants.
- **Key people:** Rafa (Rafael) Marquez (President, ICS) [C]. Squeri [C]. Howard Grosfield (Global Dining under USCS) [C].
- **Dates:** Jun 15, 2026; Jul 24, 2026.
- **Factory hypothesis:** The Resy/Tock front-end consolidation is a bounded migration (Missions). Post-close, TheFork's tech teams are a separate European engineering org where EU compliance and integration with AmEx travel tooling create work. Revisit after close, and note EU data-residency needs (Factory Private).
- **Sources:** [AmEx newsroom: TheFork](https://www.americanexpress.com/en-us/newsroom/articles/travel-and-dining/american-express-announces-proposed-acquisition-of-thefork--a-le.html) · [Business Wire: TheFork](https://www.businesswire.com/news/home/20260614939103/en/American-Express-Announces-Proposed-Acquisition-of-TheFork-a-Leading-European-Restaurant-Booking-Platform) · [Quartz](https://qz.com/american-express-thefork-tripadvisor-acquisition-700-million-061526) · [Yahoo Finance: dining ecosystem](https://finance.yahoo.com/markets/stocks/articles/american-express-expands-dining-ecosystem-061129805.html) · [Q2 2026 earnings call transcript](https://stockanalysis.com/stocks/axp/transcripts/546571-q2-2026/)

### 12. Premium Product Refreshes & Digital Experience (USCS / ICS)
- **Summary [C]:** The U.S. Platinum refresh (Sept 2025) drives the fastest growth in USCS, and the Gold Card refresh followed on Apr 30, 2026. Platinum has been refreshed in about 80% of issuing countries. The AmEx app and website ranked #1 in J.D. Power's 2026 studies. Millennials and Gen Z make up about 65% of new consumer accounts. The AmEx Technology blog published "The Innovation Behind Amex's Platinum Card Refresh" (Jan 29, 2026).
- **Key people:** Howard Grosfield (Group President, USCS) [C].
- **Dates:** Jan 29, 2026; Apr 30, 2026; Jul 24, 2026.
- **Factory hypothesis:** Benefit-tracking and app features are continuous feature work, a Ticket-to-PR use case.
- **Sources:** [2026 Chairman's Letter](https://www.americanexpress.com/content/dam/amex/en-us/newsroom/pdfs/AXP-2026-Chairmans-Letter-to-Shareholders.pdf) · [Q2 2026 earnings call transcript](https://stockanalysis.com/stocks/axp/transcripts/546571-q2-2026/) · [AmEx Tech blog index](https://americanexpress.io/posts/) · [Equilar: AmEx executives](https://people.equilar.com/bio/org/american-express-company/2329) · [Howard Grosfield LinkedIn](https://www.linkedin.com/in/howard-grosfield-711b1ab1/)

### 13. International Growth & Regulation (ICS)
- **Summary [C]:** International is the fastest-growing segment (+13% FX-adjusted spend in 2025; +12% in Q2 2026). AmEx is leaning into the UK, Mexico, Canada, Australia and Japan, and merchant locations outside the U.S. have more than doubled over four years. EU/UK regimes (DORA, EU AI Act, GDPR, FCA Consumer Duty) apply [U, account map].
- **Key people:** Rafael Marquez (President, ICS) [C].
- **Date:** Jul 24, 2026.
- **Factory hypothesis:** Multi-country variants of code and regulatory changes are recurring maintenance. Factory Private and BYOK address residency needs.
- **Sources:** [Q2 2026 earnings call transcript](https://stockanalysis.com/stocks/axp/transcripts/546571-q2-2026/) · [2026 Chairman's Letter](https://www.americanexpress.com/content/dam/amex/en-us/newsroom/pdfs/AXP-2026-Chairmans-Letter-to-Shareholders.pdf)

### 14. Agentic AI Platform Engineering & AI Governance
- **Summary [C]:** AmEx is hiring "AI Engineer I/II/III – Agentic AI" to build "platforms, products, and governance that enable agentic AI systems to operate responsibly and at scale." The stack is Python, Go, TypeScript, AWS and/or GCP, Kubernetes, gRPC and Kafka, and the role expects "Use of AI-assisted and agentic development tools for design, implementation, testing, debugging, and refactoring." Tech blog: "Improving Correctness in Agentic AI with Execution Guardrails" (Jul 30, 2026). A Senior AI Engineer role in the UK builds MCP integrations for Production Management tooling. A Director of Strategic Planning role in the Enterprise AI Transformation Office will "lead enterprise-wide measurement and governance" and modernize processes such as Model Governance.
- **Key people:** Radhakrishnan (CIO) [C]; Enterprise AI Transformation Office (Jon Gantman) [C].
- **Dates:** Jul 30, 2026 (blog); job postings around Q3 2026.
- **Technologies [C]:** Python, Go, TypeScript, AWS, GCP, Kubernetes, gRPC, Kafka, RAG, MCP.
- **Factory hypothesis:** Strong cultural fit. AmEx engineers are expected to work agentically and care about execution guardrails, so Factory's Agent Readiness scoring, hooks and governance controls speak their language. Factory Analytics serves the AI Transformation Office's measurement mandate.
- **Sources:** [Indeed: AI Engineer – Agentic AI](https://www.indeed.com/viewjob?jk=6dcbb6887cf9ffe2) · [beBee: AI Engineer III – Agentic AI](https://bebee.com/us/jobs/ai-engineer-iii-agentic-ai-american-express-sunrise--fj-2147377606) · [Glassdoor listings](https://www.glassdoor.com/Job/engineer-american-express-senior-software-jobs-SRCH_KO0,41.htm) · [Techstars job board: Senior AI Engineer](https://jobs.techstars.com/companies/hackajob/jobs/73878285-senior-ai-engineer-applied-ml-engineer-llm-engineer) · [IT Jobs Watch: Senior AI Engineer I (UK)](https://www.itjobswatch.co.uk/jv/American-Express/Senior-AI-Engineer-I-Job-Reading-Berkshire-UK-4wz612) · [Simplify: Director of Strategic Planning, AITO](https://simplify.jobs/p/0997e645-427b-43ef-a8d9-9f32957ed250/Director-of-Strategic-Planning) · [AmEx Tech blog index](https://americanexpress.io/posts/)

### Out of scope / context
- **GBTG stake sale:** Agreed May 4, 2026 (about $1.5B proceeds, about $975M pre-tax gain) and closed Sept 29, 2026 per the account brief. GBTG is now a separate account. Amex GBT's Egencia connector in Claude is a GBTG, not AXP, initiative.
- **Sources:** [AmEx 8-K, May 4, 2026](https://www.sec.gov/Archives/edgar/data/0000004962/000000496226000203/axp-20260504.htm) · [PYMNTS: Amex GBT and Claude](https://www.pymnts.com/news/artificial-intelligence/2026/amex-gbt-empowers-claude-to-book-corporate-travel/) · [Business Travel Executive: Egencia connector](https://www.businesstravelexecutive.com/news/amex-gbt-launches-egencia-ai-connector-in-anthropics-claude/)

## Summary Table (same order as the detailed ranking above)

| # | Initiative | Exec owner(s) | Latest date | Key technologies | Factory fit |
|---|---|---|---|---|---|
| 1 | Agentic software delivery / AI Transformation | Grosfield, Radhakrishnan, Gantman | May 20 & Jul 24, 2026 | GitHub Copilot, APR agent, model-orchestration layer, AI firewall | **Very strong** |
| 2 | Tech backlog / platform refresh pull-forward | Squeri, Le Caillec | Jul 24, 2026 | Multiple platforms | **Strong** |
| 3 | Agentic commerce (ACE, Agent Purchase Protection) | Gebb, Squeri | Apr 14–24, 2026 | Tokenization, AP2, Claude, ChatGPT | Medium-strong |
| 4 | Commercial roadmap: Center, Hyper, Amex Corporate | Joabar | Sept 30, 2026 | Center, Hyper agents, ERP integrations | **Strong** |
| 5 | Financial-crimes remediation (OCC/Fed orders) | Tabish, Taylor, Squeri | Oct 8, 2026 | AML monitoring, lineage [I] | **Strong** (governance-led) |
| 6 | BigQuery warehouse + hundreds of apps migration | Gifford, Radhakrishnan | Apr 2026 | GCP BigQuery | **Very strong** (Missions) |
| 7 | Payments network resiliency | Marrs, Cane | Jun 11, 2026 | Kubernetes, Envoy, Istio, gRPC, Go | Medium |
| 8 | Servicing AI (CCP portal, IVR agents) | Pickett [U], Devane | Jul 24, 2026 | Conversational AI | Medium |
| 9 | Credit & fraud AI | Tabish | Jul 24, 2026 | Unstructured-data ML | Weak-medium |
| 10 | Marketing AI | n/a | Mar 25, 2026 | AI agents | Weak |
| 11 | Dining: Resy/Tock merge, TheFork | Marquez, Grosfield | Jun 15 & Jul 24, 2026 | Web/mobile front ends | Medium |
| 12 | Premium product refresh / digital | Grosfield | Apr 30, 2026 | Amex app | Medium |
| 13 | International growth & EU regulation | Marquez | Jul 24, 2026 | n/a | Medium |
| 14 | Agentic AI platform engineering & governance | Radhakrishnan, AITO | Jul 30, 2026 | Python/Go/TS, K8s, Kafka, MCP | Strong |

## Sumble-Derived Signals

**Important limitation:** The Sumble connector was not available to this research session, and neither were the attached account-map file and prior project chats. **No findings in this report came from Sumble.** All items above are web-sourced. Proxy hiring signals found on the web (not Sumble):
- **Web:** "AI Engineer I/II/III – Agentic AI" postings (New York): agentic-AI platform team; AI-assisted development is an expected practice ([Indeed](https://www.indeed.com/viewjob?jk=6dcbb6887cf9ffe2)).
- **Web (aggregator, unconfirmed):** "Sr Software Engineer II – GCP, Java/Python – Personalization, Brand, and Communications Technology" (Phoenix, around Sept 2026) names Devin AI, Claude and GitHub Copilot as preferred tools. This is a competitive signal: Cognition and Anthropic tooling may be in evaluation ([codingjobboard](https://www.codingjobboard.com/job/sr-software-engineer-ii-at-american-express-usa/20231); [beBee](https://bebee.com/us/jobs/sr-software-engineer-ii-gcp-java-python-the-personalization-brand-and-communications-technology-amer--t7xk-847618411)).
- **Web:** Senior AI Engineer I (UK, Production Management tooling) covers RAG, agentic workflows and MCP integrations ([IT Jobs Watch](https://www.itjobswatch.co.uk/jv/American-Express/Senior-AI-Engineer-I-Job-Reading-Berkshire-UK-4wz612)).
- **Web:** Director of Strategic Planning, Enterprise AI Transformation Office covers measurement, governance and Model Governance modernization ([Simplify](https://simplify.jobs/p/0997e645-427b-43ef-a8d9-9f32957ed250/Director-of-Strategic-Planning)).

**Recommended Sumble queries to run next:** projects and tech stack for "American Express" filtered on BigQuery, Databricks, mainframe/z/OS, COBOL, GitHub Copilot, Claude, Cursor, Devin and Codex. Teams under Enterprise Technology Services and the AI Transformation Office. Hiring velocity in Phoenix, Gurugram and Bengaluru. Separate org lookups for Center ID Corp., Hyper/Hypercard, Resy, Tock and TheFork.

## Key People Map

Initiative numbers refer to the detailed ranking above.

| Person | Title | Initiatives |
|---|---|---|
| Stephen Squeri | Chairman & CEO; CEO of AENB | All; public voice on AI productivity |
| Howard Grosfield | Group President USCS; leads enterprise technology & AI transformation program strategy | 1, 2, 11, 12 |
| Ravi Radhakrishnan | EVP & CIO (AXP & AENB) | 1, 4, 6, 7, 14 |
| Jon Gantman | EVP, Cobrand, Product Development & AI Transformation Office | 1, 14 |
| Hilary Packer | EVP & CTO from Sept 2019; TheOrg/ZoomInfo now list "EVP, Head of Enterprise Data & AI" [U] | 1 (2025 Copilot rollout spokesperson) |
| Chris Gifford | Chief Data Officer | 6 |
| Christophe Le Caillec | CFO | 2 (budget) |
| Raymond Joabar | Group President, Global Commercial Services | 4 |
| Luke Gebb | EVP, Head of Global Innovation | 3 |
| Doug Tabish | Chief Risk Officer | 5, 9 |
| Gina Taylor | EVP, Project Guardian Program Office | 5 |
| Anna Marrs | Group President, GMNS | 7 |
| Benjamin Cane | Distinguished Engineer, payments | 7 (technical champion candidate) |
| Rafa Marquez | President, International Card Services | 11, 13 |
| Denise Pickett [U] | Enterprise Services | 8 |
| Anthony Devane | Head of global support, enablement & control | 8 |

## Recommendations
1. **Primary entry: the AI Transformation program.** Target Grosfield's office and Jon Gantman's AI Transformation Office with a business-outcome story (backlog burn-down, measurable ROI via Factory Analytics), and Radhakrishnan's org with an architecture story (model-agnostic, VPC/Private deployment, fits the existing orchestration layer and AI firewall).
2. **Lead with a bounded Mission pilot on the BigQuery app migration.** Propose 10–20 applications from the "hundreds" with parity tests. Engage via Google Cloud or SI partners rather than around them.
3. **Use the consent orders carefully.** Offer review, security and documentation automation with full audit trails to the CRO/Project Guardian ecosystem. Lead with ISO 42001, SOC 2, ZDR and audit logs.
4. **Complement Copilot, don't displace it.** AmEx has 9,000–11,000 seats on assisted tooling. Frame Factory as the agentic, end-to-end layer AmEx says it is now scaling. Expect competition from Claude Code, Devin and Cursor (job-posting signal) and from AmEx's in-house APR agent.
5. **Procurement:** check whether AmEx holds GCP (likely), AWS or Anthropic/OpenAI commits that Factory's marketplace listings could burn down.
6. **Timing:** listen to the Q3 2026 call on Oct 23, 2026 for updated AI productivity metrics and 2027 tech-spend framing, and reference them in outreach that week.

## Caveats
- **Sumble data, the attached account map and prior chats were not accessible** to the research session. Items marked [U] come from the user's brief and were not re-verified.
- **AI coding vendors:** only GitHub Copilot is publicly confirmed (VentureBeat, Apr 2025: 9,000 engineers, ~10% productivity gain, 85%+ satisfaction). The 2026 "11,000 engineers / >30%" figure names no vendor. The two figures use different metrics (productivity vs. coding cycle time) and should not be compared directly.
- **Q2 2026 figures** (30–40% coding cycle time) are management statements, not audited metrics. Squeri framed them as capacity, not savings.
- **The BigQuery migration** is described by Google, a vendor with an interest in promoting it. AmEx has not published its own scope or timeline.
- **TheFork** has not closed (expected before end of 2026). Hyper's close was expected in Q2 2026 but was not confirmed. The Amex Corporate AI agents are announced for "later this fall" and not yet shipped.
- **Not verified:** the Category III → II regulatory status move. The "$13B" figure is from the OCC consent order as quoted by Protos. The "90 days" deadline applies to the OCC action plan for AENB, per Banking Dive; Banking Dive gives no deadline for the Fed-ordered plans. The $5B annual tech spend comes from Squeri's Q4 2025 remarks, and the 11% is a multi-year CAGR, not 2025 growth.
- **The Barclays conference (Sept 16, 2026)** took place but its transcript was not reviewed ([Yahoo Finance](https://finance.yahoo.com/markets/stocks/articles/american-express-participate-barclays-global-201500258.html)).

## All Sources

1. [2026 Chairman's Letter to Shareholders](https://www.americanexpress.com/content/dam/amex/en-us/newsroom/pdfs/AXP-2026-Chairmans-Letter-to-Shareholders.pdf)
2. [AXP Q2 2026 earnings call transcript (StockAnalysis)](https://stockanalysis.com/stocks/axp/transcripts/546571-q2-2026/)
3. [AmEx Tech blog: Reimagining Software Delivery with AI](https://americanexpress.io/reimagining-software-delivery-with-ai/)
4. [VentureBeat: How Amex uses AI to increase efficiency](https://venturebeat.com/technology/how-amex-uses-ai-to-increase-efficiency-40-fewer-it-escalations-85-travel-assistance-boost)
5. [Google Cloud: What's new in the Agentic Data Cloud](https://cloud.google.com/blog/products/data-analytics/whats-new-in-the-agentic-data-cloud)
6. [AmEx IR: Executive committee and directors](https://ir.americanexpress.com/governance-and-corporate-responsibility/executive-committee-and-directors/default.aspx)
7. [Ravi Radhakrishnan LinkedIn](https://www.linkedin.com/in/ravikumar-radhakrishnan/)
8. [RocketReach: Jon Gantman](https://rocketreach.co/jon-gantman-email_56972201)
9. [Payments Dive: Amex ups marketing, tech spend](https://www.paymentsdive.com/news/amex-ups-marketing-tech-spend/826146/)
10. [Google Cloud: Welcome to Google Cloud Next '26](https://cloud.google.com/blog/topics/google-cloud-next/welcome-to-google-cloud-next26)
11. [TechDogs: Google Agentic Data Cloud](https://www.techdogs.com/tech-news/td-newsdesk/google-wants-ai-agents-to-stop-just-thinking-start-doing-with-its-new-agentic-data-cloud)
12. [Cloudmagazin: Agentic Data Cloud / BigQuery](https://www.cloudmagazin.com/en/2026/05/03/google-agentic-data-cloud-bigquery-lakehouse-databricks-dach/)
13. [OCC news release (Oct 8, 2026)](https://www.occ.gov/news-issuances/news-releases/2026/nr-occ-2026-87.html)
14. [Banking Dive: Amex dinged by Fed, OCC](https://www.bankingdive.com/news/amex-dinged-by-fed-occ-must-pay-350m-for-aml-failures/832570/)
15. [CPA Practice Advisor](https://www.cpapracticeadvisor.com/2026/10/02/190998/190998/)
16. [AmEx newsroom: Next generation of Amex Corporate](https://www.americanexpress.com/en-us/newsroom/articles/amex-for-business/american-express-delivers-the-next-generation-of-amex-corporate-.html)
17. [Yahoo Finance: Next generation Amex Corporate](https://finance.yahoo.com/small-business/articles/american-express-delivers-next-generation-110000142.html)
18. [Fortune: American Express tag](https://fortune.com/tag/american-express)
19. [AmEx Tech blog: Migrating the payments network twice](https://americanexpress.io/migrating-the-payments-network-twice/)
20. [HedgeThink: cell-based payment architecture](https://www.hedgethink.com/american-express-cell-based-payment-architecture-reliability/)
21. [Payments Dive: How Amex exploits new AI tools](https://www.paymentsdive.com/news/how-amex-exploits-new-ai-tools/816000/)
22. [AmEx 2026 proxy statement (DEF 14A)](https://www.sec.gov/Archives/edgar/data/4962/000110465926034163/tm2519434-8_def14a.htm)
23. [Metis Strategy: Ravi Radhakrishnan interview](https://www.metisstrategy.com/interview/ravi-radhakrishnan/)
24. [VentureBeat: Intuit and Amex production AI agents](https://venturebeat.com/ai/dont-wait-for-a-bake-off-how-intuit-and-amex-beat-competitors-to-production-ai-agents)
25. [AmEx Tech blog: Python paved road](https://americanexpress.io/empowering-innovation-the-python-paved-road/)
26. [Job posting: Sr Software Engineer II (codingjobboard)](https://www.codingjobboard.com/job/sr-software-engineer-ii-at-american-express-usa/20231)
27. [Job posting: Sr Software Engineer II (beBee)](https://bebee.com/us/jobs/sr-software-engineer-ii-gcp-java-python-the-personalization-brand-and-communications-technology-amer--t7xk-847618411)
28. [AmEx newsroom: ACE Developer Kit](https://www.americanexpress.com/en-us/newsroom/articles/innovation/american-express-debuts-agentic-commerce-experiences--ace--devel.html)
29. [Digital Commerce 360: ACE and Agent Purchase Protection](https://www.digitalcommerce360.com/2026/04/14/american-express-agentic-commerce-developer-kit-purchase-protection/)
30. [Finextra: Amex launches agentic commerce development kit](https://www.finextra.com/newsarticle/47579/amex-launches-agentic-commerce-development-kit)
31. [AmEx agentic commerce page](https://www.americanexpress.com/en-us/company/agentic-commerce/)
32. [The Paypers: ACE Developer Kit](https://thepaypers.com/payments/news/american-express-launches-ace-developer-kit-and-agent-purchase-protection)
33. [AmEx newsroom: Anthropic partnership for Resy](https://www.americanexpress.com/en-us/newsroom/articles/travel-and-dining/american-express-partners-with-anthropic-to-make-u-s--resy-resta.html)
34. [Google Cloud: AP2 protocol](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol)
35. [AmEx Business Playbook for Agentic Commerce](https://www.americanexpress.com/en-us/newsroom/articles/amex-for-business/agentic-commerce-business-playbook.html)
36. [Yahoo Finance: How AI is changing Amex](https://finance.yahoo.com/technology/ai/articles/ai-changing-amex-162249905.html)
37. [AmEx newsroom: Graphite Business Cash Unlimited Card](https://www.americanexpress.com/en-us/newsroom/articles/amex-for-business/american-express-launches-new-graphite-business-cash-unlimited-c.html)
38. [Stacking Capital: Amex Business 2026 product expansion](https://www.stacking.capital/articles/amex-business-2026-product-expansion-graphite-chatgpt-credit-complete-guide)
39. [Transforml: Amex strategy cascade](https://strategy.transforml.co/amex-strategy-cascade-analysis)
40. [FinTech Futures: Amex acquires Hyper](https://www.fintechfutures.com/m-a/american-express-acquires-hyper)
41. [The Paypers: Amex acquires Hypercard](https://thepaypers.com/mergers-aquisitions-and-investments/news/american-express-acquires-agentic-expense-management-company-hypercard)
42. [PYMNTS: Amex acquires Hyper](https://www.pymnts.com/partnerships/2026/amex-acquires-hyper-to-boost-ai-and-expense-management-offerings/)
43. [MarketScreener: Next generation Amex Corporate](https://www.marketscreener.com/news/american-express-launches-the-next-generation-of-amex-corporate-with-new-american-express-corporate-ce785ad3d88ef320)
44. [PYMNTS: Corporate card spend controls](https://www.pymnts.com/spend-management/2026/american-express-equips-corporate-card-program-with-new-spend-controls/)
45. [AmEx: ChatGPT Business benefit](https://www.americanexpress.com/en-us/business/trends-and-insights/articles/how-to-get-more-done-with-chatgpt-business-a-new-benefit-for-american-express-business-platinum-card-and-business-gold-card-members/)
46. [PYMNTS: Amex Business Membership](https://www.pymnts.com/credit-cards/2026/amex-makes-its-biggest-commercial-bet-in-years-with-business-membership/)
47. [Nasdaq: Next generation Amex Corporate press release](https://www.nasdaq.com/press-release/american-express-delivers-next-generation-amex-corporatetm-2026-09-30)
48. [AmEx 8-K (Oct 8, 2026)](https://www.sec.gov/Archives/edgar/data/0000004962/000000496226000376/axp-20261008.htm)
49. [AmEx 8-K exhibit (Jan 30, 2025): executive changes](https://www.sec.gov/Archives/edgar/data/4962/000000496225000010/exhibit991jan302025executi.htm)
50. [Diginomica: Google Cloud growth](https://diginomica.com/google-cloud-growth-rates-surge-twice-rate-aws-and-now-topping-20-billion-quarter)
51. [CIO.com: Democratize analytics, not data](https://www.cio.com/article/4177594/american-express-democratize-analytics-not-data.html)
52. [CDO Magazine: Chris Gifford appointed CDO](https://www.cdomagazine.tech/leadership-moves/american-express-appoints-chris-gifford-as-chief-data-officer)
53. [American Banker: Chris Gifford profile](https://digital-banking.americanbanker.com/profile/chris-gifford/)
54. [RFP.wiki: American Express](https://www.rfp.wiki/financial-services-banking-fintech/banks-financial-institutions/american-express)
55. [AmEx Tech blog: Cell-based architecture](https://americanexpress.io/cell-based-architecture-for-resilient-payment-systems/)
56. [ByteByteGo: Built for reliability at American Express](https://blog.bytebytego.com/p/built-for-reliability-how-american)
57. [AmEx Tech blog: all posts](https://americanexpress.io/posts/)
58. [Fortune: Empathy in the AI transformation era](https://fortune.com/2025/10/20/empathy-most-under-hyped-factor-ai-transformation-era-american-express-exec-says)
59. [CIO Dive: Amex infrastructure (2020)](https://www.ciodive.com/news/american-express-infrastructure-remote/579690/)
60. [CIO Dive: Amex AI tool use in software](https://www.ciodive.com/news/amex-AI-tool-use-software/816150/)
61. [Yahoo Finance: Amex expands dining ecosystem](https://finance.yahoo.com/markets/stocks/articles/american-express-expands-dining-ecosystem-061129805.html)
62. [Business Wire: Proposed acquisition of TheFork](https://www.businesswire.com/news/home/20260614939103/en/American-Express-Announces-Proposed-Acquisition-of-TheFork-a-Leading-European-Restaurant-Booking-Platform)
63. [AmEx newsroom: Proposed acquisition of TheFork](https://www.americanexpress.com/en-us/newsroom/articles/travel-and-dining/american-express-announces-proposed-acquisition-of-thefork--a-le.html)
64. [Quartz: Amex buys TheFork](https://qz.com/american-express-thefork-tripadvisor-acquisition-700-million-061526)
65. [Equilar: American Express executives](https://people.equilar.com/bio/org/american-express-company/2329)
66. [Howard Grosfield LinkedIn](https://www.linkedin.com/in/howard-grosfield-711b1ab1/)
67. [Indeed: AI Engineer – Agentic AI](https://www.indeed.com/viewjob?jk=6dcbb6887cf9ffe2)
68. [Glassdoor: AmEx senior software engineer jobs](https://www.glassdoor.com/Job/engineer-american-express-senior-software-jobs-SRCH_KO0,41.htm)
69. [beBee: AI Engineer III – Agentic AI](https://bebee.com/us/jobs/ai-engineer-iii-agentic-ai-american-express-sunrise--fj-2147377606)
70. [Techstars job board: Senior AI Engineer](https://jobs.techstars.com/companies/hackajob/jobs/73878285-senior-ai-engineer-applied-ml-engineer-llm-engineer)
71. [IT Jobs Watch: Senior AI Engineer I (UK)](https://www.itjobswatch.co.uk/jv/American-Express/Senior-AI-Engineer-I-Job-Reading-Berkshire-UK-4wz612)
72. [Simplify: Director of Strategic Planning](https://simplify.jobs/p/0997e645-427b-43ef-a8d9-9f32957ed250/Director-of-Strategic-Planning)
73. [AmEx 8-K (May 4, 2026): GBTG stake sale](https://www.sec.gov/Archives/edgar/data/0000004962/000000496226000203/axp-20260504.htm)
74. [AlfaFinder: Amex $350M penalty](https://news.alfafinderusa.com/news/american-express-350-million-penalty-occ-compliance-reviews)
75. [PYMNTS: Amex GBT empowers Claude to book travel](https://www.pymnts.com/news/artificial-intelligence/2026/amex-gbt-empowers-claude-to-book-corporate-travel/)
76. [Business Travel Executive: Egencia AI connector in Claude](https://www.businesstravelexecutive.com/news/amex-gbt-launches-egencia-ai-connector-in-anthropics-claude/)
77. [Yahoo Finance: Amex to participate in Barclays conference](https://finance.yahoo.com/markets/stocks/articles/american-express-participate-barclays-global-201500258.html)
78. [BriefGlance: American Express pulses](https://briefglance.com/companies/american-express-company-amex/pulses/70086)
