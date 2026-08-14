/**
 * Emit public/brand-focus-data.js for results.html (no bundler).
 * Syncs product image paths from docs/lookskart-brand-products-with-images.csv.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  FOCUS_BRAND_WEIGHTS,
  DEFAULT_PRODUCTS,
  FOCUS_PRODUCTS,
  SAME_BRAND_VARIANTS,
  UNIVERSAL_KERASTASE_MAIN,
  UNIVERSAL_KERASTASE_VARIANTS,
} from '../src/brand-focus.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const out = path.join(publicDir, 'brand-focus-data.js');

function parseCsvLine(line) {
  const parts = [];
  let cur = '';
  let q = false;
  for (const ch of line) {
    if (ch === '"') {
      q = !q;
      continue;
    }
    if (ch === ',' && !q) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

function loadImageCatalog() {
  const csvPath = path.join(root, 'docs', 'lookskart-brand-products-with-images.csv');
  const lines = fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  const handleIdx = headers.indexOf('Handle');
  const localIdx = headers.indexOf('Local Image Path');
  const cdnIdx = headers.indexOf('Image URL (Lookskart CDN)');
  const map = new Map();

  for (const line of lines.slice(1)) {
    const row = parseCsvLine(line);
    const handle = row[handleIdx];
    if (!handle) continue;
    map.set(handle, {
      local: row[localIdx] || '',
      cdn: row[cdnIdx] || '',
    });
  }
  return map;
}

function resolveLocalPath(localPath) {
  if (!localPath) return localPath;
  const rel = localPath.replace(/^\//, '');
  const abs = path.join(publicDir, rel);
  if (fs.existsSync(abs) && fs.statSync(abs).size > 0) return localPath;

  const base = abs.replace(/\.(webp|jpg|jpeg|png|avif|gif)$/i, '');
  for (const ext of ['.jpg', '.jpeg', '.webp', '.png', '.avif']) {
    const candidate = base + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).size > 0) {
      return '/' + path.relative(publicDir, candidate).replace(/\\/g, '/');
    }
  }
  return localPath;
}

function patchProductImages(obj, catalog) {
  if (!obj || typeof obj !== 'object') return;
  if (typeof obj.handle === 'string') {
    const rec = catalog.get(obj.handle);
    if (rec?.local) obj.image = resolveLocalPath(rec.local);
    if (rec?.cdn) obj.imageCdn = rec.cdn;
  }
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) value.forEach((item) => patchProductImages(item, catalog));
    else if (value && typeof value === 'object') patchProductImages(value, catalog);
  }
}

const catalog = loadImageCatalog();
const payload = {
  FOCUS_BRAND_WEIGHTS,
  DEFAULT_PRODUCTS,
  FOCUS_PRODUCTS,
  SAME_BRAND_VARIANTS,
  UNIVERSAL_KERASTASE_MAIN,
  UNIVERSAL_KERASTASE_VARIANTS,
};

patchProductImages(payload, catalog);

const imageByHandle = {};
for (const [handle, rec] of catalog) {
  if (!rec.local && !rec.cdn) continue;
  imageByHandle[handle] = {
    local: rec.local ? resolveLocalPath(rec.local) : '',
    cdn: rec.cdn || '',
  };
}
payload.IMAGE_BY_HANDLE = imageByHandle;

const js = `/* Auto-generated from src/brand-focus.js — run: node scripts/build-brand-focus-public.js */
window.BRAND_FOCUS = ${JSON.stringify(payload, null, 2)};

window.BRAND_FOCUS.productUrl = function (handle) {
  return 'https://lookskart.com/products/' + handle;
};

window.BRAND_FOCUS.resolveImage = function (product) {
  if (!product) return '';
  var img = product.image || '';
  var rec = product.handle && window.BRAND_FOCUS.IMAGE_BY_HANDLE
    ? window.BRAND_FOCUS.IMAGE_BY_HANDLE[product.handle]
    : null;
  if (rec && rec.local) img = rec.local;
  else if (!img && rec && rec.cdn) img = rec.cdn;
  return img;
};

window.BRAND_FOCUS.applyImageFallback = function (imgEl, handle) {
  if (!imgEl || imgEl.dataset.fallbackDone === '1') return;
  var rec = handle && window.BRAND_FOCUS.IMAGE_BY_HANDLE
    ? window.BRAND_FOCUS.IMAGE_BY_HANDLE[handle]
    : null;
  if (!rec) return;

  var tried = (imgEl.dataset.fallbackTry || '').split('|').filter(Boolean);
  var src = imgEl.getAttribute('src') || '';
  if (src && tried.indexOf(src) === -1) tried.push(src);

  var candidates = [];
  if (rec.local) candidates.push(rec.local);
  if (rec.cdn) candidates.push(rec.cdn);

  for (var i = 0; i < candidates.length; i++) {
    var next = candidates[i];
    if (!next || tried.indexOf(next) !== -1) continue;
    imgEl.dataset.fallbackTry = tried.concat([next]).join('|');
    imgEl.src = next;
    return;
  }
  imgEl.dataset.fallbackDone = '1';
};

window.BRAND_FOCUS.pickFocusBrand = function (random) {
  random = random == null ? Math.random() : random;
  var weights = window.BRAND_FOCUS.FOCUS_BRAND_WEIGHTS;
  var cumulative = 0;
  for (var i = 0; i < weights.length; i++) {
    cumulative += weights[i].weight;
    if (random < cumulative) return weights[i].brand;
  }
  return weights[0].brand;
};

window.BRAND_FOCUS.isFocusBrand = function (brand) {
  return brand === 'Kerastase' || brand === "L'Oreal Professionnel";
};

window.BRAND_FOCUS.universalKerastaseProduct = function () {
  var p = window.BRAND_FOCUS.UNIVERSAL_KERASTASE_MAIN;
  return Object.assign({}, p, {
    url: window.BRAND_FOCUS.productUrl(p.handle),
    image: window.BRAND_FOCUS.resolveImage(p),
  });
};

window.BRAND_FOCUS.kerastaseSameBrandProducts = function () {
  return window.BRAND_FOCUS.UNIVERSAL_KERASTASE_VARIANTS.map(function (v) {
    return Object.assign({}, v, {
      brand: 'Kerastase',
      url: window.BRAND_FOCUS.productUrl(v.handle),
      image: window.BRAND_FOCUS.resolveImage(v),
    });
  });
};

window.BRAND_FOCUS.resolveSlotProduct = function (slotKey, focusBrand) {
  var BF = window.BRAND_FOCUS;
  var base = BF.DEFAULT_PRODUCTS[slotKey];
  if (!focusBrand || !BF.isFocusBrand(focusBrand)) {
    return Object.assign({}, base, {
      url: BF.productUrl(base.handle),
      image: BF.resolveImage(base),
    });
  }
  var overrides = BF.FOCUS_PRODUCTS[focusBrand] || {};
  var override = overrides[slotKey];
  if (!override) {
    return Object.assign({}, base, {
      url: BF.productUrl(base.handle),
      image: BF.resolveImage(base),
    });
  }
  var merged = Object.assign({}, base, override, {
    key: base && base.key,
    url: BF.productUrl(override.handle || base.handle),
  });
  merged.image = BF.resolveImage(merged);
  return merged;
};

window.BRAND_FOCUS.activeSlots = function (context) {
  var slots = [];
  if (context.isCoarse) {
    slots.push('shampoo_coarse', 'conditioner_coarse', 'oil_coarse');
  } else {
    slots.push('shampoo_fm', 'conditioner_fm', 'oil_fm');
  }
  slots.push('leave_in', 'dry_texture', 'hairspray', 'repair', 'mask');
  if (context.usesBlowDryer) slots.push(context.isCoarse ? 'heat_blow_coarse' : 'heat_blow_fm');
  if (context.usesIron) slots.push('heat_iron');
  if (context.wantsVolume && context.usesBlowDryer) slots.push('volume');
  return slots;
};

window.BRAND_FOCUS.sameBrandProductsForContext = function (focusBrand, context) {
  if (focusBrand === 'Kerastase' || !focusBrand) {
    return window.BRAND_FOCUS.kerastaseSameBrandProducts();
  }
  if (focusBrand === "L'Oreal Professionnel" && window.BRAND_FOCUS.isFocusBrand(focusBrand)) {
    var variants = window.BRAND_FOCUS.SAME_BRAND_VARIANTS[focusBrand] || {};
    var seen = {};
    var out = [];
    window.BRAND_FOCUS.activeSlots(context).forEach(function (slotKey) {
      var primary = window.BRAND_FOCUS.resolveSlotProduct(slotKey, focusBrand);
      seen[primary.handle] = true;
      (variants[slotKey] || []).forEach(function (v) {
        if (seen[v.handle]) return;
        seen[v.handle] = true;
        out.push(Object.assign({}, v, {
          brand: focusBrand,
          url: window.BRAND_FOCUS.productUrl(v.handle),
          slot: slotKey,
          image: window.BRAND_FOCUS.resolveImage(v),
        }));
      });
    });
    return out.slice(0, 8);
  }
  return window.BRAND_FOCUS.kerastaseSameBrandProducts();
};
`;

fs.writeFileSync(out, js);
console.log('Wrote', out, `(${Object.keys(imageByHandle).length} image lookups)`);
