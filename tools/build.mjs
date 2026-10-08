// Élményfotózás weboldal 2 (Posztó) build. Node, függőség nélkül.
// Futtatás a "weboldal 2" mappából:  node tools/build.mjs
// src/<oldal>.html -> <oldal>.html a gyökérben, közös fejjel, menüvel, lábléccel.
// A forrás első sora meta JSON: <!--{"title":"...","desc":"...","nav":"pixie","body":"p-pixie","og":"kulcs","ld":{...}}-->
// Kép: <img data-k="kulcs" alt="..." [sizes="..."] [data-lcp] [data-dup]> -> src, srcset, width, height, loading.
// Ikon: {{i:arrow-right}}. Egy kép egy hely: a build hibával leáll, ha egy kulcs kétszer szerepel (kivétel: data-dup).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'media', 'kepek.json'), 'utf8'));
const V = '6';
const SITE = 'https://elmenyfotozas.hu';

const ICON = {};
for (const f of fs.readdirSync(path.join(ROOT, 'tools', 'ikonok'))) {
  ICON[f.replace('.svg', '')] = fs.readFileSync(path.join(ROOT, 'tools', 'ikonok', f), 'utf8').trim()
    .replace('<svg ', '<svg aria-hidden="true" focusable="false" ');
}

const NAV = [
  ['pixie', 'pixie.html', 'Pixie'],
  ['ai', 'ai-selfie.html', 'AI Selfie'],
  ['box', 'selfiebox.html', 'Selfiebox'],
  ['foto', 'rendezvenyfotozas.html', 'Fotós'],
  ['hatter', 'hatterek.html', 'Hátterek'],
  ['tudni', 'tudnivalok.html', 'Tudnivalók'],
];
const TEL1 = ['+36203192116', '+36 20 319 21 16'];
const TEL2 = ['+36703700030', '+36 70 370 00 30'];
const MAIL = 'hello@elmenyfotozas.hu';

function head(m, file) {
  const clean = file === 'index.html' ? '/' : '/' + file.replace('.html', '');
  const og = m.og && meta[m.og] ? meta[m.og].out[0][0] : 'h-kalap-1200.webp';
  return `<!DOCTYPE html>
<html lang="hu">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>(function(d,s){try{var q=location.search;if(/motion=1/.test(q))s.setItem('motion','1');if(/motion=0/.test(q))s.removeItem('motion');if(s.getItem('motion')==='1')d.classList.add('motion-on')}catch(e){}d.classList.add('js')})(document.documentElement,window.sessionStorage)</script>
<title>${m.title}</title>
<meta name="description" content="${m.desc}">
${m.noindex ? '<meta name="robots" content="noindex">\n' : ''}<link rel="canonical" href="${SITE}${clean}">
<meta property="og:type" content="website">
<meta property="og:locale" content="hu_HU">
<meta property="og:site_name" content="Élményfotózás">
<meta property="og:title" content="${m.title}">
<meta property="og:description" content="${m.desc}">
<meta property="og:url" content="${SITE}${clean}">
<meta property="og:image" content="${SITE}/media/${og}">
<meta name="theme-color" content="#0F3A2E">
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="favicon-48.png" sizes="48x48">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="stylesheet" href="fonts/fonts.css?v=${V}">
<link rel="stylesheet" href="js/vendor/lenis.css">
<link rel="stylesheet" href="css/main.css?v=${V}">
${m.ld ? `<script type="application/ld+json">${JSON.stringify(m.ld)}</script>\n` : ''}</head>
<body class="${m.body || ''}">
<a class="skip" href="#tartalom">Ugrás a tartalomra</a>`;
}

function nav(m) {
  const li = NAV.map(([k, h, t]) => `<li><a href="${h}"${m.nav === k ? ' aria-current="page"' : ''}>${t}</a></li>`).join('');
  const mli = [['home', 'index.html', 'Főoldal'], ...NAV, ['aj', 'ajanlatkeres.html', 'Ajánlatkérés']]
    .map(([k, h, t]) => `<li><a href="${h}"${m.nav === k ? ' aria-current="page"' : ''}>${t}</a></li>`).join('');
  return `
<header class="top" data-top>
  <a class="top__brand" translate="no" href="index.html"${m.nav === 'home' ? ' aria-current="page"' : ''}>Élményfotózás<small>Pixie · AI Selfie · Selfiebox · fotós</small></a>
  <nav class="top__nav" aria-label="Fő navigáció"><ul>${li}<li><a class="top__quote" href="ajanlatkeres.html"${m.nav === 'aj' ? ' aria-current="page"' : ''}>Ajánlatkérés</a></li></ul></nav>
  <button class="top__menu" type="button" aria-expanded="false" aria-controls="menu">Menü</button>
</header>
<div class="menu" id="menu" hidden>
  <nav aria-label="Mobil navigáció"><ul>${mli}</ul></nav>
  <p class="menu__tel"><a href="tel:${TEL1[0]}">${TEL1[1]}</a><a href="tel:${TEL2[0]}">${TEL2[1]}</a></p>
</div>`;
}

const FOOT = `
<footer class="foot">
  <div class="foot__grid">
    <div class="foot__call">
      <p class="foot__lead">A vendégeid emlékezni fognak rá. Hívj, és megmutatjuk, hogyan</p>
      <a class="foot__tel" href="tel:${TEL1[0]}">${TEL1[1]}</a>
      <a class="foot__tel" href="tel:${TEL2[0]}">${TEL2[1]}</a>
      <a class="foot__mail" href="mailto:${MAIL}">${MAIL}</a>
    </div>
    <nav class="foot__col" aria-label="Szolgáltatások">
      <h2>Eszközök</h2>
      <ul>
        <li><a href="pixie.html">Pixie, a selfierobot</a></li>
        <li><a href="ai-selfie.html">AI Selfie</a></li>
        <li><a href="selfiebox.html">Selfiebox</a></li>
        <li><a href="rendezvenyfotozas.html">Rendezvényfotózás</a></li>
      </ul>
    </nav>
    <nav class="foot__col" aria-label="Tervezéshez">
      <h2>Tervezéshez</h2>
      <ul>
        <li><a href="hatterek.html">Hátterek</a></li>
        <li><a href="tudnivalok.html">Technikai tudnivalók</a></li>
        <li><a href="ajanlatkeres.html">Ajánlatkérés</a></li>
        <li><a href="adatkezeles.html">Adatkezelési tájékoztató</a></li>
      </ul>
    </nav>
    <div class="foot__col">
      <h2>Kövess minket</h2>
      <ul class="foot__social">
        <li><a href="https://www.facebook.com/elmenyfotozas" target="_blank" rel="noopener">{{i:facebook-logo}}Facebook</a></li>
        <li><a href="https://www.instagram.com/elmenyfotozashu/" target="_blank" rel="noopener">{{i:instagram-logo}}Instagram</a></li>
        <li><a href="https://www.youtube.com/@elmenyfotozas" target="_blank" rel="noopener">{{i:youtube-logo}}YouTube</a></li>
      </ul>
    </div>
  </div>
  <p class="foot__word" aria-hidden="true" translate="no">Élményfotózás</p>
  <p class="foot__legal">Megapixel Design Kft. · 1172 Budapest, Hártya utca 16/A/2 · Országos kiszállás</p>
</footer>`;

const SCRIPTS = `
<script src="js/vendor/gsap.min.js" defer></script>
<script src="js/vendor/ScrollTrigger.min.js" defer></script>
<script src="js/vendor/lenis.min.js" defer></script>
<script src="js/site.js?v=${V}" defer></script>
</body>
</html>
`;

const used = new Map();
function expandImg(html, file) {
  return html.replace(/<img data-k="([^"]+)"([^>]*)>/g, (all, key, rest) => {
    const k = meta[key];
    if (!k) throw new Error(`${file}: ismeretlen kép-kulcs: ${key}`);
    if (!/data-dup/.test(rest)) {
      if (used.has(key)) throw new Error(`${file}: a(z) ${key} kép már szerepel itt: ${used.get(key)}`);
      used.set(key, file);
    }
    if (!/\salt="/.test(rest)) throw new Error(`${file}: ${key} alt nélkül`);
    const outs = k.out, big = outs[0], small = outs[outs.length - 1];
    const lcp = /data-lcp/.test(rest);
    const attrs = rest.replace(/\sdata-lcp/, '').replace(/\sdata-dup/, '');
    const srcset = outs.length > 1 ? ` srcset="${outs.map(o => `media/${o[0]} ${o[1]}w`).join(', ')}"` : '';
    const sizes = outs.length > 1 && !/sizes=/.test(attrs) ? ' sizes="(max-width: 860px) 100vw, 50vw"' : '';
    const load = lcp ? ' fetchpriority="high" decoding="async"' : (/loading=/.test(attrs) ? '' : ' loading="lazy" decoding="async"');
    const src = lcp || outs.length === 1 ? big : small;
    return `<img src="media/${src[0]}"${srcset}${sizes} width="${big[1]}" height="${big[2]}"${attrs}${load}>`;
  });
}

const pages = fs.readdirSync(SRC).filter(f => f.endsWith('.html'));
const sitemap = [];
for (const f of pages) {
  const raw = fs.readFileSync(path.join(SRC, f), 'utf8');
  const mm = raw.match(/^<!--(\{[\s\S]*?\})-->\s*/);
  if (!mm) throw new Error(`${f}: hiányzik a meta-sor`);
  const m = JSON.parse(mm[1]);
  const body = expandImg(raw.slice(mm[0].length), f);
  let out = head(m, f) + nav(m) + `\n<main id="tartalom">\n` + body + `\n</main>` + (m.nofoot ? '' : FOOT) + SCRIPTS;
  out = out.replace(/\{\{i:([a-z-]+)\}\}/g, (a, n) => { if (!ICON[n]) throw new Error(`ikon: ${n}`); return ICON[n]; });
  out = out.replace(/\{\{tel1\}\}/g, `<a href="tel:${TEL1[0]}">${TEL1[1]}</a>`).replace(/\{\{tel2\}\}/g, `<a href="tel:${TEL2[0]}">${TEL2[1]}</a>`);
  fs.writeFileSync(path.join(ROOT, f), out.replace(/\r\n/g, '\n'));
  if (!m.noindex) sitemap.push(f === 'index.html' ? '/' : '/' + f.replace('.html', ''));
}
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map(u => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
const unused = Object.keys(meta).filter(k => !used.has(k));
console.log(`${pages.length} oldal kész. Felhasznált kép: ${used.size}/${Object.keys(meta).length}. Nem használt: ${unused.join(', ') || 'nincs'}`);
