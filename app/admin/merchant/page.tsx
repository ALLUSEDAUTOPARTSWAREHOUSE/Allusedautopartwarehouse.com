import { redirect } from "next/navigation"
import { Search } from "lucide-react"
import { getAdminSession } from "@/lib/admin-auth"
import { BRAND_DIRECTORY, getBrandLabel, getBrandProductBySlug, getBrandProductUrl } from "@/lib/brand-catalog"
import {
  ISSUE_LABELS,
  auditProduct,
  getEffectiveProduct,
  getFeedStats,
  listFeedFetches,
  listRecentOverrides,
  searchProductsForAdmin,
  type IssueCode,
} from "@/lib/merchant"
import { MerchantOverview } from "@/components/admin/merchant/merchant-overview"
import { MerchantPreflightCenter } from "@/components/admin/merchant/merchant-preflight-center"
import { ProductFixCard, type ProductFixCardProps } from "@/components/admin/merchant/product-fix-card"

export const dynamic = "force-dynamic"
export const maxDuration = 60
export const metadata = { title: "Google Shopping | AUAPW Admin", robots: { index: false } }

const inputClass = "rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"

export default async function AdminMerchantPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; q?: string; issue?: string }>
}) {
  if (!(await getAdminSession())) redirect("/admin/login")

  const params = await searchParams
  const brand = BRAND_DIRECTORY.find((b) => b.slug === params.brand)?.slug
  const issue = (Object.keys(ISSUE_LABELS) as IssueCode[]).find((c) => c === params.issue)
  const q = params.q?.trim().slice(0, 100) || undefined
  const searching = Boolean(brand || issue || q)

  const [stats, fetches, recentOverrides, search] = await Promise.all([
    getFeedStats(),
    listFeedFetches(8),
    listRecentOverrides(500),
    searching ? searchProductsForAdmin({ brand, q, issue, limit: 30 }) : null,
  ])

  const cards: ProductFixCardProps[] = search
    ? search.hits.map((h) => ({
        brand: h.brand,
        brandLabel: h.brandLabel,
        slug: h.slug,
        pagePath: h.effective.url.replace(/^https?:\/\/[^/]+/, ""),
        sheetName: h.sheet.name,
        sheetPrice: h.sheet.price,
        sheetDescription: h.sheet.description,
        imageUrl: h.effective.imageUrl,
        livePrice: h.effective.price,
        issues: h.issues.map((code) => ({ code, label: ISSUE_LABELS[code] })),
        override: h.override,
      }))
    : recentOverrides.slice(0, 30).flatMap((o) => {
        const product = getBrandProductBySlug(o.brand, o.slug)
        if (!product) return []
        const effective = getEffectiveProduct(o.brand, product, o)
        return [
          {
            brand: o.brand,
            brandLabel: getBrandLabel(o.brand),
            slug: o.slug,
            pagePath: getBrandProductUrl(o.brand, product),
            sheetName: product.name,
            sheetPrice: product.salesMode === "quote" ? null : product.price,
            sheetDescription: product.description || "",
            imageUrl: effective.imageUrl,
            livePrice: effective.price,
            issues: auditProduct(effective).map((code) => ({ code, label: ISSUE_LABELS[code] })),
            override: o,
          },
        ]
      })

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Google Shopping & Page Fixes</h1>
        <p className="text-sm text-muted-foreground">
          Sync the catalog to Google Merchant Center and fix product pages. Changes go live on the website instantly and
          reach Google on its next feed fetch.
        </p>
      </header>

      <MerchantOverview stats={stats} fetches={fetches} overrideCount={recentOverrides.length} />

      <MerchantPreflightCenter stats={stats} />

      <section id="fix-pages" aria-labelledby="fix-heading" className="flex scroll-mt-24 flex-col gap-4">
        <div>
          <h2 id="fix-heading" className="text-xl font-semibold text-foreground">
            Change or fix pages
          </h2>
          <p className="text-sm text-muted-foreground">
            Search any product page, then override its title, description, price, image or availability. Leave a field
            blank to keep the original sheet value.
          </p>
        </div>

        <form action="/admin/merchant#fix-pages" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Brand
            <select name="brand" defaultValue={brand ?? ""} className={inputClass}>
              <option value="">All brands</option>
              {BRAND_DIRECTORY.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Issue
            <select name="issue" defaultValue={issue ?? ""} className={inputClass}>
              <option value="">Any</option>
              {(Object.keys(ISSUE_LABELS) as IssueCode[]).map((code) => (
                <option key={code} value={code}>
                  {ISSUE_LABELS[code]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground">
            Search
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
              <input
                name="q"
                defaultValue={q}
                placeholder="e.g. 2015 Camry, 2.5L, transmission…"
                className={`${inputClass} w-full pl-9`}
              />
            </span>
          </label>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Find pages
          </button>
        </form>

        <p className="text-sm text-muted-foreground" role="status">
          {search
            ? `${search.total.toLocaleString()} matching page${search.total === 1 ? "" : "s"}${search.total > cards.length ? ` — showing the first ${cards.length}, narrow the search to see more` : ""}.`
            : cards.length
              ? "Recently edited pages:"
              : "No pages edited yet. Search above to start fixing a page."}
        </p>

        <div className="flex flex-col gap-4">
          {cards.map((c) => (
            <ProductFixCard key={`${c.brand}/${c.slug}`} {...c} />
          ))}
        </div>
      </section>
    </div>
  )
}
