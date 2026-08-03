const fs = require('fs');
const html = fs.readFileSync('captured/results-html-q1-0.html', 'utf8');
const docs = [...html.matchAll(/<!DOCTYPE html>[\s\S]*?<\/html>/gi)].map((m) => m[0]);
docs.forEach((d, i) => {
  console.log({
    i,
    len: d.length,
    profile: d.includes('id="section-profile"'),
    products: d.includes('id="section-products"'),
    routine: d.includes('id="section-routine"'),
    start: d.slice(0, 60).replace(/\n/g, ' '),
  });
});

fs.mkdirSync('public', { recursive: true });
const profile = docs.find((d) => d.includes('id="section-profile"') && !d.includes('id="section-products"'));
const products = docs.find((d) => d.includes('id="section-products"'));
console.log('found', !!profile, !!products);
if (profile) fs.writeFileSync('public/results-profile.html', profile);
if (products) fs.writeFileSync('public/results-products.html', products);
