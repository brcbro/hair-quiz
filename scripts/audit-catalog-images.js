import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'public', 'lookskart-catalog.json'), 'utf8'))

const missing = []
const avif = []
for (const p of catalog.products) {
  if (!p.image) {
    missing.push({ title: p.title, image: '(empty)' })
    continue
  }
  const abs = path.join(root, 'public', p.image.replace(/^\//, ''))
  if (!fs.existsSync(abs)) missing.push({ title: p.title, image: p.image })
  else if (p.image.endsWith('.avif')) avif.push({ title: p.title, image: p.image })
}

console.log('Catalog products:', catalog.products.length)
console.log('Missing on disk:', missing.length)
console.log('AVIF format:', avif.length)
if (missing.length) missing.slice(0, 30).forEach((m) => console.log('-', m.image, '|', m.title))
if (avif.length) avif.forEach((m) => console.log('avif:', m.image))
