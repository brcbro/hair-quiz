/**
 * Download Lookskart packshots for every focus-brand product.
 * Saves under public/images/products/lookskart/all/<brand>/<handle>.<ext>
 * Also writes a local-image path column into the brand products sheet.
 */
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const docsDir = path.join(root, 'docs')
const catalog = require(path.join(docsDir, 'data', 'lookskart-products-page1.json'))
const outRoot = path.join(root, 'public', 'images', 'products', 'lookskart', 'all')

const BRANDS = [
  { name: 'Biotop', slug: 'biotop', match: (p) => /biotop/i.test(hay(p)) },
  { name: 'Brasil Cacau', slug: 'brasil-cacau', match: (p) => /brasil\s*cacau|brazil\s*cacau/i.test(hay(p)) },
  { name: 'Kerastase', slug: 'kerastase', match: (p) => /kerastase|kérastase/i.test(hay(p)) },
  { name: 'K18', slug: 'k18', match: (p) => /\bk-?18\b/i.test(hay(p)) },
  { name: "L'Oreal Professionnel", slug: 'loreal-professionnel', match: (p) => /l'?oreal|loreal/i.test(hay(p)) },
  { name: 'Lea Levett', slug: 'lea-levett', match: (p) => /lea\s*levett/i.test(hay(p)) },
  { name: 'Moroccanoil', slug: 'moroccanoil', match: (p) => /moroccan\s*oil|moroccanoil/i.test(hay(p)) },
  { name: 'Olaplex', slug: 'olaplex', match: (p) => /olaplex/i.test(hay(p)) },
  { name: 'Root Deep', slug: 'root-deep', match: (p) => /root\s*deep/i.test([p.vendor, p.title, p.handle].join(' ')) },
  { name: 'Schwarzkopf', slug: 'schwarzkopf', match: (p) => /schwarzkopf/i.test(hay(p)) },
  { name: '18.21 Man Made', slug: '18-21-man-made', match: (p) => /18\.?21/i.test(hay(p)) },
  { name: "TAILOR'S", slug: 'tailors', match: (p) => /tailor'?s/i.test(hay(p)) },
  { name: 'Wet Brush', slug: 'wet-brush', match: (p) => /wet\s*brush/i.test(hay(p)) },
  { name: "Let's Shave", slug: 'lets-shave', match: (p) => /lets?\s*shave/i.test(hay(p)) },
  { name: 'Redken', slug: 'redken', match: (p) => /redken/i.test(hay(p)) },
  { name: 'Agnaya', slug: 'agnaya', match: (p) => /agnaya/i.test(hay(p)) },
  { name: 'pH Plex (Phplex)', slug: 'ph-plex', match: (p) => /ph\s*plex|phplex/i.test(hay(p)) },
]

function hay(p) {
  return [p.vendor, p.title, p.handle, ...(p.tags || [])].join(' ')
}

function extFromUrl(url) {
  try {
    const clean = url.split('?')[0]
    const ext = path.extname(clean).toLowerCase()
    if (ext === '.avif') return '.jpg'
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return ext
  } catch {}
  return '.jpg'
}

function downloadUrl(url) {
  if (/\.avif(\?|$)/i.test(url)) {
    return url.includes('?') ? `${url}&format=jpg` : `${url}?format=jpg`
  }
  return url
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close()
          try { fs.unlinkSync(dest) } catch {}
          return download(res.headers.location, dest).then(resolve).catch(reject)
        }
        if (res.statusCode !== 200) {
          file.close()
          try { fs.unlinkSync(dest) } catch {}
          return reject(new Error(`HTTP ${res.statusCode}`))
        }
        res.pipe(file)
        file.on('finish', () => file.close(() => resolve(dest)))
      })
      .on('error', (err) => {
        try { fs.unlinkSync(dest) } catch {}
        reject(err)
      })
  })
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      results[idx] = await fn(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return results
}

const products = []
const seen = new Set()
for (const brand of BRANDS) {
  for (const p of catalog.products || []) {
    if (!brand.match(p)) continue
    const key = `${brand.slug}::${p.id}`
    if (seen.has(key)) continue
    seen.add(key)
    products.push({ brand, product: p })
  }
}

console.log(`Focus-brand products to download: ${products.length}`)
fs.mkdirSync(outRoot, { recursive: true })

const rows = []
let ok = 0
let fail = 0
let skipped = 0

await mapLimit(products, 8, async ({ brand, product: p }) => {
  const imgUrl = p.images?.[0]?.src
  const brandDir = path.join(outRoot, brand.slug)
  fs.mkdirSync(brandDir, { recursive: true })

  let localRel = ''
  if (!imgUrl) {
    skipped++
  } else {
    const file = `${p.handle}${extFromUrl(imgUrl)}`
    const dest = path.join(brandDir, file)
    localRel = `/images/products/lookskart/all/${brand.slug}/${file}`
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      ok++
    } else {
      try {
        await download(downloadUrl(imgUrl), dest)
        ok++
        process.stdout.write('.')
      } catch (err) {
        fail++
        localRel = ''
        console.warn(`\nFAIL ${p.handle}: ${err.message}`)
      }
    }
  }

  const v = p.variants?.[0] || {}
  rows.push({
    Brand: brand.name,
    Title: p.title,
    Vendor: (p.vendor || '').trim(),
    Handle: p.handle,
    'Product URL': `https://lookskart.com/products/${p.handle}`,
    Price: v.price ?? '',
    Available: v.available === true ? 'Yes' : v.available === false ? 'No' : '',
    'Image URL (Lookskart CDN)': imgUrl || '',
    'Local Image Path': localRel,
    'Product ID': p.id,
  })
})

rows.sort((a, b) => a.Brand.localeCompare(b.Brand) || a.Title.localeCompare(b.Title))

const wb = XLSX.utils.book_new()
const ws = XLSX.utils.json_to_sheet(rows)
ws['!cols'] = [
  { wch: 22 }, { wch: 70 }, { wch: 18 }, { wch: 56 }, { wch: 78 },
  { wch: 12 }, { wch: 10 }, { wch: 90 }, { wch: 78 }, { wch: 16 },
]
XLSX.utils.book_append_sheet(wb, ws, 'Products + Images')

const byBrand = BRANDS.map((b) => {
  const list = rows.filter((r) => r.Brand === b.name)
  return {
    Brand: b.name,
    Products: list.length,
    'Images downloaded': list.filter((r) => r['Local Image Path']).length,
    Folder: list.length ? `public/images/products/lookskart/all/${b.slug}/` : '',
  }
})
const ws2 = XLSX.utils.json_to_sheet(byBrand)
ws2['!cols'] = [{ wch: 24 }, { wch: 10 }, { wch: 18 }, { wch: 58 }]
XLSX.utils.book_append_sheet(wb, ws2, 'By Brand')

const outXlsx = path.join(docsDir, 'lookskart-brand-products-with-images.xlsx')
const outCsv = path.join(docsDir, 'lookskart-brand-products-with-images.csv')
XLSX.writeFile(wb, outXlsx)

const escapeCsv = (v) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const headers = Object.keys(rows[0] || { Brand: '' })
const csv = [headers.join(',')]
  .concat(rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(',')))
  .join('\n')
fs.writeFileSync(outCsv, csv, 'utf8')

const manifest = {
  downloadedAt: new Date().toISOString(),
  totalProducts: rows.length,
  imagesOk: ok,
  imagesFailed: fail,
  imagesMissing: skipped,
  byBrand,
  products: rows.map((r) => ({
    brand: r.Brand,
    title: r.Title,
    handle: r.Handle,
    url: r['Product URL'],
    imageUrl: r['Image URL (Lookskart CDN)'],
    localImage: r['Local Image Path'],
  })),
}
fs.writeFileSync(
  path.join(outRoot, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf8',
)

console.log(`\nDone. ok=${ok} fail=${fail} missing=${skipped}`)
console.log(`Wrote ${outXlsx}`)
console.log(`Wrote ${outCsv}`)
console.log(`Images folder: ${outRoot}`)
