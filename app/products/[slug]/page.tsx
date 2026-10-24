import { notFound, redirect } from 'next/navigation'
import { resolveUploadedProductLink } from '@/lib/uploaded-product-link'

export const dynamic = 'force-dynamic'

/** Preserve the original product URLs supplied by catalog spreadsheets. */
export default async function UploadedProductLink({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const destination = await resolveUploadedProductLink(slug)
  if (!destination) notFound()
  redirect(destination)
}
