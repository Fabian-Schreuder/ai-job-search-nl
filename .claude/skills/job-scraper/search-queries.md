# Search Queries for Job Scraper

<!-- SETUP: Customize these queries based on your skills, target roles, and location -->

## Installed portal CLIs (primary for `/scrape`)

`/scrape` discovers every portal skill under `.agents/skills/*/SKILL.md` and runs its CLI first. Dutch-market CLIs include `nationalevacaturebank-search`, `linkedin-search`, and `freehire-search`; the Danish demo skills remain installed but are disabled by default. You do **not** need a matching `site:` line below for those CLIs to run.

The `site:` query templates in this file are the **WebSearch fallback** — for portals without a CLI, company career pages, or when a CLI fails.

**Language scope:** write every query category in every language listed in your CLAUDE.md Languages table (typically 1-2, sometimes more). A posting requiring a language you have *not* declared, as a job condition, is excluded before scoring; a posting requiring a *higher level* than you declared in a language you *do* work in is flagged for your own judgment, not excluded — see `04-job-evaluation.md`'s Language Gate, the single source of truth for this rule. Translate each category's keywords rather than machine-translating word-for-word (e.g. "Frontend Developer" -> "Desarrollador Frontend", not a literal word-for-word translation) if you work in more than one language.

## Search Sites

Primary (Dutch job boards with installed CLIs):
- **nationalevacaturebank.nl** - broad Dutch vacancy coverage; covered by `nationalevacaturebank-search` CLI
- **linkedin.com/jobs** - LinkedIn job listings (filter: Netherlands / city); also covered by `linkedin-search` CLI
- **freehire.dev** - tech-focused, multi-market job aggregator; covered by `freehire-search` CLI

WebSearch fallback (direct scraping is limited):
- **intermediair.nl** - Dutch professional and specialist roles
- **monsterboard.nl** - Dutch general job board
- **indeed.nl** - Dutch listings; use WebSearch fallback only because direct scraping is limited

Secondary (company career pages via Google):
- Direct Google searches with `site:` filters for known target companies

## Query Categories

Queries are grouped by priority. Write **each category in every language from your Languages table** (see Language scope above). Combine each query with Dutch location terms (e.g. Amsterdam, Utrecht, or Remote) where the site supports it. Add `vast`, `tijdelijk`, `fulltime`, `parttime`, or `MBO`/`HBO`/`WO` only when those preferences are relevant.

**Organize by function, not job title.** The same underlying work carries different titles across companies and markets (a "Data Scientist" role at one employer may be posted as "Insights Analyst" or "Data Consultant" at another). Name each priority category after the function it covers, and list several plausible job titles as query variants within that category rather than betting an entire priority tier on one exact title string.

### Priority 1: Software Engineering

These match the strongest and most desired technical career direction.

```
site:intermediair.nl "software engineer" Amsterdam fulltime
site:monsterboard.nl "backend developer" Utrecht vast
site:indeed.nl "software engineer" Nederland
site:linkedin.com/jobs "software engineer" Netherlands
```

### Priority 2: Data Engineering & Analytics

These match data, analytics, and platform expertise.

```
site:intermediair.nl "data engineer" Amsterdam HBO OR WO
site:monsterboard.nl "analytics engineer" Rotterdam vast
site:indeed.nl "data engineer" Den Haag fulltime
```

### Priority 3: Product & Delivery

Adjacent roles that combine technical knowledge with product or delivery ownership.

```
site:intermediair.nl "product manager" Utrecht fulltime
site:monsterboard.nl "product owner" Eindhoven vast
site:indeed.nl "technical project manager" Amsterdam tijdelijk
```

### Priority 4: Broader Technical / Consulting

Wider net for consulting, implementation, and professional technology roles.

```
site:intermediair.nl "consultant" IT Amsterdam HBO OR WO
site:monsterboard.nl "technical consultant" Rotterdam fulltime
site:indeed.nl "business consultant" Remote Nederland parttime
```

## Location Filter

When evaluating results, verify the job location and travel arrangement match the agreed search area:
- Amsterdam and surrounding Randstad area
- Rotterdam and Den Haag
- Utrecht
- Eindhoven
- Remote or hybride within the Netherlands

## Language Filter

Your working languages and levels are in CLAUDE.md's Languages table. When filtering scraped results, apply `04-job-evaluation.md`'s Language Gate: a posting requiring a language you haven't declared at all is excluded; a posting requiring a higher level than you declared in a language you do work in is not excluded, flag it clearly instead (see `job-scraper/SKILL.md`'s Step 3 "Quick Fit Assessment" for how the flag surfaces in `/scrape` output). Postings simply *written* in a language you don't work in, that don't require it on the job, are fine.

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If a posting date cannot be determined, include it but flag as "date unknown".

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3 custom queries for that focus. For example:
- "/scrape data engineer" -> relevant category queries + custom focus-specific queries
