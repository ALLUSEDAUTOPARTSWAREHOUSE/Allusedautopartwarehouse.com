import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
export const dynamic = 'force-dynamic'
export default async function Workspace() {
  if (!(await getAdminSession())) redirect('/admin/login')
  return <div className="mx-auto max-w-7xl space-y-5">
    <h1 className="text-2xl font-bold">Social Accounts</h1>
    <p className="text-muted-foreground">Social networks are not connected. Account authorization, scheduling and publishing are not implemented. No posts are sent.</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Link href="/admin/marketing" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Back to Marketing →</Link></div>
  </div>
}
