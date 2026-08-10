/**
 * Export Lookskart products for focus brands into CSV + Excel.
 *
 * Source: docs/data/lookskart-products-page1.json (Shopify /products.json dump)
 * Regenerate dump when network allows:
 *   curl "https://lookskart.com/products.json?limit=250&page=1" -o docs/data/lookskart-products-page1.json
 */
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const docsDir = path.join(root, 'docs')
const dataPath = path.join(docsDir, 'data', 'lookskart-products-page1.json')
const BASE = 'https://lookskart.com'

/** @type {{ name: string, collection: string, match: (p: any) => boolean }[]} */
const BRANDS = [
  {
    name: 'Biotop',
    collection: `${BASE}/collections/biotop`,
    match: (p) => /biotop/i.test(hay(p)),
  },
  {
    name: 'Brasil Cacau',
    collection: `${BASE}/collections/brasil-cacau`,
    match: (p) => /brasil\s*cacau|brazil\s*cacau/i.test(hay(p)),
  },
  {
    name: 'Kerastase',
    collection: `${BASE}/collections/kerastase`,
    match: (p) => /kerastase|kérastase/i.test(hay(p)),
  },
  {
    name: 'K18',
    collection: `${BASE}/collections/k18`,
    match: (p) => /\bk-?18\b/i.test(hay(p)),
  },
  {
    name: "L'Oreal Professionnel",
    collection: `${BASE}/collections/loreal-professional`,
    match: (p) => /l'?oreal|loreal/i.test(hay(p)),
  },
  {
    name: 'Lea Levett',
    collection: `${BASE}/collections/lea-levett`,
    match: (p) => /lea\s*levett/i.test(hay(p)),
  },
  {
    name: 'Moroccanoil',
    collection: `${BASE}/collections/moroccan-oil-hair`,
    match: (p) => /moroccan\s*oil|moroccanoil/i.test(hay(p)),
  },
  {
    name: 'Olaplex',
    collection: `${BASE}/collections/olaplex`,
    match: (p) => /olaplex/i.test(hay(p)),
  },
  {
    name: 'Root Deep',
    collection: `${BASE}/collections/root-deep`,
    match: (p) => /root\s*deep/i.test([p.vendor, p.title, p.handle].join(' ')),
  },
  {
    name: 'Schwarzkopf',
    collection: `${BASE}/collections/schwarzkopfprof-professional`,
    match: (p) => /schwarzkopf/i.test(hay(p)),
  },
  {
    name: '18.21 Man Made',
    collection: `${BASE}/collections/18-21-man`,
    match: (p) => /18\.?21/i.test(hay(p)),
  },
  {
    name: "TAILOR'S",
    collection: `${BASE}/collections/tailors-product-collection-for-whatsapp-wati`,
    match: (p) => /tailor'?s/i.test(hay(p)),
  },
  {
    name: 'Wet Brush',
    collection: `${BASE}/collections/wet-brush`,
    match: (p) => /wet\s*brush/i.test(hay(p)),
  },
  {
    name: "Let's Shave",
    collection: `${BASE}/collections/lets-shave`,
    match: (p) => /lets?\s*shave/i.test(hay(p)),
  },
  {
    name: 'Redken',
    collection: `${BASE}/search?q=redken&type=product`,
    match: (p) => /redken/i.test(hay(p)),
  },
  {
    name: 'Agnaya',
    collection: `${BASE}/search?q=agnaya&type=product`,
    match: (p) => /agnaya/i.test(hay(p)),
  },
  {
    name: 'pH Plex (Phplex)',
    collection: `${BASE}/search?q=ph+plex&type=product`,
    match: (p) => /ph\s*plex|phplex/i.test(hay(p)),
  },
]

function hay(p) {
  return [p.vendor, p.title, p.handle, ...(p.tags || [])].join(' ')
}

function formatInr(price) {
  const n = Number(price)
  if (!Number.isFinite(n)) return ''
  return `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function toRow(brand, p) {
  const v = p.variants?.[0] || {}
  return {
    Brand: brand.name,
    Title: p.title,
    Vendor: (p.vendor || '').trim(),
    Handle: p.handle,
    'Product URL': `${BASE}/products/${p.handle}`,
    'Collection URL': brand.collection,
    Price: formatInr(v.price),
    'Price (raw)': v.price ?? '',
    Available: v.available === true ? 'Yes' : v.available === false ? 'No' : '',
    'Compare at': v.compare_at_price ?? '',
    Tags: (p.tags || []).join('; '),
    'Image URL': p.images?.[0]?.src || '',
    'Product ID': p.id,
    'Variant ID': v.id ?? '',
  }
}

const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
const catalog = raw.products || []

const productRows = []
const summaryRows = []
const seen = new Set()

for (const brand of BRANDS) {
  const matches = catalog.filter(brand.match)
  summaryRows.push({
    Brand: brand.name,
    'Products found': matches.length,
    Status:
      matches.length > 0
        ? 'Listed with products'
        : brand.name === 'Olaplex' || brand.name === 'Wet Brush'
          ? 'Collection exists but empty / no live products in catalog'
          : brand.name === 'Redken' || brand.name === 'Agnaya'
            ? 'Not currently listed on Lookskart'
            : 'No matching products in live catalog',
    'Collection / search URL': brand.collection,
  })

  for (const p of matches) {
    const key = `${brand.name}::${p.id}`
    if (seen.has(key)) continue
    seen.add(key)
    productRows.push(toRow(brand, p))
  }
}

productRows.sort((a, b) => a.Brand.localeCompare(b.Brand) || a.Title.localeCompare(b.Title))

const notes = [
  { Note: 'Source site', Detail: BASE },
  { Note: 'Catalog dump', Detail: 'docs/data/lookskart-products-page1.json' },
  { Note: 'Scraped on', Detail: new Date().toISOString().slice(0, 10) },
  {
    Note: 'Catalog size',
    Detail: `${catalog.length} live products returned by Shopify products.json (page 1; page 2 empty)`,
  },
  {
    Note: 'Added brands',
    Detail: 'Redken, Agnaya, pH Plex (Phplex) — requested additions beyond the original focus list',
  },
  {
    Note: 'Redken / Agnaya',
    Detail: 'No products or collections found in the live Lookskart catalog as of scrape date',
  },
  {
    Note: 'Olaplex / Wet Brush',
    Detail:
      'Brand collection pages exist but currently show no products; older Olaplex PDP URLs indexed by search return 404',
  },
  {
    Note: 'pH Plex',
    Detail: 'Sold on Lookskart under Looks Kart vendor (search “pH Plex”); 3 products in catalog',
  },
]

const wb = XLSX.utils.book_new()

const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
wsSummary['!cols'] = [{ wch: 24 }, { wch: 14 }, { wch: 62 }, { wch: 78 }]
XLSX.utils.book_append_sheet(wb, wsSummary, 'Brand Summary')

const wsProducts = XLSX.utils.json_to_sheet(productRows)
wsProducts['!cols'] = [
  { wch: 22 },
  { wch: 72 },
  { wch: 18 },
  { wch: 56 },
  { wch: 78 },
  { wch: 72 },
  { wch: 16 },
  { wch: 12 },
  { wch: 10 },
  { wch: 12 },
  { wch: 40 },
  { wch: 60 },
  { wch: 16 },
  { wch: 16 },
]
XLSX.utils.book_append_sheet(wb, wsProducts, 'Products')

const wsNotes = XLSX.utils.json_to_sheet(notes)
wsNotes['!cols'] = [{ wch: 22 }, { wch: 110 }]
XLSX.utils.book_append_sheet(wb, wsNotes, 'Notes')

const outXlsx = path.join(docsDir, 'lookskart-brand-products.xlsx')
const outCsv = path.join(docsDir, 'lookskart-brand-products.csv')
const outSummaryCsv = path.join(docsDir, 'lookskart-brand-summary.csv')

XLSX.writeFile(wb, outXlsx)

const escapeCsv = (v) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const writeCsv = (file, rows) => {
  if (!rows.length) {
    fs.writeFileSync(file, '', 'utf8')
    return
  }
  const headers = Object.keys(rows[0])
  const csv = [headers.join(',')]
    .concat(rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(',')))
    .join('\n')
  fs.writeFileSync(file, csv, 'utf8')
}

writeCsv(outCsv, productRows)
writeCsv(outSummaryCsv, summaryRows)

// Also refresh the hair-brands sheet with the three requested brands + live product counts
const brandListRows = BRANDS.map((b, i) => {
  const count = summaryRows.find((s) => s.Brand === b.name)?.['Products found'] ?? 0
  return {
    '#': i + 1,
    Brand: b.name,
    'Products on Lookskart': count,
    'Has products now': count > 0 ? 'Yes' : 'No',
    'Collection URL': b.collection,
    Source: 'Lookskart live catalog export',
  }
})
const wbBrands = XLSX.utils.book_new()
const wsBrands = XLSX.utils.json_to_sheet(brandListRows)
wsBrands['!cols'] = [{ wch: 4 }, { wch: 24 }, { wch: 20 }, { wch: 16 }, { wch: 78 }, { wch: 34 }]
XLSX.utils.book_append_sheet(wbBrands, wsBrands, 'Focus Brands')
XLSX.utils.book_append_sheet(wbBrands, wsNotes, 'Notes')
const outBrandsXlsx = path.join(docsDir, 'lookskart-hair-brands.xlsx')
const outBrandsCsv = path.join(docsDir, 'lookskart-hair-brands.csv')
XLSX.writeFile(wbBrands, outBrandsXlsx)
writeCsv(outBrandsCsv, brandListRows)

console.log(`Catalog products: ${catalog.length}`)
console.log(`Matched product rows: ${productRows.length}`)
console.log(`Wrote ${outXlsx}`)
console.log(`Wrote ${outCsv}`)
console.log(`Wrote ${outSummaryCsv}`)
console.log(`Wrote ${outBrandsXlsx}`)
console.log(`Wrote ${outBrandsCsv}`)
for (const s of summaryRows) {
  console.log(` - ${s.Brand}: ${s['Products found']}`)
}
