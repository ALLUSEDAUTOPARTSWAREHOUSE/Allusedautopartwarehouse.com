import { ToolLoopAgent, isStepCount, tool, type InferAgentUIMessage } from "ai"
import { checkDatabase, checkEnvironment } from "@/lib/admin-health"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { bulkSetExcludeFromFeed } from "@/app/admin/merchant-actions"
import { getBrandProductBySlug, getBrandProductUrl, isValidBrand } from "@/lib/brand-catalog"
import { getOrderByNumber, countByStatus, listOrders, listQuoteLeads } from "@/lib/followup"
import { listConversations } from "@/lib/live-chat"
import { getFeedStats, getProductOverride, searchProductsForAdmin, upsertOverride, type IssueCode } from "@/lib/merchant"

const ISSUE_CODES = [
  "no_price",
  "title_too_long",
  "short_description",
  "illustrative_image",
  "hidden",
  "excluded",
] as const satisfies readonly IssueCode[]

const productRef = z.object({ brand: z.string().max(60), slug: z.string().max(300) })

const tools = {
  findOrderByNumber: tool({
    description: "Look up one exact order number for an authenticated administrator. Returns recorded status only; no inferred delivery dates or changes.",
    inputSchema: z.object({ orderNumber: z.string().trim().min(1).max(100) }),
    execute: async ({ orderNumber }) => {
      const order = await getOrderByNumber(orderNumber)
      return order ? { found: true, orderNumber: order.orderNumber, status: order.status, createdAt: order.createdAt, updatedAt: order.updatedAt, total: order.totalAmount }
        : { found: false, message: "No matching order found. Check the order number." }
    },
  }),
  checkWebsiteConfiguration: tool({
    description: "Check website configuration presence and database schema readiness. Read-only; does not inspect deployment logs, execute code or repair the website.",
    inputSchema: z.object({}),
    execute: async () => {
      const tables = await checkDatabase()
      return {
        configuration: checkEnvironment().map(({ name, set, required, purpose }) => ({ name, configured: set, required, purpose })),
        database: tables.map(({ table, purpose, ok }) => ({ table, purpose, ready: ok })),
        limitations: "Configuration presence does not prove provider access or service health. No repairs performed. Check admin settings for next steps.",
      }
    },
  }),
  getFeedStats: tool({
    description: "Google Merchant feed health per brand: total products, feed-eligible count, and counts per issue.",
    inputSchema: z.object({}),
    execute: async () => {
      const stats = await getFeedStats()
      return stats.filter((s) => s.total > 0)
    },
  }),

  searchProducts: tool({
    description:
      "Search the parts catalog. Filter by brand slug (e.g. 'bmw'), a text query matched against name/slug, and issue codes. Returns up to `limit` hits plus the total match count.",
    inputSchema: z.object({
      brand: z.string().max(60).optional(),
      q: z.string().max(120).optional(),
      issues: z.array(z.enum(ISSUE_CODES)).optional(),
      limit: z.number().int().min(1).max(200).default(25),
    }),
    execute: async ({ brand, q, issues, limit }) => {
      const { hits, total } = await searchProductsForAdmin({ brand, q, issues, limit })
      return {
        total,
        hits: hits.map((h) => ({
          brand: h.brand,
          slug: h.slug,
          name: h.effective.title ?? h.sheet.name,
          price: h.effective.price ?? null,
          issues: h.issues,
        })),
      }
    },
  }),

  listRecentOrders: tool({
    description: "Recent customer orders and reservations, optionally filtered by status, plus counts per status.",
    inputSchema: z.object({ status: z.string().max(40).optional(), limit: z.number().int().min(1).max(50).default(15) }),
    execute: async ({ status, limit }) => {
      const [orders, counts] = await Promise.all([listOrders(status), countByStatus("orders")])
      return {
        counts,
        orders: orders.slice(0, limit).map((o) => ({
          orderNumber: o.orderNumber,
          status: o.status,
          customer: o.customerName,
          email: o.customerEmail,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
          total: o.totalAmount,
        })),
      }
    },
  }),

  listOpenQuotes: tool({
    description: "Quote requests (leads), optionally filtered by status, plus counts per status.",
    inputSchema: z.object({ status: z.string().max(40).optional(), limit: z.number().int().min(1).max(50).default(15) }),
    execute: async ({ status, limit }) => {
      const [leads, counts] = await Promise.all([listQuoteLeads(status), countByStatus("leads")])
      return {
        counts,
        quotes: leads.slice(0, limit).map((l) => ({
          id: l.id,
          name: l.fullName,
          phone: l.phone,
          part: [l.year, l.make, l.model, l.partType].filter(Boolean).join(" "),
          status: l.status,
          createdAt: l.createdAt,
        })),
      }
    },
  }),

  listOpenChats: tool({
    description: "Open live-chat conversations from the website, newest first.",
    inputSchema: z.object({}),
    execute: async () => {
      const convos = await listConversations("open", 25)
      return convos.map((c) => ({
        customer: c.customerName || c.customerEmail || "Website visitor",
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unread: c.unreadForAdmin,
      }))
    },
  }),

  bulkExcludeFromGoogle: tool({
    description:
      "Exclude (or re-include) product pages from the Google Merchant feed. Use searchProducts first to get exact brand/slug pairs. Max 200 per call.",
    inputSchema: z.object({ items: z.array(productRef).min(1).max(200), exclude: z.boolean() }),
    execute: async ({ items, exclude }) => bulkSetExcludeFromFeed(items, exclude),
  }),

  setProductHidden: tool({
    description: "Hide or un-hide a single product page on the website. Use searchProducts first to get the exact brand/slug.",
    inputSchema: productRef.extend({ hidden: z.boolean() }),
    execute: async ({ brand, slug, hidden }) => {
      if (!isValidBrand(brand)) return { ok: false, message: "Unknown brand." }
      const product = getBrandProductBySlug(brand, slug)
      if (!product) return { ok: false, message: "Product not found." }
      const existing = await getProductOverride(brand, slug)
      await upsertOverride(brand, slug, {
        title: existing?.title ?? null,
        description: existing?.description ?? null,
        price: existing?.price ?? null,
        imageUrl: existing?.imageUrl ?? null,
        availability: existing?.availability ?? null,
        hidden,
        excludeFromFeed: existing?.excludeFromFeed ?? false,
        notes: existing?.notes ?? null,
      })
      revalidatePath(getBrandProductUrl(brand, product))
      revalidatePath("/admin/merchant")
      return { ok: true, message: `${hidden ? "Hid" : "Unhid"} ${product.name}.` }
    },
  }),
}

export const adminAssistant = new ToolLoopAgent({
  model: "anthropic/claude-sonnet-5.5",
  instructions: `You are the internal operations assistant for All Used Auto Parts Warehouse (AUAPW), a used auto parts store.
You help the store admin with: Google Merchant feed health, the parts catalog, customer orders and reservations, quote requests, and live chats.
Only use the provided tools; never invent data. For order status requests, look up the current record and include its updatedAt timestamp when available. Distinguish order creation time from last update time; never invent tracking or delivery dates. For website errors, use checkWebsiteConfiguration to check configuration and database readiness. Never claim to inspect logs, edit code, build or deploy; you do not have those tools. Give suggested next steps and clearly identify unverified causes. If a question is outside these areas, say so briefly.
Before any change (bulkExcludeFromGoogle, setProductHidden), first look up the exact products with searchProducts and state clearly what will change and how many pages. The admin must approve each change.
When a change is not approved, do not retry it; ask what they would like instead.
Keep answers short and scannable. Use markdown lists or small tables for results. Today is ${new Date().toISOString().slice(0, 10)}.`,
  tools,
  toolApproval: {
    bulkExcludeFromGoogle: "user-approval",
    setProductHidden: "user-approval",
  },
  stopWhen: isStepCount(12),
})

export type AdminAssistantMessage = InferAgentUIMessage<typeof adminAssistant>
