import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bot } from 'lucide-react'
import { getAdminSession } from '@/lib/admin-auth'
import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client'
import { AssistantPanel } from '@/components/admin/assistant-panel'

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
      <details className="group mx-auto w-full max-w-7xl rounded-lg border border-border bg-card">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-semibold text-foreground">
          <Bot className="h-4 w-4 text-primary" aria-hidden="true" />
          Ask the store assistant
          <span className="font-normal text-muted-foreground">
            — questions about the feed, catalog, orders, quotes and chats
          </span>
        </summary>
        <div className="border-t border-border p-4">
          <AssistantPanel />
        </div>
      </details>
    </div>
  )
}
