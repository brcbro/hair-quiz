const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('captured/results-html-q1-0.html', 'utf8');
const docs = [...html.matchAll(/<!DOCTYPE html>[\s\S]*?<\/html>/gi)].map((m) => m[0]);
console.log('docs', docs.length, docs.map((d) => d.length));

const profile = docs.find((p) => p.includes('section-profile') && !p.includes('section-products'));
const products = docs.find((p) => p.includes('section-products'));

if (!profile || !products) {
  console.error('missing parts', { profile: !!profile, products: !!products });
  process.exit(1);
}

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/results-profile.html', profile);
fs.writeFileSync('public/results-products.html', products);
console.log('wrote profile', profile.length, 'products', products.length);

const samples = JSON.parse(fs.readFileSync('captured/answer-mapping-samples.json', 'utf8'));
const branches = [];
for (let i = 0; i < 6; i++) {
  const raw = JSON.parse(fs.readFileSync(`captured/complete-raw-q1-${i}.json`, 'utf8'));
  branches.push({ q1_index: i, answers: raw.headless_results_page.answers });
}

const tree = {};
for (const file of fs.readdirSync('captured').filter((f) => f.startsWith('path-q1-') || f.startsWith('final-q1-'))) {
  const p = JSON.parse(fs.readFileSync(path.join('captured', file), 'utf8'));
  for (const s of p.steps || []) {
    if (!s.question_page_id || !s.questions) continue;
    tree[s.question_page_id] = {
      question_page_id: s.question_page_id,
      internal_name: s.internal_name,
      title: s.title,
      continue_button_text: s.continue_button_text,
      progress: s.progress,
      questions: s.questions,
    };
  }
}

// Also from complete steps (less detail)
for (let i = 0; i < 6; i++) {
  const p = JSON.parse(fs.readFileSync(`captured/complete-q1-${i}.json`, 'utf8'));
  for (const s of p.steps || []) {
    if (!s.question_page_id) continue;
    if (!tree[s.question_page_id]) {
      tree[s.question_page_id] = {
        question_page_id: s.question_page_id,
        internal_name: s.internal_name,
        title: s.title,
        progress: s.progress,
        options: s.options,
        question_types: s.question_types,
      };
    }
  }
}

fs.writeFileSync(
  'captured/quiz-canonical.json',
  JSON.stringify({ pages: Object.values(tree), samples, branches }, null, 2)
);
console.log('pages', Object.values(tree).map((p) => p.internal_name).join(' | '));
samples.forEach((s) => {
  const a = s.answers || {};
  console.log(
    s.name,
    a.smart_properties_outputs,
    a.hair_pain_point,
    a.hair_air_dry,
    a.hair_pattern,
    a.pain_severity,
    a.damage_level,
    a.wants_volume,
    a.heat_tools
  );
});
