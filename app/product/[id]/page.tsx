import { redirect } from "next/navigation"
import { resolveLegacyProductUrl } from "@/lib/legacy-product-url"

export default async function LegacyProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(resolveLegacyProductUrl(id) ?? "/brands")
}
