export const EMAIL_BRAND = {
  legalName: "AUAPW LLC",
  tradeName: "All Used Auto Parts Warehouse",
  phone: "1-888-887-4199",
  email: "support@allusedautopartswarehouse.com",
  website: "www.allusedautopartswarehouse.com",
  siteUrl: "https://allusedautopartswarehouse.com",
  addressLines: ["508 S Elm St, Ste 104", "Denton, TX 76201", "United States"],
  logoPath: "/auapw-logo.png",
} as const

export function emailLogoUrl(siteUrl = EMAIL_BRAND.siteUrl) {
  return `${siteUrl.replace(/\/$/, "")}${EMAIL_BRAND.logoPath}`
}

export function formatMoney(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-US", { dateStyle: "medium" })
}

export function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
}
