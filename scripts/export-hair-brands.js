import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.join(__dirname, '..', 'docs')

const rows = [
  {
    '#': 1,
    Brand: 'Balmain',
    Category: 'Hair Care & Finish',
    Focus: 'Hair care & styling',
    'Has products now': 'No (empty collection)',
    'Collection URL': 'https://example.com/collections/balmain',
    Source: 'Brand menu > Hair Care & Finish',
  },
  {
    '#': 2,
    Brand: 'Biotop',
    Category: 'Hair Care & Finish',
    Focus: 'Hair care (shampoo / treatments)',
    'Has products now': 'Yes',
    'Collection URL': 'https://example.com/collections/biotop',
    Source: 'Brand menu > Hair Care & Finish; Shop by Brand; Brand filter',
  },
  {
    '#': 3,
    Brand: 'Brasil Cacau',
    Category: 'Hair Care & Finish',
    Focus: 'Hair care / keratin treatments',
    'Has products now': 'Yes',
    'Collection URL': 'https://example.com/collections/brasil-cacau',
    Source: 'Brand menu > Hair Care & Finish; Shop by Brand',
  },
  {
    '#': 4,
    Brand: 'Global Keratin',
    Category: 'Hair Care & Finish',
    Focus: 'Hair care / keratin',
    'Has products now': 'Yes',
    'Collection URL': 'https://example.com/collections/global-keratin',
    Source: 'Brand menu > Hair Care & Finish; Shop by Brand',
  },
  {
    '#': 5,
    Brand: 'Kerastase',
    Category: 'Hair Care & Finish',
    Focus: 'Professional luxury hair care',
    'Has products now': 'Yes',
    'Collection URL': 'https://example.com/collections/kerastase',
    Source: 'Shop by Brand; Brand filter; Hair Care bestsellers',
  },
  {
    '#': 6,
    Brand: 'Kevin Murphy',
    Category: 'Hair Care & Finish',
    Focus: 'Hair care & styling',
    'Has products now': 'No (empty collection)',
    'Collection URL': 'https://example.com/collections/kevin-murphy',
    Source: 'Brand menu > Hair Care & Finish; Shop by Brand',
  },
  {
    '#': 7,
    Brand: 'K18',
    Category: 'Hair Care & Finish',
    Focus: 'Hair repair / treatment',
    'Has products now': 'Yes',
    'Collection URL': 'https://example.com/collections/k18',
    Source: 'Brand menu > Hair Care & Finish; Shop by Brand',
  },
  {
    '#': 8,
    Brand: "L'Oreal Professionnel",
    Category: 'Hair Care & Finish',
    Focus: 'Hair care & styling',
    'Has products now': 'Yes',
    'Collection URL': 'https://example.com/collections/loreal-professional',
    Source: 'Brand menu > Hair Care & Finish; Shop by Brand; Brand filter',
  },
  {
    '#': 9,
    Brand: 'Lea Levett',
    Category: 'Hair Care & Finish',
    Focus: 'Hair care',
    'Has products now': 'Yes',
    'Collection URL': 'https://example.com/collections/lea-levett',
    Source: 'Brand menu > Hair Care & Finish; Shop by Brand; Brand filter',
  },
  {
    '#': 10,
    Brand: 'Moroccanoil (Moroccan Oil Hair)',
    Category: 'Hair Care & Finish',
    Focus: 'Hair care & oil',
    'Has products now': 'Yes',
    'Collection URL': 'https://example.com/collections/moroccan-oil-hair',
    Source: 'Brand menu > Hair Care & Finish; Brand filter (Moroccanoil)',
  },
  {
    '#': 11,
    Brand: 'Olaplex',
    Category: 'Hair Care & Finish',
    Focus: 'Bond-building hair care',
    'Has products now': 'No (empty collection)',
    'Collection URL': 'https://example.com/collections/olaplex',
    Source: 'Brand menu > Hair Care & Finish; Shop by Brand',
  },
  {
    '#': 12,
    Brand: 'Rene Furturer',
    Category: 'Hair Care & Finish',
    Focus: 'Hair care',
    'Has products now': 'No (empty collection)',
    'Collection URL': 'https://example.com/collections/rene-furturer',
    Source: 'Brand menu > Hair Care & Finish; Shop by Brand',
  },
  {
    '#': 13,
    Brand: 'Root Deep',
    Category: 'Hair Care & Finish',
    Focus: 'Hair care',
    'Has products now': 'Yes',
    'Collection URL': 'https://example.com/collections/root-deep',
    Source: 'Brand menu > Hair Care & Finish; Shop by Brand; Brand filter',
  },
  {
    '#': 14,
    Brand: 'Schwarzkopf Professional',
    Category: 'Hair Care & Finish',
    Focus: 'Hair care & styling',
    'Has products now': 'Yes',
    'Collection URL': 'https://example.com/collections/schwarzkopfprof-professional',
    Source: 'Brand menu > Hair Care & Finish; Shop by Brand; Brand filter',
  },
  {
    '#': 15,
    Brand: 'American Crew',
    Category: 'Mens / Tools & Accessories',
    Focus: 'Mens hair styling & care',
    'Has products now': 'No (empty collection)',
    'Collection URL': 'https://example.com/collections/american-crew',
    Source: 'Brand menu > Mens, Tools & Accessories; Shop by Brand',
  },
  {
    '#': 16,
    Brand: '18.21 Man Made',
    Category: 'Mens / Tools & Accessories',
    Focus: 'Mens hair styling & grooming',
    'Has products now': 'Yes',
    'Collection URL': 'https://example.com/collections/18-21-man',
    Source: 'Brand menu > Mens, Tools & Accessories',
  },
  {
    '#': 17,
    Brand: "TAILOR'S",
    Category: 'Mens Hair / Beard (featured)',
    Focus: 'Mens hair, beard & styling',
    'Has products now': 'Yes',
    'Collection URL':
      'https://example.com/collections/tailors-product-collection-for-whatsapp-wati',
    Source: 'Featured banners / Curated for Men',
  },
  {
    '#': 18,
    Brand: 'Dyson',
    Category: 'Mens / Tools & Accessories',
    Focus: 'Hair tools (dryers / stylers)',
    'Has products now': 'No (empty collection)',
    'Collection URL': 'https://example.com/collections/dyson',
    Source: 'Brand menu > Mens, Tools & Accessories; Shop by Brand',
  },
  {
    '#': 19,
    Brand: 'Wahl',
    Category: 'Mens / Tools & Accessories',
    Focus: 'Hair clippers / trimmers',
    'Has products now': 'No (empty collection)',
    'Collection URL': 'https://example.com/collections/wahl',
    Source: 'Brand menu > Mens, Tools & Accessories; Shop by Brand',
  },
  {
    '#': 20,
    Brand: 'Wet Brush',
    Category: 'Mens / Tools & Accessories',
    Focus: 'Hair brushes',
    'Has products now': 'No (empty collection)',
    'Collection URL': 'https://example.com/collections/wet-brush',
    Source: 'Brand menu > Mens, Tools & Accessories; Shop by Brand',
  },
  {
    '#': 21,
    Brand: 'Lets Shave',
    Category: 'Mens / Tools & Accessories',
    Focus: 'Shaving / grooming (beard & body)',
    'Has products now': 'Yes',
    'Collection URL': 'https://example.com/collections/lets-shave',
    Source: 'Brand menu > Mens, Tools & Accessories; Brand filter',
  },
]

const notes = [
  { Note: 'Source site', Detail: 'https://example.com/' },
  { Note: 'Scraped on', Detail: '2026-08-08' },
  {
    Note: 'Hair Care & Finish brands',
    Detail:
      'Core list from Brand > Hair Care & Finish, plus Kerastase from Shop by Brand / products',
  },
  {
    Note: 'Excluded (skincare-only)',
    Detail:
      "Dermalogica; L'aamis Organic; Moroccan Oil Skin; Pedilabs Alchemy Cure Cream",
  },
  {
    Note: 'Empty collections',
    Detail:
      'Brand pages exist in nav/Shop by Brand but currently show no products: Balmain, Kevin Murphy, Olaplex, Rene Furturer, American Crew, Dyson, Wahl, Wet Brush',
  },
]

const wb = XLSX.utils.book_new()
const ws1 = XLSX.utils.json_to_sheet(rows)
ws1['!cols'] = [
  { wch: 4 },
  { wch: 30 },
  { wch: 30 },
  { wch: 34 },
  { wch: 22 },
  { wch: 72 },
  { wch: 58 },
]
XLSX.utils.book_append_sheet(wb, ws1, 'Hair Brands')

const ws2 = XLSX.utils.json_to_sheet(notes)
ws2['!cols'] = [{ wch: 28 }, { wch: 110 }]
XLSX.utils.book_append_sheet(wb, ws2, 'Notes')

const outXlsx = path.join(docsDir, 'hair-brands.xlsx')
const outCsv = path.join(docsDir, 'hair-brands.csv')
XLSX.writeFile(wb, outXlsx)

const headers = Object.keys(rows[0])
const escapeCsv = (v) => {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csv = [headers.join(',')]
  .concat(rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(',')))
  .join('\n')
fs.writeFileSync(outCsv, csv, 'utf8')

console.log(`Wrote ${outXlsx}`)
console.log(`Wrote ${outCsv}`)
console.log(`Brands: ${rows.length}`)
