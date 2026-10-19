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
      documentLabel="Secure"
      siteUrl={siteUrl}
    >
      <Text className="m-0 mb-5 text-[15px] leading-6 text-brand-ink">
        Use this code to reset your AUAPW admin password. It expires in {expiresMinutes} minutes. If you did not
        request this, ignore this email.
      </Text>
      <Section className="bg-brand-ink px-4 py-6 text-center">
        <Text className="m-0 text-[10px] font-bold uppercase tracking-[2px] text-brand-gold">One-time code</Text>
        <Heading as="h2" className="m-0 mt-2 text-[36px] font-bold tracking-[10px] text-brand-gold">
          {code}
        </Heading>
      </Section>
      <Text className="m-0 mt-4 text-sm leading-6 text-brand-mute">Do not share this code with anyone.</Text>
    </BrandLayout>
  )
}

PasswordResetEmail.PreviewProps = {
  code: "482193",
  expiresMinutes: 10,
  siteUrl: EMAIL_BRAND.siteUrl,
} satisfies PasswordResetEmailProps
