import { redirect } from 'next/navigation'
import { getStaffSession } from '@/lib/staff-auth'
export const dynamic = 'force-dynamic'
export default async function SalesWorkspace() {
  const staff = await getStaffSession()
  if (!staff) redirect('/staff/login')
  if (staff.role !== 'sales_agent') redirect(staff.role === 'support_team' ? '/staff/support' : '/staff/developer')
  return <main className="mx-auto max-w-6xl px-5 py-10"><p className="text-sm text-muted-foreground">AUAPW · Sales workspace</p><h1 className="mt-2 text-3xl font-bold">Welcome, {staff.name}</h1><p className="mt-2 text-muted-foreground">Sales Agent · {staff.email}</p><section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[{title:'Quote requests',desc:'Sales work queue for customer part requests.'},{title:'Orders',desc:'Order follow-up and customer purchase workflow.'},{title:'Customer follow-ups',desc:'Customer contact and lead follow-up workflow.'}].map(item=><article key={item.title} className="rounded-2xl border border-border bg-card p-6"><h2 className="font-semibold">{item.title}</h2><p className="mt-2 text-sm text-muted-foreground">{item.desc}</p></article>)}</section><p className="mt-6 text-sm text-muted-foreground">Your staff session is separate from administrator and customer sessions.</p><form action={async()=>{'use server'; const {cookies}=await import('next/headers'); (await cookies()).delete('auapw_staff_session'); const {redirect}=await import('next/navigation'); redirect('/staff/login')}} className="mt-8"><button className="rounded-lg border border-border px-4 py-2 text-sm">Sign out</button></form></main>
}
