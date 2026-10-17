/**
 * Single source of truth for the shipping number and warranty ladder.
 * Every page, the metadata, the cart and the Merchant feed read from here so
 * the site can never again say "$240" in one place and "free" in another.
 */

export const PHONE_SALES = "1-888-887-4199"
export const PHONE_DISPLAY = "1-888-887-4199"
export const PHONE_HREF = "tel:+18888874199"

export const SHIPPING = {
  price: 240,
  label: "$240 flat-rate shipping per part",
  short: "$240 per part",
  allInNote: "$240 insured freight per part — liftgate and residential delivery included",
  liftgate: "Liftgate and residential delivery included",
  dispatch: "Ships in 1-2 business days",
  transit: "3-7 business days door to door in the lower 48",
  // The same windows as `dispatch` and `transit`, as numbers for the Google feed.
  handlingDays: { min: 1, max: 2 },
  transitDays: { min: 3, max: 7 },
  damage:
    "Every unit ships insured on a pallet. Note any damage on the delivery receipt and we replace or refund — you never file the freight claim yourself.",
} as const

/**
 * Delivery pricing for "Reserve & Place Order" — the online reservation path
 * for quote-only parts. No payment is collected online for these orders, so
 * this is a delivery-method surcharge only, separate from the buy-now
 * flat-rate SHIPPING above.
 */
export const RESERVE_SHIPPING = {
  standard: {
    price: 0,
    label: "Standard Freight",
    detail: "Free — curbside freight delivery, 3-7 business days door to door.",
  },
  liftgate: {
    price: 75,
    label: "Liftgate + Residential Delivery",
    detail: "+$75 — liftgate lowering and residential delivery included.",
  },
} as const

export type ReserveDeliveryMethod = keyof typeof RESERVE_SHIPPING

export interface WarrantyStep {
  tier: string
  length: string
  summary: string
}

export const WARRANTY_LADDER: WarrantyStep[] = [
  {
    tier: "Used",
    length: "90 days",
    summary:
      "Covers the whole part, not just the internals. If it fails, we replace it or refund you — a shop diagnostic sheet is enough to open a claim.",
  },
  {
    tier: "Rebuilt",
    length: "90 days",
    summary:
      "Fully disassembled, machined and rebuilt with new gaskets, seals and wear parts. Same plain-English claim process.",
  },
  {
    tier: "Labor cover",
    length: "Paid upgrade",
    summary:
      "Add labor reimbursement to either tier so a replacement covers the shop's install time too.",
  },
]

export const WARRANTY_SUMMARY = "90-day warranty on used and rebuilt parts"
export const USED_WARRANTY = "90 days"
export const REBUILT_WARRANTY = "90 days"

export const RETURNS = {
  window: "30-day returns",
  detail:
    "Return any unit within 30 days. No restocking fee on warranty swaps, and no core charge on used parts.",
} as const

export const TRUST_FACTS = [
  { label: SHIPPING.short, detail: "Insured, liftgate included" },
  { label: "90-day warranty", detail: "Used and rebuilt parts" },
  { label: "No core charge on used", detail: "Keep your old unit" },
  { label: "Ships 1-2 days", detail: "Tested, crated, dispatched" },
  { label: "30-day returns", detail: "Plain-English conditions" },
] as const
