import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export default async function AdminEntry() {
  redirect((await getAdminSession()) ? '/admin/workspace' : '/admin/login')
}
