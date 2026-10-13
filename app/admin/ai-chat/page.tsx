import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import { AdminAiChat } from '@/components/admin/ai-chat'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'AI Chat | AUAPW Admin', robots: { index: false } }

export default async function AdminAiChatPage() {
  if (!(await getAdminSession())) redirect('/admin/login')
  return <AdminAiChat />
}
