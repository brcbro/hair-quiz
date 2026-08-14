import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, acc)
    else if (/\.(html|js|css)$/i.test(ent.name)) acc.push(p)
  }
  return acc
}

const imageRefs = new Map()
const files = walk(path.join(root, 'public')).concat(walk(path.join(root, 'src')))

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  const re = /\/images\/products\/[^"'`\s)]+/g
  let m
  while ((m = re.exec(text))) {
    const src = m[0]
    if (!imageRefs.has(src)) imageRefs.set(src, [])
    imageRefs.get(src).push(path.relative(root, file))
  }
}

const missing = []
const avif = []
for (const [src, refs] of imageRefs) {
  const abs = path.join(root, 'public', src.replace(/^\//, ''))
  if (!fs.existsSync(abs)) missing.push({ src, refs })
  else if (src.endsWith('.avif')) avif.push({ src, refs })
}

console.log('Unique image refs:', imageRefs.size)
console.log('Missing files:', missing.length)
console.log('AVIF refs:', avif.length)

if (missing.length) {
  console.log('\n=== MISSING ===')
  missing.forEach(({ src, refs }) => {
    console.log(src)
    refs.slice(0, 3).forEach((r) => console.log('  in', r))
  })
}

if (avif.length) {
  console.log('\n=== AVIF (may not render in older browsers) ===')
  avif.forEach(({ src }) => console.log(src))
}
