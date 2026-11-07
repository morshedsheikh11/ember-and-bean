/* Scroll-story hero.
   The whole scene is a pure function of progress p (0..1): render(p) places
   every element. On desktop p follows the scroll position; on small screens
   it plays by itself; with reduced motion it stays at the final frame. */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const hero = $('hero');
  const sticky = hero.querySelector('.hero__sticky');
  const stage = $('heroStage');
  const svg = $('scene');
  const canvas = $('heroCanvas');
  const ctx = canvas.getContext('2d');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = matchMedia('(max-width: 767px)');
  const stacked = matchMedia('(max-width: 1023px)');

  const el = {
    cups: [$('cupBack'), $('cupFront')], bean: $('bean'), halo: $('beanHalo'), kettle: $('kettle'),
    water: $('water'), coffee: $('coffee'), heart: $('heart'),
    stream: $('stream'), r1: $('ripple1'), r2: $('ripple2'), drops: $('droplets'),
    glow: $('heroGlow'), railFill: $('heroRailFill'),
    replay: $('heroReplay'), cta: $('heroCta'),
    interior: $('interior'),
    captions: [...hero.querySelectorAll('.hero__caption')],
    finals: [...hero.querySelectorAll('[data-final]')],
    dots: [...$('heroRail').querySelectorAll('i')],
  };

  /* Helpers ---------------------------------------------------------------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const inQuad = (t) => t * t;
  const outCubic = (t) => 1 - Math.pow(1 - t, 3);
  const inOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const r2 = (n) => Math.round(n * 100) / 100;

  const cache = new WeakMap();
  function attr(node, name, value) {
    let c = cache.get(node);
    if (!c) cache.set(node, (c = {}));
    if (c[name] !== value) { c[name] = value; node.setAttribute(name, value); }
  }
  function css(node, name, value) {
    let c = cache.get(node);
    if (!c) cache.set(node, (c = {}));
    const k = 's:' + name;
    if (c[k] !== value) { c[k] = value; node.style[name] = value; }
  }

  /* Splash droplets -------------------------------------------------------- */
  const NS = 'http://www.w3.org/2000/svg';
  const drops = Array.from({ length: 14 }, (_, i) => {
    const c = document.createElementNS(NS, 'circle');
    const side = i % 2 ? 1 : -1;
    c.setAttribute('fill', i % 3 ? '#efe2cf' : '#c68b59');
    el.drops.appendChild(c);
    return {
      c,
      vx: side * (22 + (i * 37) % 120),
      vy: -(120 + (i * 53) % 150),
      r: 3 + (i * 7) % 5,
    };
  });

  /* Layout: wider viewBox on desktop, tighter crop when stacked ------------ */
  let kettleScale = .85;
  function layout() {
    if (stacked.matches) {
      attr(svg, 'viewBox', '90 240 800 660');
      kettleScale = .72;
    } else {
      attr(svg, 'viewBox', '0 0 1000 1000');
      kettleScale = .85;
    }
  }

  /* Timeline --------------------------------------------------------------- */
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const TIP = { x: 470, y: 300 };
  const stacking = () => stacked.matches;

  function surface(level) {
    return { cy: lerp(642, 606, level), rx: lerp(138, 168, level), ry: lerp(36, 44, level) };
  }

  function render(p, t, intro) {
    /* Bean: slow fall, then a quicker drop into the cup */
    const fall = seg(p, 0, .24);
    const drop = inQuad(seg(p, .24, .345));
    const startY = stacking() ? 330 : 270;
    const midY = stacking() ? 420 : 430;
    const bob = (1 - seg(p, 0, .04)) * Math.sin(t * 1.4) * 7;
    let by = lerp(startY, midY, inOut(fall) * .4 + fall * .6);
    let bs = lerp(stacking() ? 1 : 1.45, 1.05, fall);
    let br = lerp(-28, 150, fall) + (1 - seg(p, 0, .04)) * Math.sin(t * .8) * 4;
    by = lerp(by, 628, drop) + bob - (1 - outCubic(intro)) * 900;
    bs = lerp(bs, .42, drop);
    br = lerp(br, 330, drop);
    attr(el.bean, 'transform', `translate(430 ${r2(by)}) rotate(${r2(br)}) scale(${r2(bs)})`);
    attr(el.bean, 'opacity', p > .62 ? 0 : 1);
    attr(el.halo, 'opacity', r2(1 - seg(p, .22, .3)));

    /* Cup rises in, with a small jolt when the bean lands */
    const rise = outCubic(seg(p, .15, .3));
    const land = seg(p, .345, .39);
    const jolt = Math.sin(land * Math.PI) * 5;
    el.cups.forEach((g) => {
      attr(g, 'transform', `translate(0 ${r2((1 - rise) * 520 + jolt)})`);
      attr(g, 'opacity', r2(seg(p, .15, .185)));
    });

    /* Splash */
    const sp = seg(p, .345, .44);
    drops.forEach((d) => {
      if (sp <= 0 || sp >= 1) { attr(d.c, 'opacity', 0); return; }
      const x = 430 + d.vx * sp * 1.3;
      const y = 612 + d.vy * sp * 1.5 + 310 * sp * sp;
      attr(d.c, 'cx', r2(x));
      attr(d.c, 'cy', r2(y));
      attr(d.c, 'r', r2(d.r * (1 - sp * .4)));
      attr(d.c, 'opacity', r2(Math.min(1, (1 - sp) * 2.2)));
    });

    /* Kettle swings in, pivoting around the spout tip */
    const kIn = inOut(seg(p, .44, .535));
    const kTilt = inOut(seg(p, .495, .555));
    const kBack = inOut(seg(p, .715, .775));
    const kOut = inOut(seg(p, .745, .82));
    const kx = (1 - kIn) * 520 + kOut * 520;
    const ky = -(1 - kIn) * 340 - kOut * 340;
    const kr = -33 * kTilt * (1 - kBack);
    attr(el.kettle, 'transform', `translate(${r2(TIP.x + kx)} ${r2(TIP.y + ky)}) rotate(${r2(kr)}) scale(${kettleScale})`);
    attr(el.kettle, 'opacity', r2(seg(p, .44, .48) * (1 - seg(p, .78, .82))));

    /* Water level and pour */
    const level = inOut(seg(p, .555, .71));
    const s = surface(level);
    const hasLiquid = p > .555;
    attr(el.water, 'cy', r2(s.cy));
    attr(el.water, 'rx', r2(s.rx));
    attr(el.water, 'ry', r2(s.ry));
    attr(el.water, 'opacity', hasLiquid ? r2(seg(p, .555, .585) * .96) : 0);

    const head = seg(p, .535, .56);
    const tail = seg(p, .695, .725);
    if (head > 0 && tail < 1) {
      const y1 = lerp(TIP.y + 2, s.cy, inQuad(tail));
      const y2 = lerp(TIP.y + 2, s.cy, inQuad(head));
      const w = Math.sin(t * 9) * .9;
      const x = TIP.x;
      attr(el.stream, 'd', `M${r2(x - 4.5)},${r2(y1)}L${r2(x + 4.5)},${r2(y1)}Q${r2(x + 3 + w)},${r2((y1 + y2) / 2)} ${r2(x + 3.5)},${r2(y2)}L${r2(x - 3.5)},${r2(y2)}Q${r2(x - 3 + w)},${r2((y1 + y2) / 2)} ${r2(x - 4.5)},${r2(y1)}Z`);
      const pouring = head >= 1 ? 1 - tail : 0;
      [el.r1, el.r2].forEach((r, i) => {
        const ph = (t * .9 + i * .5) % 1;
        attr(r, 'cy', r2(s.cy));
        attr(r, 'rx', r2(14 + ph * 66));
        attr(r, 'ry', r2(4 + ph * 18));
        attr(r, 'stroke-opacity', r2((1 - ph) * .6 * pouring));
      });
    } else {
      attr(el.stream, 'd', '');
      attr(el.r1, 'stroke-opacity', 0);
      attr(el.r2, 'stroke-opacity', 0);
    }

    /* Coffee blooms out from the centre, then the heart forms */
    const bloom = inOut(seg(p, .68, .79));
    attr(el.coffee, 'rx', r2(172 * bloom));
    attr(el.coffee, 'ry', r2(46 * bloom));
    attr(el.coffee, 'opacity', bloom > 0 ? 1 : 0);
    const heart = outCubic(seg(p, .79, .88));
    attr(el.heart, 'transform', `scale(${r2(heart * .98 + .001)})`);
    attr(el.heart, 'opacity', r2(seg(p, .79, .82)));

    /* Gentle push in on the finished cup, warmer light */
    const cam = 1 + inOut(seg(p, .72, 1)) * .05;
    const base = stacked.matches ? 'translateX(-50%) ' : '';
    css(stage, 'transform', `${base}scale(${cam.toFixed(4)})`);
    css(el.glow, 'opacity', (.28 + seg(p, .15, .35) * .4 + seg(p, .7, .95) * .32).toFixed(3));

    /* Text */
    const panel = (node, inA, inB, outA, outB) => {
      const a = seg(p, inA, inB);
      const b = seg(p, outA, outB);
      const o = a * (1 - b);
      css(node, 'opacity', o.toFixed(3));
      css(node, 'transform', `translate3d(0,${((1 - outCubic(a)) * 26 - b * 26).toFixed(1)}px,0)`);
      css(node, 'visibility', o < .01 ? 'hidden' : 'visible');
    };
    panel(el.captions[0], -2, -1, .2, .245);
    panel(el.captions[1], .265, .305, .435, .475);
    panel(el.captions[2], .5, .54, .715, .755);
    el.finals.forEach((node, i) => {
      const a = outCubic(seg(p, .81 + i * .03, .88 + i * .03));
      css(node, 'opacity', a.toFixed(3));
      css(node, 'transform', `translate3d(0,${((1 - a) * 26).toFixed(1)}px,0)`);
    });
    css(el.cta, 'visibility', p > .84 ? 'visible' : 'hidden');

    /* Progress */
    css(el.railFill, 'transform', `scaleX(${clamp(p / .9).toFixed(3)})`);
    el.dots.forEach((d, i) => d.classList.toggle('is-on', p >= [0, .3, .6, .9][i]));

    steamLevel = seg(p, .56, .72) * .45 + seg(p, .8, .92) * .55;
    rimVisible = p > .3;
  }

  /* Steam and embers (canvas) ---------------------------------------------- */
  let steamLevel = 0;
  let rimVisible = false;
  let W = 0, H = 0, DPR = 1;
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 96;
  (() => {
    const c = sprite.getContext('2d');
    const g = c.createRadialGradient(48, 48, 0, 48, 48, 48);
    g.addColorStop(0, 'rgba(255,246,235,1)');
    g.addColorStop(.4, 'rgba(255,246,235,.45)');
    g.addColorStop(1, 'rgba(255,246,235,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 96, 96);
  })();

  const puffs = [];
  const embers = [];
  let emitAcc = 0;

  function resize() {
    // Mobile address bars fire resize while scrolling; ignore if nothing changed
    if (W === sticky.clientWidth && H === sticky.clientHeight) return;
    DPR = 1; // steam is soft by nature, so full-res canvas buys nothing
    W = sticky.clientWidth;
    H = sticky.clientHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    embers.length = 0;
    const n = small.matches ? 0 : 22;
    for (let i = 0; i < n; i++) {
      embers.push({ x: Math.random() * W, y: Math.random() * H, v: 8 + Math.random() * 16, r: .7 + Math.random() * 1.4, ph: Math.random() * 6.28 });
    }
  }

  function drawCanvas(t, dt) {
    ctx.clearRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#e8975a';
    for (const e of embers) {
      e.y -= e.v * dt;
      e.x += Math.sin(t * .6 + e.ph) * 6 * dt;
      if (e.y < -6) { e.y = H + 6; e.x = Math.random() * W; }
      ctx.globalAlpha = .22 + .3 * (.5 + .5 * Math.sin(t * 1.7 + e.ph));
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, 6.283);
      ctx.fill();
    }

    if (steamLevel > .01 && rimVisible) {
      const box = el.interior.getBoundingClientRect();
      const host = canvas.getBoundingClientRect();
      const cx = box.left + box.width / 2 - host.left;
      const cy = box.top + box.height * .42 - host.top;
      const half = box.width * .36;
      const rate = (small.matches ? 20 : 40) * steamLevel;
      emitAcc += rate * dt;
      while (emitAcc >= 1) {
        emitAcc -= 1;
        const lane = Math.floor(Math.random() * 3) - 1;
        puffs.push({
          x: cx + lane * half * .62 + (Math.random() - .5) * half * .35,
          y: cy, age: 0, life: 2.8 + Math.random() * 1.8,
          v: box.width * (.2 + Math.random() * .1),
          sway: box.width * (.05 + Math.random() * .07),
          ph: lane * 1.9 + t * .35, size: box.width * (.11 + Math.random() * .09),
        });
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    for (let i = puffs.length - 1; i >= 0; i--) {
      const q = puffs[i];
      q.age += dt;
      const k = q.age / q.life;
      if (k >= 1) { puffs.splice(i, 1); continue; }
      const px = q.x + Math.sin(q.ph + k * 5) * q.sway * k * 1.8;
      const py = q.y - q.v * q.age;
      const sz = q.size * (1 + k * 3.2);
      ctx.globalAlpha = Math.sin(Math.PI * Math.pow(k, .7)) * .085 * Math.max(steamLevel, .3);
      ctx.drawImage(sprite, px - sz / 2, py - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
  }

  /* Driver ----------------------------------------------------------------- */
  const AUTO_MS = 13000;
  let mode = 'scroll';
  let target = 0, current = 0;
  let autoStart = 0;
  let visible = true;
  let raf = 0, last = 0, startedAt = 0;

  function readScroll() {
    const rect = hero.getBoundingClientRect();
    const span = rect.height - window.innerHeight;
    target = span > 0 ? clamp(-rect.top / span) : 1;
  }

  function frame(now) {
    raf = 0;
    if (!visible) return;
    if (mode !== 'static') raf = requestAnimationFrame(frame);
    const t = now / 1000;
    const raw = (now - last) / 1000 || .016;
    const dt = Math.min(raw, .05);
    last = now;

    if (mode === 'scroll') {
      readScroll();
      current += (target - current) * (1 - Math.exp(-raw * 8));
      if (Math.abs(target - current) < .0003) current = target;
    } else if (mode === 'auto') {
      current = clamp((now - autoStart) / AUTO_MS);
      if (current >= 1 && el.replay.hidden) el.replay.hidden = false;
    }

    const intro = mode === 'scroll' && !reduced ? clamp((now - startedAt) / 1700) : 1;
    render(current, t, intro);
    if (mode !== 'static') drawCanvas(t, dt);
  }

  function wake() {
    if (!raf && visible) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }

  function setMode() {
    layout();
    if (reduced) {
      mode = 'static';
      hero.classList.add('is-auto', 'is-static');
      current = 1;
    } else if (small.matches) {
      if (mode !== 'auto') {
        mode = 'auto';
        hero.classList.add('is-auto');
        autoStart = performance.now() + 500;
      }
    } else {
      mode = 'scroll';
      hero.classList.remove('is-auto');
      el.replay.hidden = true;
    }
    resize();
  }

  /* Boot ------------------------------------------------------------------- */
  setMode();
  startedAt = performance.now();
  render(reduced ? 1 : 0, 0, reduced ? 1 : 0);

  small.addEventListener('change', setMode);
  stacked.addEventListener('change', setMode);
  addEventListener('resize', resize, { passive: true });

  el.replay.addEventListener('click', () => {
    el.replay.hidden = true;
    puffs.length = 0;
    autoStart = performance.now();
  });

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    wake();
  }, { rootMargin: '10% 0px' }).observe(hero);

  wake();
})();
