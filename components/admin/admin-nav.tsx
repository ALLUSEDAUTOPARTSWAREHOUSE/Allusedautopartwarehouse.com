'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/quotes', label: 'Quotes' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/chats', label: 'Chats' },
  { href: '/admin/ai-chat', label: 'AI Chat' },
  { href: '/admin/merchant', label: 'Google Feed' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/team', label: 'Team' },
  { href: '/admin/settings', label: 'Settings' },
] as const

/** One row that scrolls sideways on phones instead of squeezing each label into a column. */
export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1">
        {ADMIN_NAV.map(({ href, label }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`block whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-primary/15 font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
