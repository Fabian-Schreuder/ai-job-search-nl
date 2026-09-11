import { afterEach, describe, expect, test } from "bun:test"
import { runSearch } from "../src/commands/search.js"

const originalFetch = globalThis.fetch
const originalStdoutWrite = process.stdout.write

const canonicalHtml = `
<div style="display:none;"
  id="/vacatures?_hn:type=component-rendering&amp;_hn:ref=r99_r1_r4&amp;term=AI+consultant"
  class="i525243074Async"></div>
<span id="vacancy-spinner"></span>
<div style="display:none;"
  id="/vacatures?_hn:type=component-rendering&amp;_hn:ref=r99_r1_r8&amp;term=AI+consultant"
  class="i525243074Async"></div>`

const componentHtml = `
<div><span role="status">1</span></div>
<li class="vacancy-list__item">
  <section class="vacancy">
    <h2 class="vacancy__title"><a href="/vacatures/ai-specialist-RVB-2026-1">AI Specialist</a></h2>
    <p class="vacancy__employer">Rijksorganisatie</p>
    <li><span title="Locatie"></span><span class="job-short-info__value">Utrecht</span></li>
    <div class="job-short-info__top">Plaatsingsdatum: 10 september 2026</div>
    <p class="vacancy__description">Bouw praktische AI-oplossingen.</p>
  </section>
</li>`

function captureStdout(): () => string {
  let stdout = ""
  process.stdout.write = (chunk: string | Uint8Array): boolean => {
    stdout += chunk.toString()
    return true
  }
  return () => stdout
}

afterEach(() => {
  globalThis.fetch = originalFetch
  process.stdout.write = originalStdoutWrite
})

describe("Werken voor Nederland search", () => {
  test("Given a changing component reference, when searching, then the current reference is discovered", async () => {
    const requestedUrls: string[] = []
    globalThis.fetch = Object.assign(
      async (input: RequestInfo | URL): Promise<Response> => {
        const url = new URL(String(input))
        requestedUrls.push(url.toString())
        if (url.searchParams.get("_hn:ref") === "r99_r1_r4") return new Response(componentHtml)
        if (url.searchParams.has("_hn:type")) return new Response(null, { status: 404 })
        return new Response(canonicalHtml)
      },
      { preconnect: originalFetch.preconnect },
    )
    const stdout = captureStdout()

    const code = await runSearch({ query: "AI consultant", page: 1, limit: 20, format: "json" })

    expect(code).toBe(0)
    expect(requestedUrls.map((url) => new URL(url).searchParams.get("_hn:ref"))).toEqual([null, "r99_r1_r4"])
    expect(JSON.parse(stdout())).toMatchObject({
      meta: { count: 1, total: 1 },
      results: [{ title: "AI Specialist", company: "Rijksorganisatie", location: "Utrecht" }],
    })
  })
})
