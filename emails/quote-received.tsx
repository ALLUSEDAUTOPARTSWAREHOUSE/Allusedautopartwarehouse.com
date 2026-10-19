import { Link, Text } from "react-email"
import { EMAIL_BRAND, formatDateTime } from "./brand"
import { BrandLayout, DetailsTable } from "./brand-layout"

export interface QuoteReceivedEmailProps {
  customerName: string
  quoteId: number | string
  partType: string
  vehicle: string
  option?: string | null
  submittedAt: string
  productName?: string | null
  productUrl?: string | null
  siteUrl?: string
}

export default function QuoteReceivedEmail({
  customerName,
  quoteId,
  partType,
  vehicle,
  option,
  submittedAt,
  productName,
  productUrl,
  siteUrl = EMAIL_BRAND.siteUrl,
}: QuoteReceivedEmailProps) {
  return (
    <BrandLayout
      preview={`We received your quote request #${quoteId}. A parts specialist will follow up.`}
      eyebrow={`Quote #${quoteId}`}
      title="Quote request received"
      siteUrl={siteUrl}
    >
      <Text className="m-0 mb-4 text-base leading-6 text-gray-800">Hello {customerName || "there"},</Text>
      <Text className="m-0 mb-4 text-base leading-6 text-gray-800">
        We saved your request as reference <strong>#{quoteId}</strong>. A parts specialist will review fitment and
        contact you — this email is not a price quote or a fitment confirmation.
      </Text>
      <DetailsTable
        rows={[
          { label: "Requested part", value: partType },
          { label: "Vehicle", value: vehicle },
          { label: "Option", value: option || "—" },
          { label: "Submitted", value: formatDateTime(submittedAt) },
        ]}
      />
      {productName ? (
        <Text className="m-0 mt-4 text-base leading-6 text-gray-800">
          Product of interest: <strong>{productName}</strong>
        </Text>
      ) : null}
      {productUrl ? (
        <Text className="m-0 mt-2 text-base leading-6 text-gray-800">
          <Link href={productUrl} className="font-bold text-gray-900">
            View the product page
          </Link>
        </Text>
      ) : null}
    </BrandLayout>
  )
}

QuoteReceivedEmail.PreviewProps = {
  customerName: "Jordan Hale",
  quoteId: 4821,
  partType: "Engine",
  vehicle: "2016 Ford F-150 5.0L",
  option: "Used",
  submittedAt: "2026-04-12T15:04:00.000Z",
  productName: "2015-2017 Ford F-150 5.0 Engine",
  productUrl: "https://allusedautopartswarehouse.com/parts",
  siteUrl: EMAIL_BRAND.siteUrl,
} satisfies QuoteReceivedEmailProps
