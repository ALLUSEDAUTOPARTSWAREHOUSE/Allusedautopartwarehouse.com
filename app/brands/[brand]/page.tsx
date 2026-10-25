import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { SeoBacklinks } from '@/components/seo-backlinks'
import { BrandProductImage } from '@/components/brands/brand-product-image'
import { TrustBadges } from '@/components/products/trust-badges'
import {
  BRAND_DIRECTORY,
  getBrandLabel,
  getBrandModels,
  getBrandProductUrl,
  getProductDisplayImage,
  isValidBrand,
  loadBrandCatalog,
  resolveBrandPartImage,
  searchBrandProducts,
} from '@/lib/brand-catalog'
import { ChevronRight, ChevronLeft, Search } from 'lucide-react'
import { SearchForm } from '@/components/search-form'
import { BrandStorySection } from '@/components/brands/brand-story-section'
import { BrandFeaturesSection } from '@/components/brands/brand-features-section'
import { BrandMaterialTabs } from '@/components/brands/brand-material-tabs'
import { MaterialType, filterPartsByMaterial, countPartsByMaterial } from '@/lib/material-mapper'
import { primeManualOverlay } from '@/lib/manual-products'
import { getBrandLogoUrl } from '@/lib/data'

// No /brand-cars/<brand>-car.png exists for these makes.
const BRANDS_WITHOUT_CAR_IMAGE = new Set(['aston-martin', 'austin'])

interface PageProps {
  params: Promise<{ brand: string }>
  searchParams: Promise<{ q?: string; model?: string; category?: string; material?: string; page?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { brand } = await params
  if (!isValidBrand(brand)) return {}
  const label = getBrandLabel(brand)
  const catalog = loadBrandCatalog(brand)
  const productCount = catalog?.products?.length || 0
  return {
    title: `Used ${label} Engines, Transmissions & Parts | Exact Mileage Pricing`,
    description: `Shop ${productCount > 0 ? productCount.toLocaleString() : ''} used OEM ${label} engines, transmissions, and parts. Exact low/medium/high mileage pricing, tested parts, 90-day warranty, nationwide shipping.`,
  }
}

export default async function BrandCatalogPage({ params, searchParams }: PageProps) {
  const { brand } = await params
  const sp = await searchParams
  if (!isValidBrand(brand)) notFound()
  await primeManualOverlay(brand)

  const label = getBrandLabel(brand)
  const catalog = loadBrandCatalog(brand)
  if (!catalog) notFound()

  const page = Number.parseInt(sp.page || '1', 10) || 1
  const material = (sp.material as MaterialType | 'all') || undefined
  let result = searchBrandProducts(brand, { q: sp.q, model: sp.model, category: sp.category, page })
  
  // Apply material filter if selected
  if (material && material !== 'all') {
    result = {
      ...result,
      products: filterPartsByMaterial(result.products, material)
    }
  }

  const models = getBrandModels(brand).slice(0, 24)
  
  // Calculate material counts for the current category/search
  const allProductsForCount = catalog?.products || []
  const categoryFiltered = allProductsForCount.filter((p) => {
    const matchesSearch = sp.q === undefined || p.name.toLowerCase().includes(sp.q.toLowerCase())
    const matchesCategory = sp.category === undefined || p.category === sp.category
    const matchesModel = sp.model === undefined || p.model === sp.model
    return matchesSearch && matchesCategory && matchesModel
  })
  const materialCounts = countPartsByMaterial(categoryFiltered)

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries({ q: sp.q, model: sp.model, category: sp.category, material: sp.material, ...overrides })) {
      if (v) q.set(k, v)
    }
    const s = q.toString()
    return s ? `?${s}` : ''
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 lg:pt-28">
        {/* LUXURY HERO SECTION: Premium Gradient + Brand Showcase */}
        <section className="relative h-[420px] sm:h-[520px] lg:h-[640px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 overflow-hidden">
          {/* Subtle Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/30 via-transparent to-slate-900/30" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-400/30 to-transparent" />
          </div>

          {/* Car Background Image - if available */}
          {brand && !BRANDS_WITHOUT_CAR_IMAGE.has(brand) && (
            <div className="absolute inset-0 opacity-30">
              <Image
                src={`/brand-cars/${brand}-car.png`}
                alt={`${label} featured vehicle`}
                fill
                className="object-cover object-center"
                priority
                sizes="100vw"
              />
            </div>
          )}

          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-between items-start z-10">
            {/* Top: Premium Badge */}
            <div className="w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-foreground/70 border border-foreground/20 bg-foreground/5 px-4 py-2 rounded-full backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/50" />
                {label} · Premium Parts
              </div>
            </div>

            {/* Bottom: Title + Logo */}
            <div className="w-full px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 lg:pb-16 flex justify-between items-end gap-6">
              <div className="flex-1">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white drop-shadow-xl text-balance leading-tight mb-2">
                  {`${label}`}
                </h1>
                <p className="text-foreground/70 text-sm sm:text-base font-medium">Premium OEM Parts Inventory</p>
              </div>

              {/* Logo Badge - Minimal Luxury */}
              {brand && (
                <div className="w-28 h-28 sm:w-36 sm:h-36 relative flex-shrink-0">
                  <div className="relative w-full h-full bg-slate-100 backdrop-blur rounded-2xl shadow-2xl p-3 sm:p-4 border border-slate-200/50 flex items-center justify-center">
                    <Image
                      src={getBrandLogoUrl(label) || `/logos/${brand}.png`}
                      alt={`${label} logo`}
                      fill
                      className="object-contain object-center p-2 sm:p-3"
                      sizes="144px"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Luxury Stats + Details Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-background to-background/50 border-b border-foreground/10 relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground mb-8 flex-wrap font-medium">
              <Link href="/" className="hover:text-foreground/80 transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3 opacity-50" />
              <Link href="/brands" className="hover:text-foreground/80 transition-colors">Brands</Link>
              <ChevronRight className="w-3 h-3 opacity-50" />
              <span className="text-foreground/70 font-semibold">{label} Parts</span>
            </nav>

            {/* Title and Description */}
            <div className="mb-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
                Engines, Transmissions & Parts
              </h2>
              <p className="max-w-3xl text-base sm:text-lg text-foreground/80 leading-relaxed">
                Discover our extensive inventory of {(catalog?.products?.length || 0).toLocaleString()} tested, high-quality used OEM {label} parts. Every component is rigorously inspected with exact mileage-based pricing, 90-day warranty, and nationwide shipping.
              </p>
            </div>

            {/* Luxury Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Stat 1: Total Parts */}
              <div className="group relative p-6 sm:p-8 rounded-2xl border border-foreground/10 bg-foreground/5 hover:border-foreground/20 transition-all duration-300">
                <div className="relative">
                  <div className="text-4xl sm:text-5xl font-black text-white mb-2">
                    {(catalog?.products?.length || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-foreground/60 font-bold">Total Parts in Inventory</div>
                </div>
              </div>

              {/* Stat 2: Compatible Models */}
              <div className="group relative p-6 sm:p-8 rounded-2xl border border-foreground/10 bg-foreground/5 hover:border-foreground/20 transition-all duration-300">
                <div className="relative">
                  <div className="text-4xl sm:text-5xl font-black text-white mb-2">
                    {models.length}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-foreground/60 font-bold">Compatible Models</div>
                </div>
              </div>

              {/* Stat 3: Warranty */}
              <div className="group relative p-6 sm:p-8 rounded-2xl border border-foreground/10 bg-foreground/5 hover:border-foreground/20 transition-all duration-300">
                <div className="relative">
                  <div className="text-4xl sm:text-5xl font-black text-white mb-2">
                    90 Days
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-foreground/60 font-bold">Complete Warranty</div>
                </div>
              </div>
            </div>

            {/* Comprehensive Search Form */}
            <div className="mt-12">
              <SearchForm compact={true} />
            </div>
          </div>
        </section>

        {/* Brand Story Section */}
        <BrandStorySection brand={brand} label={label} productCount={catalog?.products?.length || 0} />

        {/* Brand Features Section */}
        <BrandFeaturesSection
          brandName={label}
          partCount={catalog?.products?.length || 0}
          modelCount={models.length}
        />

        {/* Model filter table - Glassmorphism Design */}
        {models.length > 1 && (
          <section className="bg-gradient-to-b from-slate-900/40 to-slate-800/20 backdrop-blur-xl border-b border-white/10 py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-xs uppercase tracking-widest font-bold text-slate-300 mb-6">Filter by model</h2>
              <nav aria-label={`${label} models`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Link
                  href={`/brands/${brand}${buildQuery({ model: undefined, page: undefined })}`}
                  className={`group rounded-xl border backdrop-blur-lg px-4 py-3 text-sm font-semibold transition-all ${
                    !sp.model
                      ? 'border-white/40 bg-white/20 text-white shadow-lg hover:shadow-xl'
                      : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10 hover:shadow-lg'
                  }`}
                >
                  All models ({models.reduce((sum, m) => sum + m.count, 0).toLocaleString()})
                </Link>
                {models.map(({ model, count }, idx) => (
                  <Link
                    key={model}
                    href={`/brands/${brand}${buildQuery({ model, page: undefined })}`}
                    className={`group rounded-xl border backdrop-blur-lg px-4 py-3 text-sm font-semibold transition-all flex items-center justify-between ${
                      sp.model === model
                        ? 'border-white/40 bg-white/20 text-white shadow-lg hover:shadow-xl'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10 hover:shadow-lg'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-bold leading-none w-6 text-right">{String(idx + 1).padStart(2, '0')}</span>
                      <span>{model}</span>
                    </span>
                    <span className="text-xs text-slate-400">{count.toLocaleString()}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </section>
        )}

        {/* Product grid */}
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-6 text-sm text-muted-foreground">
              {result.total.toLocaleString()} parts{sp.model ? ` for ${label} ${sp.model}` : ''}
              {sp.q ? ` matching "${sp.q}"` : ''} — page {result.page} of {result.pageCount}
            </p>

            {/* Material Filter Tabs */}
            <BrandMaterialTabs
              brand={brand}
              selected={material || 'all'}
              counts={materialCounts}
              currentParams={{ q: sp.q, model: sp.model, category: sp.category, page: sp.page }}
            />

            {result.products.length === 0 ? (
              <div className="rounded-xl border border-border/40 bg-card p-10 text-center">
                <p className="text-foreground font-semibold">No parts matched your search.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different keyword, or{' '}
                  <Link href="/quote" className="text-primary font-medium hover:underline">request a free quote</Link>{' '}
                  and we&apos;ll locate it for you.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {result.products.map((product) => (
                  <Link
                    key={product.canonicalSlug}
                    href={getBrandProductUrl(brand, product)}
                    className="group flex flex-col overflow-hidden rounded-xl border-2 border-slate-600 bg-gradient-to-br from-slate-800 to-slate-900 transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.6)] hover:border-slate-500 hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),inset_0_-2px_4px_rgba(0,0,0,0.5),0_8px_20px_rgba(0,0,0,0.8)]"
                  >
                    <div className="relative aspect-[4/3] w-full bg-muted">
                      <BrandProductImage
                        src={getProductDisplayImage(brand, product).src}
                        generatedSrc={getProductDisplayImage(brand, product).generatedSrc}
                        illustrative={getProductDisplayImage(brand, product).illustrative}
                        fallbackSrc={resolveBrandPartImage(product)}
                        alt={product.name}
                        sku={product.mpn || product.id}
                        brand={label}
                        year={product.year}
                        model={product.model}
                        category={product.category}
                        compact
                      />
                      <Badge className="absolute top-3 left-3 capitalize">{product.category || 'Part'}</Badge>
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <h2 className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h2>
                      <TrustBadges
                        productName={product.name}
                        isVerifiedPhoto={!getProductDisplayImage(brand, product).illustrative}
                        size="sm"
                      />
                      <div className="mt-auto flex items-baseline justify-between gap-2">
                        <span className="text-lg font-black text-primary">
                          {product.price > 0 ? `$${product.price.toLocaleString()}` : 'Call for price'}
                        </span>
                        {product.tiers && (
                          <span className="text-[11px] text-muted-foreground">
                            ${Math.min(product.tiers.high, product.tiers.low).toLocaleString()}–$
                            {Math.max(product.tiers.high, product.tiers.low).toLocaleString()} by mileage
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {result.pageCount > 1 && (
              <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
                {result.page > 1 && (
                  <Link
                    href={`/brands/${brand}${buildQuery({ page: String(result.page - 1) })}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/40 px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Link>
                )}
                <span className="px-3 text-sm text-muted-foreground">
                  Page {result.page} of {result.pageCount.toLocaleString()}
                </span>
                {result.page < result.pageCount && (
                  <Link
                    href={`/brands/${brand}${buildQuery({ page: String(result.page + 1) })}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/40 px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </nav>
            )}
          </div>
        </section>

        {/* Other brands */}
        <section className="py-8 border-t border-border/20 bg-card/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3">
              Shop other brands
            </h2>
            <nav aria-label="All brands" className="flex flex-wrap gap-2">
              {BRAND_DIRECTORY.filter((b) => b.slug !== brand).map((b) => (
                <Link
                  key={b.slug}
                  href={`/brands/${b.slug}`}
                  className="rounded-full border border-border/40 px-3 py-1 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  Used {b.label} Parts
                </Link>
              ))}
              <Link
                href="/acura"
                className="rounded-full border border-border/40 px-3 py-1 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                Used Acura Parts
              </Link>
            </nav>
          </div>
        </section>

        {/* Keyword-rich internal backlinks for Google indexing */}
        <SeoBacklinks make={label} partType="Engine" />
      </main>
      <Footer />
    </>
  )
}
