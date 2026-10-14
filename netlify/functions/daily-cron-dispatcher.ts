import {
  DAILY_CRON_SCHEDULE,
  dispatchDailyWorker,
  resolveSchedulerConfig,
  safeRequestError,
} from "./daily-cron-core.ts"

export const config = { schedule: DAILY_CRON_SCHEDULE }

export default async function dailyCronDispatcher(): Promise<Response> {
  let schedulerConfig: ReturnType<typeof resolveSchedulerConfig>
  try {
    schedulerConfig = resolveSchedulerConfig(process.env)
  } catch (error) {
    console.error(
      "[daily-cron/dispatcher] invalid configuration:",
      error instanceof Error ? error.message : "configuration error",
    )
    return Response.json({ ok: false }, { status: 500 })
  }

  try {
    await dispatchDailyWorker(fetch, schedulerConfig.targetOrigin, schedulerConfig.secret)
    console.info("[daily-cron/dispatcher] background worker accepted the job")
    return Response.json({ ok: true, accepted: true })
  } catch (error) {
    console.error("[daily-cron/dispatcher] worker dispatch failed:", safeRequestError(error))
    return Response.json({ ok: false }, { status: 502 })
  }
}
