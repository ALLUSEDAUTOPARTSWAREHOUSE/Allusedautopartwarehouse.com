import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin-auth"
import { PasswordManagementClient } from "@/components/admin/password-management-client"

export const dynamic = "force-dynamic"
export const metadata = { title: "Password Management | AUAPW Admin", robots: { index: false, follow: false } }

export default async function AdminSecurityPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")
  return <PasswordManagementClient />
}
