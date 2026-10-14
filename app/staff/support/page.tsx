import { redirect } from 'next/navigation'
import { getStaffSession } from '@/lib/staff-auth'
export const dynamic = 'force-dynamic'
export default async function SupportWorkspace() {
  const staff = await getStaffSession()
  if (!staff) redirect('/staff/login')
  if (staff.role !== 'support_team') redirect(staff.role === 'sales_agent' ? '/staff/sales' : '/staff/developer')
  return <main className="mx-auto max-w-6xl px-5 py-10"><p className="text-sm text-muted-foreground">AUAPW · Support workspace</p><h1 className="mt-2 text-3xl font-bold">Welcome, {staff.name}</h1><p className="mt-2 text-muted-foreground">Support Team · {staff.email}</p><section className="mt-8 grid gap-4 sm:grid-cols-2"><article className="rounded-2xl border border-border bg-card p-6"><h2 className="font-semibold">Customer enquiries</h2><p className="mt-2 text-sm text-muted-foreground">Support enquiry and ticket handling workspace.</p></article><article className="rounded-2xl border border-border bg-card p-6"><h2 className="font-semibold">Follow-ups</h2><p className="mt-2 text-sm text-muted-foreground">Customer communication and issue follow-up workflow.</p></article></section><p className="mt-6 text-sm text-muted-foreground">Your staff session is separate from administrator and customer sessions.</p><form action={async()=>{'use server'; const {cookies}=await import('next/headers'); (await cookies()).delete('auapw_staff_session'); const {redirect}=await import('next/navigation'); redirect('/staff/login')}} className="mt-8"><button className="rounded-lg border border-border px-4 py-2 text-sm">Sign out</button></form></main>
}
