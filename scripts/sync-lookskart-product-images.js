import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public', 'images', 'products', 'lookskart')
fs.mkdirSync(outDir, { recursive: true })

const IMAGES = {
  sc: {
    file: 'biotop-911-quinoa-shampoo.jpg',
    url: 'https://cdn.shopify.com/s/files/1/0624/7618/9904/products/looks-images-3_0108_-2-min.jpg?v=1672149696',
  },
  scc: {
    file: 'brasil-cacau-extreme-repair-shampoo.jpg',
    url: 'https://cdn.shopify.com/s/files/1/0624/7618/9904/products/looks_0140_04brasil-cacau-extreme-shampoo.jpg?v=1671189654',
  },
  li: {
    file: 'k18-leave-in-mask-50ml.jpg',
    url: 'https://cdn.shopify.com/s/files/1/0624/7618/9904/products/looks_0045_Layer29.jpg?v=1671431390',
  },
  oil: {
    file: 'moroccanoil-treatment-light.jpg',
    url: 'https://cdn.shopify.com/s/files/1/0624/7618/9904/products/51.jpg?v=1672296722',
  },
  moroil: {
    file: 'moroccanoil-treatment-original.jpg',
    url: 'https://cdn.shopify.com/s/files/1/0624/7618/9904/products/looks-images-2_0006_Moroccanoil_Moroccanoil-Treatment-Original_100ml-For-all-hair-types.jpg?v=1672036585',
  },
  bdc: {
    file: 'kerastase-nectar-thermique.webp',
    url: 'https://cdn.shopify.com/s/files/1/0624/7618/9904/files/k_nut_nectar_thermique_2048x2048_540x_9032ef89-cc16-44c3-98a2-810d31179b51.webp?v=1750155049',
  },
  rebel: {
    file: 'kerastase-gloss-absolu-heat-protectant.webp',
    url: 'https://cdn.shopify.com/s/files/1/0624/7618/9904/files/KER_00330_spray_packshot_image_190ml_1.webp?v=1752052306',
  },
  thermal: {
    file: 'schwarzkopf-osis-flatliner.jpg',
    url: 'https://cdn.shopify.com/s/files/1/0624/7618/9904/files/B0CB98FTTQ.MAIN.jpg?v=1712047327',
  },
  volume: {
    file: 'moroccanoil-root-boost.jpg',
    url: 'https://cdn.shopify.com/s/files/1/0624/7618/9904/products/looks-images-2_0005_Moroccanoil_Root-Boost.jpg?v=1672036467',
  },
  dryshampoo: {
    file: 'moroccanoil-dry-texture-spray.jpg',
    url: 'https://cdn.shopify.com/s/files/1/0624/7618/9904/products/looks_0036_Moroccanoil_DryTextureSpray205ML.jpg?v=1671195522',
  },
  hairspray: {
    file: 'moroccanoil-luminous-hairspray.jpg',
    url: 'https://cdn.shopify.com/s/files/1/0624/7618/9904/products/looks_0032_Moroccanoil_LuminousHairsprayStrong330ML.jpg?v=1671195311',
  },
  repair: {
    file: 'ph-plex-step-3.webp',
    url: 'https://cdn.shopify.com/s/files/1/0624/7618/9904/files/creamphpleximages_pHPlexStep3_Tube150ml_637df599-819a-4660-8cb4-7eda90cb0171.webp?v=1763216337',
  },
  mask: {
    file: 'moroccanoil-weightless-hydrating-mask.jpg',
    url: 'https://cdn.shopify.com/s/files/1/0624/7618/9904/products/looks-images-2_0001_Moroccanoil_Weightless-Hydrating-Mask-For-fine-dry-hair-250ml.jpg?v=1672036258',
  },
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close()
          fs.unlinkSync(dest)
          return download(res.headers.location, dest).then(resolve).catch(reject)
        }
        if (res.statusCode !== 200) {
          file.close()
          fs.unlinkSync(dest)
          return reject(new Error(`${res.statusCode} ${url}`))
        }
        res.pipe(file)
        file.on('finish', () => file.close(() => resolve(dest)))
      })
      .on('error', (err) => {
        try {
          fs.unlinkSync(dest)
        } catch {}
        reject(err)
      })
  })
}

const localPath = (file) => `/images/products/lookskart/${file}`

async function main() {
  for (const [key, meta] of Object.entries(IMAGES)) {
    const dest = path.join(outDir, meta.file)
    process.stdout.write(`Downloading ${key}... `)
    await download(meta.url, dest)
    console.log('ok', meta.file)
  }

  const resultsPath = path.join(root, 'public', 'results.html')
  let html = fs.readFileSync(resultsPath, 'utf8')

  const replacements = [
    // Core product cards
    [
      'src="/images/products/Gemini_Generated_Image_ozu529ozu529ozu5_3.jpg" alt="Biotop 911 Quinoa Shampoo"',
      `src="${localPath(IMAGES.sc.file)}" alt="Biotop 911 Quinoa Shampoo"`,
    ],
    [
      'src="/images/products/JPEGimage_9bbfc230-3f8a-4c36-96c9-43f37fc17ffe_300x.jpg" alt="Brasil Cacau Extreme Repair Shampoo"',
      `src="${localPath(IMAGES.scc.file)}" alt="Brasil Cacau Extreme Repair Shampoo"`,
    ],
    [
      'src="/images/products/Lic3456346Edit-Copy_1.png" alt="K-18 Leave-in Molecular Repair Hair Mask"',
      `src="${localPath(IMAGES.li.file)}" alt="K-18 Leave-in Molecular Repair Hair Mask"`,
    ],
    [
      'src="/images/products/IMG_0267.jpg" alt="Moroccanoil Treatment Light"',
      `src="${localPath(IMAGES.oil.file)}" alt="Moroccanoil Treatment Light"`,
    ],
    // Supplementary rows
    [
      'src="/images/products/s2030286-main-zoom.jpg" alt="Moroccanoil Treatment Oil"',
      `src="${localPath(IMAGES.moroil.file)}" alt="Moroccanoil Treatment Original"`,
    ],
    [
      'src="/images/products/Big-Blowout-Heat-Protectant-Gel-150ml.jpg" alt="Kerastase Nectar Thermique Blow Dry Primer"',
      `src="${localPath(IMAGES.bdc.file)}" alt="Kerastase Nectar Thermique Blow Dry Primer"`,
    ],
    [
      'src="/images/products/ulta-2580474.png" alt="Kerastase Gloss Absolu Heat Protectant"',
      `src="${localPath(IMAGES.rebel.file)}" alt="Kerastase Gloss Absolu Heat Protectant"`,
    ],
    [
      'src="/images/products/Redken-2022-Styling-Reno-Thermal-Spray-High-Hold-Ecom-ATF-Packshot-200.jpg" alt="Schwarzkopf OSiS Flatliner Heat Protection"',
      `src="${localPath(IMAGES.thermal.file)}" alt="Schwarzkopf OSiS Flatliner Heat Protection"`,
    ],
    [
      'src="/images/products/1-VBDM_product_1440_9d214cbf-772f-432f-8a52-d7613a762b52.png" alt="Moroccanoil Root Boost"',
      `src="${localPath(IMAGES.volume.file)}" alt="Moroccanoil Root Boost"`,
    ],
    [
      'src="/images/products/dryshampoo_new_fs.png" alt="Moroccanoil Dry Texture Spray"',
      `src="${localPath(IMAGES.dryshampoo.file)}" alt="Moroccanoil Dry Texture Spray"`,
    ],
    [
      'src="/images/products/moroccanoil_dry_shampoo_light_tones_x2000.png" alt="Moroccanoil Dry Texture Spray"',
      `src="${localPath(IMAGES.dryshampoo.file)}" alt="Moroccanoil Dry Texture Spray"`,
    ],
    [
      'src="/images/products/redken-hair-styling-control-addict-anti-humidity-high-hold-hairspray-2000x2000_278.jpg" alt="Moroccanoil Luminous Hairspray"',
      `src="${localPath(IMAGES.hairspray.file)}" alt="Moroccanoil Luminous Hairspray"`,
    ],
    [
      'src="/images/products/redken-acidic-bonding-concentrate-mask-for-damaged-hair.png" alt="pH Plex Step 3"',
      `src="${localPath(IMAGES.repair.file)}" alt="pH Plex Step 3"`,
    ],
    [
      'src="/images/products/31eRafhskFL_1.jpg" alt="Moroccanoil Hydrating Mask"',
      `src="${localPath(IMAGES.mask.file)}" alt="Moroccanoil Weightless Hydrating Mask"`,
    ],
    [
      'src="/images/products/31eRafhskFL_1.jpg" alt="Moroccanoil Weightless Hydrating Mask"',
      `src="${localPath(IMAGES.mask.file)}" alt="Moroccanoil Weightless Hydrating Mask"`,
    ],
    // Ritual step images tied to products
    [
      'src="/images/products/Lic3456346Edit-Copy_1.png" alt="Leave-in Conditioner"',
      `src="${localPath(IMAGES.li.file)}" alt="K-18 Leave-in Mask"`,
    ],
    [
      'id="img-bdc" src="/images/products/Big-Blowout-Heat-Protectant-Gel-150ml.jpg"',
      `id="img-bdc" src="${localPath(IMAGES.bdc.file)}"`,
    ],
    [
      'src="/images/products/1-VBDM_product_1440_9d214cbf-772f-432f-8a52-d7613a762b52.png" alt="Moroccanoil Root Boost"',
      `src="${localPath(IMAGES.volume.file)}" alt="Moroccanoil Root Boost"`,
    ],
    [
      'src="/images/products/Redken-2022-Styling-Reno-Thermal-Spray-High-Hold-Ecom-ATF-Packshot-200.jpg" alt="Thermal Protectant"',
      `src="${localPath(IMAGES.thermal.file)}" alt="Thermal Protectant"`,
    ],
    [
      'id="img-step-oil" src="/images/products/IMG_0267.jpg"',
      `id="img-step-oil" src="${localPath(IMAGES.oil.file)}"`,
    ],
    [
      'src="/images/products/redken-acidic-bonding-concentrate-mask-for-damaged-hair.png" alt="Acidic Bonding Concentrate Mask"',
      `src="${localPath(IMAGES.repair.file)}" alt="pH Plex Step 3"`,
    ],
    [
      'src="/images/products/31eRafhskFL_1.jpg" alt="Moroccanoil Mask"',
      `src="${localPath(IMAGES.mask.file)}" alt="Moroccanoil Mask"`,
    ],
    [
      'id="img-morning-dryshampoo" src="/images/products/dryshampoo_new_fs.png"',
      `id="img-morning-dryshampoo" src="${localPath(IMAGES.dryshampoo.file)}"`,
    ],
    [
      'id="img-morning-oil" src="/images/products/IMG_0267.jpg"',
      `id="img-morning-oil" src="${localPath(IMAGES.oil.file)}"`,
    ],
    // Coarse-path JS image swaps
    [
      "setSrc('img-bdc', '/images/products/ulta-2580474.png');",
      `setSrc('img-bdc', '${localPath(IMAGES.rebel.file)}');`,
    ],
    [
      "setSrc('img-step-oil', '/images/products/s2030286-main-zoom.jpg');",
      `setSrc('img-step-oil', '${localPath(IMAGES.moroil.file)}');`,
    ],
    [
      "setSrc('img-morning-dryshampoo', '/images/products/moroccanoil_dry_shampoo_light_tones_x2000.png');",
      `setSrc('img-morning-dryshampoo', '${localPath(IMAGES.dryshampoo.file)}');`,
    ],
    [
      "setSrc('img-morning-oil', '/images/products/s2030286-main-zoom.jpg');",
      `setSrc('img-morning-oil', '${localPath(IMAGES.moroil.file)}');`,
    ],
  ]

  let applied = 0
  for (const [from, to] of replacements) {
    if (!html.includes(from)) {
      console.warn('miss:', from.slice(0, 90))
      continue
    }
    html = html.replaceAll(from, to)
    applied++
  }

  // Also embed image URLs on PRODUCTS for future use
  const productsBlock = `var PRODUCTS = {
  sc:  { url: LOOKSKART + '/products/biotop-911-quinoa-shampoo-330ml', image: '${localPath(IMAGES.sc.file)}' },
  scc: { url: LOOKSKART + '/products/brasil-cacau-extreme-repair-shampoo-for-damaged-hair-300ml', image: '${localPath(IMAGES.scc.file)}' },
  li:  { url: LOOKSKART + '/products/k-18-leave-in-molecular-repair-hair-mask-50ml', image: '${localPath(IMAGES.li.file)}' },
  oil: { url: LOOKSKART + '/products/moroccanoil-moroccanoil-treatment-light-100ml-for-fine-or-light-coloured-hair', image: '${localPath(IMAGES.oil.file)}' },
  moroil: { url: LOOKSKART + '/products/moroccanoil-moroccanoil-treatment-original-100ml-for-all-hair-types', image: '${localPath(IMAGES.moroil.file)}' },
  bdc: { url: LOOKSKART + '/products/kerastase-nutritive-nectar-thermique-blow-dry-primer-150ml', image: '${localPath(IMAGES.bdc.file)}' },
  rebel: { url: LOOKSKART + '/products/kerastase-gloss-absolu-anti-frizz-heat-protectant-spray-190ml', image: '${localPath(IMAGES.rebel.file)}' },
  thermal: { url: LOOKSKART + '/products/schwarzkopf-professional-osis-flatliner-heat-protection-spray-200ml', image: '${localPath(IMAGES.thermal.file)}' },
  volume: { url: LOOKSKART + '/products/moroccanoil-root-boost-for-fine-to-medium-hair-250ml', image: '${localPath(IMAGES.volume.file)}' },
  dryshampoo: { url: LOOKSKART + '/products/moroccanoil-dry-texture-spray-205ml-for-all-hair-types', image: '${localPath(IMAGES.dryshampoo.file)}' },
  'dryshampoo-coarse': { url: LOOKSKART + '/products/moroccanoil-dry-texture-spray-205ml-for-all-hair-types', image: '${localPath(IMAGES.dryshampoo.file)}' },
  hairspray: { url: LOOKSKART + '/products/moroccanoil-luminous-hairspray-strong-330ml', image: '${localPath(IMAGES.hairspray.file)}' },
  repair: { url: LOOKSKART + '/products/ph-plex-step-3-150ml', image: '${localPath(IMAGES.repair.file)}' },
  mask: { url: LOOKSKART + '/products/moroccanoil-weightless-hydrating-mask-for-fine-dry-hair-250ml', image: '${localPath(IMAGES.mask.file)}' }
};`

  const productsRe = /var PRODUCTS = \{[\s\S]*?\n\};/
  if (!productsRe.test(html)) {
    console.warn('PRODUCTS object not found for image embed')
  } else {
    html = html.replace(productsRe, productsBlock)
  }

  fs.writeFileSync(resultsPath, html)
  console.log(`Updated results.html (${applied} image replacements)`)

  // Patch results-products.html core cards if present
  const rp = path.join(root, 'public', 'results-products.html')
  if (fs.existsSync(rp)) {
    let rpHtml = fs.readFileSync(rp, 'utf8')
    const rpSwaps = [
      [/src="[^"]*Gemini_Generated_Image_ozu529ozu529ozu5_3[^"]*"/, `src="${localPath(IMAGES.sc.file)}"`],
      [/src="[^"]*JPEGimage_9bbfc230[^"]*"/, `src="${localPath(IMAGES.scc.file)}"`],
      [/src="[^"]*Lic3456346Edit-Copy_1[^"]*"/, `src="${localPath(IMAGES.li.file)}"`],
      [/src="[^"]*IMG_0267[^"]*"/, `src="${localPath(IMAGES.oil.file)}"`],
      [/src="[^"]*s2030286-main-zoom[^"]*"/, `src="${localPath(IMAGES.moroil.file)}"`],
    ]
    for (const [re, to] of rpSwaps) rpHtml = rpHtml.replace(re, to)
    fs.writeFileSync(rp, rpHtml)
    console.log('Updated results-products.html core images')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
