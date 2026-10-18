import Link from "next/link"
import { headers } from "next/headers"
import { sendCustomerOrderInvoice } from "@/lib/followup-notify"
import { verifyOrderEmail } from "@/lib/followup"
import { invoiceUrl } from "@/lib/invoice"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export const dynamic = "force-dynamic"
export const metadata = { title: "Confirm your order | AUAPW LLC", robots: { index: false, follow: false } }

export default async function VerifyOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const result = token ? await verifyOrderEmail(token.trim()) : null
  const headerList = await headers()
  const host = headerList.get("x-forwarded-host") || headerList.get("host")
  const proto = headerList.get("x-forwarded-proto") || "https"
  const origin = host ? `${proto}://${host}` : "https://www.allusedautopartswarehouse.com"

  if (result?.newlyVerified && result.order.status !== "paid") {
    await sendCustomerOrderInvoice(result.order, origin).catch(() => ({ ok: false }))
  }

  return (
    <>
      <Navbar />
      <main className="pt-[58px]">
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          {result ? (
            <>
              <h1 className="text-3xl font-black">Email confirmed</h1>
              <p className="mt-4 text-pretty text-foreground/70">
                {result.order.status === "paid"
                  ? `Order ${result.order.orderNumber} is paid and we are processing it.`
                  : `Order ${result.order.orderNumber} is confirmed. Your order will be processed after payment confirmation.`}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href={invoiceUrl(result.order, "")}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  View invoice
                </Link>
                <Link href="/" className="rounded-md border border-border px-4 py-2 text-sm">
                  Back to store
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black">Link expired</h1>
              <p className="mt-4 text-pretty text-foreground/70">
                This confirmation link is invalid or has already been used. If you just placed an order, call us at
                1-888-887-4199 and we will resend it.
              </p>
              <Link href="/" className="mt-8 inline-block rounded-md border border-border px-4 py-2 text-sm">
                Back to store
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
