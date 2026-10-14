import {
  hasValidCronAuthorization,
  resolveSchedulerConfig,
  runDailyRoute,
  safeRequestError,
} from "./daily-cron-core.ts"

export const config = { background: true }

export default async function dailyCronWorker(request: Request): Promise<Response> {
  if (!hasValidCronAuthorization(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 })
  }
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 })

  let schedulerConfig: ReturnType<typeof resolveSchedulerConfig>
  try {
    schedulerConfig = resolveSchedulerConfig(process.env)
  } catch (error) {
    console.error(
      "[daily-cron/worker] invalid configuration:",
      error instanceof Error ? error.message : "configuration error",
    )
    return new Response(null, { status: 200 })
  }

  try {
    await runDailyRoute(fetch, schedulerConfig.targetOrigin, schedulerConfig.secret)
    console.info("[daily-cron/worker] daily route completed successfully")
  } catch (error) {
    console.error("[daily-cron/worker] daily route failed:", safeRequestError(error))
  }

  return new Response(null, { status: 200 })
}
