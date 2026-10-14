import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminSession } from '@/lib/admin-auth'
import { TeamDirectoryClient } from '@/components/admin/team-directory-client'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Team Directory | Admin', description: 'Manage sales agents, support team, and developer team members' }
export default async function AdminTeamPage() {
  if (!await getAdminSession()) redirect('/admin/login')
  return <div><div className="mx-auto max-w-7xl px-5 pt-6"><Link href="/admin/team-access" className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Manage staff login access →</Link></div><TeamDirectoryClient /></div>
}
