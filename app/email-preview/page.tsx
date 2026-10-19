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
    <main className="min-h-screen bg-[#0c0d10] text-[#fbf7ef]">
      <header className="border-b border-[#2a2c33] px-6 py-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#e0b429]">AUAPW LLC · Denton, TX</p>
        <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight">Warehouse email suite</h1>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-6 text-[#b7b1a4]">
          Black header, brass rule, cream paper. These are the live quote, invoice, and account templates — sample data
          only.
        </p>
        <nav className="mt-7 flex flex-wrap gap-2" aria-label="Email templates">
          {rendered.map((template) => (
            <a
              key={template.id}
              href={`#${template.id}`}
              className="border border-[#3a3c44] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d8d2c4] no-underline hover:border-[#e0b429] hover:text-[#e0b429]"
            >
              {template.name}
            </a>
          ))}
        </nav>
      </header>
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-12">
        {rendered.map((template) => (
          <section key={template.id} id={template.id} className="scroll-mt-8">
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-[#2a2c33] pb-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#e0b429]">{template.audience}</p>
                <h2 className="mt-1 text-xl font-semibold">{template.name}</h2>
              </div>
            </div>
            <div className="overflow-hidden border border-[#2a2c33] bg-[#1a1c22]">
              <div className="h-1 bg-[#e0b429]" />
              <iframe
                title={template.name}
                srcDoc={template.html}
                className="h-[900px] w-full bg-[#1a1c22]"
              />
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
