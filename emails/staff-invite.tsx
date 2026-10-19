import { Text } from "react-email"
import { EMAIL_BRAND } from "./brand"
import { BrandLayout } from "./brand-layout"

export interface StaffInviteEmailProps {
  name: string
  inviteUrl: string
  expiresHours: number
  siteUrl?: string
}

export default function StaffInviteEmail({
  name,
  inviteUrl,
  expiresHours,
  siteUrl = EMAIL_BRAND.siteUrl,
}: StaffInviteEmailProps) {
  return (
    <BrandLayout
      preview="You are invited to the AUAPW team portal"
      eyebrow="Team access"
      title="You are invited to the team portal"
      documentLabel="Invite"
      siteUrl={siteUrl}
      cta={{ href: inviteUrl, label: "Set your password" }}
    >
      <Text className="m-0 mb-4 text-[15px] leading-6 text-brand-ink">Hi {name},</Text>
      <Text className="m-0 mb-4 text-[15px] leading-6 text-brand-ink">
        You have been invited to the All Used Auto Parts Warehouse team portal. Set your password to activate your
        account. This link expires in {expiresHours} hours.
      </Text>
      <Text className="m-0 text-sm leading-6 text-brand-mute">
        After setting your password, sign in at the staff login page. If you were not expecting this invitation, ignore
        this email.
      </Text>
    </BrandLayout>
  )
}

StaffInviteEmail.PreviewProps = {
  name: "Alex Rivera",
  inviteUrl: "https://allusedautopartswarehouse.com/admin/login",
  expiresHours: 72,
  siteUrl: EMAIL_BRAND.siteUrl,
} satisfies StaffInviteEmailProps
