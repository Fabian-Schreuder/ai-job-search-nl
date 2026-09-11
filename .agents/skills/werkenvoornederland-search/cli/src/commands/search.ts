import { BASE_URL, htmlFetch } from "../http.js"
import { writeError } from "../helpers.js"
import { parseSearchPage } from "../parsers.js"
import type { OutputFormat, VacancyResult } from "../types.js"

export type SearchOpts = {
  readonly query: string
  readonly location?: string
  readonly jobage?: number
  readonly page: number
  readonly limit: number
  readonly format: OutputFormat
}

export function buildSearchUrl(options: SearchOpts): string {
  const parameters = new URLSearchParams({ term: options.query })
  if (options.page > 1) parameters.set("pagina", String(options.page))
  return `${BASE_URL}/vacatures?${parameters.toString()}`
}

export function findSearchComponentUrl(html: string): string | null {
  const spinner = html.indexOf('id="vacancy-spinner"')
  const searchArea = spinner === -1 ? html : html.slice(0, spinner)
  const matches = [...searchArea.matchAll(/id="(\/vacatures\?[^\"]*_hn:type=component-rendering[^\"]*)"/gi)]
  const path = matches.at(-1)?.[1]?.replace(/&amp;/g, "&")
  if (!path) return null
  const url = new URL(path, BASE_URL)
  return url.origin === BASE_URL && url.pathname === "/vacatures" ? url.toString() : null
}

function filterResults(results: readonly VacancyResult[], options: SearchOpts): readonly VacancyResult[] {
  const location = options.location?.toLocaleLowerCase("nl-NL")
  const cutoff = options.jobage === undefined ? null : Date.now() - options.jobage * 86_400_000
  return results
    .filter((result) => !location || result.location?.toLocaleLowerCase("nl-NL").includes(location))
    .filter((result) => cutoff === null || result.date === null || Date.parse(result.date) >= cutoff)
    .slice(0, options.limit)
}

function renderTable(results: readonly VacancyResult[]): string {
  if (results.length === 0) return "No results."
  const header = "ID".padEnd(38) + " TITLE".padEnd(43) + " ORGANISATION".padEnd(32) + " LOCATION".padEnd(20) + " DATE"
  return [header, "-".repeat(header.length), ...results.map((result) =>
    result.id.slice(0, 38).padEnd(38) + " " + result.title.slice(0, 41).padEnd(41) + " " +
    (result.company ?? "—").slice(0, 30).padEnd(30) + " " + (result.location ?? "—").slice(0, 18).padEnd(18) +
    " " + (result.date ?? "—"),
  )].join("\n")
}

function renderPlain(results: readonly VacancyResult[]): string {
  if (results.length === 0) return "No results."
  return results.map((result) => [
    result.title,
    `${result.company ?? "—"} · ${result.location ?? "—"} · ${result.hours ?? "—"}`,
    `Posted: ${result.date ?? "—"} · Deadline: ${result.deadline ?? "—"}`,
    result.salary ?? "",
    result.summary ?? "",
    result.url,
  ].filter(Boolean).join("\n")).join("\n\n")
}

export async function runSearch(options: SearchOpts): Promise<number> {
  try {
    const pageHtml = await htmlFetch(buildSearchUrl(options))
    if (pageHtml === null) {
      writeError("vacancy search page not found", "NOT_FOUND")
      return 1
    }
    const componentUrl = findSearchComponentUrl(pageHtml)
    if (componentUrl === null) throw new SyntaxError("vacancy search component is missing")
    const html = await htmlFetch(componentUrl)
    if (html === null) {
      writeError("vacancy search component not found", "NOT_FOUND")
      return 1
    }
    const page = parseSearchPage(html)
    const results = filterResults(page.results, options)
    if (options.format === "table") process.stdout.write(`${renderTable(results)}\n`)
    else if (options.format === "plain") process.stdout.write(`${renderPlain(results)}\n`)
    else process.stdout.write(`${JSON.stringify({ meta: { count: results.length, page: options.page, total: page.total }, results }, null, 2)}\n`)
    return 0
  } catch (error) {
    writeError(error instanceof Error ? error.message : String(error), "SEARCH_FAILED")
    return 1
  }
}
