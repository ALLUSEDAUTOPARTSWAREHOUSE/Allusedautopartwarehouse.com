import { after } from "next/server"
import { RETURNS, SHIPPING, WARRANTY_SUMMARY } from "@/lib/site-policy"
import { BRAND_DIRECTORY, loadBrandCatalog } from "@/lib/brand-catalog"
import { getPartType } from "@/lib/catalog-fields"
import {
  MERCHANT_STORE_NAME,
  SITE_URL,
  cleanFeedTitle,
  collapseSheetQuotes,
  feedItemId,
  feedPriceBand,
  feedYearBand,
  getAllOverrides,
  getEffectiveProduct,
  isFeedEligible,
  logFeedFetch,
} from "@/lib/merchant"
import { primeManualOverlay } from "@/lib/manual-products"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const CATEGORY = {
  engine: "Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts > Motor Vehicle Engine Parts",
  transmission:
    "Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts > Motor Vehicle Transmission & Drivetrain Parts",
} as const

// Selling points the site already states (lib/site-policy), shown in the Shopping listing.
const HIGHLIGHTS_XML = ["Tested before it ships", WARRANTY_SUMMARY, RETURNS.window, "No core charge on used parts"]
  .map((h) => `<g:product_highlight>${xml(h)}</g:product_highlight>`)
  .join("")

// Handling and transit windows let Google show a delivery date on the ad.
const SHIPPING_XML =
  `<g:shipping><g:country>US</g:country>` +
  `<g:price>${SHIPPING.price.toFixed(2)} USD</g:price>` +
  `<g:min_handling_time>${SHIPPING.handlingDays.min}</g:min_handling_time>` +
  `<g:max_handling_time>${SHIPPING.handlingDays.max}</g:max_handling_time>` +
  `<g:min_transit_time>${SHIPPING.transitDays.min}</g:min_transit_time>` +
  `<g:max_transit_time>${SHIPPING.transitDays.max}</g:max_transit_time>` +
  `</g:shipping>`

function xml(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// Google's fetchers accept gzip. The full feed is ~108 MB of XML but ~3 MB
// gzipped, so compressing it here keeps the download small and fast and well
// under any platform limit on how much a function may send.
function acceptsGzip(request: Request): boolean {
  if (typeof CompressionStream !== "function") return false
  return (request.headers.get("accept-encoding") ?? "")
    .split(",")
    .some((part) => {
      const [coding, ...params] = part.trim().toLowerCase().split(";")
      if (coding.trim() !== "gzip") return false
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="))
      return !q || Number.parseFloat(q.slice(2)) > 0
    })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const brandFilter = url.searchParams.get("brand")
  const brands = brandFilter ? BRAND_DIRECTORY.filter((b) => b.slug === brandFilter) : BRAND_DIRECTORY
  if (brandFilter && brands.length === 0) return new Response("Unknown brand", { status: 404 })

  let overrides: Awaited<ReturnType<typeof getAllOverrides>>
  try {
    overrides = await getAllOverrides()
  } catch {
    overrides = new Map()
  }

  after(() => logFeedFetch(request.headers.get("user-agent"), brandFilter))

  const encoder = new TextEncoder()
  let index = 0

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n` +
            `<title>${xml(MERCHANT_STORE_NAME)}</title>\n<link>${SITE_URL}</link>\n` +
            `<description>Tested used OEM engines and transmissions with ${xml(SHIPPING.label)}.</description>\n`,
        ),
      )
    },
    async pull(controller) {
      const brand = brands[index++]
      if (!brand) {
        controller.enqueue(encoder.encode("</channel>\n</rss>\n"))
        controller.close()
        return
      }

      await primeManualOverlay(brand.slug)
      const catalog = loadBrandCatalog(brand.slug)
      const chunk: string[] = []
      for (const product of catalog?.products ?? []) {
        const effective = getEffectiveProduct(
          brand.slug,
          product,
          overrides.get(`${brand.slug}/${product.canonicalSlug}`) ?? null,
        )
        if (!isFeedEligible(effective)) continue

        const partType = getPartType(product)
        const partLabel = partType === "engine" ? "Engine" : "Transmission"
        const productType = `Used ${partLabel}s > ${brand.label}${product.model ? ` > ${product.model}` : ""}`
        const price = effective.price!
        const yearBand = feedYearBand(product.year)
        chunk.push(
          `<item>` +
            `<g:id>${feedItemId(brand.slug, product.canonicalSlug)}</g:id>` +
            `<title>${xml(cleanFeedTitle(effective.title))}</title>` +
            `<description>${xml(collapseSheetQuotes(effective.description).slice(0, 5000))}</description>` +
            `<link>${xml(effective.url)}</link>` +
            `<g:image_link>${xml(effective.imageUrl)}</g:image_link>` +
            `<g:condition>used</g:condition>` +
            `<g:availability>${effective.availability}</g:availability>` +
            `<g:price>${price.toFixed(2)} USD</g:price>` +
            `<g:brand>${xml(brand.label)}</g:brand>` +
            `<g:identifier_exists>no</g:identifier_exists>` +
            `<g:google_product_category>${xml(CATEGORY[partType])}</g:google_product_category>` +
            `<g:product_type>${xml(productType)}</g:product_type>` +
            HIGHLIGHTS_XML +
            SHIPPING_XML +
            `<g:custom_label_0>${xml(brand.label)}</g:custom_label_0>` +
            `<g:custom_label_1>${partType}</g:custom_label_1>` +
            `<g:custom_label_2>${feedPriceBand(price)}</g:custom_label_2>` +
            (yearBand ? `<g:custom_label_3>${yearBand}</g:custom_label_3>` : "") +
            `<g:custom_label_4>${effective.imageIsIllustrative ? "generated_image" : "photo"}</g:custom_label_4>` +
            `</item>\n`,
        )
      }
      if (chunk.length) controller.enqueue(encoder.encode(chunk.join("")))
    },
  })

  const gzip = acceptsGzip(request)
  const body = gzip ? (stream.pipeThrough(new CompressionStream("gzip") as any)) : stream
  return new Response(body as any, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      ...(gzip ? { "Content-Encoding": "gzip" } : {}),
      Vary: "Accept-Encoding",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  })
}
