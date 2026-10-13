import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import { listOrders, listQuoteLeads } from '@/lib/followup'
import { StatusBadge } from '@/components/admin/status-badge'
export const dynamic = 'force-dynamic'
export default async function Workspace() {
  if (!(await getAdminSession())) redirect('/admin/login')
  const [orders, quotes] = await Promise.allSettled([listOrders(undefined, undefined, 50), listQuoteLeads(undefined, undefined, 50)])
  return <div className="mx-auto max-w-7xl space-y-5">
    <h1 className="text-2xl font-bold">Sales & Support</h1>
    <p className="text-muted-foreground">Manage customer relationships and sales workflows.</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Link href="/admin/customers" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Customers →</Link>
<Link href="/admin/chats" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Customer chats →</Link>
<Link href="/admin/quotes" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Leads & quotes →</Link>
<Link href="/admin/orders" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Orders →</Link>
<Link href="/admin/payments" className="rounded-xl border bg-card p-5 font-semibold hover:bg-muted focus-visible:outline">Payments →</Link></div>
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-xl font-semibold">Recent product orders</h2>
      <p className="mb-3 text-xs text-muted-foreground">Latest 50 records. Use Orders to search and update status. Staff assignment is not implemented.</p>
      {orders.status === 'rejected' ? <p role="alert">Orders could not be loaded. Check database readiness in Settings.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr>{['Order', 'Customer', 'Products', 'Status', 'Total', 'Created', 'Updated', 'Actions'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead>
        <tbody>{orders.value.map(order => <tr key={order.id}>
          <td className="p-3">{order.orderNumber}</td><td className="p-3">{order.customerName || 'Not provided'}<div className="text-xs">{order.customerEmail}</div></td>
          <td className="p-3">{order.items.map(item => item.name).join(', ')}</td><td className="p-3"><StatusBadge status={order.status} /></td>
          <td className="p-3">${order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td><td className="p-3">{order.createdAt}</td><td className="p-3">{order.updatedAt}</td>
          <td className="p-3"><Link className="text-primary underline" href={`/admin/orders?q=${encodeURIComponent(order.orderNumber)}`}>Manage order</Link></td>
        </tr>)}</tbody>
      </table>{!orders.value.length && <p className="p-3">No orders found.</p>}</div>}
    </section>
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-xl font-semibold">Recent leads & quote requests</h2>
      <p className="mb-3 text-xs text-muted-foreground">Latest 50 requests. Customer submissions are shown from existing saved records.</p>
      {quotes.status === 'rejected' ? <p role="alert">Quotes could not be loaded. Check database readiness in Settings.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr>{['Customer', 'Vehicle / part', 'Status', 'Quote amount', 'Created', 'Updated', 'Actions'].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead>
        <tbody>{quotes.value.map(lead => <tr key={lead.id}>
          <td className="p-3">{lead.fullName}<div className="text-xs">{lead.email}</div></td><td className="p-3">{[lead.year, lead.make, lead.model, lead.partType].filter(Boolean).join(' ')}</td>
          <td className="p-3"><StatusBadge status={lead.status} /></td><td className="p-3">{lead.quoteAmount === null ? 'Not quoted' : `$${lead.quoteAmount.toLocaleString()}`}</td>
          <td className="p-3">{lead.createdAt}</td><td className="p-3">{lead.updatedAt}</td><td className="p-3"><Link className="text-primary underline" href={`/admin/quotes?q=${encodeURIComponent(lead.email || lead.fullName)}`}>Manage quote</Link></td>
        </tr>)}</tbody>
      </table>{!quotes.value.length && <p className="p-3">No quote requests found.</p>}</div>}
    </section>
    <section className="rounded-xl border p-4"><h2 className="font-semibold">Team access</h2><p className="text-sm text-muted-foreground">Directory records do not send invitations or grant access. Individual staff login, invitation delivery and assignment require a separate access workflow; do not share the admin password.</p></section>
  </div>
}
