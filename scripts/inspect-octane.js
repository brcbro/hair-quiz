const fs = require('fs');
const s = fs.readFileSync('octane-quiz.js', 'utf8');

const found = new Set();
for (const m of s.matchAll(/["'`](\/_quiz_\/[^"'`]+)["'`]/g)) found.add(m[1]);
for (const m of s.matchAll(/["'`](https?:\/\/app\.octaneai\.com[^"'`]+)["'`]/g)) found.add(m[1]);
for (const m of s.matchAll(/_quiz_\/[a-zA-Z0-9_\-\/]+/g)) found.add(m[0]);

console.log('ENDPOINTS:');
[...found].sort().forEach((x) => console.log(x));

const markers = ['_quiz_/start', '_quiz_/answer', 'quiz_response_id', 'submitAnswer', 'answer_ids'];
for (const marker of markers) {
  const idx = s.indexOf(marker);
  console.log('\n====', marker, 'idx=', idx, '====');
  if (idx >= 0) console.log(s.slice(Math.max(0, idx - 250), idx + 500));
}
