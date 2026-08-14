/**
 * Build docs/quiz-combo-matrix.xlsx with primary picks + cross-brand alternatives.
 * Also writes docs/quiz-products-by-slot.csv for quick Google Sheets import.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import { QUESTIONS, deriveHairType, buildOctaneAnswers } from '../src/quiz-data.js';
import { HAIR_TYPE_LOOKUP } from '../src/hair-type-lookup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs');
const OUT_FILE = path.join(OUT_DIR, 'quiz-combo-matrix.xlsx');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'lookskart-catalog.json'), 'utf8'));

const HAIR_BRANDS = new Set([
  'Biotop',
  'Brasil Cacau',
  'Kerastase',
  'K18',
  "L'Oreal Professionnel",
  'Lea Levett',
  'Moroccanoil',
  'Root Deep',
  'Schwarzkopf',
  'pH Plex (Phplex)',
]);

function classify(p) {
  const s = `${p.title || ''} ${p.handle || ''}`.toLowerCase();
  if (/shampoo/.test(s) && !/dry shampoo|conditioner/.test(s)) return 'shampoo';
  if (/conditioner|fondant|contiioner/.test(s)) return 'conditioner';
  if (/dry shampoo|dry texture|texture spray|fresh affair/.test(s)) return 'dry_texture';
  if (/heat protect|thermique|flatliner|blow dry primer|d[eé]fense thermique|thermal/.test(s))
    return 'heat_protectant';
  if (/hairspray|hair spray|elnett|session label|super dry fix|super dry flex/.test(s))
    return 'hairspray';
  if (/root boost|rootlift|full volume|thickening lotion|extra volume shampoo|extra volume conditioner|volumizing|super dust|volume panace|volume root/.test(s))
    return 'volume';
  if (/mask|masque|masquintense/.test(s) && !/leave-?in/.test(s)) return 'mask';
  if (/k-18 leave-?in|ph plex step 3|bond repair|leave-?in molecular/.test(s)) return 'bond_leavein';
  if (/oil|treatment light|treatment original|elixir|acai oil|huile|oil-in-serum|glaze drops/.test(s))
    return 'oil_serum';
  if (/leave-?in|serum/.test(s)) return 'serum_leavein';
  return 'other';
}

function concernTags(p) {
  const s = `${p.title || ''} ${p.handle || ''}`.toLowerCase();
  const tags = new Set();
  if (/fine|light-?coloured|light colored|weightless|extra volume|root boost|densifique|volume/.test(s))
    tags.add('fine');
  if (/coarse|thick|riche|intense hydrating|extreme repair|700 keratin/.test(s)) tags.add('coarse');
  if (/damag|repair|premiere|resistance|moisture repair|restorative|absolut repair|inforcer|metal dx/.test(s))
    tags.add('damage');
  if (/frizz|discipline|gloss absolu|anti[- ]?frizz|liss unlimited|xtenso/.test(s)) tags.add('frizzy');
  if (/oily|divalent|anti-oiliness|dermo-purifier|specifique bain divalent/.test(s)) tags.add('oily');
  if (/genesis|hair fall|hair-fall|stimuliste|serioxyl|aminexil|root deep|densifique/.test(s))
    tags.add('growth');
  if (/curl|wavy/.test(s)) tags.add('curl');
  if (/hydrat|moisture|nutritive|dry/.test(s)) tags.add('dry');
  if (/color|colour|chroma|vitamino|silver|blond|ultra-violet/.test(s)) tags.add('color');
  if (/dandruff|symbiose|eco dandruff/.test(s)) tags.add('dandruff');
  return tags;
}

const productsByCategory = {};
for (const p of catalog.products) {
  if (!HAIR_BRANDS.has(p.brand)) continue;
  if (p.brand === 'Kerastase' && /biotop/i.test(p.title)) continue;
  if (p.brand === "L'Oreal Professionnel" && /kerastase/i.test(p.title)) continue;
  const cat = classify(p);
  if (cat === 'other') continue;
  productsByCategory[cat] = productsByCategory[cat] || [];
  productsByCategory[cat].push({
    brand: p.brand,
    title: p.title,
    price: p.price,
    handle: p.handle,
    url: p.url,
    concerns: [...concernTags(p)],
  });
}

/** Primary quiz picks (live results.html) + slot metadata */
const SLOTS = {
  shampoo_fm: {
    label: 'Shampoo (Fine/Medium)',
    category: 'shampoo',
    primaryHandle: 'biotop-911-quinoa-shampoo-330ml',
    when: 'Hair type Fine or Medium',
    preferConcerns: ['fine', 'dry', 'damage'],
  },
  shampoo_coarse: {
    label: 'Shampoo (Coarse)',
    category: 'shampoo',
    primaryHandle: 'brasil-cacau-extreme-repair-shampoo-for-damaged-hair-300ml',
    when: 'Hair type Coarse',
    preferConcerns: ['coarse', 'damage'],
  },
  conditioner_fm: {
    label: 'Conditioner (Fine/Medium)',
    category: 'conditioner',
    primaryHandle: 'biotop-911-quinoa-conditioner-330ml',
    when: 'Hair type Fine or Medium',
    preferConcerns: ['fine', 'dry', 'damage'],
  },
  conditioner_coarse: {
    label: 'Conditioner (Coarse)',
    category: 'conditioner',
    primaryHandle: 'brasil-cacau-extreme-repair-conditioner-for-damaged-hair-300ml',
    when: 'Hair type Coarse',
    preferConcerns: ['coarse', 'damage'],
  },
  leave_in: {
    label: 'Leave-in / Bond repair',
    category: 'bond_leavein',
    primaryHandle: 'k-18-leave-in-molecular-repair-hair-mask-50ml',
    when: 'Always',
    preferConcerns: ['damage'],
  },
  oil_fm: {
    label: 'Oil / Treatment (Fine/Medium)',
    category: 'oil_serum',
    primaryHandle: 'moroccanoil-moroccanoil-treatment-light-100ml-for-fine-or-light-coloured-hair',
    when: 'Hair type Fine or Medium',
    preferConcerns: ['fine'],
  },
  oil_coarse: {
    label: 'Oil / Treatment (Coarse)',
    category: 'oil_serum',
    primaryHandle: 'moroccanoil-moroccanoil-treatment-original-100ml-for-all-hair-types',
    when: 'Hair type Coarse',
    preferConcerns: ['coarse', 'dry'],
  },
  heat_blow_fm: {
    label: 'Blow-dry heat protectant (Fine/Medium)',
    category: 'heat_protectant',
    primaryHandle: 'kerastase-nutritive-nectar-thermique-blow-dry-primer-150ml',
    when: 'Blow dryer or both + Fine/Medium',
    preferConcerns: ['fine', 'dry'],
  },
  heat_blow_coarse: {
    label: 'Blow-dry heat protectant (Coarse)',
    category: 'heat_protectant',
    primaryHandle: 'kerastase-gloss-absolu-anti-frizz-heat-protectant-spray-190ml',
    when: 'Blow dryer or both + Coarse',
    preferConcerns: ['frizzy', 'coarse'],
  },
  heat_iron: {
    label: 'Iron / wand heat protectant',
    category: 'heat_protectant',
    primaryHandle: 'schwarzkopf-professional-osis-flatliner-heat-protection-spray-200ml',
    when: 'Iron or both',
    preferConcerns: [],
  },
  volume: {
    label: 'Volume product',
    category: 'volume',
    primaryHandle: 'moroccanoil-root-boost-for-fine-to-medium-hair-250ml',
    when: 'Wants Max/Moderate volume + blow dryer',
    preferConcerns: ['fine', 'volume'],
  },
  dry_texture: {
    label: 'Dry texture / dry shampoo',
    category: 'dry_texture',
    primaryHandle: 'moroccanoil-dry-texture-spray-205ml-for-all-hair-types',
    when: 'Always',
    preferConcerns: [],
  },
  hairspray: {
    label: 'Hairspray',
    category: 'hairspray',
    primaryHandle: 'moroccanoil-luminous-hairspray-strong-330ml',
    when: 'Always (Skip It For Now)',
    preferConcerns: [],
  },
  repair: {
    label: 'Weekly bond repair',
    category: 'bond_leavein',
    primaryHandle: 'ph-plex-step-3-150ml',
    when: 'Always (badge from damage rules)',
    preferConcerns: ['damage'],
  },
  mask: {
    label: 'Weekly mask',
    category: 'mask',
    primaryHandle: 'moroccanoil-weightless-hydrating-mask-for-fine-dry-hair-250ml',
    when: 'Always (badge from damage rules)',
    preferConcerns: ['fine', 'dry', 'damage'],
  },
};

function findByHandle(handle) {
  return catalog.products.find((p) => p.handle === handle);
}

function scoreAlt(p, preferConcerns, pain) {
  let score = 0;
  const concerns = new Set(p.concerns);
  for (const c of preferConcerns) if (concerns.has(c)) score += 3;
  if (pain && concerns.has(pain)) score += 4;
  // prefer in-stock-ish smaller sizes / core lines slightly by shorter title
  if (/500ml|950ml|refill/.test(p.title.toLowerCase())) score -= 1;
  return score;
}

function alternativesForSlot(slotKey, pain = null) {
  const slot = SLOTS[slotKey];
  const pool = productsByCategory[slot.category] || [];
  const primary = findByHandle(slot.primaryHandle);
  const primaryBrand = primary?.brand;

  // One best alt per brand (excluding primary brand), ranked
  const byBrand = new Map();
  for (const p of pool) {
    if (p.handle === slot.primaryHandle) continue;
    if (primaryBrand && p.brand === primaryBrand) {
      // same-brand size/variant still useful — keep under Variations
      continue;
    }
    const sc = scoreAlt(p, slot.preferConcerns, pain);
    const prev = byBrand.get(p.brand);
    if (!prev || sc > prev.score) byBrand.set(p.brand, { ...p, score: sc });
  }

  const alts = [...byBrand.values()].sort((a, b) => b.score - a.score);

  // Same-brand variations (other sizes / related)
  const sameBrand = pool
    .filter((p) => p.brand === primaryBrand && p.handle !== slot.primaryHandle)
    .sort((a, b) => scoreAlt(b, slot.preferConcerns, pain) - scoreAlt(a, slot.preferConcerns, pain));

  return {
    primary: primary
      ? {
          brand: primary.brand,
          title: primary.title,
          price: primary.price,
          handle: primary.handle,
          url: primary.url,
        }
      : null,
    brandAlternatives: alts,
    sameBrandVariations: sameBrand,
  };
}

const HEADLINE_SEV = { Mild: 'Mildly', Moderate: 'Moderately', Severe: 'Severely' };
const HEADLINE_PAIN = {
  dry: 'dry',
  frizzy: 'frizzy',
  growth: 'breakage-prone',
  oily: 'oily-scalp',
  volume: 'flat',
  damage: 'damaged',
};

function buildHeadline(pain, severity, hairType) {
  const sev = HEADLINE_SEV[severity] || '';
  const ht = hairType.charAt(0).toUpperCase() + hairType.slice(1).toLowerCase();
  let raw;
  if (pain === 'oily') raw = (sev ? sev + ' ' : '') + ht + ' hair with oily scalp';
  else raw = (sev ? sev + ' ' : '') + (HEADLINE_PAIN[pain] || pain) + ' ' + ht.toLowerCase() + ' hair';
  return raw.replace(/\b\w/g, (c) => c.toUpperCase());
}

function productEffects({ hairType, heat, volume, damage, pain }) {
  const isCoarse = hairType === 'Coarse';
  const isMedium = hairType === 'Medium';
  const usesBlow = heat === 'blow_dryer' || heat === 'both';
  const usesIron = heat === 'iron' || heat === 'both';
  const wantsVol = volume === 'Max' || volume === 'Moderate';

  let repair = 'Skip It For Now';
  if (pain === 'damage' || pain === 'growth' || damage === 'Severe' || damage === 'Moderate') {
    repair = 'Must Have';
  } else if (damage === 'Mild') {
    repair = 'Good to Have';
  }

  let washday = 'Every 3 days · About 20 minutes';
  if (isCoarse) washday = 'Every 5+ days · About 20 minutes';
  else if (isMedium) washday = 'Every 4-5 days · About 20 minutes';

  const shampooSlot = isCoarse ? 'shampoo_coarse' : 'shampoo_fm';
  const condSlot = isCoarse ? 'conditioner_coarse' : 'conditioner_fm';
  const oilSlot = isCoarse ? 'oil_coarse' : 'oil_fm';
  const heatBlowSlot = isCoarse ? 'heat_blow_coarse' : 'heat_blow_fm';

  const fmtAlts = (slotKey) => {
    const { brandAlternatives, sameBrandVariations } = alternativesForSlot(slotKey, pain);
    const brands = brandAlternatives
      .slice(0, 8)
      .map((a) => `${a.brand}: ${a.title} (${a.price})`)
      .join(' | ');
    const variants = sameBrandVariations
      .slice(0, 4)
      .map((a) => `${a.title} (${a.price})`)
      .join(' | ');
    return { brands: brands || '—', variants: variants || '—' };
  };

  const sh = alternativesForSlot(shampooSlot, pain);
  const oil = alternativesForSlot(oilSlot, pain);
  const leave = alternativesForSlot('leave_in', pain);
  const dry = alternativesForSlot('dry_texture', pain);
  const mask = alternativesForSlot('mask', pain);
  const repairP = alternativesForSlot('repair', pain);
  const spray = alternativesForSlot('hairspray', pain);

  let blowPrimary = '— (hidden)';
  let blowAlts = '—';
  let blowVars = '—';
  if (usesBlow) {
    const b = alternativesForSlot(heatBlowSlot, pain);
    blowPrimary = b.primary ? `${b.primary.brand}: ${b.primary.title}` : '—';
    const f = fmtAlts(heatBlowSlot);
    blowAlts = f.brands;
    blowVars = f.variants;
  }

  let ironPrimary = '— (hidden)';
  let ironAlts = '—';
  let ironVars = '—';
  if (usesIron) {
    const b = alternativesForSlot('heat_iron', pain);
    ironPrimary = b.primary ? `${b.primary.brand}: ${b.primary.title}` : '—';
    const f = fmtAlts('heat_iron');
    ironAlts = f.brands;
    ironVars = f.variants;
  }

  let volPrimary = '— (hidden)';
  let volAlts = '—';
  let volVars = '—';
  if (wantsVol && usesBlow) {
    const b = alternativesForSlot('volume', pain);
    volPrimary = b.primary ? `${b.primary.brand}: ${b.primary.title}` : '—';
    const f = fmtAlts('volume');
    volAlts = f.brands;
    volVars = f.variants;
  } else if (wantsVol && !usesBlow) {
    volPrimary = 'Note only (needs blow dryer)';
  }

  const shAlts = fmtAlts(shampooSlot);
  const oilAlts = fmtAlts(oilSlot);
  const leaveAlts = fmtAlts('leave_in');
  const dryAlts = fmtAlts('dry_texture');
  const maskAlts = fmtAlts('mask');
  const repairAlts = fmtAlts('repair');
  const sprayAlts = fmtAlts('hairspray');
  const cond = alternativesForSlot(condSlot, pain);
  const condAlts = fmtAlts(condSlot);

  return {
    shampoo: sh.primary ? sh.primary.title : '—',
    shampoo_brand_alts: shAlts.brands,
    shampoo_same_brand_variants: shAlts.variants,
    conditioner: cond.primary ? cond.primary.title : '—',
    conditioner_brand_alts: condAlts.brands,
    leave_in: leave.primary ? leave.primary.title : '—',
    leave_in_brand_alts: leaveAlts.brands,
    leave_in_same_brand_variants: leaveAlts.variants,
    oil: oil.primary ? oil.primary.title : '—',
    oil_brand_alts: oilAlts.brands,
    oil_same_brand_variants: oilAlts.variants,
    blow_dry_product: blowPrimary,
    blow_dry_brand_alts: blowAlts,
    blow_dry_same_brand_variants: blowVars,
    thermal_protectant: ironPrimary,
    thermal_brand_alts: ironAlts,
    thermal_same_brand_variants: ironVars,
    volume_product: volPrimary,
    volume_brand_alts: volAlts,
    volume_same_brand_variants: volVars,
    dry_texture_spray: dry.primary ? dry.primary.title : '—',
    dry_texture_brand_alts: dryAlts.brands,
    hairspray: spray.primary ? spray.primary.title : '—',
    hairspray_brand_alts: sprayAlts.brands,
    repair_product: repairP.primary ? repairP.primary.title : '—',
    repair_brand_alts: repairAlts.brands,
    weekly_mask: mask.primary ? mask.primary.title : '—',
    mask_brand_alts: maskAlts.brands,
    mask_same_brand_variants: maskAlts.variants,
    repair_mask_badge: repair,
    washday_timing: washday,
    spray_count_hint: isCoarse ? '14–18 sprays' : isMedium ? '10–16 sprays' : '8–12 sprays',
  };
}

function sheetFromRows(rows) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const keys = Object.keys(rows[0] || {});
  ws['!cols'] = keys.map((k) => ({ wch: Math.min(48, Math.max(12, k.length + 2)) }));
  return ws;
}

function main() {
  void deriveHairType;
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const guide = [
    {
      Topic: 'What changed',
      Detail:
        'Each product slot now has: Primary (current quiz pick) + Brand_Alternatives (same category from other brands) + Same_Brand_Variants (other sizes/lines).',
    },
    {
      Topic: 'Sheet: Slot_Primary_And_Alts',
      Detail:
        'One row per recommendation slot. Use this to see every brand option for shampoo, oil, heat protectant, etc.',
    },
    {
      Topic: 'Sheet: Products_List',
      Detail: 'Primary Lookskart products currently wired in the results UI.',
    },
    {
      Topic: 'Sheet: Full_Chains',
      Detail:
        '~20k answer paths with primary products AND brand alternatives columns. Filter by hair type / heat / volume.',
    },
    {
      Topic: 'Google Sheets',
      Detail: 'Upload this .xlsx to Drive → Open with Google Sheets.',
    },
    {
      Topic: 'Live UI note',
      Detail:
        'Results page still shows primary picks only. Brand alternatives are documented here for merchandising — wire into UI when ready.',
    },
  ];

  // Slot sheet — expanded catalog view
  const slotRows = [];
  for (const [key, slot] of Object.entries(SLOTS)) {
    const { primary, brandAlternatives, sameBrandVariations } = alternativesForSlot(key);
    // one row per brand alternative + variants marked
    slotRows.push({
      Slot_ID: key,
      Slot: slot.label,
      When_Suggested: slot.when,
      Role: 'Primary',
      Brand: primary?.brand || '',
      Product: primary?.title || '',
      Price: primary?.price || '',
      URL: primary?.url || '',
    });
    for (const a of brandAlternatives) {
      slotRows.push({
        Slot_ID: key,
        Slot: slot.label,
        When_Suggested: slot.when,
        Role: 'Brand alternative',
        Brand: a.brand,
        Product: a.title,
        Price: a.price,
        URL: a.url,
      });
    }
    for (const a of sameBrandVariations) {
      slotRows.push({
        Slot_ID: key,
        Slot: slot.label,
        When_Suggested: slot.when,
        Role: 'Same-brand variant',
        Brand: a.brand,
        Product: a.title,
        Price: a.price,
        URL: a.url,
      });
    }
  }

  const products = Object.entries(SLOTS).map(([key, slot]) => {
    const p = findByHandle(slot.primaryHandle);
    return {
      Slot_ID: key,
      Slot: slot.label,
      Brand: p?.brand || '',
      Product_Name: p?.title || slot.primaryHandle,
      Price: p?.price || '',
      When_Suggested: slot.when,
      Lookskart_URL: p?.url || '',
    };
  });

  const rules = [
    {
      Rule: 'Hair type Fine or Medium',
      Effect: 'Primary: Biotop 911 Quinoa S+C + Treatment Light. Alts: other-brand shampoos/oils suited to fine/dry.',
    },
    {
      Rule: 'Hair type Coarse',
      Effect: 'Primary: Brasil Cacau Extreme Repair S+C + Treatment Original. Alts: coarse/damage lines from other brands.',
    },
    {
      Rule: 'Always shown',
      Effect: 'K-18 leave-in, Dry Texture Spray, Hairspray (Skip), pH Plex Step 3, Weightless Mask — each with brand alts listed.',
    },
    {
      Rule: 'Heat blow dryer',
      Effect: 'Fine/Med → Nectar Thermique; Coarse → Gloss Absolu; alts include Genesis Défense Thermique, Flatliner, etc.',
    },
    {
      Rule: 'Heat iron',
      Effect: 'Primary Flatliner; brand alts = other heat protectants.',
    },
    {
      Rule: 'Volume + blow dryer',
      Effect: 'Primary Root Boost; alts = Loreal volume, Kerastase densifique/volume lines, Biotop volumizing, etc.',
    },
    {
      Rule: 'Damage / growth badges',
      Effect: 'pH Plex + Mask badge Must Have / Good to Have / Skip — same as live results.',
    },
  ];

  const hairTypeRows = Object.entries(HAIR_TYPE_LOOKUP).map(([key, hair_type]) => {
    const [pain, wash, airdry, pattern] = key.split('|');
    return {
      Frustration_pain: pain,
      Wash_frequency: wash,
      Air_dry_texture: airdry,
      Strand_pattern: pattern,
      Output_hair_type: hair_type,
      Lookup_key: key,
    };
  });

  const q1q2 = [];
  for (const o of QUESTIONS.q1.options) {
    const q2 = QUESTIONS[o.next];
    for (const opt of q2.options) {
      q1q2.push({
        Q1_answer: o.text,
        pain_point: o.pain,
        Q2_question: q2.title,
        Q2_answer: opt.text,
        Output_pain_severity: opt.severity,
        Output_damage_level_from_Q2: opt.damage || '(set later by Q8)',
        Skips_Q8: o.pain === 'damage' ? 'Yes' : 'No',
      });
    }
  }

  // Full chains — include alt columns (can be large)
  const full = [];
  const q1opts = QUESTIONS.q1.options;
  const washOpts = QUESTIONS.q3_wash.options;
  const airOpts = QUESTIONS.q4_airdry.options;
  const patOpts = QUESTIONS.q5_strand.options;
  const volOpts = QUESTIONS.q6_volume_pref.options;
  const heatOpts = QUESTIONS.q7_heat.options;
  const dmgOpts = QUESTIONS.q8_damage.options;

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
                    ? [{ id: null, text: '(skipped — from Q2)', damage: q2o.damage }]
                    : dmgOpts;

                for (const dmg of damageChoices) {
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
                  const effects = productEffects({
                    hairType: payload.smart_properties_outputs.hair_type,
                    heat: payload.heat_tools,
                    volume: payload.wants_volume,
                    damage: payload.damage_level,
                    pain: payload.hair_pain_point,
                  });

                  full.push({
                    Q1_Frustration: q1.text,
                    Q2_Severity_answer: q2o.text,
                    Q3_Wash: wash.text,
                    Q4_Air_dry: air.text,
                    Q5_Pattern: pat.text,
                    Q6_Volume_want: vol.text,
                    Q7_Heat_tools: heat.text,
                    Q8_Damage: dmg.text,
                    Out_pain_point: payload.hair_pain_point,
                    Out_severity: payload.pain_severity,
                    Out_damage_level: payload.damage_level,
                    Out_hair_type: payload.smart_properties_outputs.hair_type,
                    Out_headline: buildHeadline(
                      payload.hair_pain_point,
                      payload.pain_severity,
                      payload.smart_properties_outputs.hair_type
                    ),
                    Out_shampoo_PRIMARY: effects.shampoo,
                    Out_shampoo_BRAND_ALTS: effects.shampoo_brand_alts,
                    Out_conditioner_PRIMARY: effects.conditioner,
                    Out_conditioner_BRAND_ALTS: effects.conditioner_brand_alts,
                    Out_leave_in_PRIMARY: effects.leave_in,
                    Out_leave_in_BRAND_ALTS: effects.leave_in_brand_alts,
                    Out_leave_in_SAME_BRAND_VARIANTS: effects.leave_in_same_brand_variants,
                    Out_oil_PRIMARY: effects.oil,
                    Out_oil_BRAND_ALTS: effects.oil_brand_alts,
                    Out_oil_SAME_BRAND_VARIANTS: effects.oil_same_brand_variants,
                    Out_blow_dry_PRIMARY: effects.blow_dry_product,
                    Out_blow_dry_BRAND_ALTS: effects.blow_dry_brand_alts,
                    Out_thermal_PRIMARY: effects.thermal_protectant,
                    Out_thermal_BRAND_ALTS: effects.thermal_brand_alts,
                    Out_volume_PRIMARY: effects.volume_product,
                    Out_volume_BRAND_ALTS: effects.volume_brand_alts,
                    Out_dry_texture_PRIMARY: effects.dry_texture_spray,
                    Out_dry_texture_BRAND_ALTS: effects.dry_texture_brand_alts,
                    Out_hairspray_PRIMARY: effects.hairspray,
                    Out_hairspray_BRAND_ALTS: effects.hairspray_brand_alts,
                    Out_repair_PRIMARY: effects.repair_product,
                    Out_repair_BRAND_ALTS: effects.repair_brand_alts,
                    Out_mask_PRIMARY: effects.weekly_mask,
                    Out_mask_BRAND_ALTS: effects.mask_brand_alts,
                    Out_mask_SAME_BRAND_VARIANTS: effects.mask_same_brand_variants,
                    Out_repair_badge: effects.repair_mask_badge,
                    Out_washday_timing: effects.washday_timing,
                    Out_leavein_sprays: effects.spray_count_hint,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFromRows(guide), 'How_to_read');
  XLSX.utils.book_append_sheet(wb, sheetFromRows(slotRows), 'Slot_Primary_And_Alts');
  XLSX.utils.book_append_sheet(wb, sheetFromRows(products), 'Products_List');
  XLSX.utils.book_append_sheet(wb, sheetFromRows(rules), 'Product_Rules');
  XLSX.utils.book_append_sheet(wb, sheetFromRows(hairTypeRows), 'Hair_Type_162');
  XLSX.utils.book_append_sheet(wb, sheetFromRows(q1q2), 'Q1_Q2_Severity');
  XLSX.utils.book_append_sheet(wb, sheetFromRows(full), 'Full_Chains');
  XLSX.writeFile(wb, OUT_FILE);

  // CSV for Slot_Primary_And_Alts — easiest Google Sheets import
  const csvPath = path.join(OUT_DIR, 'quiz-slot-brand-alternatives.csv');
  const keys = Object.keys(slotRows[0]);
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  fs.writeFileSync(
    csvPath,
    [keys.join(','), ...slotRows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n')
  );

  console.log('Wrote', OUT_FILE);
  console.log('Slot rows (primary+alts+variants):', slotRows.length);
  console.log('Full chain rows:', full.length);
  console.log('Also:', csvPath);
}

main();
