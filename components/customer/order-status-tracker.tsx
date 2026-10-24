import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ORDER_STATUS_STEPS, prettyOrderStatus, type StatusHistoryEntry } from "@/lib/order-status"
import { cn } from "@/lib/utils"

function when(value: string | null) {
  return value
    ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : "—"
}

export function OrderStatusTracker({
  status,
  updatedAt,
  customerNote,
  history,
}: {
  status: string
  updatedAt: string | null
  customerNote: string | null
  history: StatusHistoryEntry[]
}) {
  const currentIndex = ORDER_STATUS_STEPS.findIndex((step) => step.id === status)
  const cancelled = status === "cancelled"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant={cancelled ? "destructive" : "default"} className="capitalize">
          {prettyOrderStatus(status)}
        </Badge>
        <p className="text-xs text-muted-foreground">Updated {when(updatedAt)}</p>
      </div>

      {cancelled ? (
        <p className="text-sm text-muted-foreground">This order was cancelled. If you were charged, the refund goes back to your original payment method.</p>
      ) : (
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {ORDER_STATUS_STEPS.map((step, index) => {
            const complete = currentIndex >= 0 && index < currentIndex
            const current = step.id === status
            return (
              <li
                key={step.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs",
                  current
                    ? "border-primary bg-primary/10 text-foreground"
                    : complete
                      ? "border-border bg-muted/40 text-foreground"
                      : "border-border text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                    current || complete
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                >
                  {complete ? <Check className="size-3" aria-hidden="true" /> : index + 1}
                </span>
                <span className="font-medium">{step.label}</span>
              </li>
            )
          })}
        </ol>
      )}

      {customerNote ? (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Latest update from AUAPW</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{customerNote}</p>
        </div>
      ) : null}

      {history.length > 0 ? (
        <ol className="flex flex-col gap-2 border-l border-border pl-4">
          {[...history].reverse().slice(0, 8).map((entry, index) => (
            <li key={`${entry.at}-${entry.status}-${index}`} className="flex flex-col gap-0.5">
              <p className="text-sm font-medium capitalize text-foreground">{prettyOrderStatus(entry.status)}</p>
              <p className="text-xs text-muted-foreground">{when(entry.at)}</p>
              {entry.note ? <p className="text-sm text-muted-foreground">{entry.note}</p> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
