import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import { getRecordActivityReport } from '@/lib/record-activity'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Team activity | AUAPW Admin', robots: { index: false, follow: false } }

function when(value: unknown) {
  if (!value) return 'Not recorded'
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isFinite(date.getTime())
    ? date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : 'Unavailable'
}

const actionLabels: Record<string, string> = {
  record_opened: 'Record opened',
  outcome_reported: 'Workflow outcome reported',
  source_status_saved: 'Source status saved',
}

export default async function ActivityPage() {
  if (!(await getAdminSession())) redirect('/admin/login')
  const report = await getRecordActivityReport().catch(() => null)

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Team activity & recorded outcomes</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Who opened a record, when it was opened, the reported outcome, and confirmed application saves.
          Times are shown in India Standard Time (Asia/Kolkata).
        </p>
      </header>

      {!report ? (
        <p role="alert" className="rounded-lg border border-destructive p-4 text-sm leading-6">
          Activity storage is unavailable. Apply the record-activity migration and check database access.
          No activity totals could be confirmed.
        </p>
      ) : (
        <>
          <dl className="grid gap-4 rounded-lg border border-border bg-muted/20 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Measurement start — earliest recorded event</dt>
              <dd className="mt-1 font-medium">
                {report.summary.measurement_started_at ? when(report.summary.measurement_started_at) : 'No events recorded yet'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Report checked at</dt>
              <dd className="mt-1 font-medium">{when(report.checkedAt)}</dd>
            </div>
          </dl>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Received events', report.summary.events],
              ['Record opens', report.summary.opens],
              ['Source status saves', report.summary.saved_changes],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{Number(value).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <p className="rounded-lg bg-muted p-3 text-xs leading-5">{report.note}</p>

          <section aria-labelledby="activity-by-person">
            <h2 id="activity-by-person" className="mb-3 text-lg font-semibold">By person or signed-in account</h2>
            <p className="mb-3 text-xs leading-5 text-muted-foreground">
              Up to {report.limits.agents} accounts with the most recent activity. Workflow outcome columns count distinct
              records reported by each account across recorded history; they do not change the source status.
            </p>
            {report.byAgent.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                No account activity has been recorded yet. Accounts appear after a record open, workflow report, or source status save.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <caption className="sr-only">Recorded activity totals by person or signed-in account</caption>
                  <thead className="bg-muted/30">
                    <tr>
                      {['Person / account', 'Role', 'Opens', 'Confirmed records', 'Unable records', 'Follow-up records', 'Last activity'].map(label => (
                        <th key={label} scope="col" className="border-b border-border p-3 text-xs font-semibold">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.byAgent.map(row => (
                      <tr key={row.actor_id} className="border-b border-border last:border-0">
                        <th scope="row" className="p-3 font-medium">{row.actor_name}</th>
                        <td className="p-3">{row.actor_role}</td>
                        <td className="p-3 tabular-nums">{row.opens}</td>
                        <td className="p-3 tabular-nums">{row.confirmed}</td>
                        <td className="p-3 tabular-nums">{row.unable}</td>
                        <td className="p-3 tabular-nums">{row.follow_up}</td>
                        <td className="whitespace-nowrap p-3">{when(row.last_activity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section aria-labelledby="activity-events">
            <h2 id="activity-events" className="mb-3 text-lg font-semibold">Recent recorded events</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Showing {report.events.length} of up to {report.limits.events} latest events. Opening a record and reporting an outcome are separate events.
            </p>
            {report.events.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                No events have been recorded since tracking was enabled.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[1000px] text-left text-xs">
                  <caption className="sr-only">Latest recorded events, source status snapshots, and reported evidence</caption>
                  <thead className="bg-muted/30">
                    <tr>
                      {['Server time', 'Person / account', 'Record', 'Action', 'Reported outcome', 'Source status at event', 'Evidence / note'].map(label => (
                        <th key={label} scope="col" className="border-b border-border p-3 font-semibold">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.events.map(row => (
                      <tr key={row.id} className="border-b border-border align-top last:border-0">
                        <td className="whitespace-nowrap p-3">{when(row.created_at)}</td>
                        <td className="p-3">
                          <span className="block font-medium">{row.actor_name}</span>
                          <span className="text-muted-foreground">{row.actor_role}</span>
                        </td>
                        <td className="p-3">
                          <Link
                            className="break-all text-primary underline"
                            href={row.record_type === 'order'
                              ? `/admin/orders?recordId=${encodeURIComponent(row.record_id)}`
                              : `/admin/quotes?recordId=${encodeURIComponent(row.record_id)}`}
                          >
                            {row.record_type} {row.record_id}
                          </Link>
                        </td>
                        <td className="p-3">{actionLabels[row.action] ?? row.action}</td>
                        <td className="p-3">{row.action === 'outcome_reported' ? row.outcome?.replaceAll('_', ' ') || '—' : '—'}</td>
                        <td className="p-3">{row.source_status || '—'}</td>
                        <td className="max-w-sm whitespace-pre-wrap break-words p-3">{row.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
      <Link href="/admin/workspace" className="inline-block text-sm text-primary underline">Return to the admin workspace</Link>
    </main>
  )
}
