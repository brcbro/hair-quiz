/**
 * Re-download AVIF packshots as JPG for broader browser support.
 * Updates CSV local paths, manifest, and catalog JSON.
 */
import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(root, 'public')

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

const csvPath = path.join(root, 'docs', 'lookskart-brand-products-with-images.csv')
const lines = fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/)
const headers = parseCsvLine(lines[0])
const localIdx = headers.indexOf('Local Image Path')
const cdnIdx = headers.indexOf('Image URL (Lookskart CDN)')

let converted = 0
const outLines = [lines[0]]

for (const line of lines.slice(1)) {
  const row = parseCsvLine(line)
  const local = row[localIdx] || ''
  const cdn = row[cdnIdx] || ''

  if (local.endsWith('.avif') && cdn) {
    const jpgLocal = local.replace(/\.avif$/i, '.jpg')
    const abs = path.join(publicDir, jpgLocal.replace(/^\//, ''))
    fs.mkdirSync(path.dirname(abs), { recursive: true })
    const jpgUrl = cdn.includes('?') ? `${cdn}&format=jpg` : `${cdn}?format=jpg`
    try {
      await download(jpgUrl, abs)
      if (fs.statSync(abs).size > 0) {
        row[localIdx] = jpgLocal
        converted++
        const oldAbs = path.join(publicDir, local.replace(/^\//, ''))
        try { fs.unlinkSync(oldAbs) } catch {}
        console.log('Converted', path.basename(jpgLocal))
      }
    } catch (err) {
      console.warn('Skip', local, err.message)
    }
  }

  outLines.push(row.map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(','))
}

fs.writeFileSync(csvPath, outLines.join('\n'), 'utf8')
console.log(`Updated CSV (${converted} avif -> jpg)`)

const manifestPath = path.join(publicDir, 'images/products/lookskart/all/manifest.json')
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  manifest.products = manifest.products.map((p) => {
    if (p.localImage && p.localImage.endsWith('.avif')) {
      const jpg = p.localImage.replace(/\.avif$/i, '.jpg')
      if (fs.existsSync(path.join(publicDir, jpg.replace(/^\//, '')))) p.localImage = jpg
    }
    return p
  })
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
}

if (converted) {
  const { spawnSync } = await import('node:child_process')
  spawnSync(process.execPath, ['scripts/build-lookskart-catalog-json.js'], {
    cwd: root,
    stdio: 'inherit',
  })
}
