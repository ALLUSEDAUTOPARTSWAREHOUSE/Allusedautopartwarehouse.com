"use client"

import { useActionState } from "react"
import { UserRoundCheck, Loader2 } from "lucide-react"
import { saveFollowupAssignment, type FollowupActionState } from "@/app/admin/followup-actions"
import type { FollowupRecordType, FollowupStaffOption, FollowupAssignment } from "@/lib/followup-assignments"

const initial: FollowupActionState = { ok: false, message: "" }
const roleLabel = (role: string) => role === "sales_agent" ? "Sales" : role === "support_team" ? "Support" : "Other"

export function FollowupAssignmentSelect({
  recordType,
  recordId,
  staff,
  assignment,
  compact = false,
}: {
  recordType: FollowupRecordType
  recordId: string
  staff: FollowupStaffOption[]
  assignment: FollowupAssignment | null
  compact?: boolean
}) {
  const [state, action, pending] = useActionState(saveFollowupAssignment, initial)
  const currentIsSelectable = assignment && staff.some((member) => member.id === assignment.staffId)
  const selectDefault = currentIsSelectable ? assignment.staffId : ""

  return (
    <form action={action} className={compact ? "min-w-48 space-y-1" : "rounded-md border border-border p-3 space-y-2"}>
      <input type="hidden" name="recordType" value={recordType} />
      <input type="hidden" name="recordId" value={recordId} />
      <label className={compact ? "sr-only" : "block text-xs font-medium text-muted-foreground"} htmlFor={`assign-${recordType}-${recordId}`}>
        {compact ? "Assign sales/support owner" : "Assigned sales / support owner"}
      </label>
      {assignment && !currentIsSelectable ? (
        <p className="text-xs text-amber-600">Previously assigned to {assignment.staffName ?? "an unavailable staff member"} (inactive or removed). Select an active replacement.</p>
      ) : null}
      <div className={compact ? "flex items-center gap-2" : "flex flex-wrap items-center gap-2"}>
        <select
          id={`assign-${recordType}-${recordId}`}
          name="staffId"
          defaultValue={selectDefault}
          disabled={pending || staff.length === 0}
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-2 text-xs text-foreground disabled:opacity-60"
        >
          <option value="">Unassigned</option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>{member.name} · {roleLabel(member.role)}</option>
          ))}
        </select>
        <button type="submit" disabled={pending || staff.length === 0} className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2.5 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50">
          {pending ? <Loader2 className="size-3 animate-spin" /> : <UserRoundCheck className="size-3" />}
          {pending ? "Saving" : compact ? "Assign" : "Save assignment"}
        </button>
      </div>
      {staff.length === 0 ? <p className="text-xs text-muted-foreground">Add an active sales agent or support member in Team Directory first.</p> : null}
      {state.message ? <p role={state.ok ? "status" : "alert"} className={`text-xs ${state.ok ? "text-green-600" : "text-destructive"}`}>{state.message}</p> : null}
    </form>
  )
}
