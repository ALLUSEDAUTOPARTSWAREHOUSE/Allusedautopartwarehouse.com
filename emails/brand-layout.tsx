import type { ReactNode } from "react"
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "react-email"
import { EMAIL_BRAND, emailLogoUrl } from "./brand"
import tailwindConfig from "./tailwind.config"

export interface EmailCta {
  href: string
  label: string
}

export interface DetailRow {
  label: string
  value: string
}

export function DetailsTable({ rows }: { rows: DetailRow[] }) {
  return (
    <Section className="my-5 border border-solid border-brand-line">
      {rows.map((row, index) => (
        <Row key={row.label}>
          <Column className="w-[150px] bg-brand-mist px-3 py-2.5 align-top">
            <Text className="m-0 text-[10px] font-bold uppercase tracking-[1.4px] text-brand-mute">{row.label}</Text>
          </Column>
          <Column
            className={`px-3 py-2.5 align-top ${index === 0 ? "" : "border-t border-solid border-brand-line"}`}
          >
            <Text className="m-0 text-sm font-bold text-brand-ink">{row.value || "—"}</Text>
          </Column>
        </Row>
      ))}
    </Section>
  )
}

export function NotePanel({ children }: { children: ReactNode }) {
  return (
    <Section className="my-4 border-l-4 border-solid border-brand-gold bg-brand-mist px-4 py-3">
      {children}
    </Section>
  )
}

export function BrandLayout({
  preview,
  eyebrow,
  title,
  documentLabel,
  children,
  cta,
  siteUrl = EMAIL_BRAND.siteUrl,
}: {
  preview: string
  eyebrow?: string
  title: string
  documentLabel?: string
  children: ReactNode
  cta?: EmailCta
  siteUrl?: string
}) {
  const logo = emailLogoUrl(siteUrl)
  const year = new Date().getFullYear()

  return (
    <Html lang="en" dir="ltr">
      <Tailwind config={tailwindConfig}>
        <Head />
        <Body className="bg-brand-paper font-sans text-brand-ink">
          <Preview>{preview}</Preview>
          <Container className="mx-auto my-8 max-w-[600px] overflow-hidden bg-brand-cream">
            <Section className="h-[4px] bg-brand-gold" />
            <Section className="bg-brand-ink px-6 py-5">
              <Row>
                <Column className="w-[64px] align-middle">
                  <Img
                    src={logo}
                    alt="All Used Auto Parts Warehouse"
                    width="52"
                    height="52"
                    className="border border-solid border-brand-gold bg-white"
                  />
                </Column>
                <Column className="align-middle pl-3">
                  <Text className="m-0 text-[10px] font-bold uppercase tracking-[2px] text-brand-gold">
                    {EMAIL_BRAND.tradeName}
                  </Text>
                  <Text className="m-0 mt-1 text-xl font-bold tracking-wide text-white">{EMAIL_BRAND.legalName}</Text>
                  <Text className="m-0 mt-1 text-[11px] text-gray-400">Denton, TX · {EMAIL_BRAND.phone}</Text>
                </Column>
                {documentLabel ? (
                  <Column className="w-[110px] align-middle text-right">
                    <Text className="m-0 text-[10px] font-bold uppercase tracking-[2px] text-brand-gold">
                      {documentLabel}
                    </Text>
                  </Column>
                ) : null}
              </Row>
            </Section>

            <Section className="px-6 py-7">
              {eyebrow ? (
                <Text className="m-0 mb-2 text-[11px] font-bold uppercase tracking-[2px] text-brand-gold">{eyebrow}</Text>
              ) : null}
              <Heading as="h1" className="m-0 mb-5 text-[22px] font-bold leading-7 text-brand-ink">
                {title}
              </Heading>
              {children}
              {cta ? (
                <Section className="mt-6">
                  <Button
                    href={cta.href}
                    className="box-border inline-block w-full bg-brand-gold px-5 py-3.5 text-center text-[13px] font-bold uppercase tracking-[1.6px] text-brand-ink no-underline"
                  >
                    {cta.label}
                  </Button>
                </Section>
              ) : null}
            </Section>

            <Hr className="m-0 border-solid border-brand-line" />
            <Section className="bg-brand-ink px-6 py-5">
              <Text className="m-0 text-[11px] font-bold uppercase tracking-[1.6px] text-brand-gold">Need a specialist?</Text>
              <Text className="m-0 mt-2 text-sm text-gray-300">
                Call{" "}
                <Link href="tel:+18888874199" className="font-bold text-white no-underline">
                  {EMAIL_BRAND.phone}
                </Link>
                {" · "}
                <Link href={`mailto:${EMAIL_BRAND.email}`} className="text-white no-underline">
                  {EMAIL_BRAND.email}
                </Link>
              </Text>
              <Text className="m-0 mt-3 text-[11px] leading-5 text-gray-500">
                {EMAIL_BRAND.legalName}
                <br />
                {EMAIL_BRAND.addressLines.join(" · ")}
              </Text>
              <Text className="m-0 mt-2 text-[11px] text-gray-500">
                <Link href={siteUrl} className="text-gray-400 no-underline">
                  {EMAIL_BRAND.website}
                </Link>
                {` · © ${year}`}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
