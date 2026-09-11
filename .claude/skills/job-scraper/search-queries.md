# Search Queries for Job Scraper

<!-- SETUP: Customize these queries based on your skills, target roles, and location -->

## Installed portal CLIs (primary for `/scrape`)

`/scrape` discovers every portal skill under `.agents/skills/*/SKILL.md` and runs its CLI first. Dutch-market CLIs include `nationalevacaturebank-search`, `werkenvoornederland-search`, `linkedin-search`, and `freehire-search`; the Danish demo skills remain installed but are disabled by default. You do **not** need a matching `site:` line below for those CLIs to run.

The `site:` query templates in this file are the **WebSearch fallback** — for portals without a CLI, company career pages, or when a CLI fails.

**Language scope:** write every query category in every language listed in your CLAUDE.md Languages table (typically 1-2, sometimes more). A posting requiring a language you have *not* declared, as a job condition, is excluded before scoring; a posting requiring a *higher level* than you declared in a language you *do* work in is flagged for your own judgment, not excluded — see `04-job-evaluation.md`'s Language Gate, the single source of truth for this rule. Translate each category's keywords rather than machine-translating word-for-word (e.g. "Frontend Developer" -> "Desarrollador Frontend", not a literal word-for-word translation) if you work in more than one language.

## Search Sites

Primary (Dutch job boards with installed CLIs):
- **nationalevacaturebank.nl** - broad Dutch vacancy coverage; covered by `nationalevacaturebank-search` CLI
- **linkedin.com/jobs** - LinkedIn job listings (filter: Netherlands / city); also covered by `linkedin-search` CLI
- **freehire.me** - tech-focused, multi-market job aggregator; covered by `freehire-search` CLI
- **werkenvoornederland.nl** - Dutch public-sector roles; covered by `werkenvoornederland-search` CLI

WebSearch fallback (direct scraping is limited):
- **intermediair.nl** - Dutch professional and specialist roles
- **monsterboard.nl** - Dutch general job board
- **indeed.nl** - Dutch listings; use WebSearch fallback only because direct scraping is limited

Secondary (company career pages via Google):
- Direct Google searches with `site:` filters for known target companies

<!-- PROFILE-SEARCH-START: /setup replaces this complete region -->
## Search Objective

Prioritize **applied AI work at the boundary between users, business, and technical teams**: implementing and evaluating LLM/agentic systems, prototyping AI products, adoption and solution consulting, and practical human-centred/responsible AI. Prefer roles with mentorship and room to grow over jobs that assume deep production engineering or senior ownership from day one.

High-signal evidence in a title or description:
- applied AI, agentic AI, GenAI, LLM, RAG, conversational AI
- AI implementation, adoption, solutions, prototyping, evaluation, or reliability
- AI product discovery, user research, explainability, human-centred or responsible AI **with implementation work**
- knowledge graphs or semantic AI

Domain boosts, not hard requirements:
- health, wellbeing, nutrition, food, behaviour change
- consumer products, retail, lifestyle, fitness, customer experience
- international product companies and scale-ups

## Portal-Specific Query Plan

Do not send every phrase to every portal. Use at most **three discovery calls per portal** in a default run, chosen from the highest-priority categories below. A focused `/scrape <area>` may substitute up to three queries from the matching category.

### LinkedIn

Use `-l "Netherlands" --jobage 14 -n 10`. Run exact role-family phrases rather than bare `AI`; good starting lanes are:

1. `"AI consultant"`
2. `"Applied AI"`
3. `"associate AI"` (alternate with `"junior AI"` on the next run)

Rotate in `"AI product"`, `"AI implementation"`, `"AI adoption"`, `"LLM evaluation"`, or `"conversational AI"` for a focused run. Keep one early-career lane in every default run so senior listings cannot consume the entire result cap. LinkedIn keyword search is broad, so apply the listing pre-filter below before any detail request.

### Nationale Vacaturebank

Use the configured home city and commute radius with `--jobage 14 -n 20`. Search Dutch-market title variants separately; the API's `dcoTitle` filter performs better with one role family per call:

1. `"AI consultant"`
2. `"AI specialist"`
3. `"traineeship AI"`

Rotate in `"AI engineer"`, `"data science AI"`, or `"product analist AI"` for a focused run. Keep the traineeship lane in the default plan so experienced listings do not fill the API page before filtering. Consolidate identical traineeship or intermediary postings before presentation.

### freehire

Always pass `--country NL --jobage 14 --no-description -n 20` for discovery. Its country facet can mean that the Netherlands is one eligible location even when the displayed location is abroad, so verify the result's actual location before shortlisting.

Use three complementary lanes:

1. Solutions lane: `-q "AI consultant"`
2. Applied systems lane: `--category ml_ai --skill agentic-ai,generative-ai,llm`
3. Early-career lane: `-q "junior AI"` (alternate with `-q "associate AI"`)

Use title wording for this lane rather than the `--seniority` facet: many relevant postings have unresolved seniority, and the live NL `junior,middle` facet can return no results while `"junior AI"` returns current vacancies. A focused run may substitute `-q "AI product"` or `--skill model-evaluation,conversational-ai` for one non-early-career lane, but never remove all early-career coverage. Fetch a description only after the listing pre-filter passes; search results discovered with `--no-description` can be retrieved once with `detail`.

### Werken voor Nederland

Public-sector titles are less standardized. Use `-q "AI"`, then focused Dutch terms such as `-q "algoritme"`, `-q "kunstmatige intelligentie"`, or `-q "data scientist"`. Keep only cards whose title or summary contains an applied-AI signal. Treat policy/governance-only work, security-clearance roles, and infrastructure-only AI platforms as exclusions unless a focused run asks for them.

## Listing Pre-filter

Apply this before detail fetching using only fields the search result actually contains. Reject only **proven** mismatches; a targeted query-lane hit with missing or ambiguous evidence proceeds to detail.

1. **Geography:** reject a clearly non-Netherlands location with no NL/remote eligibility signal. A multi-country result that includes NL is ambiguous even when another city is displayed; send it to detail rather than discarding it.
2. **Applied-AI signal:** target titles below pass. A generic title passes when its listing summary contains a high-signal phrase. When discovery intentionally omitted descriptions, a hit from a targeted applied-AI query lane remains ambiguous and passes.
3. **Career stage:** prefer `associate`, `junior`, `graduate`, `trainee`, `starter`, `emerging talent`, and `medior`. Reject explicit `senior`, `staff`, `principal`, `lead`, `head`, `director`, and `architect` titles only when the listing contains no level-flexible wording or earlier-career signal.
4. **Source quality:** reject spontaneous applications, talent pools, generic “open opportunities,” non-vacancy pages, and listing URLs that do not resolve to one job.

## Post-detail Eligibility Filter

Apply this after the full posting is available and before Quick Fit Assessment. This is where ambiguous discovery hits are resolved.

1. **Actual work location:** verify where the candidate may perform the job, not just an aggregator facet or search centre. Reject roles that are neither in the Netherlands nor genuinely NL-eligible remote/hybrid.
2. **Applied work:** a generic title must show meaningful implementation, prototyping, adoption, product, evaluation, user, or stakeholder work. AI mentioned only as context is insufficient.
3. **Career stage:** enforce the level rule using stated years and responsibilities, preserving explicit level-flexible or earlier-career exceptions.
4. **Role shape and contract:** skip sales/presales/account-executive roles; pure software, data engineering, MLOps/platform/DevOps; pure research/PhD; policy-only governance/compliance; internships; teaching; and freelance/ZZP contracts. Keep a mixed role when applied-AI implementation, users, or product work has meaningful weight.
5. **Hard gates:** apply the configured language, eligibility, location, salary, and other deal-breakers exactly as their source profile defines them.

Target title families:
- AI / GenAI / LLM Consultant, Junior Data & AI Consultant
- Applied AI Specialist, AI Adoption Specialist, AI Implementation Specialist
- Associate AI Solution Consultant, Forward Deployed AI Engineer (junior/associate only)
- AI Product Analyst, Associate AI Product Manager, AI Product Specialist
- LLM Evaluation, AI Reliability, Responsible AI or XAI Specialist with hands-on implementation
- Conversational AI, knowledge-graph, or semantic-AI roles with product/stakeholder work

## Query Categories

Queries are grouped by priority. Write **each category in every language from your Languages table** (see Language scope above). Combine each query with Dutch location terms (e.g. Amsterdam, Utrecht, or Remote) where the site supports it. Add `vast`, `tijdelijk`, `fulltime`, `parttime`, or `MBO`/`HBO`/`WO` only when those preferences are relevant.

**Organize by function, not job title.** The same underlying work carries different titles across companies and markets (a "Data Scientist" role at one employer may be posted as "Insights Analyst" or "Data Consultant" at another). Name each priority category after the function it covers, and list several plausible job titles as query variants within that category rather than betting an entire priority tier on one exact title string.

### Priority 1: AI Solutions, Adoption & Implementation

The strongest target: client/stakeholder-facing applied-AI delivery with room to prototype.

```
site:intermediair.nl "AI consultant" Nederland
site:indeed.nl "AI implementation specialist" Nederland
site:linkedin.com/jobs "AI adoption specialist" Netherlands
site:linkedin.com/jobs "associate AI solution consultant" Netherlands
```

### Priority 2: AI Product & Human-Centred AI

Product discovery and delivery roles where AI, users, and business requirements meet.

```
site:intermediair.nl "AI product specialist" Nederland
site:indeed.nl "AI product analyst" Nederland
site:linkedin.com/jobs "associate AI product manager" Netherlands
site:linkedin.com/jobs "conversational AI" product Netherlands
```

### Priority 3: Agentic AI, Evaluation & Explainability

Hands-on applied systems without making deep model research or infrastructure the whole job.

```
site:intermediair.nl "agentic AI" Nederland
site:indeed.nl "LLM evaluation" Nederland
site:linkedin.com/jobs "Applied AI" Netherlands
site:linkedin.com/jobs "AI reliability" OR "explainable AI" Netherlands
```

### Priority 4: Health, Food & Consumer Applied AI

Domain-led searches that exploit health, nutrition, behaviour, retail, and customer-experience experience.

```
site:indeed.nl "AI" (health OR voeding OR nutrition OR wellbeing) Nederland
site:linkedin.com/jobs "AI product" (health OR consumer OR retail) Netherlands
site:linkedin.com/jobs "conversational AI" customer experience Netherlands
site:werkenvoornederland.nl/vacatures (AI OR algoritme) (gezondheid OR voeding)
```

### Priority 5: Wider Applied-AI Bridge

Use only in `broad` mode or when the first four categories have low yield.

```
site:indeed.nl "junior data & AI consultant" Nederland
site:linkedin.com/jobs "forward deployed AI engineer" Netherlands
site:linkedin.com/jobs "solutions engineer" AI Netherlands
site:intermediair.nl ("responsible AI" OR "AI governance") implementatie Nederland
```

## Location Filter

When evaluating results, verify the job location and travel arrangement match the agreed search area:
- Amsterdam and surrounding Randstad area
- Rotterdam and Den Haag
- Utrecht
- Eindhoven
- Remote or hybride within the Netherlands

<!-- PROFILE-SEARCH-END -->

## Language Filter

Your working languages and levels are in CLAUDE.md's Languages table. When filtering scraped results, apply `04-job-evaluation.md`'s Language Gate: a posting requiring a language you haven't declared at all is excluded; a posting requiring a higher level than you declared in a language you do work in is not excluded, flag it clearly instead (see `job-scraper/SKILL.md`'s Step 3 "Quick Fit Assessment" for how the flag surfaces in `/scrape` output). Postings simply *written* in a language you don't work in, that don't require it on the job, are fine.

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If a posting date cannot be determined, include it but flag as "date unknown".

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3 custom queries for that focus. For example:
- "/scrape AI product" -> relevant category queries + custom focus-specific queries
