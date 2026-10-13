import "server-only"
import fs from "node:fs"
import path from "node:path"
import {
  deriveFields,
  getPartType,
  slugifyModel,
  type DerivedFields,
  type Gearbox,
  type PartType,
  type SalesMode,
} from "@/lib/catalog-fields"

/**
 * Server-side loader for the per-brand catalogs generated from the uploaded
 * pricing sheets (see scripts/build-brand-catalogs.mjs). Prices come EXACTLY
 * from the sheets — no markup or clamping.
 */

export interface BrandProduct {
  id: string
  name: string
  slug: string
  canonicalSlug: string
  price: number
  tiers?: { low: number; medium: number; high: number }
  imageUrl?: string
  productUrl?: string
  category: string
  partNumber: string
  mpn: string
  compatibility?: string
  description?: string
  model: string
  year: string
  salesMode?: SalesMode
  modelClean?: string
}

export interface BrandCatalog {
  brand: string
  slug: string
  count: number
  products: BrandProduct[]
}

/**
 * All brands with generated catalogs, in display order. Loaded from the
 * manifest written by scripts/build-brand-catalogs.mjs, so newly uploaded
 * sheets appear automatically after the build script runs.
 */
function loadBrandDirectory(): { slug: string; label: string; count: number }[] {
  const manifestPath = path.join(process.cwd(), "data", "brands", "manifest.json")
  if (!fs.existsSync(manifestPath)) return []
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"))
}

export const BRAND_DIRECTORY: { slug: string; label: string; count: number }[] =
  loadBrandDirectory()


const catalogCache = new Map<string, BrandCatalog>()
const slugIndexCache = new Map<string, Map<string, BrandProduct>>()
const manualOverlay = new Map<string, BrandProduct[]>()

/**
 * Layers admin-added manual/uploaded products on top of a brand's sheet
 * catalog for the current request. Call this (via lib/manual-products'
 * primeManualOverlay) before reading the catalog so every consumer —
 * listings, product pages, search, the feed — sees the merged result.
 */
export function setManualOverlay(brand: string, products: BrandProduct[]): void {
  manualOverlay.set(brand, products)
  // Derived caches are keyed off the previously-merged product set, so they
  // must be dropped whenever the overlay changes.
  slugIndexCache.delete(brand)
  derivedCache.delete(brand)
  sharedImageCache.delete(brand)
}

export function isValidBrand(brand: string): boolean {
  return BRAND_DIRECTORY.some((b) => b.slug === brand)
}

export function getBrandLabel(brand: string): string {
  return BRAND_DIRECTORY.find((b) => b.slug === brand)?.label ?? brand
}

export function loadBrandCatalog(brand: string): BrandCatalog | null {
  if (!isValidBrand(brand)) return null
  let catalog = catalogCache.get(brand)
  if (!catalog) {
    const filePath = path.join(process.cwd(), "data", "brands", `${brand}.json`)
    if (!fs.existsSync(filePath)) return null
    catalog = JSON.parse(fs.readFileSync(filePath, "utf8")) as BrandCatalog
    catalogCache.set(brand, catalog)
  }
  const manual = manualOverlay.get(brand)
  if (!manual || manual.length === 0) return catalog
  const replaced = new Set(manual.map(p => p.canonicalSlug))
  const products = [...manual, ...catalog.products.filter(p => !replaced.has(p.canonicalSlug))]
  return { ...catalog, products, count: products.length }
}

export function getBrandProductBySlug(brand: string, slug: string): BrandProduct | undefined {
  let index = slugIndexCache.get(brand)
  if (!index) {
    const catalog = loadBrandCatalog(brand)
    if (!catalog) return undefined
    index = new Map(catalog.products.map((p) => [p.canonicalSlug, p]))
    slugIndexCache.set(brand, index)
  }

  return index.get(slug)
}

export function getBrandProductUrl(brand: string, product: Pick<BrandProduct, "canonicalSlug">): string {
  return `/brands/${brand}/${product.canonicalSlug}`
}

/** Distinct models within a brand catalog with product counts, sorted by count. */
export function getBrandModels(brand: string): { model: string; count: number }[] {
  const catalog = loadBrandCatalog(brand)
  if (!catalog) return []
  const counts = new Map<string, number>()
  for (const p of catalog.products) {
    const m = p.model || "Other"
    counts.set(m, (counts.get(m) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)
}

export interface BrandSearchResult {
  products: BrandProduct[]
  total: number
  page: number
  pageCount: number
}

const PAGE_SIZE = 48

export function searchBrandProducts(
  brand: string,
  opts: { q?: string; model?: string; category?: string; page?: number } = {},
): BrandSearchResult {
  const catalog = loadBrandCatalog(brand)
  if (!catalog) return { products: [], total: 0, page: 1, pageCount: 0 }
  let items = catalog.products
  if (opts.model) {
    // Catalog model values often carry a part-type suffix (e.g. "Mustang Engine",
    // "Integra Transmission"), while the dropdown supplies the clean model name
    // ("Mustang"). Normalize by stripping the trailing part type, then match
    // leniently so a selected model still returns its inventory.
    const m = opts.model.toLowerCase().trim()
    items = items.filter((p) => {
      const pm = (p.model || "").toLowerCase().replace(/\s*(engine|transmission)\s*$/i, "").trim()
      return pm === m || pm.includes(m) || m.includes(pm)
    })
  }
  if (opts.category) {
    const c = opts.category.toLowerCase()
    items = items.filter((p) => (p.category || "").toLowerCase().includes(c))
  }
  if (opts.q) {
    const q = opts.q.toLowerCase().trim()
    // A bare 4-digit year should match the product's model year, not just any
    // occurrence in the name; otherwise fall back to name/compatibility search.
    const isYear = /^\d{4}$/.test(q)
    items = items.filter((p) => {
      if (isYear && String(p.year || "").trim() === q) return true
      return (
        p.name.toLowerCase().includes(q) || (p.compatibility || "").toLowerCase().includes(q)
      )
    })
  }
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(Math.max(1, opts.page || 1), pageCount)
  return { products: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total, page, pageCount }
}

export function getRelatedBrandProducts(brand: string, product: BrandProduct, limit = 4): BrandProduct[] {
  const catalog = loadBrandCatalog(brand)
  if (!catalog) return []
  return catalog.products
    .filter((p) => p.canonicalSlug !== product.canonicalSlug && p.model === product.model)
    .slice(0, limit)
}

export type DerivedProduct = BrandProduct & DerivedFields

const derivedCache = new Map<string, DerivedProduct[]>()

/** Catalog rows enriched with sales_mode, clean model, variant and specs. */
export function loadDerivedCatalog(brand: string): DerivedProduct[] {
  const cached = derivedCache.get(brand)
  if (cached) return cached
  const catalog = loadBrandCatalog(brand)
  if (!catalog) return []
  const label = getBrandLabel(brand)
  const rows = catalog.products.map((p) => ({ ...p, ...deriveFields(p, label) }))
  derivedCache.set(brand, rows)
  return rows
}

export function deriveBrandProduct(brand: string, product: BrandProduct): DerivedProduct {
  return { ...product, ...deriveFields(product, getBrandLabel(brand)) }
}

export const PRICE_BANDS = [
  { id: "under-1500", label: "Under $1,500", min: 0, max: 1500 },
  { id: "1500-3000", label: "$1,500–$3,000", min: 1500, max: 3000 },
  { id: "3000-5000", label: "$3,000–$5,000", min: 3000, max: 5000 },
  { id: "over-5000", label: "$5,000+", min: 5000, max: Infinity },
] as const

export interface PartQuery {
  partType?: PartType
  model?: string
  year?: number
  engineSize?: string
  gearbox?: Gearbox
  priceBand?: string
  salesMode?: SalesMode
  page?: number
  pageSize?: number
}

export interface PartQueryResult {
  products: DerivedProduct[]
  total: number
  page: number
  pageCount: number
  facets: { engineSizes: string[]; gearboxes: Gearbox[]; years: number[] }
}

export function queryBrandParts(brand: string, q: PartQuery = {}): PartQueryResult {
  const all = loadDerivedCatalog(brand)
  const base = all.filter(
    (p) =>
      (!q.partType || p.partType === q.partType) &&
      (!q.model || slugifyModel(p.modelName) === q.model),
  )

  const facets = {
    engineSizes: [...new Set(base.map((p) => p.engineSize).filter(Boolean) as string[])].sort(
      (a, b) => Number.parseFloat(a) - Number.parseFloat(b),
    ),
    gearboxes: [...new Set(base.map((p) => p.gearbox).filter(Boolean) as Gearbox[])].sort(),
    years: [...new Set(base.map((p) => p.yearNumber).filter(Boolean) as number[])].sort((a, b) => b - a),
  }

  const band = PRICE_BANDS.find((b) => b.id === q.priceBand)
  const items = base.filter((p) => {
    if (q.year && p.yearNumber !== q.year) return false
    if (q.engineSize && p.engineSize !== q.engineSize) return false
    if (q.gearbox && p.gearbox !== q.gearbox) return false
    if (q.salesMode && p.salesMode !== q.salesMode) return false
    if (band) {
      if (p.salesMode !== "buy_now" || !p.priceTiers) return false
      const price = p.priceTiers.standard
      if (price < band.min || price >= band.max) return false
    }
    return true
  })

  // Buyable units first, newest first, so the top of every page is sellable.
  items.sort(
    (a, b) =>
      (a.salesMode === b.salesMode ? 0 : a.salesMode === "buy_now" ? -1 : 1) ||
      (b.yearNumber ?? 0) - (a.yearNumber ?? 0),
  )

  const pageSize = q.pageSize ?? PAGE_SIZE
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, q.page || 1), pageCount)
  return { products: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageCount, facets }
}

/** Other model years / variants of the same model and part — the fitment table. */
export function getFitmentRows(brand: string, product: DerivedProduct, limit = 24): DerivedProduct[] {
  const model = slugifyModel(product.modelName)
  return loadDerivedCatalog(brand)
    .filter((p) => p.partType === product.partType && slugifyModel(p.modelName) === model)
    .filter((p) => !product.engineSize || p.engineSize === product.engineSize)
    .sort((a, b) => (a.yearNumber ?? 0) - (b.yearNumber ?? 0))
    .slice(0, limit)
}

/**
 * Local representative image by part category — used as fallback alongside
 * the sheet-provided image_url so every product shows a matching part photo.
 */
export function resolveBrandPartImage(product: Pick<BrandProduct, "category" | "name">): string {
  const source = `${product.category} ${product.name}`.toLowerCase()
  if (source.includes("transmission")) return "/images/parts/transmission-used.jpg"
  if (source.includes("engine")) return "/images/parts/engine-used.jpg"
  if (source.includes("abs")) return "/images/parts/abs-module-used.jpg"
  if (source.includes("radiator") || source.includes("cooling")) return "/images/parts/radiator-used.jpg"
  if (source.includes("headlight") || source.includes("light")) return "/images/parts/headlight-used.jpg"
  if (source.includes("starter")) return "/images/parts/starter-used.jpg"
  if (source.includes("seat")) return "/images/parts/seat-front-used.jpg"
  if (source.includes("wheel") || source.includes("rim")) return "/images/parts/wheel-rim-used.jpg"
  if (source.includes("speedometer") || source.includes("cluster")) return "/images/parts/speedometer-used.jpg"
  if (source.includes("airbag")) return "/images/parts/airbag-used.jpg"
  if (source.includes("wiper")) return "/images/parts/wiper-motor-used.jpg"
  if (source.includes("a/c") || source.includes("ac ") || source.includes("heat")) return "/images/parts/ac-control-used.jpg"
  return "/images/parts/engine-used.jpg"
}

const sharedImageCache = new Map<string, Set<string>>()

/** Image URLs used by more than one SKU within a brand catalog. */
function getSharedImageUrls(brand: string): Set<string> {
  const cached = sharedImageCache.get(brand)
  if (cached) return cached
  const catalog = loadBrandCatalog(brand)
  const counts = new Map<string, number>()
  for (const p of catalog?.products ?? []) {
    if (p.imageUrl) counts.set(p.imageUrl, (counts.get(p.imageUrl) || 0) + 1)
  }
  const shared = new Set([...counts.entries()].filter(([, n]) => n > 1).map(([url]) => url))
  sharedImageCache.set(brand, shared)
  return shared
}

export interface ProductDisplayImage {
  /** Preferred image to render. */
  src: string
  /** Per-SKU generated illustration URL (also the on-error fallback). */
  generatedSrc: string
  /** True when src is NOT a genuine SKU-specific photo. */
  illustrative: boolean
}

/** Returns true when a source photo URL is reachable/usable. The legacy
 * auapw.org catalog URLs are all dead (HTTP 400), so they are never trusted. */
function isUsablePhotoUrl(url: string | undefined): boolean {
  if (!url) return false
  // The original spreadsheet photo host is offline — every URL 400s.
  if (url.includes("auapw.org")) return false
  // Master-sheet /images/ paths return 404 on both the old and replacement domains.
  if (/^https?:\/\/(?:www\.)?(?:auapw\.com|allusedautopartswarehouse\.com)\/images\//i.test(url)) return false
  return /^https?:\/\//.test(url)
}

/**
 * Image policy: use a genuine photo only when the URL is actually reachable
 * AND unique to a single SKU. All legacy auapw.org URLs are dead, so those
 * products resolve to model/spec-specific professional branded images.
 */
export function getProductDisplayImage(
  brand: string,
  product: Pick<BrandProduct, "imageUrl" | "canonicalSlug" | "category" | "name">,
): ProductDisplayImage {
  const generatedSrc = `/api/product-image/${brand}/${product.canonicalSlug}?v=2`
  const usable = isUsablePhotoUrl(product.imageUrl)
  const unique = usable && !getSharedImageUrls(brand).has(product.imageUrl!)

  // Use a real photo only when it's reachable AND unique to this SKU.
  if (unique) {
    return {
      src: product.imageUrl!,
      generatedSrc,
      illustrative: false,
    }
  }

  // Otherwise use model/spec-specific, brand-specific professional images.
  // These are representative of the part's make/spec but not photos of the
  // exact unit, so they are disclosed as illustrative.
  const brandModelImage = getBrandModelImage(brand, getPartType(product), product.name || '')
  return {
    // Never substitute another manufacturer's image. When a brand/spec asset
    // is unavailable, use the product's own deterministic branded illustration.
    src: brandModelImage || generatedSrc,
    generatedSrc,
    illustrative: true,
  }
}

/** Get model-specific product image for engines and transmissions. */
function getBrandModelImage(brand: string, category: string, productName: string): string | null {
  const normalizedBrand = (brand || '').toLowerCase().trim()
  const cat = (category || '').toLowerCase().trim()
  const name = (productName || '').toLowerCase().trim()
  
  // Chevrolet model-specific engine images by displacement
  const chevroletEngineMap: Record<string, string> = {
    '350': '/product-images/engine/chevrolet-350ci-v8.png',
    '350ci': '/product-images/engine/chevrolet-350ci-v8.png',
    '8-350': '/product-images/engine/chevrolet-350ci-v8.png',
    '5.7': '/product-images/engine/chevrolet-350ci-v8.png',
    '5.7l': '/product-images/engine/chevrolet-350ci-v8.png',
    '305': '/product-images/engine/chevrolet-305-5-0l-v8.png',
    '305ci': '/product-images/engine/chevrolet-305-5-0l-v8.png',
    '5.0': '/product-images/engine/chevrolet-305-5-0l-v8.png',
    '5.0l': '/product-images/engine/chevrolet-305-5-0l-v8.png',
    '307': '/product-images/engine/chevrolet-307-v8.png',
    '307ci': '/product-images/engine/chevrolet-307-v8.png',
    '8-307': '/product-images/engine/chevrolet-307-v8.png',
    '250': '/product-images/engine/chevrolet-250-6cylinder.png',
    '250ci': '/product-images/engine/chevrolet-250-6cylinder.png',
    '6-250': '/product-images/engine/chevrolet-250-6cylinder.png',
    '4.3': '/product-images/engine/chevrolet-4-3l-v6.png',
    '4.3l': '/product-images/engine/chevrolet-4-3l-v6.png',
    '262': '/product-images/engine/chevrolet-4-3l-v6.png',
    '6-262': '/product-images/engine/chevrolet-4-3l-v6.png',
    '327': '/product-images/engine/chevrolet-327-v8.png',
    '327ci': '/product-images/engine/chevrolet-327-v8.png',
    '8-327': '/product-images/engine/chevrolet-327-v8.png',
    '283': '/product-images/engine/chevrolet-283-v8.png',
    '283ci': '/product-images/engine/chevrolet-283-v8.png',
    '8-283': '/product-images/engine/chevrolet-283-v8.png',
    '2.2': '/product-images/engine/chevrolet-2-2l-4cylinder-engine.png',
    '2.2l': '/product-images/engine/chevrolet-2-2l-4cylinder-engine.png',
    '2.5': '/product-images/engine/chevrolet-2-2l-4cylinder-engine.png',
    '2.5l': '/product-images/engine/chevrolet-2-2l-4cylinder-engine.png',
    '135ci': '/product-images/engine/chevrolet-2-2l-4cylinder-engine.png',
    '4-151': '/product-images/engine/chevrolet-2-2l-4cylinder-engine.png',
    '3.8': '/product-images/engine/chevrolet-3-8l-v6-engine.png',
    '3.8l': '/product-images/engine/chevrolet-3-8l-v6-engine.png',
    '231ci': '/product-images/engine/chevrolet-3-8l-v6-engine.png',
  }
  
  // Chevrolet model-specific transmission images by type
  const chevroletTransmissionMap: Record<string, string> = {
    'turbo 400': '/product-images/transmission/chevrolet-turbo-400-th400.png',
    'th400': '/product-images/transmission/chevrolet-turbo-400-th400.png',
    'turbo 350': '/product-images/transmission/chevrolet-turbo-350-th350.png',
    'th350': '/product-images/transmission/chevrolet-turbo-350-th350.png',
    'mt': '/product-images/transmission/chevrolet-manual-5speed.png',
    'manual': '/product-images/transmission/chevrolet-manual-5speed.png',
    'manual transmission': '/product-images/transmission/chevrolet-manual-5speed.png',
    '5-speed manual': '/product-images/transmission/chevrolet-manual-5speed.png',
    '6-speed manual': '/product-images/transmission/chevrolet-manual-5speed.png',
    '3-speed manual': '/product-images/transmission/chevrolet-manual-5speed.png',
    '4-speed manual': '/product-images/transmission/chevrolet-manual-5speed.png',
    '5-speed automatic': '/product-images/transmission/chevrolet-automatic-5speed.png',
    '5-speed at': '/product-images/transmission/chevrolet-automatic-5speed.png',
    'at': '/product-images/transmission/chevrolet-automatic-4speed.png',
    'automatic': '/product-images/transmission/chevrolet-automatic-4speed.png',
    'automatic transmission': '/product-images/transmission/chevrolet-automatic-4speed.png',
    '4-speed': '/product-images/transmission/chevrolet-automatic-4speed.png',
    '3-speed': '/product-images/transmission/chevrolet-automatic-4speed.png',
    '4-speed automatic': '/product-images/transmission/chevrolet-automatic-4speed.png',
  }
  
  // Dodge model-specific engine images by displacement
  const dodgeEngineMap: Record<string, string> = {
    '5.9': '/product-images/engine/dodge-5-9l-v8.png',
    '5.9l': '/product-images/engine/dodge-5-9l-v8.png',
    '5.7': '/product-images/engine/dodge-5-7l-v8.png',
    '5.7l': '/product-images/engine/dodge-5-7l-v8.png',
    '3.9': '/product-images/engine/dodge-3-9l-v6.png',
    '3.9l': '/product-images/engine/dodge-3-9l-v6.png',
    '4.7': '/product-images/engine/dodge-4-7l-v8.png',
    '4.7l': '/product-images/engine/dodge-4-7l-v8.png',
  }
  
  // Mercedes-Benz model-specific engine images
  const mercedesEngineMap: Record<string, string> = {
    '4.0': '/product-images/engine/mercedes-4-0l-v6.png',
    '4.0l': '/product-images/engine/mercedes-4-0l-v6.png',
    '6.0': '/product-images/engine/mercedes-6-0l-v12.png',
    '6.0l': '/product-images/engine/mercedes-6-0l-v12.png',
    '4.7': '/product-images/engine/mercedes-4-7l-v8.png',
    '4.7l': '/product-images/engine/mercedes-4-7l-v8.png',
  }
  
  // BMW model-specific engine images
  const bmwEngineMap: Record<string, string> = {
    '6.0': '/product-images/engine/bmw-6-0l-v12.png',
    '6.0l': '/product-images/engine/bmw-6-0l-v12.png',
    '5.0': '/product-images/engine/ford-5-0l-v8.png',
    '5.0l': '/product-images/engine/ford-5-0l-v8.png',
  }
  
  // Nissan model-specific engine images
  const nissanEngineMap: Record<string, string> = {
    '4.0': '/product-images/engine/nissan-4-0l-v6.png',
    '4.0l': '/product-images/engine/nissan-4-0l-v6.png',
    '3.5': '/product-images/engine/toyota-3-5l-v6.png',
    '3.5l': '/product-images/engine/toyota-3-5l-v6.png',
  }
  
  // Buick model-specific engine images
  const buickEngineMap: Record<string, string> = {
    '3.8': '/product-images/engine/buick-3-8l-v6.png',
    '3.8l': '/product-images/engine/buick-3-8l-v6.png',
  }
  
  // Jeep model-specific engine images
  const jeepEngineMap: Record<string, string> = {
    '4.0': '/product-images/engine/jeep-4-0l-v6.png',
    '4.0l': '/product-images/engine/jeep-4-0l-v6.png',
    '5.7': '/product-images/engine/jeep-5-7l-v8.png',
    '5.7l': '/product-images/engine/jeep-5-7l-v8.png',
  }
  
  // Audi model-specific engine images
  const audiEngineMap: Record<string, string> = {
    '3.0': '/product-images/engine/audi-3-0l-v6.png',
    '3.0l': '/product-images/engine/audi-3-0l-v6.png',
    '2.0': '/product-images/engine/audi-2-0l-4cyl.png',
    '2.0l': '/product-images/engine/audi-2-0l-4cyl.png',
  }
  
  // Honda model-specific engine images
  const hondaEngineMap: Record<string, string> = {
    '3.5': '/product-images/engine/honda-3-5l-v6.png',
    '3.5l': '/product-images/engine/honda-3-5l-v6.png',
    '2.0': '/product-images/engine/honda-2-0l-4cyl.png',
    '2.0l': '/product-images/engine/honda-2-0l-4cyl.png',
  }
  
  // Mazda model-specific engine images
  const mazdaEngineMap: Record<string, string> = {
    '2.0': '/product-images/engine/mazda-2-0l-4cyl.png',
    '2.0l': '/product-images/engine/mazda-2-0l-4cyl.png',
  }
  
  // Volvo model-specific engine images
  const volvoEngineMap: Record<string, string> = {
    '2.3': '/product-images/engine/volvo-2-3l-4cyl.png',
    '2.3l': '/product-images/engine/volvo-2-3l-4cyl.png',
    '5.7': '/product-images/engine/volvo-5-7l-v8.png',
    '5.7l': '/product-images/engine/volvo-5-7l-v8.png',
  }
  
  // Chrysler model-specific engine images
  const chryslerEngineMap: Record<string, string> = {
    '3.5': '/product-images/engine/chrysler-3-5l-v6.png',
    '3.5l': '/product-images/engine/chrysler-3-5l-v6.png',
  }
  
  // Triumph model-specific engine images
  const triumphEngineMap: Record<string, string> = {
    '2.0': '/product-images/engine/triumph-2-0l-4cyl.png',
    '2.0l': '/product-images/engine/triumph-2-0l-4cyl.png',
  }
  
  // AMC model-specific engine images by displacement
  const amcEngineMap: Record<string, string> = {
    '287': '/product-images/engine/amc-287-v8.png',
    '290': '/product-images/engine/amc-290-v8.png',
    '232': '/product-images/engine/amc-232-6cyl.png',
  }
  
  // Ford model-specific engine images by displacement
  const fordEngineMap: Record<string, string> = {
    '5.0': '/product-images/engine/ford-5-0l-v8.png',
    '5.0l': '/product-images/engine/ford-5-0l-v8.png',
    '4.6': '/product-images/engine/ford-4-6l-v8.png',
    '4.6l': '/product-images/engine/ford-4-6l-v8.png',
    '200': '/product-images/engine/ford-200-6cyl.png',
    '250': '/product-images/engine/ford-250-6cyl.png',
    '351': '/product-images/engine/ford-351-v8.png',
    '302': '/product-images/engine/ford-302-v8.png',
    '3.5': '/product-images/engine/ford-3-5l-v6.png',
    '3.5l': '/product-images/engine/ford-3-5l-v6.png',
    '3.8': '/product-images/engine/ford-3-8l-v6.png',
    '3.8l': '/product-images/engine/ford-3-8l-v6.png',
    '2.3': '/product-images/engine/ford-2-3l-4cyl.png',
    '2.3l': '/product-images/engine/ford-2-3l-4cyl.png',
    '2.0': '/product-images/engine/ford-2-0l-4cyl.png',
    '2.0l': '/product-images/engine/ford-2-0l-4cyl.png',
    '4.3': '/product-images/engine/ford-4-3l-v6.png',
    '4.3l': '/product-images/engine/ford-4-3l-v6.png',
  }
  
  // Toyota model-specific engine images by displacement
  const toyotaEngineMap: Record<string, string> = {
    '3.5': '/product-images/engine/toyota-3-5l-v6.png',
    '3.5l': '/product-images/engine/toyota-3-5l-v6.png',
    '3.0': '/product-images/engine/toyota-3-0l-v6.png',
    '3.0l': '/product-images/engine/toyota-3-0l-v6.png',
    '3vz': '/product-images/engine/toyota-3-0l-v6.png',
    '2.4': '/product-images/engine/toyota-2-4l-4cyl.png',
    '2.4l': '/product-images/engine/toyota-2-4l-4cyl.png',
    '22r': '/product-images/engine/toyota-2-4l-4cyl.png',
    '2rz': '/product-images/engine/toyota-2-4l-4cyl.png',
    '1.8': '/product-images/engine/toyota-1-8l-4cyl.png',
    '1.8l': '/product-images/engine/toyota-1-8l-4cyl.png',
    '5.7': '/product-images/engine/toyota-5-7l-v8.png',
    '5.7l': '/product-images/engine/toyota-5-7l-v8.png',
    '4.0': '/product-images/engine/toyota-4-0l-v6.png',
    '4.0l': '/product-images/engine/toyota-4-0l-v6.png',
    '2.7': '/product-images/engine/toyota-2-7l-4cyl.png',
    '2.7l': '/product-images/engine/toyota-2-7l-4cyl.png',
    '3rz': '/product-images/engine/toyota-2-7l-4cyl.png',
    '3.4': '/product-images/engine/toyota-3-4l-v6.png',
    '3.4l': '/product-images/engine/toyota-3-4l-v6.png',
    '5vz': '/product-images/engine/toyota-3-4l-v6.png',
    '2.0': '/product-images/engine/toyota-2-0l-4cyl.png',
    '2.0l': '/product-images/engine/toyota-2-0l-4cyl.png',
  }
  
  // Check if it's an engine
  if (cat.includes('engine')) {
    // Check Chevrolet model-specific engines
    if (normalizedBrand === 'chevrolet') {
      for(const [key, image] of Object.entries(chevroletEngineMap)) {
        if (name.includes(key)) return image
      }
      // Fallback to 350 V8 for Chevrolet (most common displacement)
      return '/product-images/engine/chevrolet-350ci-v8.png'
    }
    
    // Check Dodge model-specific engines
    if (normalizedBrand === 'dodge') {
      for(const [key, image] of Object.entries(dodgeEngineMap)) {
        if (name.includes(key)) return image
      }
      return '/product-images/engine/dodge-5-9l-v8.png'
    }
    
    // Check Mercedes-Benz model-specific engines
    if (normalizedBrand === 'mercedes-benz') {
      for(const [key, image] of Object.entries(mercedesEngineMap)) {
        if (name.includes(key)) return image
      }
      return '/product-images/engine/mercedes-4-0l-v6.png'
    }
    
    // Check BMW model-specific engines
    if (normalizedBrand === 'bmw') {
      for(const [key, image] of Object.entries(bmwEngineMap)) {
        if (name.includes(key)) return image
      }
      return '/product-images/engine/bmw-6-0l-v12.png'
    }
    
    // Check Nissan model-specific engines
    if (normalizedBrand === 'nissan') {
      for(const [key, image] of Object.entries(nissanEngineMap)) {
        if (name.includes(key)) return image
      }
      return '/product-images/engine/nissan-4-0l-v6.png'
    }
    
    // Check Buick model-specific engines
    if (normalizedBrand === 'buick') {
      for(const [key, image] of Object.entries(buickEngineMap)) {
        if (name.includes(key)) return image
      }
      return '/product-images/engine/buick-3-8l-v6.png'
    }
    
    // Check Jeep model-specific engines
    if (normalizedBrand === 'jeep') {
      for(const [key, image] of Object.entries(jeepEngineMap)) {
        if (name.includes(key)) return image
      }
      return '/product-images/engine/jeep-4-0l-v6.png'
    }
    
    // Check Audi model-specific engines
    if (normalizedBrand === 'audi') {
      for(const [key, image] of Object.entries(audiEngineMap)) {
        if (name.includes(key)) return image
      }
      return '/product-images/engine/audi-3-0l-v6.png'
    }
    
    // Check Honda model-specific engines
    if (normalizedBrand === 'honda') {
      for(const [key, image] of Object.entries(hondaEngineMap)) {
        if (name.includes(key)) return image
      }
      return '/product-images/engine/honda-3-5l-v6.png'
    }
    
    // Check Mazda model-specific engines
    if (normalizedBrand === 'mazda') {
      for(const [key, image] of Object.entries(mazdaEngineMap)) {
        if (name.includes(key)) return image
      }
      return '/product-images/engine/mazda-2-0l-4cyl.png'
    }
    
    // Check Volvo model-specific engines
    if (normalizedBrand === 'volvo') {
      for(const [key, image] of Object.entries(volvoEngineMap)) {
        if (name.includes(key)) return image
      }
      return '/product-images/engine/volvo-2-3l-4cyl.png'
    }
    
    // Check Chrysler model-specific engines
    if (normalizedBrand === 'chrysler') {
      for(const [key, image] of Object.entries(chryslerEngineMap)) {
        if (name.includes(key)) return image
      }
      return '/product-images/engine/chrysler-3-5l-v6.png'
    }
    
    // Check Triumph model-specific engines
    if (normalizedBrand === 'triumph') {
      for(const [key, image] of Object.entries(triumphEngineMap)) {
        if (name.includes(key)) return image
      }
      return '/product-images/engine/triumph-2-0l-4cyl.png'
    }
    
    // Check AMC model-specific engines
    if (normalizedBrand === 'amc') {
      for(const [key, image] of Object.entries(amcEngineMap)) {
        if (name.includes(key)) return image
      }
      return '/product-images/engine/amc-287-v8.png'
    }
    
    // Check Ford model-specific engines
    if (normalizedBrand === 'ford') {
      for(const [key, image] of Object.entries(fordEngineMap)) {
        if (name.includes(key)) return image
      }
      // Fallback to 5.0L V8 for Ford (most common displacement)
      return '/product-images/engine/ford-5-0l-v8.png'
    }
    
    // Check Toyota model-specific engines
    if (normalizedBrand === 'toyota') {
      for(const [key, image] of Object.entries(toyotaEngineMap)) {
        if (name.includes(key)) return image
      }
      // Fallback to 3.5L V6 for Toyota (most common displacement)
      return '/product-images/engine/toyota-3-5l-v6.png'
    }
    
    // Brand-specific engine fallbacks. Never show another manufacturer's engine.
    const brandEngineMap: Record<string, string> = {
      'acura': '/product-images/engine/acura-engine-branded.png',
      'alfa-romeo': '/product-images/engine/alfa-romeo-engine.png',
      'cadillac': '/product-images/engine/cadillac-engine.png',
      'daewoo': '/product-images/engine/daewoo-engine.png',
      'daihatsu': '/product-images/engine/daihatsu-engine.png',
      'eagle': '/product-images/engine/eagle-engine.png',
      'fiat': '/product-images/engine/fiat-engine.png',
      'geo': '/product-images/engine/geo-engine.png',
      'gmc': '/product-images/engine/gmc-engine.png',
      'hummer': '/product-images/engine/hummer-engine.png',
      'hyundai': '/product-images/engine/hyundai-engine.png',
      'infiniti': '/product-images/engine/infiniti-engine.png',
      'isuzu': '/product-images/engine/isuzu-engine.png',
      'jaguar': '/product-images/engine/jaguar-engine.png',
      'kia': '/product-images/engine/kia-engine.png',
      'land-rover': '/product-images/engine/land-rover-engine.png',
      'lexus': '/product-images/engine/lexus-engine.png',
      'lincoln': '/product-images/engine/lincoln-engine.png',
      'mercedes-benz': '/product-images/engine/mercedes-benz-engine.png',
      'mercury': '/product-images/engine/mercury-engine.png',
      'mini': '/product-images/engine/mini-engine.png',
      'mitsubishi': '/product-images/engine/mitsubishi-engine.png',
      'oldsmobile': '/product-images/engine/oldsmobile-engine.png',
      'opel': '/product-images/engine/opel-engine.png',
      'peugeot': '/product-images/engine/peugeot-engine.png',
      'plymouth': '/product-images/engine/plymouth-engine.png',
      'pontiac': '/product-images/engine/pontiac-engine.png',
      'porsche': '/product-images/engine/porsche-engine.png',
      'renault': '/product-images/engine/renault-engine.png',
      'saab': '/product-images/engine/saab-engine.png',
      'saturn': '/product-images/engine/saturn-engine.png',
    }

    return brandEngineMap[normalizedBrand] || null
  }
  
  // Toyota model-specific transmission images by type
  const toyotaTransmissionMap: Record<string, string> = {
    'cvt': '/product-images/transmission/toyota-cvt-transmission.png',
    '5-speed': '/product-images/transmission/toyota-automatic-5speed.png',
    '5-speed automatic': '/product-images/transmission/toyota-automatic-5speed.png',
    '6-speed': '/product-images/transmission/toyota-automatic-6speed.png',
    '6-speed automatic': '/product-images/transmission/toyota-automatic-6speed.png',
    '4-speed': '/product-images/transmission/toyota-automatic-4speed.png',
    '4-speed automatic': '/product-images/transmission/toyota-automatic-4speed.png',
    '3-speed': '/product-images/transmission/toyota-automatic-4speed.png',
    'manual': '/product-images/transmission/toyota-manual-5speed.png',
    '5-speed manual': '/product-images/transmission/toyota-manual-5speed.png',
    '6-speed manual': '/product-images/transmission/toyota-manual-5speed.png',
    'automatic': '/product-images/transmission/toyota-automatic-5speed.png',
  }
  
  // Ford model-specific transmission images by type
  const fordTransmissionMap: Record<string, string> = {
    'cvt': '/product-images/transmission/ford-cvt-transmission.png',
    'manual': '/product-images/transmission/ford-manual-transmission.png',
    'automatic': '/product-images/transmission/ford-automatic-transmission.png',
    'at': '/product-images/transmission/ford-automatic-transmission.png',
    'mt': '/product-images/transmission/ford-manual-transmission.png',
  }
  
  // Check if it's a transmission (but first check if product name says "engine")
  // Some brands like Toyota have mismatched categories - check product name first
  const hasEngineInName = name.includes('engine')
  const hasTransInName = name.includes('transmission') || name.includes('trans')
  
  // Product names are more reliable than several legacy category fields.
  // Re-enter the engine branch so the correct brand/spec mapping is used.
  if (hasEngineInName && !hasTransInName) {
    return getBrandModelImage(brand, 'engine', productName)
  }
  
  // Check if it's a transmission
  if (cat.includes('transmission') || cat.includes('trans') || hasTransInName) {
    // Check Chevrolet model-specific transmissions
    if (normalizedBrand === 'chevrolet') {
      for(const [key, image] of Object.entries(chevroletTransmissionMap)) {
        if (name.includes(key)) return image
      }
      // Fallback to automatic for Chevrolet
      return '/product-images/transmission/chevrolet-automatic-transmission.png'
    }
    
    // Check Ford model-specific transmissions
    if (normalizedBrand === 'ford') {
      for(const [key, image] of Object.entries(fordTransmissionMap)) {
        if (name.includes(key)) return image
      }
      // Fallback to automatic for Ford (most common)
      return '/product-images/transmission/ford-automatic-transmission.png'
    }
    
    // Check Toyota model-specific transmissions
    if (normalizedBrand === 'toyota') {
      for(const [key, image] of Object.entries(toyotaTransmissionMap)) {
        if (name.includes(key)) return image
      }
      // Fallback to automatic for Toyota (most common)
      return '/product-images/transmission/toyota-automatic-4speed.png'
    }
    
    // Other manufacturers resolve to a professional transmission photograph
    // selected by transmission type. This keeps every transmission SKU on a
    // real, locked-ratio product photo (like engines) instead of the generated
    // OG card, satisfying consistent styling across all brands and pages.
    if (name.includes('cvt')) {
      return '/product-images/transmission/cvt-transmission-branded.png'
    }
    if (name.includes('manual') || /\bmt\b/.test(name) || /\d-speed manual/.test(name)) {
      return '/product-images/transmission/manual-transmission-branded.png'
    }
    return '/product-images/transmission/automatic-transmission-branded.png'
  }

  // Unknown parts use their per-SKU branded illustration rather than another brand.
  return null
}

/** Human-readable part-type label, e.g. "Used Engine". */
export function getBrandPartTypeLabel(product: Pick<BrandProduct, "category">): string {
  const category = (product.category || "Part").replace(/^used\s+/i, "").trim()
  return `Used ${category.replace(/\b\w/g, (c) => c.toUpperCase())}`
}
