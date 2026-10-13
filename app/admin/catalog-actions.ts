"use server"

import { pool } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getAdminSession } from "@/lib/admin-auth"
import { BRAND_DIRECTORY, getBrandProductUrl, isValidBrand } from "@/lib/brand-catalog"
import {
  createManualProduct,
  deleteManualProduct,
  importProductSheet,
  toBrandProduct,
} from "@/lib/manual-products"

export interface CatalogActionState {
  ok: boolean
  message: string
}

function revalidateCatalog(brand?: string) {
  revalidatePath("/admin/merchant")
  revalidatePath("/admin/products")
  revalidatePath("/feeds/google-shopping.xml")
  if (brand) {
    revalidatePath(`/brands/${brand}`)
    revalidatePath(`/brands/${brand}`, "layout")
  } else {
    for (const b of BRAND_DIRECTORY) revalidatePath(`/brands/${b.slug}`, "layout")
  }
}

/** "Sync Products" — republishes the live catalog so every page reflects the latest sheet, override and manual-product data. */
export async function syncProducts(_prev: CatalogActionState): Promise<CatalogActionState> {
  if (!(await getAdminSession())) return { ok: false, message: "Session expired. Please log in again." }
  revalidateCatalog()
  const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  return { ok: true, message: `Synced — the website is up to date as of ${time}. Google picks it up on its next feed fetch.` }
}

export async function addManualProduct(_prev: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  if (!(await getAdminSession())) return { ok: false, message: "Session expired. Please log in again." }

  const brand = String(formData.get("brand") ?? "")
  if (!isValidBrand(brand)) return { ok: false, message: "Choose a brand." }

  const name = String(formData.get("name") ?? "").trim().slice(0, 150)
  if (!name) return { ok: false, message: "Product name is required." }

  const rawPrice = String(formData.get("price") ?? "").trim()
  const price = rawPrice === "" ? null : Number(rawPrice)
  if (price !== null && (!Number.isFinite(price) || price <= 0 || price > 100_000)) {
    return { ok: false, message: "Price must be between $1 and $100,000, or left blank for quote-only." }
  }

  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null
  if (imageUrl && !/^https:\/\/\S+$/i.test(imageUrl)) {
    return { ok: false, message: "Image URL must start with https://" }
  }

  const product = await createManualProduct(brand, {
    name,
    description: String(formData.get("description") ?? "").trim().slice(0, 5000) || null,
    price,
    imageUrl,
    category: String(formData.get("category") ?? "engine"),
    model: String(formData.get("model") ?? "").trim().slice(0, 100) || null,
    year: String(formData.get("year") ?? "").trim().slice(0, 20) || null,
  })

  revalidateCatalog(brand)
  return {
    ok: true,
    message: `Added — live at ${getBrandProductUrl(brand, toBrandProduct(product))}`,
  }
}

export async function removeManualProduct(_prev: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  if (!(await getAdminSession())) return { ok: false, message: "Session expired. Please log in again." }
  const brand = String(formData.get("brand") ?? "")
  const slug = String(formData.get("slug") ?? "")
  if (!isValidBrand(brand) || !slug) return { ok: false, message: "Product not found." }
  await deleteManualProduct(brand, slug)
  revalidateCatalog(brand)
  return { ok: true, message: "Removed." }
}

export async function uploadProductSheet(_prev: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  if (!(await getAdminSession())) return { ok: false, message: "Session expired. Please log in again." }

  const brand = String(formData.get("brand") ?? "")
  if (!isValidBrand(brand)) return { ok: false, message: "Choose a brand." }

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Choose a spreadsheet file (.xlsx)." }
  if (!/\.xlsx?$/i.test(file.name)) return { ok: false, message: "Only .xlsx or .xls files are supported." }
  if (file.size > 20 * 1024 * 1024) return { ok: false, message: "File is too large (max 20MB)." }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const mode = String(formData.get("mode") ?? "all")
    if (!["all", "prices", "images"].includes(mode)) return { ok: false, message: "Choose a valid import mode." }
    const preview = formData.get("intent") !== "save"
    if (!preview && formData.get("confirmImport") !== "yes") return { ok: false, message: "Confirm the import before saving. Preview first to review missing prices." }
    const { inserted, skipped, missingPrices } = await importProductSheet(brand, buffer, mode as "all" | "prices" | "images", preview)
    if (preview) return { ok: false, message: `Preview only: ${inserted} usable rows, ${skipped} skipped rows, ${missingPrices} missing prices. Nothing saved. Missing prices in price/all-field imports become quote-only. Review the result, then confirm and save. Existing unmatched products will not be deleted.` }
    if (inserted === 0) {
      return { ok: false, message: "No matching usable rows found. Check product names, URLs, and the selected import mode." }
    }
    revalidateCatalog(brand)
    return {
      ok: true,
      message: `Saved ${inserted.toLocaleString()} product${inserted === 1 ? "" : "s"}${skipped ? ` (skipped ${skipped} row${skipped === 1 ? "" : "s"} with invalid names or no matching uploaded product)` : ""} — live now. ${missingPrices} rows have missing prices and are quote-only.`,
    }
  } catch (error) {
    console.error("[admin] sheet upload failed:", (error as Error).message)
    const code = (error as { code?: string }).code
    const reason = (error as Error).message
    return { ok: false, message: reason === "INVALID_WORKBOOK"
      ? "Could not read the workbook. Upload a valid .xlsx or .xls file."
      : reason === "NO_PRODUCT_SHEET" ? "No product sheet found. Include a Name, name, or Product Name column."
      : code === "42P01" ? "The catalog database table is missing. An administrator must run the manual-products database migration, then retry. No products were saved."
      : "The workbook could not be saved to the catalog database. Check database connectivity and retry. No partial import was saved." }
  }
}

/** Explicitly selected uploaded/manual products only; never deletes the source catalog. */
export async function bulkEditManualProducts(_prev: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  if (!(await getAdminSession())) return { ok: false, message: "Session expired. Please log in again." }
  if (formData.get("confirm") !== "yes") return { ok: false, message: "Confirm the selected removals first." }
  const brand = String(formData.get("brand") ?? "")
  const slugs = [...new Set(formData.getAll("slug").map(String))]
  const action = String(formData.get("operation") ?? "")
  if (!isValidBrand(brand) || !slugs.length || slugs.length > 200) return { ok: false, message: "Select a brand and 1–200 products." }
  if (!["prices", "images", "delete"].includes(action)) return { ok: false, message: "Choose an action." }
  try {
    const sql = action === "delete"
      ? "DELETE FROM manual_products WHERE brand = $1 AND slug = ANY($2::text[])"
      : `UPDATE manual_products SET ${action === "prices" ? "price" : "image_url"} = NULL, updated_at = now() WHERE brand = $1 AND slug = ANY($2::text[])`
    const result = await pool.query(sql, [brand, slugs])
    revalidateCatalog(brand)
    return { ok: true, message: `Updated ${result.rowCount ?? 0} selected products. Website and feed refreshed.` }
  } catch { return { ok: false, message: "Database update failed. Please retry." } }
}
