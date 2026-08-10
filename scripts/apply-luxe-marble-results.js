import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'results.html')
let html = fs.readFileSync(file, 'utf8')

if (!html.includes('Libre+Caslon') && !html.includes('Libre Caslon')) {
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>Personalized Hair Profile</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0&display=swap" rel="stylesheet" />`
  )
}

const map = [
  ['#F1EFE8', '#faf9f9'],
  ['#f1efe8', '#faf9f9'],
  ['#C69352', '#c5a059'],
  ['#c69352', '#c5a059'],
  ['#b5834a', '#775a19'],
  ['#B5834A', '#775a19'],
  ['#2C2C2A', '#1a1c1c'],
  ['#2c2c2a', '#1a1c1c'],
  ['#5F5E5A', '#4e4639'],
  ['#5f5e5a', '#4e4639'],
  ['#888780', '#7f7667'],
  ['#D3D1C7', '#d1c5b4'],
  ['#d3d1c7', '#d1c5b4'],
  ['#D85A30', '#c5a059'],
  ['#B4B2A9', '#7f7667'],
  ['#FAF8F5', '#eeeeed'],
  ['#faf8f5', '#eeeeed'],
]

for (const [from, to] of map) {
  html = html.split(from).join(to)
}

html = html.replace(
  /font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;/g,
  "font-family: 'Hanken Grotesk', system-ui, sans-serif;"
)

// Soften pill/card radii toward Stitch (0.25rem)
html = html.replace(/border-radius: 20px/g, 'border-radius: 0.25rem')
html = html.replace(/border-radius: 12px/g, 'border-radius: 0.25rem')
html = html.replace(/border-radius: 10px/g, 'border-radius: 0.25rem')
html = html.replace(/border-radius: 8px/g, 'border-radius: 0.25rem')

fs.writeFileSync(file, html)
console.log('Updated', file)
