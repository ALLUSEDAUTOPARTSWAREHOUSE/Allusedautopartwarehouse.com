import { redirect } from "next/navigation"
import { Search } from "lucide-react"
import { getAdminSession } from "@/lib/admin-auth"
import { BRAND_DIRECTORY, getBrandLabel, getBrandProductBySlug, getBrandProductUrl } from "@/lib/brand-catalog"
import {
  ISSUE_LABELS,
  auditProduct,
  getEffectiveProduct,
  listRecentOverrides,
  searchProductsForAdmin,
  type IssueCode,
} from "@/lib/merchant"
import type { ProductFixCardProps } from "@/components/admin/merchant/product-fix-card"
import { FixPagesList } from "@/components/admin/merchant/fix-pages-list"
import { CatalogSyncPanel } from "@/components/admin/merchant/catalog-sync-panel"
import { listManualProducts } from "@/lib/manual-products"
import { getSalesMode } from "@/lib/catalog-fields"

export const dynamic = "force-dynamic"
export const maxDuration = 60
export const metadata = { title: "Products | AUAPW Admin", robots: { index: false } }

const inputClass = "rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"

export default async function AdminMerchantPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; q?: string; issue?: string | string[] }>
}) {
  if (!(await getAdminSession())) redirect("/admin/login")

  const params = await searchParams
  const brand = BRAND_DIRECTORY.find((b) => b.slug === params.brand)?.slug
  const rawIssues = Array.isArray(params.issue) ? params.issue : params.issue ? [params.issue] : []
  const issues = (Object.keys(ISSUE_LABELS) as IssueCode[]).filter((c) => rawIssues.includes(c))
  const q = params.q?.trim().slice(0, 100) || undefined
  const searching = Boolean(brand || issues.length || q)

  const [recentOverrides, search, manualProducts] = await Promise.all([
    listRecentOverrides(500),
    searching ? searchProductsForAdmin({ brand, q, issues, limit: 30 }) : null,
    listManualProducts(),
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
            sheetPrice: getSalesMode(product) === "buy_now" ? product.price : null,
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
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <p className="text-sm text-muted-foreground">
          Upload spreadsheets and manage product prices, images and page content. Google feed monitoring is on its own dashboard.
        </p>
      </header>

      <CatalogSyncPanel
        brands={BRAND_DIRECTORY.map((b) => ({ slug: b.slug, label: b.label }))}
        manualProducts={manualProducts.map((p) => ({
          brand: p.brand,
          brandLabel: getBrandLabel(p.brand),
          slug: p.slug,
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          category: p.category,
          source: p.source,
          pagePath: `/brands/${p.brand}/${p.slug}`,
          createdAt: p.createdAt,
        }))}
      />

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

        <form action="/admin/products#fix-pages" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
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
          <fieldset className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            <legend className="mb-1">Issue (select any)</legend>
            <div className={`flex max-w-xs flex-wrap gap-x-3 gap-y-1 rounded-md border border-border bg-card px-3 py-2 font-normal text-foreground`}>
              {(Object.keys(ISSUE_LABELS) as IssueCode[]).map((code) => (
                <label key={code} className="inline-flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    name="issue"
                    value={code}
                    defaultChecked={issues.includes(code)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  {ISSUE_LABELS[code]}
                </label>
              ))}
            </div>
          </fieldset>
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

        <FixPagesList cards={cards} />
      </section>
    </div>
  )
}
