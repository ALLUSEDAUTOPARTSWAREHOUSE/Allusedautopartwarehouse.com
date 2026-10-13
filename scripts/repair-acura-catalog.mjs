import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const sourcePath = path.join(root, 'lib', 'acura-products.json')
const targetPath = path.join(root, 'data', 'brands', 'acura.json')
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
const sourceProducts = source.products ?? source

const products = sourceProducts.map((product) => {
  const canonicalSlug =
    typeof product.productUrl === 'string' && product.productUrl
      ? new URL(product.productUrl, 'https://www.allusedautopartswarehouse.com').pathname.split('/').filter(Boolean).at(-1) ?? product.slug
      : product.slug

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    canonicalSlug,
    price: product.price,
    tiers: product.pricingTiers,
    imageUrl: product.imageUrl || product.image,
    productUrl: product.productUrl,
    category: product.category,
    partNumber: product.mpn,
    mpn: product.mpn,
    model: product.compatibility?.replace(/^\d{4}\s+Acura\s+/i, '') || '',
    year: Number(product.compatibility?.match(/^\d{4}/)?.[0]) || null,
    compatibility: product.compatibility,
    description: product.description,
  }
})

fs.writeFileSync(
  targetPath,
  JSON.stringify({ brand: 'Acura', slug: 'acura', count: products.length, products }),
)

console.log(`Repaired ${products.length} Acura products with unique canonical slugs.`)
