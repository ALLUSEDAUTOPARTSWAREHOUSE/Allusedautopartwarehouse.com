import { timingSafeEqual } from "node:crypto"

export const DAILY_CRON_SCHEDULE = "5 13 * * *"
export const DISPATCH_TIMEOUT_MS = 8_000
export const DAILY_ROUTE_TIMEOUT_MS = 330_000

type Environment = Record<string, string | undefined>

function parseHttpsOrigin(value: string | undefined, name: string): string {
  if (!value || value !== value.trim()) throw new Error(`${name} is missing or invalid`)

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${name} is missing or invalid`)
  }

  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(`${name} must be an HTTPS origin without a path`)
  }

  return parsed.origin
}

export function resolveSchedulerConfig(environment: Environment) {
  const secret = environment.CRON_SECRET
  if (!secret || !secret.trim()) throw new Error("CRON_SECRET is not configured")

  const targetOrigin = parseHttpsOrigin(environment.CRON_TARGET_ORIGIN, "CRON_TARGET_ORIGIN")
  const netlifyOrigin = parseHttpsOrigin(environment.URL, "Netlify URL")
  if (targetOrigin !== netlifyOrigin) {
    throw new Error("CRON_TARGET_ORIGIN must match the Netlify production URL")
  }

  const hostname = new URL(targetOrigin).hostname
  if (
    hostname.endsWith(".netlify.app") &&
    (hostname.slice(0, -".netlify.app".length).includes("--") ||
      /^deploy-preview-\d+\./.test(hostname))
  ) {
    throw new Error("Netlify deploy-preview URLs cannot be cron targets")
  }

  return { secret, targetOrigin }
}

export function hasValidCronAuthorization(header: string | null, secret: string | undefined): boolean {
  if (!secret || !secret.trim()) return false
  const provided = Buffer.from(header ?? "")
  const expected = Buffer.from(["Bearer", secret].join(" "))
  return provided.length === expected.length && timingSafeEqual(provided, expected)
}

export async function dispatchDailyWorker(
  fetcher: typeof fetch,
  targetOrigin: string,
  secret: string,
): Promise<void> {
  const response = await fetcher(new URL("/.netlify/functions/daily-cron-worker", targetOrigin), {
    method: "POST",
    headers: { authorization: ["Bearer", secret].join(" ") },
    redirect: "error",
    signal: AbortSignal.timeout(DISPATCH_TIMEOUT_MS),
  })

  if (response.status !== 202) {
    throw new Error(`Background worker dispatch was not accepted (HTTP ${response.status})`)
  }
}

export async function runDailyRoute(
  fetcher: typeof fetch,
  targetOrigin: string,
  secret: string,
): Promise<void> {
  const response = await fetcher(new URL("/api/cron/daily", targetOrigin), {
    method: "GET",
    headers: { authorization: ["Bearer", secret].join(" ") },
    redirect: "error",
    signal: AbortSignal.timeout(DAILY_ROUTE_TIMEOUT_MS),
  })

  if (!response.ok) throw new Error(`Daily cron endpoint returned HTTP ${response.status}`)

  let result: unknown
  try {
    result = await response.json()
  } catch (error) {
    if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
      throw error
    }
    throw new Error("Daily cron endpoint returned an invalid response")
  }

  if (!result || typeof result !== "object" || !("ok" in result) || result.ok !== true) {
    throw new Error("Daily cron endpoint did not confirm success")
  }
}

export function safeRequestError(error: unknown): string {
  if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
    return "request timed out"
  }
  if (error instanceof Error && /^(Background worker dispatch|Daily cron endpoint)/.test(error.message)) {
    return error.message
  }
  return "network request failed"
}
