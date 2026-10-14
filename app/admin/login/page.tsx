import { redirect } from 'next/navigation'
import { AdminLoginForm } from '@/components/admin/admin-login-form'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect('/admin/workspace')
  return <AdminLoginForm />
}
