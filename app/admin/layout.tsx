import { ReactNode } from 'react'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { getAdminSession } from '@/lib/admin-auth'
import { AssistantPopup } from '@/components/admin/assistant-popup'
import { AdminNav } from '@/components/admin/admin-nav'

export const metadata = {
  title: 'Admin Portal | AUAPW',
  description: 'AUAPW Admin Dashboard',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession()

  return (
    <div className="admin-shell min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/30 bg-card/95 backdrop-blur-sm">
        <div className="flex flex-col gap-2 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href={session ? '/admin/dashboard' : '/admin'} className="text-xl font-bold text-primary">
              AUAPW Admin
            </Link>
            {session ? (
              <div className="flex items-center gap-3 lg:hidden">
                <LogoutButton />
              </div>
            ) : null}
          </div>

          {session ? (
            <div className="flex min-w-0 items-center gap-4">
              <AdminNav />
              <div className="hidden items-center gap-3 lg:flex">
                <span className="max-w-48 truncate text-xs text-muted-foreground" title={session.email}>
                  {session.email}
                </span>
                <LogoutButton />
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      {session ? <AssistantPopup /> : null}
    </div>
  )
}

function LogoutButton() {
  return (
    <form action="/api/admin/auth/logout" method="POST">
      <button
        type="submit"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Logout
      </button>
    </form>
  )
}
