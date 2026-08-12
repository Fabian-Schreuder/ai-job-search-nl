import { describe, expect, test } from "bun:test"
import { runCLI } from "./helpers.js"

function errorOutput(stderr: string): { readonly error?: string; readonly code?: string } {
  const parsed: unknown = JSON.parse(stderr)
  if (typeof parsed !== "object" || parsed === null) return {}
  const error = "error" in parsed && typeof parsed.error === "string" ? parsed.error : undefined
  const code = "code" in parsed && typeof parsed.code === "string" ? parsed.code : undefined
  return { ...(error === undefined ? {} : { error }), ...(code === undefined ? {} : { code }) }
}

describe("Werken voor Nederland CLI boundary", () => {
  test("Given search without a query, when invoked, then a structured missing-required error is returned", async () => {
    const result = await runCLI(["search"])

    expect(result.exitCode).toBe(1)
    expect(errorOutput(result.stderr)).toMatchObject({ code: "MISSING_REQUIRED" })
    expect(result.stdout).toBe("")
  })

  test("Given an invalid page, when invoked, then a structured bad-argument error is returned", async () => {
    const result = await runCLI(["search", "-q", "data", "--page", "zero"])

    expect(result.exitCode).toBe(1)
    expect(errorOutput(result.stderr)).toMatchObject({ code: "BAD_ARG" })
  })

  test("Given detail without an identifier, when invoked, then a structured missing-id error is returned", async () => {
    const result = await runCLI(["detail"])

    expect(result.exitCode).toBe(1)
    expect(errorOutput(result.stderr)).toMatchObject({ code: "NO_ID" })
  })
})
