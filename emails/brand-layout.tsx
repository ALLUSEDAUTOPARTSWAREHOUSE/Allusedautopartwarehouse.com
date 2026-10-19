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
    <Section>
      {rows.map((row) => (
        <Row key={row.label}>
          <Column className="w-[140px] align-top">
            <Text className="m-0 py-1.5 text-sm text-gray-500">{row.label}</Text>
          </Column>
          <Column className="align-top">
            <Text className="m-0 py-1.5 text-sm font-bold text-gray-900">{row.value || "—"}</Text>
          </Column>
        </Row>
      ))}
    </Section>
  )
}

export function BrandLayout({
  preview,
  eyebrow,
  title,
  children,
  cta,
  siteUrl = EMAIL_BRAND.siteUrl,
}: {
  preview: string
  eyebrow?: string
  title: string
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
        <Body className="bg-brand-paper font-sans text-gray-900">
          <Preview>{preview}</Preview>
          <Container className="mx-auto my-8 max-w-xl overflow-hidden rounded bg-white">
            <Section className="bg-brand-ink px-6 py-5">
              <Row>
                <Column className="w-[72px] align-middle">
                  <Img
                    src={logo}
                    alt="All Used Auto Parts Warehouse"
                    width="56"
                    height="56"
                    className="rounded bg-white"
                  />
                </Column>
                <Column className="align-middle pl-3">
                  <Text className="m-0 text-lg font-bold tracking-wide text-white">{EMAIL_BRAND.legalName}</Text>
                  <Text className="m-0 mt-1 text-xs text-gray-300">{EMAIL_BRAND.tradeName}</Text>
                </Column>
              </Row>
            </Section>

            <Section className="px-6 py-6">
              {eyebrow ? (
                <Text className="m-0 mb-2 text-xs font-bold uppercase tracking-wide text-brand-amber">{eyebrow}</Text>
              ) : null}
              <Heading as="h1" className="m-0 mb-4 text-xl font-bold text-gray-900">
                {title}
              </Heading>
              {children}
              {cta ? (
                <Section className="mt-6">
                  <Button
                    href={cta.href}
                    className="box-border rounded bg-brand-amber px-5 py-3 text-center font-bold text-brand-ink no-underline"
                  >
                    {cta.label}
                  </Button>
                </Section>
              ) : null}
            </Section>

            <Hr className="m-0 border-solid border-gray-200" />
            <Section className="px-6 py-5">
              <Text className="m-0 text-sm text-gray-500">
                Questions? Call{" "}
                <Link href={`tel:+18888874199`} className="font-bold text-gray-900 no-underline">
                  {EMAIL_BRAND.phone}
                </Link>{" "}
                or email{" "}
                <Link href={`mailto:${EMAIL_BRAND.email}`} className="text-gray-900 no-underline">
                  {EMAIL_BRAND.email}
                </Link>
                .
              </Text>
              <Text className="m-0 mt-3 text-xs text-gray-400">
                {EMAIL_BRAND.legalName} · {EMAIL_BRAND.addressLines.join(", ")}
              </Text>
              <Text className="m-0 mt-1 text-xs text-gray-400">
                <Link href={siteUrl} className="text-gray-500 no-underline">
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
