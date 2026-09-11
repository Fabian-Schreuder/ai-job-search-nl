# Werken voor Nederland URL Reference

Public, unauthenticated HTML endpoints used by this skill. Base URL:

```text
https://www.werkenvoornederland.nl
```

The official `robots.txt` permits all paths except `/login`, declares a
`Request-rate: 10/1`, and publishes both the general and vacancy sitemaps.

## Vacancy search

```text
GET /vacatures?term=data&pagina=2
GET /vacatures?_hn:type=component-rendering&_hn:ref=<current-results-ref>&term=data&pagina=2
```

| Query parameter | CLI flag | Meaning |
|-----------------|----------|---------|
| `_hn:type` | internal | Requests the server-rendered results component advertised by the canonical page. |
| `_hn:ref` | internal | Opaque deployment-specific component reference; discover it from the canonical page and never hard-code it. |
| `term` | `--query`, `-q` | Keyword search. |
| `pagina` | `--page` | One-indexed page; omitted for page 1. |

Search first loads the canonical `/vacatures` page with `term` and `pagina`, then
reads the hidden async placeholder immediately before `#vacancy-spinner`. Its
`id` is the current component URL. Component references change between site
deployments, so a stored reference eventually returns `404`.

The server-rendered component response contains 20 vacancy cards per page. Each card uses:

| Field | HTML anchor |
|-------|-------------|
| ID and URL | `.vacancy__title a[href^="/vacatures/"]` |
| Title | `.vacancy__title` |
| Organization | `.vacancy__employer` |
| Location/hours/salary/level/contract | label `title` followed by `.job-short-info__value` |
| Deadline | `.vacancy-publication-end` |
| Posting date | `.job-short-info__top` |
| Summary | `.vacancy__description` |
| Total | `[role="status"]` |

Location and posting-age filters are client-side because the public URL uses
internal filter codes for those facets.

## Vacancy detail

```text
GET /vacatures/{slug}
```

The canonical slug, for example `data-scientist-RVB-2026-3254`, is also the
portal-skill result ID. Detail pages contain schema.org `JobPosting` JSON-LD:

```text
title, description, identifier.value, datePosted, validThrough,
employmentType, hiringOrganization.name, jobLocation.address,
baseSalary.value.{minValue,maxValue,unitText}
```

Full readable text comes from these section IDs:

```text
dit_ga_je_doen_anchor
dit_krijg_je_anchor
dit_bieden_wij_nog_meer_anchor
dit_vragen_wij_anchor
hier_kom_je_te_werken_anchor
bijzonderheden_anchor
```

External application URLs are published in `applyExternClick('<url>')` and are
decoded into the additive `applyUrl` field.

## Discovery and policy endpoints

```text
GET /robots.txt
GET /sitemap-vacatures.xml
GET /copyright
```

The vacancy sitemap lists canonical detail URLs and `lastmod` timestamps. Site
text is available under CC0 unless stated otherwise; photos are excluded.
