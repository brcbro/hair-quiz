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

  return {
    shampoo_set: isCoarse ? 'Weightless Hydrating S+C (coarse)' : 'Weightless S+C (fine/medium)',
    oil: isCoarse ? 'Moroccanoil Treatment Oil' : 'LLL Weightless Oil',
    dry_shampoo: isCoarse ? 'Moroccanoil Dry Shampoo' : 'Living Proof Dry Shampoo',
    blow_dry_product: usesBlow
      ? isCoarse
        ? 'Redken Rebel Tame'
        : 'Redken Big Blowout'
      : '— (hidden)',
    thermal_protectant: usesIron ? 'Redken Thermal Spray' : '— (hidden)',
    volume_product:
      wantsVol && usesBlow
        ? 'Olaplex Volume Mist'
        : wantsVol && !usesBlow
          ? 'Note only (needs blow dryer)'
          : '— (hidden)',
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
      Topic: 'Sheet: Full_Chains',
      Detail:
        'Every full answer path (~30k rows). Columns on the left are selections; columns on the right are outputs. Use AutoFilter.',
    },
    {
      Topic: 'Sheet: Product_Rules',
      Detail: 'Human-readable rules for when products show/hide and badge levels change.',
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
    { Rule: 'Hair type Fine/Medium', Effect: 'Show Weightless S+C (fine/medium) + LLL oil + Living Proof dry shampoo' },
    { Rule: 'Hair type Coarse', Effect: 'Swap to Hydrating S+C + Moroccanoil oil + Moroccanoil dry shampoo; longer wash-day timing' },
    { Rule: 'Heat includes blow dryer', Effect: 'Fine/Medium → Big Blowout; Coarse → Rebel Tame; add blow-dry routine steps' },
    { Rule: 'Heat includes iron', Effect: 'Show thermal protectant + iron routine steps' },
    { Rule: 'Wants volume Max/Moderate + uses blow dryer', Effect: 'Show Olaplex volume mist + volume routine step' },
    { Rule: 'Wants volume but no blow dryer', Effect: 'Show note that volume product needs blow dryer' },
    { Rule: 'Damage path OR growth OR damage Moderate/Severe', Effect: 'Repair mask badge = Must Have; show weekly repair accordion' },
    { Rule: 'Damage Mild', Effect: 'Repair badge = Good to Have' },
    { Rule: 'Damage None (and not growth/damage path)', Effect: 'Repair badge = Skip It For Now' },
    { Rule: 'Wash frequency', Effect: 'Does not swap product SKUs by itself; it changes hair_type via the 162 lookup, which then swaps products' },
    { Rule: 'Pain point (dry/frizzy/…)', Effect: 'Changes headline, summary copy, testimonial, and some product notes' },
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
                    Out_shampoo_set: effects.shampoo_set,
                    Out_oil: effects.oil,
                    Out_dry_shampoo: effects.dry_shampoo,
                    Out_blow_dry_product: effects.blow_dry_product,
                    Out_thermal: effects.thermal_protectant,
                    Out_volume_product: effects.volume_product,
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
  XLSX.utils.book_append_sheet(wb, sheetFromRows(hairTypeRows), 'Hair_Type_162');
  XLSX.utils.book_append_sheet(wb, sheetFromRows(q1q2), 'Q1_Q2_Severity');
  XLSX.utils.book_append_sheet(wb, sheetFromRows(rules), 'Product_Rules');
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

  console.log('Wrote', OUT_FILE);
  console.log('Hair type rows:', hairTypeRows.length);
  console.log('Q1-Q2 rows:', q1q2.length);
  console.log('Full chain rows:', full.length);
  console.log('Also:', csvHair);
}

main();
