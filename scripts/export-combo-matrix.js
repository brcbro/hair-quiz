/**
 * Build docs/quiz-combo-matrix.xlsx — every answer chain → result outputs.
 * Open in Excel / Google Sheets.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';
import { QUESTIONS, deriveHairType, buildOctaneAnswers } from '../src/quiz-data.js';
import { HAIR_TYPE_LOOKUP } from '../src/hair-type-lookup.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'docs');
const OUT_FILE = path.join(OUT_DIR, 'quiz-combo-matrix.xlsx');

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
  if (pain === 'oily') {
    raw = (sev ? sev + ' ' : '') + ht + ' hair with oily scalp';
  } else {
    raw = (sev ? sev + ' ' : '') + (HEADLINE_PAIN[pain] || pain) + ' ' + ht.toLowerCase() + ' hair';
  }
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

  // Names match live Lookskart lineup in public/results.html applyAnswers()
  return {
    shampoo: isCoarse
      ? 'Brasil Cacau Extreme Repair Shampoo'
      : 'Biotop 911 Quinoa Shampoo',
    conditioner: isCoarse
      ? 'Brasil Cacau Extreme Repair Conditioner'
      : 'Biotop 911 Quinoa Conditioner',
    leave_in: 'K-18 Leave-in Molecular Repair Mask',
    oil: isCoarse ? 'Moroccanoil Treatment Original' : 'Moroccanoil Treatment Light',
    dry_texture_spray: 'Moroccanoil Dry Texture Spray',
    blow_dry_product: usesBlow
      ? isCoarse
        ? 'Kerastase Gloss Absolu Heat Protectant Spray'
        : 'Kerastase Nectar Thermique Blow Dry Primer'
      : '— (hidden)',
    thermal_protectant: usesIron
      ? 'Schwarzkopf OSiS+ Flatliner Heat Protection Spray'
      : '— (hidden)',
    volume_product:
      wantsVol && usesBlow
        ? 'Moroccanoil Root Boost'
        : wantsVol && !usesBlow
          ? 'Note only (needs blow dryer)'
          : '— (hidden)',
    hairspray: 'Moroccanoil Luminous Hairspray Strong (always Skip It For Now)',
    repair_product: 'pH Plex Step 3',
    weekly_mask: 'Moroccanoil Weightless Hydrating Mask',
    repair_mask_badge: repair,
    washday_timing: washday,
    spray_count_hint: isCoarse
      ? '14–18 sprays'
      : isMedium
        ? '10–16 sprays'
        : '8–12 sprays',
  };
}

function sheetFromRows(rows) {
  const ws = XLSX.utils.json_to_sheet(rows);
  // rough column widths
  const keys = Object.keys(rows[0] || {});
  ws['!cols'] = keys.map((k) => ({ wch: Math.min(42, Math.max(12, k.length + 2)) }));
  return ws;
}

function main() {
  // deriveHairType is used via buildOctaneAnswers
  void deriveHairType;
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // —— Sheet: How to read ——
  const guide = [
    {
      Topic: 'What this file is',
      Detail:
        'Maps every quiz answer combination to the results outputs (hair type, headline, products, routine). Generated from the local quiz logic.',
    },
    {
      Topic: 'Display format',
      Detail:
        'Excel workbook (.xlsx). Open in Excel, Google Sheets, or LibreOffice. Filter/sort any column.',
    },
    {
      Topic: 'Sheet: Hair_Type_162',
      Detail:
        'All 162 combos of Frustration × Wash × Air-dry × Strand pattern → Fine / Medium / Coarse. This drives profile copy and many product swaps.',
    },
    {
      Topic: 'Sheet: Q1_Q2_Severity',
      Detail: 'Q1 frustration → Q2 question options → pain_severity (and damage_level on damage path).',
    },
    {
      Topic: 'Sheet: Products_List',
      Detail:
        'All Lookskart products used in quiz recommendations — name, price, when suggested, badge, URL.',
    },
    {
      Topic: 'Sheet: Product_Rules',
      Detail: 'Human-readable rules for when products show/hide and badge levels change.',
    },
    {
      Topic: 'Sheet: Full_Chains',
      Detail:
        'Every full answer path (~20k rows). Left columns = quiz answers; right columns = products/outputs. Use AutoFilter.',
    },
    {
      Topic: 'Google Sheets',
      Detail:
        'Upload this .xlsx to Google Drive → Open with Google Sheets. Or File → Import in an existing Sheet.',
    },
    {
      Topic: 'Counts',
      Detail:
        'Non-damage paths: 5 frustrations × 3 severity × 3 wash × 3 airdry × 3 pattern × 3 volume × 4 heat × 4 damage Q8 = 19,440. Damage path (skips Q8): 3 × 3 × 3 × 3 × 3 × 4 = 972. Total = 20,412.',
    },
  ];

  // —— Sheet: Hair type 162 ——
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

  // —— Sheet: Q1 Q2 ——
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

  // —— Sheet: Product rules ——
  const rules = [
    {
      Rule: 'Hair type Fine or Medium',
      Effect:
        'Biotop 911 Quinoa Shampoo (+ Conditioner in routine), Moroccanoil Treatment Light, Dry Texture Spray (fine/medium row)',
    },
    {
      Rule: 'Hair type Coarse',
      Effect:
        'Brasil Cacau Extreme Repair Shampoo (+ Conditioner in routine), Moroccanoil Treatment Original, Dry Texture Spray (coarse row); wash day Every 5+ days',
    },
    {
      Rule: 'Always shown (core)',
      Effect:
        'K-18 Leave-in Molecular Repair Mask (Must Have); Moroccanoil Luminous Hairspray Strong (Skip It For Now); pH Plex Step 3 + Weightless Hydrating Mask (badge varies)',
    },
    {
      Rule: 'Heat includes blow dryer (or both)',
      Effect:
        'Fine/Medium → Kerastase Nectar Thermique; Coarse → Kerastase Gloss Absolu Heat Protectant',
    },
    {
      Rule: 'Heat includes iron (or both)',
      Effect: 'Show Schwarzkopf OSiS+ Flatliner Heat Protection Spray',
    },
    {
      Rule: 'Wants volume Max/Moderate + uses blow dryer',
      Effect: 'Show Moroccanoil Root Boost',
    },
    {
      Rule: 'Wants volume but no blow dryer',
      Effect: 'Show note only — Root Boost needs a blow dryer',
    },
    {
      Rule: 'Damage path OR growth OR damage Moderate/Severe',
      Effect: 'pH Plex + Mask badge = Must Have; show Weekly Repair accordion',
    },
    { Rule: 'Damage Mild', Effect: 'pH Plex + Mask badge = Good to Have; optional repair accordion' },
    {
      Rule: 'Damage None (and not growth/damage path)',
      Effect: 'pH Plex + Mask badge = Skip It For Now',
    },
    {
      Rule: 'Wash frequency',
      Effect:
        'Does not swap SKUs directly; it feeds the 162 hair-type lookup, which then swaps products',
    },
    {
      Rule: 'Pain point (dry/frizzy/growth/oily/volume/damage)',
      Effect: 'Changes headline, summary, testimonial, and product note copy — not core SKUs (except via hair type)',
    },
  ];

  // —— Sheet: Products list (quiz catalog) ——
  const products = [
    {
      Product_ID: 'sc',
      Brand: 'Biotop',
      Product_Name: 'Biotop 911 Quinoa Shampoo 250ml',
      Price: 'Rs. 2,070',
      When_Suggested: 'Hair type Fine or Medium',
      Badge: 'Must Have',
      Lookskart_URL:
        'https://lookskart.com/products/biotop-911-quinoa-shampoo-330ml',
    },
    {
      Product_ID: 'sc-cond',
      Brand: 'Biotop',
      Product_Name: 'Biotop 911 Quinoa Conditioner 250ml',
      Price: 'Rs. 2,250',
      When_Suggested: 'Hair type Fine or Medium (routine image; no separate ATC card)',
      Badge: 'Must Have (with shampoo)',
      Lookskart_URL:
        'https://lookskart.com/products/biotop-911-quinoa-conditioner-330ml',
    },
    {
      Product_ID: 'scc',
      Brand: 'Brasil Cacau',
      Product_Name: 'Brasil Cacau Extreme Repair Shampoo 300ml',
      Price: 'Rs. 1,646',
      When_Suggested: 'Hair type Coarse',
      Badge: 'Must Have',
      Lookskart_URL:
        'https://lookskart.com/products/brasil-cacau-extreme-repair-shampoo-for-damaged-hair-300ml',
    },
    {
      Product_ID: 'scc-cond',
      Brand: 'Brasil Cacau',
      Product_Name: 'Brasil Cacau Extreme Repair Conditioner 300ml',
      Price: 'Rs. 1,850',
      When_Suggested: 'Hair type Coarse (routine image; no separate ATC card)',
      Badge: 'Must Have (with shampoo)',
      Lookskart_URL:
        'https://lookskart.com/products/brasil-cacau-extreme-repair-conditioner-for-damaged-hair-300ml',
    },
    {
      Product_ID: 'li',
      Brand: 'K-18',
      Product_Name: 'K-18 Leave-in Molecular Repair Mask 50ml',
      Price: 'Rs. 5,625',
      When_Suggested: 'Always',
      Badge: 'Must Have',
      Lookskart_URL:
        'https://lookskart.com/products/k-18-leave-in-molecular-repair-hair-mask-50ml',
    },
    {
      Product_ID: 'oil',
      Brand: 'Moroccanoil',
      Product_Name: 'Moroccanoil Treatment Light 100ml',
      Price: 'Rs. 4,320',
      When_Suggested: 'Hair type Fine or Medium',
      Badge: 'Must Have',
      Lookskart_URL:
        'https://lookskart.com/products/moroccanoil-moroccanoil-treatment-light-100ml-for-fine-or-light-coloured-hair',
    },
    {
      Product_ID: 'moroil',
      Brand: 'Moroccanoil',
      Product_Name: 'Moroccanoil Treatment Original 100ml',
      Price: 'Rs. 4,320',
      When_Suggested: 'Hair type Coarse',
      Badge: 'Must Have',
      Lookskart_URL:
        'https://lookskart.com/products/moroccanoil-moroccanoil-treatment-original-100ml-for-all-hair-types',
    },
    {
      Product_ID: 'bdc',
      Brand: 'Kerastase',
      Product_Name: 'Kerastase Nectar Thermique Blow Dry Primer 150ml',
      Price: 'Rs. 2,800',
      When_Suggested: 'Uses blow dryer or both + Fine/Medium',
      Badge: 'Must Have',
      Lookskart_URL:
        'https://lookskart.com/products/kerastase-nutritive-nectar-thermique-blow-dry-primer-150ml',
    },
    {
      Product_ID: 'rebel',
      Brand: 'Kerastase',
      Product_Name: 'Kerastase Gloss Absolu Heat Protectant Spray 190ml',
      Price: 'Rs. 3,000',
      When_Suggested: 'Uses blow dryer or both + Coarse',
      Badge: 'Must Have',
      Lookskart_URL:
        'https://lookskart.com/products/kerastase-gloss-absolu-anti-frizz-heat-protectant-spray-190ml',
    },
    {
      Product_ID: 'thermal',
      Brand: 'Schwarzkopf',
      Product_Name: 'Schwarzkopf OSiS+ Flatliner Heat Protection Spray 200ml',
      Price: 'Rs. 1,450',
      When_Suggested: 'Uses iron or both',
      Badge: 'Must Have',
      Lookskart_URL:
        'https://lookskart.com/products/schwarzkopf-professional-osis-flatliner-heat-protection-spray-200ml',
    },
    {
      Product_ID: 'volume',
      Brand: 'Moroccanoil',
      Product_Name: 'Moroccanoil Root Boost 250ml',
      Price: 'Rs. 2,610',
      When_Suggested: 'Wants Max/Moderate volume AND uses blow dryer',
      Badge: 'Must Have',
      Lookskart_URL:
        'https://lookskart.com/products/moroccanoil-root-boost-for-fine-to-medium-hair-250ml',
    },
    {
      Product_ID: 'dryshampoo',
      Brand: 'Moroccanoil',
      Product_Name: 'Moroccanoil Dry Texture Spray 205ml',
      Price: 'Rs. 2,610',
      When_Suggested: 'Always (row swaps Fine/Medium vs Coarse)',
      Badge: 'Good to Have',
      Lookskart_URL:
        'https://lookskart.com/products/moroccanoil-dry-texture-spray-205ml-for-all-hair-types',
    },
    {
      Product_ID: 'hairspray',
      Brand: 'Moroccanoil',
      Product_Name: 'Moroccanoil Luminous Hairspray Strong 330ml',
      Price: 'Rs. 2,610',
      When_Suggested: 'Always shown',
      Badge: 'Skip It For Now',
      Lookskart_URL:
        'https://lookskart.com/products/moroccanoil-luminous-hairspray-strong-330ml',
    },
    {
      Product_ID: 'repair',
      Brand: 'pH Plex',
      Product_Name: 'pH Plex Step 3 150ml',
      Price: 'Rs. 3,950',
      When_Suggested: 'Always shown; badge from damage/growth rules',
      Badge: 'Must Have / Good to Have / Skip It For Now',
      Lookskart_URL: 'https://lookskart.com/products/ph-plex-step-3-150ml',
    },
    {
      Product_ID: 'mask',
      Brand: 'Moroccanoil',
      Product_Name: 'Moroccanoil Weightless Hydrating Mask 250ml',
      Price: 'Rs. 3,780',
      When_Suggested: 'Always shown; badge from damage/growth rules',
      Badge: 'Must Have / Good to Have / Skip It For Now',
      Lookskart_URL:
        'https://lookskart.com/products/moroccanoil-weightless-hydrating-mask-for-fine-dry-hair-250ml',
    },
  ];

  // —— Sheet: Full chains ——
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
                  q1.pain === 'damage' ? [{ id: null, text: '(skipped — from Q2)', damage: q2o.damage }] : dmgOpts;

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
                    // outputs
                    Out_pain_point: payload.hair_pain_point,
                    Out_severity: payload.pain_severity,
                    Out_damage_level: payload.damage_level,
                    Out_hair_type: payload.smart_properties_outputs.hair_type,
                    Out_headline: buildHeadline(
                      payload.hair_pain_point,
                      payload.pain_severity,
                      payload.smart_properties_outputs.hair_type
                    ),
                    Out_shampoo: effects.shampoo,
                    Out_conditioner: effects.conditioner,
                    Out_leave_in: effects.leave_in,
                    Out_oil: effects.oil,
                    Out_dry_texture_spray: effects.dry_texture_spray,
                    Out_blow_dry_product: effects.blow_dry_product,
                    Out_thermal: effects.thermal_protectant,
                    Out_volume_product: effects.volume_product,
                    Out_hairspray: effects.hairspray,
                    Out_repair_product: effects.repair_product,
                    Out_weekly_mask: effects.weekly_mask,
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
  XLSX.utils.book_append_sheet(wb, sheetFromRows(products), 'Products_List');
  XLSX.utils.book_append_sheet(wb, sheetFromRows(rules), 'Product_Rules');
  XLSX.utils.book_append_sheet(wb, sheetFromRows(hairTypeRows), 'Hair_Type_162');
  XLSX.utils.book_append_sheet(wb, sheetFromRows(q1q2), 'Q1_Q2_Severity');
  XLSX.utils.book_append_sheet(wb, sheetFromRows(full), 'Full_Chains');

  XLSX.writeFile(wb, OUT_FILE);

  // Also write a smaller CSV of hair types for quick open
  const csvHair = path.join(OUT_DIR, 'hair-type-162.csv');
  const csvLines = [
    'Frustration,Wash,AirDry,Pattern,HairType',
    ...hairTypeRows.map(
      (r) =>
        [r.Frustration_pain, r.Wash_frequency, r.Air_dry_texture, r.Strand_pattern, r.Output_hair_type].join(',')
    ),
  ];
  fs.writeFileSync(csvHair, csvLines.join('\n'));

  // Products CSV for quick Google Sheets import
  const csvProducts = path.join(OUT_DIR, 'quiz-products-list.csv');
  const pKeys = Object.keys(products[0]);
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  fs.writeFileSync(
    csvProducts,
    [pKeys.join(','), ...products.map((r) => pKeys.map((k) => esc(r[k])).join(','))].join('\n')
  );

  console.log('Wrote', OUT_FILE);
  console.log('Hair type rows:', hairTypeRows.length);
  console.log('Q1-Q2 rows:', q1q2.length);
  console.log('Full chain rows:', full.length);
  console.log('Also:', csvHair);
  console.log('Also:', csvProducts);
}

main();
