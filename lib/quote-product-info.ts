import "server-only"

import { getBrandProductBySlug, getBrandProductUrl, isValidBrand } from "@/lib/brand-catalog"
import { getEffectiveProduct, getProductOverride } from "@/lib/merchant"
import { primeManualOverlay } from "@/lib/manual-products"

export interface QuoteProductInfo {
  name: string | null
  url: string | null
  brand: string | null
  slug: string | null
  priceMissing: boolean
  priceEditorUrl: string | null
}

/** Resolve a quote's product URL against the real catalog before showing an edit-price action. */
export async function getQuoteProductInfo(input: {
  productName?: string | null
  productUrl?: string | null
}): Promise<QuoteProductInfo> {
  const candidateUrl = input.productUrl ?? ""
  const pathOnly = candidateUrl.split(/[?#]/, 1)[0]
  const segments = pathOnly.split("/").filter(Boolean)
  const url = pathOnly.startsWith("/") && !pathOnly.startsWith("//") && !pathOnly.includes(String.fromCharCode(92)) && !pathOnly.includes("://") && !segments.some((segment) => segment === "." || segment === "..") ? pathOnly : null
  const match = url?.match(/^\/brands\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/i)
  if (!match || !isValidBrand(match[1])) {
    return { name: input.productName || null, url, brand: null, slug: null, priceMissing: false, priceEditorUrl: null }
  }

  const brand = match[1].toLowerCase()
  const slug = match[2]
  try {
    await primeManualOverlay(brand)
    const product = getBrandProductBySlug(brand, slug)
    if (!product) return { name: input.productName || null, url, brand: null, slug: null, priceMissing: false, priceEditorUrl: null }
    const override = await getProductOverride(brand, slug)
    const effective = getEffectiveProduct(brand, product, override)
    const priceMissing = effective.price === null || effective.price <= 0
    return {
      name: input.productName || effective.title || product.name,
      url: getBrandProductUrl(brand, product),
      brand,
      slug,
      priceMissing,
      priceEditorUrl: priceMissing
        ? `/admin/products?brand=${encodeURIComponent(brand)}&q=${encodeURIComponent(slug)}&issue=no_price#fix-pages`
        : null,
    }
  } catch {
    return { name: input.productName || null, url, brand: null, slug: null, priceMissing: false, priceEditorUrl: null }
  }
}
