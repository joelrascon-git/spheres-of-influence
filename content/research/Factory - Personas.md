# Factory – Personas

---

## PART 1 — PROMPT USED FOR CONTEXT (verbatim)

> **Factory - Personas**
>
> **Audience:**
> I am a strategic enterprise sales rep for Factory.com.
>
> **Task:**
> Generate a list of "personas" that are worth labeling/documenting in a Factory.com sales cycle. This should include but not limited to:
>
> * All the relevant titles a person would have at the company
> * Why those titles or groups of titles are important to a Factory.com sales cycle
>
> Also include a comprehensive list of all the possible titles and group them into appropriate buckets and why those titles.
>
> **Personas:**
> I would like to work off of the following list of defined personas:
>
> * Economic Buyer
> * Decision Maker
> * Champion
> * Technical
> * Evaluator
> * Business Sponsor
> * Coach/Influencer
> * InfoSec
> * Procurement
> * Finance
> * Legal
> * Partner
>
> A contact can be multiple personas.
> For these personas, we should define what each persona is in the context of a sales cycle with Factory.com.
>
> **Formatting**
>
> * Markdown file that is structured to be analyzed effectively by AI agents.
> * Order titles in order of relevance/importance - Importance/relevance is defined as the titles/people that would significantly progress a deal.
> * Include the original prompt at the top of your generated output for reference.
>
> **Sources:**
> Leverage the other chats in the project to get information about Factory.com and Key Contacts. I have attached markdown files from the relevant chats for easy access.
> As needed, search on the web as well to get the most accurate and reliable output for this task.
>
> **Goal:**
> This output will serve as a knowledge base for an AI application to comprehend titles/personas and reason across a contact list to determine who may be who and determine their significance in a sales cycle.

---

## PART 2 — OUTPUT

# Factory Sales-Cycle Personas & Title Knowledge Base

```yaml
document: factory_personas_kb
version: 1.0
created: 2026-10-13
owner: Strategic Enterprise AE, Factory (account: American Express, all entities)
inputs:
  - "Factory - Knowledge Base.md" (project file, verified 2026-10-12)
  - "AmEx - Key Contacts.md" (project file, 2026-10-12)
  - "AmEx - Orgs" (project chat)
  - Web: MEDDPICC definitions, buying-committee research, financial-services title hierarchies
persona_ids: [EB, DM, CH, TECH, EVAL, BS, COACH, INFOSEC, PROC, FIN, LEGAL, PARTNER]
evidence_labels:
  Confirmed: primary source (company filing, company-owned blog/newsroom, person's own post/headline)
  Secondhand: reputable press or data aggregator
  Unverified: carried forward, not re-confirmed
  Inference: analyst reasoning or heuristic; never treat as fact
persona_status_labels:
  Assumed: assigned from title/function only
  Indicated: public evidence supports it (owns initiative, quoted, budget remit in filings)
  Validated: confirmed by behavior or direct conversation (for example, they introduced us to the EB)
```

---

## 0. Rules for AI Agents (read first)

1. **A contact can hold several personas.** Always output a `primary_persona` plus zero or more `secondary_personas`.
2. **A title gives a starting guess, not a conclusion.** Title-only assignments are `status: Assumed`. Upgrade to `Indicated` only with cited evidence, and to `Validated` only from deal-team notes or observed behavior.
3. **Never label anyone a Champion from a title.** The most a title can earn is `Potential Champion`. A Champion is validated by actions: they sell for Factory internally, provide access to the Economic Buyer, and share the decision process.
4. **Each deal or opportunity scope has one Economic Buyer.** Who that is depends on deal size and budget source (see §8.3). A Unit CIO can be the EB for a BU pilot and only a Decision Maker for an enterprise platform deal.
5. **Track the power to block separately from the power to advance.** InfoSec, Legal, Procurement and AI/model-risk governance seldom advance a deal, but each can stop one. Flag them with `can_veto: true`.
6. **Rank relevance as deal progression.** Use: (power over budget or vendor selection) × (proximity to Factory's use cases: SDLC, developer productivity, AI platform, modernization) × (evidence of an active initiative).
7. **Normalize seniority before reasoning** (§7). In investment banks, "VP" is a mid-level title and "Managing Director" is the senior one.
8. **Label the confidence of every claim.** Do not invent titles, reporting lines or budgets.

---

## 1. Why Personas Matter More Than Usual in a Factory Deal

**Buying committees are large.** Gartner research puts complex B2B purchases at six to ten decision-makers ([inblog glossary summarizing Gartner](https://inblog.ai/glossary/buying-committee)). Forrester's 2026 State of Business Buying puts the full network at 13 internal stakeholders plus 9 external influencers ([Komo glossary](https://komo.ai/glossary/buying-committee)). Regulated industries add more review roles ([Instantly benchmarks](https://instantly.ai/blog/decision-maker-benchmarks-enterprise-buying-committee-size/)).

Factory-specific factors widen the committee beyond a normal developer-tool sale (sources: Factory Knowledge Base):

| Factor | Why it widens the committee | Personas it pulls in |
|---|---|---|
| Factory is positioned as a platform and governance decision, not a seat tool ("software factory," whole-SDLC automation) | Engineering leadership, the AI platform team and transformation offices all have a stake | EB, DM, BS, TECH |
| Droids are **autonomous agents with repository write access** (Autonomy levels, Missions, Automations) | Security, technology risk and AI/model governance must approve | INFOSEC, DM (governance councils) |
| **Consumption pricing** (Factory Standard Credits, rate-limit tiers, Extra Usage, Router savings claims) | Variable spend needs forecasting and ROI proof | FIN, EB |
| **Model-agnostic / BYOK / multi-provider** | AI platform owners and Legal care which LLM providers see code | TECH, LEGAL, INFOSEC |
| **Deployment choice** (Managed, Private [Private Preview], FedRAMP [in progress]) | Architecture and security review; maturity questions | TECH, INFOSEC, PROC |
| **Marketplace procurement** (AWS Marketplace, Claude Marketplace, OpenAI B2B marketplace commit burn-down) | Changes the purchasing path and who signs | PROC, FIN, PARTNER |
| **Partner-led motion** (Factory Partner Network funds pilots for qualifying customers; Wipro, EY; cloud co-sell) | Third parties shape scope, timing and influence | PARTNER, COACH |
| **Incumbent tools** (for example GitHub Copilot at AmEx) | Owners of the incumbent can be champions or blockers | CH, DM, EVAL |
| **Regulated-industry context** (AmEx: OCC/Fed BSA/AML consent orders of Oct 8, 2026; AI Transformation Office redesigning approval pathways) | More vendor-risk scrutiny; governance gates move earlier | INFOSEC, LEGAL, PROC, DM |

---

## 2. Persona Taxonomy at a Glance

Personas are ordered by typical **deal-progression weight**: how much engaging this persona moves a Factory deal forward. Weights are an Inference heuristic for scoring.

| Order | ID | Persona | One-line definition (Factory context) | Power type | Progression weight (1–10) | Can veto? | MEDDPICC link | Typical # per enterprise deal |
|---|---|---|---|---|---|---|---|---|
| 1 | EB | Economic Buyer | Has final budget authority and can say yes when others say no | Advance (final) | 10 | Yes (absolute) | E – Economic Buyer | 1 per opportunity scope |
| 2 | CH | Champion | Has power and influence and actively sells Factory internally | Advance (engine) | 9 | No | C – Champion | 1–3 |
| 3 | DM | Decision Maker | Holds a formal vote in vendor selection or sets the decision criteria | Shape + Advance | 9 | Often | D – Decision Criteria / Process | 2–6 |
| 4 | BS | Business Sponsor | Executive who owns the business outcome and gives political air cover | Advance (political) | 8 | Rarely | M – Metrics; I – Pain | 1–2 |
| 5 | TECH | Technical | Sets and approves technical requirements and architecture fit | Shape + Gate | 7 | Yes (technical) | D – Decision Criteria | 2–5 |
| 6 | INFOSEC | InfoSec | Security, technology-risk and AI-governance reviewers who must approve agents touching code | Gate | 7 | Yes (hard) | P – Paper Process; D – Decision Process | 2–6 |
| 7 | EVAL | Evaluator | Runs the hands-on pilot/POC and scores results | Shape | 6 | Soft (bad pilot) | M – Metrics; D – Decision Criteria | 3–15 |
| 8 | FIN | Finance | Validates business case, ROI, budget source and consumption forecasts | Gate + Shape | 5 | Yes (budget) | M – Metrics; E – Economic Buyer | 1–3 |
| 9 | PROC | Procurement | Runs sourcing, vendor onboarding, third-party risk intake and the commercial process | Gate | 5 | Yes (process) | P – Paper Process | 1–3 |
| 10 | LEGAL | Legal | Negotiates contract, data, IP, privacy and AI terms | Gate | 5 | Yes (terms) | P – Paper Process | 1–3 |
| 11 | COACH | Coach/Influencer | Gives inside information or shapes opinion, without necessarily holding power | Inform | 5 | No | C (pre-Champion); Competition intel | 2–10 |
| 12 | PARTNER | Partner | External partner people (GSI, cloud, AI lab, ISV) and customer-side alliance owners who shape or source the deal | Inform + Advance (access) | 4 | No (can derail) | Competition; Decision Process | 1–5 |

---

## 3. Persona Definitions (Factory Sales Cycle)

Each persona uses the same schema: `definition`, `controls`, `cares_about`, `factory_value`, `detection_signals`, `validation_test`, `titles_ordered`, `engage_stages`, `red_flags`, `amex_examples`.

### 3.1 EB — Economic Buyer

- **definition:** The one person with overall authority over the financial decision for the scope being sold ([Zapier on MEDDPICC](https://zapier.com/blog/meddpicc/); [topo.io glossary](https://www.topo.io/glossary/meddicc)). For Factory, this is the executive who owns the budget for engineering productivity / AI-assisted software delivery / modernization at the scope of the deal, and who can overrule a "no" from below.
- **controls:** Budget release; final sign-off; prioritization against other AI and tooling spend (for example the Copilot renewal and in-house agent builds).
- **cares_about:** Enterprise-level outcomes (cycle time, engineering capacity, modernization throughput, cost per outcome); vendor and lab-concentration risk; regulatory exposure; board-level AI narrative.
- **factory_value:** Platform-level ROI via Factory Analytics (cost per story point, PR throughput, autonomy ratio; OTEL export); model independence as "insurance against relying on one AI lab"; deployment choice (Private / air-gapped); spend that can burn down existing AWS, Anthropic or OpenAI commits; proof points such as Comarch (10,000 person-days → 45 days) [Customer, published by Factory].
- **detection_signals:**
  - Title: CIO, CTO, Group CTO, Chief AI Officer, Chief Digital Officer, EVP/SVP Technology, Unit/Divisional CIO (for BU-scoped deals).
  - Filings or the IR site list the person's remit as including "enterprise AI platforms," "technology delivery," or "engineering."
  - Signs or approves large technology programs; sits on the Executive Committee.
- **validation_test:**
  - Champion confirms the person approves spend of this size.
  - The person has approved comparable purchases (for example the Copilot enterprise rollout).
  - Finance or Procurement names them as approver.
  - MEDDPICC evidence: the rep has met the EB, or a champion has confirmed what the EB needs and is carrying it forward ([a79 MEDDPICC guide](https://www.a79.ai/resources/what-is-meddpicc)).
- **titles_ordered (most → least likely EB for a Factory enterprise deal):**
  1. EVP & Chief Information Officer (enterprise)
  2. EVP / Chief Technology Officer (where CTO owns engineering)
  3. Chief AI Officer / Head of AI Transformation (where it holds budget)
  4. Group CTO / Global Head of Technology / Chief Technology & Operations Officer
  5. Chief Digital Officer / Chief Digital & Information Officer
  6. EVP/SVP & Unit CIO / Divisional CTO / BU CIO (BU-scoped deals)
  7. SVP / Head of Engineering / Chief Engineering Officer
  8. SVP Enterprise AI Platforms / Head of Developer Platforms (pilot or department-scoped deals)
  9. CFO / Group President / CEO (only for very large, strategic, multi-year commitments)
- **engage_stages:** Qualify (through champion), Business case, Close, Expansion.
- **red_flags:** No EB access by the business-case stage; the EB "delegates" without naming the approver; budget sits in a different org (for example, the AI platform budget vs the engineering budget) and nobody has mapped it.
- **amex_examples:** Ravi Radhakrishnan, EVP & CIO (AXP and AENB). Remit includes "enterprise AI platforms" (Confirmed, AmEx IR). `status: Indicated`.

### 3.2 DM — Decision Maker

- **definition:** Anyone with a **formal vote or approval** in choosing the vendor, or who **writes the decision criteria**. Unlike the EB, a DM may not own the budget but can choose between options and recommend. Committees such as an Architecture Review Board, Technology Investment Committee or Generative AI Council are DMs in aggregate.
- **controls:** Vendor shortlist; decision criteria (security, model flexibility, deployment, integrations with GitHub/GitLab/Jira); pilot success criteria; standardization ("paved road") decisions.
- **cares_about:** Fit with the platform strategy; consolidation vs tool sprawl; adoption risk; how the tool works alongside incumbents (Copilot, in-house agents); reputation risk if the pilot fails.
- **factory_value:** One harness across CLI, Desktop, IDE, Slack/Jira, CI; Droid Exec for CI paved roads; org-level policy (autonomy levels, deny lists, MCP allowlists); Analytics for adoption proof; works alongside Copilot (Nav case).
- **detection_signals:** SVP/VP/Head of Engineering, Developer Experience, Platform Engineering, Enterprise AI Platforms; Unit CIOs; members of AI councils or architecture boards; leaders who rolled out the incumbent tool.
- **validation_test:** They describe the evaluation process; they set or approve pilot criteria; others defer to their recommendation.
- **titles_ordered:**
  1. Unit / Divisional CIO, BU CTO
  2. SVP/VP, Developer Experience / Developer Platforms / Engineering Productivity
  3. SVP/VP, Enterprise AI Platforms / Head of GenAI Platform
  4. SVP/VP, Engineering / Head of Software Engineering
  5. Head of Platform Engineering / Head of DevOps / CI/CD
  6. Chief Architect / Head of Enterprise Architecture (ARB chair)
  7. CISO (as approver of the security decision; also INFOSEC)
  8. Head of AI Transformation Office / AI Governance Council chair
  9. Senior Director, Engineering (for team-level selections)
- **engage_stages:** Discovery, Solution design, Pilot design, Pilot readout, Selection.
- **red_flags:** DM is also the owner of a competing in-house build ("not invented here"); decision criteria favor autocomplete (a poor-fit signal for Factory).
- **amex_examples:** Michelle Swartz (VP Developer Enablement; owns the Copilot rollout); Berta Rodriguez-Hervas (SVP Enterprise AI Platforms); Unit CIOs Sachin Devand, David McGowan, Gary Kensey; Jon Gantman (AITO approval pathways). `status: Assumed/Indicated`.

### 3.3 CH — Champion

- **definition:** An internal stakeholder with **power and influence** who actively advocates for Factory ([topo.io glossary](https://www.topo.io/glossary/meddicc)), i.e. sells on Factory's behalf when the rep is not in the room ([a79](https://www.a79.ai/resources/what-is-meddpicc)). The champion has a personal win tied to Factory's success, such as a published AI-SDLC vision, a modernization deadline or a productivity target.
- **controls:** Internal narrative; access to the EB and DMs; pilot scoping; timing; internal politics.
- **cares_about:** Personal and team success (a visible win, promotion, delivering the stated initiative); not being embarrassed by a failed vendor.
- **factory_value:** A pilot that proves their own framework (for example Spec Mode + Automated QA + CI Failure Triage operationalizing a spec-driven SDLC); Factory-funded pilot via FPN for qualifying customers; analytics to show the win; case-study narrative.
- **detection_signals (for a Potential Champion only):**
  - Published or spoke publicly on AI-driven SDLC, agentic coding, developer productivity or modernization.
  - Owns a measurable, painful initiative Factory solves.
  - Reports to a likely EB/DM.
  - Mid-to-senior (Director to SVP) with cross-team reach.
- **validation_test (all should be true before `status: Validated`):**
  1. Has power and influence (others act on their recommendation).
  2. Has a vested personal interest in Factory's success.
  3. Has given access to the EB or DMs, or will.
  4. Shares non-public information (decision process, competitors, budget timing).
  5. Sells Factory when the rep is absent (for example, carries the business case forward).
- **titles_ordered (most likely to become a powerful champion):**
  1. VP/SVP, Developer Experience / Developer Enablement / Engineering Productivity
  2. VP, Engineering (with a published AI-SDLC or modernization agenda)
  3. SVP/VP, Enterprise AI Platforms / Head of Agentic AI Engineering
  4. Unit CIO / BU CTO with a burning delivery or modernization program
  5. Head of Platform Engineering / DevOps
  6. Director, Engineering / Director, AI Engineering
  7. Head of Application Modernization / Mainframe Modernization
  8. Distinguished Engineer / Fellow (champion if influential; often COACH)
  9. Senior Engineering Manager (team-level champion only)
- **engage_stages:** All stages; most critical from Pilot through Close.
- **red_flags:** A "champion" who cannot get a meeting with the EB is a COACH. Champion owns an internal competitor. Champion is leaving or in a reorg.
- **amex_examples:** Federico Formica (VP Engineering; authored spec-driven AI SDLC post); Michelle Swartz; Berta Rodriguez-Hervas; David McGowan. All `status: Indicated` at most (Potential Champion).

### 3.4 TECH — Technical

- **definition:** The technical authority who **defines and approves technical fit**: architecture, integration, deployment model, model providers, SCM/CI compatibility and scalability. Has technical veto ("this won't work in our environment"). Distinct from EVAL, which runs the hands-on test. Many orgs merge the two as a "Technical Evaluator"; keep them separate here so agents can distinguish authority from activity.
- **controls:** Technical requirements; architecture review; integration approval (GitHub Enterprise Server / GitLab Self-Hosted, Jira, Slack, CI); LLM/gateway routing approval; deployment-model decision.
- **cares_about:**
  - Fit with the internal AI platform (LLM gateway, model orchestration, AI firewall).
  - Self-managed SCM support; on-prem/VPC options.
  - Observability (OTEL); MCP extensibility.
  - Repo readiness for autonomous agents (tests, scriptable QA).
- **factory_value:**
  - BYOK / gateways / Bedrock / Vertex / Azure OpenAI.
  - Factory Router (including on-prem router in Factory Private).
  - Droid Exec headless CI; MCP registry and allowlist; Agent Readiness reports.
  - Legacy-Bench; consistently top-tier harness on Terminal-Bench (do not claim #1 today).
- **detection_signals:** Titles with Architect, Distinguished/Principal Engineer, Head of AI Platform / LLM Platform, Platform Engineering, DevOps, Cloud Engineering; authors of engineering blog posts on platform, agents or infrastructure.
- **validation_test:** Their sign-off is a named step in the decision process; others ask them "is this technically viable?"
- **titles_ordered:**
  1. SVP/VP, Enterprise AI Platforms / Head of LLM / GenAI Platform Engineering
  2. Chief Architect / Head of Enterprise Architecture
  3. VP/Head of Platform Engineering / Developer Platform (Platform Development)
  4. Distinguished Engineer / Fellow / Chief Engineer
  5. Director, AI Engineering – Agentic AI
  6. Head of DevOps / CI/CD / Build & Release Engineering
  7. Principal / Senior Staff Engineer (platform, AI, cloud-native)
  8. Head of Cloud Engineering / Cloud Platform
  9. Enterprise / Solutions Architect (domain level)
- **engage_stages:** Solution design, Pilot design, Security/architecture review, Rollout planning.
- **red_flags:** Requirement that only an in-house model gateway is allowed, with no BYOK path; repos below Readiness Level 4 for Missions with no appetite for readiness work; hard requirement for GA on-prem today (Factory Private is in Private Preview).
- **amex_examples:** Berta Rodriguez-Hervas; Purvi Shah (VP Enterprise Data Platforms, BigQuery); Benjamin Cane, Gurpreet Singh, Sibish Basheer (Distinguished/Staff engineers). `status: Assumed/Indicated`.

### 3.5 EVAL — Evaluator

- **definition:** People who **use Factory hands-on during the pilot/POC** and whose results and sentiment decide whether the pilot is judged a success. They include pilot leads, engineering managers and the engineers on pilot teams. Below Senior Manager, they matter as a group, not as individuals.
- **controls:** Pilot outcomes (task completion, PR acceptance, review burden); sentiment surveys; anecdotes that reach DMs.
- **cares_about:** Does it save them time? Does it fit their workflow (CLI, IDE, Slack)? Does it create review debt? Is it better than Copilot / Claude Code / Cursor for their tasks?
- **factory_value:** Spec Mode; Missions; Droid CLI/Desktop; long-running sessions; Code Review; CI Failure Triage; Automated QA. A bounded 15–30 task pilot with acceptance tests.
- **detection_signals:** Engineering Manager, Senior Engineering Manager, Engineering Director (pilot lead), Staff/Senior Engineer, SDET/QA lead, SRE on pilot teams; members of DevEx survey or guild programs.
- **validation_test:** Named as pilot participant; feedback is used in the readout.
- **titles_ordered:**
  1. Engineering Director (pilot owner)
  2. Senior Engineering Manager / Engineering Manager (pilot team)
  3. Staff / Principal Engineer on pilot repo
  4. QA / Quality Engineering Lead, SDET Lead
  5. SRE / On-call Lead (Incident Response pilots)
  6. Senior Software Engineer / Software Engineer
  7. Developer Advocate / Enablement Specialist (internal)
- **engage_stages:** Pilot design → Pilot → Readout → Rollout.
- **red_flags:** Pilot users chosen at random without a sponsor; no baseline metrics; pilot repos without tests (Missions cannot self-verify).
- **amex_examples:** Pravin Bhalerao (Engineering Director); Sibish Basheer; Gurpreet Singh. Developer Enablement bootcamp and guild participants (names not identified).

### 3.6 BS — Business Sponsor

- **definition:** The **executive whose business outcome or mandate** Factory serves, and who lends political sponsorship. They may not sign the purchase order, but their mandate justifies the spend (for example, an enterprise AI transformation program, a regulatory remediation program, or a product roadmap blocked by engineering capacity).
- **controls:** Strategic priority; executive air cover; cross-org alignment; sometimes funding from transformation or program budgets.
- **cares_about:** Program outcomes (AI-transformation KPIs, time-to-market, remediation deadlines), board and regulator narrative, competitive position.
- **factory_value:** Translate Factory into their KPI: engineering throughput toward the roadmap; Missions for migrations on a deadline; Automations to absorb remediation engineering; Analytics for program-level ROI reporting.
- **detection_signals:** Group/BU Presidents, Chief Transformation Officers, AI Transformation Office heads, program executives (remediation PMOs), CDOs owning migrations, Chief Product Officers with roadmap pressure.
- **validation_test:** Has publicly or internally stated the mandate; will attend an exec briefing; their staff sponsor the initiative.
- **titles_ordered:**
  1. Executive owning the enterprise AI transformation program (Group President, Chief AI Officer, Chief Transformation Officer)
  2. Head of AI Transformation Office / Enterprise AI Program
  3. Unit CIO / BU CTO (as sponsor for the BU's delivery outcomes)
  4. Chief Data Officer (data/app migration programs)
  5. BU President / General Manager whose roadmap needs engineering capacity
  6. Regulatory remediation program executive (program office head)
  7. Chief Operating Officer / Chief Technology & Operations Officer
  8. Chief Product Officer / SVP Product
  9. Chief Strategy Officer
- **engage_stages:** Qualify (urgency), Business case, Executive alignment, Expansion.
- **red_flags:** Sponsor sees AI coding as a cost line, not an outcome; mandate is aspirational with no program or budget.
- **amex_examples:**
  - Howard Grosfield (leads AI transformation program strategy; Confirmed).
  - Jon Gantman (AITO).
  - Chris Gifford (CDO; BigQuery migration).
  - Raymond Joabar / Anna Marrs (BU sponsors).
  - Gina Taylor (remediation PMO; Unverified).

### 3.7 COACH — Coach/Influencer

- **definition:** A person who **gives the seller guidance, inside information or credibility**, or who **shapes others' opinions**, without necessarily holding decision power. A Coach helps you win; an Influencer shapes the committee's view and can be friendly or hostile. Treat a strong Coach as a candidate Champion.
- **controls:** Information flow (org charts, politics, competing vendors, budget timing); opinion of the technical community; executive calendars (Chiefs of Staff).
- **cares_about:** Being seen as helpful or knowledgeable; their community's success; avoiding bad tools.
- **factory_value:** Early access, technical depth, community recognition (Guild, conference talks), benchmark data.
- **detection_signals:**
  - Chief of Staff to the CIO/CTO; Technology Business Management / Office of the CIO.
  - Distinguished Engineers; engineering bloggers; conference speakers.
  - Former Factory users or customers; ex-colleagues of Factory staff.
  - Alumni of Factory customers (for example Nav, Empower, Chainguard).
  - Partner consultants embedded in the account.
- **validation_test:** Provides accurate non-public information that later proves true.
- **titles_ordered:**
  1. Chief of Staff to CIO/CTO / Head of Office of the CIO
  2. Head of Technology Strategy / Technology Business Management
  3. Distinguished Engineer / Fellow / Principal Engineer (community influence)
  4. Former CISO / outgoing executives (institutional knowledge)
  5. Engineering Director / Senior Manager in adjacent teams
  6. Internal Developer Advocate / Guild lead / Open Source Program Office lead
  7. Executive Assistant to EB (access and calendar)
  8. Embedded consultants (GSI / Big 4); also PARTNER
- **engage_stages:** Prospecting → Discovery (highest value) → throughout.
- **red_flags:** A Coach who wants you to win but can't move anything is not a Champion; don't forecast on them.
- **amex_examples:** Fred Gibbins (retiring CISO; deprioritize); Distinguished Engineers Benjamin Cane, Michael J. Bailey, Amol Salunkhe; Hyper founders (Nikolas Ioannou, Marc Baghadjian) as fintech-native influencers.

### 3.8 INFOSEC — InfoSec (Security, Technology Risk & AI Governance)

- **definition:** Reviewers who must **approve a vendor and an autonomous agent with access to source code, CI and internal systems**. Factory treats this as a broad gate that includes the CISO organization, application/product security, cloud security, IAM, third-party/vendor security risk, technology risk management, and (in regulated firms) model-risk and AI-governance reviewers, where the review is about controls. When the review is about regulation or contracts, route to LEGAL.
- **controls:** Security questionnaires; third-party risk tiering; architecture/security review; data-classification decisions (can source code leave the perimeter?); model-risk inventory; agent permissions.
- **cares_about:**
  - Data boundary (code, secrets), ZDR, training on customer code.
  - Least privilege; audit trails; secrets exposure; prompt injection via MCP.
  - Generated-code vulnerabilities; vendor maturity; certifications.
  - Regulatory exam readiness.
- **factory_value:**
  - Factory Private (VPC/on-prem/air-gapped; Private Preview); FedRAMP in progress.
  - SSO/SAML/SCIM; org-level autonomy controls; deny lists; MCP allowlist.
  - Audit trails + OTEL to SIEM (Splunk/Datadog); ZDR; never trains on customer code; BYOK keys.
  - Security Review automation (STRIDE/CWE); DroidShield; Snyk partnership.
  - SOC 2 (confirm Type I vs II in Trust Center); ISO 27001; ISO 42001.
- **detection_signals:** CISO, Deputy CISO, BISO, AppSec/Product Security, DevSecOps, Cloud Security, Security Architecture, IAM, Third-Party / Vendor Risk, Technology Risk, Model Risk Management, Responsible AI, AI Governance.
- **validation_test:** Named reviewer in the vendor-onboarding or security-review workflow; issues the questionnaire.
- **titles_ordered:**
  1. Chief Information Security Officer
  2. Deputy CISO / SVP Technology Risk & Information Security
  3. Head of Application Security / Product Security / DevSecOps
  4. Head of Model Risk Management / AI Model Risk
  5. Head of AI Governance / Responsible AI (VP Responsible AI)
  6. Head of Technology Risk Management (1st/2nd line)
  7. Business Information Security Officer (BISO) for the BU in scope
  8. Head of Third-Party / Vendor Security Risk (TPRM)
  9. Security Architect / Cloud Security Architect
  10. Head of Identity & Access Management
  11. Security Engineer / Analyst (questionnaire owner)
- **engage_stages:** Engage **early** (Discovery or Pilot design) for any agent with repo write access. Formal review runs in parallel with the Pilot.
- **red_flags:** Security engaged after the pilot ("surprise veto"); code is classified as data that can't leave the perimeter but the deal assumes Factory Managed; new CISO is still forming an agenda (both an opportunity and a risk).
- **amex_examples:** Gleb Reznik (CISO; Secondhand); Fred Gibbins (retiring); VP Responsible AI (open role; incumbent unknown); David Nigro / Doug Tabish (risk leadership, conflicting). `can_veto: true`.

### 3.9 FIN — Finance

- **definition:** Finance stakeholders who **validate the business case, confirm the budget source, and model and approve spend**. Especially relevant for consumption pricing, where forecasting and controls matter.
- **controls:** Budget allocation; business-case approval; spend thresholds; opex/capex treatment; consumption and FinOps controls; vendor payment terms.
- **cares_about:** ROI and payback; cost predictability vs usage variance; overlap with existing spend (Copilot, LLM API commits); ability to burn down existing cloud or AI-lab commitments.
- **factory_value:** Factory Analytics cost-per-outcome; Router savings (–63% vs frontier rates [Vendor]); marketplace commit burn-down (AWS, Claude, OpenAI); pilot on a fixed task mix to model consumption.
- **detection_signals:** CFO, Technology CFO / BU Finance Officer, VP FP&A, Director Technology Finance, FinOps lead, Head of Software Asset Management (finance side), Controller.
- **validation_test:** Named reviewer of the business case or purchase approval above a threshold.
- **titles_ordered:**
  1. Technology CFO / CFO of Technology (Tech Finance head for the CIO org)
  2. CFO (only for strategic or very large commitments)
  3. VP/Director, Technology Finance / Business Finance Officer for ETS
  4. VP, FP&A
  5. Head of FinOps / Cloud Financial Management
  6. Director, Technology Business Management (cost transparency; also COACH)
  7. Finance Business Partner / Senior Financial Analyst (business-case owner)
  8. Controller
- **engage_stages:** Business case → Commercial → Renewal/Expansion forecasting.
- **red_flags:** Finance requires a fixed per-seat price with no usage variance (Factory disqualifier); spend is not budgeted in the current cycle.
- **amex_examples:** Christophe Le Caillec (CFO; only at strategic scale). ETS technology finance leader not identified (gap).

### 3.10 PROC — Procurement

- **definition:** Sourcing and vendor-management staff who **run the commercial process**: RFx, vendor onboarding, supplier risk intake, contract vehicles and negotiation. They also decide whether a marketplace private offer (AWS/Anthropic/OpenAI) is an approved buying path.
- **controls:** Vendor onboarding and timeline; competitive bid requirements; contract vehicle (direct vs marketplace vs GSI); pricing negotiation; supplier diversity and viability checks.
- **cares_about:** Process compliance; price benchmarking; vendor viability (Factory is a 2023 startup; raised $200M at $5B on Sept 15, 2026); reducing tool sprawl; leveraging existing commits.
- **factory_value:** Marketplace burn-down; enterprise terms; partner vehicles (Wipro, EY); evidence of financial stability; existing large FS customers (logos: Morgan Stanley, RBC, Blackstone, Adyen [logo-only]).
- **detection_signals:** Chief Procurement Officer, VP/Director Strategic Sourcing, Category Manager – IT/Software/Technology, Vendor Manager, Supplier Risk, Software Asset Management, Contracts Manager.
- **validation_test:** Issued the onboarding package or NDA/MSA; owns the vendor record.
- **titles_ordered:**
  1. Category Lead / Director, Technology & Software Sourcing (the working owner)
  2. Chief Procurement Officer / SVP Global Supply Management
  3. VP, Strategic Sourcing – Technology
  4. Head of Third-Party Risk Management (onboarding side; also INFOSEC)
  5. Vendor / Supplier Relationship Manager (technology)
  6. Software Asset Management / License Manager
  7. Sourcing Manager / Buyer
  8. Procurement Operations / Supplier Onboarding Analyst
- **engage_stages:** Start early with a "paper process" map ([tldv on MEDDPICC](https://tldv.io/blog/meddpicc-sales-methodology/)); formally from Business case through Close.
- **red_flags:** Procurement first appears after verbal approval; a new vendor freeze or heightened third-party scrutiny (for example during consent-order remediation).
- **amex_examples:** Miguel Gonzalez (SVP, Chief Procurement Officer, Global Supply Management; Unverified). Technology category lead not identified (gap).

### 3.11 LEGAL — Legal

- **definition:** Counsel and privacy/compliance stakeholders who **negotiate and approve contract terms and regulatory acceptability**, including terms specific to AI-generated code.
- **controls:** MSA/order form; DPA; IP ownership of generated output; indemnities; liability caps; open-source license risk; data residency and cross-border transfer (EU entities); AI regulatory requirements; BAA (healthcare only).
- **cares_about:** IP ownership and infringement risk of AI-generated code; confidentiality of source code sent to LLM providers; subprocessors (model providers); regulatory obligations (banking regulators, EU AI Act for EU entities); audit rights.
- **factory_value:** ZDR; never trains on customer code; BYOK and customer-managed keys; Private deployment; data residency (Enterprise plan); a published trust posture (Trust Center). Confirm Factory's indemnity and AI terms with Factory Legal before stating them.
- **detection_signals:** Chief Legal Officer / General Counsel; Deputy GC – Technology & IP; Technology Transactions Counsel; Privacy Officer / DPO; AI / Regulatory Counsel; Commercial Contracts Manager; Compliance (regulatory).
- **validation_test:** Assigned counsel on the contract redline.
- **titles_ordered:**
  1. Technology Transactions / Commercial Counsel (working owner)
  2. Deputy General Counsel – Technology, IP & Data
  3. Chief Privacy Officer / Data Protection Officer
  4. AI / Emerging Technology Regulatory Counsel
  5. Chief Compliance Officer / Regulatory Compliance (as reviewer)
  6. Chief Legal Officer / General Counsel (only on escalation)
  7. Contracts Manager / Legal Operations
- **engage_stages:** Paper process → Close; earlier if AI/IP policy blocks use of agents at all.
- **red_flags:** No enterprise policy on AI-generated code ownership; legal asks for terms Factory doesn't offer (uncapped IP indemnity, etc.).
- **amex_examples:** Laureen Seeger (Chief Legal Officer; Unverified, FY2023 ARS). Technology transactions counsel not identified (gap).

### 3.12 PARTNER — Partner

- **definition:** (a) **External** people from Factory's partner ecosystem who are present in, or influence, the account: GSI/consulting delivery and client partners, cloud provider account teams, AI-lab account teams, ISV partners and FPN members. (b) **Customer-side** owners of those relationships (for example a strategic alliances manager for a cloud provider or GSI).
- **controls:** Access and introductions; influence on architecture and vendor choice (especially in managed delivery programs); contract vehicles (marketplace, GSI subcontract); co-funding of pilots (FPN Strategists run briefings, value assessments and pilots that Factory funds for qualifying customers).
- **cares_about:** Their own revenue and margin; consumption of their cloud or model; delivery success; positioning as the customer's AI advisor.
- **factory_value:** Partner-sourced revenue; marketplace consumption credit; FPN migration-factory delivery; Snyk Studio integration; Wipro WEGA integration.
- **detection_signals:** Employer is Wipro, EY, Accenture, Deloitte, Infosys, TCS, Cognizant, Capgemini, AWS, Google Cloud, Microsoft, Anthropic, OpenAI, NVIDIA, Snyk; titles like Client Partner, Global Account Manager, Partner Development Manager, Customer Engineer, Alliance Director.
- **validation_test:** Confirmed active relationship with the account (SOW, program, commit) and willingness to co-sell.
- **titles_ordered:**
  1. GSI Client Partner / Global Account Lead on the customer (for example Wipro or EY lead for the account)
  2. Cloud provider Account Executive / Strategic Account Manager on the customer (AWS, Google Cloud, Azure)
  3. Cloud provider Partner Development Manager / ISV Partner Manager
  4. AI-lab enterprise account executive on the customer (Anthropic, OpenAI)
  5. GSI Delivery / Engagement Lead on a modernization or migration program
  6. Cloud Customer Engineer / Solutions Architect on the account
  7. FPN partner Strategist / Engineer
  8. ISV partner rep (Snyk, NVIDIA)
  9. Customer-side Strategic Alliances / Technology Partnerships Manager
- **engage_stages:** Prospecting (access), Pilot (delivery capacity), Procurement (vehicle), Expansion.
- **red_flags:** Partner is incented to sell a competing agent (for example a lab's first-party agent or a GSI's own platform); channel conflict over the contract vehicle.
- **amex_examples:** Google Cloud team on the BigQuery migration (names unknown; gap); any Wipro/EY engagement owners (Unverified whether engaged); Anthropic and OpenAI account teams (AmEx has Anthropic ties in agentic commerce per prior research; Unverified for engineering).

---

## 4. Common Multi-Persona Combinations

| Title pattern | Typical persona combination | Notes |
|---|---|---|
| CIO (enterprise) | EB + DM | Business Sponsor too if they personally own the AI agenda |
| CTO | EB or DM + TECH | EB where CTO owns engineering budget; DM/TECH where CTO is architecture/innovation only |
| Chief AI Officer / Head of AI Transformation | BS + DM (+ EB if program budget) | Also a governance gate when they own AI approval pathways |
| Group/BU President owning AI program | BS (+ EB at strategic scale) | Rarely engaged before the pilot proves value |
| Unit / Divisional CIO | DM + BS (+ EB for BU-scoped deal) (+ CH if burning project) | Best "lighthouse" entry for a land |
| SVP/VP Developer Experience / Enablement | DM + CH (potential) + TECH | Often owns the incumbent (Copilot) and DevEx metrics |
| SVP/VP Enterprise AI Platforms | TECH + DM (+ CH) | Build-vs-buy owner for agent infrastructure |
| VP Engineering with published AI-SDLC agenda | CH (potential) + DM + EVAL owner | Strongest evidence-based champion profile |
| Chief Data Officer | BS + DM | For data/app migration Missions |
| Distinguished Engineer / Fellow | TECH + COACH | Can become CH if they sponsor the pilot |
| Engineering Director (pilot owner) | EVAL + CH (team-level) | |
| CISO | INFOSEC + DM (veto) | |
| Head of Model Risk / Responsible AI | INFOSEC + DM (gate) | Legal secondary for regulatory interpretation |
| Technology CFO | FIN + DM (business case) | |
| Chief of Staff to CIO | COACH (+ influence on DM) | Controls agenda and town-hall slots |
| Category Manager, Tech Sourcing | PROC | |
| Head of TPRM | PROC + INFOSEC | |
| GSI Client Partner on the account | PARTNER + COACH | |
| Cloud AE on the account | PARTNER + COACH | Can sponsor marketplace private offer |
| Former employee of a Factory customer, now at the account | COACH (+ CH potential) | Trigger to engage |

---

## 5. Global Title Ranking (cross-bucket, ordered by deal-progression relevance)

Ranking is an Inference heuristic for a large, regulated enterprise like AmEx, selling an enterprise Factory platform. Tier meanings:

- **Tier 1:** can make the deal happen.
- **Tier 2:** shapes and carries the deal.
- **Tier 3:** gates the deal (can block).
- **Tier 4:** supports and informs.

| Rank | Title (canonical) | Tier | Primary persona | Secondary personas | Why it significantly progresses a Factory deal |
|---|---|---|---|---|---|
| 1 | Chief Information Officer (enterprise) | 1 | EB | DM, BS | Owns engineering delivery, platforms and usually AI platforms; signs enterprise spend |
| 2 | Chief Technology Officer (owning engineering) | 1 | EB | DM, TECH | Owns the SDLC and developer tooling strategy |
| 3 | Chief AI Officer / Head of AI Transformation (with budget) | 1 | BS | EB, DM | Mandate for AI-driven productivity; often controls AI program funds and approvals |
| 4 | Executive owning enterprise AI program (Group President / COO) | 1 | BS | EB | Political sponsor; makes Factory an enterprise program |
| 5 | Unit / Divisional CIO, BU CTO | 1 | DM | BS, EB (BU), CH | Owns a BU's delivery roadmap; best land-and-expand entry |
| 6 | SVP/VP, Developer Experience / Developer Platforms / Engineering Productivity | 2 | DM | CH, TECH | Owns developer tooling standards, incumbent tools and productivity metrics |
| 7 | SVP/VP, Enterprise AI Platforms / GenAI Platform | 2 | TECH | DM, CH | Owns the LLM gateway and agent orchestration Factory plugs into; build-vs-buy owner |
| 8 | SVP/VP, Engineering (with AI-SDLC or modernization agenda) | 2 | CH | DM, EVAL | Most likely evidence-based champion; owns teams for the pilot |
| 9 | Chief Data Officer / Head of Enterprise Data & AI | 2 | BS | DM, EB | Owns migration programs (data platform moves) suited to Missions |
| 10 | Head of Application / Legacy / Mainframe Modernization | 2 | BS | CH, DM | Highest-impact Factory use case (Missions for modernization) |
| 11 | Chief Information Security Officer | 3 | INFOSEC | DM | Hard veto on autonomous agents with repo access |
| 12 | Head of Platform Engineering / DevOps / CI-CD | 2 | TECH | DM, CH | Owns CI integration (Droid Exec, Code Review action) |
| 13 | Chief Architect / Head of Enterprise Architecture | 2 | TECH | DM | ARB approval; standards |
| 14 | Head of AI Governance / Responsible AI / Model Risk | 3 | INFOSEC | DM | Approval pathway for AI tools in regulated firms |
| 15 | Deputy CISO / Head of AppSec / DevSecOps | 3 | INFOSEC | TECH, DM | Security review; buyer for Security Review automation |
| 16 | Distinguished Engineer / Fellow | 2 | TECH | COACH, CH | Technical credibility; influences community adoption |
| 17 | Director, AI Engineering – Agentic AI | 2 | TECH | EVAL, CH | Hands-on owner of agentic tooling |
| 18 | Technology CFO / Tech Finance head | 3 | FIN | DM | Business case and budget approval |
| 19 | Senior Director / Director, Engineering (pilot owner) | 2 | EVAL | CH | Delivers pilot results |
| 20 | Chief of Staff to CIO/CTO / Office of the CIO | 4 | COACH | DM (influence) | Agenda, town halls, internal politics |
| 21 | Head of Quality Engineering / Test | 2 | DM | EVAL, CH | Owner for Automated QA / test generation |
| 22 | Head of SRE / Production Engineering / Incident Mgmt | 2 | DM | EVAL | Owner for Incident Response / Alert Responder |
| 23 | Category Lead, Technology Sourcing | 3 | PROC | — | Runs commercial path and onboarding |
| 24 | Technology Transactions Counsel | 3 | LEGAL | — | Contract and AI/IP terms |
| 25 | Head of Third-Party Risk Management | 3 | PROC | INFOSEC | Vendor onboarding and tiering |
| 26 | Regulatory remediation program executive | 2 | BS | DM | Deadline-driven engineering demand |
| 27 | BU President / General Manager | 2 | BS | EB (strategic) | Roadmap pressure needing engineering capacity |
| 28 | Chief Product Officer / SVP Product | 4 | BS | COACH | Roadmap throughput; PM codebase Q&A |
| 29 | Chief Procurement Officer | 3 | PROC | — | Escalation-level commercial approver |
| 30 | Chief Legal Officer / General Counsel | 3 | LEGAL | — | Escalation-level legal approver |
| 31 | CFO | 3 | FIN | EB (strategic) | Only for very large commitments |
| 32 | GSI Client Partner on account | 4 | PARTNER | COACH | Access, delivery, vehicle |
| 33 | Cloud provider AE on account | 4 | PARTNER | COACH | Marketplace path, co-sell |
| 34 | AI-lab enterprise AE on account | 4 | PARTNER | COACH | Commit burn-down; may also be a competitor (first-party agents) |
| 35 | Principal / Staff Engineer | 4 | TECH | EVAL, COACH | Technical validation |
| 36 | Senior Engineering Manager / Engineering Manager | 4 | EVAL | — | Pilot team leads |
| 37 | Head of FinOps / Software Asset Management | 4 | FIN | PROC | Consumption controls |
| 38 | Chief Colleague / People Officer; Head of Engineering Talent / L&D | 4 | COACH | BS (AI fluency) | AI-fluency programs; onboarding outcomes |
| 39 | Chief Strategy Officer / Head of Corp Dev | 4 | COACH | BS | M&A integration (acquired codebases) |
| 40 | Software Engineer / SDET / SRE (IC) | 4 | EVAL | — | Hands-on sentiment, below leadership threshold |

---

## 6. Comprehensive Title Catalog by Functional Bucket

Buckets are ordered by relevance to a Factory deal; titles are ordered by relevance within each bucket. Each title lists common **variants** so agents can match messy CRM or LinkedIn data. `Lvl` uses the normalized seniority from §7.1.

### Bucket 1 — Enterprise Technology Executives
**Why this bucket:** Owns the budget and strategy for software delivery, platforms and AI tooling. This is the Economic Buyer's home.

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 1.1 | Chief Information Officer | EVP & CIO; Global CIO; Group CIO; Chief Information & Technology Officer | L1 | EB | DM, BS | Enterprise owner of tech delivery and, at AmEx, "enterprise AI platforms" |
| 1.2 | Chief Technology Officer | EVP & CTO; Group CTO; Chief Engineering Officer; Global Head of Technology | L1 | EB | DM, TECH | Owns engineering standards and developer tooling |
| 1.3 | Chief Digital / Digital & Information Officer | CDIO; Chief Digital Officer; Chief Digital & Technology Officer | L1 | EB | BS, DM | Owns digital product engineering at scale |
| 1.4 | Unit / Divisional CIO | BU CIO; Unit CIO; CIO, [Business Unit]; Business Technology Officer | L1–L2 | DM | BS, EB (BU), CH | Owns a BU's engineering org and roadmap; land entry |
| 1.5 | Divisional / BU CTO | CTO, [BU]; Head of Technology, [BU] | L2 | DM | TECH, EB (BU) | Same as above for product-led orgs |
| 1.6 | Chief Technology & Operations Officer | Chief Operations & Technology Officer; Head of Technology & Operations | L1 | EB | BS | Combines tech budget with operational outcomes |
| 1.7 | Deputy CIO / Deputy CTO | SVP, Office of the CIO | L2 | DM | COACH | Often runs the CIO's portfolio decisions |
| 1.8 | Field CTO / Innovation CTO (internal) | Head of Emerging Technology; Head of Innovation Engineering | L2–L3 | TECH | COACH, CH | Early adopters; pilot sponsors |

### Bucket 2 — AI Leadership, AI Platforms & AI Transformation
**Why this bucket:** Factory is a buy decision about AI agents in the SDLC. These leaders own AI mandates, the internal agent platform (build vs buy) and AI approval pathways.

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 2.1 | Chief AI Officer | CAIO; Chief AI & Data Officer; Chief Data & Analytics Officer (AI remit) | L1 | BS | EB, DM | Mandate owner for AI productivity; Comarch's buyer was a CAIO |
| 2.2 | Head of AI Transformation Office | EVP/SVP, AI Transformation; Enterprise AI Program Lead; Head of AI Center of Excellence | L1–L2 | BS | DM, INFOSEC (gate) | Runs AI program, measurement and approval pathways |
| 2.3 | SVP/VP, Enterprise AI Platforms | Head of GenAI Platform; Head of LLM Platform; VP AI Engineering; Head of AI Infrastructure | L2–L3 | TECH | DM, CH | Owns LLM services, agent orchestration and evaluation that Factory Router/Droids plug into |
| 2.4 | Head of Generative AI | VP GenAI; Head of Applied AI; Head of AI Products | L2–L3 | DM | TECH, BS | Prioritizes GenAI use cases (council intake) |
| 2.5 | Director, AI Engineering – Agentic AI | Head of Agentic AI; Director Agent Platforms; AI Agents Lead | L4 | TECH | EVAL, CH | Hands-on build-vs-buy evaluator for coding agents |
| 2.6 | Director of Strategic Planning, AI Transformation | AI Portfolio / Program Director; AI PMO lead | L4 | COACH | DM (process) | Knows the intake and approval process |
| 2.7 | Generative AI Council member | AI Steering Committee; AI Review Board | varies | DM | INFOSEC | Committee vote on AI tool approval |
| 2.8 | Head of ML Platform / MLOps | VP ML Engineering; ML Infrastructure lead | L3–L4 | TECH | COACH | Adjacent platform; deployment/infra opinions |
| 2.9 | AI Enablement / AI Fluency Lead | AI Adoption Lead; AI Champions Program Lead | L4–L5 | COACH | EVAL | Drives adoption; useful for rollout |

### Bucket 3 — Developer Experience, Platform Engineering & Engineering Productivity
**Why this bucket:** Owns the "paved road" for developers, the incumbent AI coding tool, CI/CD and productivity metrics. Highest champion density.

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 3.1 | SVP/VP, Developer Experience | Head of DevEx; VP Developer Productivity; VP Engineering Effectiveness; Head of Engineering Excellence | L2–L3 | DM | CH, TECH | Decides developer tooling standards; owns sentiment/cycle-time metrics |
| 3.2 | VP, Developer Enablement | Head of Developer Enablement & Advocacy; Head of Engineering Enablement | L3 | CH | DM, EVAL owner | Runs rollouts, bootcamps and adoption of tools like Copilot |
| 3.3 | VP/Head of Platform Engineering | Head of Developer Platform; Platform Development; Internal Developer Platform lead | L2–L3 | TECH | DM, CH | Integrates Droid Exec, CI actions and MCP into the platform |
| 3.4 | Head of DevOps / CI-CD | VP DevOps; Head of Build & Release; Head of Software Delivery Platform | L3–L4 | TECH | DM, EVAL | CI Failure Triage, Code Review action, headless automation |
| 3.5 | Director, Developer Productivity / Engineering Metrics | Engineering Insights lead; DORA/SPACE metrics owner | L4 | EVAL | COACH, CH | Defines pilot baselines; consumer of Factory Analytics |
| 3.6 | Head of Open Source Program Office | OSPO lead | L4 | COACH | LEGAL (licensing) | Open-source and licensing influence |
| 3.7 | Director, Source Control / SCM Platform | GitHub/GitLab platform owner | L4–L5 | TECH | EVAL | Self-managed SCM integration (GHES, GitLab Self-Hosted) |
| 3.8 | Internal Developer Advocate / Guild Lead | DevRel (internal); Engineering Community Lead | L5–L6 | COACH | EVAL | Shapes community sentiment |

### Bucket 4 — Engineering & Application Development Leadership
**Why this bucket:** Owns the teams, codebases and delivery commitments where Factory runs. Champions and pilot owners come from here.

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 4.1 | SVP, Engineering / Head of Software Engineering | SVP Software Development; Head of Application Development | L2 | DM | BS, CH | Controls many teams; scales pilot to rollout |
| 4.2 | VP, Engineering | VP Software Engineering; "Software Engineering Vice President"; VP Application Development | L3 | CH | DM, EVAL | Pilot owner; strongest champion profile if publicly AI-forward |
| 4.3 | Senior Director, Engineering | Head of Engineering, [Product]; Engineering Lead, [Domain] | L4 | EVAL | CH, DM (team) | Runs multiple teams; ideal pilot scope |
| 4.4 | Director, Engineering | Engineering Director; Director Software Development | L4 | EVAL | CH | Pilot execution owner |
| 4.5 | Senior Engineering Manager | Sr. Manager Software Engineering | L5 | EVAL | COACH | Team-level champion; threshold of the leadership target list |
| 4.6 | Engineering Manager | Software Development Manager; Team Lead | L5–L6 | EVAL | — | Pilot team lead (below leadership threshold) |
| 4.7 | Head of Engineering at acquired entity | Founder/CTO of acquired startup; Head of Engineering, [Acquired brand] | L3–L4 | CH | COACH, DM | Fintech-native culture; integration work suits Missions |

### Bucket 5 — Modernization, Migration & Application Portfolio
**Why this bucket:** Legacy modernization and bounded migrations are Factory's #1 ranked use case (Missions, Spec Mode, Legacy-Bench).

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 5.1 | Head of Application Modernization | VP Legacy Transformation; Head of Modernization Office | L2–L3 | BS | CH, DM | Owns person-day-estimated programs — the strongest Factory ROI story |
| 5.2 | Head of Mainframe / Core Systems | VP Mainframe & Data Center; Head of Enterprise Platforms; Core Banking Technology lead | L2–L3 | DM | BS, TECH | COBOL / legacy estate; migration via partners |
| 5.3 | Cloud Migration Program Director | Head of Cloud Transformation; Cloud Adoption Program lead | L3–L4 | BS | DM, EVAL | Hundreds of apps to refactor (for example a warehouse-to-BigQuery move) |
| 5.4 | Head of Application Portfolio / Rationalization | App Portfolio Manager; Head of Enterprise Applications | L3–L4 | DM | COACH | Prioritizes which apps get modernized |
| 5.5 | M&A Technology Integration Lead | Head of Integration Engineering; Post-merger tech integration | L3–L4 | BS | CH | Integrating acquired codebases (for example Center, Hyper) |

### Bucket 6 — Architecture & Senior Technical Career Path
**Why this bucket:** Technical authority and credibility. Their opinion can make or break technical fit, and they influence community adoption.

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 6.1 | Chief Architect | Head of Enterprise Architecture; VP Architecture; ARB chair | L2–L3 | TECH | DM | Architecture review approval |
| 6.2 | Fellow / Distinguished Engineer | Technical Fellow; Chief Engineer | L2–L3 (IC) | TECH | COACH, CH | Respected voice; can sponsor or kill the technical narrative |
| 6.3 | Principal Engineer / Principal Architect | Senior Principal | L4 (IC) | TECH | EVAL, COACH | Validates on real repos |
| 6.4 | Senior Staff / Staff Engineer | Staff Software Engineer | L5 (IC) | EVAL | TECH, COACH | Pilot power users; blog authors |
| 6.5 | Enterprise / Solutions / Domain Architect | Application Architect; Cloud Architect | L4–L5 | TECH | EVAL | Integration and deployment patterns |

### Bucket 7 — Technology Office, Strategy & Business Management
**Why this bucket:** Controls agendas, budgets-in-motion, the transformation PMO and internal communications. Coaches with real leverage.

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 7.1 | Chief of Staff to CIO/CTO | Head of Office of the CIO; Technology Chief of Staff | L3–L4 | COACH | DM (influence) | Access to EB; town-hall and offsite agendas |
| 7.2 | Technology COO | COO, Technology; Head of Technology Operations & Strategy | L2 | DM | BS, FIN | Runs tech portfolio and vendor spend |
| 7.3 | Head of Technology Strategy | VP Technology Strategy & Planning | L3 | COACH | DM | Shapes multi-year tech roadmap |
| 7.4 | Head of Technology Business Management (TBM) | Tech Portfolio & Investment Management; IT Financial Management | L3–L4 | FIN | COACH | Cost transparency and business-case inputs |
| 7.5 | Head of Technology Transformation PMO | Transformation Office Director; Enterprise PMO lead | L3–L4 | COACH | BS | Program sequencing and intake |
| 7.6 | Head of Engineering Operations | Engineering Ops / Program Management lead | L4 | COACH | EVAL | Rollout logistics |

### Bucket 8 — Security (InfoSec)
**Why this bucket:** Hard gate for autonomous agents with code access; also buyer of the Security Review automation and Factory Private.

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 8.1 | Chief Information Security Officer | CISO; Chief Security Officer; Global Head of Cybersecurity | L1–L2 | INFOSEC | DM | Final security approval; sets AI-agent security policy |
| 8.2 | Deputy CISO / SVP Technology Risk & InfoSec | Head of Cyber Risk; Deputy Chief Security Officer | L2 | INFOSEC | DM | Runs the review program |
| 8.3 | Head of Application / Product Security | VP AppSec; Head of DevSecOps; Head of Secure SDLC | L3 | INFOSEC | DM, CH (Security Review) | Reviews generated-code risk; potential buyer of Security Review + Snyk |
| 8.4 | Business Information Security Officer (BISO) | Divisional CISO; Security Officer, [BU] | L3 | INFOSEC | COACH | BU-level security gate |
| 8.5 | Head of Cloud Security | Cloud Security Architecture lead | L3–L4 | INFOSEC | TECH | Deployment model (Managed vs Private) review |
| 8.6 | Head of Security Architecture | Principal Security Architect | L3–L4 | INFOSEC | TECH | Agent permissions, MCP, network policy |
| 8.7 | Head of Identity & Access Management | IAM Director | L4 | INFOSEC | TECH | SSO/SAML/SCIM; agent identities |
| 8.8 | Head of Third-Party Security Risk | Vendor Security Assessment lead; TPRM (security) | L4 | INFOSEC | PROC | Security questionnaire owner |
| 8.9 | Security Engineer / Analyst (assessments) | Vendor Risk Analyst | L6 | INFOSEC | — | Working-level questionnaire reviewer |

### Bucket 9 — Technology Risk, Model Risk, AI Governance & Compliance
**Why this bucket:** In banks and other regulated enterprises, AI tools pass through model-risk, technology-risk and AI-governance approvals. These gates get tighter during regulatory remediation.

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 9.1 | Head of Model Risk Management | MRM Head; Model Validation lead; AI Model Risk | L2–L3 | INFOSEC | DM, LEGAL | Decides whether agents or LLMs need model inventory/validation |
| 9.2 | VP / Head of Responsible AI / AI Governance | AI Ethics & Governance; AI Risk Officer | L3 | INFOSEC | DM | AI policy and approval criteria |
| 9.3 | Chief Risk Officer | CRO; Chief Credit & Risk Officer | L1 | DM (gate) | INFOSEC | Enterprise risk appetite; escalation point |
| 9.4 | Head of Technology Risk Management | Technology & Data Risk; IT Risk; 2nd line Tech Risk | L3 | INFOSEC | DM | Technology risk acceptance |
| 9.5 | Chief Compliance Officer / Regulatory Compliance | Head of Regulatory Affairs | L1–L2 | LEGAL | DM (gate) | Regulatory acceptability of AI-generated code in regulated systems |
| 9.6 | Chief Audit Executive / Internal Audit, Technology | Head of IT Audit | L1–L3 | COACH | INFOSEC | Audit trail expectations; late-stage reviewer |
| 9.7 | Operational Risk Manager (Technology) | 1st-line risk partner | L4–L5 | INFOSEC | — | Working-level risk assessment |

### Bucket 10 — Quality Engineering & Testing
**Why this bucket:** Automated QA, test generation from acceptance criteria, and Missions' self-validation need QA owners; strong use case for teams short on test coverage.

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 10.1 | VP / Head of Quality Engineering | Head of Testing; VP QA; Head of Test Automation | L3 | DM | CH, EVAL | Owner of Automated QA outcomes |
| 10.2 | Director, Test Automation / SDET | QA Director | L4 | EVAL | TECH | Pilot measures for test coverage |
| 10.3 | QA Lead / SDET Lead | Senior SDET | L5–L6 | EVAL | — | Hands-on user |

### Bucket 11 — SRE, Infrastructure & Operations
**Why this bucket:** Incident Response / Alert Responder and CI triage reduce MTTR and on-call load (Empower: up to –40% incident response time [Customer]).

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 11.1 | VP / Head of SRE / Production Engineering | Head of Reliability Engineering; VP Infrastructure & Operations | L2–L3 | DM | BS, CH | Owns MTTR and on-call pain |
| 11.2 | Head of Incident / Problem Management | Major Incident Manager lead | L4 | EVAL | COACH | Alert Responder pilot owner |
| 11.3 | Head of Cloud Infrastructure / Cloud Platform | VP Cloud Engineering | L3 | TECH | DM | Droid Computers and deployment |
| 11.4 | Head of Observability | Monitoring/Telemetry lead | L4 | TECH | EVAL | OTEL export and Datadog/Splunk integration |

### Bucket 12 — Data & Analytics Leadership
**Why this bucket:** Data-platform migrations involve refactoring hundreds of applications, which suits Missions. The CDO often sits inside the CIO's remit.

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 12.1 | Chief Data Officer | CDO; Chief Data & Analytics Officer; Head of Enterprise Data & AI | L1–L2 | BS | DM, EB (data budget) | Owns migration programs and data governance |
| 12.2 | VP, Enterprise Data Platforms | Head of Data Engineering; Head of Data Platform | L3 | TECH | DM, EVAL | Technical lead for migration |
| 12.3 | Director, Data Engineering | Data Platform Engineering Director | L4 | EVAL | CH | Pilot owner for migration Missions |

### Bucket 13 — Business Executives & Line-of-Business Leaders
**Why this bucket:** Their mandates and roadmaps justify engineering investment. They sponsor outcomes and rarely evaluate tools.

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 13.1 | Group President / President owning enterprise tech & AI | Group President; President & COO | L1 | BS | EB (strategic) | Executive sponsor for the enterprise AI program |
| 13.2 | Chief Transformation Officer | Head of Enterprise Transformation | L1 | BS | DM | Transformation mandate and funding |
| 13.3 | BU President / General Manager | President, [BU]; EVP & GM | L1–L2 | BS | — | Roadmap pressure; competitive urgency |
| 13.4 | Regulatory remediation program executive | EVP Program Office; Head of Remediation PMO | L1–L2 | BS | DM | Deadline-driven engineering demand (for example consent-order action plans) |
| 13.5 | Chief Operating Officer | COO | L1 | BS | EB (strategic) | Operating leverage |
| 13.6 | Chief Executive Officer | CEO; Chairman & CEO | L1 | BS | — | Rarely engaged; AI narrative to investors |
| 13.7 | Chief Strategy Officer / Head of Corp Dev | — | L1–L2 | COACH | BS | Acquisition integration needs |
| 13.8 | Chief Partner / Partnerships Officer (commercial partnerships) | — | L1 | COACH | — | Not a Factory partner owner; adjacent only |

### Bucket 14 — Product Management
**Why this bucket:** Product leaders feel engineering throughput directly; Factory's codebase Q&A cuts PM-to-engineer delays (Empower: –50% product/dev Q&A delay [Customer]).

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 14.1 | Chief Product Officer / SVP Product | Head of Product | L1–L2 | BS | COACH | Roadmap sponsor |
| 14.2 | VP / Director, Product Management | Group Product Manager | L3–L4 | COACH | EVAL | Channel Q&A, spec-to-PR benefits |
| 14.3 | Head of Product Operations | Product Ops lead | L4 | COACH | — | Process adoption |

### Bucket 15 — Finance
**Why this bucket:** Consumption pricing needs a business case, a budget source and forecast controls.

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 15.1 | Technology CFO | CFO, Technology; BU Finance Officer for Technology | L2 | FIN | DM | Approves tech business cases |
| 15.2 | VP/Director, Technology Finance | Tech FP&A; Finance Business Partner, Technology | L3–L4 | FIN | COACH | Builds the business case model |
| 15.3 | Chief Financial Officer | CFO | L1 | FIN | EB (strategic) | Strategic commitments only |
| 15.4 | VP, FP&A | Head of Planning | L3 | FIN | — | Budget cycle timing |
| 15.5 | Head of FinOps / Cloud Financial Mgmt | FinOps Lead | L4 | FIN | TECH | Consumption monitoring; marketplace commit tracking |
| 15.6 | Controller | Corporate Controller | L2–L3 | FIN | — | Accounting treatment |

### Bucket 16 — Procurement & Vendor Management
**Why this bucket:** Owns the paper process and vendor onboarding; decides contract vehicles (direct, marketplace, GSI).

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 16.1 | Category Lead, Technology & Software | Category Manager IT; Sourcing Director – Technology | L4 | PROC | COACH | Working owner of the deal's commercial path |
| 16.2 | Chief Procurement Officer | SVP Global Supply Management; Head of Procurement | L1–L2 | PROC | — | Escalation approver; vendor policy |
| 16.3 | VP, Strategic Sourcing | Head of Technology Procurement | L3 | PROC | — | Negotiation authority |
| 16.4 | Head of Third-Party Risk Management | Supplier Risk; Vendor Management Office | L3–L4 | PROC | INFOSEC | Onboarding tiering and due diligence |
| 16.5 | Software Asset Management / License Manager | SAM lead | L5 | PROC | FIN | Tool overlap and consolidation |
| 16.6 | Sourcing Manager / Buyer | Procurement Specialist | L5–L6 | PROC | — | Transactional processing |

### Bucket 17 — Legal, Privacy & IP
**Why this bucket:** AI-generated code raises IP, confidentiality and regulatory questions beyond standard SaaS terms.

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 17.1 | Technology Transactions Counsel | Commercial Counsel – Technology; Senior Counsel, Procurement | L4–L5 | LEGAL | — | Redlines MSA/DPA/AI terms |
| 17.2 | Deputy General Counsel – Technology, IP & Data | Associate GC, Technology | L2–L3 | LEGAL | DM (policy) | Sets AI-generated code policy |
| 17.3 | Chief Privacy Officer / DPO | Privacy Counsel | L2–L3 | LEGAL | INFOSEC | Data transfer and subprocessors (model providers) |
| 17.4 | AI / Emerging Tech Regulatory Counsel | AI Policy Counsel | L3–L4 | LEGAL | INFOSEC | AI regulation (for example EU entities) |
| 17.5 | Chief Legal Officer / General Counsel | CLO; GC | L1 | LEGAL | — | Escalation only |
| 17.6 | Contracts Manager / Legal Operations | — | L5 | LEGAL | PROC | Process logistics |

### Bucket 18 — People, Talent & Learning
**Why this bucket:** AI fluency and onboarding programs. A minor influence on the Factory decision, but useful for rollout and for the "time to first PR" story.

| # | Canonical title | Variants | Lvl | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|---|
| 18.1 | Chief People / Colleague Experience Officer | CHRO | L1 | COACH | BS (AI fluency) | Enterprise AI workforce agenda |
| 18.2 | Head of Technology Talent / Engineering L&D | Tech Academy lead | L4 | COACH | EVAL | Onboarding and bootcamps |

### Bucket 19 — External Partners (ecosystem)
**Why this bucket:** Partners can provide access, delivery capacity, contract vehicles and pilot funding. They can also compete.

| # | Canonical title | Organization types | Primary | Secondary | Why it matters for Factory |
|---|---|---|---|---|---|
| 19.1 | Client Partner / Global Account Lead | GSIs: Wipro (Factory partner and investor), EY (Factory customer), Accenture, Deloitte, Infosys, TCS, Cognizant, Capgemini | PARTNER | COACH | Relationship with CIO staff; modernization delivery |
| 19.2 | Strategic Account Manager / Account Executive | AWS, Google Cloud, Microsoft Azure | PARTNER | COACH | Marketplace private offers; co-sell; migration programs |
| 19.3 | Partner Development / ISV Partner Manager | AWS, Google Cloud, Azure | PARTNER | — | Co-sell registration and funding |
| 19.4 | Enterprise Account Executive | Anthropic, OpenAI | PARTNER | COACH | Commit burn-down via Claude/OpenAI marketplaces; watch for first-party agent conflict |
| 19.5 | Engagement / Delivery Lead | GSI or FPN partner on a modernization program | PARTNER | EVAL | Runs migration factory work |
| 19.6 | Customer Engineer / Solutions Architect | Cloud provider | PARTNER | TECH | Architecture influence |
| 19.7 | FPN Strategist / Engineer | Factory Partner Network members | PARTNER | — | Briefings, value assessments, funded pilots |
| 19.8 | Partner rep | Snyk, NVIDIA, Fireworks, Groq | PARTNER | — | Security integration, sovereign or air-gapped stacks |
| 19.9 | Strategic Alliances Manager (customer-side) | Customer's vendor alliance office | PARTNER | COACH | Owns the customer's view of GSI/cloud partners |

### Bucket 20 — Practitioners (below leadership threshold)
**Why this bucket:** Their pilot results and sentiment roll up to DMs. Tag as EVAL; don't prioritize individually for outreach.

| # | Canonical title | Variants | Primary | Why it matters for Factory |
|---|---|---|---|---|
| 20.1 | Senior / Software Engineer | Developer; Full-stack/Backend Engineer | EVAL | Daily users; adoption |
| 20.2 | SDET / QA Engineer | Test Engineer | EVAL | QA automation users |
| 20.3 | SRE / DevOps Engineer | Platform Engineer | EVAL | Incident and CI automation users |
| 20.4 | Data Engineer | ETL/Analytics Engineer | EVAL | Migration Mission users |

---

## 7. Title Normalization Rules

### 7.1 Seniority normalization (`Lvl`)

| Lvl | Meaning | Typical corporate titles | Leadership target? |
|---|---|---|---|
| L1 | Executive committee / C-suite / Group | CEO, President, Group President, C-titles, EVP (enterprise-wide) | Yes |
| L2 | Senior executive | EVP (functional), SVP, "Head of [enterprise function]", Fellow (IC), Unit CIO | Yes |
| L3 | Executive | VP, Distinguished Engineer (IC), "Head of [sizable function]" | Yes |
| L4 | Senior management | Senior Director, Director, Principal Engineer (IC) | Yes |
| L5 | Management | Senior Manager, Manager, Staff Engineer (IC) | Senior Manager yes; Manager no |
| L6 | Individual contributor | Engineer, Analyst, Specialist, Associate | No (EVAL only) |

### 7.2 Industry and region title quirks

| Rule | Detail | Action |
|---|---|---|
| **Investment / universal banks** | The ladder generally runs Analyst → Associate → VP → Director/ED/SVP → MD, and VP there is a mid-level role ([PrepLounge](https://www.preplounge.com/finance-forum/roles-and-seniority-at-bulge-bracket-banks-22272); [CFI](https://corporatefinanceinstitute.com/resources/career/typical-hierarchy-investment-banks)) | At Goldman, JPMorgan, Morgan Stanley, Citi, BofA and similar: VP → L5; ED/SVP/Director → L4; MD → L2–L3; Partner → L1–L2 |
| **"Managing Director" outside banking** | Often heads a business, subsidiary or region, and outside the US it can be the CEO equivalent ([JRG Partners](https://www.jrgpartners.com/?p=80703)) | Use company context; non-US subsidiary MD → L1 for that entity |
| **AVP (Assistant Vice President)** | Common in banks and in India/UK operations; below VP | L5 |
| **American Express** | Uses a standard corporate ladder in which VPs lead functions (for example VP Developer Enablement leads that function) [Inference from Key Contacts] | VP → L3; SVP → L2; EVP → L1–L2 |
| **"Head of …"** | Scope varies widely | Infer from team size, reports-to and the word "Global/Enterprise" |
| **Technical career path** | Fellow ≈ SVP; Distinguished Engineer ≈ VP; Principal ≈ Director; Staff ≈ Senior Manager (in influence, not budget) | Tag TECH/COACH; budget authority usually none |
| **"Chief of Staff"** | Influence > authority | COACH with high access score |
| **Acquired-company titles** | Founders keep "CEO/CTO" on LinkedIn after acquisition | Verify current title; treat as L3–L4 inside the parent unless confirmed |
| **Consulting "Principal" / "Partner"** | Different meaning at GSIs and Big 4 | If employer is a partner firm → PARTNER bucket |
| **"Platform" ambiguity** | "Payments Platform," "Commerce Platform" can be product titles, not engineering platform | Check for engineering keywords before Bucket 3 |

### 7.3 Keyword → bucket lexicon (for title parsing)

| Keywords (case-insensitive) | Bucket | Default persona |
|---|---|---|
| CIO, chief information, CTO, chief technology, chief digital, unit CIO, technology officer | 1 | EB / DM |
| AI, artificial intelligence, GenAI, generative, LLM, agentic, agent platform, machine learning platform, AI transformation, AI CoE | 2 | TECH / BS / DM |
| developer experience, DevEx, developer productivity, engineering productivity, enablement, engineering effectiveness, platform engineering, developer platform, paved road, inner source | 3 | DM / CH / TECH |
| DevOps, CI/CD, build, release, SCM, GitHub, GitLab | 3 | TECH |
| engineering, software development, application development, SDLC | 4 | DM / CH / EVAL |
| modernization, legacy, mainframe, COBOL, migration, transformation (tech), rationalization, integration (M&A) | 5 | BS / CH |
| architect, architecture, fellow, distinguished, principal engineer, staff engineer | 6 | TECH / COACH |
| chief of staff, office of the CIO, technology strategy, TBM, PMO, technology operations | 7 | COACH |
| CISO, security, cyber, AppSec, DevSecOps, BISO, IAM, vendor security | 8 | INFOSEC |
| model risk, MRM, responsible AI, AI governance, technology risk, operational risk, compliance, audit | 9 | INFOSEC / LEGAL |
| quality engineering, QA, test, SDET | 10 | DM / EVAL |
| SRE, reliability, production engineering, incident, observability, infrastructure, cloud ops | 11 | DM / TECH |
| data platform, data engineering, chief data, analytics engineering | 12 | BS / TECH |
| president, general manager, COO, chief operating, chief transformation, remediation | 13 | BS |
| product management, chief product, product owner | 14 | BS / COACH |
| CFO, finance, FP&A, FinOps, controller | 15 | FIN |
| procurement, sourcing, supply management, vendor management, supplier, category manager | 16 | PROC |
| counsel, legal, privacy, DPO, contracts, general counsel | 17 | LEGAL |
| people, HR, talent, learning, L&D, colleague experience | 18 | COACH |
| employer ∈ partner list (§3.12) | 19 | PARTNER |

**Negative / deprioritize keywords:** Developer Relations (external-facing, unless internal); Sales Engineer; IT Service Desk / End-User Computing; Marketing Technology (unless engineering); Data Scientist (unless AI platform); recruiter; employees of a divested/separate entity (for AmEx: Amex GBT).

---

## 8. Persona Assignment Algorithm (for AI agents)

### 8.1 Steps

```text
FOR each contact:
  1. Parse title_raw → normalize (expand abbreviations: SVP, EVP, CIO, DevEx, SRE...).
  2. Determine employer:
       if employer in PARTNER list → bucket 19, primary = PARTNER, stop default mapping (still allow COACH).
       if employer is a separate/divested entity (e.g., Amex GBT) → flag out_of_scope.
  3. Assign Lvl using §7.1 + industry quirks §7.2.
  4. Assign function bucket via keyword lexicon §7.3 (first strongest match; ties → higher-relevance bucket).
  5. Apply default persona(s) from the bucket table (§6) → status = Assumed.
  6. Apply evidence upgrades (status → Indicated), citing the source:
       - Remit includes budget for tech/engineering/AI platform → add EB (scope-dependent; see 8.3)
       - Owns a named initiative Factory maps to (AI SDLC, modernization, migration, incident load) → add BS or Potential CH
       - Authored/presented on AI-assisted development, agents, DevEx → add Potential CH or COACH
       - Rolled out incumbent AI coding tool → add DM (+ Potential CH or competitive risk)
       - Reviewer role in security/vendor/AI governance → add INFOSEC/PROC/LEGAL + can_veto
       - Reports directly to EB → +1 influence
  7. Apply deal-team evidence (status → Validated): meetings, behaviors, CRM notes.
  8. Score influence (8.2), set can_veto, set engage_stage.
  9. Output record per schema §12; never invent missing fields (use null + gap note).
```

### 8.2 Influence score (0–100, Inference heuristic)

```text
influence = 0.35*authority + 0.25*initiative_fit + 0.20*proximity_to_EB + 0.10*evidence_strength + 0.10*access
  authority:        L1=100, L2=85, L3=70, L4=50, L5=30, L6=10 (IC career path: Fellow=70, DE=60, Principal=40)
  initiative_fit:   100 if owns an initiative Factory directly serves; 60 adjacent; 20 none
  proximity_to_EB:  100 is EB; 80 direct report; 50 two levels; 20 other
  evidence_strength: Confirmed=100, Secondhand=70, Unverified=30, Inference=20
  access:           100 met/engaged; 60 warm path (champion/partner/coach); 20 cold
Flags: can_veto (INFOSEC/LEGAL/PROC/FIN/governance DM) are reported separately, not added to influence.
```

### 8.3 Who is the Economic Buyer? (scope heuristic — Inference; confirm with Champion/Finance)

| Opportunity scope | Typical annual value (heuristic) | Likely EB | Likely additional approvers |
|---|---|---|---|
| Pilot / POC (possibly FPN-funded) | Low or $0 | VP/SVP DevEx, AI Platforms or Unit CIO | InfoSec review still required |
| Team / department land | Low six figures | Unit CIO / SVP Engineering / SVP AI Platforms | Tech Finance; Procurement |
| BU-wide rollout | Mid six to low seven figures | Unit CIO (EB) with CIO awareness | Tech CFO; Procurement; Legal |
| Enterprise platform (thousands of engineers) | Seven figures + | Enterprise CIO/CTO | Tech CFO; CISO; AI governance; CPO; Legal |
| Strategic multi-year / modernization program | Eight figures + | CIO + sponsoring Group President / CFO | Executive committee; Board risk committee (regulated) |

---

## 9. Deal-Stage Engagement Map

| Stage | Goal | Must-engage personas | Should-engage | Exit evidence |
|---|---|---|---|---|
| 1. Prospect / Access | Find a way in | COACH, PARTNER | Potential CH | Warm intro or meeting with Potential CH |
| 2. Discovery | Pain, initiative, metrics | Potential CH, DM | BS, TECH, COACH | Named initiative + baseline metrics |
| 3. Qualify | Confirm EB, process, budget path | CH, EB (via CH) | BS, FIN (budget timing) | EB identified; decision process mapped |
| 4. Solution & Pilot design | Scope a winnable pilot | CH, TECH, DM, **INFOSEC (early)** | EVAL leads, PARTNER (FPN) | Success criteria signed off; security path agreed |
| 5. Pilot / POC | Prove value | EVAL, CH, TECH | DM | Pilot readout with Analytics data |
| 6. Security & Governance review | Clear gates | INFOSEC, AI governance DM | LEGAL (data terms) | Approval / risk acceptance |
| 7. Business case | Justify spend | EB, FIN, BS | CH | Approved business case |
| 8. Commercial / Paper | Contract | PROC, LEGAL | PARTNER (vehicle), FIN | Signed order |
| 9. Close | Final approval | EB, DM | BS | Signature |
| 10. Rollout & Expansion | Adoption → expansion | CH, DM, EVAL, BS | PARTNER, FIN | Usage growth; new BU land |

---

## 10. Persona → Factory Messaging & Capability Matrix

| Persona | What they need to hear | Lead capabilities | Proof to bring | Avoid |
|---|---|---|---|---|
| EB | Enterprise outcomes, risk-controlled, measurable | Software Factory, Analytics/OTEL, Router, Private deployment, marketplace burn-down | Comarch (10,000 person-days → 45 days) [Customer]; customer pilot data | Benchmark-only pitch; "#1 on Terminal-Bench" |
| DM | Fits our platform and standards; complements incumbents | One harness everywhere; Droid Exec; org policy controls; integrations | Nav kept Copilot and added Factory [Customer] | Rip-and-replace framing |
| CH | Makes their initiative succeed visibly | Spec Mode, Missions, Automated QA, CI Failure Triage, Code Review | Their own framework mapped to Factory; FPN-funded pilot | Overpromising autonomy without review capacity |
| BS | Program KPI acceleration | Missions (modernization), Automations (backlog), Analytics (reporting) | Comarch target of 100% AI-developed new code by end of 2026 [Customer] | Developer-tool jargon |
| TECH | Works in our environment and with our model gateway | BYOK, gateways, Router, MCP + allowlist, GHES/GitLab Self-Hosted, Readiness reports | Docs; architecture session | Unsupported claims about custom models (only OpenAI/Anthropic official APIs fully tested) |
| EVAL | Saves me time without review debt | CLI/Desktop, Spec Mode, long sessions, Code Review | Hands-on tasks with acceptance tests | Vague tasks ("improve architecture") |
| INFOSEC | Data boundary, least privilege, auditability | Private/air-gapped (Private Preview), ZDR, no training on code, SSO/SCIM, audit + OTEL, autonomy controls, Security Review + Snyk | Trust Center; SOC 2 (confirm type), ISO 27001/42001 | Hiding maturity status (Private Preview, FedRAMP in progress) |
| FIN | Predictable, attributable spend | Analytics cost-per-outcome, Router savings [Vendor], Droid Core, marketplace commits | Consumption model from pilot | Promising fixed per-seat economics |
| PROC | Simple, compliant path; vendor viability | AWS/Claude/OpenAI marketplaces; partner vehicles | Funding/valuation; FS logos [logo-only] | Bypassing their process via the champion |
| LEGAL | IP, confidentiality and regulatory comfort | ZDR, BYOK, data residency, Private deployment | Factory Legal's standard AI terms | Stating indemnities not confirmed by Factory Legal |
| COACH | Insight in exchange for respect and value | Early access, community (Guild) | — | Forecasting on a coach |
| PARTNER | Their revenue and delivery success | FPN, marketplace consumption, Wipro WEGA, Snyk Studio | FPN economics | Channel conflict surprises |

---

## 11. Coverage Rules & Red Flags

**Minimum persona coverage before forecasting (Inference heuristic):**

| Forecast category | Required personas engaged (status ≥ Indicated unless stated) |
|---|---|
| Pipeline | Potential CH + DM |
| Best case | Validated CH + DM + TECH + EB identified |
| Commit | Validated CH + EB met (or carried by CH) + INFOSEC path cleared or scheduled + FIN business case + PROC/LEGAL path mapped |

**Red flags (auto-alert):**
1. Single-threaded (only one contact engaged).
2. No EB identified by the Qualify stage.
3. Champion not validated by the Pilot stage.
4. INFOSEC not engaged before the pilot starts on real repos.
5. PROC/LEGAL first contact after verbal approval.
6. DM owns a competing in-house agent or a lab-bundled agent preference.
7. Key persona is departing or in a reorg (for example a retiring CISO).
8. Regulated-firm event raises vendor scrutiny (for example AmEx's Oct 8, 2026 consent orders): add LEGAL, PROC (TPRM) and risk DMs earlier.
9. Partner on the account has a conflicting incentive.

---

## 12. Contact Tagging Schema (for AI applications)

```json
{
  "contact_id": "string",
  "name": "string",
  "account": "American Express",
  "entity": "AXP | AENB | acquired entity | partner org | out_of_scope",
  "title_raw": "string",
  "title_normalized": "string",
  "seniority_level": "L1|L2|L3|L4|L5|L6",
  "function_bucket": "1-20 (see §6)",
  "primary_persona": "EB|DM|CH|TECH|EVAL|BS|COACH|INFOSEC|PROC|FIN|LEGAL|PARTNER",
  "secondary_personas": ["..."],
  "persona_status": "Assumed|Indicated|Validated",
  "champion_flag": "none|potential|validated",
  "can_veto": true,
  "influence_score": 0,
  "linked_initiatives": ["I1", "I6"],
  "factory_capabilities": ["Missions", "Code Review"],
  "engage_stage": "Prospect|Discovery|Qualify|Pilot design|Pilot|Security review|Business case|Paper|Close|Expansion",
  "evidence": [{"claim": "string", "source_url": "string", "confidence": "Confirmed|Secondhand|Unverified|Inference"}],
  "gaps": ["string"]
}
```

**Example records (AmEx):**

```json
[
  {
    "name": "Ravi Radhakrishnan",
    "title_raw": "EVP & Chief Information Officer (AXP and AENB)",
    "seniority_level": "L1",
    "function_bucket": 1,
    "primary_persona": "EB",
    "secondary_personas": ["DM"],
    "persona_status": "Indicated",
    "champion_flag": "none",
    "can_veto": true,
    "linked_initiatives": ["I1", "I2", "I6", "I7", "I14"],
    "evidence": [{"claim": "Remit includes enterprise AI platforms and technology delivery", "source_url": "https://ir.americanexpress.com/governance-and-corporate-responsibility/executive-committee-and-directors/default.aspx", "confidence": "Confirmed"}]
  },
  {
    "name": "Federico Formica",
    "title_raw": "Software Engineering Vice President",
    "seniority_level": "L3",
    "function_bucket": 4,
    "primary_persona": "CH",
    "secondary_personas": ["DM", "EVAL"],
    "persona_status": "Indicated",
    "champion_flag": "potential",
    "can_veto": false,
    "linked_initiatives": ["I1"],
    "evidence": [{"claim": "Authored spec-driven AI SDLC post, May 20, 2026", "source_url": "https://americanexpress.io/reimagining-software-delivery-with-ai/", "confidence": "Confirmed"}],
    "gaps": ["Business unit unconfirmed"]
  },
  {
    "name": "Gleb Reznik",
    "title_raw": "Chief Information Security Officer",
    "seniority_level": "L1",
    "function_bucket": 8,
    "primary_persona": "INFOSEC",
    "secondary_personas": ["DM"],
    "persona_status": "Indicated",
    "can_veto": true,
    "evidence": [{"claim": "Named CISO, replacing Fred Gibbins", "source_url": "https://www.securityweek.com/industry-moves/mar-16-2026/", "confidence": "Secondhand"}]
  }
]
```

---

## 13. Applied Example — AmEx Key Contacts Mapped to Personas

Source: "AmEx - Key Contacts.md" (Oct 12, 2026). Title confidence is carried over from that file; persona status reflects public evidence only. **No contact is a Validated Champion yet** (greenfield account).

| Name | Title (confidence) | Lvl | Primary | Secondary | Status | can_veto | Why (evidence-based) |
|---|---|---|---|---|---|---|---|
| Ravi Radhakrishnan | EVP & CIO (Confirmed) | L1 | EB | DM | Indicated | Yes | Owns ETS including enterprise AI platforms |
| Howard Grosfield | Group President, USCS; leads enterprise AI transformation program strategy (Confirmed) | L1 | BS | EB (strategic) | Indicated | — | Enterprise AI program owner; CIO reports into him |
| Jon Gantman | EVP, Cobrand, Product Dev & AITO (Secondhand) | L1–L2 | BS | DM (AI approval pathway) | Indicated | Yes (governance) | AITO redesigning AI risk/governance approvals |
| Berta Rodriguez-Hervas | SVP, Enterprise AI Platforms (Confirmed) | L2 | TECH | DM, CH (potential) | Indicated | Yes (technical) | Owns shared LLM/agent orchestration layer |
| Hilary Packer | EVP, Head of Enterprise Data & AI (Secondhand) | L1–L2 | DM | BS, EB (possible) | Assumed | — | Former CTO; likely executive over AI platforms (Inference) |
| Michelle Swartz | VP, Developer Enablement (Confirmed) | L3 | DM | CH (potential), EVAL owner | Indicated | — | Rolled out GitHub Copilot; owns DevEx metrics |
| Federico Formica | VP, Engineering (Confirmed) | L3 | CH (potential) | DM, EVAL | Indicated | — | Published spec-driven AI SDLC framework |
| Pravin Bhalerao | Engineering Director (Confirmed byline) | L4 | EVAL | COACH, CH (team) | Indicated | — | Co-author of the AI SDLC post |
| Sachin Devand | EVP & Unit CIO, USCS & Membership Digital Experiences (Confirmed) | L1–L2 | DM | BS, EB (BU) | Indicated | — | Tech lead for Grosfield's BU; Platinum refresh |
| David McGowan | SVP & CIO, GCS Technology (Confirmed) | L2 | DM | BS, CH (potential), EB (BU) | Indicated | — | Integrating Center/Hyper into next-gen Amex Corporate |
| Gary Kensey | EVP & Unit CIO, Global Servicing & Corporate Technology (Secondhand) | L1–L2 | DM | BS, EB (BU) | Indicated | — | Multi-LLM GenAI; tech for Risk/Compliance/Audit |
| Jason Sharples | SVP, Unit CIO GMNS (Unverified) | L2 | DM | BS | Assumed | — | Payments tech owner if confirmed |
| Chris Gifford | Chief Data Officer (Secondhand) | L2 | BS | DM | Indicated | — | Data platform modernization (BigQuery) |
| Purvi Shah | VP, Enterprise Data Platforms (Secondhand) | L3 | TECH | EVAL | Assumed | — | Likely technical lead for BigQuery migration |
| Gleb Reznik | CISO (Secondhand) | L1–L2 | INFOSEC | DM | Indicated | Yes | Gate for agents with repo access |
| Fred Gibbins | EVP, outgoing CISO (Confirmed) | L1–L2 | COACH | — | Assumed | — | Retiring Oct 2026; deprioritize |
| Benjamin Cane | Distinguished Engineer (Confirmed) | L3 (IC) | TECH | COACH | Indicated | — | Payments network modernization voice |
| Gurpreet Singh | Staff Engineer (Confirmed) | L5 (IC) | EVAL | TECH | Indicated | — | Cloud-native platform (Istio/Kubernetes) |
| Sibish Basheer | Senior Staff Software Engineer (Confirmed) | L5 (IC) | TECH | COACH | Indicated | — | Authored agentic execution-guardrails post |
| Mukund Shankar / Sunny Hirani | VP Engineering / Engineering Director, ACE Developer Kit (Secondhand) | L3 / L4 | COACH | CH (potential), TECH | Assumed | — | Agentic commerce dev tooling (adjacent) |
| Nikolas Ioannou / Marc Baghadjian | Hyper co-founders; AmEx titles unknown (Secondhand) | L3–L4 (assumed) | COACH | CH (potential) | Assumed | — | Fintech-native engineering inside GCS |
| Christophe Le Caillec | CFO (Confirmed) | L1 | FIN | EB (strategic only) | Assumed | Yes (budget) | Only for very large commitments |
| Miguel Gonzalez | SVP, Chief Procurement Officer (Unverified) | L1–L2 | PROC | — | Assumed | Yes | Commercial escalation path |
| Laureen Seeger | Chief Legal Officer (Unverified) | L1 | LEGAL | — | Assumed | Yes | Escalation-level legal |
| David Nigro / Doug Tabish | Risk leadership (Conflicting) | L1 | DM (risk gate) | INFOSEC | Assumed | Yes | Confirm current CRO before outreach |
| Gina Taylor | EVP, Project Guardian Program Office (Unverified) | L1–L2 | BS | DM | Assumed | — | Remediation engineering demand |
| Raymond Joabar / Anna Marrs | Group Presidents (Confirmed) | L1 | BS | — | Assumed | — | BU sponsors for GCS/Servicing and GMNS |
| Anthony Devane | EVP, Global Servicing Strategy & Enablement (Secondhand) | L1–L2 | BS | — | Assumed | — | Servicing AI outcomes (adjacent) |
| Monique Herena | Chief Colleague Experience Officer (Unverified) | L1 | COACH | BS (AI fluency) | Assumed | — | Workforce AI fluency |
| Google Cloud / Wipro / EY / Anthropic / OpenAI account teams on AmEx | Names unknown (Gap) | — | PARTNER | COACH | — | — | BigQuery program; marketplaces; GSI delivery |

**Persona coverage gaps for AmEx (highest priority first):**
1. Head of Developer Experience / Platform Development (DM, possibly EB for dev tooling).
2. ETS Technology Finance lead (FIN).
3. Technology category lead in Global Supply Management (PROC).
4. Head of Model Risk Management and VP Responsible AI incumbent (INFOSEC/gate).
5. Head of AppSec/DevSecOps under the CISO (INFOSEC, potential Security Review buyer).
6. Technology transactions counsel (LEGAL).
7. Partner account leads (PARTNER).
8. Chief of Staff to the CIO (COACH).

---

## 14. Crosswalk from Earlier Buying-Role Labels

The AmEx Key Contacts file used a slightly different taxonomy. Map it as follows:

| Key Contacts label | This KB persona(s) | Notes |
|---|---|---|
| Economic Buyer | EB | Same |
| Executive Sponsor | BS (+ DM if governance owner) | |
| Champion | CH (potential) | Downgrade to `potential` until validated |
| Technical Evaluator | TECH and/or EVAL | TECH if authority; EVAL if hands-on |
| Project Buyer | DM + BS (+ EB for BU scope) | Typically Unit CIOs / program owners |
| Gatekeeper | INFOSEC / PROC / LEGAL / DM (risk) + `can_veto` | Split by function |
| Indirect Beneficiary | BS (low weight) or COACH | |
| Technical Influencer | TECH + COACH | |

---

## 15. Caveats

- **Weights, scores, deal-size thresholds and EB heuristics are Inference.** Calibrate them against Factory's closed-won data and the account's actual approval thresholds, which only the champion or Finance can confirm.
- **"Technical" and "Evaluator" are kept separate** (authority vs hands-on activity). If your CRM uses a single "Technical Evaluator" field, map both TECH and EVAL to it.
- **AI governance and model risk are mapped to INFOSEC** when the review is about controls, and to LEGAL when it is about regulation or contracts. Some organizations route these through the CRO; check the customer's actual process.
- **Factory capability statements** come from the Factory Knowledge Base (verified Oct 12, 2026). Several are [Vendor] claims or still maturing (Factory Private in Private Preview; FedRAMP in progress; SOC 2 type to confirm). Don't overstate them to INFOSEC, LEGAL or PROC.
- **AmEx contact titles** inherit the confidence of the Key Contacts file. Several are Unverified or conflicting; re-verify before outreach.
- **Buying-committee benchmarks** vary by source and methodology. Use them as directional only.

## 16. Sources

**Project files:**
- Factory - Knowledge Base.md (project file; verified Oct 12, 2026)
- AmEx - Key Contacts.md (project file; Oct 12, 2026)
- AmEx - Orgs (project chat)

**Sales methodology and buying committees:**
- [Zapier – What is MEDDPICC](https://zapier.com/blog/meddpicc/)
- [topo.io – MEDDICC glossary](https://www.topo.io/glossary/meddicc)
- [tl;dv – MEDDPICC sales methodology](https://tldv.io/blog/meddpicc-sales-methodology/)
- [a79 – What is MEDDPICC](https://www.a79.ai/resources/what-is-meddpicc)
- [inblog – Buying Committee glossary (Gartner, Forrester figures)](https://inblog.ai/glossary/buying-committee)
- [Komo – Buying committee (Forrester 2026 State of Business Buying)](https://komo.ai/glossary/buying-committee)
- [Instantly – Enterprise buying committee benchmarks 2026](https://instantly.ai/blog/decision-maker-benchmarks-enterprise-buying-committee-size/)

**Title hierarchies:**
- [PrepLounge – Roles and seniority at bulge bracket banks](https://www.preplounge.com/finance-forum/roles-and-seniority-at-bulge-bracket-banks-22272)
- [Corporate Finance Institute – Typical hierarchy of investment banks](https://corporatefinanceinstitute.com/resources/career/typical-hierarchy-investment-banks)
- [JRG Partners – Managing Director vs Vice President](https://www.jrgpartners.com/?p=80703)

**AmEx evidence (via Key Contacts file):**
- [AmEx IR – Executive Committee](https://ir.americanexpress.com/governance-and-corporate-responsibility/executive-committee-and-directors/default.aspx)
- [americanexpress.io – Reimagining Software Delivery with AI](https://americanexpress.io/reimagining-software-delivery-with-ai/)
- [SecurityWeek – Industry Moves, Mar 16, 2026](https://www.securityweek.com/industry-moves/mar-16-2026/)
