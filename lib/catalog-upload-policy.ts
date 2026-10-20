export const MAX_CATALOG_UPLOAD_BYTES = 500_000_000 // 500 MB, decimal
export const CATALOG_UPLOAD_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel', 'text/csv', 'application/octet-stream',
]
export function validCatalogUpload(name: string, size: number) {
  return /\.(xlsx|xls|csv)$/i.test(name) && Number.isSafeInteger(size) && size > 0 && size <= MAX_CATALOG_UPLOAD_BYTES
}
export function validCatalogUploadPath(path: string) {
  return /^catalog-staging\/[a-z0-9-]+\/[a-f0-9-]{36}\.(xlsx|xls|csv)$/.test(path)
}

export const MAX_FORM_UPLOAD_BYTES = 3_500_000
export function validFormUploadSize(size: number) {
  return Number.isSafeInteger(size) && size > 0 && size <= MAX_FORM_UPLOAD_BYTES
}
