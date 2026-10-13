import "server-only"
import { pool } from "@/lib/db"

/**
 * Self-check for the admin: which settings are configured (names only, never
 * values) and whether every table and column the admin reads exists, with the
 * database's own error when something is missing.
 */

export interface EnvCheck {
  name: string
  set: boolean
  required: boolean
  purpose: string
}

export interface TableCheck {
  table: string
  purpose: string
  ok: boolean
  rows: number | null
  error: string | null
}

const anySet = (...names: string[]) => names.some((n) => Boolean(process.env[n]))

export function checkEnvironment(): EnvCheck[] {
  return [
    { name: "DATABASE_URL", set: anySet("DATABASE_URL"), required: true, purpose: "Orders, quotes, chats and every admin page" },
    { name: "ADMIN_PASSWORD", set: anySet("ADMIN_PASSWORD"), required: true, purpose: "Admin login" },
    { name: "BETTER_AUTH_SECRET", set: anySet("BETTER_AUTH_SECRET", "ADMIN_SESSION_SECRET"), required: true, purpose: "Signs admin and customer sessions" },
    { name: "RESEND_API_KEY", set: anySet("RESEND_API_KEY"), required: true, purpose: "Order, quote and daily-report emails" },
    {
      name: "EMAIL_FROM or RESEND_EMAIL_DOMAIN",
      set: anySet("EMAIL_FROM", "RESEND_EMAIL_DOMAIN"),
      required: false,
      purpose: "Emails to customers (needs a domain verified in Resend)",
    },
    { name: "STRIPE_SECRET_KEY", set: anySet("STRIPE_SECRET_KEY"), required: false, purpose: "Card payments at checkout" },
    {
      name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      set: anySet("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
      required: false,
      purpose: "Shows the card form at checkout",
    },
    { name: "STRIPE_WEBHOOK_SECRET", set: anySet("STRIPE_WEBHOOK_SECRET"), required: false, purpose: "Confirms card payments within seconds" },
    { name: "CRON_SECRET", set: anySet("CRON_SECRET"), required: false, purpose: "Locks the daily job to Vercel's scheduler" },
    {
      name: "AI_GATEWAY_API_KEY (or Vercel OIDC)",
      set: anySet("AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN"),
      required: false,
      purpose: "Store assistant across admin pages",
    },
  ]
}

// Each check selects exactly the columns the code reads, so a missing column
// shows up here by name instead of as an empty dashboard.
const TABLES: { table: string; columns: string; purpose: string }[] = [
  {
    table: "orders",
    columns:
      "id, ordernumber, status, totalamount, subtotal, tax, shippingcost, shippingaddress, items, customer_name, customer_email, customer_phone, customer_notes, internal_notes, payment_gateway, stripe_session_id, createdat, updatedat",
    purpose: "Orders, revenue numbers, customers",
  },
  {
    table: "leads",
    columns:
      "id, full_name, phone, email, part_type, make, model, year, part_option, state, zip, notes, source, page_url, product_name, product_url, user_id, status, quote_amount, internal_notes, created_at, updated_at",
    purpose: "Quote requests, win rate, customers",
  },
  { table: "chat_conversations", columns: "id, guest_id, status, unread_for_admin, last_message_at", purpose: "Live chat inbox" },
  { table: "chat_messages", columns: "id, conversation_id, sender, body, created_at", purpose: "Live chat messages" },
  { table: "product_overrides", columns: "brand, slug, price, hidden, exclude_from_feed, updated_at", purpose: "Price and page fixes" },
  { table: "manual_products", columns: "id, brand, slug, name, price, source, created_at", purpose: "Products added in the admin" },
  { table: "merchant_feed_fetches", columns: "id, fetched_at, user_agent, brand, is_google", purpose: "Google feed fetch log" },
  { table: "merchant_feed_snapshots", columns: "day, taken_at, total, eligible, brands, alerts", purpose: "Daily feed health history" },
  { table: "payment_gateways", columns: `id, name, slug, type, "isEnabled", "isDefault", "sortOrder"`, purpose: "Payment methods at checkout" },
  { table: "staff_members", columns: `id, name, email, role, status`, purpose: "Team directory" },
  { table: "followup_assignments", columns: "record_type, record_id, staff_id, assigned_by_email, created_at, updated_at", purpose: "Sales/support assignment ownership" },
]

export async function checkDatabase(): Promise<TableCheck[]> {
  return Promise.all(
    TABLES.map(async ({ table, columns, purpose }) => {
      try {
        await pool.query(`SELECT ${columns} FROM public.${table} LIMIT 0`)
        const { rows } = await pool.query(`SELECT count(*)::int AS n FROM public.${table}`)
        return { table, purpose, ok: true, rows: Number(rows[0]?.n ?? 0), error: null }
      } catch (error) {
        return { table, purpose, ok: false, rows: null, error: error instanceof Error ? error.message : String(error) }
      }
    }),
  )
}

/**
 * The repo's migration scripts, minus their seed data: every statement only
 * adds a missing table, column or index, so running it again changes nothing.
 * Orders and leads are created by the site's original setup and are only
 * extended here, never created, so a wrong guess can't shadow real data.
 */
const REPAIR_SQL = `
  ALTER TABLE IF EXISTS public.leads
    ADD COLUMN IF NOT EXISTS zip text,
    ADD COLUMN IF NOT EXISTS state text,
    ADD COLUMN IF NOT EXISTS part_option text,
    ADD COLUMN IF NOT EXISTS product_name text,
    ADD COLUMN IF NOT EXISTS product_url text,
    ADD COLUMN IF NOT EXISTS user_id text;

  ALTER TABLE IF EXISTS public.orders
    ADD COLUMN IF NOT EXISTS customer_name text,
    ADD COLUMN IF NOT EXISTS customer_email text,
    ADD COLUMN IF NOT EXISTS customer_phone text,
    ADD COLUMN IF NOT EXISTS customer_notes text,
    ADD COLUMN IF NOT EXISTS internal_notes text,
    ADD COLUMN IF NOT EXISTS payment_gateway text,
    ADD COLUMN IF NOT EXISTS stripe_session_id text;

  CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id text PRIMARY KEY,
    guest_id text NOT NULL,
    customer_name text,
    customer_email text,
    page_url text,
    status text NOT NULL DEFAULT 'open',
    unread_for_admin boolean NOT NULL DEFAULT true,
    unread_for_customer boolean NOT NULL DEFAULT false,
    last_message_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS public.chat_messages (
    id text PRIMARY KEY,
    conversation_id text NOT NULL,
    sender text NOT NULL CHECK (sender IN ('customer', 'admin')),
    body text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS public.product_overrides (
    brand text NOT NULL,
    slug text NOT NULL,
    title text,
    description text,
    price numeric(10, 2),
    image_url text,
    availability text,
    hidden boolean NOT NULL DEFAULT false,
    exclude_from_feed boolean NOT NULL DEFAULT false,
    notes text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (brand, slug)
  );
  CREATE TABLE IF NOT EXISTS public.merchant_feed_fetches (
    id serial PRIMARY KEY,
    fetched_at timestamptz NOT NULL DEFAULT now(),
    user_agent text,
    brand text,
    is_google boolean NOT NULL DEFAULT false
  );
  CREATE TABLE IF NOT EXISTS public.merchant_feed_snapshots (
    day date PRIMARY KEY,
    taken_at timestamptz NOT NULL DEFAULT now(),
    total integer NOT NULL,
    eligible integer NOT NULL,
    brands jsonb NOT NULL,
    alerts jsonb NOT NULL
  );
  CREATE TABLE IF NOT EXISTS public.manual_products (
    id serial PRIMARY KEY,
    brand text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10, 2),
    image_url text,
    category text,
    model text,
    year text,
    source text NOT NULL DEFAULT 'manual',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (brand, slug)
  );
  CREATE TABLE IF NOT EXISTS public.staff_members (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text,
    "role" text NOT NULL,
    "department" text,
    "title" text,
    "status" text NOT NULL DEFAULT 'active',
    "notes" text,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS public.followup_assignments (
    record_type text NOT NULL CHECK (record_type IN ('order', 'quote')),
    record_id text NOT NULL,
    staff_id text NOT NULL,
    assigned_by_email text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (record_type, record_id)
  );

  CREATE TABLE IF NOT EXISTS public.payment_gateways (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "type" text NOT NULL DEFAULT 'card',
    "description" text,
    "logo" text,
    "isEnabled" boolean NOT NULL DEFAULT false,
    "isDefault" boolean NOT NULL DEFAULT false,
    "sortOrder" integer NOT NULL DEFAULT 0,
    "config" jsonb,
    "instructions" text,
    "paymentLink" text,
    "envVarsRequired" json DEFAULT '[]'::json,
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE public.payment_gateways
    ADD COLUMN IF NOT EXISTS "instructions" text,
    ADD COLUMN IF NOT EXISTS "paymentLink" text,
    ADD COLUMN IF NOT EXISTS "envVarsRequired" json DEFAULT '[]'::json;
`

export async function repairDatabase(): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    await client.query(REPAIR_SQL)
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {})
    throw error
  } finally {
    client.release()
  }
}
