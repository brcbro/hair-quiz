import fs from 'fs';

const BG_CREAM = '#F1EFE8';
const BG_WHITE = '#FFFFFF';

const profile = fs.readFileSync('public/results-profile.html', 'utf8');
const products = fs.readFileSync('public/results-products.html', 'utf8');

function extract(html) {
  const style = [...html.matchAll(/<style>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
  let body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || '';
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  body = body.replace(/<script[\s\S]*?<\/script>/gi, '');
  return { style, body: body.trim(), scripts };
}

function cleanStyle(css) {
  return css
    .replace(/(?<![-\w])body\s*\{[\s\S]*?\}/g, '')
    .replace(/^\s*\*\s*\{[^}]*\}\s*/m, '');
}

const p = extract(profile);
const r = extract(products);

let productsBody = r.body
  .replace(/<nav[\s\S]*?<\/nav>/i, '')
  .replace(/<!--\s*STICKY NAV\s*-->/gi, '')
  .trim();

/*
  Live site keeps profile + products in SEPARATE documents.
  When merged, products' `.lll-section-divider { background: white }`
  incorrectly paints Section 1. Fix by:
  1. Stripping that conflicting rule from products CSS
  2. Re-adding it scoped to products/routine only
  3. Keeping profile divider cream/transparent
*/
let productsCss = cleanStyle(r.style)
  // remove the unscoped white divider rule from products CSS
  .replace(/\.lll-section-divider\s*\{[^}]*\}/g, '/* divider moved to scoped rules */');

let profileCss = cleanStyle(p.style)
  // remove unscoped divider so our explicit rules win
  .replace(/\.lll-section-divider\s*\{[^}]*\}/g, '/* divider moved to scoped rules */');

const merged = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Your Personalized Product List | Live Love Locks</title>
<style>
/* Match live Octane fullscreen: white chrome, cream results column */
html, body {
  margin: 0;
  padding: 0;
  background: ${BG_WHITE};
  min-height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  color: #2C2C2A;
  -webkit-font-smoothing: antialiased;
}

.lll-page {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  background: ${BG_CREAM};
  min-height: 100vh;
  position: relative;
}

.lll-page *,
.lll-page *::before,
.lll-page *::after {
  box-sizing: border-box;
}

/* —— Profile styles (from live results HTML) —— */
${profileCss}

/* —— Products + Routine styles —— */
${productsCss}

/* —— Section backgrounds (exact live colors) —— */
#section-profile,
#section-products,
#section-routine {
  background-color: ${BG_CREAM};
}

/* Profile header sits on cream — NO white block (live profile iframe) */
#section-profile .lll-section-divider {
  background: transparent;
  border-top: none;
  padding: 16px 16px 18px;
  margin-top: 0;
}
#section-profile .lll-section-step {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #C69352;
  margin-bottom: 4px;
}
#section-profile .lll-section-title {
  font-size: 26px;
  font-weight: 600;
  color: #2C2C2A;
  line-height: 1.2;
}
#section-profile .lll-section-diagnosis {
  font-size: 22px;
  font-weight: 400;
  color: #2C2C2A;
  line-height: 1.3;
  margin-top: 2px;
}

/* Products/Routine headers — white bar + gold top rule (live products iframe) */
#section-products .lll-section-divider,
#section-routine .lll-section-divider {
  background: ${BG_WHITE};
  border-top: 3px solid #C69352;
  padding: 20px 16px 18px;
  margin-top: 0;
}

/* Sticky nav */
.lll-nav {
  position: fixed !important;
  top: 0 !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  width: 100% !important;
  max-width: 680px !important;
  z-index: 99999 !important;
  background: rgba(255,255,255,0.97) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 0.5px solid #D3D1C7;
  padding: 0 16px;
  display: flex;
  align-items: stretch;
}

.lll-retake {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100000;
  padding: 12px 18px;
  background: #fff;
  color: #C69352;
  border: 2px solid #C69352;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.lll-retake:hover {
  background: #C69352;
  color: #fff;
}

@media (max-width: 720px) {
  /* On mobile the live quiz is edge-to-edge cream */
  html, body { background: ${BG_CREAM}; }
  .lll-page { max-width: none; }
  .lll-retake { left: 16px; right: 16px; bottom: 16px; }
}
</style>
</head>
<body>
<div class="lll-page">
${p.body}

${productsBody}
</div>
<button type="button" class="lll-retake" id="retake-btn">Retake Quiz</button>
<script>
${p.scripts.join('\n\n')}
</script>
<script>
${r.scripts.join('\n\n')}
</script>
<script>
(function () {
  var btn = document.getElementById('retake-btn');
  if (btn) {
    btn.addEventListener('click', function () {
      try { localStorage.removeItem('octane_answers'); } catch (e) {}
      window.location.href = '/';
    });
  }

  try {
    var params = new URLSearchParams(window.location.search);
    if (params.get('preview') === '1' && !localStorage.getItem('octane_answers')) {
      localStorage.setItem('octane_answers', JSON.stringify({
        'Octane: Personalized Product Quiz Full Onboarding': 'Results',
        hair_pain_point: 'dry',
        pain_severity: 'Mild',
        damage_level: 'None',
        hair_air_dry: 'in_between',
        hair_pattern: 'Wavy',
        hair_wash_frequency: '3_4_days',
        heat_tools: 'iron',
        wants_volume: 'Moderate',
        smart_properties_outputs: { hair_type: 'Medium' },
        email: 'preview@example.com'
      }));
      window.location.reload();
      return;
    }
    if (!localStorage.getItem('octane_answers')) {
      window.location.replace('/');
    }
  } catch (e) {}
})();
</script>
</body>
</html>
`;

fs.writeFileSync('public/results.html', merged);
console.log('rewrote', merged.length);

// checks
const unscopedWhite = /\.lll-section-divider\s*\{[^}]*background:\s*white/i.test(
  merged.replace(/#section-products[\s\S]*?#section-routine[\s\S]*?\{[\s\S]*?\}/g, '')
);
console.log('profile divider transparent?', merged.includes('#section-profile .lll-section-divider'));
console.log('products divider white scoped?', merged.includes('#section-products .lll-section-divider'));
console.log('outer white chrome?', merged.includes(`background: ${BG_WHITE}`));
console.log('column cream?', merged.includes(`background: ${BG_CREAM}`));
