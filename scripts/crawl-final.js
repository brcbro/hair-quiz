/**
 * Finish crawl: submit email correctly as [email, consent, "quiz"]
 * and capture loading + final results/redirect for every Q1 branch.
 */
const fs = require('fs');
const path = require('path');

const BOT_ID = '6xnk6k967vfn9q42';
const QUIZ_ID = 'DlMPazSzrDmsEi0U';
const BASE = 'https://app.octaneai.com';
const QUIZ_URL = 'https://live-love-locks.com/pages/personalized-product-list';
const PAGE_PATH = '/pages/personalized-product-list';
const OUT_DIR = path.join(__dirname, '..', 'captured');

function uid() {
  return 'cli_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
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
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 3000), http: res.status }; }
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
      Origin: 'https://live-love-locks.com',
      Referer: QUIZ_URL,
    },
    body: form.toString(),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 3000), http: res.status }; }
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

function pageMeta(state) {
  if (!state) return null;
  const info = state.info || {};
  const qs = info.questions || [];
  return {
    state_type: state.state_type,
    internal_name: info.internal_name,
    title: info.title || qs[0]?.question_title || info.loading_title || null,
    question_page_id: state.question_page_id || info.question_page_id,
    progress: state.progress,
    continue_button_text: info.continue_button_text,
    questions: qs.map((q) => ({
      question_id: q.question_id,
      title: q.question_title,
      type: q.question_type,
      options: (q.info?.options || []).map((o) => ({
        option_id: o.option_id,
        text: (o.text || '').trim(),
      })),
    })),
    results_page_type: info.results_page_type,
    redirect_url: info.redirect_url,
    content_blocks: info.content_blocks,
    products: info.products || info.results || state.products || null,
    info_keys: Object.keys(info),
    raw_keys: Object.keys(state),
  };
}

function deepFindProducts(obj, out = [], depth = 0) {
  if (!obj || depth > 8) return out;
  if (Array.isArray(obj)) {
    for (const item of obj) deepFindProducts(item, out, depth + 1);
    return out;
  }
  if (typeof obj === 'object') {
    if (obj.title && (obj.price != null || obj.variants || obj.handle || obj.featured_image || obj.image)) {
      out.push({
        title: obj.title,
        handle: obj.handle,
        price: obj.price || obj.price_min || obj.variants?.[0]?.price,
        image: obj.image || obj.featured_image || obj.images?.[0]?.src || obj.images?.[0],
        url: obj.url || (obj.handle ? `https://live-love-locks.com/products/${obj.handle}` : null),
        id: obj.id || obj.product_id,
      });
    }
    for (const v of Object.values(obj)) deepFindProducts(v, out, depth + 1);
  }
  return out;
}

async function runPath(q1Index, laterIndex = 0) {
  const start = await startQuiz();
  if (!start.data?.quiz_response_id) return { error: 'start', start };

  let state = start.data.state;
  const quizResponseId = start.data.quiz_response_id;
  const steps = [pageMeta(state)];
  const labels = [];
  let guard = 0;

  while (state && guard++ < 30) {
    if (state.state_type === 'results' || state.state_type === 'results_page') {
      steps.push(pageMeta(state));
      break;
    }

    if (state.state_type !== 'question_page') {
      // loading / explainer / other
      const meta = pageMeta(state);
      meta.products_found = deepFindProducts(state);
      steps.push(meta);

      if (state.info?.results_page_type === 'redirect_url') break;

      const pageId = state.question_page_id || state.info?.question_page_id;
      if (pageId && state.state_type !== 'results') {
        const res = await submitPage(quizResponseId, pageId, {});
        if (res.data?.state) {
          state = res.data.state;
          continue;
        }
      }
      // dump full state for unknowns
      fs.writeFileSync(
        path.join(OUT_DIR, `unknown-state-${q1Index}-${guard}.json`),
        JSON.stringify(state, null, 2)
      );
      break;
    }

    const meta = pageMeta(state);
    const pageId = meta.question_page_id;
    const questions = meta.questions;
    const answers = {};

    for (const q of questions) {
      if (q.type === 'multiple_choice') {
        const idx = steps.length === 1 ? q1Index : laterIndex;
        const opt = q.options[Math.min(idx, q.options.length - 1)];
        answers[q.question_id] = [opt.option_id];
        labels.push(`${q.title} => ${opt.text}`);
      } else if (q.type === 'email') {
        const email = `lll.capture.${uid()}@example.com`;
        answers[q.question_id] = [email, null, 'quiz'];
        labels.push(`${q.title} => ${email}`);
      } else if (q.type === 'phone') {
        answers[q.question_id] = ['+15555550100', null, 'quiz'];
        labels.push(`${q.title} => phone`);
      } else {
        answers[q.question_id] = 'continue';
        labels.push(`${q.title} => continue`);
      }
    }

    const res = await submitPage(quizResponseId, pageId, answers);
    if (!res.data?.state) {
      steps.push({ submit_error: res, answers });
      break;
    }
    state = res.data.state;
    const next = pageMeta(state);
    next.products_found = deepFindProducts(state);
    steps.push(next);

    if (next.results_page_type === 'redirect_url') break;
    if (next.state_type === 'results' || next.state_type === 'results_page') break;
  }

  return {
    quiz_response_id: quizResponseId,
    labels,
    steps,
    final: steps[steps.length - 1],
    products: deepFindProducts(steps[steps.length - 1]) || steps[steps.length - 1]?.products_found,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Discover Q1 options
  const start = await startQuiz();
  const q1opts = start.data.state.info.questions[0].info.options.map((o) => o.text.trim());
  console.log('Q1 options:', q1opts);

  const all = [];

  for (let i = 0; i < q1opts.length; i++) {
    console.log(`\n>>> Branch ${i}: ${q1opts[i]}`);
    const result = await runPath(i, 0);
    all.push({ q1: q1opts[i], ...result });
    fs.writeFileSync(path.join(OUT_DIR, `final-q1-${i}.json`), JSON.stringify(result, null, 2));

    console.log('Steps:');
    for (const s of result.steps) {
      if (s.submit_error) {
        console.log('  ERROR', JSON.stringify(s.submit_error.data).slice(0, 200));
      } else {
        console.log(
          `  ${s.state_type} | ${s.internal_name || ''} | ${s.title || ''} | redirect=${s.redirect_url || '-'} | products=${(s.products_found || []).length}`
        );
      }
    }
    if (result.final) {
      fs.writeFileSync(
        path.join(OUT_DIR, `final-raw-q1-${i}.json`),
        JSON.stringify(result.final, null, 2)
      );
    }
  }

  // Also sample Q2 variants for dry (each severity) to confirm same shared path
  for (let j = 0; j < 3; j++) {
    console.log(`\n>>> Dry Q2 variant ${j}`);
    const result = await runPath(0, j);
    fs.writeFileSync(path.join(OUT_DIR, `final-dry-q2-${j}.json`), JSON.stringify(result, null, 2));
    console.log('  final:', result.final?.state_type, result.final?.title, result.final?.redirect_url);
  }

  // Build quiz tree for rebuild
  const tree = {
    captured_at: new Date().toISOString(),
    q1_options: q1opts,
    branches: all.map((b) => ({
      q1: b.q1,
      labels: b.labels,
      step_titles: b.steps.filter((s) => !s.submit_error).map((s) => ({
        state_type: s.state_type,
        internal_name: s.internal_name,
        title: s.title,
        progress: s.progress?.percentage,
        options: s.questions?.[0]?.options?.map((o) => o.text),
        results_page_type: s.results_page_type,
        redirect_url: s.redirect_url,
        products: s.products_found,
      })),
      final: b.final,
    })),
  };

  fs.writeFileSync(path.join(OUT_DIR, 'quiz-tree.json'), JSON.stringify(tree, null, 2));
  console.log('\nWrote quiz-tree.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
