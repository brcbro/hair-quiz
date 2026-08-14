import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

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

const csvPath = path.join(root, 'docs', 'lookskart-brand-products-with-images.csv')
const lines = fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/)
const headers = parseCsvLine(lines[0])

const missingLocal = []
const missingCdn = []
const brokenLocal = []

for (const line of lines.slice(1)) {
  const row = parseCsvLine(line)
  const rec = Object.fromEntries(headers.map((h, i) => [h, row[i] || '']))
  const local = rec['Local Image Path']
  const cdn = rec['Image URL (Lookskart CDN)']
  if (!cdn) missingCdn.push(rec)
  if (!local) {
    missingLocal.push(rec)
    continue
  }
  const abs = path.join(root, 'public', local.replace(/^\//, ''))
  if (!fs.existsSync(abs) || fs.statSync(abs).size === 0) brokenLocal.push({ ...rec, abs })
}

console.log('Total products:', lines.length - 1)
console.log('Missing CDN URL:', missingCdn.length)
console.log('Missing local path:', missingLocal.length)
console.log('Broken local file:', brokenLocal.length)

if (missingLocal.length) {
  console.log('\nMissing local (first 20):')
  missingLocal.slice(0, 20).forEach((p) => console.log('-', p.Brand, '|', p.Title))
}
if (brokenLocal.length) {
  console.log('\nBroken local (first 20):')
  brokenLocal.slice(0, 20).forEach((p) => console.log('-', p.local, p.Title))
}

// Check catalog json
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'public', 'lookskart-catalog.json'), 'utf8'))
const noImg = catalog.products.filter((p) => !p.image)
console.log('\nCatalog without image field:', noImg.length)
