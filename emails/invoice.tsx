import { Column, Heading, Hr, Img, Link, Row, Section, Text } from "react-email"
import { EMAIL_BRAND, formatDate, formatMoney } from "./brand"
import { BrandLayout } from "./brand-layout"

export type InvoiceEmailKind = "verify" | "awaiting_payment" | "paid" | "reserved"

export interface InvoiceEmailItem {
  name: string
  brand: string
  logoUrl?: string
  href: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface InvoiceEmailProps {
  kind: InvoiceEmailKind
  title: string
  intro: string
  orderNumber: string
  createdAt: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  items: InvoiceEmailItem[]
  subtotal: number
  shippingCost: number
  tax: number
  totalAmount: number
  ctaUrl: string
  ctaLabel: string
  terms: { title: string; body: string }[]
  siteUrl?: string
}

function statusCopy(kind: InvoiceEmailKind) {
  if (kind === "paid") return "Paid in full"
  if (kind === "verify") return "Verify email"
  if (kind === "reserved") return "Reserved — due after fitment"
  return "Due after confirmation"
}

export default function InvoiceEmail({
  kind,
  title,
  intro,
  orderNumber,
  createdAt,
  customerName,
  customerEmail,
  customerPhone,
  shippingAddress,
  items,
  subtotal,
  shippingCost,
  tax,
  totalAmount,
  ctaUrl,
  ctaLabel,
  terms,
  siteUrl = EMAIL_BRAND.siteUrl,
}: InvoiceEmailProps) {
  const preview =
    kind === "paid"
      ? `Payment received for invoice ${orderNumber}`
      : kind === "verify"
        ? `Verify your email to confirm order ${orderNumber}`
        : `Invoice ${orderNumber} from AUAPW LLC`

  return (
    <BrandLayout
      preview={preview}
      eyebrow={`Invoice ${orderNumber}`}
      title={title}
      documentLabel="Invoice"
      siteUrl={siteUrl}
      cta={{ href: ctaUrl, label: ctaLabel }}
    >
      <Text className="m-0 mb-5 text-[15px] leading-6 text-brand-ink">{intro}</Text>

      <Section className="mb-5 border border-solid border-brand-line">
        <Row>
          <Column className="w-1/2 border-r border-solid border-brand-line bg-brand-mist px-3 py-3 align-top">
            <Text className="m-0 text-[10px] font-bold uppercase tracking-[1.4px] text-brand-mute">Invoice #</Text>
            <Text className="m-0 mt-1 text-sm font-bold text-brand-ink">{orderNumber}</Text>
            <Text className="m-0 mt-3 text-[10px] font-bold uppercase tracking-[1.4px] text-brand-mute">Date</Text>
            <Text className="m-0 mt-1 text-sm font-bold text-brand-ink">{formatDate(createdAt)}</Text>
          </Column>
          <Column className="w-1/2 px-3 py-3 align-top">
            <Text className="m-0 text-[10px] font-bold uppercase tracking-[1.4px] text-brand-mute">Status</Text>
            <Text className="m-0 mt-1 text-sm font-bold text-brand-ink">{statusCopy(kind)}</Text>
            <Text className="m-0 mt-3 text-[10px] font-bold uppercase tracking-[1.4px] text-brand-mute">Amount due</Text>
            <Text className="m-0 mt-1 text-lg font-bold text-brand-ink">{formatMoney(totalAmount)}</Text>
          </Column>
        </Row>
      </Section>

      <Section className="mb-5">
        <Row>
          <Column className="w-1/2 pr-3 align-top">
            <Text className="m-0 text-[10px] font-bold uppercase tracking-[1.4px] text-brand-gold">Bill to</Text>
            <Text className="m-0 mt-2 text-sm font-bold text-brand-ink">{customerName}</Text>
            <Text className="m-0 mt-1 whitespace-pre-wrap text-[13px] leading-5 text-brand-mute">{shippingAddress}</Text>
            <Text className="m-0 mt-1 text-[13px] text-brand-mute">{customerPhone}</Text>
            <Text className="m-0 text-[13px] text-brand-mute">{customerEmail}</Text>
          </Column>
          <Column className="w-1/2 pl-3 align-top">
            <Text className="m-0 text-[10px] font-bold uppercase tracking-[1.4px] text-brand-gold">Ship to</Text>
            <Text className="m-0 mt-2 text-sm font-bold text-brand-ink">{customerName}</Text>
            <Text className="m-0 mt-1 whitespace-pre-wrap text-[13px] leading-5 text-brand-mute">{shippingAddress}</Text>
          </Column>
        </Row>
      </Section>

      <Section className="bg-brand-ink px-3 py-2">
        <Row>
          <Column>
            <Text className="m-0 text-[10px] font-bold uppercase tracking-[1.6px] text-brand-gold">Line items</Text>
          </Column>
          <Column className="text-right">
            <Text className="m-0 text-[10px] font-bold uppercase tracking-[1.6px] text-brand-gold">Amount</Text>
          </Column>
        </Row>
      </Section>
      {items.map((item) => (
        <Section key={`${item.name}-${item.href}`} className="border-b border-solid border-brand-line px-1 py-3">
          <Row>
            <Column className="w-[44px] align-top">
              {item.logoUrl ? (
                <Img src={item.logoUrl} alt={item.brand} width="36" height="36" />
              ) : (
                <Text className="m-0 text-xs text-brand-mute">{item.brand}</Text>
              )}
            </Column>
            <Column className="align-top pl-2">
              <Link href={item.href} className="text-sm font-bold text-brand-ink no-underline">
                {item.name}
              </Link>
              <Text className="m-0 mt-1 text-[12px] text-brand-mute">
                {item.brand} · Qty {item.quantity} × {formatMoney(item.unitPrice)}
              </Text>
            </Column>
            <Column className="w-[88px] align-top text-right">
              <Text className="m-0 text-sm font-bold text-brand-ink">{formatMoney(item.lineTotal)}</Text>
            </Column>
          </Row>
        </Section>
      ))}

      <Section className="mt-4">
        <Row>
          <Column>
            <Text className="m-0 py-1 text-[13px] text-brand-mute">Subtotal</Text>
          </Column>
          <Column className="text-right">
            <Text className="m-0 py-1 text-[13px] text-brand-ink">{formatMoney(subtotal)}</Text>
          </Column>
        </Row>
        <Row>
          <Column>
            <Text className="m-0 py-1 text-[13px] text-brand-mute">Shipping</Text>
          </Column>
          <Column className="text-right">
            <Text className="m-0 py-1 text-[13px] text-brand-ink">{formatMoney(shippingCost)}</Text>
          </Column>
        </Row>
        <Row>
          <Column>
            <Text className="m-0 py-1 text-[13px] text-brand-mute">Tax</Text>
          </Column>
          <Column className="text-right">
            <Text className="m-0 py-1 text-[13px] text-brand-ink">{formatMoney(tax)}</Text>
          </Column>
        </Row>
      </Section>

      <Section className="mt-3 bg-brand-ink px-4 py-3">
        <Row>
          <Column>
            <Text className="m-0 text-[11px] font-bold uppercase tracking-[1.6px] text-brand-gold">Amount due</Text>
          </Column>
          <Column className="text-right">
            <Text className="m-0 text-xl font-bold text-brand-gold">{formatMoney(totalAmount)}</Text>
          </Column>
        </Row>
      </Section>

      <Heading as="h2" className="mb-2 mt-6 text-sm font-bold uppercase tracking-[1.4px] text-brand-ink">
        Notes / Terms
      </Heading>
      {terms.map((section) => (
        <Section key={section.title} className="mb-3">
          <Text className="m-0 mb-1 text-sm font-bold text-brand-ink">{section.title}</Text>
          <Text className="m-0 text-[12px] leading-5 text-brand-mute">{section.body}</Text>
        </Section>
      ))}
      <Text className="m-0 mt-2 text-[12px] leading-5 text-brand-mute">The full sale terms are on your invoice.</Text>
      <Hr className="border-solid border-brand-line" />
    </BrandLayout>
  )
}

InvoiceEmail.PreviewProps = {
  kind: "awaiting_payment",
  title: "Your order will be processed after payment confirmation",
  intro: "Your email is confirmed for order AUAPW-10482. Your order will be processed after payment confirmation.",
  orderNumber: "AUAPW-10482",
  createdAt: "2026-04-12T15:04:00.000Z",
  customerName: "Jordan Hale",
  customerEmail: "jordan@example.com",
  customerPhone: "1-888-887-4199",
  shippingAddress: "508 S Elm St, Ste 104, Denton, TX 76201",
  items: [
    {
      name: "2015-2017 Ford F-150 5.0 Engine",
      brand: "Ford",
      logoUrl: "https://allusedautopartswarehouse.com/logos/ford.png",
      href: "https://allusedautopartswarehouse.com/parts",
      quantity: 1,
      unitPrice: 1845,
      lineTotal: 1845,
    },
  ],
  subtotal: 1845,
  shippingCost: 240,
  tax: 0,
  totalAmount: 2085,
  ctaUrl: "https://allusedautopartswarehouse.com/invoice/AUAPW-10482",
  ctaLabel: "View branded invoice",
  terms: [
    {
      title: "Payment Authorization",
      body: "By placing this order you authorize AUAPW LLC to charge the card or payment method you provide for the total amount shown, once fitment and availability are confirmed.",
    },
    {
      title: "Shipping Time Frame",
      body: "Orders are processed after full payment is received. Standard dispatch is 1–2 business days, with 3–7 business days door-to-door in the lower 48.",
    },
  ],
  siteUrl: EMAIL_BRAND.siteUrl,
} satisfies InvoiceEmailProps
