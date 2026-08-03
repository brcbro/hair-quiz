/**
 * Crawl the Live Love Locks Octane AI quiz via CLI (no browser).
 * Captures every branch, loading screens, and final results/redirects.
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
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 2000), status: res.status };
  }
  return { status: res.status, data };
}

async function postForm(endpoint, body) {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'object') form.set(k, JSON.stringify(v));
    else form.set(k, String(v));
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
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 2000), status: res.status };
  }
  return { status: res.status, data };
}

function summarizeState(state) {
  if (!state) return null;
  const info = state.info || {};
  const questions = (info.questions || []).map((q) => ({
    question_id: q.question_id,
    title: q.question_title,
    type: q.question_type,
    options: (q.info?.options || []).map((o) => ({
      option_id: o.option_id,
      text: (o.text || '').trim(),
    })),
    placeholder: q.info?.placeholder,
  }));

  return {
    state_type: state.state_type,
    internal_name: info.internal_name,
    title: info.title || questions[0]?.title || info.loading_title || null,
    question_page_id: state.question_page_id || info.question_page_id,
    progress: state.progress,
    continue_button_text: info.continue_button_text,
    show_continue_button: info.show_continue_button,
    show_back_button: state.show_back_button,
    questions,
    results_page_type: info.results_page_type,
    redirect_url: info.redirect_url,
    products: extractProducts(state),
    top_content: info.top_content || info.question_top_content || null,
    raw_keys: Object.keys(state),
    info_keys: Object.keys(info),
  };
}

function extractProducts(state) {
  const info = state.info || {};
  const candidates = [
    info.products,
    info.results,
    state.products,
    state.results,
    info.content_blocks,
  ].filter(Boolean);

  const out = [];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      for (const item of c) {
        if (item?.title || item?.name || item?.product_title || item?.handle) {
          out.push({
            title: item.title || item.name || item.product_title,
            handle: item.handle,
            price: item.price || item.price_min || item.variant?.price,
            image: item.image || item.featured_image || item.img || item.images?.[0],
            url: item.url || item.product_url,
            id: item.id || item.product_id || item.variant_id,
            raw: item,
          });
        } else if (item?.type === 'products' || item?.products) {
          for (const p of item.products || []) {
            out.push({
              title: p.title || p.name,
              handle: p.handle,
              price: p.price,
              image: p.image || p.featured_image,
              url: p.url,
              id: p.id,
            });
          }
        }
      }
    } else if (typeof c === 'object') {
      out.push({ note: 'non-array products object', keys: Object.keys(c) });
    }
  }
  return out;
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

  // Prefer form first (Octane default $post), fallback JSON
  let res = await postForm('/_quiz_/start', body);
  if (!res.data?.state && !res.data?.quiz_response_id) {
    res = await postJson('/_quiz_/start', body);
  }
  return res;
}

async function submitPage(quizResponseId, questionPageId, answers) {
  const body = {
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
  };
  return postJson('/_quiz_/submit_page', body);
}

async function submitAnswer(quizResponseId, questionId, value) {
  const body = {
    bot_id: BOT_ID,
    quiz_id: QUIZ_ID,
    container_type: null,
    container_id: null,
    quiz_url: QUIZ_URL,
    quiz_response_id: quizResponseId,
    question_id: questionId,
    value,
    preview: false,
    used_shop_pay_discount_wallet: false,
    session_exchange_rate: '1',
    session_country_code: 'US',
    is_shopping_assistant_embed: false,
    page_path: PAGE_PATH,
    device_type: 'desktop',
    assistant_trigger: '',
  };
  let res = await postForm('/_quiz_/submit', body);
  if (!res.data?.state) res = await postJson('/_quiz_/submit', { ...body, value });
  return res;
}

function getAnswerChoices(question) {
  if (question.type === 'multiple_choice') {
    return question.options.map((o) => ({
      label: o.text,
      value: [o.option_id],
      option_id: o.option_id,
    }));
  }
  if (question.type === 'email') {
    return [{ label: 'email', value: `capture+${uid()}@example.com` }];
  }
  if (question.type === 'phone') {
    return [{ label: 'phone', value: '+15555550100' }];
  }
  if (question.type === 'free_form_text' || question.type === 'collect_text') {
    return [{ label: 'text', value: 'CLI capture' }];
  }
  return [{ label: 'unknown', value: null }];
}

async function walkPath(optionIndexes, collectAllBranches = false) {
  const start = await startQuiz();
  if (!start.data?.quiz_response_id) {
    return { error: 'start_failed', start };
  }

  let state = start.data.state;
  const quizResponseId = start.data.quiz_response_id;
  const styling = start.data.styling;
  const steps = [summarizeState(state)];
  const pathLabels = [];
  let depth = 0;
  const maxDepth = 25;

  while (state && depth < maxDepth) {
    depth++;
    const type = state.state_type;

    if (type === 'results' || type === 'results_page') {
      steps.push(summarizeState(state));
      break;
    }

    // Loading / intermediate screens may auto-continue via another submit
    if (type === 'loading' || type === 'loading_page' || type === 'explainer') {
      steps.push(summarizeState(state));
      // Try submitting empty page / wait-like submit if IDs exist
      const pageId = state.question_page_id || state.info?.question_page_id;
      if (pageId) {
        const res = await submitPage(quizResponseId, pageId, {});
        state = res.data?.state || state;
        continue;
      }
      break;
    }

    if (type !== 'question_page') {
      steps.push({ unknown_state: summarizeState(state), full: state });
      break;
    }

    const summary = summarizeState(state);
    const pageId = summary.question_page_id;
    const questions = summary.questions;
    if (!questions.length) {
      steps.push({ empty_questions: summary });
      break;
    }

    // Build answers for this page
    const answers = {};
    const labels = [];
    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
      const choices = getAnswerChoices(q);
      const pickIndex = optionIndexes[depth - 1 + qi] ?? 0;
      const choice = choices[Math.min(pickIndex, choices.length - 1)];
      answers[q.question_id] = choice.value;
      labels.push(`${q.title} => ${choice.label}`);
    }
    pathLabels.push(...labels);

    const res = await submitPage(quizResponseId, pageId, answers);
    if (!res.data?.state) {
      // fallback: single submit for first question
      const q = questions[0];
      const val = answers[q.question_id];
      const res2 = await submitAnswer(quizResponseId, q.question_id, val);
      if (!res2.data?.state) {
        steps.push({ submit_failed: res, submit2: res2 });
        break;
      }
      state = res2.data.state;
      steps.push(summarizeState(state));
      continue;
    }

    state = res.data.state;
    steps.push(summarizeState(state));

    if (state.info?.results_page_type === 'redirect_url') break;
    if (state.state_type === 'results' || state.state_type === 'results_page') break;
  }

  return {
    quiz_response_id: quizResponseId,
    pathLabels,
    optionIndexes,
    steps,
    styling_colors: styling?.colors,
    final: steps[steps.length - 1],
  };
}

/**
 * BFS over first-question options at each branching page.
 * For exhaustive capture of Q1 branches + first option thereafter,
 * plus one full first-option path and samples of other Q1 branches.
 */
async function crawlBranches() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('Starting quiz…');
  const start = await startQuiz();
  fs.writeFileSync(path.join(OUT_DIR, '00-start.json'), JSON.stringify(start.data, null, 2));
  console.log('Start OK:', start.data?.quiz_response_id, summarizeState(start.data?.state)?.title);

  const q1 = summarizeState(start.data.state);
  const q1Options = q1.questions[0]?.options || [];
  console.log(`Q1 has ${q1Options.length} options`);

  const results = {
    quiz_id: QUIZ_ID,
    bot_id: BOT_ID,
    q1_options: q1Options,
    paths: [],
  };

  // For each Q1 option, walk rest choosing index 0 always
  for (let i = 0; i < q1Options.length; i++) {
    console.log(`\n=== Path Q1 option ${i}: ${q1Options[i].text} ===`);
    const pathResult = await walkPath([i]); // first choice index for depth0 page
    // walkPath uses optionIndexes[depth-1] — depth1 is first page so index 0 maps to Q1 pick
    // Fix: pass array where first element is Q1 option index
    results.paths.push({
      q1: q1Options[i].text,
      ...pathResult,
    });
    fs.writeFileSync(
      path.join(OUT_DIR, `path-q1-${i}.json`),
      JSON.stringify(pathResult, null, 2)
    );
    console.log(
      '  steps:',
      pathResult.steps?.map((s) => `${s.state_type}:${s.title || s.internal_name || '?'}`).join(' > ')
    );
    console.log('  final type:', pathResult.final?.state_type, pathResult.final?.results_page_type, pathResult.final?.redirect_url);
    console.log('  products:', pathResult.final?.products?.length || 0);
  }

  // Also capture Q2 variants fully by picking each Q2 option once (Q1=0 dry)
  console.log('\n=== Exploring Q2 options under dry ===');
  for (let j = 0; j < 3; j++) {
    const pathResult = await walkPath([0, j]); // Q1 first, Q2 j-th
    results.paths.push({ tag: `dry-q2-${j}`, ...pathResult });
    fs.writeFileSync(path.join(OUT_DIR, `path-dry-q2-${j}.json`), JSON.stringify(pathResult, null, 2));
    console.log(`  Q2[${j}] steps:`, pathResult.steps?.length, 'final:', pathResult.final?.state_type, pathResult.final?.redirect_url || pathResult.final?.title);
  }

  // Explore each Q1's Q2 option 0 and 1 briefly for tree coverage of unique pages
  const uniquePages = new Map();
  for (const p of results.paths) {
    for (const step of p.steps || []) {
      if (!step?.question_page_id && !step?.title) continue;
      const key = step.question_page_id || step.title;
      if (!uniquePages.has(key)) uniquePages.set(key, step);
    }
  }

  const tree = {
    unique_pages: [...uniquePages.values()],
    finals: results.paths.map((p) => ({
      q1: p.q1 || p.tag,
      labels: p.pathLabels,
      final: p.final,
    })),
  };

  fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(tree, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'all-paths.json'), JSON.stringify(results, null, 2));
  console.log(`\nSaved to ${OUT_DIR}`);
  console.log('Unique pages:', uniquePages.size);
  return tree;
}

crawlBranches().catch((err) => {
  console.error(err);
  process.exit(1);
});
