import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getStaffSession } from '@/lib/staff-auth'
export const dynamic = 'force-dynamic'
export default async function SupportWorkspace() {
  const staff = await getStaffSession()
  if (!staff) redirect('/staff/login')
  if (staff.role !== 'support_team') redirect(staff.role === 'sales_agent' ? '/staff/sales' : '/staff/developer')
  return <main className="mx-auto max-w-6xl px-5 py-10"><p className="text-sm text-muted-foreground">AUAPW · Support workspace</p><h1 className="mt-2 text-3xl font-bold">Welcome, {staff.name}</h1><p className="mt-2 text-muted-foreground">Support Team · {staff.email}</p><section className="mt-8 grid gap-4 sm:grid-cols-2"><Link href="/admin/support" className="rounded-2xl border border-border bg-card p-6 hover:border-primary"><h2 className="font-semibold">Customer support</h2><p className="mt-2 text-sm text-muted-foreground">Review enquiries, tickets and follow-ups.</p></Link><Link href="/admin/quotes" className="rounded-2xl border border-border bg-card p-6 hover:border-primary"><h2 className="font-semibold">Quote enquiries</h2><p className="mt-2 text-sm text-muted-foreground">Review customer part requests that need support.</p></Link></section><form action={async()=>{'use server'; const {cookies}=await import('next/headers'); (await cookies()).delete('auapw_staff_session'); const {redirect}=await import('next/navigation'); redirect('/staff/login')} } className="mt-8"><button className="rounded-lg border border-border px-4 py-2 text-sm">Sign out</button></form></main>
