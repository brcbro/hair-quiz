const fs = require('fs');
const s = fs.readFileSync('octane-quiz.js', 'utf8');

const markers = [
  'question_type==="email"',
  'question_type==="email"',
  '"email"===',
  'email){',
  'submitQuestionPage',
  'marketing_consent',
  'Expected',
  'validateEmail',
  'type:"email"',
];

for (const marker of ['"email"', 'marketing_consent', 'consent', 'submit_optin', 'value:e', 'question_type']) {
  // skip
}

// Find email validation / answer packing
let idx = 0, c = 0;
while ((idx = s.indexOf('email', idx)) !== -1 && c < 30) {
  const slice = s.slice(Math.max(0, idx - 80), idx + 120);
  if (/answer|submit|value|valid|consent|question_type/.test(slice)) {
    console.log(`\n@${idx}: ${slice.replace(/\s+/g, ' ')}`);
    c++;
  }
  idx += 5;
}

console.log('\n\n==== getValidationFunctionForQuestion ====');
idx = s.indexOf('getValidationFunctionForQuestion');
console.log(s.slice(idx, idx + 1500));
