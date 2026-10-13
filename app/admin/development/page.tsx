import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import { checkEnvironment } from '@/lib/admin-health'
import { IntegrationSetup } from '@/components/admin/integration-setup'
export const dynamic = 'force-dynamic'
export default async function Workspace() {
  if (!(await getAdminSession())) redirect('/admin/login')
  return <div className="mx-auto max-w-7xl space-y-5">
    <h1 className="text-2xl font-bold">Development & Settings</h1>
    <p className="text-muted-foreground">Manage existing settings and team records. A page builder and verified email-editing workflow are not implemented.</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Link href="/admin/settings" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Settings & system health →</Link>
<Link href="/admin/team" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Team directory →</Link>
<Link href="/admin/ai-chat" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">AI planning chat →</Link></div>
    <IntegrationSetup checks={checkEnvironment()} />
  </div>
}
