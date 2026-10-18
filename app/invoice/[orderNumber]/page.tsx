import Link from "next/link"
import { notFound } from "next/navigation"
import { getAdminSession } from "@/lib/admin-auth"
import { getOrderByInvoiceToken, getOrderByNumber } from "@/lib/followup"
import { getStaffSession } from "@/lib/staff-auth"
import { OrderInvoice } from "@/components/invoice/order-invoice"
import { PrintInvoiceButton } from "@/components/invoice/print-invoice-button"

export const dynamic = "force-dynamic"
export const metadata = { title: "Invoice | AUAPW LLC", robots: { index: false, follow: false } }

export default async function InvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { orderNumber } = await params
  const { t } = await searchParams
  const token = t?.trim() || ""

  const [admin, staff] = await Promise.all([getAdminSession(), getStaffSession()])
  const order = token
    ? await getOrderByInvoiceToken(orderNumber, token)
    : admin || staff
      ? await getOrderByNumber(orderNumber)
      : null

  if (!order) notFound()

  const siteUrl = "https://www.allusedautopartswarehouse.com"

  return (
    <main className="min-h-screen bg-zinc-200 py-8 print:bg-white print:py-0">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 print:max-w-none print:px-0">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <p className="text-sm text-zinc-700">AUAPW LLC invoice · {order.orderNumber}</p>
          <div className="flex gap-2">
            <PrintInvoiceButton />
            <Link href="/" className="rounded-md border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-800">
              Back to store
            </Link>
          </div>
        </div>
        <OrderInvoice order={order} siteUrl={siteUrl} />
      </div>
    </main>
  )
}
