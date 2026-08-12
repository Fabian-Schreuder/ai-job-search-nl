import { describe, expect, test } from "bun:test"
import { normalizeVacancyInput, parseDetailPage, parseSearchPage } from "../src/parsers.js"

const searchHtml = `
<div><span role="status">1.239</span></div>
<li class="vacancy-list__item">
  <section class="vacancy" data-baanpleinid="50071-20260723-1995">
    <h2 class="vacancy__title"><a href="/vacatures/data-scientist-RVB-2026-3254">Data Scientist</a></h2>
    <p class="vacancy__employer">Rijksvastgoedbedrijf &amp; BZK</p>
    <li><span title="Locatie"></span><span class="job-short-info__value job-short-info__value-icon">Den Haag</span></li>
    <li><span title="Uren per week"></span><span class="job-short-info__value job-short-info__value-icon"><span>32 - 36 uur</span></span></li>
    <li><span title="Salaris"></span><span class="job-short-info__value"><span>Schaal 10</span><br><span>€3.496 - €5.535 (bruto)</span></span></li>
    <li><span title="Niveau"></span><span class="job-short-info__value job-short-info__value-icon">Hbo</span></li>
    <li><span title="Solliciteer voor"></span><span class="vacancy-publication-end">Solliciteer voor 25 augustus 2026</span></li>
    <li><span title="Arbeidsovereenkomst"></span><span class="job-short-info__value job-short-info__value-icon">Arbeidsovereenkomst voor bepaalde tijd</span></li>
    <div class="job-short-info__top">Plaatsingsdatum: 10 augustus 2026</div>
    <p class="vacancy__description"><span>Werk aan AI-oplossingen die écht impact hebben.</span></p>
  </section>
</li>`

const detailHtml = `
<link rel="canonical" href="https://www.werkenvoornederland.nl/vacatures/data-scientist-RVB-2026-3254"/>
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "JobPosting",
  "title": "Data Scientist",
  "description": "Data Scientist in Den Haag voor 32-36 uur",
  "identifier": { "@type": "PropertyValue", "name": "Rijksvastgoedbedrijf", "value": "5508" },
  "datePosted": "2026-08-10",
  "validThrough": "2026-08-25",
  "employmentType": "TEMPORARY",
  "hiringOrganization": { "@type": "Organization", "name": " Rijksvastgoedbedrijf" },
  "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": "Den Haag", "postalCode": "2511CW", "addressCountry": "NL" } },
  "baseSalary": { "@type": "MonetaryAmount", "currency": "EUR", "value": { "@type": "QuantitativeValue", "minValue": 3496, "maxValue": 5535, "unitText": "MONTH" } }
}
</script>
<section id="dit_ga_je_doen_anchor"><h2>Dit ga je doen</h2><p>Ontwikkel innovatieve AI-oplossingen.</p><ul><li>Werk met Python &amp; SQL.</li></ul></section>
<section id="dit_krijg_je_anchor"><h2>Dit krijg je</h2><p>Schaal 10</p><p>32 - 36 uur</p></section>
<section id="dit_vragen_wij_anchor"><h2>Dit vragen wij</h2><p>Basiskennis van Python.</p></section>
<button onclick="applyExternClick('https://career.example/jobs/5508?source=wvnl&amp;lang=nl')">Solliciteren op externe site</button>`

describe("Werken voor Nederland page parsing", () => {
  test("Given a search card, when parsed, then shared and public-sector fields are returned", () => {
    const output = parseSearchPage(searchHtml)

    expect(output.total).toBe(1239)
    expect(output.results).toEqual([
      {
        id: "data-scientist-RVB-2026-3254",
        title: "Data Scientist",
        company: "Rijksvastgoedbedrijf & BZK",
        location: "Den Haag",
        date: "2026-08-10",
        url: "https://www.werkenvoornederland.nl/vacatures/data-scientist-RVB-2026-3254",
        deadline: "2026-08-25",
        hours: "32 - 36 uur",
        salary: "Schaal 10 €3.496 - €5.535 (bruto)",
        educationLevel: "Hbo",
        contractType: "Arbeidsovereenkomst voor bepaalde tijd",
        summary: "Werk aan AI-oplossingen die écht impact hebben.",
        sourceKind: "official",
        canonicalUrl: "https://www.werkenvoornederland.nl/vacatures/data-scientist-RVB-2026-3254",
      },
    ])
  })

  test("Given a detail page, when parsed, then structured metadata and readable sections are returned", () => {
    const detail = parseDetailPage(detailHtml)

    expect(detail).toMatchObject({
      id: "data-scientist-RVB-2026-3254",
      reference: "5508",
      title: "Data Scientist",
      company: "Rijksvastgoedbedrijf",
      location: "Den Haag",
      date: "2026-08-10",
      deadline: "2026-08-25",
      employmentType: "TEMPORARY",
      applyUrl: "https://career.example/jobs/5508?source=wvnl&lang=nl",
      salary: { currency: "EUR", min: 3496, max: 5535, unit: "MONTH" },
    })
    expect(detail.description).toContain("Dit ga je doen\nOntwikkel innovatieve AI-oplossingen.")
    expect(detail.description).toContain("Werk met Python & SQL.")
    expect(detail.description).toContain("Dit vragen wij\nBasiskennis van Python.")
  })

  test("Given a slug or canonical URL, when normalized, then the vacancy slug is returned", () => {
    expect(normalizeVacancyInput("data-scientist-RVB-2026-3254")).toBe("data-scientist-RVB-2026-3254")
    expect(normalizeVacancyInput("https://www.werkenvoornederland.nl/vacatures/data-scientist-RVB-2026-3254?x=1")).toBe(
      "data-scientist-RVB-2026-3254",
    )
    expect(normalizeVacancyInput("https://example.com/vacatures/nope")).toBeNull()
  })
})
