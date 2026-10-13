"use server"

import { revalidatePath } from "next/cache"
import { getAdminSession } from "@/lib/admin-auth"
import { repairDatabase } from "@/lib/admin-health"
import { saveEditableStorePolicy, type EditableStorePolicy } from "@/lib/admin-store-settings"

export type SettingsActionState = { ok: boolean; message: string }

export async function saveStorePolicyAction(
  _previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  if (!(await getAdminSession())) return { ok: false, message: "Your admin session expired. Please sign in again." }

  const phone = String(formData.get("phone") ?? "").trim()
  const shippingPrice = Number(formData.get("shippingPrice"))
  const warrantyDays = Number(formData.get("warrantyDays"))
  const returnDays = Number(formData.get("returnDays"))
  const returnDetails = String(formData.get("returnDetails") ?? "").trim()

  if (!/^\+?[0-9() .-]{7,24}$/.test(phone)) return { ok: false, message: "Enter a valid phone number." }
  if (!Number.isFinite(shippingPrice) || shippingPrice < 0 || shippingPrice > 100000) return { ok: false, message: "Shipping price must be between $0 and $100,000." }
  if (!Number.isInteger(warrantyDays) || warrantyDays < 1 || warrantyDays > 3650) return { ok: false, message: "Warranty days must be a whole number between 1 and 3,650." }
  if (!Number.isInteger(returnDays) || returnDays < 0 || returnDays > 3650) return { ok: false, message: "Return days must be a whole number between 0 and 3,650." }
  if (returnDetails.length < 10 || returnDetails.length > 1200) return { ok: false, message: "Return details must be between 10 and 1,200 characters." }

  const policy: EditableStorePolicy = { phone, shippingPrice, warrantyDays, returnDays, returnDetails }
  try {
    await saveEditableStorePolicy(policy)
  } catch {
    return { ok: false, message: "Could not save policy settings. Check database health and try again." }
  }

  revalidatePath("/admin/settings")
  revalidatePath("/admin/dashboard")
  return { ok: true, message: "Store policy values saved. These admin values do not automatically replace the existing site-wide policy constants yet." }
}

export interface RepairState {
  ok: boolean
  message: string
}

export async function repairDatabaseAction(_prev: RepairState): Promise<RepairState> {
  if (!(await getAdminSession())) return { ok: false, message: "Session expired. Please log in again." }
  try {
    await repairDatabase()
  } catch (error) {
    return { ok: false, message: `Repair failed: ${error instanceof Error ? error.message : String(error)}` }
  }
  revalidatePath("/admin/settings")
  revalidatePath("/admin/dashboard")
  return { ok: true, message: "Done — missing tables and columns were added." }
}
