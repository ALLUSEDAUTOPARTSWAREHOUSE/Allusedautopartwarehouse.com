import { createElement, type ComponentType } from "react"
import { render } from "react-email"
import CustomerInviteEmail from "@/emails/customer-invite"
import InvoiceEmail from "@/emails/invoice"
import OrderStatusEmail from "@/emails/order-status"
import PasswordResetEmail from "@/emails/password-reset"
import QuoteOfferEmail from "@/emails/quote-offer"
import QuoteReceivedEmail from "@/emails/quote-received"
import StaffAlertEmail from "@/emails/staff-alert"
import StaffInviteEmail from "@/emails/staff-invite"

export const metadata = {
  title: "AUAPW email templates",
  robots: { index: false, follow: false },
}

type Previewable = ComponentType<any> & { PreviewProps?: Record<string, unknown> }

const templates: { id: string; name: string; audience: string; Component: Previewable; props?: Record<string, unknown> }[] = [
  { id: "quote-received", name: "Quote received", audience: "Customer", Component: QuoteReceivedEmail },
  { id: "quote-offer", name: "Written quote", audience: "Customer", Component: QuoteOfferEmail },
  { id: "invoice-awaiting", name: "Invoice — awaiting payment", audience: "Customer", Component: InvoiceEmail },
  {
    id: "invoice-paid",
    name: "Invoice — paid",
    audience: "Customer",
    Component: InvoiceEmail,
    props: {
      ...InvoiceEmail.PreviewProps,
      kind: "paid",
      title: "Payment received — we are processing your order",
      intro: "Thank you. Payment is confirmed for order AUAPW-10482. We are now processing your order.",
    },
  },
  {
    id: "invoice-verify",
    name: "Invoice — verify email",
    audience: "Customer",
    Component: InvoiceEmail,
    props: {
      ...InvoiceEmail.PreviewProps,
      kind: "verify",
      title: "Confirm your AUAPW order",
      intro: "Please verify jordan@example.com to confirm order AUAPW-10482. Your order will be processed after payment confirmation.",
      ctaLabel: "Verify email and confirm order",
      ctaUrl: "https://allusedautopartswarehouse.com/orders/verify?token=preview",
    },
  },
  { id: "order-status", name: "Order shipped", audience: "Customer", Component: OrderStatusEmail },
  { id: "staff-quote", name: "New quote (staff)", audience: "Staff", Component: StaffAlertEmail },
  { id: "password-reset", name: "Admin password reset", audience: "Staff", Component: PasswordResetEmail },
  { id: "staff-invite", name: "Staff invite", audience: "Staff", Component: StaffInviteEmail },
  { id: "customer-invite", name: "Customer invite", audience: "Customer", Component: CustomerInviteEmail },
]

export default async function EmailPreviewPage() {
  const rendered = await Promise.all(
    templates.map(async (template) => ({
      ...template,
      html: await render(createElement(template.Component, template.props ?? template.Component.PreviewProps ?? {})),
    })),
  )

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">AUAPW LLC</p>
        <h1 className="mt-2 text-balance text-3xl font-semibold">Branded email templates</h1>
        <p className="mt-2 max-w-2xl text-pretty text-sm text-zinc-400">
          These are the live React Email templates sent for quotes, invoices, order updates, and account mail. Sample
          data only — nothing is sent from this page.
        </p>
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Email templates">
          {rendered.map((template) => (
            <a
              key={template.id}
              href={`#${template.id}`}
              className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 no-underline hover:border-amber-400 hover:text-amber-300"
            >
              {template.name}
            </a>
          ))}
        </nav>
      </header>
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10">
        {rendered.map((template) => (
          <section key={template.id} id={template.id} className="scroll-mt-8">
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold">{template.name}</h2>
              <p className="text-xs uppercase tracking-wide text-zinc-500">{template.audience}</p>
            </div>
            <iframe
              title={template.name}
              srcDoc={template.html}
              className="h-[820px] w-full rounded-lg border border-zinc-800 bg-white"
            />
          </section>
        ))}
      </div>
    </main>
  )
}
