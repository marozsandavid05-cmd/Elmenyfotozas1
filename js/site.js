/* Élményfotózás · weboldal 2 · Posztó · site.js
   Robusztusság: minden tartalom a CSS-ben látható. A JS csak a hajtás alatti elemeket rejti el
   a belépőhöz, a GSAP csak degradálható extra (a nyomatok ledobása, a lapok kiosztása).
   Mozgás nélkül (prefers-reduced-motion) minden kész, álló állapotban van; ?motion=1 felülírja. */
(function () {
  'use strict';
  var D = document, H = D.documentElement;
  var $ = function (s, c) { return (c || D).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); };
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches && !H.classList.contains('motion-on');
  var FINE = matchMedia('(pointer: fine)').matches;
  var lenis = null;

  /* ---------- Lenis: saját rAF, CSS-szabályok a lenis.css-ben ---------- */
  function startLenis() {
    if (REDUCE || !window.Lenis) return;
    try {
      lenis = new Lenis({ smoothWheel: true, syncTouch: false });
      window.__lenis = lenis;
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
      if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);
    } catch (e) { lenis = null; }
  }

  /* ---------- fejléc: tömör háttér görgetésre, elrejtés lefelé (hiszterézissel) ---------- */
  function initTop() {
    var top = $('[data-top]'); if (!top) return;
    var last = scrollY, acc = 0;
    function on() {
      var y = scrollY, d = y - last; last = y;
      top.classList.toggle('is-solid', y > 40);
      if (D.body.classList.contains('menu-open')) return;
      acc = (d > 0) === (acc > 0) ? acc + d : d;
      if (y < 120 || acc < -24) top.classList.remove('is-hidden');
      else if (acc > 60 && !top.contains(D.activeElement)) top.classList.add('is-hidden');
      D.documentElement.style.setProperty('--top-off', top.classList.contains('is-hidden') ? '0px' : top.offsetHeight + 'px');
    }
    addEventListener('scroll', on, { passive: true }); on();
    top.addEventListener('focusin', function () { top.classList.remove('is-hidden'); on(); });
    addEventListener('resize', on);
  }

  /* ---------- mobil menü ---------- */
  function initMenu() {
    var b = $('.top__menu'), m = $('#menu'); if (!b || !m) return;
    function set(open) {
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.textContent = open ? 'Bezár' : 'Menü';
      m.hidden = !open;
      D.body.classList.toggle('menu-open', open);
      D.body.style.overflow = open ? 'hidden' : '';
      if (lenis) open ? lenis.stop() : lenis.start();
      if (open) { var a = $('a', m); if (a) a.focus(); } else b.focus();
    }
    b.addEventListener('click', function () { set(m.hidden); });
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !m.hidden) set(false); });
  }

  /* ---------- képek: soha ne maradjon üres keret ----------
     Ha egy kép hibát ad, vagy 3 s után sincs kész (és már kérve van, nem lusta), egyszer újratöltjük
     cache-bust paraméterrel. A lusta képeket csak akkor figyeljük, ha már kérve vannak (eagerTrack). */
  function imgOk(im) { return im.complete && im.naturalWidth > 0; }
  function retryImg(im) {
    if (im.__retried || imgOk(im)) return; im.__retried = true;
    var u = im.currentSrc || im.src; if (!u) return;
    im.removeAttribute('srcset'); im.loading = 'eager';
    im.src = u.split('?')[0] + '?r=1';
  }
  function watchImg(im) {
    if (im.__watched) return; im.__watched = true;
    im.addEventListener('error', function () { retryImg(im); });
    setTimeout(function () { if (!imgOk(im)) retryImg(im); }, 3000);
  }
  function initImages() {
    $$('img').forEach(function (im) {
      if (im.complete && !im.naturalWidth && im.getAttribute('src')) { retryImg(im); return; } // már elbukott
      im.addEventListener('error', function () { retryImg(im); });
      if (im.loading !== 'lazy') watchImg(im);
    });
  }

  /* ---------- belépő: csak a hajtás alatti elemek indulnak rejtve ----------
     Képet tartalmazó elem csak akkor úszik be, ha a képe kész (legfeljebb 1,5 s várakozás),
     így nincs kép nélküli fade. Háttérben (rejtett fülön) nincs úszás, azonnal végállapot. */
  function initReveal() {
    var els = $$('[data-rv]'); if (!els.length || REDUCE || !('IntersectionObserver' in window)) return;
    function show(el) {
      if (D.hidden) { el.classList.remove('rv-hide', 'rv-in'); return; }
      el.classList.add('rv-in'); el.classList.remove('rv-hide');
      setTimeout(function () { el.classList.remove('rv-in'); }, 900);
    }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target; io.unobserve(el);
        var ims = $$('img', el).filter(function (im) { return !imgOk(im); });
        if (!ims.length) { show(el); return; }
        var left = ims.length, done = false;
        function one() { if (--left <= 0 && !done) { done = true; show(el); } }
        ims.forEach(function (im) { if (im.loading === 'lazy') im.loading = 'eager'; watchImg(im); im.addEventListener('load', one, { once: true }); im.addEventListener('error', one, { once: true }); });
        setTimeout(function () { if (!done) { done = true; show(el); } }, 1500);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(function (el) {
      if (el.getBoundingClientRect().top > innerHeight * 0.96) { el.classList.add('rv-hide'); io.observe(el); }
    });
    // háló: ha valami félúton ragadna (háttér-tab), mutatjuk; háttérbe kerüléskor a futó beúszás végállapotba
    function net() {
      $$('.rv-hide').forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.remove('rv-hide'); });
      if (D.hidden) $$('.rv-in').forEach(function (el) { el.classList.remove('rv-in'); });
    }
    addEventListener('scroll', function () { clearTimeout(net.t); net.t = setTimeout(net, 700); }, { passive: true });
    D.addEventListener('visibilitychange', net);
  }

  /* ============================================================
     NYOMAT-ASZTAL (főoldali hero)
     Elrendezés: a jóváhagyott prototípus és David mintája 1:1-ben. A hat nyomat helye a minta
     arányaiból jön (középpont a kép szélességéhez és magasságához mérve, méret a képátló szerint),
     bal fent, bal lent kettő, jobb fent a sarokban, jobb lent kettő, enyhe dőlésekkel.
     Ha egy képméreten a nyomat a címhez, a szöveghez, a gombhoz vagy a tényekhez érne, kisebb lesz,
     majd kifelé csúszik, soha nem kerül a szövegre. Mobilon négy nyomat: kettő a cím fölött, kettő alatta.
     Ledobás: a nyomatok a képernyő fölül esnek le egymás után, enyhe forgással és kis pattanással.
     A pálya előre ellenőrzött: esés közben egyik nyomat sem ér a címhez és a szöveghez.
     Húzás után, ha a nyomat kilóg a képből, rugóval visszajön.
     ============================================================ */
  function initTable() {
    var table = $('#table'); if (!table) return;
    var els = $$('.print', table);
    // RÖGZÍTETT elrendezés David végleges mintájából (prototipusok/DAVID-hero-minta-2.png, 1848×818 kép,
    // 1478×654 CSS px, 1,25-ös nagyítás), a nyomatok csontfehér keretének sarkaiból mérve. Nincs keresés és nincs
    // elrejtés. A képek (David: „AI Selfie is legyen”): 2 Selfiebox, 2 Pixie, 2 AI Selfie, körben váltakozva.
    // [középpont x/W, középpont y/H, szélesség a W arányában, legnagyobb magasság a H arányában, dőlés]
    // 0 bal fent, Selfiebox · 1 jobb fent, Pixie csapatkép · 2 bal középen, AI Selfie (álló)
    // 3 alsó középtől balra, Selfiebox · 4 jobb lent, Pixie lufikkal, álló, rendes méretben · 5 jobb szélen lent, AI Selfie
    var PD = [[.074, .277, .136, .27, -7], [.911, .438, .15, .32, 6], [.079, .689, .15, .33, 5],
              [.278, .743, .119, .25, 3], [.74, .785, .125, .36, -6], [.881, .774, .13, .26, -3]];
    // mobil (390 px), rögzített: a cím fölötti magas sávban a két álló kép (bal: AI Selfie, jobb: Pixie lufikkal),
    // a szöveg alatti alacsony sávban két fekvő Selfiebox. [sáv, oldal, dőlés, szélesség a W arányában]
    var PM = { 2: ['top', 'l', -5, .40], 4: ['top', 'r', 5, .40], 0: ['bot', 'l', 4, .46], 3: ['bot', 'r', -5, .46] };
    var st = els.map(function () { return { x: 0, y: 0, r: 0, vx: 0, vy: 0, w: 0, h: 0, on: false }; });
    var z = 20, dropping = false, dropped = false;
    var MOTION = !REDUCE && !!window.gsap;
    if (MOTION) table.classList.add('is-predrop');

    function rel(el, pad) {
      var t = table.getBoundingClientRect(), r = el.getBoundingClientRect();
      return { l: r.left - t.left - pad, t: r.top - t.top - pad, r: r.right - t.left + pad, b: r.bottom - t.top + pad };
    }
    // a cím sorai szövegdobozként (csak a szövegcsomópontok, nem a blokk-spanok teljes szélessége)
    function lineRects(pad) {
      var h1 = $('.head h1', table), out = []; if (!h1) return out;
      var t = table.getBoundingClientRect(), tw = D.createTreeWalker(h1, NodeFilter.SHOW_TEXT), n;
      var fs = parseFloat(getComputedStyle(h1).fontSize) || 100;
      while ((n = tw.nextNode())) {
        // függőlegesen a sor dobozára vágva: a betű tartalom-doboza (content area) jóval magasabb a látható betűnél
        var blk = n.parentNode; while (blk.parentNode !== h1 && blk !== h1) blk = blk.parentNode;
        var lb = blk.getBoundingClientRect(), rg = D.createRange(); rg.selectNodeContents(n);
        Array.prototype.forEach.call(rg.getClientRects(), function (r) {
          if (r.width < 3) return;
          var top = Math.max(r.top, lb.top - fs * .04), bot = Math.min(r.bottom, lb.bottom + fs * .06);
          if (blk === h1) { top = r.top; bot = r.bottom; }
          out.push({ l: r.left - t.left - pad, t: top - t.top - pad, r: r.right - t.left + pad, b: bot - t.top + pad });
        });
      }
      return out;
    }
    function textObst(pad) {
      return lineRects(pad).concat($$('.head p,.facts .btn,.facts dl,.facts .hint', table)
        .filter(function (e) { return e.offsetParent && e.getBoundingClientRect().width; }).map(function (e) { return rel(e, pad); }));
    }
    function navObst(pad) {
      return $$('.top__brand,.top__nav ul,.top__menu', D)
        .filter(function (e) { return e.offsetParent && e.getBoundingClientRect().width; }).map(function (e) { return rel(e, pad); });
    }
    function hit(a, b) { return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t; }
    function hitAny(a, list) { for (var k = 0; k < list.length; k++) if (hit(a, list[k])) return true; return false; }
    function apply(el, s) { el.style.transform = 'translate3d(' + s.x + 'px,' + s.y + 'px,0) rotate(' + s.r + 'deg)'; }
    // elforgatott nyomat befoglaló doboza a középpont körül
    function rbox(cx, cy, w, h, r) {
      var rad = Math.abs(r) * Math.PI / 180, bw = w * Math.cos(rad) + h * Math.sin(rad), bh = w * Math.sin(rad) + h * Math.cos(rad);
      return { l: cx - bw / 2, t: cy - bh / 2, r: cx + bw / 2, b: cy + bh / 2, bw: bw, bh: bh };
    }
    // mérés a transform érintése nélkül: az offsetHeight nem függ a transformtól, így futó ledobás
    // vagy húzás közben sem ugrik el a látható nyomat
    function sizeOf(el, w) { el.style.setProperty('--w', w + 'px'); return el.offsetHeight; }
    function setHome(i, cx, cy, w, h, r) {
      var s = st[i]; s.w = w; s.h = h; s.r = r; s.x = cx - w / 2; s.y = cy - h / 2; s.on = true; s.home = { x: s.x, y: s.y };
      els[i].style.display = '';
      if (!dropping) apply(els[i], s);
    }
    // egy már elhelyezett nyomat soha nem tűnik el (David: „néha eltűntek és újra előkerültek”):
    // ha az új méreten nincs tiszta helye, marad a legutóbbi helyén és méretén
    function hide(i) { els[i].style.display = 'none'; st[i].on = false; }

    // horgonyzott elhelyezés: a forgatott doboz 'sarok' csúcsa a (ax, ay) pontra kerül;
    // szöveg-érintésnél 4%-onként kisebbedik ugyanazon horgony körül (legfeljebb 14 lépés)
    // elhelyezés a rögzített pont körül. Ha egy ritka nézetarányon a nyomat szöveghez érne: előbb legfeljebb
    // 18%-kal kisebb lesz, és csak ha így sem fér, a rögzített ponttól a legközelebbi szabad helyre csúszik
    // (legfeljebb a hero szélességének 12%-áig, a széleken belül). Determinisztikus: ugyanazon a méreten mindig
    // ugyanaz az eredmény, a nyomat sosem lesz apró és sosem tűnik el.
    function anchored(el, ax, ay, corner, w, hMax, r, obst) {
      var W = table.clientWidth, H2 = table.clientHeight, h = sizeOf(el, w);
      if (h > hMax) { w = w * hMax / h; h = sizeOf(el, w); }
      function inside(cx, cy) { var b = rbox(cx, cy, w, h, r); return { x: cx + Math.max(0, 4 - b.l) - Math.max(0, b.r - (W - 4)), y: cy + Math.max(0, 4 - b.t) - Math.max(0, b.b - (H2 - 4)) }; }
      var w0 = w, c = inside(ax, ay);
      for (var k = 0; k < 6 && hitAny(rbox(c.x, c.y, w, h, r), obst); k++) { w = w0 * (1 - .03 * (k + 1)); h = sizeOf(el, w); c = inside(ax, ay); }
      // szélsőséges nézetarányon (pl. 1920×720) a keresés 82%-ig kisebbítve ismétlődik
      for (var sc = 0; sc < 4 && hitAny(rbox(c.x, c.y, w, h, r), obst); sc++) {
        if (sc) { w = w0 * (.82 - .04 * sc); h = sizeOf(el, w); }
        var best = null, bd = 1e12, R = W * .12, base = inside(ax, ay);
        for (var dy = -R; dy <= R; dy += 8) for (var dx = -R; dx <= R; dx += 8) {
          var d = dx * dx + dy * dy; if (d >= bd) continue;
          var q = inside(base.x + dx, base.y + dy);
          if (!hitAny(rbox(q.x, q.y, w, h, r), obst)) { bd = d; best = q; }
        }
        c = best || inside(ax, ay);
      }
      return { cx: c.x, cy: c.y, w: w, h: h };
    }
    function placeDesktop(W, H2) {
      var obst = textObst(8).concat(navObst(6));
      els.forEach(function (el, i) {
        var p = PD[i]; if (!p) { hide(i); return; }
        el.style.display = '';
        // a méret egysége a minta képarányához kötött (1848/818 = 2,26): keskenyebb képernyőn (1440×900, 1280×720)
        // a nyomat a magassághoz mérve ugyanakkora marad, mint a mintán, így nem nő bele a címbe
        var u = Math.min(W, H2 * 2.26);
        var o = anchored(el, p[0] * W, p[1] * H2, 'cc', p[2] * u, p[3] * H2, p[4], obst);
        setHome(i, o.cx, o.cy, o.w, o.h, p[4]);
      });
    }
    function placeMobile(W, H2) {
      var top = $('.top'), navB = top ? top.getBoundingClientRect().bottom - table.getBoundingClientRect().top : 64;
      var ln = lineRects(0), pEl = $('.head p', table), btn = $('.facts .btn', table);
      var titleT = ln.length ? Math.min.apply(null, ln.map(function (r) { return r.t; })) : H2 * .3;
      var pB = pEl ? rel(pEl, 0).b : H2 * .6, btnT = btn ? rel(btn, 0).t : H2 * .85;
      var band = { top: [navB + 8, titleT - 8], bot: [pB + 10, btnT - 10] };
      els.forEach(function (el, i) {
        var m = PM[i]; if (!m) { hide(i); return; }
        el.style.display = '';
        var y0 = band[m[0]][0], y1 = band[m[0]][1], hh = Math.max(60, y1 - y0);
        // méret egy lépésben: a W-arányos szélesség, ha a forgatott doboz magasabb a sávnál, arányosan kisebb
        var w = W * m[3], h = sizeOf(el, w), b = rbox(0, 0, w, h, m[2]);
        if (b.bh > hh) { w = w * hh / b.bh; h = sizeOf(el, w); b = rbox(0, 0, w, h, m[2]); }
        var cx = m[1] === 'l' ? 10 + b.bw / 2 : W - 10 - b.bw / 2;
        setHome(i, cx, (y0 + y1) / 2, w, h, m[2]);
      });
    }
    function place() {
      var W = table.clientWidth, H2 = table.clientHeight;
      if (W < 821) placeMobile(W, H2); else placeDesktop(W, H2);
      // a nyomatok csak a végleges (betűk és képek utáni) elhelyezés után látszanak: nincs ugrás
    }
    place();
    (D.fonts ? D.fonts.ready : Promise.resolve()).then(function () { if (!dropping) place(); });
    // érintős eszközön újramérés csak SZÉLESSÉG-változásra: a mobil címsor fel-le ugrása csak a magasságot
    // mozgatja, arra nem rendezünk át (a hero 100svh, stabil). Egérrel (asztali ablak) minden átméretezésre.
    var rt, lastW = innerWidth, lastH = innerHeight;
    addEventListener('resize', function () {
      if (innerWidth === lastW && (!FINE || innerHeight === lastH)) return;
      clearTimeout(rt); rt = setTimeout(function () { lastW = innerWidth; lastH = innerHeight; if (!dropping) place(); }, 150);
    });

    /* húzás pointer-fizikával */
    els.forEach(function (el, i) {
      var drag = false, sx = 0, sy = 0, lx = 0, ly = 0, lt = 0;
      el.addEventListener('pointerdown', function (e) {
        if (e.button && e.button !== 0) return;
        if (dropping) finishDrop();
        drag = true; el.setPointerCapture(e.pointerId); el.style.zIndex = ++z; el.classList.add('lift');
        var s = st[i]; s.anim = false;
        sx = e.clientX - s.x; sy = e.clientY - s.y; lx = e.clientX; ly = e.clientY; lt = performance.now(); s.vx = s.vy = 0;
      });
      el.addEventListener('pointermove', function (e) {
        if (!drag) return;
        var s = st[i], t = performance.now(), dt = Math.max(8, t - lt);
        s.vx = (e.clientX - lx) / dt * 16; s.vy = (e.clientY - ly) / dt * 16; lx = e.clientX; ly = e.clientY; lt = t;
        s.x = e.clientX - sx; s.y = e.clientY - sy; s.r += s.vx * .04; s.r = Math.max(-24, Math.min(24, s.r)); apply(el, s);
      });
      function up() { if (!drag) return; drag = false; el.classList.remove('lift'); settle(i); }
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      el.addEventListener('lostpointercapture', up);
    });

    /* elengedés után: tehetetlenség, majd rugó vissza a képen belülre */
    function bounds(i) {
      var s = st[i], el = els[i], W = table.clientWidth, H2 = table.clientHeight;
      var w = el.offsetWidth, h = el.offsetHeight, rad = Math.abs(s.r) * Math.PI / 180;
      var bw = w * Math.cos(rad) + h * Math.sin(rad), bh = w * Math.sin(rad) + h * Math.cos(rad);
      var ox = (bw - w) / 2, oy = (bh - h) / 2, m = 8;
      return { minX: ox + m, maxX: W - w - ox - m, minY: oy + m, maxY: H2 - h - oy - m };
    }
    function settle(i) {
      var s = st[i], el = els[i]; s.anim = true;
      if (REDUCE) { var b0 = bounds(i); s.x = Math.min(b0.maxX, Math.max(b0.minX, s.x)); s.y = Math.min(b0.maxY, Math.max(b0.minY, s.y)); apply(el, s); return; }
      (function f() {
        if (!s.anim) return;
        var b = bounds(i);
        s.vx *= .9; s.vy *= .9;
        // rugó: ha a nyomat kilóg, a kilógás mértékével húz vissza
        var ex = s.x < b.minX ? b.minX - s.x : (s.x > b.maxX ? b.maxX - s.x : 0);
        var ey = s.y < b.minY ? b.minY - s.y : (s.y > b.maxY ? b.maxY - s.y : 0);
        s.vx += ex * .09; s.vy += ey * .09;
        if (ex) s.vx *= .82; if (ey) s.vy *= .82;
        s.x += s.vx; s.y += s.vy; s.r += s.vx * .03; s.r = Math.max(-24, Math.min(24, s.r));
        apply(el, s);
        if (Math.abs(s.vx) + Math.abs(s.vy) > .08 || Math.abs(ex) + Math.abs(ey) > .5) requestAnimationFrame(f);
        else { s.x += ex; s.y += ey; apply(el, s); s.anim = false; }
      })();
    }

    /* ledobás (David: „ne durván essenek le”, „ne össze-vissza”): rövid, puha, rendezett.
       Minden nyomat a végső helye fölött 120-170 px-ről ereszkedik le (nem a képernyő tetejéről),
       puha lassulással (power3.out), közben beúszik (0 -> 1), a dőlése 5 fokról simul a helyére,
       a végén egyetlen apró rezdüléssel. Sorrend rögzített, a DOM szerint: bal fent, jobb fent,
       bal lent, bal lent 2, jobb lent, jobb lent 2; egyenletes 0,15 s-os lépcső, minden betöltéskor ugyanúgy.
       A cím és a szöveg a nyomatok FÖLÖTT van (z-index), így esés közben sem takarhatják.
       Indulás csak akkor, ha a hero minden képe betöltött és dekódolt: kép nélküli fehér keret nem látszik. */
    /* Háttérben betöltött oldal (új fül, takart ablak): a böngésző nem vagy alig futtatja a rAF-et, a GSAP
       ledobás félúton megállna, és a nyomatok áttetsző üres keretként ragadnának. Ezért:
       - a ledobás csak látható oldalon és ténylegesen lefutó rAF mellett indul, különben azonnal végállapot;
       - ledobás közben saját rAF-szívverés, egy setTimeout-őr figyeli: ha 450 ms-ig nincs képkocka, végállapot;
       - háttérbe kerüléskor (visibilitychange) azonnal végállapot;
       - a biztonsági háló a ledobás teljes ideje + 0,5 s. */
    var tl = null, safety = 0, guard = 0, beatT = 0;
    function finishDrop() {
      if (tl) tl.kill(); tl = null; clearTimeout(safety); clearInterval(guard); dropping = false; dropped = true;
      els.forEach(function (el, i) { el.style.opacity = ''; if (st[i].on) apply(el, st[i]); });
      table.classList.remove('is-predrop'); table.classList.add('is-placed', 'is-dropped');
    }
    D.addEventListener('visibilitychange', function () { if (D.hidden && !dropped) { if (!dropping) place(); finishDrop(); } });
    function drop() {
      if (!MOTION || dropped || dropping || D.hidden) { finishDrop(); return; }
      place();
      var STEP = .15, DUR = .9, order = 0, obst = textObst(10);
      dropping = true;
      beatT = performance.now();
      (function beat() { beatT = performance.now(); if (dropping) requestAnimationFrame(beat); })();
      guard = setInterval(function () { if (dropping && (D.hidden || performance.now() - beatT > 450)) finishDrop(); }, 150);
      tl = gsap.timeline({ onComplete: finishDrop });
      els.forEach(function (el, i) {
        var s = st[i]; if (!s.on) return;
        var side = (s.x + s.w / 2) < table.clientWidth / 2 ? -1 : 1;
        // az esés útja (a kezdő és a végső doboz uniója, a nagyobb dőléssel) nem érhet a címhez és a szöveghez:
        // a nyomat a csontfehér papírjával a krém betűk mögé kerülne, és azok eltűnnének. Ahol kevés a hely,
        // rövidebb az út; a sorrend és az ütem ettől nem változik.
        var cx = s.x + s.w / 2, cy = s.y + s.h / 2, fall = 0;
        for (var d = 150; d >= 24; d -= 6) {
          var a = rbox(cx, cy - d, s.w, s.h, s.r + side * 5), e = rbox(cx, cy, s.w, s.h, s.r + side * 5);
          if (!hitAny({ l: Math.min(a.l, e.l), r: Math.max(a.r, e.r), t: a.t, b: e.b }, obst)) { fall = d; break; }
        }
        var p = { y: s.y - fall, r: s.r + side * 5, o: 0 };
        function draw() { apply(el, { x: s.x, y: p.y, r: p.r }); el.style.opacity = p.o; }
        draw();
        var at = .05 + order++ * STEP;
        tl.to(p, { y: s.y, duration: DUR, ease: 'power3.out', onUpdate: draw }, at)
          .to(p, { o: 1, duration: .35, ease: 'power1.out', onUpdate: draw }, at)
          .to(p, { r: s.r, duration: DUR + .25, ease: 'back.out(2.2)', onUpdate: draw }, at);
      });
      table.classList.remove('is-predrop');
      safety = setTimeout(finishDrop, (tl.duration() + .5) * 1000); // háló: a ledobás teljes ideje + 0,5 s
    }
    // rAF-próba: ha 160 ms alatt nem jön képkocka (háttér, takart ablak), nincs animáció, azonnal végállapot
    function dropWhenLive() {
      if (D.hidden) { place(); finishDrop(); return; }
      var done = false;
      var to = setTimeout(function () { if (done) return; done = true; place(); finishDrop(); }, 160);
      requestAnimationFrame(function () {
        if (done) return; done = true; clearTimeout(to);
        if (!dropping) place(); table.classList.add('is-placed'); drop();
      });
    }
    function imagesReady() {
      var imgs = $$('.print img', table);
      return Promise.all(imgs.map(function (im) {
        // hiba után az initImages egyszer újratölti a képet: a második load-ot várjuk, csak a második hiba enged tovább
        var ok = im.complete && im.naturalWidth ? Promise.resolve() : new Promise(function (res) { var errs = 0; im.addEventListener('load', res, { once: true }); im.addEventListener('error', function () { if (++errs > 1 || im.__retried === undefined) res(); else im.addEventListener('load', res, { once: true }); }); });
        return ok.then(function () { return im.decode ? im.decode().catch(function () {}) : null; });
      }));
    }
    function go() {
      // a végleges elhelyezés a betűk ÉS a képek után fut (a mobil sávok a cím mért helyéből jönnek),
      // reduced motion alatt is, így minden betöltés ugyanazt az elrendezést adja
      Promise.all([D.fonts ? D.fonts.ready : null, imagesReady()]).then(function () { if (!dropped) dropWhenLive(); });
    }
    setTimeout(function () { if (!dropping && !dropped) { place(); finishDrop(); } }, 4000); // háló, ha egy kép sose töltene be
    go();
  }

  /* ---------- lapok kiosztása (főoldal): a kártyák a pakliból érkeznek, egyszer ---------- */
  function initHand() {
    var hand = $('[data-hand]'); if (!hand || REDUCE || !window.gsap || !('IntersectionObserver' in window)) return;
    if (hand.getBoundingClientRect().top < innerHeight * .9) return;
    var cards = $$('.card', hand);
    var wide = innerWidth > 960, tw = null;
    gsap.set(cards, { opacity: 0, x: function (i) { return wide ? (1.5 - i) * 60 : 0; }, y: wide ? 90 : 40, rotation: function (i) { return wide ? (i - 1.5) * 7 : (i % 2 ? 2 : -2); } });
    function end() { if (tw) tw.progress(1); gsap.set(cards, { clearProps: 'transform,opacity' }); }
    function deal() {
      // háttérben (rejtett fül) nincs kiosztás, a lapok azonnal a helyükön
      if (D.hidden) { end(); return; }
      tw = gsap.to(cards, { opacity: 1, x: 0, y: 0, rotation: 0, duration: .9, ease: 'power3.out', stagger: .09, clearProps: 'transform,opacity' });
      setTimeout(function () { if (tw && tw.progress() < 1) end(); }, 2200); // háló: fojtott rAF mellett se ragadjon
    }
    var io = new IntersectionObserver(function (ents) {
      if (!ents[0].isIntersecting) return; io.disconnect();
      // kép nélküli kártya ne ússzon be: megvárjuk a képeket (legfeljebb 1,5 s)
      var ims = $$('img', hand).filter(function (im) { return !imgOk(im); }), left = ims.length, go = false;
      function start() { if (go) return; go = true; deal(); }
      if (!left) { start(); return; }
      ims.forEach(function (im) { if (im.loading === 'lazy') im.loading = 'eager'; watchImg(im); function one() { if (--left <= 0) start(); } im.addEventListener('load', one, { once: true }); im.addEventListener('error', one, { once: true }); });
      setTimeout(start, 1500);
    }, { threshold: .15 });
    io.observe(hand);
    D.addEventListener('visibilitychange', function () { if (D.hidden && tw && tw.progress() < 1) end(); });
    setTimeout(function () { if (cards[0].style.opacity === '0' && hand.getBoundingClientRect().top < innerHeight) gsap.set(cards, { clearProps: 'all' }); }, 6000);
  }

  /* ---------- vízszintes nyomatsor: húzás egérrel, gombok ----------
     David: „a gomb nem csinál semmit”, „a többi kép be se tölt néha”. Ezért:
     - a sáv képei betöltenek, mielőtt a sáv a képre ér (vízszintesen a lazy betöltés nem mindig indul el),
     - a nyíl legalább egy képnyit lép, a sor elején és végén kikapcsolt (disabled), így látszik, hogy nincs tovább,
     - ha a sor elfér, a nyilak rejtve maradnak. */
  function eagerTrack(tr) {
    function go() { $$('img', tr).forEach(function (im) { if (im.loading === 'lazy') im.loading = 'eager'; watchImg(im); }); }
    if (!('IntersectionObserver' in window)) { go(); return; }
    var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); go(); } }, { rootMargin: '600px 0px' });
    io.observe(tr);
  }
  function navState(tr, prev, next) {
    function upd() {
      var max = tr.scrollWidth - tr.clientWidth, x = tr.scrollLeft;
      var nav = (prev || next) && (prev || next).parentNode;
      if (nav) nav.hidden = max < 8;
      if (prev) prev.disabled = x <= 4;
      if (next) next.disabled = x >= max - 4;
    }
    tr.addEventListener('scroll', function () { clearTimeout(upd.t); upd.t = setTimeout(upd, 60); }, { passive: true });
    addEventListener('resize', upd); addEventListener('load', upd); upd();
    return upd;
  }
  function initStrips() {
    $$('[data-strip]').forEach(function (wrap) {
      var tr = $('.strip__track', wrap), sec = wrap.closest('section') || wrap.parentNode;
      var prev = $('[data-prev]', sec), next = $('[data-next]', sec);
      if (!tr) return;
      eagerTrack(tr);
      var upd = navState(tr, prev, next);
      function step(dir) {
        var it = $('.print', tr), gap = parseFloat(getComputedStyle(tr).columnGap) || 20;
        var w = it ? it.getBoundingClientRect().width + gap : 300;
        tr.scrollBy({ left: dir * w, behavior: REDUCE ? 'auto' : 'smooth' });
        setTimeout(upd, 450);
      }
      if (prev) prev.addEventListener('click', function () { step(-1); });
      if (next) next.addEventListener('click', function () { step(1); });
      if (!FINE) return;
      var down = false, sx = 0, sl = 0, moved = 0;
      tr.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = tr.scrollLeft; tr.classList.add('is-drag'); });
      addEventListener('pointermove', function (e) { if (!down) return; moved = Math.abs(e.clientX - sx); tr.scrollLeft = sl - (e.clientX - sx); });
      addEventListener('pointerup', function () { if (!down) return; down = false; tr.classList.remove('is-drag'); });
      tr.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
      tr.addEventListener('dragstart', function (e) { e.preventDefault(); });
    });
  }

  /* ---------- Selfiebox: lépések és a keret képe együtt vált ---------- */
  function initHow() {
    var steps = $$('[data-step]'), imgs = $$('.how__stack img'), cap = $('[data-how-cap]');
    if (!steps.length || !imgs.length) return;
    function set(n) {
      steps.forEach(function (s, i) { s.classList.toggle('on', i === n); });
      imgs.forEach(function (im, i) { im.classList.toggle('on', i === n); });
      if (cap) cap.textContent = (n + 1) + ' / ' + steps.length + ' · ' + steps[n].getAttribute('data-step');
    }
    set(0);
    if (!('IntersectionObserver' in window)) { steps.forEach(function (s) { s.classList.add('on'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) set(steps.indexOf(e.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }

  /* ---------- Hátterek: nagy nézet (dialog) ---------- */
  function initViewer() {
    var dlg = $('#viewer'); if (!dlg || typeof dlg.showModal !== 'function') return;
    var sw = $$('.swatch'), img = $('img', dlg), ttl = $('[data-v-title]', dlg), link = $('[data-v-link]', dlg), cur = 0, opener = null;
    function show(i) {
      cur = (i + sw.length) % sw.length;
      var s = sw[cur], n = s.getAttribute('data-n');
      img.src = s.getAttribute('data-big'); img.alt = $('img', s).alt;
      ttl.textContent = n + '. háttér';
      link.href = 'ajanlatkeres.html?eszkoz=selfiebox&hatter=' + n;
    }
    sw.forEach(function (s, i) {
      s.addEventListener('click', function () { opener = s; show(i); dlg.showModal(); if (lenis) lenis.stop(); });
    });
    $('[data-v-prev]', dlg).addEventListener('click', function () { show(cur - 1); });
    $('[data-v-next]', dlg).addEventListener('click', function () { show(cur + 1); });
    $('[data-v-x]', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
    dlg.addEventListener('close', function () { if (lenis) lenis.start(); if (opener) opener.focus(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }

  /* ---------- Ajánlatkérés: URL-előtöltés, feltételes mezők, ellenőrzés, küldés ---------- */
  function initForm() {
    var form = $('[data-form]'); if (!form) return;
    var q = new URLSearchParams(location.search);
    function svc() { var c = $('input[name="eszkoz"]:checked', form); return c ? c.value : ''; }
    function cond() {
      var v = svc();
      $$('[data-when]', form).forEach(function (el) {
        var on = el.getAttribute('data-when').split(' ').indexOf(v) > -1;
        el.hidden = !on; $$('input,select,textarea', el).forEach(function (x) { x.disabled = !on; });
      });
    }
    var e0 = q.get('eszkoz'); if (e0) { var r = $('input[name="eszkoz"][value="' + e0 + '"]', form); if (r) r.checked = true; }
    $$('input[name="eszkoz"]', form).forEach(function (r) { r.addEventListener('change', cond); });
    cond();
    var ora = q.get('ora'); if (ora) $$('select[name="idotartam"]', form).forEach(function (s) { if ($('option[value="' + ora + ' óra"]', s)) s.value = ora + ' óra'; });
    var jel = q.get('jelleg'); if (jel) { var js = $('select[name="jelleg"]', form); if (js) js.value = jel; }
    var bsz = q.get('beszelgetes'); if (bsz) { var bs = $('select[name="beszelgetes"]', form); if (bs) bs.value = bsz; }
    var hat = q.get('hatter'); if (hat) { var hs = $('select[name="hatter"]', form); if (hs) hs.value = hat + '. háttér'; }
    function check(f) {
      var x = $('input,select,textarea', f); if (!x || x.disabled) return true;
      var ok = x.type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.value.trim()) : x.type === 'tel' ? x.value.replace(/\D/g, '').length >= 8 : !!x.value.trim();
      f.classList.toggle('bad', !ok); x.setAttribute('aria-invalid', ok ? 'false' : 'true'); return ok;
    }
    $$('.f[data-req]', form).forEach(function (f) { var x = $('input,select,textarea', f); if (x) x.addEventListener('blur', function () { check(f); }); });
    form.addEventListener('submit', function (e) {
      var bad = $$('.f[data-req]', form).filter(function (f) { return !check(f); });
      var cons = $('input[name="hozzajarulas"]', form), cw = cons && cons.closest('.consent');
      if (cons && !cons.checked) { bad.push(cw); cw.classList.add('bad'); } else if (cw) cw.classList.remove('bad');
      if (bad.length) { e.preventDefault(); var x = $('input,select,textarea', bad[0]); if (x) x.focus(); return; }
      var key = $('input[name="access_key"]', form).value;
      if (location.protocol === 'file:' || !key || /IDE_JON/.test(key)) {
        e.preventDefault();
        var fd = new FormData(form), lines = [];
        fd.forEach(function (v, k) { if (['access_key', 'redirect', 'subject', 'botcheck', 'hozzajarulas'].indexOf(k) < 0 && v) lines.push(k + ': ' + v); });
        var note = $('[data-form-note]', form); note.hidden = false;
        location.href = 'mailto:hello@elmenyfotozas.hu?subject=' + encodeURIComponent('Ajánlatkérés a weboldalról') + '&body=' + encodeURIComponent(lines.join('\n'));
      }
    });
    var red = $('input[name="redirect"]', form);
    if (red && /^https?:/.test(location.protocol)) red.value = location.href.replace(/[^/]*$/, 'koszonjuk.html');
  }


  /* ---------- Rendezvényfotózás: kontaktlap vízszintes szakaszként (pin nélkül, sticky + rAF-lerp) ---------- */
  function initSheet() {
    var sec = $('[data-sheet]'); if (!sec) return;
    var tr = $('.sheet__track', sec), prev = $('[data-sprev]', sec), next = $('[data-snext]', sec);
    if (tr) eagerTrack(tr);
    var mq = matchMedia('(min-width: 961px)'), on = false, dist = 0, cur = 0, tgt = 0, raf = 0;
    function step(dir) {
      var it = $('.print', tr), w = it ? it.getBoundingClientRect().width + 24 : 320;
      if (on) {
        var top = sec.getBoundingClientRect().top + scrollY, span = sec.offsetHeight - innerHeight;
        var y = top + Math.max(0, Math.min(span, (-cur + dir * w) / dist * span));
        if (lenis) lenis.scrollTo(y); else scrollTo({ top: y, behavior: REDUCE ? 'auto' : 'smooth' });
      } else tr.scrollBy({ left: dir * w, behavior: REDUCE ? 'auto' : 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    function measure() {
      on = mq.matches && !REDUCE;
      sec.classList.toggle('is-h', on);
      if (!on) { tr.style.transform = ''; sec.style.removeProperty('--hh'); return; }
      dist = Math.max(0, tr.scrollWidth - innerWidth);
      sec.style.setProperty('--hh', (innerHeight + dist) + 'px');
    }
    function loop() {
      raf = 0; if (!on) return;
      var r = sec.getBoundingClientRect(), span = sec.offsetHeight - innerHeight;
      var p = span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 0;
      tgt = -p * dist; cur += (tgt - cur) * .14;
      if (Math.abs(tgt - cur) < .3) cur = tgt;
      tr.style.transform = 'translate3d(' + cur.toFixed(1) + 'px,0,0)';
      if (cur !== tgt) raf = requestAnimationFrame(loop);
    }
    function kick() { if (!raf && on) raf = requestAnimationFrame(loop); }
    measure(); kick();
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', function () { measure(); kick(); });
    addEventListener('load', function () { measure(); kick(); });
    // billentyű: a sávra fókuszálva a nyilak lapoznak
    tr.addEventListener('keydown', function (e) { if (!on) return; if (e.key === 'ArrowRight') { e.preventDefault(); step(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); } });
    // fókuszált kép behúzása a látható sávba
    tr.addEventListener('focusin', function (e) { if (on && e.target !== tr) e.target.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
  }

  function boot() {
    initImages(); initTop(); initMenu(); initTable(); initReveal(); initHand(); initStrips(); initHow(); initViewer(); initForm(); initSheet();
    startLenis();
    if (window.ScrollTrigger) { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true }); }
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot); else boot();
})();
