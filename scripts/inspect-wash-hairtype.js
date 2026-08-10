/**
 * Inspect raw smart_properties for wash-frequency variants.
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

const uid = () => 'cli_' + Math.random().toString(36).slice(2) + Date.now().toString(36);

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
    return { [q.question_id]: [o.option_id] };
  }
  if (q.question_type === 'email') {
    return { [q.question_id]: [`map.${uid()}@example.com`, null, 'quiz'] };
  }
  return { [q.question_id]: 'button' };
}

async function run(idx) {
  const started = await start();
  let state = started.state;
  const quizResponseId = started.quiz_response_id;
  let i = 0;
  while (state && i < 20) {
    if (state.state_type === 'results') {
      return {
        smart_top: state.smart_properties_outputs,
        answers_smart: state.headless_results_page?.answers?.smart_properties_outputs,
        answers_keys: Object.keys(state.headless_results_page?.answers || {}),
        hair_type_answer: state.headless_results_page?.answers?.smart_properties_outputs?.hair_type,
        wash: state.headless_results_page?.answers?.hair_wash_frequency,
        full_answers: state.headless_results_page?.answers,
      };
    }
    if (state.state_type !== 'question_page') break;
    const info = state.info;
    const pageId = state.question_page_id || info.question_page_id;
    const answers = {};
    for (const q of info.questions) Object.assign(answers, pick(q, idx[i] ?? 0));
    const data = await submitPage(quizResponseId, pageId, answers);
    state = data.state;
    i++;
  }
  return { error: true, state };
}

const washes = [
  { name: '1_2', idx: [0, 0, 0, 0, 0, 2, 3, 0] },
  { name: '3_4', idx: [0, 0, 1, 0, 0, 2, 3, 0] },
  { name: '5_plus', idx: [0, 0, 2, 0, 0, 2, 3, 0] },
];

const out = [];
for (const w of washes) {
  console.log(w.name);
  const r = await run(w.idx);
  out.push({ name: w.name, ...r });
  console.log(JSON.stringify({
    wash: r.wash,
    hair_type_answer: r.hair_type_answer,
    smart_top: r.smart_top,
    answers_smart: r.answers_smart,
  }, null, 2));
}

fs.writeFileSync(path.join(__dirname, '..', 'captured', 'wash-inspect.json'), JSON.stringify(out, null, 2));
