import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { ensureLeadProductColumns } from "@/lib/followup"

const iso = (value: unknown) => value instanceof Date ? value.toISOString() : value ? String(value) : null
const safeInternalPath = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes(String.fromCharCode(92)) || value.includes("://")) return null
  const path = value.split(/[?#]/, 1)[0]
  if (path.split("/").some((segment) => segment === "." || segment === "..")) return null
  return path
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  const userId = session?.user?.id
  if (!userId) {
    return Response.json({ error: "Please sign in to view your customer dashboard." }, {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    })
  }

  try {
    // Add only missing quote-link columns before reading the dashboard; existing rows remain unchanged.
    await ensureLeadProductColumns()
    const [orderResult, quoteResult] = await Promise.all([
      pool.query(
        `SELECT ordernumber, status, createdat, totalamount, items
           FROM public.orders
          WHERE userid = $1 AND userid <> $2
          ORDER BY createdat DESC
          LIMIT 100`,
        [userId, "guest"],
      ),
      pool.query(
        `SELECT id, part_type, make, model, year, product_name, product_url, status,
                quote_amount, created_at, updated_at
           FROM public.leads
          WHERE user_id = $1
          ORDER BY created_at DESC
          LIMIT 100`,
        [userId],
      ),
    ])

    const orders = orderResult.rows.map((row) => {
      const rawItems = Array.isArray(row.items) ? row.items : []
      const items = rawItems.slice(0, 25).map((value: unknown) => {
        const item = value && typeof value === "object" ? value as Record<string, unknown> : {}
        return {
          name: typeof item.name === "string" ? item.name.slice(0, 250) : "Auto part",
          quantity: Number.isFinite(Number(item.quantity)) ? Math.max(1, Math.min(99, Number(item.quantity))) : 1,
          url: safeInternalPath(item.url),
        }
      })
      return {
        orderNumber: String(row.ordernumber),
        status: String(row.status ?? "pending"),
        createdAt: iso(row.createdat),
        total: Number(row.totalamount) || 0,
        items,
        itemCount: items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
      }
    })

    const quotes = quoteResult.rows.map((row) => ({
      id: Number(row.id),
      partType: String(row.part_type ?? "Auto part"),
      make: row.make ? String(row.make) : null,
      model: row.model ? String(row.model) : null,
      year: row.year ? String(row.year) : null,
      productName: row.product_name ? String(row.product_name) : null,
      productUrl: safeInternalPath(row.product_url),
      status: String(row.status ?? "new"),
      quoteAmount: row.quote_amount === null || row.quote_amount === undefined ? null : Number(row.quote_amount),
      createdAt: iso(row.created_at),
      updatedAt: iso(row.updated_at),
    }))

    return Response.json({
      customer: { name: session.user.name ?? "", email: session.user.email },
      orders,
      quotes,
      limitations: "This dashboard shows records created while signed in to this account. Older guest checkouts or quote requests are not automatically linked by email.",
    }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("[customer-dashboard] Unable to load account records:", error instanceof Error ? error.message : "unknown error")
    return Response.json({ error: "Customer account records are temporarily unavailable." }, {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    })
  }
}
