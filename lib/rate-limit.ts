// In-memory sliding-window rate limiter. Best-effort per serverless instance;
// sufficient to curb casual abuse of paid endpoints without new infrastructure.
const buckets = new Map<string, number[]>()

const MAX_KEYS = 5000

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const windowStart = now - windowMs
  const timestamps = (buckets.get(key) ?? []).filter((t) => t > windowStart)

  if (timestamps.length >= limit) {
    const oldest = timestamps[0]
    buckets.set(key, timestamps)
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) }
  }

  timestamps.push(now)
  if (buckets.size >= MAX_KEYS && !buckets.has(key)) {
    // Evict stale keys to bound memory.
    for (const [k, v] of buckets) {
      if (v.every((t) => t <= windowStart)) buckets.delete(k)
    }
  }
  buckets.set(key, timestamps)
  return { ok: true, retryAfterSeconds: 0 }
}
