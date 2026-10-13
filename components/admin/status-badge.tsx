const TONES: Record<string, string> = {
  new: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
  pending: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
  reserved_pending_fitment: "bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30",
  contacted: "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30",
  confirmed: "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30",
  quoted: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30",
  paid: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30",
  shipped: "bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30",
  won: "bg-green-500/15 text-green-800 dark:text-green-300 border-green-500/30",
  delivered: "bg-green-500/15 text-green-800 dark:text-green-300 border-green-500/30",
  lost: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
        TONES[status] ?? "bg-muted text-muted-foreground border-border"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  )
}
