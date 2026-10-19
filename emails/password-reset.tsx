import { Heading, Section, Text } from "react-email"
import { EMAIL_BRAND } from "./brand"
import { BrandLayout } from "./brand-layout"

export interface PasswordResetEmailProps {
  code: string
  expiresMinutes: number
  siteUrl?: string
}

export default function PasswordResetEmail({
  code,
  expiresMinutes,
  siteUrl = EMAIL_BRAND.siteUrl,
}: PasswordResetEmailProps) {
  return (
    <BrandLayout
      preview={`Your AUAPW admin reset code expires in ${expiresMinutes} minutes`}
      eyebrow="Admin security"
      title="Password reset code"
      siteUrl={siteUrl}
    >
      <Text className="m-0 mb-4 text-base leading-6 text-gray-800">
        Use this code to reset your AUAPW admin password. It expires in {expiresMinutes} minutes. If you did not
        request this, ignore this email.
      </Text>
      <Section className="rounded bg-brand-paper px-4 py-5 text-center">
        <Heading as="h2" className="m-0 text-3xl font-bold tracking-[8px] text-gray-900">
          {code}
        </Heading>
      </Section>
      <Text className="m-0 mt-4 text-sm leading-6 text-gray-500">Do not share this code with anyone.</Text>
    </BrandLayout>
  )
}

PasswordResetEmail.PreviewProps = {
  code: "482193",
  expiresMinutes: 10,
  siteUrl: EMAIL_BRAND.siteUrl,
} satisfies PasswordResetEmailProps
