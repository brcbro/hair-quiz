const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'captured');

for (let i = 0; i < 6; i++) {
  const raw = JSON.parse(fs.readFileSync(path.join(OUT, `complete-raw-q1-${i}.json`), 'utf8'));
  const blocks = raw.info?.product_blocks || [];
  const htmlParts = [];

  const walk = (node) => {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (typeof node === 'object') {
      if (node.html_data) htmlParts.push(node.html_data);
      if (node.content_type === 'html' && node.html) htmlParts.push(node.html);
      Object.values(node).forEach(walk);
    }
  };
  walk(blocks);
  walk(raw.headless_results_page);

  const html = htmlParts.join('\n\n<!-- PART -->\n\n');
  fs.writeFileSync(path.join(OUT, `results-html-q1-${i}.html`), html);
  console.log(`q1-${i}: html parts=${htmlParts.length}, bytes=${html.length}, answers=`, raw.headless_results_page?.answers);
  console.log('  titles sample:', html.match(/lll-section-title[^<]*<[^>]*>([^<]+)/)?.[1] || html.match(/Your [^<]{5,60}/)?.[0]);
}
