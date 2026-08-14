/**
 * Brand coverage report: focus brands vs catalog vs quiz suggestions.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { QUESTIONS, buildOctaneAnswers } from '../src/quiz-data.js';
import {
  pickFocusBrand,
  resolveSlotProduct,
  activeSlots,
  FOCUS_BRAND_WEIGHTS,
  UNIVERSAL_KERASTASE_MAIN,
} from '../src/brand-focus.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const catalog = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'public', 'lookskart-catalog.json'), 'utf8')
);
const brandSummary = fs.readFileSync(
  path.join(ROOT, 'docs', 'lookskart-brand-summary.csv'),
  'utf8'
);

const FOCUS = [
  { name: 'Biotop', aliases: ['Biotop'] },
  { name: 'Brasil Cacau', aliases: ['Brasil Cacau', 'Brazil Cacau'] },
  { name: 'Kerastase', aliases: ['Kerastase'] },
  { name: 'K18', aliases: ['K18', 'K-18'] },
  { name: "L'Oreal Professionnel", aliases: ["L'Oreal Professionnel", "L'Oréal Professionnel", 'Loreal Professionnel'] },
  { name: 'Lea Levett', aliases: ['Lea Levett'] },
  { name: 'Moroccanoil', aliases: ['Moroccanoil', 'Moroccan Oil', 'Moroccan oil'] },
  { name: 'Olaplex', aliases: ['Olaplex'] },
  { name: 'Root Deep', aliases: ['Root Deep'] },
  { name: 'Schwarzkopf', aliases: ['Schwarzkopf'] },
  { name: '18.21 Man Made', aliases: ['18.21 Man Made', '18.21 Man'] },
  { name: "TAILOR'S", aliases: ["TAILOR'S", 'TAILORS', "Tailor's", 'Tailors'] },
  { name: 'Wet Brush', aliases: ['Wet Brush'] },
  { name: "Let's Shave", aliases: ["Let's Shave", 'Lets Shave'] },
  { name: 'Redken', aliases: ['Redken'] },
  { name: 'Agnaya', aliases: ['Agnaya'] },
  { name: 'pH Plex', aliases: ['pH Plex (Phplex)', 'pH Plex', 'Phplex', 'PH Plex'] },
];

// Parse brand summary for collection status
const summaryByNorm = new Map();
for (const line of brandSummary.split(/\r?\n/).slice(1)) {
  if (!line.trim()) continue;
  // Brand,Products found,Status,...
  const m = line.match(/^([^,]+),(\d+),([^,]+),/);
  if (!m) continue;
  summaryByNorm.set(m[1].toLowerCase(), { count: Number(m[2]), status: m[3] });
}

function matchFocus(brandName) {
  const lower = (brandName || '').toLowerCase();
  for (const f of FOCUS) {
    for (const a of f.aliases) {
      if (lower === a.toLowerCase()) return f.name;
    }
  }
  // partial for K-18 titles under K18 brand
  if (lower.includes('k-18') || lower === 'k18') return 'K18';
  return null;
}

// Catalog counts by focus brand
const catalogByBrand = new Map();
for (const f of FOCUS) catalogByBrand.set(f.name, []);

for (const p of catalog.products) {
  const focus = matchFocus(p.brand);
  if (!focus) continue;
  // skip cross-filed junk
  if (focus === 'Kerastase' && /biotop/i.test(p.title)) continue;
  if (focus === "L'Oreal Professionnel" && /kerastase/i.test(p.title)) continue;
  catalogByBrand.get(focus).push(p);
}

/** Primary products when no brand focus (legacy defaults) */
const PRIMARY = [
  { brand: 'Biotop', handle: 'biotop-911-quinoa-shampoo-330ml', slot: 'shampoo_fm' },
  { brand: 'Biotop', handle: 'biotop-911-quinoa-conditioner-330ml', slot: 'conditioner_fm' },
  { brand: 'Brasil Cacau', handle: 'brasil-cacau-extreme-repair-shampoo-for-damaged-hair-300ml', slot: 'shampoo_coarse' },
  { brand: 'Brasil Cacau', handle: 'brasil-cacau-extreme-repair-conditioner-for-damaged-hair-300ml', slot: 'conditioner_coarse' },
  { brand: 'K18', handle: 'k-18-leave-in-molecular-repair-hair-mask-50ml', slot: 'leave_in' },
  { brand: 'Moroccanoil', handle: 'moroccanoil-moroccanoil-treatment-light-100ml-for-fine-or-light-coloured-hair', slot: 'oil_fm' },
  { brand: 'Moroccanoil', handle: 'moroccanoil-moroccanoil-treatment-original-100ml-for-all-hair-types', slot: 'oil_coarse' },
  { brand: 'Kerastase', handle: 'kerastase-nutritive-nectar-thermique-blow-dry-primer-150ml', slot: 'heat_blow_fm' },
  { brand: 'Kerastase', handle: 'kerastase-gloss-absolu-anti-frizz-heat-protectant-spray-190ml', slot: 'heat_blow_coarse' },
  { brand: 'Kerastase', handle: 'kerastase-genesis-di©fense-thermique-blow-dry-primer-150ml', slot: 'heat_iron' },
  { brand: 'Moroccanoil', handle: 'moroccanoil-root-boost-for-fine-to-medium-hair-250ml', slot: 'volume' },
  { brand: 'Kerastase', handle: 'fresh-affair-dry-shampoo', slot: 'dry_texture' },
  { brand: 'Moroccanoil', handle: 'moroccanoil-luminous-hairspray-strong-330ml', slot: 'hairspray' },
  { brand: 'pH Plex', handle: 'ph-plex-step-3-150ml', slot: 'repair' },
  { brand: 'Kerastase', handle: 'kerastase-nutritive-masquintense-epais-mask-200ml-highly-nourishing-mask', slot: 'mask' },
  { brand: 'Kerastase', handle: 'kerastase-elixir-ultime-hair-oil-in-serum-30ml', slot: 'main_kerastase' },
  { brand: 'Kerastase', handle: 'kerastase-genesis-fondant-renfori-ateur-conditioner-200ml', slot: 'kerastase_conditioner' },
];

// Simulate all combos → which primary brands appear
const brandComboCounts = new Map(); // brand -> Set of combo keys or just count
const brandProductInCombos = new Map(); // brand -> Map(handle -> count)
for (const f of FOCUS) {
  brandComboCounts.set(f.name, 0);
  brandProductInCombos.set(f.name, new Map());
}

function mark(brand, handle) {
  brandComboCounts.set(brand, brandComboCounts.get(brand) + 1);
  const m = brandProductInCombos.get(brand);
  m.set(handle, (m.get(handle) || 0) + 1);
}

function primariesForAnswers(payload, focusBrand = null) {
  const hairType = payload.smart_properties_outputs.hair_type;
  const isCoarse = hairType === 'Coarse';
  const heat = payload.heat_tools;
  const volume = payload.wants_volume;
  const usesBlow = heat === 'blow_dryer' || heat === 'both';
  const usesIron = heat === 'iron' || heat === 'both';
  const wantsVol = volume === 'Max' || volume === 'Moderate';

  const context = {
    isCoarse,
    usesBlowDryer: usesBlow,
    usesIron,
    wantsVolume: wantsVol,
  };

  const universalKerastase = {
    brand: 'Kerastase',
    handle: UNIVERSAL_KERASTASE_MAIN.handle,
    slot: 'main_kerastase',
  };

  if (focusBrand === 'Kerastase') {
    const mainBentoSlots = new Set([
      'shampoo_fm',
      'shampoo_coarse',
      'leave_in',
      'oil_fm',
      'oil_coarse',
    ]);
    const kerastase = activeSlots(context).map((slotKey) => {
      const p = mainBentoSlots.has(slotKey)
        ? resolveSlotProduct(slotKey, null)
        : resolveSlotProduct(slotKey, 'Kerastase');
      return { brand: p.brand, handle: p.handle, slot: slotKey };
    });
    return [universalKerastase, ...kerastase];
  }

  if (focusBrand === "L'Oreal Professionnel") {
    const loreal = activeSlots(context).map((slotKey) => {
      const p = resolveSlotProduct(slotKey, focusBrand);
      return { brand: p.brand, handle: p.handle, slot: slotKey };
    });
    return [universalKerastase, ...loreal];
  }

  const shown = [universalKerastase];
  if (isCoarse) {
    shown.push(PRIMARY.find((p) => p.slot === 'shampoo_coarse'));
    shown.push(PRIMARY.find((p) => p.slot === 'conditioner_coarse'));
    shown.push(PRIMARY.find((p) => p.slot === 'oil_coarse'));
  } else {
    shown.push(PRIMARY.find((p) => p.slot === 'shampoo_fm'));
    shown.push(PRIMARY.find((p) => p.slot === 'conditioner_fm'));
    shown.push(PRIMARY.find((p) => p.slot === 'oil_fm'));
  }
  shown.push(PRIMARY.find((p) => p.slot === 'leave_in'));
  shown.push(PRIMARY.find((p) => p.slot === 'dry_texture'));
  shown.push(PRIMARY.find((p) => p.slot === 'hairspray'));
  shown.push(PRIMARY.find((p) => p.slot === 'repair'));
  shown.push(PRIMARY.find((p) => p.slot === 'mask'));

  if (usesBlow) {
    shown.push(
      PRIMARY.find((p) => p.slot === (isCoarse ? 'heat_blow_coarse' : 'heat_blow_fm'))
    );
  }
  if (usesIron) shown.push(PRIMARY.find((p) => p.slot === 'heat_iron'));
  if (wantsVol && usesBlow) shown.push(PRIMARY.find((p) => p.slot === 'volume'));

  return shown.filter(Boolean);
}

const q1opts = QUESTIONS.q1.options;
const washOpts = QUESTIONS.q3_wash.options;
const airOpts = QUESTIONS.q4_airdry.options;
const patOpts = QUESTIONS.q5_strand.options;
const volOpts = QUESTIONS.q6_volume_pref.options;
const heatOpts = QUESTIONS.q7_heat.options;
const dmgOpts = QUESTIONS.q8_damage.options;

let totalCombos = 0;
let focusKerastase = 0;
let focusLoreal = 0;
for (const q1 of q1opts) {
  const q2 = QUESTIONS[q1.next];
  for (const q2o of q2.options) {
    for (const wash of washOpts) {
      for (const air of airOpts) {
        for (const pat of patOpts) {
          for (const vol of volOpts) {
            for (const heat of heatOpts) {
              const damageChoices =
                q1.pain === 'damage'
                  ? [{ id: null, damage: q2o.damage }]
                  : dmgOpts;
              for (const dmg of damageChoices) {
                totalCombos++;
                const answers = {
                  q1: q1.id,
                  [q2.id]: q2o.id,
                  q3_wash: wash.id,
                  q4_airdry: air.id,
                  q5_strand: pat.id,
                  q6_volume_pref: vol.id,
                  q7_heat: heat.id,
                };
                if (q1.pain !== 'damage') answers.q8_damage = dmg.id;
                const payload = buildOctaneAnswers(answers, '');
                // Deterministic focus split mirrors pickFocusBrand weights (70/30)
                const focusBrand = pickFocusBrand((totalCombos % 100) / 100);
                if (focusBrand === "L'Oreal Professionnel") focusLoreal++;
                else focusKerastase++;
                payload.focus_brand = focusBrand;

                const brandsInCombo = new Set();
                for (const prod of primariesForAnswers(payload, focusBrand)) {
                  brandsInCombo.add(prod.brand);
                  const m = brandProductInCombos.get(prod.brand);
                  m.set(prod.handle, (m.get(prod.handle) || 0) + 1);
                }
                for (const b of brandsInCombo) {
                  brandComboCounts.set(b, brandComboCounts.get(b) + 1);
                }
              }
            }
          }
        }
      }
    }
  }
}

// Also count unique primary SKUs per brand
const primarySkusByBrand = new Map();
for (const f of FOCUS) primarySkusByBrand.set(f.name, new Set());
for (const p of PRIMARY) primarySkusByBrand.get(p.brand).add(p.handle);

const rows = [];
for (const f of FOCUS) {
  const products = catalogByBrand.get(f.name) || [];
  const summaryHit =
    [...summaryByNorm.entries()].find(([k]) =>
      f.aliases.some((a) => k === a.toLowerCase())
    )?.[1] || null;

  const catalogCount = products.length;
  const hasInCatalog = catalogCount > 0;
  const collectionEmpty =
    summaryHit && summaryHit.count === 0
      ? summaryHit.status
      : !hasInCatalog
        ? 'Not in catalog / 0 products'
        : 'Listed with products';

  const suggestedSkuCount = primarySkusByBrand.get(f.name).size;
  const combosWithBrand = brandComboCounts.get(f.name) || 0;
  const productBreakdown = [...(brandProductInCombos.get(f.name) || new Map()).entries()]
    .map(([handle, count]) => {
      const title =
        catalog.products.find((p) => p.handle === handle)?.title || handle;
      return `${title} → ${count.toLocaleString()} combos`;
    })
    .join('; ');

  rows.push({
    Brand: f.name,
    In_catalog: hasInCatalog ? 'YES' : 'NO',
    Catalog_product_count: catalogCount,
    Collection_status: collectionEmpty,
    Primary_SKUs_suggested_in_quiz: suggestedSkuCount,
    Combos_where_brand_appears: combosWithBrand,
    Combos_pct: ((combosWithBrand / totalCombos) * 100).toFixed(1) + '%',
    Product_combo_breakdown: productBreakdown || '— (never suggested as primary)',
  });
}

// Write CSV + print
const outCsv = path.join(ROOT, 'docs', 'brand-focus-coverage.csv');
const keys = Object.keys(rows[0]);
const esc = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
fs.writeFileSync(
  outCsv,
  [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n')
);

console.log('Total quiz combos:', totalCombos);
console.log(
  'Focus brand split:',
  FOCUS_BRAND_WEIGHTS.map((w) => `${w.brand} ${(w.weight * 100).toFixed(0)}%`).join(', ')
);
console.log(
  'Simulated focus assignments:',
  `Kerastase ${focusKerastase} (${((focusKerastase / totalCombos) * 100).toFixed(1)}%)`,
  `| L'Oreal ${focusLoreal} (${((focusLoreal / totalCombos) * 100).toFixed(1)}%)`,
  '| Kerastase main product: 100%'
);
console.log('Wrote', outCsv);
console.log('\n=== BRAND COVERAGE ===\n');
for (const r of rows) {
  console.log(
    `${r.Brand.padEnd(24)} catalog:${String(r.Catalog_product_count).padStart(3)}  in_quiz_SKUs:${r.Primary_SKUs_suggested_in_quiz}  combos:${String(r.Combos_where_brand_appears).padStart(6)} (${r.Combos_pct})`
  );
}
console.log('\n=== DETAIL ===\n');
for (const r of rows) {
  console.log(`\n## ${r.Brand}`);
  console.log(`  In catalog: ${r.In_catalog} (${r.Catalog_product_count} products) — ${r.Collection_status}`);
  console.log(`  Primary SKUs in quiz: ${r.Primary_SKUs_suggested_in_quiz}`);
  console.log(`  Appears in: ${r.Combos_where_brand_appears} / ${totalCombos} combos (${r.Combos_pct})`);
  if (r.Product_combo_breakdown !== '— (never suggested as primary)') {
    for (const part of r.Product_combo_breakdown.split('; ')) {
      console.log(`    - ${part}`);
    }
  }
}
