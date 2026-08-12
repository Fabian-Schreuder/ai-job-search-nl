export type OutputFormat = "json" | "table" | "plain"

export type VacancyResult = {
  readonly id: string
  readonly title: string
  readonly company: string | null
  readonly location: string | null
  readonly date: string | null
  readonly url: string
  readonly deadline: string | null
  readonly hours: string | null
  readonly salary: string | null
  readonly educationLevel: string | null
  readonly contractType: string | null
  readonly summary: string | null
  readonly sourceKind: "official"
  readonly canonicalUrl: string
}

export type SearchPage = {
  readonly total: number
  readonly results: readonly VacancyResult[]
}

export type Salary = {
  readonly currency: string | null
  readonly min: number | null
  readonly max: number | null
  readonly unit: string | null
}

export type VacancyDetail = {
  readonly id: string
  readonly reference: string | null
  readonly title: string
  readonly company: string | null
  readonly location: string | null
  readonly postalCode: string | null
  readonly country: string | null
  readonly date: string | null
  readonly deadline: string | null
  readonly employmentType: string | null
  readonly url: string
  readonly canonicalUrl: string
  readonly applyUrl: string | null
  readonly sourceKind: "official"
  readonly salary: Salary | null
  readonly summary: string | null
  readonly description: string
}
