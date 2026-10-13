import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
export const dynamic = 'force-dynamic'
export default async function Workspace() {
  if (!(await getAdminSession())) redirect('/admin/login')
  return <div className="mx-auto max-w-7xl space-y-5">
    <h1 className="text-2xl font-bold">Sales & Support</h1>
    <p className="text-muted-foreground">Manage customer relationships and sales workflows.</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Link href="/admin/customers" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Customers →</Link>
<Link href="/admin/chats" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Customer chats →</Link>
<Link href="/admin/quotes" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Leads & quotes →</Link>
<Link href="/admin/orders" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Orders →</Link>
<Link href="/admin/payments" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Payments →</Link></div>
  </div>
}
