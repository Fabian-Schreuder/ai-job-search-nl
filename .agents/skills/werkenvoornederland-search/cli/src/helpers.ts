import { BASE_URL } from "./http.js"
import type { VacancyResult } from "./types.js"

export function writeError(error: string, code: string): void {
  process.stderr.write(`${JSON.stringify({ error, code })}\n`)
}

export interface VacancyResultFields {
  readonly id: string
  readonly title: string
  readonly company: string | null
  readonly location: string | null
  readonly date: string | null
  readonly deadline: string | null
  readonly hours: string | null
  readonly salary: string | null
  readonly educationLevel: string | null
  readonly contractType: string | null
  readonly summary: string | null
}

/** Build the shared search-result contract from parsed card fields. */
export function toVacancyResult(fields: VacancyResultFields): VacancyResult {
  const url = `${BASE_URL}/vacatures/${fields.id}`
  return {
    id: fields.id,
    title: fields.title,
    company: fields.company,
    location: fields.location,
    date: fields.date,
    url: url,
    deadline: fields.deadline,
    hours: fields.hours,
    salary: fields.salary,
    educationLevel: fields.educationLevel,
    contractType: fields.contractType,
    summary: fields.summary,
    sourceKind: "official",
    canonicalUrl: url,
  }
}
