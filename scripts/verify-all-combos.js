/**
 * Crawl live Octane for every combo that affects results answers,
 * then compare against local buildOctaneAnswers / deriveHairType.
 *
 * Critical dimensions for smart_properties hair_type:
 *   6 pain × 3 airdry × 3 pattern = 54
 *
 * Also verifies Q1×Q2 severity/damage field mappings (18).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildOctaneAnswers, deriveHairType } from '../src/quiz-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOT_ID = '6xnk6k967vfn9q42';
const QUIZ_ID = 'DlMPazSzrDmsEi0U';
const BASE = 'https://app.octaneai.com';
const QUIZ_URL = 'https://example.com/pages/personalized-product-list';
const PAGE_PATH = '/pages/personalized-product-list';
const OUT = path.join(__dirname, '..', 'captured');

const uid = () => 'cli_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function postJson(endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: 'https://example.com',
      Referer: QUIZ_URL,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(async () => ({ raw: await res.text() })) };
}

async function postForm(endpoint, body) {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (v == null) continue;
    form.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Origin: 'https://example.com',
      Referer: QUIZ_URL,
    },
    body: form.toString(),
  });
  return { status: res.status, data: await res.json().catch(async () => ({ raw: await res.text() })) };
}

async function start() {
  const body = {
    bot_id: BOT_ID,
    quiz_id: QUIZ_ID,
    user_ref: uid(),
    preview: false,
    preview_draft: false,
    is_embed: true,
    page_path: PAGE_PATH,
    device_type: 'desktop',
    assistant_trigger: '',
    is_shopping_assistant_embed: false,
  };
  let r = await postForm('/_quiz_/start', body);
  if (!r.data?.quiz_response_id) r = await postJson('/_quiz_/start', body);
  return r.data;
}

async function submitPage(qid, pageId, answers) {
  const r = await postJson('/_quiz_/submit_page', {
    bot_id: BOT_ID,
    quiz_id: QUIZ_ID,
    container_type: null,
    container_id: null,
    quiz_url: QUIZ_URL,
    quiz_response_id: qid,
    question_page_id: pageId,
    answers,
    preview: false,
    used_shop_pay_discount_wallet: false,
    session_exchange_rate: '1',
    session_country_code: 'US',
    is_shopping_assistant_embed: false,
    page_path: PAGE_PATH,
    device_type: 'desktop',
    assistant_trigger: '',
  });
  return r.data;
}

function pick(q, index) {
  if (q.question_type === 'multiple_choice') {
    const o = q.info.options[Math.min(index, q.info.options.length - 1)];
    return { [q.question_id]: [o.option_id], label: o.text.trim(), optionText: o.text.trim() };
  }
  if (q.question_type === 'email') {
    const email = `map.${uid()}@example.com`;
    return { [q.question_id]: [email, null, 'quiz'], label: email };
  }
  if (q.question_type === 'explainer') return { [q.question_id]: 'button', label: 'button' };
  return { [q.question_id]: 'button', label: 'button' };
}

/**
 * choiceIndexes: option index per question PAGE in order.
 * Damage path has one fewer page (skips Q8).
 */
async function runWithChoices(choiceIndexes) {
  const started = await start();
  if (!started?.quiz_response_id) return { error: 'start_failed', started };
  let state = started.state;
  const quizResponseId = started.quiz_response_id;
  const labels = [];
  let i = 0;

  while (state && i < 20) {
    if (state.state_type === 'results') {
      const answers = state.headless_results_page?.answers || {};
      return {
        labels,
        answers,
        hair_type:
          answers.smart_properties_outputs?.hair_type ||
          state.smart_properties_outputs?.hair_type,
      };
    }
    if (state.state_type !== 'question_page') break;

    const info = state.info;
    const pageId = state.question_page_id || info.question_page_id;
    const answers = {};
    for (const q of info.questions) {
      const idx = choiceIndexes[i] ?? 0;
      const p = pick(q, idx);
      Object.assign(answers, Object.fromEntries(Object.entries(p).filter(([k]) => k !== 'label' && k !== 'optionText')));
      labels.push(`${info.internal_name}: ${p.label}`);
    }
    const data = await submitPage(quizResponseId, pageId, answers);
    if (!data?.state) return { labels, error: data };
    state = data.state;
    i++;
  }
  return { labels, error: 'incomplete', state_type: state?.state_type };
}

const PAIN_IDX = { dry: 0, frizzy: 1, growth: 2, oily: 3, volume: 4, damage: 5 };
const AIRDRY_IDX = { Flat: 0, in_between: 1, Frizzy: 2 };
const PATTERN_IDX = { Straight: 0, Wavy: 1, Curly: 2 };

/** Local UI answer ids matching quiz-data.js for a hair-type combo */
function localAnswersForHairCombo(painKey, airdryKey, patternKey) {
  const q1ByPain = {
    dry: 'dry',
    frizzy: 'frizzy',
    growth: 'growth',
    oily: 'greasy',
    volume: 'volume',
    damage: 'damaged',
  };
  const q2ByPain = {
    dry: 'q2_dry',
    frizzy: 'q2_frizzy',
    growth: 'q2_growth',
    oily: 'q2_oily',
    volume: 'q2_volume',
    damage: 'q2_damage',
  };
  const airdryId = { Flat: 'flat_smooth', in_between: 'in_between', Frizzy: 'frizzy_poofy' };
  const patternId = { Straight: 'straight', Wavy: 'wavy', Curly: 'curly' };

  const q2First = {
    dry: 'slightly_dry',
    frizzy: 'flyaways',
    growth: 'split_ends',
    oily: 'same_day',
    volume: 'falls_fast',
    damage: 'dull',
  };

  const answers = {
    q1: q1ByPain[painKey],
    [q2ByPain[painKey]]: q2First[painKey],
    q3_wash: '1_2_days',
    q4_airdry: airdryId[airdryKey],
    q5_strand: patternId[patternKey],
    q6_volume_pref: 'sleek',
    q7_heat: 'none',
  };
  if (painKey !== 'damage') answers.q8_damage = 'healthy';
  return answers;
}

async function crawlHairTypeGrid() {
  const rows = [];
  const pains = Object.keys(PAIN_IDX);
  const airdrys = Object.keys(AIRDRY_IDX);
  const patterns = Object.keys(PATTERN_IDX);

  let n = 0;
  const total = pains.length * airdrys.length * patterns.length;

  for (const pain of pains) {
    for (const airdry of airdrys) {
      for (const pattern of patterns) {
        n++;
        const isDamage = pain === 'damage';
        // page order: Q1, Q2, wash, airdry, pattern, volume, heat, [damage], email, calc
        // fixed: Q2=0 (mild), wash=0, volume=2 (none), heat=3 (none), damage=0 (healthy)
        const idx = isDamage
          ? [PAIN_IDX[pain], 0, 0, AIRDRY_IDX[airdry], PATTERN_IDX[pattern], 2, 3]
          : [PAIN_IDX[pain], 0, 0, AIRDRY_IDX[airdry], PATTERN_IDX[pattern], 2, 3, 0];

        console.log(`[${n}/${total}] hair_type ${pain} × ${airdry} × ${pattern}`);
        let r;
        for (let attempt = 0; attempt < 3; attempt++) {
          r = await runWithChoices(idx);
          if (!r.error) break;
          console.log('  retry', attempt + 1, r.error?.error || r.error);
          await sleep(800);
        }

        const liveType = r.hair_type || r.answers?.smart_properties_outputs?.hair_type || null;
        const localType = deriveHairType(airdry, pattern, pain);
        const localPayload = buildOctaneAnswers(localAnswersForHairCombo(pain, airdry, pattern), 'test@example.com');

        const row = {
          pain,
          airdry,
          pattern,
          live_hair_type: liveType,
          local_hair_type: localType,
          hair_type_match: liveType === localType,
          live_answers: r.answers
            ? {
                hair_pain_point: r.answers.hair_pain_point,
                pain_severity: r.answers.pain_severity,
                damage_level: r.answers.damage_level,
                hair_air_dry: r.answers.hair_air_dry,
                hair_pattern: r.answers.hair_pattern,
                hair_wash_frequency: r.answers.hair_wash_frequency,
                heat_tools: r.answers.heat_tools,
                wants_volume: r.answers.wants_volume,
                smart_properties_outputs: r.answers.smart_properties_outputs,
              }
            : null,
          local_answers: {
            hair_pain_point: localPayload.hair_pain_point,
            pain_severity: localPayload.pain_severity,
            damage_level: localPayload.damage_level,
            hair_air_dry: localPayload.hair_air_dry,
            hair_pattern: localPayload.hair_pattern,
            hair_wash_frequency: localPayload.hair_wash_frequency,
            heat_tools: localPayload.heat_tools,
            wants_volume: localPayload.wants_volume,
            smart_properties_outputs: localPayload.smart_properties_outputs,
          },
          error: r.error || null,
        };
        rows.push(row);
        console.log(
          `  => live=${liveType} local=${localType} ${row.hair_type_match ? 'OK' : 'MISMATCH'}`
        );
        await sleep(200);
      }
    }
  }
  return rows;
}

async function crawlSeverityGrid() {
  const rows = [];
  // All Q1 × Q2 with fixed rest — captures pain_severity + damage_level from Q2/Q8
  for (let q1 = 0; q1 < 6; q1++) {
    for (let q2 = 0; q2 < 3; q2++) {
      const isDamage = q1 === 5;
      const idx = isDamage
        ? [q1, q2, 0, 0, 0, 2, 3]
        : [q1, q2, 0, 0, 0, 2, 3, 0]; // Q8 healthy so damage_level from Q8 = None unless damage path
      console.log(`[severity] Q1=${q1} Q2=${q2}`);
      let r;
      for (let attempt = 0; attempt < 3; attempt++) {
        r = await runWithChoices(idx);
        if (!r.error) break;
        await sleep(800);
      }
      rows.push({
        q1,
        q2,
        pain: r.answers?.hair_pain_point,
        severity: r.answers?.pain_severity,
        damage_level: r.answers?.damage_level,
        labels: r.labels?.slice(0, 2),
        error: r.error || null,
      });
      console.log(`  => ${r.answers?.hair_pain_point} / ${r.answers?.pain_severity} / damage=${r.answers?.damage_level}`);
      await sleep(200);
    }
  }
  return rows;
}

async function crawlDamageQ8Grid() {
  // Non-damage path: vary Q8 damage options (4) to confirm damage_level mapping
  const rows = [];
  for (let d = 0; d < 4; d++) {
    const idx = [0, 0, 0, 0, 0, 2, 3, d]; // dry mild, Q8 varies
    console.log(`[q8-damage] option ${d}`);
    const r = await runWithChoices(idx);
    rows.push({
      q8_index: d,
      damage_level: r.answers?.damage_level,
      label: r.labels?.find((l) => /Damage/i.test(l)),
      error: r.error || null,
    });
    console.log(`  => damage_level=${r.answers?.damage_level}`);
    await sleep(200);
  }
  return rows;
}

async function crawlHeatVolumePassThrough() {
  const rows = [];
  for (let heat = 0; heat < 4; heat++) {
    for (let vol = 0; vol < 3; vol++) {
      const idx = [0, 0, 0, 0, 0, vol, heat, 0];
      console.log(`[heat×vol] heat=${heat} vol=${vol}`);
      const r = await runWithChoices(idx);
      rows.push({
        heat_index: heat,
        volume_index: vol,
        heat_tools: r.answers?.heat_tools,
        wants_volume: r.answers?.wants_volume,
        error: r.error || null,
      });
      console.log(`  => heat=${r.answers?.heat_tools} volume=${r.answers?.wants_volume}`);
      await sleep(200);
    }
  }
  return rows;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  console.log('\n=== 1) Hair type grid (54) ===\n');
  const hairRows = await crawlHairTypeGrid();

  console.log('\n=== 2) Severity / Q2 grid (18) ===\n');
  const severityRows = await crawlSeverityGrid();

  console.log('\n=== 3) Q8 damage levels (4) ===\n');
  const damageRows = await crawlDamageQ8Grid();

  console.log('\n=== 4) Heat × volume pass-through (12) ===\n');
  const heatVolRows = await crawlHeatVolumePassThrough();

  const mismatches = hairRows.filter((r) => !r.hair_type_match && !r.error);
  const errors = [
    ...hairRows.filter((r) => r.error),
    ...severityRows.filter((r) => r.error),
    ...damageRows.filter((r) => r.error),
    ...heatVolRows.filter((r) => r.error),
  ];

  // Build complete hair_type lookup from live
  const hairTypeLookup = {};
  for (const r of hairRows) {
    if (!r.live_hair_type) continue;
    hairTypeLookup[`${r.pain}|${r.airdry}|${r.pattern}`] = r.live_hair_type;
  }

  const report = {
    generated_at: new Date().toISOString(),
    summary: {
      hair_type_combos: hairRows.length,
      hair_type_mismatches: mismatches.length,
      crawl_errors: errors.length,
      severity_combos: severityRows.length,
      q8_damage_combos: damageRows.length,
      heat_volume_combos: heatVolRows.length,
    },
    hair_type_lookup: hairTypeLookup,
    mismatches,
    severity_rows: severityRows,
    q8_damage_rows: damageRows,
    heat_volume_rows: heatVolRows,
    hair_type_rows: hairRows,
  };

  fs.writeFileSync(path.join(OUT, 'parity-report.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(OUT, 'hair-type-lookup.json'), JSON.stringify(hairTypeLookup, null, 2));

  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(report.summary, null, 2));
  if (mismatches.length) {
    console.log('\nMISMATCHES:');
    for (const m of mismatches) {
      console.log(`  ${m.pain} ${m.airdry} ${m.pattern}: live=${m.live_hair_type} local=${m.local_hair_type}`);
    }
  } else {
    console.log('\nAll hair_type combos match local deriveHairType.');
  }
  console.log('\nWrote captured/parity-report.json + hair-type-lookup.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
