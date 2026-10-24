import { Section, Text } from "react-email"
import { EMAIL_BRAND, formatMoney } from "./brand"
import { BrandLayout, DetailsTable, NotePanel } from "./brand-layout"

export interface OrderStatusEmailProps {
  customerName: string
  title: string
  preview: string
  body: string
  orderNumber: string
  totalAmount: number
  items: string[]
  note?: string
  siteUrl?: string
}

export default function OrderStatusEmail({
  customerName,
  title,
  preview,
  body,
  orderNumber,
  totalAmount,
  items,
  note,
  siteUrl = EMAIL_BRAND.siteUrl,
}: OrderStatusEmailProps) {
  return (
    <BrandLayout
      preview={preview}
      eyebrow={orderNumber}
      title={title}
      documentLabel="Order"
      siteUrl={siteUrl}
      cta={{ href: `${siteUrl}/customer/dashboard`, label: "View your order status" }}
    >
      <Text className="m-0 mb-4 text-[15px] leading-6 text-brand-ink">Hi {customerName || "there"},</Text>
      <Text className="m-0 mb-4 text-[15px] leading-6 text-brand-ink">{body}</Text>
      {note ? (
        <NotePanel>
          <Text className="m-0 whitespace-pre-wrap text-sm leading-6 text-brand-ink">{note}</Text>
        </NotePanel>
      ) : null}
      <DetailsTable
        rows={[
          { label: "Order #", value: orderNumber },
          { label: "Total", value: formatMoney(totalAmount) },
        ]}
      />
      {items.length > 0 ? (
        <Section className="mt-4">
          <Text className="m-0 mb-2 text-[10px] font-bold uppercase tracking-[1.6px] text-brand-gold">Items</Text>
          {items.map((item) => (
            <Text key={item} className="m-0 text-sm leading-6 text-brand-ink">
              {item}
            </Text>
          ))}
        </Section>
      ) : null}
    </BrandLayout>
  )
}

OrderStatusEmail.PreviewProps = {
  customerName: "Jordan Hale",
  title: "Your part has shipped",
  preview: "Your AUAPW part is on the way — AUAPW-10482",
  body: "Your part is on its way: 3-7 business days door to door in the lower 48. Every unit ships insured on a pallet.",
  orderNumber: "AUAPW-10482",
  totalAmount: 2085,
  items: ["2015-2017 Ford F-150 5.0 Engine × 1"],
  note: "Tracking will be emailed within 24–48 hours of pickup.",
  siteUrl: EMAIL_BRAND.siteUrl,
} satisfies OrderStatusEmailProps
