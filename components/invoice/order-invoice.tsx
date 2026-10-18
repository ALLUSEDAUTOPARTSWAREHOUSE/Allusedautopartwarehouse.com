import Image from "next/image"
import Link from "next/link"
import { getBrandLabel } from "@/lib/brand-catalog"
import {
  INVOICE_COMPANY,
  INVOICE_TERMS,
  brandLogoPath,
  money,
  productHref,
} from "@/lib/invoice"
import type { CustomerOrder } from "@/lib/followup"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function paymentLabel(order: CustomerOrder) {
  if (order.status === "paid") return "Paid"
  if (order.status === "reserved_pending_fitment") return "Reservation — due after fitment"
  return "Due — processed after payment confirmation"
}

export function OrderInvoice({ order, siteUrl }: { order: CustomerOrder; siteUrl: string }) {
  return (
    <article className="bg-white text-zinc-900 shadow-xl print:shadow-none">
      <header className="flex flex-col gap-6 border-b border-zinc-200 px-8 py-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-zinc-200">
            <Image src={INVOICE_COMPANY.logoPath} alt="AUAPW LLC" width={64} height={64} className="object-contain" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Invoice</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">{INVOICE_COMPANY.legalName}</h1>
            <p className="text-sm text-zinc-600">{INVOICE_COMPANY.tradeName}</p>
            <div className="mt-3 space-y-0.5 text-xs leading-relaxed text-zinc-600">
              {INVOICE_COMPANY.addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p>Phone: {INVOICE_COMPANY.phone}</p>
              <p>{INVOICE_COMPANY.email}</p>
              <p>{INVOICE_COMPANY.website}</p>
            </div>
          </div>
        </div>
        <dl className="grid min-w-[16rem] grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-zinc-500">Invoice Number</dt>
          <dd className="font-mono font-semibold">{order.orderNumber}</dd>
          <dt className="text-zinc-500">Invoice Date</dt>
          <dd>{formatDate(order.createdAt)}</dd>
          <dt className="text-zinc-500">Payment Due</dt>
          <dd>{order.status === "paid" ? "Paid in full" : formatDate(order.createdAt)}</dd>
          <dt className="text-zinc-500">Amount Due (USD)</dt>
          <dd className="text-lg font-black">{money(order.totalAmount)}</dd>
          <dt className="text-zinc-500">Status</dt>
          <dd className="font-semibold">{paymentLabel(order)}</dd>
        </dl>
      </header>

      <div className="grid gap-8 px-8 py-6 sm:grid-cols-2">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Bill To</h2>
          <p className="mt-2 font-semibold">{order.customerName || "Customer"}</p>
          <p className="whitespace-pre-wrap text-sm text-zinc-700">{order.shippingAddress}</p>
          {order.customerPhone ? <p className="mt-1 text-sm">{order.customerPhone}</p> : null}
          {order.customerEmail ? <p className="text-sm">{order.customerEmail}</p> : null}
        </section>
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ship To</h2>
          <p className="mt-2 font-semibold">{order.customerName || "Customer"}</p>
          <p className="whitespace-pre-wrap text-sm text-zinc-700">{order.shippingAddress}</p>
        </section>
      </div>

      <div className="px-8 pb-6">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-3 py-2 font-semibold">Brand</th>
              <th className="px-3 py-2 font-semibold">Item</th>
              <th className="px-3 py-2 text-right font-semibold">Qty</th>
              <th className="px-3 py-2 text-right font-semibold">Price</th>
              <th className="px-3 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((line) => {
              const logo = brandLogoPath(line.make)
              const href = productHref(line, siteUrl)
              return (
                <tr key={`${line.productId}-${line.name}`} className="border-b border-zinc-100">
                  <td className="px-3 py-3 align-middle">
                    {logo ? (
                      <Image
                        src={logo}
                        alt={getBrandLabel(line.make)}
                        width={40}
                        height={40}
                        className="size-10 object-contain"
                      />
                    ) : (
                      <span className="text-xs text-zinc-500">{getBrandLabel(line.make)}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Link href={href} className="font-semibold text-blue-700 underline underline-offset-2">
                      {line.name}
                    </Link>
                    <p className="mt-1 text-xs text-zinc-500">{getBrandLabel(line.make)} · product page</p>
                  </td>
                  <td className="px-3 py-3 text-right">{line.quantity}</td>
                  <td className="px-3 py-3 text-right">{money(line.unitPrice)}</td>
                  <td className="px-3 py-3 text-right font-semibold">{money(line.lineTotal)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="ml-auto mt-4 w-full max-w-xs text-sm">
          <div className="flex justify-between py-1 text-zinc-600">
            <span>Subtotal</span>
            <span>{money(order.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1 text-zinc-600">
            <span>Shipping</span>
            <span>{money(order.shippingCost)}</span>
          </div>
          <div className="flex justify-between py-1 text-zinc-600">
            <span>Tax</span>
            <span>{money(order.tax)}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 text-base font-black">
            <span>Amount Due (USD)</span>
            <span>{money(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {order.customerNotes ? (
        <p className="mx-8 mb-6 rounded-md bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          <span className="font-semibold">Customer notes: </span>
          {order.customerNotes}
        </p>
      ) : null}

      <section className="border-t border-zinc-200 px-8 py-8">
        <h2 className="text-sm font-black uppercase tracking-wider">Notes / Terms</h2>
        <p className="mt-2 text-sm font-medium text-zinc-800">
          Your order will be processed after payment confirmation.
        </p>
        <div className="mt-6 space-y-5 text-xs leading-relaxed text-zinc-700">
          {INVOICE_TERMS.map((section) => (
            <div key={section.title}>
              <h3 className="mb-1 font-bold text-zinc-900">{section.title}</h3>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="mb-2 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>
    </article>
  )
}
