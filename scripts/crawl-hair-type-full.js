/**
 * Full live crawl: pain × wash × airdry × pattern (6×3×3×3 = 162)
 * Builds authoritative hair_type lookup for local clone.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOT_ID = '6xnk6k967vfn9q42';
const QUIZ_ID = 'DlMPazSzrDmsEi0U';
const BASE = 'https://app.octaneai.com';
const QUIZ_URL = 'https://live-love-locks.com/pages/personalized-product-list';
const PAGE_PATH = '/pages/personalized-product-list';
const OUT = path.join(__dirname, '..', 'captured');

const uid = () => 'cli_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Normalize Octane hair_type (short label OR prose) → Fine|Medium|Coarse */
export function normalizeHairType(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (/^(Fine|Medium|Coarse)$/i.test(s)) {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }
  // Prose e.g. "Based on your answers, you have Medium hair..."
  const m =
    s.match(/\b(Fine|Medium|Coarse)\s+hair\b/i) ||
    s.match(/\bas\s+(Fine|Medium|Coarse)\b/i) ||
    s.match(/\b(Fine|Medium|Coarse)\b/i);
  if (m) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
  return null;
}

async function postJson(endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: 'https://live-love-locks.com',
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
      Origin: 'https://live-love-locks.com',
      Referer: QUIZ_URL,
    },
    body: form.toString(),
  });
  return { status: res.status, data: await res.json().catch(async () => ({ raw: await res.text() })) };
}

async function start() {
  const body = {
    bot_id: BOT_ID, quiz_id: QUIZ_ID, user_ref: uid(), preview: false, preview_draft: false,
    is_embed: true, page_path: PAGE_PATH, device_type: 'desktop', assistant_trigger: '',
    is_shopping_assistant_embed: false,
  };
  let r = await postForm('/_quiz_/start', body);
  if (!r.data?.quiz_response_id) r = await postJson('/_quiz_/start', body);
  return r.data;
}

async function submitPage(qid, pageId, answers) {
  const r = await postJson('/_quiz_/submit_page', {
    bot_id: BOT_ID, quiz_id: QUIZ_ID, container_type: null, container_id: null,
    quiz_url: QUIZ_URL, quiz_response_id: qid, question_page_id: pageId, answers,
    preview: false, used_shop_pay_discount_wallet: false, session_exchange_rate: '1',
    session_country_code: 'US', is_shopping_assistant_embed: false, page_path: PAGE_PATH,
    device_type: 'desktop', assistant_trigger: '',
  });
  return r.data;
}

function pick(q, index) {
  if (q.question_type === 'multiple_choice') {
    const o = q.info.options[Math.min(index, q.info.options.length - 1)];
    return { [q.question_id]: [o.option_id] };
  }
  if (q.question_type === 'email') {
    return { [q.question_id]: [`map.${uid()}@example.com`, null, 'quiz'] };
  }
  return { [q.question_id]: 'button' };
}

async function runWithChoices(choiceIndexes) {
  const started = await start();
  if (!started?.quiz_response_id) return { error: 'start_failed' };
  let state = started.state;
  const quizResponseId = started.quiz_response_id;
  let i = 0;
  while (state && i < 20) {
    if (state.state_type === 'results') {
      const answers = state.headless_results_page?.answers || {};
      const raw =
        answers.smart_properties_outputs?.hair_type ||
        state.smart_properties_outputs?.hair_type ||
        null;
      return {
        raw_hair_type: raw,
        hair_type: normalizeHairType(raw),
        answers: {
          hair_pain_point: answers.hair_pain_point,
          pain_severity: answers.pain_severity,
          damage_level: answers.damage_level,
          hair_air_dry: answers.hair_air_dry,
          hair_pattern: answers.hair_pattern,
          hair_wash_frequency: answers.hair_wash_frequency,
          heat_tools: answers.heat_tools,
          wants_volume: answers.wants_volume,
        },
      };
    }
    if (state.state_type !== 'question_page') break;
    const info = state.info;
    const pageId = state.question_page_id || info.question_page_id;
    const answers = {};
    for (const q of info.questions) Object.assign(answers, pick(q, choiceIndexes[i] ?? 0));
    const data = await submitPage(quizResponseId, pageId, answers);
    if (!data?.state) return { error: data };
    state = data.state;
    i++;
  }
  return { error: 'incomplete' };
}

const PAINS = ['dry', 'frizzy', 'growth', 'oily', 'volume', 'damage'];
const WASHES = ['1_2_days', '3_4_days', '5_plus_days'];
const AIRDRYS = ['Flat', 'in_between', 'Frizzy'];
const PATTERNS = ['Straight', 'Wavy', 'Curly'];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const lookupPath = path.join(OUT, 'hair-type-lookup-full.json');
  const rowsPath = path.join(OUT, 'hair-type-full-rows.json');

  // Resume support
  let lookup = {};
  let rows = [];
  if (fs.existsSync(lookupPath)) {
    lookup = JSON.parse(fs.readFileSync(lookupPath, 'utf8'));
    console.log('Resuming with', Object.keys(lookup).length, 'existing keys');
  }
  if (fs.existsSync(rowsPath)) {
    rows = JSON.parse(fs.readFileSync(rowsPath, 'utf8'));
  }

  const total = PAINS.length * WASHES.length * AIRDRYS.length * PATTERNS.length;
  let n = 0;

  for (let pi = 0; pi < PAINS.length; pi++) {
    for (let wi = 0; wi < WASHES.length; wi++) {
      for (let ai = 0; ai < AIRDRYS.length; ai++) {
        for (let si = 0; si < PATTERNS.length; si++) {
          n++;
          const pain = PAINS[pi];
          const wash = WASHES[wi];
          const airdry = AIRDRYS[ai];
          const pattern = PATTERNS[si];
          const key = `${pain}|${wash}|${airdry}|${pattern}`;
          if (lookup[key]) {
            console.log(`[${n}/${total}] skip ${key} (=${lookup[key]})`);
            continue;
          }

          const isDamage = pain === 'damage';
          // Q1, Q2=0, wash, airdry, pattern, volume=2 none, heat=3 none, [q8=0]
          const idx = isDamage
            ? [pi, 0, wi, ai, si, 2, 3]
            : [pi, 0, wi, ai, si, 2, 3, 0];

          console.log(`[${n}/${total}] ${key}`);
          let r;
          for (let attempt = 0; attempt < 3; attempt++) {
            r = await runWithChoices(idx);
            if (!r.error && r.hair_type) break;
            console.log('  retry', attempt + 1, r.error || r.raw_hair_type);
            await sleep(1000);
          }

          const row = {
            key,
            pain,
            wash,
            airdry,
            pattern,
            raw_hair_type: r.raw_hair_type || null,
            hair_type: r.hair_type || null,
            answers: r.answers || null,
            error: r.error || null,
          };
          rows.push(row);
          if (r.hair_type) lookup[key] = r.hair_type;

          console.log(`  => ${r.hair_type}${r.raw_hair_type && r.raw_hair_type !== r.hair_type ? ' (from prose)' : ''}`);

          // checkpoint every combo
          fs.writeFileSync(lookupPath, JSON.stringify(lookup, null, 2));
          fs.writeFileSync(rowsPath, JSON.stringify(rows, null, 2));
          await sleep(150);
        }
      }
    }
  }

  const missing = [];
  for (const pain of PAINS) {
    for (const wash of WASHES) {
      for (const airdry of AIRDRYS) {
        for (const pattern of PATTERNS) {
          const key = `${pain}|${wash}|${airdry}|${pattern}`;
          if (!lookup[key]) missing.push(key);
        }
      }
    }
  }

  const report = {
    generated_at: new Date().toISOString(),
    total_expected: total,
    captured: Object.keys(lookup).length,
    missing,
    prose_count: rows.filter((r) => r.raw_hair_type && r.raw_hair_type !== r.hair_type).length,
  };
  fs.writeFileSync(path.join(OUT, 'hair-type-full-report.json'), JSON.stringify(report, null, 2));
  console.log('\nDONE', report);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
