import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function collectImagePaths(obj, out = []) {
  if (!obj || typeof obj !== 'object') return out
  if (typeof obj.image === 'string') out.push(obj.image)
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) v.forEach((item) => collectImagePaths(item, out))
    else if (v && typeof v === 'object') collectImagePaths(v, out)
  }
  return out
}

const bfPath = path.join(root, 'public', 'brand-focus-data.js')
const text = fs.readFileSync(bfPath, 'utf8')
const jsonText = text.replace(/^[\s\S]*?=\s*/, '').replace(/;\s*[\s\S]*$/, '')
const data = eval('(' + jsonText + ')')

const paths = [...new Set(collectImagePaths(data))]
const missing = []
const wrongExt = []

for (const src of paths) {
  const abs = path.join(root, 'public', src.replace(/^\//, ''))
  if (fs.existsSync(abs)) continue
  missing.push(src)
  const base = abs.replace(/\.(webp|jpg|jpeg|png|avif)$/i, '')
  for (const ext of ['.jpg', '.jpeg', '.webp', '.png', '.avif']) {
    if (fs.existsSync(base + ext)) {
      wrongExt.push({ ref: src, actual: path.relative(path.join(root, 'public'), base + ext).replace(/\\/g, '/') })
      break
    }
  }
}

console.log('Brand focus image refs:', paths.length)
console.log('Missing:', missing.length)
console.log('Wrong extension:', wrongExt.length)
wrongExt.forEach(({ ref, actual }) => console.log(`  ${ref}\n    -> /${actual}`))
missing.filter((m) => !wrongExt.some((w) => w.ref === m)).forEach((m) => console.log('  truly missing:', m))
