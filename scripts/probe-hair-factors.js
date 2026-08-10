/**
 * Probe whether wash / volume / heat / severity change smart_properties hair_type
 * for a fixed airdry×pattern×pain cell.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
    return { [q.question_id]: [o.option_id], label: o.text.trim() };
  }
  if (q.question_type === 'email') {
    const email = `map.${uid()}@example.com`;
    return { [q.question_id]: [email, null, 'quiz'], label: email };
  }
  if (q.question_type === 'explainer') return { [q.question_id]: 'button', label: 'button' };
  return { [q.question_id]: 'button', label: 'button' };
}

async function runWithChoices(choiceIndexes) {
  const started = await start();
  let state = started.state;
  const quizResponseId = started.quiz_response_id;
  let i = 0;
  while (state && i < 20) {
    if (state.state_type === 'results') {
      const answers = state.headless_results_page?.answers || {};
      return {
        hair_type: answers.smart_properties_outputs?.hair_type,
        answers: {
          hair_pain_point: answers.hair_pain_point,
          hair_air_dry: answers.hair_air_dry,
          hair_pattern: answers.hair_pattern,
          hair_wash_frequency: answers.hair_wash_frequency,
          heat_tools: answers.heat_tools,
          wants_volume: answers.wants_volume,
          pain_severity: answers.pain_severity,
          damage_level: answers.damage_level,
        },
      };
    }
    if (state.state_type !== 'question_page') break;
    const info = state.info;
    const pageId = state.question_page_id || info.question_page_id;
    const answers = {};
    for (const q of info.questions) {
      const idx = choiceIndexes[i] ?? 0;
      const p = pick(q, idx);
      Object.assign(answers, Object.fromEntries(Object.entries(p).filter(([k]) => k !== 'label')));
    }
    const data = await submitPage(quizResponseId, pageId, answers);
    if (!data?.state) return { error: data };
    state = data.state;
    i++;
  }
  return { error: 'incomplete' };
}

async function main() {
  // Baseline from grid: dry Flat Straight → Fine with [0,0,0,0,0,2,3,0]
  // Old sample claimed Medium with Max volume + blow dryer: [0,0,0,0,0,0,0,0]
  const probes = [
    { name: 'baseline-none-vol-none-heat', idx: [0, 0, 0, 0, 0, 2, 3, 0] },
    { name: 'old-sample-max-vol-blow', idx: [0, 0, 0, 0, 0, 0, 0, 0] },
    { name: 'max-vol-none-heat', idx: [0, 0, 0, 0, 0, 0, 3, 0] },
    { name: 'none-vol-blow', idx: [0, 0, 0, 0, 0, 2, 0, 0] },
    { name: 'wash-5plus-same', idx: [0, 0, 2, 0, 0, 2, 3, 0] },
    { name: 'severe-same', idx: [0, 2, 0, 0, 0, 2, 3, 0] },
    { name: 'q8-severe-same', idx: [0, 0, 0, 0, 0, 2, 3, 3] },
    // Replicate dry-poofy-curly old sample: [0,2,2,2,2,2,2,2] → claimed Coarse
    { name: 'old-poofy-curly', idx: [0, 2, 2, 2, 2, 2, 2, 2] },
    // damage Frizzy Wavy with different heat
    { name: 'damage-frizzy-wavy-none', idx: [5, 0, 0, 2, 1, 2, 3] },
    { name: 'damage-frizzy-wavy-both-max', idx: [5, 0, 0, 2, 1, 0, 2] },
  ];

  const out = [];
  for (const p of probes) {
    console.log('Probe', p.name);
    const r = await runWithChoices(p.idx);
    out.push({ ...p, ...r });
    console.log(' =>', r.hair_type, r.answers || r.error);
    await sleep(250);
  }

  fs.writeFileSync(path.join(OUT, 'hair-type-factor-probes.json'), JSON.stringify(out, null, 2));
  console.log('Wrote hair-type-factor-probes.json');
}

main().catch((e) => { console.error(e); process.exit(1); });
