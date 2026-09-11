---
name: werkenvoornederland-search
version: 1.0.1
description: >
  Use this skill to search live public-sector vacancies in the Netherlands on
  Werken voor Nederland, or retrieve a specific Dutch government vacancy by
  slug or URL. Use it for ministries, regulators, executive agencies, research
  organizations, and public digital infrastructure. Trigger phrases: Werken
  voor Nederland, Rijksoverheid vacatures, vacatures bij het Rijk,
  overheidsbanen, rijksdienst vacatures, ministerie vacatures, government jobs
  Netherlands, Dutch public-sector jobs.
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/werkenvoornederland-search/cli/src/cli.ts *)
---

# Werken voor Nederland Search Skill

Search public vacancies from the Dutch government's Werken voor Nederland site.
The CLI uses server-rendered search pages and schema.org `JobPosting` detail
metadata. It requires no authentication and has zero runtime dependencies.

## Access and reuse

The official `robots.txt` permits vacancy crawling, disallows only `/login`, and
sets a maximum request rate of 10 requests per second. Search makes two targeted
requests (the canonical page, then its current results component); detail makes
one. The CLI identifies itself honestly. Vacancy text is published under CC0;
photos are excluded from that licence and are not collected by this skill.

## Commands

### Search vacancies

```bash
bun run .agents/skills/werkenvoornederland-search/cli/src/cli.ts search -q "data scientist" [flags]
```

| Flag | Alias | Description |
|------|-------|-------------|
| `--query <text>` | `-q` | Required keywords for the official `term` parameter. |
| `--location <text>` | `-l` | Client-side city/location filter. |
| `--jobage <days>` | | Keep vacancies posted within the given number of days. |
| `--page <n>` | | One-indexed page; the site serves 20 results per page. |
| `--limit <n>` | `-n` | Cap results emitted from the selected page; default `20`. |
| `--format <fmt>` | | `json` (default), `table`, or `plain`. |

### Retrieve a vacancy

```bash
bun run .agents/skills/werkenvoornederland-search/cli/src/cli.ts detail <slug|url> [--format json|plain]
```

Detail output includes readable vacancy sections, publication and deadline
dates, salary, contract type, location, and the final employer/ATS `applyUrl`
when the page publishes one.

## Examples

```bash
bun run .agents/skills/werkenvoornederland-search/cli/src/cli.ts search -q "data AI" --format table
bun run .agents/skills/werkenvoornederland-search/cli/src/cli.ts search -q "product owner" -l Utrecht --format plain
bun run .agents/skills/werkenvoornederland-search/cli/src/cli.ts search -q "gezondheid data" --jobage 14 --format json
bun run .agents/skills/werkenvoornederland-search/cli/src/cli.ts search -q adviseur --page 2 -n 10 --format table
bun run .agents/skills/werkenvoornederland-search/cli/src/cli.ts detail "https://www.werkenvoornederland.nl/vacatures/data-scientist-RVB-2026-3254" --format plain
```

## Output and errors

Search JSON follows the shared portal contract:

```json
{
  "meta": { "count": 1, "page": 1, "total": 24 },
  "results": [{ "id": "data-scientist-RVB-2026-3254", "title": "Data Scientist", "company": "Rijksvastgoedbedrijf", "location": "Den Haag", "date": "2026-08-10", "url": "https://www.werkenvoornederland.nl/vacatures/data-scientist-RVB-2026-3254" }]
}
```

Results also include `deadline`, `hours`, `salary`, `educationLevel`,
`contractType`, `summary`, `canonicalUrl`, and `sourceKind: "official"`.
Errors are JSON on stderr and exit with status `1`.

## Notes

- Search loads the canonical page, discovers its current server-rendered results component, then requests that component with `term` and `pagina`; location and posting age are filtered from the selected page.
- Search cards publish a stable canonical vacancy slug used as `id`.
- Detail pages expose structured JSON-LD plus readable content sections.
- The final application URL may point to SuccessFactors or another government ATS.

See [url-reference.md](url-reference.md) for endpoint and parsing details.
