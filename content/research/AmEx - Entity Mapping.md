# Context: prompt used to generate this file

## Original request (from the user)

```
Research American Express and all its related entities. I want the following:

* All American Express related entities mapped to each other to know who they're related (parents, subs, standalone, etc...)
* For each entity, provide a summary of how they are related and any significance found to that relationship
* How does each entity contribute towards overall revenue?
* How many employees are in each entity?
* Describe what each entity is and what it does/offers/etc...

Sources:

* Search far and wide to get a complete understanding of the giant that is american express, how it's structured, how it operates, etc...
   * Use sources like (but not limited to):
      * 10K, Investor relations, investor day presentations, web announcements, official sites, articles, etc...

Purpose:
As a strategic enterprise seller where AMEX is a greenfield account where I get to sell into AMEX and all it's related organizations, I need to know everything about how the company is structured to ultimately help me navigate a massive enterprise account like this.

Format:

* Provide inline sources/links where appropriate to check the source and get more information if desired.
* Structure the output as a markdown file in the most efficient way to help AI agents reason against this information.
```

Seller context (project): Strategic Enterprise seller for Factory (factory.ai); sole account is American Express in its entirety; greenfield.

## Research-agent prompt (verbatim, as executed on October 12, 2026)

```
Research American Express (American Express Company, NYSE: AXP) and ALL of its related entities to build a complete organizational/entity map. Current date: October 12, 2026 — use the most recent available data (latest 10-K for FY2025, 2026 10-Qs, latest investor day materials, recent announcements).

USER CONTEXT / PURPOSE: The user is a 10+ year strategic enterprise seller in the data/analytics space. American Express is a greenfield account; they can sell into AMEX and all its related organizations. They need to understand how the company is structured to navigate a massive enterprise account (who owns what, where budgets and decision-making likely sit, which entities are material). Be direct, compressed, high-signal — every sentence should earn its place. Follow the Google developer documentation style guide for tone and writing (clear, second person where appropriate, active voice, concise, sentence-case headings).

REQUIRED OUTPUT:
1. Map ALL American Express related entities to each other — parent, subsidiaries (direct and indirect), bank subsidiaries (e.g., American Express National Bank), international operating entities (e.g., American Express Europe S.A., American Express Services Europe Ltd, Amex entities in Canada, Australia, Japan, Mexico, India, UK, etc.), joint ventures, minority stakes/equity investments, affiliates, licensees/GNS partner relationships where relevant, standalone/spun-off or former entities with ongoing relationships (e.g., American Express Global Business Travel / Amex GBT — now separately public as GBTG; Ameriprise Financial spin-off history; Amex Travel), acquisitions (e.g., Resy, Tock, Kabbage/American Express Business Blueprint, Nipendo, Accertify (divested?), Center, Rocketplace, etc.), venture arm (Amex Ventures), foundation (American Express Foundation), Loyalty/Membership Rewards entities, Credit Co (American Express Credit Corporation), Travel Related Services Company (TRS), China JV (Express (Hangzhou) Technology Services / Lianlian JV), and any others. Use Exhibit 21 of the latest 10-K (list of subsidiaries) as a primary source and verify current status of each entity (active, divested, merged, renamed).
2. For each entity: summary of how it is related (ownership %, legal relationship, reporting segment it rolls up to) and the significance of that relationship (strategic, regulatory, financial, operational).
3. For each entity: contribution to overall revenue — use reportable segment data (e.g., U.S. Consumer Services, Commercial Services, International Card Services, Global Merchant and Network Services — confirm current segment names and figures), regional/geographic revenue breakdowns, revenue by type (discount revenue, net card fees, net interest income, service fees, etc.), and any entity-level disclosures (e.g., bank subsidiary call reports/FFIEC data for American Express National Bank, Amex GBT's own public financials). Where entity-level revenue isn't disclosed, state that clearly and give the best available proxy with reasoning.
4. For each entity: employee headcount — total company employees from 10-K, breakdowns by region/segment where disclosed, and entity-level headcount from sources like annual reports of foreign subsidiaries (e.g., UK Companies House filings, European entity annual reports), LinkedIn estimates, or press. Clearly label confidence level (reported vs. estimated).
5. For each entity: describe what it is and what it does/offers (products, services, customers, geographies).

Also include, where helpful for an enterprise seller: key executive leadership per segment/entity, technology/data organization structure (CIO/CTO, data & analytics leadership, Amex technology hubs e.g., India/Phoenix/etc.), major operating locations, and recent strategic initiatives from investor day (e.g., 2024/2025/2026 investor day) relevant to data/analytics/tech spend.

SOURCES: Search far and wide — 10-K and 10-Q filings (SEC EDGAR, especially Exhibit 21), investor relations site (ir.americanexpress.com), investor day presentations, earnings call transcripts, proxy statements, official company websites, press releases/web announcements, foreign regulatory filings (UK Companies House, ECB/Belgian NBB for American Express Europe, etc.), FFIEC/FDIC data for the bank, Amex GBT SEC filings, and reputable news articles. Note discrepancies between sources.

FORMAT: Structure the output as a markdown file optimized for AI agents to reason against: consistent per-entity schema (e.g., Entity name, Legal name, Type, Parent, Ownership %, Segment, Jurisdiction, Status, Relationship & significance, What it does, Revenue contribution, Employees (with confidence), Key leaders, Sources), a hierarchy/tree view of the entity map at the top, summary tables for revenue by segment and headcount, explicit "not disclosed" markers rather than omissions, and inline source links for every factual claim so the user can verify and learn more.
```

> **Agent note:** The research-agent prompt framed the seller as being "in the data/analytics space." That framing is not from the user. Factory sells AI software-development agents, so weight engineering/developer-productivity buyers (CIO org, technology teams, ~11,000 engineers using AI tools) above the data-governance angle in the Recommendations section.

---

# Output

# American Express entity map for enterprise sellers (as of October 12, 2026)

American Express is one bank holding company, American Express Company (AXP). Almost all of its operations, data and spend run through one principal operating subsidiary, American Express Travel Related Services Company, Inc. (TRS). Budgets are allocated by four reportable segments, not by legal entity. Treat the 100+ legal entities as regulatory and tax wrappers, and sell to the segment and enterprise-technology owners.

## TL;DR

- **Where the money is:** AXP earned $72.2B in revenue (net of interest expense) in FY2025. U.S. Consumer Services (USCS) produced $34.8B of it, Commercial Services (CS) $16.9B, International Card Services (ICS) $13.0B and Global Merchant and Network Services (GMNS) $7.8B. AXP had about 76,800 employees, about 50,900 of them outside the U.S.
- **Where decisions sit:** Technology, data and AI are centralized under CIO Ravi Radhakrishnan, whose remit now includes enterprise data platforms and the Chief Data Office. Chief Data Officer Chris Gifford took the role in September 2025. Segment presidents own product and P&L demand. American Express National Bank (AENB, about $218B in assets) is the regulated U.S. bank. It is the most material legal entity and drives risk, compliance and data-governance requirements.
- **What changed in 2025–2026:** Center (expense software) closed in April 2025. Hyper (agentic AI expense tools) was announced in April 2026, and the $700M TheFork deal in June 2026 (still pending). The sale of AXP's roughly 30% stake in Amex GBT closed on September 29, 2026, so GBTG is now only a brand licensee. Commercial expense-management software, AI and agentic commerce are the active budget lines.

## Key findings

- **Treat it as one account.** TRS is the principal operating subsidiary. The Company and TRS are both bank holding companies and financial holding companies supervised by the Federal Reserve. AENB is regulated by the OCC. Most U.S. vendor contracting, data platforms and technology run through TRS and enterprise functions, not through the 100+ Exhibit 21 entities. ([FY2025 10-K](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231.htm))
- **Segment economics decide priorities.** In FY2025, USCS earned 48% of revenue and $6.8B of pretax income. ICS is the fastest-growing segment: billed business grew 13% in Q2 2026 and ICS pretax income rose 55% in FY2025. GMNS has the highest margin (about 51% pretax). ([Q4 2025 earnings release](https://www.sec.gov/Archives/edgar/data/4962/000000496226000037/q425exhibit991.htm), [Q2 2026 earnings release](https://www.sec.gov/Archives/edgar/data/4962/000000496226000318/q226exhibit991.htm))
- **Regulation shapes data spend.** AXP has been a Category III firm since 2024. Cross-jurisdictional activity was $76B at year-end 2025 (four-quarter average $73B). If the average reaches $75B, AXP becomes a Category II firm, which brings advanced-approaches capital, daily liquidity reporting and annual stress tests. Expect sustained spending on risk, regulatory reporting and data lineage. ([FY2025 10-K](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231.htm))
- **Most international entities don't publish revenue.** The best public proxies are UK Companies House accounts, the Spanish bank's non-financial statement, the EU country-by-country tax report and Canadian public accountability statements. Figures are below.
- **Watch for inaccurate secondary sources.** Wikipedia still shows a 33.54% Amex stake in GBT; that is stale. One M&A site says TheFork deal "acquired"; it hasn't closed. One article says 29,500 U.S. employees; the 10-K says 25,900.

## Entity hierarchy (simplified tree)

Based on the FY2025 10-K [Exhibit 21](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231exx21.htm) (subsidiaries as of December 31, 2025), updated for 2026 events. An asterisk (*) means AXP does not own all of the voting securities (a JV or partly owned entity).

```
American Express Company (NY; NYSE: AXP; BHC/FHC; HQ 200 Vesey St, New York)
├── 56th Street AXP Campus LLC (AZ) – real estate (Phoenix campus)
├── American Express Banking Corp. (NY) – international banking entity (e.g., India branch)
├── American Express Travel Related Services Company, Inc. (TRS, NY) – principal operating sub; BHC
│   ├── American Express National Bank (AENB; OCC; Sandy, UT) – U.S. bank: cards, deposits, lending
│   │   └── American Express Receivables Financing Corp. III LLC – securitization
│   ├── American Express Credit Corporation (Credco, DE) – receivables funding
│   │   ├── American Express Credit Mexico, LLC; American Express Netherlands B.V.
│   │   ├── American Express Overseas Credit Corp. Ltd (Jersey) → AEOCC Funding Australia; AEOCC Mgmt; AEOCC N.V.
│   │   └── Credco Receivables Corp.
│   ├── AE Innovation Labs Holdings, LLC → American Express Innovation Laboratories Ltd (Ireland)
│   ├── American Express Company (Mexico) S.A. de C.V. → insurance agency (Mexico)
│   ├── American Express Limited (DE) → Malaysia; European Holdings B.V.; Holdings G.K. (Japan);
│   │   American Express International, Inc. → AE Exposure Mgmt (Jersey); American Express (India) Pvt Ltd
│   │   → American Express Business Solutions (India) Pvt Ltd; Thailand; Asia Network Consulting (Beijing)
│   ├── American Express Australia Limited (Victoria)
│   ├── UK/Europe chain: American Express Holdings 2 Ltd → American Express Holdings Ltd →
│   │   American Express Services Europe Ltd (AESEL, UK) → American Express Europe, S.A. (Spain, EEA bank);
│   │   American Express de España; Amex Asesores de Seguros; American Express Italia S.r.l.
│   ├── American Express Group Services Ltd (UK) – intra-group services
│   ├── American Express Payment Services Ltd (AEPSL, UK) → American Express Payments Europe, S.L. (Spain)
│   ├── American Express International Holdings, LLC → Argentina; Holdings (France) SAS → American Express
│   │   France SAS → Canada Holdings B.V. → Amex Canada Inc.; Amex Agenzia Assicurativa; Carte-France
│   ├── American Express Japan Co., Ltd.; Services India Pvt Ltd; spol. s r.o. (Czech); TLS HK Ltd
│   ├── American Express Swiss Holdings GmbH → Swisscard AECS GmbH*
│   ├── Amex Funding Mgmt Holdings (Jersey) → Amex (Middle East) B.S.C.* → Saudi Arabia*, Oman*, Qatar*, Egypt*
│   ├── Loyalty Partner GmbH (Germany) → Loyalty Partner Holdings B.V.; Payback GmbH; PAYBACK Italia;
│   │   Loyalty Partner Polska; PAYBACK Austria; Loyalty Partner Solutions GmbH; Pocket Concierge (Japan)
│   ├── American Express Netherlands Holdings B.V. → Brasil Assessoria; Nigeria Ltd; PT American Express Indonesia
│   ├── Amex Bank of Canada (Ontario)
│   ├── American Express Kabbage Inc. → Kabbage Payments, LLC
│   ├── Center ID Corp. → Touchstone ID Corp. (BC, Canada)
│   ├── Resy Network, Inc. → Rooam, Inc.;  Tock LLC;  LoungeBuddy, Inc.;  Mez Mobile, Inc.
│   ├── Express (Hangzhou) Technology Service Co., Ltd.* (China JV with LianLian DigiTech)
│   ├── American Express Prepaid Card Mgmt Corp.; Marketing & Development Corp.; Amex Services, Inc.
│   ├── Receivables Financing Corp. II and VIII LLC; AXP Insurance Master Trust; Cavendish Holdings
│   ├── Asesorías e Inversiones American Express Chile; Travellers Cheque Associates Ltd (UK)
├── AMEX Assurance Company (IL) → AAC Statutory Trust – insurance
├── Amexco Insurance Company (VT) – captive insurer
└── Rexport, Inc. (DE)

Pending / recent (not in FY2025 Ex. 21): Hyper (Hypercard) – announced Apr 2026; TheFork – pending, $700M.
Former: Global Business Travel Group (stake sold, closed Sep 29, 2026); Accertify (sold 2024);
American Express Bank (Mexico) and American Express Bank LLC (Russia) – in the 2022 Ex. 21, gone by 2023.
```

## Revenue summary

### By reportable segment (total revenues net of interest expense, $M)

| Segment | FY2024 | FY2025 | FY2025 share | FY2025 pretax income | Q2 2026 revenue | Q2 2026 pretax |
|---|---|---|---|---|---|---|
| U.S. Consumer Services (USCS) | 31,427 | 34,814 | 48% | 6,810 | 9,524 | 2,065 |
| Commercial Services (CS) | 15,859 | 16,926 | 23% | 3,668 | 4,503 | 970 |
| International Card Services (ICS) | 11,461 | 13,000 | 18% | 1,603 | 3,619 | 477 |
| Global Merchant and Network Services (GMNS) | 7,484 | 7,759 | 11% | 3,968 (derived) | Not disclosed in the sources reviewed | 1,128 |
| Corporate & Other | (282) derived | (270) derived | — | (2,254) derived | — | (569) |
| **Consolidated** | **65,949** | **72,229** | 100% | **13,795** | **19,637** | **4,071** |

Sources: [Q4 2025 earnings tables](https://s26.q4cdn.com/747928648/files/doc_earnings/2025/q4/supplemental-info/Q4-2025-Earnings-Tables.pdf), [Q2 2026 earnings release](https://www.sec.gov/Archives/edgar/data/4962/000000496226000318/q226exhibit991.htm), [Q1 2025 earnings release](https://www.sec.gov/Archives/edgar/data/4962/000000496225000034/q125exhibit991.htm).

Derived values come from subtraction or summing quarters. FY2025 GMNS pretax income adds four quarters: Q1 $990M, Q2 $1,054M, Q3 $1,040M and Q4 $884M. Segment revenue is set by internal transfer pricing. Discount revenue is split between issuer segments and GMNS, which takes the network and acquirer share.

### By revenue type (FY2025, $M)

| Line | FY2025 | YoY | Note |
|---|---|---|---|
| Discount revenue | 37,401 | +6% | Largest line; driven by merchant fees on spend |
| Net card fees | 9,993 | +18% | Premium fee cards; Q2 2026 $2,862M, +15% |
| Service fees and other | 7,471 | +10% | Includes travel, FX and loyalty-coalition fees |
| Net interest income | 17,364 | +12% | Revolving loans; Q2 2026 $4,649M, +11% |
| **Total** | **72,229** | **+10%** | 2026 guidance: 9–10% growth and EPS $17.30–$17.90 (Squeri, Q4 2025 call, January 30, 2026); revenue guidance raised to 10% in July 2026 |

**Geography:** About $56.0B of FY2025 revenue (roughly 78%) came from the United States (third-party aggregation of 10-K geographic data; [StockAnalysis](https://stockanalysis.com/stocks/axp/financials/metrics/)). Large non-U.S. markets by billed business are the UK, the EU, Australia, Japan, Canada and Mexico.

**Scale:** $1,670B billed business on 86.6M proprietary cards, plus $227.2B processed volume on 66.2M cards issued by third parties. Total assets were $300.1B at year-end 2025 and $308.2B at June 30, 2026. U.S. deposits were $157.0B at June 30, 2026. ([FY2025 10-K](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231.htm), [Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/0000004962/000000496226000322/axp-20260630.htm))

**Next print:** Q3 2026 results are due on October 23, 2026 ([AXP IR](https://ir.americanexpress.com/news/investor-relations-news/investor-relations-news-details/2026/American-Express-Plans-Live-Audio-Webcast-of-Third-Quarter-2026-Earnings-Conference-Call/default.aspx)). They should include the roughly $975M pre-tax gain on GBTG. Consensus revenue is about $20.1B (an analyst estimate, not reported; [MarketBeat](https://www.marketbeat.com/earnings/reports/2026-10-23-american-express-stock/)).

## Headcount summary

| Scope | Employees | Confidence | Basis |
|---|---|---|---|
| AXP total | ~76,800 (12/31/2025) | Reported | [FY2025 10-K](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231.htm) |
| United States | ~25,900 | Reported | FY2025 10-K |
| Outside U.S. | ~50,900 | Reported | FY2025 10-K |
| By segment | Not disclosed | — | AXP does not report headcount by segment |
| American Express Europe, S.A. (Spain + EMEA branches) | 1,795 (2025) | Reported | [2025 EINF](https://www.americanexpress.com/content/dam/amex/es/beneficios/EINF_AEESA_2025.pdf) |
| All Amex entities, Spain | 1,353 | Reported (tax) | [EU country-by-country report](https://www.americanexpress.com/content/dam/amex/es/beneficios/AmericanExpress_PCbCR_Spanish.pdf) |
| All Amex entities: Italy / France / Germany / Sweden / NL / Austria | 1,233 / 761 / 525 / 220 / 203 / 120 | Reported (tax) | EU country-by-country report |
| Amex Canada Inc. | 969 | Reported | [2025 Public Accountability Statement](https://www.americanexpress.com/content/dam/amex/en-ca/company/about-american-express/amexbankofcanada-2025-public-accountability-statement-en.pdf) |
| Amex Bank of Canada | ~680 | Reported (table partly garbled; check source) | 2025 Public Accountability Statement |
| AESEL (UK) | ~4,234 | Estimate | [Bloomberg profile](https://www.bloomberg.com/profile/company/1487906Z:LN), period unknown |
| American Express Payments Europe, S.L. | 585 (2025) | Estimate | [Empresite](https://empresite.eleconomista.es/AMERICAN-EXPRESS-PAYMENTS-EUROPE.html) |
| American Express Australia Ltd (incl. subsidiaries) | ~1,200 (2024) | Estimate | [IBISWorld](https://www.ibisworld.com/australia/company/american-express-australia-limited/11420/) |
| India (all entities) | Not disclosed | — | Gurugram campus (~1M sq ft) suggests a large share of the 50,900 non-U.S. staff ([Business Standard](https://www.business-standard.com/companies/news/american-express-opens-its-largest-campus-worldwide-in-gurugram-india-124050200575_1.html)) |
| GBTG (former affiliate) | 27,000+ (12/31/2025) | Reported | [GBTG FY2025 10-K](https://www.sec.gov/Archives/edgar/data/1820872/000162828026015817/gbtg-20251231.htm) |

## Entity profiles

Every profile uses the same fields. "Not disclosed" means no public figure was found.

### American Express Company (parent)
- **Legal name / type:** American Express Company; NY corporation; bank holding company and financial holding company
- **Parent / ownership:** Public company, NYSE: AXP. Berkshire Hathaway has a restated letter agreement with AXP (2019, Exhibit 10.25).
- **Segment:** All segments; Corporate & Other holds enterprise functions
- **Jurisdiction / status:** New York; active; HQ at 200 Vesey Street, New York
- **Relationship & significance:** Top holding company. It is a Category III firm subject to Federal Reserve CCAR (stress capital buffer 2.5%) and acts as source of strength for AENB. Board-level risk, capital and resolution planning sit here.
- **What it does:** Global payments and "premium lifestyle brand." It issues cards, acquires merchants and runs its own card network.
- **Revenue:** $72.2B (FY2025); net income $10.8B; H1 2026 revenue $38.5B
- **Employees:** ~76,800 (reported)
- **Key leaders:** Stephen Squeri (Chairman & CEO); Christophe Le Caillec (CFO); Douglas Buckminster (Vice Chairman); Laureen Seeger (Chief Legal Officer); Douglas Tabish (Chief Risk Officer); Elizabeth Rutledge (CMO); Glenda McNeal (Chief Partner Officer); Monique Herena (Chief Colleague Experience Officer); Jennifer Skyler (Chief Corporate Affairs Officer)
- **Sources:** [FY2025 10-K](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231.htm); [Q4 2025 earnings release](https://www.sec.gov/Archives/edgar/data/4962/000000496226000037/q425exhibit991.htm); [Q2 2026 earnings release](https://www.sec.gov/Archives/edgar/data/4962/000000496226000318/q226exhibit991.htm); [2026 proxy](https://www.stocktitan.net/sec-filings/AXP/def-14a-american-express-co-definitive-proxy-statement-802290e878de.html)

### American Express Travel Related Services Company, Inc. (TRS)
- **Type:** Principal operating subsidiary; bank holding company and financial holding company
- **Parent / ownership:** American Express Company, 100%
- **Segment:** All four segments
- **Jurisdiction / status:** New York; active
- **Relationship & significance:** Owns AENB and almost every operating subsidiary. It is supervised by the Federal Reserve. Travel-agency, insurance-agency and "finder" activities run here under financial holding company powers. This is the most likely contracting entity for enterprise vendors (inference).
- **What it does:** Card issuing, travel and lifestyle services (Amex Travel, Fine Hotels + Resorts), Membership Rewards and merchant services
- **Revenue:** Not separately disclosed. Proxy: essentially all consolidated revenue.
- **Employees:** Not disclosed
- **Sources:** [FY2025 10-K](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231.htm) (Business; Supervision and Regulation); [Exhibit 21](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231exx21.htm)

### American Express National Bank (AENB)
- **Type:** National bank (FDIC cert. 27471); regulated by the OCC, with the FDIC and CFPB
- **Parent / ownership:** TRS, 100%
- **Segment:** Mostly USCS and CS (U.S. card loans, deposits)
- **Jurisdiction / status:** U.S. federal charter; main office in Sandy, Utah; active; founded 1989
- **Relationship & significance:** AXP's only U.S. depository institution. It funds the business through about $157B of U.S. deposits. It must file its own FDIC resolution plan (due by July 1, 2026). AENB dividends to TRS need OCC approval in some cases. Transactions with affiliates are restricted. Q2 2026 capital: CET1 10.9%, Tier 1 10.9%, Total 13.0%, Tier 1 leverage 8.8%.
- **What it does:** U.S. consumer and small-business card issuing, high-yield savings, CDs, checking, personal and business loans
- **Revenue:** Call report Q1 2026 (year to date): total interest income $6.07B, noninterest income $7.76B, interest expense $1.62B, net income $2.00B. Total assets $217.6B; deposits $174.0B; equity $19.0B; net loans $163.1B. FY2025 net income about $8.0B (third-party summary of call reports). Estimate: AENB produces roughly 60–65% of consolidated net revenue. This is inferred by comparing Q1 2026 call report income with consolidated revenue of $18.9B, which ignores intercompany flows.
- **Employees:** Not disclosed in the sources reviewed
- **Key leaders:** Not disclosed in the sources reviewed
- **Sources:** [FY2025 10-K](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231.htm); [Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/0000004962/000000496226000322/axp-20260630.htm); call report summaries via [ibanknet](https://www.ibanknet.com/scripts/callreports/getbank.aspx?ibnid=usa_1394676), [usbanklocations](https://www.usbanklocations.com/american-express-national-bank.shtml), [bestcashcow](https://www.bestcashcow.com/banks/american-express-national-bank-27471)

### American Express Credit Corporation (Credco)
- **Type:** Finance subsidiary
- **Parent / ownership:** TRS, 100%
- **Segment:** Funding for the card segments (treasury)
- **Jurisdiction / status:** Delaware; active
- **Relationship & significance:** Funds card member receivables through Jersey, Netherlands, Mexico and Australia subsidiaries (AEOCC). It matters to treasury, liquidity and FX-risk buyers.
- **What it does:** Buys and finances card member receivables
- **Revenue / employees:** Not disclosed
- **Sources:** [Exhibit 21](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231exx21.htm)

### American Express Banking Corp. (AEBC)
- **Type:** New York-chartered banking entity; operates international branches, including India
- **Parent / ownership:** American Express Company, 100% (direct)
- **Segment:** ICS and GMNS (India)
- **Jurisdiction / status:** New York; active
- **Relationship & significance:** The RBI barred AEBC from onboarding new card customers in India in 2021 for breaching data-localization rules. The restriction was lifted in 2022 after significant investment in technology and infrastructure. Local data-residency demands are a live buying trigger.
- **What it does:** Card issuing and network operations in India through its India branch. The branch's FY2025-26 accounts were audited by Price Waterhouse LLP.
- **Revenue:** India branch total income is in the published FY2025-26 accounts but was not extracted.
- **Employees:** Not disclosed
- **Sources:** [FY2025 10-K](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231.htm) (Payments Regulation); [AEBC India branch financial disclosures FY2025-26](https://www.americanexpress.com/content/dam/amex/in/legal/Financial-disclosures/FY2025_2026.pdf)

### American Express Services Europe Limited (AESEL)
- **Type:** UK operating company
- **Parent / ownership:** American Express Holdings Limited (UK), 100% indirect
- **Segment:** ICS and GMNS (UK and Europe)
- **Jurisdiction / status:** England & Wales (company no. 01833139); active; latest accounts made up to December 31, 2025
- **Relationship & significance:** Main UK operating entity and parent of American Express Europe, S.A. and the Spanish and Italian entities. It is subject to the FCA Consumer Duty.
- **What it does:** UK card issuing and servicing, and merchant services
- **Revenue:** FY2023 turnover £2,070.6M (FY2022 £1,694.5M, +22%); pretax profit £45.8M. FY2025 accounts are filed but were not retrieved.
- **Employees:** ~4,234 (estimate; Bloomberg)
- **Sources:** [AESEL 2023 financial statements](https://www.americanexpress.com/content/dam/amex/uk/company/legal/aesel-2023-financial-statement.pdf); [Companies House](https://find-and-update.company-information.service.gov.uk/company/01833139)

### American Express Europe, S.A. (AEESA)
- **Type:** Spanish bank, the post-Brexit EEA licensed entity
- **Parent / ownership:** AESEL, 100% indirect
- **Segment:** ICS and GMNS (EEA)
- **Jurisdiction / status:** Spain (Madrid); active; branches across the EEA
- **Relationship & significance:** Holds AXP's EEA banking and payments passport and is subject to EU DORA, the EU AI Act and GDPR. AXP left its network business in the EU because of interchange regulation. EU cobrand deals such as KLM face a CJEU interchange-cap ruling.
- **What it does:** Card issuing and merchant acquiring across the EEA (Germany, France, Italy, Netherlands, Sweden, Austria, Spain and others)
- **Revenue:** Entity revenue not disclosed in the sources reviewed (registries show turnover above €50M only). Country proxy, all Amex entities, 2025 (USD): Spain $1.71B, Germany $1.54B, France $838M, Italy $794M, Netherlands $355M, Sweden $113M, Austria $101M.
- **Employees:** 1,795 (2025, reported)
- **Sources:** [AEESA 2025 EINF](https://www.americanexpress.com/content/dam/amex/es/beneficios/EINF_AEESA_2025.pdf); [EU public country-by-country report](https://www.americanexpress.com/content/dam/amex/es/beneficios/AmericanExpress_PCbCR_Spanish.pdf); [infoempresa](https://www.infoempresa.com/en-in/es/company/american-express-europe-sa)

### American Express Payment Services Limited (AEPSL)
- **Type:** UK payment institution
- **Parent / ownership:** TRS chain, 100%
- **Segment:** GMNS
- **Jurisdiction / status:** England & Wales (company no. 06301718); active
- **Relationship & significance:** UK and European merchant acquiring. It owns American Express Payments Europe, S.L. (Spain).
- **What it does:** Merchant acquiring and payment processing
- **Revenue:** FY2025 turnover £1,318.4M (FY2024 £1,205.4M, +10%); pretax profit £62M (FY2024 £75M)
- **Employees:** Not disclosed. American Express Payments Europe, S.L.: 585 (estimate)
- **Sources:** [AEPSL 2025 financial statements](https://www.americanexpress.com/content/dam/amex/uk/company/legal/aepsl-2025-financial-statement.pdf) (approved June 30, 2026); [Empresite](https://empresite.eleconomista.es/AMERICAN-EXPRESS-PAYMENTS-EUROPE.html)

### American Express Group Services Limited (AEGSL)
- **Type:** UK shared-services company
- **Parent / ownership:** TRS chain, 100%
- **Segment:** Corporate & Other
- **Status:** Active (company no. 06613927)
- **What it does:** Provides services to other group companies, including Network and Acquirer Solutions staff
- **Revenue:** FY2025 turnover £87.9M (FY2024 £78.4M), all intra-group
- **Employees:** Not disclosed in the sources reviewed (staff note in the accounts not extracted)
- **Sources:** [AEGSL 2025 financial statements](https://www.americanexpress.com/content/dam/amex/uk/company/legal/aegsl-2025-financial-statement.pdf)

### Amex Bank of Canada and Amex Canada Inc.
- **Type:** Federally regulated Canadian bank (OSFI) and an operating company
- **Parent / ownership:** Amex Bank of Canada is held directly under TRS. Amex Canada Inc. sits under American Express Canada Holdings B.V. (France chain). Both 100%.
- **Segment:** ICS and GMNS (Canada)
- **Jurisdiction / status:** Ontario; active
- **Relationship & significance:** Card issuing and acceptance in Canada, a key ICS market. Merchant surcharging is allowed outside Quebec.
- **Revenue:** Not disclosed in the sources reviewed (OSFI financial data not checked)
- **Employees:** Amex Canada Inc. 969; Amex Bank of Canada ~680 (reported, December 31, 2025)
- **Sources:** [2025 Public Accountability Statement](https://www.americanexpress.com/content/dam/amex/en-ca/company/about-american-express/amexbankofcanada-2025-public-accountability-statement-en.pdf)

### American Express Australia Limited
- **Type:** Operating company
- **Parent / ownership:** TRS chain, 100%
- **Segment:** ICS and GMNS
- **Jurisdiction / status:** Victoria, Australia; active
- **Relationship & significance:** Australia is a large billed-business market. AXP exited its network business there because of regulation, and the RBA proposed in July 2025 to remove surcharging on designated networks.
- **Revenue:** ~A$2.06B (2024, estimate; IBISWorld). No primary filing was retrieved.
- **Employees:** ~1,200 (2024, estimate; IBISWorld)
- **Sources:** [IBISWorld company profile](https://www.ibisworld.com/australia/company/american-express-australia-limited/11420/); [FY2025 10-K](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231.htm)

### Japan, Mexico, India and other international operating entities
- **Entities:** American Express Japan Co., Ltd. and American Express Holdings G.K. (Japan); American Express Company (Mexico) S.A. de C.V. plus an insurance agency; American Express (India) Pvt Ltd, American Express Business Solutions (India) Pvt Ltd and American Express Services India Pvt Ltd; plus Argentina, Brazil, Chile, Czech Republic, Hong Kong, Indonesia, Israel, Italy, Malaysia, Nigeria, Taiwan and Thailand.
- **Ownership:** 100% (no asterisk in Exhibit 21)
- **Segment:** ICS and GMNS. The India service entities also support enterprise operations and technology (inference from the campus footprint).
- **Significance:** Japan and Mexico are named as significant billed-business markets. In India, AXP has facilities in Gurugram, Delhi, Mumbai, Bengaluru, Chennai and Pune. The Gurugram campus (about 1M sq ft) is AXP's largest worldwide.
- **Revenue / employees:** Not disclosed
- **Status note:** American Express Bank (Mexico) was listed in the 2022 Exhibit 21 but not from 2023 onward. Treat the Mexican bank charter as no longer held (inferred from Exhibit 21).
- **Sources:** Exhibit 21 ([2022](https://www.sec.gov/Archives/edgar/data/4962/000000496223000006/axp-20221231exx21.htm), [2023](https://www.sec.gov/Archives/edgar/data/4962/000000496224000013/axp-20231231exx21.htm), [2025](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231exx21.htm)); [Business Standard](https://www.business-standard.com/companies/news/american-express-opens-its-largest-campus-worldwide-in-gurugram-india-124050200575_1.html) (Gurugram campus)

### Swisscard AECS GmbH*
- **Type:** Swiss card issuer, formerly a 50/50 JV with Credit Suisse
- **Parent / ownership:** American Express Swiss Holdings GmbH. AXP agreed in October 2024 to buy UBS's 50% stake. Swisscard is still marked * (not wholly owned) in the year-end 2025 Exhibit 21, so do not assume 100% ownership until closing is confirmed.
- **Segment:** ICS
- **Relationship & significance:** Issues Amex, Visa and Mastercard cards (more than 1.5M cards) and runs Amex acquiring in Switzerland. The Credit Suisse-branded portfolios moved to UBS in 2025.
- **Revenue / employees:** Not disclosed
- **Sources:** [FStech](https://www.fstech.co.uk/fst/Amex_acquires_50_stake_in_swisscard_from_ubs.php); [TradingView/Invezz](https://www.tradingview.com/news/invezz:79856ee8f094b:0-american-express-to-become-sole-owner-of-swisscard-as-ubs-sells-its-50-stake/); [Exhibit 21](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231exx21.htm)

### Middle East JVs*
- **Entities:** Amex (Middle East) B.S.C. (closed)*, which holds American Express Saudi Arabia*, Amex Al Omania*, AMEX (Middle East) QFC*, and Amex Egypt*
- **Ownership:** Partly owned; percentages and partners not disclosed in Exhibit 21
- **Segment:** ICS and GMNS
- **Significance:** Regional issuing and acceptance in the Gulf and Egypt. Governance is shared, so buying decisions likely involve local partners (inference).
- **Revenue / employees:** Not disclosed
- **Sources:** [Exhibit 21](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231exx21.htm)

### Express (Hangzhou) Technology Service Co., Ltd.* (China network JV)
- **Type:** Sino-foreign bankcard clearing JV with LianLian DigiTech (HKEX: 2598)
- **Parent / ownership:** Held under TRS; partly owned. The exact Amex percentage is not stated in Exhibit 21.
- **Segment:** GMNS
- **Jurisdiction / status:** Hangzhou, China; active. Licensed by the PBOC in 2020 as the first foreign network allowed to clear RMB transactions.
- **Relationship & significance:** Lets AXP clear Amex-branded card transactions inside mainland China. Data must stay in China, so global vendors face localization limits.
- **Revenue / employees:** Not disclosed
- **Key leaders:** Yamin Zhu (CEO and General Manager)
- **Sources:** [Finextra](https://www.finextra.com/pressarticle/82896/american-express-wins-network-clearing-licence-in-china); [PaymentsJournal](https://www.paymentsjournal.com/american-express-expands-further-in-china-through-alipay-alliance/); [AmCham Shanghai](https://amcham-shanghai.glueup.cn/event/amcham-shanghai-2025-weforshe-conference-47251/speakers.html); [Wikipedia: LianLian DigiTech](https://en.wikipedia.org/wiki/LianLian_DigiTech); [Exhibit 21](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231exx21.htm)

### Loyalty Partner GmbH / PAYBACK
- **Type:** Coalition loyalty operator
- **Parent / ownership:** Held in the American Express International, Inc. chain, 100%. Acquired in 2011 for €496M.
- **Segment:** ICS (Corporate & Other treatment not disclosed)
- **Jurisdiction / status:** Germany (Munich), with PAYBACK entities in Italy, Poland and Austria. Active. No evidence found of a sale.
- **Relationship & significance:** Runs the PAYBACK multi-retailer loyalty program, Germany's largest. Edeka joined as a partner in 2025. It co-issues the PAYBACK American Express card. It is a large consumer-data and analytics operation in its own right.
- **Revenue / employees:** Not disclosed
- **Sources:** [Exhibit 21](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231exx21.htm); [Horizont](https://www.horizont.net/marketing/nachrichten/-Bonussystem-American-Express-schluckt-Payback-97004); [Amex DE partner overview](https://www.americanexpress.com/de-de/amexcited/amexplained/partner-uebersicht-14119); a German blog ([uamr.de](https://www.uamr.de/wem-gehoert-payback/), low-quality source) reports that "Payback MAX" was renamed "Payback American Express PLUS" in August 2026 (unverified)

### Dining platform: Resy Network, Inc.; Tock LLC; Rooam, Inc.; pending TheFork
- **Type:** Wholly owned operating subsidiaries
- **Parent / ownership:** TRS, 100%. Rooam sits under Resy.
- **Segment:** USCS (the 10-K says USCS "manages our dining platform")
- **Status:** Resy (acquired 2019), Tock and Rooam are active. TheFork (Tripadvisor's European platform, $700M cash) was announced June 15, 2026 and is pending labor consultation and regulatory approvals. It is expected to close before the end of 2026 and will likely sit with ICS, since ICS President Rafael Marquez fronted the deal (inference).
- **Relationship & significance:** Restaurant booking and management software (SaaS) plus diner benefits. With TheFork's 50,000+ restaurants in 11 countries, AXP would have about 75,000 bookable venues. The platform produces restaurant data and is a merchant-facing software business.
- **Revenue / employees:** Not disclosed
- **Sources:** [FY2025 10-K](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231.htm); [Q2 2026 earnings release](https://www.sec.gov/Archives/edgar/data/4962/000000496226000318/q226exhibit991.htm); [Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/0000004962/000000496226000322/axp-20260630.htm); [PhocusWire](https://www.phocuswire.com/news/finance/tripadvisor-sell-thefork-american-express); [Yahoo Finance](https://finance.yahoo.com/markets/stocks/articles/american-express-expands-dining-ecosystem-061129805.html)

### Commercial software: Center ID Corp.; Hyper; American Express Kabbage Inc.
- **Type:** Wholly owned subsidiaries
- **Parent / ownership:** TRS, 100%. Touchstone ID Corp. (British Columbia) sits under Center.
- **Segment:** CS (Global Commercial Services, led by Raymond Joabar)
- **Status:** Center (Bellevue, WA) closed April 16, 2025; Bloomberg reported that terms weren't disclosed, and Business Travel News called $600 million a "rumored" price tag in line with Center's last funding-round valuation. Hyper (Hypercard) was announced April 16, 2026 with undisclosed terms and an expected Q2 2026 close; it is not yet in Exhibit 21. Kabbage (acquired 2020; Business Blueprint cash-flow tools) still has two entities in Exhibit 21. The current status of the Business Blueprint product was not verified.
- **Relationship & significance:** These form AXP's expense-management platform. It was piloted with middle-market customers in Q2 2026, with a full launch planned for late 2026. This is the highest-signal new software budget for data and analytics vendors.
- **Revenue / employees:** Not disclosed
- **Sources:** [Q3 2025 10-Q](https://www.sec.gov/Archives/edgar/data/4962/000000496225000222/axp-20250930.htm); [Quiver Quant](https://www.quiverquant.com/news/American+Express+Acquires+AI+Startup+Hyper+Backed+by+OpenAI+CEO+Sam+Altman); [The Paypers](https://thepaypers.com/mergers-aquisitions-and-investments/news/american-express-acquires-agentic-expense-management-company-hypercard); [Q2 2026 earnings release](https://www.sec.gov/Archives/edgar/data/4962/000000496226000318/q226exhibit991.htm)

### LoungeBuddy, Inc.; Mez Mobile, Inc.; Pocket Concierge Inc.
- **Type:** Small wholly owned subsidiaries
- **Segment:** USCS (travel and lifestyle); Pocket Concierge covers Japan dining
- **Relationship & significance:** Airport lounge and dining-access tools that support Card Member benefits
- **Revenue / employees:** Not disclosed
- **Sources:** [Exhibit 21](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231exx21.htm)

### Insurance entities: AMEX Assurance Company; Amexco Insurance Company; insurance agencies
- **Type:** Insurance underwriter (Illinois), captive (Vermont), and agencies in Mexico, Spain, Italy and Taiwan
- **Parent / ownership:** AMEX Assurance and Amexco Insurance are held directly by American Express Company, 100%
- **Segment:** Mostly USCS and ICS (card benefits such as travel insurance)
- **Significance:** Regulated under state and foreign insurance law. Travel-disruption claims are a stated risk.
- **Revenue / employees:** Not disclosed
- **Sources:** [Exhibit 21](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231exx21.htm); [FY2025 10-K](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231.htm)

### Funding and structural vehicles
- **Entities:** American Express Receivables Financing Corp. II, III and VIII; AXP Insurance Master Trust; AAC Statutory Trust; Credco Receivables Corp.; AE Exposure Management (Jersey); Amex Funding Management Holdings (Jersey); 56th Street AXP Campus LLC; Cavendish Holdings; Rexport; Travellers Cheque Associates Ltd; Prepaid Card Management Corp.
- **Significance:** Securitization, FX hedging, real estate and legacy products (Travelers Cheques, prepaid). These are not buying centers.
- **Sources:** [Exhibit 21](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231exx21.htm)

### American Express Innovation Laboratories Limited (Ireland)
- **Parent / ownership:** AE Innovation Labs Holdings, LLC, 100%
- **Segment:** Corporate & Other (technology)
- **Significance:** Holds AXP's innovation and technology IP in Ireland (inferred from the name and structure). Activities are not disclosed.
- **Sources:** [Exhibit 21](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231exx21.htm)

### Global Business Travel Group, Inc. (Amex GBT) — former equity investment
- **Type:** Formerly an equity-method investment (about 30%); now an unaffiliated licensee
- **Ownership:** 0%. AXP agreed on May 4, 2026 to sell its stake to Long Lake (backed by General Catalyst). The $6.3B take-private closed on September 29, 2026. In its May 4, 2026 8-K, AXP said it expects proceeds of about $1.5B and a pre-tax gain of about $975M, which was not included in its FY2026 earnings guidance.
- **Segment:** Previously an equity-method investment; its commercial arrangements support CS
- **Relationship & significance:** GBTG keeps a long-term trademark license for American Express marks and its commercial arrangements with AXP; it "supports certain of our strategic partnerships and our Commercial Services business." Sell to it as a separate account. Michael Esquibel became CTO in September 2026.
- **Revenue:** $2,718M (FY2025, +12%, including $209M from the CWT acquisition that closed in September 2025)
- **Employees:** 27,000+ (reported, December 31, 2025)
- **Sources:** [AXP IR announcement (May 4, 2026)](https://ir.americanexpress.com/news/investor-relations-news/investor-relations-news-details/2026/Long-Lake-Backed-by-General-Catalyst-to-Purchase-American-Express-Stake-in-Global-Business-Travel-Group-Inc--as-GBTG-Agrees-to-be-Acquired/default.aspx); [Amex GBT press release (September 29, 2026)](https://www.amexglobalbusinesstravel.com/press-releases/long-lake-worlds-first-ai-holding-company-completes-acquisition-amex-gbt/); [GBTG FY2025 10-K](https://www.sec.gov/Archives/edgar/data/1820872/000162828026015817/gbtg-20251231.htm); [Business Travel News Europe](https://www.businesstravelnewseurope.com/On-the-Move/Amex-GBT-names-Esquibel-as-chief-technology-officer)

### Other former and spun-off entities
- **Accertify (fraud prevention):** Sold in 2024. AXP booked a $531M pre-tax gain ($479M after tax) in Q2 2024. It is no longer in Exhibit 21.
- **American Express Bank LLC (Russia):** Exited after the invasion of Ukraine. Absent from Exhibit 21 since 2023.
- **Ameriprise Financial:** Spun off in 2005 (historical; no ownership relationship).
- **Nipendo and Rocketplace:** Earlier acquisitions not listed as separate entities in the FY2025 Exhibit 21. They were likely merged into other entities; status not verified.
- **Amex Ventures and the American Express Foundation:** Not Exhibit 21 subsidiaries. The 10-K names the Foundation and the AXP PAC as sources of reputational risk. Ventures' portfolio and Foundation financials were not researched here.
- **Sources:** Exhibit 21 ([2022](https://www.sec.gov/Archives/edgar/data/4962/000000496223000006/axp-20221231exx21.htm), [2023](https://www.sec.gov/Archives/edgar/data/4962/000000496224000013/axp-20231231exx21.htm), [2025](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231exx21.htm)); [Wikipedia: American Express](https://en.wikipedia.org/wiki/American_Express)

### Network partners (GNS) and cobrand partners — contractual, not owned
- **What they are:** Third-party banks and institutions in about 110 countries licensed to issue Amex cards and/or acquire merchants. Examples include Credit Saison and Coinbase. OptBlue acquirers sign small merchants.
- **Segment:** GMNS
- **Significance:** $227.2B processed volume and 66.2M cards issued by third parties. Cobrands produced 26% of billed business and 36% of loans. Per the FY2025 10-K, the Delta cobrand portfolio alone accounted for about 13% of worldwide billed business and 21% of worldwide card member loans at December 31, 2025, under an agreement that runs through the end of 2029. The Amazon and Lowe's small-business cobrand portfolios are held for sale.
- **Sources:** [FY2025 10-K](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231.htm)

## Leadership and technology organization

| Area | Leader | Notes for sellers |
|---|---|---|
| U.S. Consumer Services | Howard Grosfield, Group President (since Feb 2025) | Platinum refresh; dining (Resy/Tock); Millennial and Gen Z acquisition |
| Global Commercial Services | Raymond Joabar, Group President (since Feb 2025) | Center, Hyper and the expense platform; AI in the sales process |
| International Card Services | Rafael Marquez, President (since May 2022) | Fastest-growing segment; TheFork; EU and UK regulation |
| GMNS | Anna Marrs, Group President (since Feb 2025) | Network modernization; merchant data and analytics products; China JV |
| Enterprise Shared Services | Denise Pickett, President (since Feb 2025) | Servicing and operations; AI tools for agents |
| Technology | Ravi Radhakrishnan, EVP & CIO (since Jan 2022) | Runs global technology delivery, platforms, enterprise data platforms and the Chief Data Office; chairs AI governance through a Generative AI Council |
| Data | Chris Gifford, Chief Data Officer (since Sept 2025; formerly Deputy CDO, USAA, JPMorgan) | Data governance (BCBS 239), AI-ready data layer, "democratize analytics, not data" |
| Finance analytics | Yan Zhang, VP Data Science & Analytics (Finance) | Model innovation, GenAI in finance |
| Risk | Douglas Tabish, CRO | Credit and fraud models (AI used for 15+ years) |

**Technology facts:** AXP spends about $5B a year on technology; Squeri said on the Q4 2025 earnings call (January 30, 2026) that technology spend rose 11% for the year. Squeri's [2026 shareholder letter](https://www.americanexpress.com/content/dam/amex/en-us/newsroom/pdfs/AXP-2026-Chairmans-Letter-to-Shareholders.pdf) says about 11,000 engineers use AI tools and have cut coding times by more than 30% (as reported by Payments Dive); on the Q2 2026 call he cited a 30–40% decrease in coding cycle time. Agentic commerce products include the Amex Agentic Commerce Experiences developer kit and Agent Purchase Protection. Named technology teams in job postings include Consumer Services and Enterprise Digital & Data Technology (AI/ML, personalization; [posting](https://www.themuse.com/jobs/americanexpress/engineer-java-personalization-5db461)), Global Merchant and Network Services Technology (payments network modernization; [posting](https://www.themuse.com/jobs/americanexpress/sr-engineer-engineer-java-c-go)), and Mainframe & Data Center Infrastructure (z/OS; [posting](https://www.themuse.com/jobs/americanexpress/mainframe-engineer-e8a731)).

**Main locations:** New York (HQ); Phoenix (network hub and 56th Street campus); Sunrise, FL; Salt Lake City and Sandy, UT (AENB); Palo Alto; Atlanta; Gurugram, Bengaluru, Delhi, Mumbai, Chennai and Pune (India); London, Amsterdam and Frankfurt; Madrid (AEESA); Singapore, Hong Kong and Tokyo; Toronto, Mexico City and Buenos Aires.

**Strategy signals:** No 2025 or 2026 investor day was found in this research. The current strategy comes from five imperatives in the 10-K: premium consumer, commercial payments, global network, global position, and reimagining customer and colleague experiences. Further signals come from the [2026 Chairman's Letter](https://www.americanexpress.com/content/dam/amex/en-us/newsroom/pdfs/AXP-2026-Chairmans-Letter-to-Shareholders.pdf) (agentic AI, AI-enabled compliance and fraud workflows), the Q2 2026 call (more investment in marketing and technology) and the [Barclays conference in September 2026](https://stockanalysis.com/stocks/axp/transcripts/736078-barclays-24th-annual-global-financial-services-conference/) (mid-market expense management).

## Recommendations

1. **Enter at the enterprise data and technology layer first.** Target Chris Gifford's Chief Data Office and the platform owners under CIO Ravi Radhakrishnan. Pitch AI-ready data quality, lineage and governance. That ties to BCBS 239, the possible move to Category II and the EU AI Act and DORA, which are budgets AXP must fund.
2. **Run a parallel play in Commercial Services.** The expense-management platform (Center plus Hyper) launches in late 2026, which creates near-term needs in data integration, analytics and AI evaluation. Map Joabar's product and engineering leads.
3. **Treat GMNS as a data-products buyer.** It sells fraud tools, marketing insights and analytics to merchants and runs the network modernization. It has the highest margin (about 51% pretax), so ROI cases land well.
4. **Use international entities for regulation-led deals.** AEESA (DORA, GDPR), India (RBI data localization) and China (on-shore JV) each need in-country data controls. Expect procurement to run through the relevant legal entity.
5. **Deprioritize** funding vehicles, insurance captives and partly owned JVs (Middle East and China) unless you have a regional strategy. Qualify GBTG and Long Lake as a separate account.

## Caveats

- **Segment figures:** GMNS FY2025 pretax income and Corporate & Other values are derived, not reported line items. Segment revenue reflects internal transfer pricing.
- **Entity data:** Entity-level revenue for AENB, AESEL and the Canadian and Australian entities is either a regulatory proxy or a third-party estimate, as labeled. Intercompany flows make these numbers additive only loosely.
- **Ownership status:** Swisscard is still shown as not wholly owned at year-end 2025. Hyper's and TheFork's closings were not confirmed as of this report. Kabbage Business Blueprint's status was not verified.
- **Unverified headcount and spend figures:** The AESEL headcount (Bloomberg), the AEPS S.L. headcount (Empresite), the Australia figures (IBISWorld) and the roughly $5B technology spend come from secondary sources.
- **Q3 2026 results:** These arrive on October 23, 2026 and will update segment run-rates and book the GBTG gain.

## Sources

- [AXP FY2025 10-K](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231.htm)
- [AXP FY2025 Exhibit 21](https://www.sec.gov/Archives/edgar/data/4962/000000496226000080/axp-20251231exx21.htm)
- [AXP FY2023 Exhibit 21](https://www.sec.gov/Archives/edgar/data/4962/000000496224000013/axp-20231231exx21.htm)
- [AXP FY2022 Exhibit 21](https://www.sec.gov/Archives/edgar/data/4962/000000496223000006/axp-20221231exx21.htm)
- [AXP Q2 2026 10-Q](https://www.sec.gov/Archives/edgar/data/0000004962/000000496226000322/axp-20260630.htm)
- [AXP Q3 2025 10-Q](https://www.sec.gov/Archives/edgar/data/4962/000000496225000222/axp-20250930.htm)
- [AXP Q2 2026 earnings release](https://www.sec.gov/Archives/edgar/data/4962/000000496226000318/q226exhibit991.htm)
- [AXP Q2 2026 financials (PDF)](https://s26.q4cdn.com/747928648/files/doc_financials/2026/q2/92d6cbf6-a4de-4e5d-a85e-ad45e2578a69.pdf)
- [AXP Q1 2026 earnings release](https://www.sec.gov/Archives/edgar/data/4962/000000496226000188/q126exhibit991.htm)
- [AXP Q4 2025 earnings release](https://www.sec.gov/Archives/edgar/data/4962/000000496226000037/q425exhibit991.htm)
- [AXP Q4 2025 earnings tables](https://s26.q4cdn.com/747928648/files/doc_earnings/2025/q4/supplemental-info/Q4-2025-Earnings-Tables.pdf)
- [AXP Q1 2025 earnings release](https://www.sec.gov/Archives/edgar/data/4962/000000496225000034/q125exhibit991.htm)
- [AXP 2026 proxy statement (StockTitan)](https://www.stocktitan.net/sec-filings/AXP/def-14a-american-express-co-definitive-proxy-statement-802290e878de.html)
- [AXP 10-K summary (StockTitan)](https://www.stocktitan.net/sec-filings/AXP/10-k-american-express-co-files-annual-report-7dc8f5e068ab.html)
- [AXP 2026 Chairman's Letter](https://www.americanexpress.com/content/dam/amex/en-us/newsroom/pdfs/AXP-2026-Chairmans-Letter-to-Shareholders.pdf)
- [AXP Q3 2026 earnings call notice](https://ir.americanexpress.com/news/investor-relations-news/investor-relations-news-details/2026/American-Express-Plans-Live-Audio-Webcast-of-Third-Quarter-2026-Earnings-Conference-Call/default.aspx)
- [AXP–Long Lake GBTG stake sale](https://ir.americanexpress.com/news/investor-relations-news/investor-relations-news-details/2026/Long-Lake-Backed-by-General-Catalyst-to-Purchase-American-Express-Stake-in-Global-Business-Travel-Group-Inc--as-GBTG-Agrees-to-be-Acquired/default.aspx)
- [Amex GBT: Long Lake completes acquisition](https://www.amexglobalbusinesstravel.com/press-releases/long-lake-worlds-first-ai-holding-company-completes-acquisition-amex-gbt/)
- [GBTG FY2025 10-K](https://www.sec.gov/Archives/edgar/data/1820872/000162828026015817/gbtg-20251231.htm)
- [GBTG 10-K summary (StockTitan)](https://www.stocktitan.net/sec-filings/GBTG/10-k-global-business-travel-group-inc-files-annual-report-a0a2974687fa.html)
- [Business Travel News Europe: Amex GBT CTO](https://www.businesstravelnewseurope.com/On-the-Move/Amex-GBT-names-Esquibel-as-chief-technology-officer)
- [AEBC India branch disclosures FY2025-26](https://www.americanexpress.com/content/dam/amex/in/legal/Financial-disclosures/FY2025_2026.pdf)
- [AESEL 2023 financial statements](https://www.americanexpress.com/content/dam/amex/uk/company/legal/aesel-2023-financial-statement.pdf)
- [AESEL on Companies House](https://find-and-update.company-information.service.gov.uk/company/01833139)
- [AEPSL 2025 financial statements](https://www.americanexpress.com/content/dam/amex/uk/company/legal/aepsl-2025-financial-statement.pdf)
- [AEGSL 2025 financial statements](https://www.americanexpress.com/content/dam/amex/uk/company/legal/aegsl-2025-financial-statement.pdf)
- [AEESA 2025 EINF](https://www.americanexpress.com/content/dam/amex/es/beneficios/EINF_AEESA_2025.pdf)
- [AXP EU country-by-country report](https://www.americanexpress.com/content/dam/amex/es/beneficios/AmericanExpress_PCbCR_Spanish.pdf)
- [Amex Bank of Canada 2025 Public Accountability Statement](https://www.americanexpress.com/content/dam/amex/en-ca/company/about-american-express/amexbankofcanada-2025-public-accountability-statement-en.pdf)
- [Amex Germany partner overview](https://www.americanexpress.com/de-de/amexcited/amexplained/partner-uebersicht-14119)
- [ibanknet: AENB call report](https://www.ibanknet.com/scripts/callreports/getbank.aspx?ibnid=usa_1394676)
- [usbanklocations: AENB](https://www.usbanklocations.com/american-express-national-bank.shtml)
- [bestcashcow: AENB](https://www.bestcashcow.com/banks/american-express-national-bank-27471)
- [Bloomberg: AESEL profile](https://www.bloomberg.com/profile/company/1487906Z:LN)
- [infoempresa: AEESA](https://www.infoempresa.com/en-in/es/company/american-express-europe-sa)
- [Empresite: American Express Payments Europe](https://empresite.eleconomista.es/AMERICAN-EXPRESS-PAYMENTS-EUROPE.html)
- [fusionbase: AESEL Frankfurt branch](https://fusionbase.com/en/data/organization/71c3d49b7772945c049ac10ec95a5e18/American+Express+Services+Europe+Limited,+Zweigniederlassung+Frankfurt+am+Main)
- [IBISWorld: American Express Australia](https://www.ibisworld.com/australia/company/american-express-australia-limited/11420/)
- [Business Standard: Gurugram campus](https://www.business-standard.com/companies/news/american-express-opens-its-largest-campus-worldwide-in-gurugram-india-124050200575_1.html)
- [FStech: Swisscard stake](https://www.fstech.co.uk/fst/Amex_acquires_50_stake_in_swisscard_from_ubs.php)
- [TradingView/Invezz: Swisscard](https://www.tradingview.com/news/invezz:79856ee8f094b:0-american-express-to-become-sole-owner-of-swisscard-as-ubs-sells-its-50-stake/)
- [Wikipedia: LianLian DigiTech](https://en.wikipedia.org/wiki/LianLian_DigiTech)
- [Finextra: Amex China clearing licence](https://www.finextra.com/pressarticle/82896/american-express-wins-network-clearing-licence-in-china)
- [PaymentsJournal: Amex China and Alipay](https://www.paymentsjournal.com/american-express-expands-further-in-china-through-alipay-alliance/)
- [AmCham Shanghai speakers](https://amcham-shanghai.glueup.cn/event/amcham-shanghai-2025-weforshe-conference-47251/speakers.html)
- [Horizont: Amex acquires Payback](https://www.horizont.net/marketing/nachrichten/-Bonussystem-American-Express-schluckt-Payback-97004)
- [uamr.de: Who owns Payback](https://www.uamr.de/wem-gehoert-payback/)
- [PhocusWire: TheFork sale](https://www.phocuswire.com/news/finance/tripadvisor-sell-thefork-american-express)
- [Harian Basis: TheFork](https://www.harianbasis.co/en/american-express-acquires-thefork-tripadvisor)
- [Yahoo Finance: Amex dining ecosystem](https://finance.yahoo.com/markets/stocks/articles/american-express-expands-dining-ecosystem-061129805.html)
- [Yahoo Finance: Amex shares](https://finance.yahoo.com/markets/stocks/articles/american-express-shares-edge-higher-134110292.html)
- [Yahoo Finance: Amex employees](https://finance.yahoo.com/markets/stocks/articles/many-employees-does-american-express-161200714.html)
- [Quiver Quant: Hyper acquisition](https://www.quiverquant.com/news/American+Express+Acquires+AI+Startup+Hyper+Backed+by+OpenAI+CEO+Sam+Altman)
- [The Paypers: Hypercard acquisition](https://thepaypers.com/mergers-aquisitions-and-investments/news/american-express-acquires-agentic-expense-management-company-hypercard)
- [Trysignalbase: TheFork (inaccurate "acquired" status)](https://www.trysignalbase.com/news/acquisitions/thefork-acquired-by-american-express-acquisition)
- [The Globe and Mail: USCS growth](https://www.theglobeandmail.com/investing/markets/stocks/AXP/pressreleases/921473/how-amexs-us-consumer-services-unit-sustains-its-growth-momentum/)
- [StockAnalysis: AXP metrics](https://stockanalysis.com/stocks/axp/financials/metrics/)
- [StockAnalysis: Barclays conference transcript](https://stockanalysis.com/stocks/axp/transcripts/736078-barclays-24th-annual-global-financial-services-conference/)
- [MarketBeat: Q3 2026 earnings preview](https://www.marketbeat.com/earnings/reports/2026-10-23-american-express-stock/)
- [TheStreet: Amex employees](https://www.thestreet.com/investing/stocks/american-express-employees)
- [Louis Velazquez: Amex workforce](https://www.louisvelazquez.com/how-many-employees-does-american-express-have-in-2026-its-workforce-locations-and-layoffs-explained/)
- [Wikipedia: American Express](https://en.wikipedia.org/wiki/American_Express)
- [The Muse: personalization engineer posting](https://www.themuse.com/jobs/americanexpress/engineer-java-personalization-5db461)
- [The Muse: mainframe engineer posting](https://www.themuse.com/jobs/americanexpress/mainframe-engineer-e8a731)
- [The Muse: GMNS engineer posting](https://www.themuse.com/jobs/americanexpress/sr-engineer-engineer-java-c-go)
