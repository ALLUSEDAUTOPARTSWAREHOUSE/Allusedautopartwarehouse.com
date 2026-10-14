'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, Users, MessageSquare, FileText, Settings, Code, Megaphone, KeyRound, Star, Share2, Bot, CreditCard, PanelsTopLeft } from 'lucide-react'

const GROUPS = [
  { title: 'Overview', links: [
    { href: '/admin/workspace', label: 'Unified workspace', icon: PanelsTopLeft },
    { href: '/admin/dashboard', label: 'Control center', icon: LayoutDashboard },
  ] },
  { title: 'Products', links: [{ href: '/admin/products', label: 'Brands & products', icon: Package }] },
  { title: 'Sales & support', links: [
    { href: '/admin/sales', label: 'Sales dashboard', icon: ShoppingCart },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { href: '/admin/quotes', label: 'Leads & quotes', icon: FileText },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/chats', label: 'Customer chats', icon: MessageSquare },
    { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  ] },
  { title: 'Store operations', links: [
    { href: '/admin/settings', label: 'Policies & system health', icon: Settings },
    { href: '/admin/team', label: 'Team & permissions', icon: Users },
  ] },
  { title: 'Development', links: [
    { href: '/admin/development', label: 'API & setup', icon: Code },
    { href: '/admin/security', label: 'Password management', icon: KeyRound },
    { href: '/admin/ai-chat', label: 'AI planning', icon: Bot },
  ] },
  { title: 'Marketing', links: [
    { href: '/admin/marketing', label: 'Marketing dashboard', icon: Megaphone },
    { href: '/admin/merchant', label: 'Google Merchant', icon: Package },
    { href: '/admin/marketing/reviews', label: 'Google Reviews', icon: Star },
    { href: '/admin/marketing/social', label: 'Social accounts', icon: Share2 },
  ] },
]

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname()
  const exact = GROUPS.some(group => group.links.some(link => link.href === pathname))
  return <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border/40 bg-card lg:flex">
    <Link href="/admin/dashboard" className="border-b border-border/40 px-5 py-6 text-lg font-bold text-primary">AUAPW · Workspace</Link>
    <nav aria-label="Admin sidebar" className="flex-1 overflow-y-auto px-3 py-4">
      {GROUPS.map(group => <section key={group.title} className="mb-5">
        <h2 className="mb-2 px-3 text-[10px] font-semibold tracking-widest text-muted-foreground">{group.title}</h2>
        <ul className="space-y-1">{group.links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (!exact && pathname?.startsWith(`${href}/`))
          return <li key={href}><Link href={href} aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 ${active ? 'border-blue-500/30 bg-blue-500/10 font-semibold text-blue-800 dark:text-blue-300' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
            <Icon className="size-4 shrink-0" aria-hidden="true" />{label}
          </Link></li>
        })}</ul>
      </section>)}
    </nav>
    <div className="border-t border-border/40 p-4"><p className="text-xs font-semibold">Administrator</p><p className="mt-1 truncate text-xs text-muted-foreground" title={email}>{email}</p></div>
  </aside>
}
