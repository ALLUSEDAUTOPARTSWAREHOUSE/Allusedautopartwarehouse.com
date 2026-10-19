import { Text } from "react-email"
import { EMAIL_BRAND } from "./brand"
import { BrandLayout } from "./brand-layout"

export interface CustomerInviteEmailProps {
  inviteUrl: string
  expiresHours: number
  siteUrl?: string
}

export default function CustomerInviteEmail({
  inviteUrl,
  expiresHours,
  siteUrl = EMAIL_BRAND.siteUrl,
}: CustomerInviteEmailProps) {
  return (
    <BrandLayout
      preview="Create your AUAPW customer account"
      eyebrow="Account invitation"
      title="You are invited to create an AUAPW account"
      documentLabel="Invite"
      siteUrl={siteUrl}
      cta={{ href: inviteUrl, label: "Create your account" }}
    >
      <Text className="m-0 mb-4 text-[15px] leading-6 text-brand-ink">
        Use the email address that received this invitation to create your All Used Auto Parts Warehouse customer
        account. The link expires in {expiresHours} hours and can be used once.
      </Text>
      <Text className="m-0 text-sm leading-6 text-brand-mute">If you were not expecting this, ignore this email.</Text>
    </BrandLayout>
  )
}

CustomerInviteEmail.PreviewProps = {
  inviteUrl: "https://allusedautopartswarehouse.com/sign-up?invite=preview",
  expiresHours: 72,
  siteUrl: EMAIL_BRAND.siteUrl,
} satisfies CustomerInviteEmailProps
