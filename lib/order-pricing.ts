import "server-only"
import { BRAND_DIRECTORY, getBrandProductBySlug, getBrandProductUrl } from "@/lib/brand-catalog"
import { getSalesMode } from "@/lib/catalog-fields"
import { applyOverrideToProduct, getAllOverrides } from "@/lib/merchant"
import { primeManualOverlay } from "@/lib/manual-products"
import { RESERVE_SHIPPING, SHIPPING, type ReserveDeliveryMethod } from "@/lib/site-policy"
import type { OrderLine } from "@/lib/followup"

export const MAX_UNITS_PER_PRODUCT = 5
export const MAX_LINES_PER_ORDER = 20
export const TAX_RATE = 0.08

export interface CartLineInput {
  id: string
  make?: string
  price: number
  quantity: number
}

export type PricingResult =
  | { ok: true; lines: OrderLine[]; subtotal: number; tax: number; shippingCost: number; totalAmount: number }
  | { ok: false; error: string }

const round2 = (n: number) => Math.round(n * 100) / 100

function findBrandSlug(make?: string): string | undefined {
  if (!make) return undefined
  const needle = make.trim().toLowerCase()
  return BRAND_DIRECTORY.find((b) => b.label.toLowerCase() === needle || b.slug === needle)?.slug
}

/**
 * Re-prices a cart from the catalog. The client price is only used to tell
 * which mileage tier the shopper picked; it must equal one of the catalog's
 * own prices for that part or the line is rejected.
 */
export async function priceCart(cart: CartLineInput[]): Promise<PricingResult> {
  if (!Array.isArray(cart) || cart.length === 0) return { ok: false, error: "Your cart is empty." }
  if (cart.length > MAX_LINES_PER_ORDER) return { ok: false, error: "Too many items in one order. Please call us." }

  let overrides: Awaited<ReturnType<typeof getAllOverrides>>
  try {
    overrides = await getAllOverrides()
  } catch {
    // Unlike browsing, checkout must not fall back to stale prices or stock.
    return { ok: false, error: "We couldn't verify current prices and availability. Please try again shortly." }
  }

  const unitsByProduct = new Map<string, number>()
  const lines: OrderLine[] = []

  for (const item of cart) {
    const quantity = Number(item.quantity)
    if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, error: "Invalid quantity in cart." }

    const brand = findBrandSlug(item.make)
    // Admin-added products live in the DB; load them so they can be bought like sheet parts.
    if (brand) await primeManualOverlay(brand)
    // Older Google checkout links stored brand/slug instead of the canonical slug.
    const slug = brand && item.id.startsWith(`${brand}/`) ? item.id.slice(brand.length + 1) : item.id
    const catalogProduct = brand ? getBrandProductBySlug(brand, slug) : undefined
    if (!brand || !catalogProduct) {
      return { ok: false, error: "One of the parts in your cart needs a phone quote. Please call us to order it." }
    }
    const override = overrides.get(`${brand}/${catalogProduct.canonicalSlug}`) ?? null
    if (override?.hidden || (override?.availability && override.availability !== "in_stock")) {
      return { ok: false, error: `${catalogProduct.name} is currently unavailable for online purchase. Please contact us.` }
    }
    const product = applyOverrideToProduct(catalogProduct, override)
    if (getSalesMode(product) !== "buy_now") {
      return { ok: false, error: `${product.name} is quote-only. Please call us to order it.` }
    }

    const catalogPrices = [product.price, product.tiers?.low, product.tiers?.medium, product.tiers?.high].filter(
      (p): p is number => typeof p === "number" && p > 0,
    )
    const unitPrice = catalogPrices.find((p) => Math.abs(p - Number(item.price)) < 0.01)
    if (unitPrice === undefined) {
      return { ok: false, error: `The price for ${product.name} has changed. Please re-add it to your cart.` }
    }

    const productKey = `${brand}/${product.canonicalSlug}`
    const units = (unitsByProduct.get(productKey) ?? 0) + quantity
    if (units > MAX_UNITS_PER_PRODUCT) {
      return { ok: false, error: `Online orders are limited to ${MAX_UNITS_PER_PRODUCT} of the same part. Call us for fleet orders.` }
    }
    unitsByProduct.set(productKey, units)

    lines.push({
      productId: product.id,
      name: product.name,
      make: brand,
      unitPrice,
      quantity,
      lineTotal: round2(unitPrice * quantity),
      url: getBrandProductUrl(brand, product),
    })
  }

  const subtotal = round2(lines.reduce((sum, l) => sum + l.lineTotal, 0))
  const shippingCost = round2(SHIPPING.price * lines.reduce((sum, l) => sum + l.quantity, 0))
  const tax = round2(subtotal * TAX_RATE)
  return { ok: true, lines, subtotal, tax, shippingCost, totalAmount: round2(subtotal + tax + shippingCost) }
}

export interface ReservationCartLineInput {
  id: string
  make?: string
  quantity: number
}

/**
 * Prices a "Reserve & Place Order" cart: quote-only parts reserved online
 * with no payment collected. There is no catalog sheet price to validate
 * against (that's what makes the part quote-only), so every line is $0 and
 * the part's real price is confirmed by phone before any charge — only the
 * chosen delivery surcharge is due today.
 */
export async function priceReservationCart(
  cart: ReservationCartLineInput[],
  deliveryMethod: ReserveDeliveryMethod,
): Promise<PricingResult> {
  if (!Array.isArray(cart) || cart.length === 0) return { ok: false, error: "Your cart is empty." }
  if (cart.length > MAX_LINES_PER_ORDER) return { ok: false, error: "Too many items in one order. Please call us." }
  if (deliveryMethod !== "standard" && deliveryMethod !== "liftgate") {
    return { ok: false, error: "Please choose a delivery method." }
  }

  let overrides: Awaited<ReturnType<typeof getAllOverrides>>
  try {
    overrides = await getAllOverrides()
  } catch {
    return { ok: false, error: "We couldn't verify current availability. Please try again shortly." }
  }

  const unitsByProduct = new Map<string, number>()
  const lines: OrderLine[] = []

  for (const item of cart) {
    const quantity = Number(item.quantity)
    if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, error: "Invalid quantity in cart." }

    const brand = findBrandSlug(item.make)
    // Admin-added products live in the DB; load them so they can be bought like sheet parts.
    if (brand) await primeManualOverlay(brand)
    const slug = brand && item.id.startsWith(`${brand}/`) ? item.id.slice(brand.length + 1) : item.id
    const catalogProduct = brand ? getBrandProductBySlug(brand, slug) : undefined
    if (!brand || !catalogProduct) {
      return { ok: false, error: "One of the parts in your reservation could not be found. Please call us to order it." }
    }
    const override = overrides.get(`${brand}/${catalogProduct.canonicalSlug}`) ?? null
    if (override?.hidden || (override?.availability && override.availability !== "in_stock")) {
      return { ok: false, error: `${catalogProduct.name} is currently unavailable. Please contact us.` }
    }
    const product = applyOverrideToProduct(catalogProduct, override)
    if (getSalesMode(product) !== "quote") {
      return { ok: false, error: `${product.name} is priced online — please use the standard checkout.` }
    }
    const productKey = `${brand}/${product.canonicalSlug}`
    const units = (unitsByProduct.get(productKey) ?? 0) + quantity
    if (units > MAX_UNITS_PER_PRODUCT) {
      return { ok: false, error: `Online orders are limited to ${MAX_UNITS_PER_PRODUCT} of the same part. Call us for fleet orders.` }
    }
    unitsByProduct.set(productKey, units)

    lines.push({
      productId: product.id,
      name: product.name,
      make: brand,
      unitPrice: 0,
      quantity,
      lineTotal: 0,
      url: getBrandProductUrl(brand, product),
    })
  }

  const shippingCost = RESERVE_SHIPPING[deliveryMethod].price
  return { ok: true, lines, subtotal: 0, tax: 0, shippingCost, totalAmount: shippingCost }
}
