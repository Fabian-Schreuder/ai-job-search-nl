import { BASE_URL, htmlFetch, writeError } from "../http.js"
import { normalizeVacancyInput, parseDetailPage } from "../parsers.js"
import type { VacancyDetail } from "../types.js"

export type DetailOpts = {
  readonly id: string
  readonly format: "json" | "plain"
}

function renderPlain(detail: VacancyDetail): string {
  const salary = detail.salary
    ? [detail.salary.currency, detail.salary.min, "-", detail.salary.max, detail.salary.unit].filter((value) => value !== null).join(" ")
    : null
  return [
    detail.title,
    `${detail.company ?? "—"} · ${detail.location ?? "—"}`,
    `Posted: ${detail.date ?? "—"} · Deadline: ${detail.deadline ?? "—"}`,
    `Employment: ${detail.employmentType ?? "—"}`,
    salary ? `Salary: ${salary}` : "",
    "",
    detail.description || detail.summary || "(no description)",
    "",
    detail.applyUrl ? `Apply: ${detail.applyUrl}` : "",
    `URL: ${detail.url}`,
    `id: ${detail.id}`,
  ].filter((line) => line !== "").join("\n")
}

export async function runDetail(options: DetailOpts): Promise<number> {
  const id = normalizeVacancyInput(options.id)
  if (!id) {
    writeError(`could not parse a Werken voor Nederland vacancy from "${options.id}"`, "BAD_ID")
    return 1
  }
  try {
    const html = await htmlFetch(`${BASE_URL}/vacatures/${encodeURIComponent(id)}`)
    if (html === null) {
      writeError("vacancy not found", "NOT_FOUND")
      return 1
    }
    const detail = parseDetailPage(html)
    process.stdout.write(options.format === "plain" ? `${renderPlain(detail)}\n` : `${JSON.stringify(detail, null, 2)}\n`)
    return 0
  } catch (error) {
    writeError(error instanceof Error ? error.message : String(error), "DETAIL_FAILED")
    return 1
  }
}
