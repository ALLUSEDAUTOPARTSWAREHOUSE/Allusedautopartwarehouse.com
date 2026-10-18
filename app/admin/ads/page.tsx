import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin-auth"
import { AdsControlCenter } from "@/components/admin/ads/ads-control-center"

export const dynamic = "force-dynamic"
export const metadata = { title: "Product Feeds & Ads Center | AUAPW Admin", robots: { index: false, follow: false } }

export default async function OpenAIAdsDashboard() {
  if (!(await getAdminSession())) redirect("/admin/login")
  return <AdsControlCenter />
}
