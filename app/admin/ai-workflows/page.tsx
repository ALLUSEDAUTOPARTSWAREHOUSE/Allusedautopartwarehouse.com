import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Activity, ArrowRight, Bot, BrainCircuit, CheckCircle2,
  Code2, GitBranch, Layers3, MessageSquareText, ShieldCheck, Sparkles,
  Workflow, Wrench,
} from 'lucide-react'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'AI Workflow Orchestrator | AUAPW Admin',
  robots: { index: false, follow: false },
}

const agents = [
  { number: '01', name: 'Researcher', role: 'Gather context and source evidence', icon: BrainCircuit },
  { number: '02', name: 'Planner', role: 'Break work into reviewable steps', icon: Workflow },
  { number: '03', name: 'Builder', role: 'Prepare code and implementation plans', icon: Code2 },
  { number: '04', name: 'Reviewer', role: 'Check risks and summarize changes', icon: ShieldCheck },
]

const workflowSteps = [
  { title: 'Request received', detail: 'Describe a store, support, or development task', icon: MessageSquareText },
  { title: 'AI assistant', detail: 'Analyze connected information and draft a plan', icon: Bot },
  { title: 'Human review', detail: 'Review proposed actions before changes are made', icon: ShieldCheck },
]

export default async function AdminAiWorkflowsPage() {
  if (!(await getAdminSession())) redirect('/admin/login')

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-7">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(249,115,22,.24),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,.22),transparent_50%)]" />
        <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.3fr_.7fr] lg:items-center lg:p-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1.5 text-xs font-semibold text-orange-200">
              <Sparkles className="size-3.5" /> AUAPW AI STUDIO
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">Coordinate AI work. Keep people in control.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              A single command surface for operational questions, development planning, and reviewed workflows across the AUAPW admin portal.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin/ai-chat" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-orange-400">
                Open AI operations assistant <ArrowRight className="size-4" />
              </Link>
              <Link href="/admin/development" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Developer tools <Code2 className="size-4" />
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold"><Activity className="size-4 text-orange-300" /> Workflow overview</div>
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-slate-300">Human-reviewed</span>
            </div>
            <div className="mt-5 space-y-3">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={step.title} className="relative flex gap-3 rounded-xl border border-white/10 bg-slate-900/80 p-3.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-400/10 text-orange-300"><Icon className="size-4" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{step.detail}</p>
                    </div>
                    {index < workflowSteps.length - 1 ? <GitBranch className="mt-1 size-4 shrink-0 text-slate-500" /> : <CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-400" />}
                  </div>
                )
              })}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">This page is the workflow hub. It does not claim background agents are running or execute deployments automatically.</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Specialized agent roles</h2>
            <p className="mt-1 text-sm text-muted-foreground">A clear structure for coordinating tasks, with review gates before consequential changes.</p>
          </div>
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex"><ShieldCheck className="size-4" /> Admin-only</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {agents.map(({ number, name, role, icon: Icon }) => (
            <article key={name} className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/30 hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></div>
                <span className="text-xs font-semibold text-muted-foreground">{number}</span>
              </div>
              <h3 className="mt-4 font-semibold">{name}</h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted"><Layers3 className="size-5" /></div>
            <div><h2 className="font-semibold">Operations intelligence</h2><p className="text-sm text-muted-foreground">Ask about connected store records</p></div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Use the existing operations assistant to investigate orders, quotes, chats, catalog issues, and feed history using available connected data.</p>
          <Link href="/admin/ai-chat" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Open operations assistant <ArrowRight className="size-4" /></Link>
        </article>
        <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted"><Wrench className="size-5" /></div>
            <div><h2 className="font-semibold">Build and maintain</h2><p className="text-sm text-muted-foreground">Development and integrations</p></div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Open the existing developer workspace for API and integration setup. Code changes and deployments should be reviewed and verified before release.</p>
          <Link href="/admin/development" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Open developer tools <ArrowRight className="size-4" /></Link>
        </article>
      </section>
      <p className="text-xs leading-5 text-muted-foreground">AI workflow hub · Access protected by the existing admin session. Customer data, secrets, production writes, and deployment actions remain subject to the app’s existing permissions and approval requirements.</p>
    </div>
  )
}
