#!/usr/bin/env bun

import { runDetail } from "./commands/detail.js"
import { runSearch } from "./commands/search.js"
import { writeError } from "./http.js"
import type { OutputFormat } from "./types.js"

type FlagValue = string | boolean | undefined
type Flags = { readonly positional: readonly string[]; readonly values: Readonly<Record<string, FlagValue>> }

const HELP = `werkenvoornederland-cli — search public Dutch government vacancies

USAGE
  bun run src/cli.ts search --query "<keywords>" [flags]
  bun run src/cli.ts detail <slug|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords. Required.
  --location, -l <text>   Client-side location filter.
  --jobage <days>         Keep vacancies posted within N days.
  --page <n>              1-indexed page (20 results/page). Default: 1.
  --limit, -n <n>         Cap emitted results. Default: 20.
  --format <fmt>          json (default) | table | plain.

The official robots policy allows vacancy crawling and limits clients to 10 requests/second.
`

function parseFlags(arguments_: readonly string[]): Flags {
  const aliases: Readonly<Record<string, string>> = { q: "query", l: "location", n: "limit", h: "help" }
  const positional: string[] = []
  const values: Record<string, FlagValue> = {}
  for (let index = 0; index < arguments_.length; index++) {
    const argument = arguments_[index]
    if (!argument?.startsWith("-")) {
      if (argument) positional.push(argument)
      continue
    }
    const rawKey = argument.replace(/^-+/, "")
    const key = aliases[rawKey] ?? rawKey
    const next = arguments_[index + 1]
    if (!next || next.startsWith("-")) values[key] = true
    else {
      values[key] = next
      index++
    }
  }
  return { positional, values }
}

function textFlag(value: FlagValue): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function integerFlag(name: string, value: FlagValue, fallback: number, minimum: number): number | null {
  if (value === undefined) return fallback
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    writeError(`--${name} must be an integer greater than or equal to ${minimum}`, "BAD_ARG")
    return null
  }
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < minimum) {
    writeError(`--${name} must be an integer greater than or equal to ${minimum}`, "BAD_ARG")
    return null
  }
  return parsed
}

function formatFlag(value: FlagValue): OutputFormat | null {
  if (value === undefined) return "json"
  if (value === "json" || value === "table" || value === "plain") return value
  writeError("--format must be json, table, or plain", "BAD_ARG")
  return null
}

async function main(): Promise<number> {
  const flags = parseFlags(process.argv.slice(2))
  const command = flags.positional[0]
  if (!command || flags.values["help"] === true) {
    process.stdout.write(HELP)
    return command ? 0 : 1
  }
  if (command === "search") {
    const query = textFlag(flags.values["query"])
    if (!query) {
      writeError("--query/-q is required", "MISSING_REQUIRED")
      return 1
    }
    const page = integerFlag("page", flags.values["page"], 1, 1)
    const limit = integerFlag("limit", flags.values["limit"], 20, 1)
    const jobage = flags.values["jobage"] === undefined ? undefined : integerFlag("jobage", flags.values["jobage"], 0, 0)
    const format = formatFlag(flags.values["format"])
    if (page === null || limit === null || jobage === null || format === null) return 1
    const location = textFlag(flags.values["location"])
    return runSearch({
      query,
      ...(location === undefined ? {} : { location }),
      ...(jobage === undefined ? {} : { jobage }),
      page,
      limit,
      format,
    })
  }
  if (command === "detail") {
    const id = flags.positional[1]
    if (!id) {
      writeError("detail requires a <slug|url>", "NO_ID")
      return 1
    }
    const format = formatFlag(flags.values["format"])
    if (format === null) return 1
    if (format === "table") {
      writeError("detail --format must be json or plain", "BAD_ARG")
      return 1
    }
    return runDetail({ id, format })
  }
  writeError(`unknown command "${command}"`, "BAD_CMD")
  return 1
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    writeError(error instanceof Error ? error.message : String(error), "INTERNAL_ERROR")
    process.exit(1)
  })
