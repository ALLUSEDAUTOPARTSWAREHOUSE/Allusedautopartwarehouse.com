import "server-only"

import { pool } from "@/lib/db"
import { PHONE_DISPLAY, RETURNS, SHIPPING } from "@/lib/site-policy"

export type EditableStorePolicy = {
  phone: string
  shippingPrice: number
  warrantyDays: number
  returnDays: number
  returnDetails: string
}

export const DEFAULT_STORE_POLICY: EditableStorePolicy = {
  phone: PHONE_DISPLAY,
  shippingPrice: SHIPPING.price,
  warrantyDays: 90,
  returnDays: 30,
  returnDetails: RETURNS.detail,
}

const KEYS = ["phone", "shippingPrice", "warrantyDays", "returnDays", "returnDetails"] as const

async function ensureSettingsTable() {
  // Additive only: this creates a separate settings table and never alters
  // existing orders, products, payments, customer, or staff records.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.admin_store_settings (
      setting_key text PRIMARY KEY,
      setting_value text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `)
}

export async function getEditableStorePolicy(): Promise<EditableStorePolicy> {
  try {
    await ensureSettingsTable()
    const { rows } = await pool.query(
      "SELECT setting_key, setting_value FROM public.admin_store_settings WHERE setting_key = ANY($1::text[])",
      [KEYS],
    )
    const values = new Map<string, string>(rows.map((row: { setting_key: string; setting_value: string }) => [row.setting_key, row.setting_value]))
    const price = Number(values.get("shippingPrice"))
    const warrantyDays = Number(values.get("warrantyDays"))
    const returnDays = Number(values.get("returnDays"))
    return {
      phone: values.get("phone") ?? DEFAULT_STORE_POLICY.phone,
      shippingPrice: Number.isFinite(price) && price >= 0 ? price : DEFAULT_STORE_POLICY.shippingPrice,
      warrantyDays: Number.isInteger(warrantyDays) && warrantyDays >= 1 && warrantyDays <= 3650 ? warrantyDays : DEFAULT_STORE_POLICY.warrantyDays,
      returnDays: Number.isInteger(returnDays) && returnDays >= 0 && returnDays <= 3650 ? returnDays : DEFAULT_STORE_POLICY.returnDays,
      returnDetails: values.get("returnDetails") ?? DEFAULT_STORE_POLICY.returnDetails,
    }
  } catch {
    // Health page must remain readable during a DB outage; callers still see
    // the code-defined safe defaults and the separate DB health panel reports
    // the underlying problem.
    return DEFAULT_STORE_POLICY
  }
}

export async function saveEditableStorePolicy(policy: EditableStorePolicy) {
  await ensureSettingsTable()
  const entries = Object.entries(policy)
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    for (const [key, value] of entries) {
      await client.query(
        `INSERT INTO public.admin_store_settings (setting_key, setting_value, updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (setting_key) DO UPDATE
         SET setting_value = EXCLUDED.setting_value, updated_at = now()`,
        [key, String(value)],
      )
    }
    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}
