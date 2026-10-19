/** Preserve old records, but serve only replacement uploads after this reset. */
export const CATALOG_RESET_AT = '2026-10-19T00:38:44.201Z'
export const UPLOADED_ONLY_CATALOG = true
export function isReplacementUpload(product: { source: string; updatedAt: string }) {
  return product.source === 'upload' && Date.parse(product.updatedAt) > Date.parse(CATALOG_RESET_AT)
}
