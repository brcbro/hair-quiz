import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'public/images/products/lookskart/all/manifest.json'), 'utf8'),
)
const csvPath = path.join(root, 'docs/lookskart-brand-products-with-images.csv')
const csvLines = fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/).slice(1)

function parseCsvLine(line) {
  const parts = []
  let cur = ''
  let q = false
  for (const ch of line) {
    if (ch === '"') {
      q = !q
      continue
    }
    if (ch === ',' && !q) {
      parts.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  parts.push(cur)
  return parts
}

const priceByHandle = new Map()
for (const line of csvLines) {
  const parts = parseCsvLine(line)
  const handle = parts[3]
  const price = parts[5]
  if (handle) priceByHandle.set(handle, price)
}

function formatInr(raw) {
  const n = Number(raw)
  if (!Number.isFinite(n)) return ''
  return `Rs. ${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

const catalog = {
  generatedAt: manifest.downloadedAt,
  total: manifest.totalProducts,
  brands: manifest.byBrand
    .filter((b) => b.Products > 0)
    .map((b) => ({ name: b.Brand, count: b.Products })),
  products: manifest.products.map((p) => ({
    brand: p.brand,
    title: p.title,
    handle: p.handle,
    url: p.url,
    image: p.localImage,
    price: formatInr(priceByHandle.get(p.handle)),
  })),
}

const out = path.join(root, 'public', 'lookskart-catalog.json')
fs.writeFileSync(out, JSON.stringify(catalog))
console.log(`Wrote ${out} (${catalog.total} products, ${catalog.brands.length} brands)`)
