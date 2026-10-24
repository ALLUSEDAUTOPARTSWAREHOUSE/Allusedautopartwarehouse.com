import "server-only"
import { BRAND_DIRECTORY, getBrandProductUrl, loadBrandCatalog } from "@/lib/brand-catalog"

function normalize(value: string): string {
  return decodeURIComponent(value).toLowerCase().replace(/[^a-z0-9-]/g, "")
}

export function resolveLegacyProductUrl(id: string): string | null {
  const target = normalize(id)
  for (const brand of BRAND_DIRECTORY) {
    const catalog = loadBrandCatalog(brand.slug)
    const product = catalog?.products.find((item) => {
      const candidates = [item.canonicalSlug, item.slug, item.mpn, item.partNumber]
      return candidates.some((candidate) => normalize(candidate || "") === target)
    })
    if (product) return getBrandProductUrl(brand.slug, product)
  }
  return null
}
