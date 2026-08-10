/**
 * Submit calculating/explainer page with value "button" and capture real results.
 */
const fs = require('fs');
const path = require('path');

const BOT_ID = '6xnk6k967vfn9q42';
const QUIZ_ID = 'DlMPazSzrDmsEi0U';
const BASE = 'https://app.octaneai.com';
const QUIZ_URL = 'https://example.com/pages/personalized-product-list';
const PAGE_PATH = '/pages/personalized-product-list';
const OUT_DIR = path.join(__dirname, '..', 'captured');

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
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 5000), http: res.status }; }
  return { status: res.status, data };
}

async function postForm(endpoint, body) {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null) continue;
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
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 5000), http: res.status }; }
  return { status: res.status, data };
}

async function startQuiz() {
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
  let res = await postForm('/_quiz_/start', body);
  if (!res.data?.quiz_response_id) res = await postJson('/_quiz_/start', body);
  return res;
}

async function submitPage(quizResponseId, questionPageId, answers) {
  return postJson('/_quiz_/submit_page', {
    bot_id: BOT_ID,
    quiz_id: QUIZ_ID,
    container_type: null,
    container_id: null,
    quiz_url: QUIZ_URL,
    quiz_response_id: quizResponseId,
    question_page_id: questionPageId,
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
}

function answerForQuestion(q, optionIndex) {
  if (q.question_type === 'multiple_choice') {
    const opts = q.info.options;
    const opt = opts[Math.min(optionIndex, opts.length - 1)];
    return { value: [opt.option_id], label: opt.text.trim() };
  }
  if (q.question_type === 'email') {
    const email = `lll.capture.${uid()}@example.com`;
    return { value: [email, null, 'quiz'], label: email };
  }
  if (q.question_type === 'explainer') {
    return { value: 'button', label: 'button' };
  }
  if (q.question_type === 'phone') {
    return { value: ['+15555550100', null, 'quiz'], label: 'phone' };
  }
  return { value: 'button', label: 'button' };
}

function deepFindProducts(obj, out = [], seen = new Set(), depth = 0) {
  if (!obj || depth > 10) return out;
  if (typeof obj !== 'object') return out;
  if (seen.has(obj)) return out;
  seen.add(obj);

  if (Array.isArray(obj)) {
    obj.forEach((x) => deepFindProducts(x, out, seen, depth + 1));
    return out;
  }

  const title = obj.title || obj.name || obj.product_title;
  const hasProductShape = title && (obj.handle || obj.price != null || obj.featured_image || obj.image || obj.variants || obj.product_id || obj.id);
  if (hasProductShape && !String(title).includes('Building your')) {
    out.push({
      title,
      handle: obj.handle,
      price: obj.price || obj.price_min || obj.variants?.[0]?.price,
      image: obj.image || obj.featured_image || obj.images?.[0]?.src || obj.images?.[0],
      url: obj.url || obj.product_url || (obj.handle ? `https://example.com/products/${obj.handle}` : null),
      id: obj.product_id || obj.id,
      description: obj.description || obj.body_html || obj.subtitle,
    });
  }

  for (const v of Object.values(obj)) deepFindProducts(v, out, seen, depth + 1);
  return out;
}

async function runFull(q1Index) {
  const start = await startQuiz();
  let state = start.data.state;
  const quizResponseId = start.data.quiz_response_id;
  const steps = [];
  const labels = [];
  let pageNum = 0;

  while (state && pageNum < 20) {
    pageNum++;
    const info = state.info || {};
    const qs = info.questions || [];
    steps.push({
      state_type: state.state_type,
      internal_name: info.internal_name,
      title: info.title || qs[0]?.question_title,
      question_page_id: state.question_page_id || info.question_page_id,
      progress: state.progress,
      question_types: qs.map((q) => q.question_type),
      results_page_type: info.results_page_type,
      redirect_url: info.redirect_url,
      options: qs[0]?.info?.options?.map((o) => o.text.trim()),
    });

    if (state.state_type === 'results' || state.state_type === 'results_page' || info.results_page_type) {
      const products = deepFindProducts(state);
      // dedupe by title
      const uniq = [];
      const seen = new Set();
      for (const p of products) {
        const k = p.title + '|' + p.handle;
        if (!seen.has(k)) { seen.add(k); uniq.push(p); }
      }
      return {
        quizResponseId,
        labels,
        steps,
        final_state_type: state.state_type,
        results_page_type: info.results_page_type,
        redirect_url: info.redirect_url,
        products: uniq,
        raw_final: state,
      };
    }

    if (state.state_type !== 'question_page') {
      fs.writeFileSync(path.join(OUT_DIR, `non-question-${q1Index}.json`), JSON.stringify(state, null, 2));
      break;
    }

    const pageId = state.question_page_id || info.question_page_id;
    const answers = {};
    for (const q of qs) {
      const pick = pageNum === 1 ? q1Index : 0;
      const a = answerForQuestion(q, pick);
      answers[q.question_id] = a.value;
      labels.push(`${q.question_title} => ${a.label}`);
    }

    const res = await submitPage(quizResponseId, pageId, answers);
    if (!res.data?.state) {
      return { quizResponseId, labels, steps, error: res, last_answers: answers };
    }
    state = res.data.state;
  }

  return { quizResponseId, labels, steps, error: 'max_pages', raw_final: state };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const start = await startQuiz();
  const q1opts = start.data.state.info.questions[0].info.options.map((o) => o.text.trim());

  const branches = [];
  for (let i = 0; i < q1opts.length; i++) {
    console.log(`\n=== ${i}: ${q1opts[i]} ===`);
    const result = await runFull(i);
    branches.push({ q1: q1opts[i], ...result });
    fs.writeFileSync(path.join(OUT_DIR, `complete-q1-${i}.json`), JSON.stringify(result, null, 2));

    console.log(result.steps.map((s) => s.internal_name || s.title).join(' -> '));
    if (result.redirect_url) console.log('REDIRECT:', result.redirect_url);
    if (result.products?.length) {
      console.log('PRODUCTS:');
      result.products.forEach((p) => console.log(' -', p.title, p.price, p.handle));
    }
    if (result.error) console.log('ERROR:', JSON.stringify(result.error).slice(0, 300));
    if (result.raw_final) {
      fs.writeFileSync(path.join(OUT_DIR, `complete-raw-q1-${i}.json`), JSON.stringify(result.raw_final, null, 2));
      console.log('final keys:', Object.keys(result.raw_final), 'info:', Object.keys(result.raw_final.info || {}));
    }
  }

  // Build unique question tree from all branches
  const pages = new Map();
  for (const b of branches) {
    for (const s of b.steps || []) {
      const key = s.question_page_id || s.internal_name;
      if (!key) continue;
      if (!pages.has(key)) pages.set(key, s);
    }
  }

  const summary = {
    q1_options: q1opts,
    pages: [...pages.values()],
    branch_outcomes: branches.map((b) => ({
      q1: b.q1,
      flow: b.steps?.map((s) => s.internal_name || s.title),
      redirect_url: b.redirect_url,
      results_page_type: b.results_page_type,
      final_state_type: b.final_state_type,
      products: b.products,
      error: b.error ? true : false,
    })),
  };

  fs.writeFileSync(path.join(OUT_DIR, 'complete-summary.json'), JSON.stringify(summary, null, 2));
  console.log('\nDone. Pages:', pages.size);
}

main().catch((e) => { console.error(e); process.exit(1); });
