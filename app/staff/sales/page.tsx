import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getStaffSession } from '@/lib/staff-auth'
export const dynamic = 'force-dynamic'
export default async function SalesWorkspace() {
  const staff = await getStaffSession()
  if (!staff) redirect('/staff/login')
  if (staff.role !== 'sales_agent') redirect(staff.role === 'support_team' ? '/staff/support' : '/staff/developer')
  return <main className="mx-auto max-w-6xl px-5 py-10"><p className="text-sm text-muted-foreground">AUAPW · Sales workspace</p><h1 className="mt-2 text-3xl font-bold">Welcome, {staff.name}</h1><p className="mt-2 text-muted-foreground">Your role: Sales Agent · Signed in as {staff.email}</p><section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[{title:'Quote requests',desc:'Review incoming part requests and prepare quotes',href:'/admin/quotes'},{title:'Orders',desc:'Follow order progress and customer purchases',href:'/admin/orders'},{title:'Customers',desc:'Find customer records and contact details',href:'/admin/customers'}].map(item=><Link key={item.title} href={item.href} className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary"><h2 className="font-semibold">{item.title}</h2><p className="mt-2 text-sm text-muted-foreground">{item.desc}</p><span className="mt-4 inline-block text-sm text-primary">Open workspace →</span></Link>)}</section><form action="/api/staff/auth/logout" method="post" className="mt-8"><LogoutButton /></form></main>
}
function LogoutButton(){return <button formAction={async()=>{'use server'; const {cookies}=await import('next/headers'); (await cookies()).delete('auapw_staff_session'); const {redirect}=await import('next/navigation'); redirect('/staff/login')}} className="rounded-lg border border-border px-4 py-2 text-sm">Sign out</button>}
