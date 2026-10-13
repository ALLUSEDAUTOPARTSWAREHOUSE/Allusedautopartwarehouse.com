import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const session = await getAdminSession()

  if (!session) {
    redirect('/admin/login')
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminDashboardClient />
      <Link href="/admin/ai-chat" className="mx-auto w-full max-w-7xl rounded-lg border border-border bg-card p-5">
        <span className="font-semibold">AI Agent — Support &amp; Development</span>
        <p className="text-sm text-muted-foreground">Generate customer reply drafts, FAQs, feature plans and code suggestions for your review.</p>
      </Link>
    </div>
  )
}
