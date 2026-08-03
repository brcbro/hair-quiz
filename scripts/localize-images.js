/**
 * Download all remote product/routine images from results.html into
 * public/images/products/ and rewrite URLs to local paths.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RESULTS = path.join(ROOT, 'public', 'results.html');
const OUT_DIR = path.join(ROOT, 'public', 'images', 'products');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');

fs.mkdirSync(OUT_DIR, { recursive: true });

function extFromUrl(url, contentType) {
  const clean = url.split('?')[0];
  const m = clean.match(/\.(jpe?g|png|webp|gif|svg)$/i);
  if (m) return '.' + m[1].toLowerCase().replace('jpeg', 'jpg');
  if (contentType?.includes('png')) return '.png';
  if (contentType?.includes('webp')) return '.webp';
  if (contentType?.includes('gif')) return '.gif';
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return '.jpg';
  // Ulta CDN often serves jpeg without extension
  return '.jpg';
}

function slugFromUrl(url) {
  const clean = decodeURIComponent(url.split('?')[0]);
  const base = path.basename(clean).replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  if (base && base !== '-' && /\.[a-z0-9]+$/i.test(base)) {
    return base.replace(/\.jpeg$/i, '.jpg');
  }
  const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 10);
  if (/ulta\.com\/i\/ulta\/(\d+)/.test(url)) {
    return `ulta-${RegExp.$1}`;
  }
  return `img-${hash}`;
}

async function download(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get('content-type') || '';
  return { buf, contentType: ct };
}

async function main() {
  let html = fs.readFileSync(RESULTS, 'utf8');
  const urls = [...new Set(html.match(/https:\/\/[^"'<\s)]+/g) || [])].filter((u) => {
    // keep image-like URLs (incl. Ulta without extension)
    return (
      /\.(jpe?g|png|webp|gif|svg)(\?|$)/i.test(u) ||
      /media\.ulta\.com/i.test(u) ||
      /\/cdn\/shop\//i.test(u) ||
      /demandware\.static/i.test(u)
    );
  });

  console.log(`Found ${urls.length} unique remote image URLs`);
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const urlToLocal = {};

  for (const url of urls) {
    if (manifest[url] && fs.existsSync(path.join(ROOT, 'public', manifest[url].replace(/^\//, '')))) {
      urlToLocal[url] = manifest[url];
      console.log('cached', manifest[url]);
      continue;
    }

    const slug = slugFromUrl(url);
    console.log('download', url.slice(0, 90) + (url.length > 90 ? '…' : ''));
    try {
      const { buf, contentType } = await download(url);
      let filename = slug;
      if (!/\.(jpe?g|png|webp|gif|svg)$/i.test(filename)) {
        filename += extFromUrl(url, contentType);
      } else {
        filename = filename.replace(/\.jpeg$/i, '.jpg');
      }
      const dest = path.join(OUT_DIR, filename);
      fs.writeFileSync(dest, buf);
      const local = `/images/products/${filename}`;
      urlToLocal[url] = local;
      manifest[url] = local;
      console.log(`  -> ${local} (${buf.length} bytes)`);
    } catch (e) {
      console.error('  FAIL', e.message);
    }
  }

  // Replace longest URLs first to avoid partial collisions
  const ordered = Object.keys(urlToLocal).sort((a, b) => b.length - a.length);
  for (const url of ordered) {
    html = html.split(url).join(urlToLocal[url]);
  }

  fs.writeFileSync(RESULTS, html);
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

  const remaining = (html.match(/https:\/\/[^"'<\s)]+/g) || []).filter(
    (u) =>
      /\.(jpe?g|png|webp|gif|svg)(\?|$)/i.test(u) ||
      /media\.ulta\.com/i.test(u) ||
      /\/cdn\/shop\//i.test(u)
  );
  console.log('\nDone. Remaining remote image URLs in results.html:', remaining.length);
  if (remaining.length) remaining.forEach((u) => console.log(' ', u));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
