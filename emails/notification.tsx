import { Text } from "react-email"
import { EMAIL_BRAND } from "./brand"
import { BrandLayout, DetailsTable, type DetailRow } from "./brand-layout"

export interface NotificationEmailProps {
  title: string
  preview: string
  intro: string
  rows?: DetailRow[]
  ctaUrl?: string
  ctaLabel?: string
  siteUrl?: string
}

export default function NotificationEmail({
  title,
  preview,
  intro,
  rows = [],
  ctaUrl,
  ctaLabel,
  siteUrl = EMAIL_BRAND.siteUrl,
}: NotificationEmailProps) {
  return (
    <BrandLayout
      preview={preview}
      title={title}
      siteUrl={siteUrl}
      cta={ctaUrl && ctaLabel ? { href: ctaUrl, label: ctaLabel } : undefined}
    >
      <Text className="m-0 mb-4 text-base leading-6 text-gray-800">{intro}</Text>
      {rows.length > 0 ? <DetailsTable rows={rows} /> : null}
    </BrandLayout>
  )
}

NotificationEmail.PreviewProps = {
  title: "Payment received",
  preview: "Payment received for order AUAPW-10482",
  intro: "Payment was successful for order AUAPW-10482.",
  rows: [
    { label: "Order #", value: "AUAPW-10482" },
    { label: "Amount", value: "$2,085.00" },
  ],
  siteUrl: EMAIL_BRAND.siteUrl,
} satisfies NotificationEmailProps
