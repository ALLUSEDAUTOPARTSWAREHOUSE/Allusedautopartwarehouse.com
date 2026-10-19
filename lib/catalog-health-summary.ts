import type { BrandFeedStats } from '@/lib/merchant'

export function summarizeCatalog(stats: BrandFeedStats[]) {
  return stats.reduce((sum, brand) => ({
    total: sum.total + brand.total,
    visible: sum.visible + brand.total - brand.issues.hidden,
    eligible: sum.eligible + brand.eligible,
    missingPrices: sum.missingPrices + brand.issues.no_price,
    imageReviews: sum.imageReviews + brand.issues.illustrative_image,
    hidden: sum.hidden + brand.issues.hidden,
  }), { total: 0, visible: 0, eligible: 0, missingPrices: 0, imageReviews: 0, hidden: 0 })
}
export function filterCatalogBrands(stats: BrandFeedStats[], query: string, needsAttention: boolean) {
  const normalized = query.trim().toLowerCase()
  return stats.filter(brand => brand.label.toLowerCase().includes(normalized)
    && (!needsAttention || brand.issues.no_price > 0 || brand.issues.illustrative_image > 0 || brand.issues.hidden > 0 || brand.total !== brand.eligible))
}
