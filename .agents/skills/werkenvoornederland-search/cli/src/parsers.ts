import { BASE_URL } from "./http.js"
import { toVacancyResult } from "./helpers.js"
import type { Salary, SearchPage, VacancyDetail, VacancyResult } from "./types.js"

const MONTHS: Readonly<Record<string, string>> = {
  januari: "01", februari: "02", maart: "03", april: "04", mei: "05", juni: "06",
  juli: "07", augustus: "08", september: "09", oktober: "10", november: "11", december: "12",
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&#(\d+);/g, (_, value: string) => String.fromCodePoint(Number(value)))
}

function cleanHtml(html: string): string {
  return decodeHtml(
    html
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(p|li|ul|ol|div|section|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function capture(html: string, pattern: RegExp): string | null {
  const value = pattern.exec(html)?.[1]
  return value ? cleanHtml(value) || null : null
}

function dutchDate(value: string | null): string | null {
  if (!value) return null
  const match = /\b(\d{1,2})\s+([a-z]+)\s+(\d{4})\b/i.exec(value)
  if (!match) return null
  const monthName = match[2]?.toLowerCase()
  const month = monthName ? MONTHS[monthName] : undefined
  const day = match[1]
  const year = match[3]
  return month && day && year ? `${year}-${month}-${day.padStart(2, "0")}` : null
}

function labelledValue(chunk: string, title: string): string | null {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const value = capture(
    chunk,
    new RegExp(`title="${escaped}"[\\s\\S]*?class="job-short-info__value[^\"]*"[^>]*>([\\s\\S]*?)<\\/li>`, "i"),
  )
  return value?.replace(/\s+/g, " ") ?? null
}

function parseCard(chunk: string): VacancyResult | null {
  const link = /class="vacancy__title"[\s\S]*?href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(chunk)
  const path = link?.[1]
  const titleHtml = link?.[2]
  if (!path || !titleHtml) return null
  const id = normalizeVacancyInput(path)
  if (!id) return null
  return toVacancyResult({
    id,
    title: cleanHtml(titleHtml),
    company: capture(chunk, /class="vacancy__employer"[^>]*>([\s\S]*?)<\/p>/i),
    location: labelledValue(chunk, "Locatie"),
    date: dutchDate(capture(chunk, /class="job-short-info__top"[^>]*>([\s\S]*?)<\/div>/i)),
    deadline: dutchDate(capture(chunk, /class="vacancy-publication-end"[^>]*>([\s\S]*?)<\/span>/i)),
    hours: labelledValue(chunk, "Uren per week"),
    salary: labelledValue(chunk, "Salaris"),
    educationLevel: labelledValue(chunk, "Niveau"),
    contractType: labelledValue(chunk, "Arbeidsovereenkomst"),
    summary: capture(chunk, /class="vacancy__description"[^>]*>([\s\S]*?)<\/p>/i),
  })
}

export function parseSearchPage(html: string): SearchPage {
  const totalText = capture(html, /role="status"[^>]*>([\s\S]*?)<\//i)
  const total = totalText ? Number(totalText.replace(/\D/g, "")) : 0
  const chunks = html.split(/<li[^>]*class="[^"]*vacancy-list__item[^"]*"[^>]*>/i).slice(1)
  const results: VacancyResult[] = []
  for (const chunk of chunks) {
    const card = parseCard(chunk)
    if (card) results.push(card)
  }
  return { total, results }
}

type JsonObject = Readonly<Record<string, unknown>>

function objectValue(value: unknown): JsonObject | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null
  return Object.fromEntries(Object.entries(value))
}

function stringValue(object: JsonObject | null, key: string): string | null {
  const value = object?.[key]
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function numberValue(object: JsonObject | null, key: string): number | null {
  const value = object?.[key]
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function parseSalary(root: JsonObject): Salary | null {
  const salary = objectValue(root["baseSalary"])
  const value = objectValue(salary?.["value"])
  if (!salary || !value) return null
  return {
    currency: stringValue(salary, "currency"),
    min: numberValue(value, "minValue"),
    max: numberValue(value, "maxValue"),
    unit: stringValue(value, "unitText"),
  }
}

function detailSections(html: string): string {
  const ids = ["dit_ga_je_doen_anchor", "dit_krijg_je_anchor", "dit_bieden_wij_nog_meer_anchor", "dit_vragen_wij_anchor", "hier_kom_je_te_werken_anchor", "bijzonderheden_anchor"] as const
  const sections: string[] = []
  for (const id of ids) {
    const pattern = new RegExp(`<section[^>]*id="${id}"[^>]*>([\\s\\S]*?)(?=<section\\b|<div[^>]*class="[^"]*(?:job-contact|apply-job)|$)`, "i")
    const section = capture(html, pattern)
    if (section) sections.push(section)
  }
  return sections.join("\n\n")
}

export function normalizeVacancyInput(input: string): string | null {
  const trimmed = input.trim()
  if (/^[a-z0-9][a-z0-9-]*$/i.test(trimmed)) return trimmed
  const relative = /^\/vacatures\/([^/?#]+)\/?(?:[?#].*)?$/.exec(trimmed)
  if (relative?.[1]) return relative[1]
  try {
    const url = new URL(trimmed)
    if (url.origin !== BASE_URL) return null
    const match = /^\/vacatures\/([^/]+)\/?$/.exec(url.pathname)
    return match?.[1] ?? null
  } catch (error) {
    if (error instanceof TypeError) return null
    throw error
  }
}

export function parseDetailPage(html: string): VacancyDetail {
  const script = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i.exec(html)?.[1]
  const parsed: unknown = script ? JSON.parse(script) : null
  const root = objectValue(parsed)
  if (!root || stringValue(root, "@type") !== "JobPosting") throw new SyntaxError("JobPosting JSON-LD is missing")
  const canonical = /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i.exec(html)?.[1]
  const id = canonical ? normalizeVacancyInput(decodeHtml(canonical)) : null
  if (!id) throw new SyntaxError("canonical vacancy URL is missing")
  const organization = objectValue(root["hiringOrganization"])
  const identifier = objectValue(root["identifier"])
  const location = objectValue(root["jobLocation"])
  const address = objectValue(location?.["address"])
  const apply = /applyExternClick\('([^']+)'\)/i.exec(html)?.[1]
  return {
    id,
    reference: stringValue(identifier, "value"),
    title: stringValue(root, "title") ?? "(untitled)",
    company: stringValue(organization, "name"),
    location: stringValue(address, "addressLocality"),
    postalCode: stringValue(address, "postalCode"),
    country: stringValue(address, "addressCountry"),
    date: stringValue(root, "datePosted"),
    deadline: stringValue(root, "validThrough"),
    employmentType: stringValue(root, "employmentType"),
    url: `${BASE_URL}/vacatures/${id}`,
    canonicalUrl: `${BASE_URL}/vacatures/${id}`,
    applyUrl: apply ? decodeHtml(apply) : null,
    sourceKind: "official",
    salary: parseSalary(root),
    summary: stringValue(root, "description"),
    description: detailSections(html),
  }
}
