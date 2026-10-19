import { Heading, Section, Text } from "react-email"
import { EMAIL_BRAND, formatMoney } from "./brand"
import { BrandLayout, DetailsTable } from "./brand-layout"

export interface QuoteOfferEmailProps {
  customerName: string
  part: string
  option?: string | null
  amount: number
  shipping: string
  warranty: string
  note?: string
  siteUrl?: string
}

export default function QuoteOfferEmail({
  customerName,
  part,
  option,
  amount,
  shipping,
  warranty,
  note,
  siteUrl = EMAIL_BRAND.siteUrl,
}: QuoteOfferEmailProps) {
  return (
    <BrandLayout
      preview={`Your AUAPW quote for ${part}: ${formatMoney(amount)}`}
      eyebrow="Written quote"
      title="Your parts quote"
      siteUrl={siteUrl}
      cta={{ href: `tel:+18888874199`, label: `Call ${EMAIL_BRAND.phone} to order` }}
    >
      <Text className="m-0 mb-4 text-base leading-6 text-gray-800">Hi {customerName || "there"},</Text>
      <Text className="m-0 mb-4 text-base leading-6 text-gray-800">
        Thanks for your request. Here is your quote. We confirm fitment with your VIN before anything ships.
      </Text>
      <Section className="mb-4 rounded bg-brand-paper px-4 py-4">
        <Text className="m-0 text-xs font-bold uppercase tracking-wide text-gray-500">Quoted price</Text>
        <Heading as="h2" className="m-0 mt-1 text-3xl font-bold text-gray-900">
          {formatMoney(amount)}
        </Heading>
      </Section>
      <DetailsTable
        rows={[
          { label: "Part", value: part },
          { label: "Option", value: option || "—" },
          { label: "Shipping", value: shipping },
          { label: "Warranty", value: warranty },
        ]}
      />
      {note ? (
        <Section className="mt-4 rounded bg-brand-paper px-4 py-3">
          <Text className="m-0 whitespace-pre-wrap text-sm leading-6 text-gray-800">{note}</Text>
        </Section>
      ) : null}
      <Text className="m-0 mt-4 text-base leading-6 text-gray-800">
        To order, call <strong>{EMAIL_BRAND.phone}</strong> or reply to this email.
      </Text>
    </BrandLayout>
  )
}

QuoteOfferEmail.PreviewProps = {
  customerName: "Jordan Hale",
  part: "2016 Ford F-150 Engine",
  option: "Used",
  amount: 1845,
  shipping: "$240 per part",
  warranty: "90-day warranty on used and rebuilt parts",
  note: "This unit is in stock. We will match it to your VIN before we take payment.",
  siteUrl: EMAIL_BRAND.siteUrl,
} satisfies QuoteOfferEmailProps
