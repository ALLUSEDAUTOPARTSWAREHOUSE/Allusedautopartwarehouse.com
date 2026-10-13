import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import { Facebook, Instagram, Youtube, Linkedin, Share2, ShieldCheck, Settings2, ArrowUpRight } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Social Account Center | AUAPW Admin', robots: { index: false } }

const platforms = [
  { name: 'Facebook Pages', vars: ['META_APP_ID', 'META_APP_SECRET', 'META_ACCESS_TOKEN'], purpose: 'Page connection, content publishing and page insights', icon: Facebook },
  { name: 'Instagram Business', vars: ['META_APP_ID', 'META_APP_SECRET', 'META_ACCESS_TOKEN'], purpose: 'Business account publishing and insights through Meta APIs', icon: Instagram },
  { name: 'YouTube', vars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN'], purpose: 'Channel connection and authorized publishing workflows', icon: Youtube },
  { name: 'LinkedIn', vars: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_ACCESS_TOKEN'], purpose: 'Organization posts and account management', icon: Linkedin },
]

export default async function SocialAccountsPage() {
  if (!(await getAdminSession())) redirect('/admin/login')
  return <div className="mx-auto max-w-7xl space-y-6">
    <header className="rounded-2xl border bg-card p-6">
      <p className="text-xs font-semibold tracking-widest text-primary">MARKETING WORKSPACE</p>
      <h1 className="mt-2 text-3xl font-bold">Social account center</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Keep social platforms organized here. Each platform needs OAuth authorization, server-side token storage, permission checks and testing before this site can publish or read insights. This screen does not claim any account is connected.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/admin/marketing" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted">Marketing overview</Link>
        <Link href="/admin/development" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Settings2 className="size-4" /> API setup <ArrowUpRight className="size-4" /></Link>
      </div>
    </header>
    <section className="grid gap-4 md:grid-cols-2">
      {platforms.map(({ name, vars, purpose, icon: Icon }) => <article key={name} className="rounded-2xl border bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-muted p-3"><Icon className="size-5" /></div>
          <div className="min-w-0 flex-1"><h2 className="font-semibold">{name}</h2><p className="mt-1 text-sm text-muted-foreground">{purpose}</p></div>
          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-800 dark:text-amber-300">Not connected</span>
        </div>
        <div className="mt-4 rounded-lg border border-dashed p-3">
          <p className="text-xs font-semibold text-muted-foreground">Environment variable names needed</p>
          <ul className="mt-2 flex flex-wrap gap-2">{vars.map(v=><li key={v}><code className="rounded bg-muted px-2 py-1 text-xs">{v}</code></li>)}</ul>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">These names are setup guidance only; actual credentials must be created with the provider and stored in Vercel. Do not paste secrets into AI chat or this page.</p>
      </article>)}
    </section>
    <section className="flex items-start gap-3 rounded-xl border bg-muted/20 p-5">
      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
      <div><h2 className="font-semibold">Safe connection workflow</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Choose the platform, create or authorize its developer application, add credentials to Vercel Environment Variables, then implement and test the OAuth callback and permissions. Publishing should require a preview and an explicit publish action.</p><Link href="/admin/ai-chat" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><Share2 className="size-4" /> Ask the AI assistant to plan an integration <ArrowUpRight className="size-4" /></Link></div>
    </section>
  </div>
}
