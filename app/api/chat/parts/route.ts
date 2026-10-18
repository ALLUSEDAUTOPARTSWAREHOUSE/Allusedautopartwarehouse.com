import { NextRequest, NextResponse } from "next/server"
import { searchCatalog } from "@/lib/ai-catalog"
import { CATALOG_INDEX } from "@/lib/catalog-index"
import { SHIPPING, USED_WARRANTY } from "@/lib/site-policy"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 120) ?? ""
  const make = req.nextUrl.searchParams.get("make")?.trim().slice(0, 60) ?? ""
  const categoryParam = req.nextUrl.searchParams.get("category")?.trim().toLowerCase() ?? ""
  const category = categoryParam === "engine" || categoryParam === "transmission" ? categoryParam : undefined

  const hits = q || make
    ? searchCatalog({ query: q, make: make || undefined, category, limit: 12 }).map((h) => ({
        name: h.name,
        year: h.year,
        model: h.model,
        brandLabel: h.brandLabel,
        category: h.category,
        price: h.price,
        url: h.url,
        warranty: h.warranty,
        shipping: h.shipping,
        availability: h.availability,
        compatibility: h.compatibility ?? "",
      }))
    : []

  const popular = CATALOG_INDEX.popular.slice(0, 8).map((p) => ({
    name: p.name,
    year: String(p.year),
    model: p.model,
    brandLabel: p.brandLabel,
    category: /trans/i.test(p.name) ? "transmission" : "engine",
    price: p.priceTiers.standard,
    url: `/brands/${p.brand}/${p.slug}`,
    warranty: USED_WARRANTY,
    shipping: SHIPPING.label,
    availability: "in stock",
    compatibility: p.variant || "",
  }))

  const brands = CATALOG_INDEX.makes.slice(0, 30).map((m) => ({
    label: m.label,
    slug: m.slug,
    count: m.count,
    url: `/brands/${m.slug}`,
  }))

  return NextResponse.json({ hits, popular, brands })
}
