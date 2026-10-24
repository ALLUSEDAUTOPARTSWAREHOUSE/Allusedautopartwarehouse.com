import { Heading, Section, Text } from "react-email"
import { EMAIL_BRAND, formatMoney } from "./brand"
import { BrandLayout, DetailsTable, NotePanel } from "./brand-layout"

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
      documentLabel="Quote"
      siteUrl={siteUrl}
      cta={{ href: `tel:+18888874199`, label: `Call ${EMAIL_BRAND.phone} to order` }}
    >
      <Text className="m-0 mb-4 text-[15px] leading-6 text-brand-ink">Hi {customerName || "there"},</Text>
      <Text className="m-0 mb-5 text-[15px] leading-6 text-brand-ink">
        Thanks for your request. Here is your quote. We confirm fitment with your VIN before anything ships.
      </Text>
      <Section className="mb-5 bg-brand-ink px-5 py-5">
        <Text className="m-0 text-[10px] font-bold uppercase tracking-[2px] text-brand-gold">Quoted price</Text>
        <Heading as="h2" className="m-0 mt-1 text-[36px] font-bold leading-10 text-brand-gold">
          {formatMoney(amount)}
        </Heading>
        <Text className="m-0 mt-2 text-[12px] text-gray-400">USD · fitment confirmed before payment</Text>
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
        <NotePanel>
          <Text className="m-0 whitespace-pre-wrap text-sm leading-6 text-brand-ink">{note}</Text>
        </NotePanel>
      ) : null}
      <Text className="m-0 mt-4 text-[15px] leading-6 text-brand-ink">
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
