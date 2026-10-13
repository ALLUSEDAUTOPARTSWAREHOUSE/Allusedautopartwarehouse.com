import { getAdminSession } from '@/lib/admin-auth'
import { countByStatus, listOrders, listQuoteLeads } from '@/lib/followup'
import { checkEnvironment } from '@/lib/admin-health'

export async function GET() {
  if (!(await getAdminSession())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const [orders, quotes, orderCounts, quoteCounts] = await Promise.allSettled([
    listOrders(undefined, undefined, 5), listQuoteLeads(undefined, undefined, 5), countByStatus('orders'), countByStatus('leads'),
  ])
  return Response.json({
    checkedAt: new Date().toISOString(),
    orders: orders.status === 'fulfilled' ? orders.value.map(order => ({ number: order.orderNumber, status: order.status, updatedAt: order.updatedAt })) : null,
    quotes: quotes.status === 'fulfilled' ? quotes.value.map(lead => ({ id: lead.id, status: lead.status, updatedAt: lead.updatedAt })) : null,
    orderCounts: orderCounts.status === 'fulfilled' ? orderCounts.value : null,
    quoteCounts: quoteCounts.status === 'fulfilled' ? quoteCounts.value : null,
    missingConfiguration: checkEnvironment().filter(check => !check.set).map(check => check.name),
  }, { headers: { 'Cache-Control': 'private, no-store' } })
}
