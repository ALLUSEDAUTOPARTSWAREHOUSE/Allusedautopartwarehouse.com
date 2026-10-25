/**
 * Build per-brand product catalogs from the uploaded pricing sheets in /data.
 *
 * - Standard sheets share the Acura schema (name, slug, price, 3 mileage tiers,
 *   image_url, product_url, mpn, ...).
 * - Feed-format sheets (Google Merchant: id, title, link, image_link, price
 *   "123.45 USD") are also supported; the GMC file is a multi-brand feed, so
 *   it is filtered to rows whose brand matches.
 *
 * Prices are taken EXACTLY from the sheets — no markup, no clamping.
 * Output: data/brands/<brand-slug>.json  (read server-side only)
 *
 * Usage: node scripts/build-brand-catalogs.mjs
 */
import { read, utils } from 'xlsx'
import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = 'data'
const OUT_DIR = path.join(DATA_DIR, 'brands')

/** brand slug -> { label, file, feedBrand? (filter for feed-format files) } */
const BRAND_SHEETS = {
  acura: { label: 'Acura', isPrebuilt: true },
  honda: { label: 'Honda', file: 'HONDA-bb5ba1.xlsx' },
  infiniti: { label: 'INFINITI', file: 'INFINITI-fc83dd.xlsx' },
  hummer: { label: 'HUMMER', file: 'HUMMER-4fc954.xlsx' },
  'alfa-romeo': { label: 'Alfa Romeo', file: 'ALFA-PRICING-SHEET-28ba0b.xlsx' },
  buick: { label: 'Buick', file: 'BUICK-SHEET-5044ed.xlsx' },
  eagle: { label: 'Eagle', file: 'EAGLE-DHEET-12de39.xlsx' },
  daewoo: { label: 'Daewoo', file: 'DAEWOO-SHEET-c76c36.xlsx' },
  audi: { label: 'Audi', file: 'AUDI-PRICING-SHEET-ff7af4.xlsx' },
  fiat: { label: 'Fiat', file: 'FLAT-SHEET-152fa3.xlsx' },
  hyundai: { label: 'Hyundai', file: 'HYUNDAI-7ad0cf.xlsx' },
  bmw: { label: 'BMW', file: 'BMW-PRICING-SHEET-227494.xlsx' },
  chrysler: { label: 'Chrysler', file: 'CHRYSLER-SHEET-b86fcf.xlsx' },
  dodge: { label: 'Dodge', file: 'DODGE-SHEET-3d0668.xlsx' },
  daihatsu: { label: 'Daihatsu', file: 'DAIHATSU-SHEET-5e24d7.xlsx' },
  cadillac: { label: 'Cadillac', file: 'CADILAC-SHEET-6f574b.xlsx' },
  chevrolet: { label: 'Chevrolet', file: 'CHEVY-SHEET-39e694.xlsx' },
  geo: { label: 'Geo', file: 'GEO-288f17.xlsx' },
  gmc: { label: 'GMC', file: 'GMC-bbd6e9.xlsx', feedBrand: 'GMC' },
  ford: { label: 'Ford', file: 'FORD-SHEET-935674.xlsx' },
  'mercedes-benz': { label: 'Mercedes-Benz', nameBrand: 'Mercedes', file: 'MERCEDES-eb21da.xlsx' },
  mazda: { label: 'Mazda', file: 'MAZDA-ebc766.xlsx' },
  lincoln: { label: 'Lincoln', file: 'LINCON-5eb798.xlsx' },
  nissan: { label: 'Nissan', file: 'NISSAN-178640.xlsx' },
  triumph: { label: 'Triumph', file: 'TRIUMPH-da9b1b.xlsx' },
  lexus: { label: 'Lexus', file: 'LEXUS-cc66bf.xlsx' },
  jeep: { label: 'Jeep', file: 'JEEP-bf1d68.xlsx' },
  mitsubishi: { label: 'Mitsubishi', file: 'MITSUBISHI-df9f4f.xlsx' },
  volvo: { label: 'Volvo', file: 'VOLVO-9d847f.xlsx' },
  kia: { label: 'Kia', file: 'KIA-9f2c4e.xlsx' },
  isuzu: { label: 'Isuzu', file: 'ISUZU-20571d.xlsx' },
  jaguar: { label: 'Jaguar', file: 'JAGUR-f2c8c6.xlsx' },
  'land-rover': { label: 'Land Rover', nameBrand: 'LandRover', file: 'LAND-ROVER-ea5573.xlsx' },
  suzuki: { label: 'Suzuki', file: 'SUZUKI-4d0453.xlsx' },
  toyota: { label: 'Toyota', file: 'TOYOTA-6e1e4a.xlsx' },
}

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)

const roundPrice = (v) => {
  const n = typeof v === 'string' ? Number.parseFloat(v.replace(/[^0-9.]/g, '')) : Number(v)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined
}

function parseModelYear(name, brandLabel, compatibility = '') {
  const source = `${name || ''} ${compatibility || ''}`
  const year = source.match(/\b(?:19|20)\d{2}\b/)?.[0] || ''
  const re = new RegExp(`${brandLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+([A-Za-z0-9][A-Za-z0-9. -]{0,24}?)(?=\\s+(?:Engine|Transmission|Used|[0-9.]+L|-)|\\s*$)`, 'i')
  const model = source.match(re)?.[1]?.trim().replace(/\s{2,}/g, ' ') || ''
  return { model, year }
}

function normalizeStandardRow(row, brandLabel) {
  const price = roundPrice(row.price)
  const low = roundPrice(row.low_mileage_reference_price)
  const medium = roundPrice(row.medium_mileage_reference_price)
  const high = roundPrice(row.high_mileage_reference_price)
  if (!row.name || (!price && !medium)) return null
  const { model, year } = parseModelYear(row.name, brandLabel, row.compatibility)
  const mpn = String(row.mpn ?? row.part_number ?? '').trim()
  const baseSlug = (row.slug ? String(row.slug) : slugify(row.name)).replace(/-+$/g, '')
  return {
    id: mpn || baseSlug,
    name: String(row.name).trim(),
    slug: baseSlug,
    price: medium ?? price,
    tiers: low && medium && high ? { low, medium, high } : undefined,
    imageUrl: row.image_url || undefined,
    productUrl: row.product_url || undefined,
    stockQuantity: Number.isFinite(Number(row.stock_quantity)) ? Number(row.stock_quantity) : undefined,
    availability: row.availability ? String(row.availability).trim().toLowerCase() : undefined,
    category: String(row.category_id || row.image_specification || '').trim() || guessCategory(row.name),
    partNumber: String(row.part_number ?? mpn ?? ''),
    mpn,
    compatibility: row.compatibility ? String(row.compatibility).slice(0, 300) : undefined,
    description: row.description ? String(row.description).slice(0, 400) : undefined,
    model,
    year,
  }
}

function normalizeFeedRow(row, brandLabel) {
  const price = roundPrice(row.price)
  if (!row.title || !price) return null
  const { model, year } = parseModelYear(row.title, brandLabel)
  const id = String(row.id || '').trim() || slugify(row.title)
  let baseSlug = ''
  try {
    baseSlug = new URL(row.link).pathname.split('/').filter(Boolean).pop() || ''
  } catch {}
  if (!baseSlug) baseSlug = slugify(row.title)
  return {
    id,
    name: String(row.title).trim(),
    slug: slugify(baseSlug),
    price,
    tiers: undefined,
    imageUrl: row.image_link || undefined,
    productUrl: row.link || undefined,
    stockQuantity: undefined,
    availability: undefined,
    category: String(row.custom_label_0 || row.product_type || '').trim() || guessCategory(row.title),
    partNumber: id,
    mpn: id,
    compatibility: undefined,
    description: row.description ? String(row.description).slice(0, 400) : undefined,
    model,
    year,
  }
}

function guessCategory(name) {
  const n = String(name).toLowerCase()
  if (n.includes('transmission')) return 'Transmission'
  if (n.includes('engine')) return 'Engine'
  return 'Part'
}

function validateProduct(product, brandSlug) {
  const errors = []
  if (!product.id) errors.push('missing SKU/id')
  if (!product.name) errors.push('missing product name')
  if (!Number.isFinite(product.price) || product.price <= 0) errors.push('invalid price')
  if (!product.canonicalSlug) errors.push('missing canonical slug')
  if (product.tiers) {
    for (const [tier, price] of Object.entries(product.tiers)) {
      if (!Number.isFinite(price) || price <= 0) errors.push(`invalid ${tier} mileage price`)
    }
  }
  if (errors.length) {
    throw new Error(`${brandSlug}/${product.id || product.slug}: ${errors.join(', ')}`)
  }
}

function validateCatalog(products, brandSlug) {
  const ids = new Set()
  const slugs = new Set()
  for (const product of products) {
    validateProduct(product, brandSlug)
    if (ids.has(product.id)) throw new Error(`${brandSlug}: duplicate SKU/id ${product.id}`)
    if (slugs.has(product.canonicalSlug)) throw new Error(`${brandSlug}: duplicate canonical slug ${product.canonicalSlug}`)
    ids.add(product.id)
    slugs.add(product.canonicalSlug)
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true })
const summary = []
const manifest = []

for (const [brandSlug, cfg] of Object.entries(BRAND_SHEETS)) {
  // Prebuilt brands (like Acura) are already in data/brands, just add to manifest
  if (cfg.isPrebuilt) {
    const catalogPath = path.join(OUT_DIR, `${brandSlug}.json`)
    if (fs.existsSync(catalogPath)) {
      const cat = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
      summary.push(`${brandSlug}: ${cat.count} products (prebuilt)`)
      manifest.push({ slug: brandSlug, label: cfg.label, count: cat.count })
    }
    continue
  }
  const filePath = path.join(DATA_DIR, cfg.file)
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP ${brandSlug}: missing ${cfg.file}`)
    continue
  }
  const wb = read(fs.readFileSync(filePath))
  let rows = []
  for (const name of wb.SheetNames) {
    rows = rows.concat(utils.sheet_to_json(wb.Sheets[name], { defval: null }))
  }
  const isFeed = rows[0] && 'title' in rows[0] && 'link' in rows[0]
  if (cfg.feedBrand && isFeed) {
    rows = rows.filter((r) => String(r.brand || '').toLowerCase() === cfg.feedBrand.toLowerCase())
  }

  const seen = new Set()
  const slugCount = new Map()
  const products = []
  // Some sheets write the brand differently in product names (e.g. "Mercedes",
  // "LandRover") — use that variant for model extraction.
  const parseBrand = cfg.nameBrand ?? cfg.label
  for (const row of rows) {
    const p = isFeed ? normalizeFeedRow(row, parseBrand) : normalizeStandardRow(row, parseBrand)
    if (!p) continue
    const dedupeKey = p.id || p.slug
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    // Canonical slug must be unique within the brand.
    const idSuffix = slugify(p.id)
    let canonical = p.slug.endsWith(idSuffix) ? p.slug : `${p.slug}-${idSuffix}`
    const n = slugCount.get(canonical) || 0
    slugCount.set(canonical, n + 1)
    if (n > 0) canonical = `${canonical}-${n + 1}`
    p.canonicalSlug = canonical
    products.push(p)
  }

  validateCatalog(products, brandSlug)
  const out = { brand: cfg.label, slug: brandSlug, count: products.length, products }
  fs.writeFileSync(path.join(OUT_DIR, `${brandSlug}.json`), JSON.stringify(out))
  const size = (fs.statSync(path.join(OUT_DIR, `${brandSlug}.json`)).size / 1e6).toFixed(1)
  summary.push(`${brandSlug}: ${products.length} products (${size} MB)`)
  manifest.push({ slug: brandSlug, label: cfg.label, count: products.length })
}

// Manifest drives BRAND_DIRECTORY in lib/brand-catalog.ts — new sheets only
// need an entry in BRAND_SHEETS above, no app-code changes.
manifest.sort((a, b) => a.label.localeCompare(b.label))
fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))

console.log(summary.join('\n'))
console.log(`manifest: ${manifest.length} brands`)
