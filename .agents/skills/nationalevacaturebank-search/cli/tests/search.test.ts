import { afterEach, describe, expect, test } from "bun:test"
import { runDetail } from "../src/commands/detail"
import { runSearch } from "../src/commands/search"
import type { NationaleVacaturebankJob } from "../src/helpers"

const originalFetch = globalThis.fetch
const originalStdoutWrite = process.stdout.write
const originalStderrWrite = process.stderr.write

const job: NationaleVacaturebankJob = {
  id: "12345",
  title: "Backend Developer",
  dcoTitle: "developer",
  description: "<p>Bouw Nederlandse producten.</p>",
  company: { name: "Voorbeeld BV", website: "https://voorbeeld.nl", slug: "voorbeeld-bv", type: "company" },
  salary: { min: 4500, max: 6000 },
  contractType: "vast",
  careerLevel: "medior",
  categories: ["ICT"],
  industries: ["Software"],
  startDate: "2099-01-01T00:00:00.000Z",
  endDate: null,
  status: "published",
  workingHours: { min: 32, max: 40 },
}

function captureStdout(): () => string {
  let stdout = ""
  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdout += chunk.toString()
    return true
  }) as typeof process.stdout.write
  return () => stdout
}

function captureStderr(): () => string {
  let stderr = ""
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderr += chunk.toString()
    return true
  }) as typeof process.stderr.write
  return () => stderr
}

afterEach(() => {
  globalThis.fetch = originalFetch
  process.stdout.write = originalStdoutWrite
  process.stderr.write = originalStderrWrite
})

describe("Nationale Vacaturebank API commands", () => {
  test("search returns parsed portal-skill results with Dutch locale headers", async () => {
    let requestedUrl = ""
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requestedUrl = String(input)
      expect(new Headers(init?.headers).get("Accept-Language")).toBe("nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7")
      return Response.json({
        page: 1,
        limit: 10,
        pages: 1,
        total: 1,
        _links: {},
        _embedded: { jobs: [job] },
      })
    }) as typeof fetch
    const stdout = captureStdout()

    const code = await runSearch({
      query: "developer",
      city: "Amsterdam",
      distance: 40,
      page: 1,
      limit: 10,
      format: "json",
    })

    expect(code).toBe(0)
    const output = JSON.parse(stdout()) as { meta: { count: number; page: number; total: number }; results: Array<Record<string, unknown>> }
    expect(output.meta).toEqual({ count: 1, page: 1, total: 1 })
    expect(output.results[0]).toMatchObject({
      id: "12345",
      title: "Backend Developer",
      company: "Voorbeeld BV",
      companyUrl: "https://voorbeeld.nl",
      location: "Amsterdam",
      date: "2099-01-01T00:00:00.000Z",
    })

    const request = new URL(requestedUrl)
    expect(request.pathname).toBe("/api/jobs/v3/sites/nationalevacaturebank.nl/jobs")
    expect(request.searchParams.get("sort")).toBe("relevance")
    expect(request.searchParams.get("filters")).toBe("city:Amsterdam distance:40 dcoTitle:developer")
  })

  test("detail returns the parsed complete job object", async () => {
    globalThis.fetch = (async () => Response.json(job)) as typeof fetch
    const stdout = captureStdout()

    const code = await runDetail({ id: "12345", format: "json" })

    expect(code).toBe(0)
    expect(JSON.parse(stdout())).toEqual(job)
  })

  test("detail reports a 404 as NOT_FOUND", async () => {
    globalThis.fetch = (async () => new Response(null, { status: 404 })) as typeof fetch
    const stderr = captureStderr()

    const code = await runDetail({ id: "12345", format: "json" })

    expect(code).toBe(1)
    expect(JSON.parse(stderr())).toMatchObject({ code: "NOT_FOUND" })
  })
})
