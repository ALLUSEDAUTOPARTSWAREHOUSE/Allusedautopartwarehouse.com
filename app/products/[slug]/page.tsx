import { notFound, redirect } from 'next/navigation'
import { resolveLegacyProductUrl } from '@/lib/legacy-product-url'
import { resolveUploadedProductLink } from '@/lib/uploaded-product-link'

export const dynamic = 'force-dynamic'

/** Resolve spreadsheet URLs and legacy IDs through one unambiguous route. */
export default async function ProductLink({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const destination = (await resolveUploadedProductLink(slug)) ?? resolveLegacyProductUrl(slug)
  if (!destination) notFound()
  redirect(destination)
}
