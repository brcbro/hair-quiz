const fs = require('fs');
const html = fs.readFileSync('captured/results-html-q1-0.html', 'utf8');
const parts = html.split(/<!-- PART -->/);
console.log('parts', parts.length, parts.map((p) => p.length));

parts.forEach((p, i) => {
  const sections = [...p.matchAll(/id="(section-[^"]+)"/g)].map((m) => m[1]);
  console.log(i, {
    len: p.length,
    sections,
    doctypes: (p.match(/<!DOCTYPE/gi) || []).length,
    hasApply: p.includes('applyAnswers'),
  });
});

let best = parts[0] || '';
for (const p of parts) if (p.length > best.length) best = p;

const docs = [...best.matchAll(/<!DOCTYPE html>[\s\S]*?<\/html>/gi)].map((m) => m[0]);
console.log('docs in best part', docs.length, docs.map((d) => d.length));

// Prefer doc that includes products section
const chosen =
  docs.find((d) => d.includes('section-products') && d.includes('section-profile')) ||
  docs.sort((a, b) => b.length - a.length)[0] ||
  best;

fs.writeFileSync('captured/results-template.html', chosen);
console.log('wrote', chosen.length);
console.log(
  'nav',
  [...chosen.matchAll(/lll-nav-title">([^<]+)/g)].map((m) => m[1])
);
console.log('has applyAnswers', chosen.includes('applyAnswers'));
