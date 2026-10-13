'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', color: 'border-blue-500 text-blue-800 dark:text-blue-300', selected: 'bg-blue-100 dark:bg-blue-950' },
  { href: '/admin/orders', label: 'Orders', color: 'border-amber-500 text-amber-800 dark:text-amber-300', selected: 'bg-amber-100 dark:bg-amber-950' },
  { href: '/admin/quotes', label: 'Quotes', color: 'border-orange-500 text-orange-800 dark:text-orange-300', selected: 'bg-orange-100 dark:bg-orange-950' },
  { href: '/admin/customers', label: 'Customers', color: 'border-cyan-500 text-cyan-800 dark:text-cyan-300', selected: 'bg-cyan-100 dark:bg-cyan-950' },
  { href: '/admin/chats', label: 'Chats', color: 'border-teal-500 text-teal-800 dark:text-teal-300', selected: 'bg-teal-100 dark:bg-teal-950' },
  { href: '/admin/ai-chat', label: 'AI Chat', color: 'border-violet-500 text-violet-800 dark:text-violet-300', selected: 'bg-violet-100 dark:bg-violet-950' },
  { href: '/admin/merchant', label: 'Google Feed', color: 'border-emerald-500 text-emerald-800 dark:text-emerald-300', selected: 'bg-emerald-100 dark:bg-emerald-950' },
  { href: '/admin/products', label: 'Products', color: 'border-indigo-500 text-indigo-800 dark:text-indigo-300', selected: 'bg-indigo-100 dark:bg-indigo-950' },
  { href: '/admin/payments', label: 'Payments', color: 'border-lime-500 text-lime-800 dark:text-lime-300', selected: 'bg-lime-100 dark:bg-lime-950' },
  { href: '/admin/team', label: 'Team', color: 'border-pink-500 text-pink-800 dark:text-pink-300', selected: 'bg-pink-100 dark:bg-pink-950' },
  { href: '/admin/settings', label: 'Settings', color: 'border-slate-500 text-slate-800 dark:text-slate-300', selected: 'bg-slate-100 dark:bg-slate-950' },
] as const

/** One row that scrolls sideways on phones instead of squeezing each label into a column. */
export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1">
        {ADMIN_NAV.map(({ href, label, color, selected }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`block whitespace-nowrap rounded-md border-b-2 px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${color} ${
                  active
                    ? `${selected} font-semibold underline underline-offset-4`
                    : 'hover:bg-muted'
                }`}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
