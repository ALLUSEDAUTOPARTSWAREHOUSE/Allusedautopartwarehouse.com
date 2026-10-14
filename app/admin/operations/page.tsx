import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import { AdminOperationsClient } from '@/components/admin/admin-operations-client'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Sales & Store Operations | AUAPW Admin',
  description: 'Manage quote requests, orders, products, inventory and customer records.',
  robots: { index: false, follow: false },
}

export default async function AdminOperationsPage() {
  if (!await getAdminSession()) redirect('/admin/login')
  return <AdminOperationsClient />
}
