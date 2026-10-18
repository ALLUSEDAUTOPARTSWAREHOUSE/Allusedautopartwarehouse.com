import { getAdminSession } from '@/lib/admin-auth'
import { getDashboardMetrics } from '@/lib/admin-metrics'
import { countUnreadForAdmin } from '@/lib/live-chat'
import { checkEnvironment } from '@/lib/admin-health'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await getAdminSession())) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const [metrics, chats] = await Promise.allSettled([
    getDashboardMetrics(),
    countUnreadForAdmin(),
  ])
  return Response.json({
    checkedAt: new Date().toISOString(),
    metrics: metrics.status === 'fulfilled' ? { ...metrics.value, errors: metrics.value.errors.map(error => ({ section: error.section, message: 'Records unavailable' })) } : null,
    unreadConversations: chats.status === 'fulfilled' ? chats.value : null,
    missingRequiredConfiguration: checkEnvironment().filter(check => check.required && !check.set).map(check => check.name),
  }, { headers: { 'Cache-Control': 'private, no-store' } })
}
