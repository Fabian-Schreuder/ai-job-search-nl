# werkenvoornederland-cli

Zero-runtime-dependency Bun CLI for public Dutch government vacancies on
Werken voor Nederland.

**Data source:** server-rendered `/vacatures` search and detail pages.  
**Authentication:** none.  
**Runtime dependencies:** none.

The official robots policy permits vacancy crawling and limits clients to 10
requests per second. Search makes two targeted requests so it can discover the
site's current results-component reference; detail makes one. The CLI does not
access `/login` or collect photos.

## Install and run

```bash
cd .agents/skills/werkenvoornederland-search/cli
bun install
bun run src/cli.ts search -q "data scientist" --format table
```

`bun install` only installs TypeScript development types; the CLI itself runs
with plain Bun.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search public vacancies by keyword, with optional location and age filtering. |
| `detail` | Retrieve structured metadata and complete readable vacancy text. |

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--query <text>` | `-q` | Required search keywords. |
| `--location <text>` | `-l` | Client-side location match. |
| `--jobage <days>` | | Client-side publication-age filter. |
| `--page <n>` | | One-indexed page; default `1`. |
| `--limit <n>` | `-n` | Maximum emitted results; default `20`. |
| `--format <fmt>` | | `json`, `table`, or `plain`. |

```bash
bun run src/cli.ts search -q "data AI" -l "Den Haag" --jobage 30 --format table
bun run src/cli.ts detail data-scientist-RVB-2026-3254 --format plain
```

Search JSON uses the shared envelope:

```json
{ "meta": { "count": 1, "page": 1, "total": 24 }, "results": [] }
```

All errors are JSON on stderr as `{ "error": "...", "code": "..." }` and
exit with status `1`. See `../SKILL.md` and `../url-reference.md` for full usage
and endpoint details.
