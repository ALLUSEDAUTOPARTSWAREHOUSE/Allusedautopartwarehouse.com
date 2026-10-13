import { redirect } from 'next/navigation'
import { Activity, CheckCircle2, Clock3, Database, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { getAdminSession } from '@/lib/admin-auth'
import { AssistantPanel } from '@/components/admin/assistant-panel'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'AI Operations Agent | AUAPW Admin', robots: { index: false } }

const capabilities = [
  {
    icon: Activity,
    title: 'Live operations overview',
    text: 'Summarize orders, quotes, unread chats, required configuration, database readiness, and Google feed eligibility from connected records.',
  },
  {
    icon: Clock3,
    title: 'Priority work queue',
    text: 'Surface recently pending orders, unworked quote requests, and unread chats using recorded timestamps and clearly labeled sample limits.',
  },
  {
    icon: Truck,
    title: 'Merchant feed intelligence',
    text: 'Review product issues by brand and compare daily Google feed snapshots to spot drops and saved alerts.',
  },
  {
    icon: Database,
    title: 'Catalog and record search',
    text: 'Search products by brand, text, and feed issue; look up order numbers, quote records, and open conversations.',
  },
]

export default async function AdminAiChatPage() {
  if (!(await getAdminSession())) redirect('/admin/login')

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" aria-hidden="true" />
          AI OPERATIONS COPILOT
        </div>
        <h1 className="text-3xl font-bold tracking-tight">AI Agent</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          Ask questions about real store operations. The agent can query connected records, summarize risks, and propose next steps instead of guessing. It cannot send customer replies or deploy code.
        </p>
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          All access stays behind admin authentication. Catalog write actions require an explicit approval in the conversation. Secrets are not exposed to the agent.
        </p>
      </header>

      <section aria-label="Agent capabilities" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {capabilities.map(({ icon: Icon, title, text }) => (
          <article key={title} className="rounded-xl border border-border bg-card p-4">
            <Icon className="mb-3 size-5 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
          </article>
        ))}
      </section>

      <section className="space-y-2" aria-label="Operations assistant">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="size-4 text-green-600" aria-hidden="true" />
          Connected data is queried on demand; overview and feed-history responses include their source timestamps when available.
        </div>
        <AssistantPanel layout="full" />
      </section>
    </div>
  )
}
