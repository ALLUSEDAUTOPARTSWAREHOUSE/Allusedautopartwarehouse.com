import { redirect } from 'next/navigation'
import { desc } from 'drizzle-orm'
import { getAdminSession } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { staffMembers } from '@/lib/db/schema'
import { TeamAccessClient } from '@/components/admin/team-access-client'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Team Login Access | Admin' }
export default async function TeamAccessPage() {
  if (!await getAdminSession()) redirect('/admin/login')
  const members = await db.select({ id: staffMembers.id, name: staffMembers.name, email: staffMembers.email, role: staffMembers.role, status: staffMembers.status }).from(staffMembers).orderBy(desc(staffMembers.createdAt))
  return <TeamAccessClient members={members} />
}
