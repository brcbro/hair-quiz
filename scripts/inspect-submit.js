const fs = require('fs');
const s = fs.readFileSync('octane-quiz.js', 'utf8');

const markers = [
  '_quiz_/submit',
  '_quiz_/submit_page',
  '_quiz_/submit_optin',
  '_quiz_/shared',
  'octaneDomain',
  'question_id',
  'option_id',
  'answers:',
  'submitPage',
  'submitQuiz',
];

for (const marker of markers) {
  let idx = 0;
  let count = 0;
  while ((idx = s.indexOf(marker, idx)) !== -1 && count < 3) {
    console.log(`\n==== ${marker} #${count} @ ${idx} ====`);
    console.log(s.slice(Math.max(0, idx - 180), idx + 650));
    idx += marker.length;
    count++;
  }
}
