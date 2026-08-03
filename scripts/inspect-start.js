const fs = require('fs');
const s = fs.readFileSync('octane-quiz.js', 'utf8');

// Find start() payload construction
const idx = s.indexOf('start(){');
console.log(s.slice(idx, idx + 1200));

console.log('\n\n==== submit (single) payload nearby ====');
const idx2 = s.indexOf('octaneDomain+"/_quiz_/submit"');
console.log(s.slice(idx2 - 900, idx2 + 200));

console.log('\n\n==== results_page / redirect ====');
for (const m of ['results_page_type', 'redirect_url', 'state_type:"results', 'state_type==="results', 'Building your']) {
  let i = 0, c = 0;
  while ((i = s.indexOf(m, i)) !== -1 && c < 2) {
    console.log(`\n-- ${m} @${i} --`);
    console.log(s.slice(Math.max(0, i - 100), i + 350));
    i += m.length; c++;
  }
}
