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
      siteUrl={siteUrl}
      cta={{ href: ctaUrl, label: ctaLabel }}
    >
      <Text className="m-0 mb-4 text-base leading-6 text-gray-800">{intro}</Text>

      <Section className="mb-4">
        <Row>
          <Column className="w-[140px] align-top">
            <Text className="m-0 py-1 text-sm text-gray-500">Invoice #</Text>
          </Column>
          <Column className="align-top">
            <Text className="m-0 py-1 text-sm font-bold text-gray-900">{orderNumber}</Text>
          </Column>
        </Row>
        <Row>
          <Column className="w-[140px] align-top">
            <Text className="m-0 py-1 text-sm text-gray-500">Date</Text>
          </Column>
          <Column className="align-top">
            <Text className="m-0 py-1 text-sm font-bold text-gray-900">{formatDate(createdAt)}</Text>
          </Column>
        </Row>
        <Row>
          <Column className="w-[140px] align-top">
            <Text className="m-0 py-1 text-sm text-gray-500">Bill / ship to</Text>
          </Column>
          <Column className="align-top">
            <Text className="m-0 py-1 text-sm font-bold text-gray-900">{customerName}</Text>
            <Text className="m-0 text-sm text-gray-700">{shippingAddress}</Text>
            <Text className="m-0 text-sm text-gray-700">
              {customerPhone} · {customerEmail}
            </Text>
          </Column>
        </Row>
      </Section>

      <Hr className="border-solid border-gray-200" />
      <Heading as="h2" className="mb-3 mt-4 text-base font-bold text-gray-900">
        Items
      </Heading>
      {items.map((item) => (
        <Section key={`${item.name}-${item.href}`} className="mb-3">
          <Row>
            <Column className="w-[48px] align-top">
              {item.logoUrl ? (
                <Img src={item.logoUrl} alt={item.brand} width="36" height="36" className="rounded" />
              ) : (
                <Text className="m-0 text-xs text-gray-400"> </Text>
              )}
            </Column>
            <Column className="align-top pl-2">
              <Link href={item.href} className="text-sm font-bold text-gray-900">
                {item.name}
              </Link>
              <Text className="m-0 mt-1 text-xs text-gray-500">{item.brand}</Text>
              <Text className="m-0 text-xs text-gray-500">
                Qty {item.quantity} × {formatMoney(item.unitPrice)}
              </Text>
            </Column>
            <Column className="w-[88px] align-top text-right">
              <Text className="m-0 text-sm font-bold text-gray-900">{formatMoney(item.lineTotal)}</Text>
            </Column>
          </Row>
        </Section>
      ))}

      <Hr className="border-solid border-gray-200" />
      <Section className="mt-3">
        <Row>
          <Column>
            <Text className="m-0 py-1 text-sm text-gray-500">Subtotal</Text>
          </Column>
          <Column className="text-right">
            <Text className="m-0 py-1 text-sm text-gray-900">{formatMoney(subtotal)}</Text>
          </Column>
        </Row>
        <Row>
          <Column>
            <Text className="m-0 py-1 text-sm text-gray-500">Shipping</Text>
          </Column>
          <Column className="text-right">
            <Text className="m-0 py-1 text-sm text-gray-900">{formatMoney(shippingCost)}</Text>
          </Column>
        </Row>
        <Row>
          <Column>
            <Text className="m-0 py-1 text-sm text-gray-500">Tax</Text>
          </Column>
          <Column className="text-right">
            <Text className="m-0 py-1 text-sm text-gray-900">{formatMoney(tax)}</Text>
          </Column>
        </Row>
        <Row>
          <Column>
            <Text className="m-0 py-2 text-base font-bold text-gray-900">Amount due</Text>
          </Column>
          <Column className="text-right">
            <Text className="m-0 py-2 text-base font-bold text-gray-900">{formatMoney(totalAmount)}</Text>
          </Column>
        </Row>
      </Section>

      <Heading as="h2" className="mb-2 mt-6 text-base font-bold text-gray-900">
        Notes / Terms
      </Heading>
      {terms.map((section) => (
        <Section key={section.title} className="mb-3">
          <Text className="m-0 mb-1 text-sm font-bold text-gray-900">{section.title}</Text>
          <Text className="m-0 text-xs leading-5 text-gray-600">{section.body}</Text>
        </Section>
      ))}
      <Text className="m-0 mt-2 text-xs leading-5 text-gray-500">The full sale terms are on your invoice.</Text>
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
