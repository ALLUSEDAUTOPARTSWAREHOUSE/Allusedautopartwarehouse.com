export const ORDER_STATUS_STEPS = [
  { id: "pending", label: "Received" },
  { id: "reserved_pending_fitment", label: "Reserved" },
  { id: "confirmed", label: "Confirmed" },
  { id: "paid", label: "Paid" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
] as const

export type StatusHistoryEntry = {
  status: string
  note: string | null
  at: string
}

export function prettyOrderStatus(status: string) {
  return status.replace(/_/g, " ")
}

export function parseStatusHistory(value: unknown): StatusHistoryEntry[] {
  if (!Array.isArray(value)) return []
  return value.slice(-40).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return []
    const row = entry as Record<string, unknown>
    const status = typeof row.status === "string" ? row.status.slice(0, 64) : ""
    if (!status) return []
    const at = typeof row.at === "string" ? row.at : ""
    const note = typeof row.note === "string" ? row.note.slice(0, 1000) : null
    return [{ status, note, at }]
  })
}
