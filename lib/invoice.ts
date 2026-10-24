import type { InvoiceEmailProps } from "@/emails/invoice"
import { getBrandLabel } from "@/lib/brand-catalog"
import { getBrandLogoUrl } from "@/lib/data"
import type { CustomerOrder, OrderLine } from "@/lib/followup"
import { PHONE_DISPLAY } from "@/lib/site-policy"

export const INVOICE_COMPANY = {
  legalName: "AUAPW LLC",
  tradeName: "All Used Auto Parts Warehouse",
  addressLines: ["508 S Elm St, Ste 104", "Denton, TX 76201", "United States"],
  phone: PHONE_DISPLAY,
  email: "support@allusedautopartswarehouse.com",
  website: "www.allusedautopartswarehouse.com",
  logoPath: "/auapw-logo.png",
} as const

export interface InvoiceTermSection {
  title: string
  paragraphs: string[]
}

/** Sale terms cloned from our invoice Notes/Terms, rebranded to AUAPW LLC. */
export const INVOICE_TERMS: InvoiceTermSection[] = [
  {
    title: "Payment Authorization",
    paragraphs: [
      "By placing this order you authorize AUAPW LLC to charge the card or payment method you provide for the total amount shown, once fitment and availability are confirmed. Your order will be processed after payment confirmation.",
    ],
  },
  {
    title: "Shipping Time Frame",
    paragraphs: [
      "Orders are processed after full payment is received. Parts leave our facilities after inspection. Standard dispatch is 1–2 business days, with 3–7 business days door-to-door in the lower 48. Tracking is emailed 24–48 hours after your item ships. Liftgate and residential delivery are included on buy-now freight.",
    ],
  },
  {
    title: "Parts Warranty",
    paragraphs: [
      "Parts carry a 90-day limited parts warranty as stated on this invoice (no labor warranty unless purchased separately). All parts must be installed within 10 business days of delivery, or the warranty is voided. Any defective or incorrect part must be returned to AUAPW within 10 business days of delivery, or the warranty will be voided.",
      "The warranty is voided if the part is not returned in the same condition it was sent in. We do not cover return shipping or initial shipping. The transaction fee is non-refundable.",
      "Engine warranties are limited to manufacturing defects in the block, heads, pistons, crankshafts, camshafts, rockers and oil pumps. Transmission warranties are limited to the transmission case, pan, tailshaft/housing, valve body (when required) and internal lubricated parts. Attached accessories — switches, sensors, cables, electronics, belts, hoses, water pumps, manifolds, and similar items — are not covered, even when included with the part. Timing belts, thermostats, spark plugs, fluids and seals are routine-maintenance items that must be replaced at installation and are not covered.",
      "A repair estimate and prior approval from AUAPW, proof of maintenance, and an itemized installer invoice are required to validate any warranty claim. This warranty applies only to the original purchaser for private, non-commercial use in the vehicle the part was installed in, and is not transferable.",
    ],
  },
  {
    title: "What Is Not Covered",
    paragraphs: [
      "Part accessories sent with the part for the convenience of installation.",
      "Parts applied to the wrong make, model, or year of vehicle when AUAPW did not specifically state they are the correct match for your vehicle.",
      "Labor costs you incur for installation of parts purchased from AUAPW.",
      "The year, make, and model listed on this invoice is within a range of interchangeability and may not be the exact year and model as the part or vehicle you input. It is the buyer’s responsibility to research and determine whether the items will fit other vehicles or work in other applications.",
    ],
  },
  {
    title: "Warranty Process",
    paragraphs: [
      "Vehicles must be taken to a licensed repair facility and diagnosed prior to filing a warranty claim and must remain there until the claim is resolved. Email support@allusedautopartswarehouse.com or call 1-888-887-4199 before your warranty period expires. Include the order number and details of the issue.",
      "We will review your warranty claim. We may request photos of the part and your VIN. We may replace the part with a functionally equivalent part, ask you to return the part, or refund the cost of the part. We reserve the right to inspect any item prior to refund or replacement.",
    ],
  },
  {
    title: "Warranty Limitations",
    paragraphs: [
      "Due to the nature of used auto parts, any liability of AUAPW LLC for all causes shall be limited to the price paid for the goods sold. If a warranted part fails to operate, liability is limited to replacement of the part or a remedy not to exceed the price paid for the part.",
    ],
  },
  {
    title: "All Warranties Are Null and Void If",
    paragraphs: [
      "The vehicle is converted from private passenger use to commercial or fleet use, or is used for racing, competition, or off-road recreational purposes.",
      "Failure is caused by abuse, misuse, modifications, collision, fire, theft, vandalism, riot, explosion, lightning, earthquake, windstorm, hail, water, freezing or flood.",
      "The part is installed or operated outside the United States, the installed heat tab center is melted or removed, or the part is sold “as is”.",
      "The vehicle is not serviced at proper intervals, or fuel/oil/coolant is not used in accordance with the vehicle manufacturer’s specifications. Engine oil and filter must be replaced and documented every 4,000 miles with OEM-recommended motor oil. Transmission fluid and filter must be replaced at installation with OEM-recommended fluid (must be documented).",
    ],
  },
  {
    title: "Labor and Installation",
    paragraphs: [
      "AUAPW LLC is not responsible for injury or damage sustained during or as a result of the installation of our parts. The installer must follow any recommended installation procedures we provide to maintain warranty coverage. This warranty does not cover freight costs or similar charges.",
      "All implied warranties, including merchantability or fitness for a particular purpose, are limited to the duration of this warranty and do not cover incidental or consequential damages. Some states do not allow these limitations, so they may not apply to you. This warranty gives you specific legal rights, which may vary from state to state.",
    ],
  },
  {
    title: "Returns, Refunds & Restocking Fee",
    paragraphs: [
      "You have 30 days from delivery to return a part for a refund; the original sales receipt/invoice must accompany the return. Refunds are issued after the returned part is received and inspected. Original shipping charges are deducted from the refund except for parts received damaged or shipped incorrectly.",
      "Orders cancelled after being placed and processed are subject to a 25% handling and restocking fee. Orders cancelled after shipping are subject to the 25% fee plus all shipping charges. Incorrectly ordered parts accepted as a return are also subject to the 25% restocking fee.",
      "Inspect the shipment thoroughly before accepting and signing for the delivery. Note any damage on the delivery receipt — we replace or refund and you never file the freight claim yourself.",
    ],
  },
  {
    title: "Fitment & Buyer Responsibility",
    paragraphs: [
      "It is the buyer’s responsibility to provide accurate vehicle information (year, make, model, trim and/or VIN). AUAPW is not responsible for labor costs, installation damage, or injury arising from installation of parts purchased.",
    ],
  },
]

export function money(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function escapeHtml(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function invoiceUrl(order: Pick<CustomerOrder, "orderNumber" | "invoiceToken">, siteUrl: string) {
  const base = `${siteUrl}/invoice/${encodeURIComponent(order.orderNumber)}`
  return order.invoiceToken ? `${base}?t=${encodeURIComponent(order.invoiceToken)}` : base
}

export function verifyOrderUrl(token: string, siteUrl: string) {
  return `${siteUrl}/orders/verify?token=${encodeURIComponent(token)}`
}

export function absoluteUrl(path: string, siteUrl: string) {
  if (!path) return ""
  if (/^https?:\/\//i.test(path)) return path
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`
}

export function brandLogoPath(make: string) {
  const label = getBrandLabel(make)
  const mapped = getBrandLogoUrl(label) || getBrandLogoUrl(make)
  if (mapped) return mapped
  const slug = make.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  return slug ? `/logos/${slug}.png` : ""
}

/** In-app product page path so invoices work on preview and production. */
export function productPagePath(line: OrderLine) {
  if (line.url?.startsWith("/")) return line.url
  return "/parts"
}

export function productHref(line: OrderLine, siteUrl: string) {
  return absoluteUrl(productPagePath(line), siteUrl)
}

export type InvoiceEmailKind = "verify" | "awaiting_payment" | "paid" | "reserved"

function statusHeadline(kind: InvoiceEmailKind, orderNumber: string) {
  switch (kind) {
    case "verify":
      return { title: "Confirm your AUAPW order", subject: `Verify your email to confirm order ${orderNumber}` }
    case "paid":
      return { title: "Payment received — we are processing your order", subject: `Your AUAPW invoice ${orderNumber} — paid` }
    case "reserved":
      return { title: "Part reserved", subject: `Your AUAPW reservation ${orderNumber}` }
    default:
      return {
        title: "Your order will be processed after payment confirmation",
        subject: `Your AUAPW invoice ${orderNumber} — awaiting payment`,
      }
  }
}

function lineRowsHtml(order: CustomerOrder, siteUrl: string) {
  return order.items
    .map((line) => {
      const logo = brandLogoPath(line.make)
      const href = productHref(line, siteUrl)
      const logoCell = logo
        ? `<img src="${escapeHtml(absoluteUrl(logo, siteUrl))}" alt="${escapeHtml(getBrandLabel(line.make))}" width="36" height="36" style="width:36px;height:36px;object-fit:contain;border-radius:4px" />`
        : ""
      return `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;vertical-align:middle">${logoCell}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb">
          <a href="${escapeHtml(href)}" style="color:#111827;font-weight:600;text-decoration:underline">${escapeHtml(line.name)}</a>
          <div style="color:#6b7280;font-size:12px;margin-top:4px">${escapeHtml(getBrandLabel(line.make))}</div>
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${line.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${escapeHtml(money(line.unitPrice))}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${escapeHtml(money(line.lineTotal))}</td>
      </tr>`
    })
    .join("")
}

function termsPreviewHtml() {
  return INVOICE_TERMS.slice(0, 3)
    .map(
      (section) =>
        `<h4 style="margin:16px 0 6px;font-size:13px">${escapeHtml(section.title)}</h4>
         <p style="margin:0;color:#4b5563;font-size:12px;line-height:1.5">${escapeHtml(section.paragraphs[0])}</p>`,
    )
    .join("")
}

export function buildInvoiceEmailModel(
  order: CustomerOrder,
  siteUrl: string,
  kind: InvoiceEmailKind,
): { subject: string; props: InvoiceEmailProps } {
  const { title, subject } = statusHeadline(kind, order.orderNumber)
  const viewInvoice = invoiceUrl(order, siteUrl)
  const intro =
    kind === "verify"
      ? `Please verify ${order.customerEmail || "your email"} to confirm order ${order.orderNumber}. Your order will be processed after payment confirmation.`
      : kind === "paid"
        ? `Thank you. Payment is confirmed for order ${order.orderNumber}. We are now processing your order.`
        : kind === "reserved"
          ? `This part is reserved for you — no payment has been taken. A specialist will call ${order.customerPhone || "you"} to confirm fitment and take payment only once you approve it.`
          : `Your email is confirmed for order ${order.orderNumber}. Your order will be processed after payment confirmation.`

  const props: InvoiceEmailProps = {
    kind,
    title,
    intro,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    customerName: order.customerName || "Customer",
    customerEmail: order.customerEmail || "",
    customerPhone: order.customerPhone || "",
    shippingAddress: order.shippingAddress || "",
    items: order.items.map((line) => {
      const logo = brandLogoPath(line.make)
      return {
        name: line.name,
        brand: getBrandLabel(line.make),
        logoUrl: logo ? absoluteUrl(logo, siteUrl) : undefined,
        href: productHref(line, siteUrl),
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      }
    }),
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    tax: order.tax,
    totalAmount: order.totalAmount,
    ctaUrl:
      kind === "verify" && order.emailVerifyToken
        ? verifyOrderUrl(order.emailVerifyToken, siteUrl)
        : viewInvoice,
    ctaLabel: kind === "verify" ? "Verify email and confirm order" : "View branded invoice",
    terms: INVOICE_TERMS.slice(0, 3).map((section) => ({
      title: section.title,
      body: section.paragraphs[0],
    })),
    siteUrl,
  }

  return { subject, props }
}

export function buildCustomerInvoiceEmail(order: CustomerOrder, siteUrl: string, kind: InvoiceEmailKind) {
  const { title, subject } = statusHeadline(kind, order.orderNumber)
  const viewInvoice = invoiceUrl(order, siteUrl)
  const logo = absoluteUrl(INVOICE_COMPANY.logoPath, siteUrl)
  const intro =
    kind === "verify"
      ? `Please verify <strong>${escapeHtml(order.customerEmail)}</strong> to confirm order <strong>${escapeHtml(order.orderNumber)}</strong>. Your order will be processed after payment confirmation.`
      : kind === "paid"
        ? `Thank you. Payment is confirmed for order <strong>${escapeHtml(order.orderNumber)}</strong>. We are now processing your order.`
        : kind === "reserved"
          ? `This part is reserved for you — no payment has been taken. A specialist will call ${escapeHtml(order.customerPhone)} to confirm fitment and take payment only once you approve it.`
          : `Your email is confirmed for order <strong>${escapeHtml(order.orderNumber)}</strong>. Your order will be processed after payment confirmation.`

  const cta =
    kind === "verify" && order.emailVerifyToken
      ? `<p style="margin:24px 0 8px"><a href="${escapeHtml(verifyOrderUrl(order.emailVerifyToken, siteUrl))}" style="background:#f59e0b;color:#111827;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">Verify email &amp; confirm order</a></p>`
      : `<p style="margin:24px 0 8px"><a href="${escapeHtml(viewInvoice)}" style="background:#f59e0b;color:#111827;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">View branded invoice</a></p>`

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;background:#ffffff;color:#111827">
    <div style="background:#0f1117;color:#fff;padding:20px 24px;display:flex;align-items:center;gap:16px">
      <img src="${escapeHtml(logo)}" alt="AUAPW LLC" width="56" height="56" style="width:56px;height:56px;object-fit:contain;background:#fff;border-radius:8px" />
      <div>
        <div style="font-size:18px;font-weight:800;letter-spacing:0.04em">AUAPW LLC</div>
        <div style="font-size:12px;color:#d1d5db">${escapeHtml(INVOICE_COMPANY.tradeName)}</div>
      </div>
    </div>
    <div style="padding:24px;border:1px solid #e5e7eb;border-top:none">
      <h2 style="margin:0 0 8px;font-size:20px">${escapeHtml(title)}</h2>
      <p style="margin:0 0 16px;color:#374151">${intro}</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px">
        <tr><td style="color:#6b7280;padding:4px 0;width:140px">Invoice #</td><td style="font-weight:700">${escapeHtml(order.orderNumber)}</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0">Date</td><td>${escapeHtml(new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" }))}</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0">Bill / ship to</td><td>${escapeHtml(order.customerName)}<br/>${escapeHtml(order.shippingAddress)}<br/>${escapeHtml(order.customerPhone)} · ${escapeHtml(order.customerEmail)}</td></tr>
      </table>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="text-align:left;padding:8px;width:48px">Brand</th>
            <th style="text-align:left;padding:8px">Item (product page)</th>
            <th style="text-align:right;padding:8px">Qty</th>
            <th style="text-align:right;padding:8px">Price</th>
            <th style="text-align:right;padding:8px">Amount</th>
          </tr>
        </thead>
        <tbody>${lineRowsHtml(order, siteUrl)}</tbody>
      </table>
      <table style="width:280px;margin-left:auto;margin-top:12px;border-collapse:collapse;font-size:13px">
        <tr><td style="padding:4px 0;color:#6b7280">Subtotal</td><td style="text-align:right">${escapeHtml(money(order.subtotal))}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280">Shipping</td><td style="text-align:right">${escapeHtml(money(order.shippingCost))}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280">Tax</td><td style="text-align:right">${escapeHtml(money(order.tax))}</td></tr>
        <tr><td style="padding:8px 0;font-weight:800;border-top:1px solid #e5e7eb">Amount due</td><td style="text-align:right;font-weight:800;border-top:1px solid #e5e7eb">${escapeHtml(money(order.totalAmount))}</td></tr>
      </table>
      ${cta}
      <h3 style="margin:28px 0 8px;font-size:15px">Notes / Terms</h3>
      ${termsPreviewHtml()}
      <p style="margin:16px 0 0;font-size:12px;color:#6b7280">The full sale terms are on your invoice. Questions? Call ${escapeHtml(INVOICE_COMPANY.phone)} or email ${escapeHtml(INVOICE_COMPANY.email)}.</p>
    </div>
  </div>`

  return { subject, html }
}
