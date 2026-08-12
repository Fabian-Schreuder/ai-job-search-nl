import { join } from "node:path"

const CLI_PATH = join(import.meta.dir, "../src/cli.ts")

export type CLIResult = {
  readonly stdout: string
  readonly stderr: string
  readonly exitCode: number
}

export async function runCLI(args: readonly string[]): Promise<CLIResult> {
  const process = Bun.spawn(["bun", "run", CLI_PATH, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
    process.exited,
  ])
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode }
}
