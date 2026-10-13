import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
export const dynamic = 'force-dynamic'
export default async function Workspace() {
  if (!(await getAdminSession())) redirect('/admin/login')
  return <div className="mx-auto max-w-7xl space-y-5">
    <h1 className="text-2xl font-bold">Marketing</h1>
    <p className="text-muted-foreground">Google Merchant monitoring is available. Direct account uploads and social publishing require integrations that are not implemented yet.</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Link href="/admin/merchant" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Google Merchant feed →</Link>
<Link href="/admin/marketing/reviews" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Google Reviews →</Link>
<Link href="/admin/marketing/social" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Social accounts →</Link></div>
  </div>
}
