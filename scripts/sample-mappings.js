/**
 * Sample more answer combinations to learn smart_properties hair_type mapping
 * and collect unique result answer payloads.
 */
const fs = require('fs');
const path = require('path');

const BOT_ID = '6xnk6k967vfn9q42';
const QUIZ_ID = 'DlMPazSzrDmsEi0U';
const BASE = 'https://app.octaneai.com';
const QUIZ_URL = 'https://live-love-locks.com/pages/personalized-product-list';
const PAGE_PATH = '/pages/personalized-product-list';
const OUT = path.join(__dirname, '..', 'captured');

const uid = () => 'cli_' + Math.random().toString(36).slice(2) + Date.now().toString(36);

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
    return { [q.question_id]: [o.option_id], label: o.text.trim() };
  }
  if (q.question_type === 'email') {
    const email = `map.${uid()}@example.com`;
    return { [q.question_id]: [email, null, 'quiz'], label: email };
  }
  if (q.question_type === 'explainer') return { [q.question_id]: 'button', label: 'button' };
  return { [q.question_id]: 'button', label: 'button' };
}

/**
 * choiceMap: { internal_name_substring: optionIndex }
 * or by progress order: array of option indexes per question_page encountered
 */
async function runWithChoices(choiceIndexes) {
  const started = await start();
  let state = started.state;
  const quizResponseId = started.quiz_response_id;
  const labels = [];
  let i = 0;

  while (state && i < 20) {
    if (state.state_type === 'results') {
      return {
        labels,
        answers: state.headless_results_page?.answers,
        hair_type: state.smart_properties_outputs || state.headless_results_page?.answers?.smart_properties_outputs,
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
      labels.push(`${info.internal_name}: ${p.label}`);
    }
    const data = await submitPage(quizResponseId, pageId, answers);
    if (!data?.state) return { labels, error: data };
    state = data.state;
    i++;
  }
  return { labels, error: 'incomplete', state_type: state?.state_type };
}

async function main() {
  // Indexes follow page order:
  // 0 Q1 frustration, 1 Q2 severity, 2 wash, 3 airdry, 4 strand, 5 volume pref, 6 heat, 7 damage?, 8 email, 9 calc
  // Note: damage path skips Q8 damage check

  const combos = [
    { name: 'dry-flat-straight', idx: [0, 0, 0, 0, 0, 0, 0, 0] },
    { name: 'dry-between-wavy', idx: [0, 1, 1, 1, 1, 1, 1, 1] },
    { name: 'dry-poofy-curly', idx: [0, 2, 2, 2, 2, 2, 2, 2] },
    { name: 'frizzy-poofy-curly', idx: [1, 2, 0, 2, 2, 0, 3, 2] },
    { name: 'volume-flat-straight', idx: [4, 2, 0, 0, 0, 2, 3, 0] },
    { name: 'damage-brittle-wavy', idx: [5, 1, 1, 1, 1, 1, 2] }, // fewer pages
    { name: 'oily-flat-straight', idx: [3, 0, 0, 0, 0, 2, 3, 0] },
    { name: 'growth-breakage-curly', idx: [2, 2, 1, 2, 2, 0, 1, 3] },
  ];

  const out = [];
  for (const c of combos) {
    console.log('Running', c.name, c.idx);
    const r = await runWithChoices(c.idx);
    out.push({ name: c.name, ...r });
    console.log(' =>', r.answers?.smart_properties_outputs || r.hair_type, r.answers?.hair_pain_point, r.answers?.hair_air_dry, r.answers?.hair_pattern);
  }

  fs.writeFileSync(path.join(OUT, 'answer-mapping-samples.json'), JSON.stringify(out, null, 2));

  // Extract single clean results HTML (first full HTML document only)
  const rawHtml = fs.readFileSync(path.join(OUT, 'results-html-q1-0.html'), 'utf8');
  const match = rawHtml.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
  if (match) {
    fs.writeFileSync(path.join(OUT, 'results-template.html'), match[0]);
    console.log('Wrote results-template.html', match[0].length);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
