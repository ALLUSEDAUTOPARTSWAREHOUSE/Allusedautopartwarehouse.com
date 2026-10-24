import { Heading, Section, Text } from "react-email"
import { EMAIL_BRAND } from "./brand"
import { BrandLayout, DetailsTable, NotePanel, type DetailRow } from "./brand-layout"

export interface StaffAlertSection {
  heading: string
  rows: DetailRow[]
}

export interface StaffAlertEmailProps {
  title: string
  preview: string
  greeting?: string
  intro?: string
  rows?: DetailRow[]
  sections?: StaffAlertSection[]
  items?: string[]
  itemsHeading?: string
  alerts?: { level: "warning" | "critical"; message: string }[]
  note?: string
  ctaUrl: string
  ctaLabel?: string
  siteUrl?: string
}

export default function StaffAlertEmail({
  title,
  preview,
  greeting,
  intro,
  rows = [],
  sections = [],
  items = [],
  itemsHeading = "Items",
  alerts = [],
  note,
  ctaUrl,
  ctaLabel = "Open in admin",
  siteUrl = EMAIL_BRAND.siteUrl,
}: StaffAlertEmailProps) {
  return (
    <BrandLayout preview={preview} eyebrow="AUAPW operations" title={title} documentLabel="Internal" siteUrl={siteUrl} cta={{ href: ctaUrl, label: ctaLabel }}>
      {greeting ? <Text className="m-0 mb-4 text-[15px] leading-6 text-brand-ink">{greeting}</Text> : null}
      {intro ? <Text className="m-0 mb-4 text-[15px] leading-6 text-brand-ink">{intro}</Text> : null}
      {rows.length > 0 ? <DetailsTable rows={rows} /> : null}
      {sections.map((section) => (
        <Section key={section.heading} className="mt-5">
          <Heading as="h2" className="m-0 mb-2 text-sm font-bold uppercase tracking-[1.4px] text-brand-ink">
            {section.heading}
          </Heading>
          <DetailsTable rows={section.rows} />
        </Section>
      ))}
      {items.length > 0 ? (
        <Section className="mt-5">
          <Heading as="h2" className="m-0 mb-2 text-sm font-bold uppercase tracking-[1.4px] text-brand-ink">
            {itemsHeading}
          </Heading>
          {items.map((item) => (
            <Text key={item} className="m-0 text-sm leading-6 text-brand-ink">
              {item}
            </Text>
          ))}
        </Section>
      ) : null}
      {alerts.length > 0 ? (
        <Section className="mt-5">
          <Heading as="h2" className="m-0 mb-2 text-sm font-bold uppercase tracking-[1.4px] text-brand-ink">
            Needs attention
          </Heading>
          {alerts.map((alert) => (
            <Text
              key={alert.message}
              className={`m-0 text-sm leading-6 ${alert.level === "critical" ? "font-bold text-red-700" : "text-brand-ink"}`}
            >
              {alert.message}
            </Text>
          ))}
        </Section>
      ) : null}
      {note ? (
        <NotePanel>
          <Text className="m-0 whitespace-pre-wrap text-sm leading-6 text-brand-ink">{note}</Text>
        </NotePanel>
      ) : null}
    </BrandLayout>
  )
}

StaffAlertEmail.PreviewProps = {
  title: "New quote request",
  preview: "New quote #4821: 2016 Ford F-150 Engine",
  rows: [
    { label: "Quote #", value: "4821" },
    { label: "Part", value: "Engine" },
    { label: "Vehicle", value: "2016 Ford F-150" },
    { label: "Name", value: "Jordan Hale" },
    { label: "Phone", value: "1-888-887-4199" },
  ],
  ctaUrl: "https://allusedautopartswarehouse.com/admin/quotes",
  siteUrl: EMAIL_BRAND.siteUrl,
} satisfies StaffAlertEmailProps
