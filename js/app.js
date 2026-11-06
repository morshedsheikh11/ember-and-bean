/* Page behaviour: nav, reveals, menu, cart, ordering and booking. */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const MENU = window.EB_MENU;
  const HOURS = window.EB_HOURS;
  const DELIVERY_FEE = 6;

  const ITEMS = Object.fromEntries(MENU.flatMap((c) => c.items).map((i) => [i.id, i]));
  const rm = (n) => `RM ${n.toFixed(2)}`;
  const photo = (id, w, h) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=70&auto=format`;
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  /* Time in Kuala Lumpur, whatever the visitor's timezone ------------------ */
  const klNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const minutes = (d) => d.getHours() * 60 + d.getMinutes();
  function clock(m) {
    const h = Math.floor(m / 60), mm = m % 60;
    return `${h % 12 || 12}:${pad(mm)} ${h < 12 ? 'am' : 'pm'}`;
  }

  /* Nav -------------------------------------------------------------------- */
  const nav = $('nav');
  const toggle = $('navToggle');
  const mobileMenu = $('mobileMenu');

  function setMenu(open) {
    mobileMenu.hidden = !open;
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu');
  }
  toggle.addEventListener('click', () => setMenu(mobileMenu.hidden));
  mobileMenu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  nav.addEventListener('click', (e) => { if (e.target.closest('.nav__actions a, .logo')) setMenu(false); });

  const heroEl = $('hero');
  function onScroll() {
    nav.classList.toggle('is-solid', heroEl.getBoundingClientRect().bottom <= nav.offsetHeight + 1);
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();

  const links = $$('.nav__links a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section').forEach((s) => spy.observe(s));

  /* Reveal on scroll ------------------------------------------------------- */
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      reveal.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.reveal').forEach((node) => {
    const sibs = $$(':scope > .reveal', node.parentElement);
    node.style.setProperty('--d', `${Math.min(sibs.indexOf(node), 5) * 80}ms`);
    reveal.observe(node);
  });

  /* Shared state ----------------------------------------------------------- */
  const KEY = 'ember-bean-order';
  const state = { cart: {}, mode: 'pickup', address: '', pickupTime: '' };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (saved.cart) state.cart = Object.fromEntries(Object.entries(saved.cart).filter(([id, q]) => ITEMS[id] && q > 0));
    if (saved.mode === 'delivery') state.mode = 'delivery';
  } catch (_) { /* a broken saved cart just starts empty */ }
  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ cart: state.cart, mode: state.mode })); } catch (_) {}
  };

  const qtyOf = (id) => state.cart[id] || 0;
  const count = () => Object.values(state.cart).reduce((a, b) => a + b, 0);
  const subtotal = () => Object.entries(state.cart).reduce((a, [id, q]) => a + ITEMS[id].price * q, 0);
  const total = () => subtotal() + (state.mode === 'delivery' && count() ? DELIVERY_FEE : 0);

  function stepper(id, q) {
    const name = ITEMS[id].name;
    return `<div class="qty">
      <button type="button" class="qty__btn" data-dec="${id}" aria-label="Remove one ${name}" ${q ? '' : 'disabled'}>${icon('minus')}</button>
      <span class="qty__n" aria-label="${q} in order">${q}</span>
      <button type="button" class="qty__btn" data-inc="${id}" aria-label="Add one ${name}">${icon('plus')}</button>
    </div>`;
  }

  function setQty(id, q) {
    const before = qtyOf(id);
    if (q > 0) state.cart[id] = Math.min(q, 20); else delete state.cart[id];
    persist();
    syncCart();
    if (q > before) {
      toast(`${ITEMS[id].name} added to your order`);
      fab.classList.remove('is-bump');
      void fab.offsetWidth;
      fab.classList.add('is-bump');
    }
  }

  /* Any +/- button on the page, thanks to event delegation */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-inc], [data-dec]');
    if (!btn) return;
    const isInc = 'inc' in btn.dataset;
    const id = isInc ? btn.dataset.inc : btn.dataset.dec;
    const root = btn.closest('#menuGrid, #orderList, #cartItems');
    setQty(id, qtyOf(id) + (isInc ? 1 : -1));
    // Re-rendering replaces the button, so put keyboard focus back on its twin
    const twin = root.querySelector(`[data-${isInc ? 'inc' : 'dec'}="${id}"]:not(:disabled)`) || root.querySelector(`[data-inc="${id}"]`);
    (twin || cart).focus({ preventScroll: true });
  });

  /* Menu section ----------------------------------------------------------- */
  const tabs = $('menuTabs');
  const grid = $('menuGrid');
  let activeCat = MENU[0].id;

  tabs.innerHTML = MENU.map((c, i) => `<button type="button" class="tab" role="tab" id="tab-${c.id}" data-cat="${c.id}" aria-controls="menuGrid" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${c.label}</button>`).join('');

  function cardAction(id) {
    const q = qtyOf(id);
    return q ? stepper(id, q) : `<button type="button" class="add-btn" data-inc="${id}" aria-label="Add ${ITEMS[id].name} to order">${icon('plus')} Add to order</button>`;
  }

  function renderMenu() {
    const cat = MENU.find((c) => c.id === activeCat);
    grid.setAttribute('aria-labelledby', `tab-${cat.id}`);
    grid.innerHTML = cat.items.map((it, i) => `
      <article class="card" style="--i:${i}">
        <div class="card__media"><img src="${photo(it.img, 640, 480)}" srcset="${photo(it.img, 420, 315)} 420w, ${photo(it.img, 640, 480)} 640w" sizes="(max-width: 640px) 90vw, (max-width: 1100px) 45vw, 380px" width="640" height="480" loading="lazy" decoding="async" alt="${it.name}"></div>
        <div class="card__body">
          <div class="card__top"><h3 class="card__name">${it.name}</h3><span class="card__price">${rm(it.price)}</span></div>
          <p class="card__desc">${it.desc}</p>
          <div class="card__action" data-action="${it.id}">${cardAction(it.id)}</div>
        </div>
      </article>`).join('');
  }

  function selectTab(btn, focus) {
    activeCat = btn.dataset.cat;
    $$('.tab', tabs).forEach((b) => {
      const on = b === btn;
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
    });
    renderMenu();
    if (focus) btn.focus();
  }
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('.tab');
    if (b) selectTab(b);
  });
  tabs.addEventListener('keydown', (e) => {
    const all = $$('.tab', tabs);
    const i = all.indexOf(document.activeElement);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: all.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    selectTab(all[(next + all.length) % all.length], true);
  });

  /* Order section ---------------------------------------------------------- */
  const chips = $('orderChips');
  const orderList = $('orderList');
  let orderCat = MENU[0].id;

  chips.innerHTML = MENU.map((c, i) => `<button type="button" class="chip" data-cat="${c.id}" aria-pressed="${i === 0}">${c.label}</button>`).join('');
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    orderCat = b.dataset.cat;
    $$('.chip', chips).forEach((c) => c.setAttribute('aria-pressed', c === b));
    renderOrderList();
  });

  function renderOrderList() {
    const cat = MENU.find((c) => c.id === orderCat);
    orderList.innerHTML = cat.items.map((it) => `
      <li class="order-row">
        <img src="${photo(it.img, 128, 128)}" width="64" height="64" loading="lazy" decoding="async" alt="">
        <div><span class="order-row__name">${it.name}</span><span class="order-row__price">${rm(it.price)}</span></div>
        <div data-stepper="${it.id}">${stepper(it.id, qtyOf(it.id))}</div>
      </li>`).join('');
  }

  /* Pickup / delivery ------------------------------------------------------ */
  function setMode(mode) {
    state.mode = mode;
    persist();
    $$('[data-mode]').forEach((b) => {
      const on = b.dataset.mode === mode;
      b.setAttribute('aria-checked', on);
      b.tabIndex = on ? 0 : -1;
    });
    $$('[data-for]').forEach((f) => { f.hidden = f.dataset.for !== mode; });
    clearError('cartAddress');
    syncCart();
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (b) setMode(b.dataset.mode);
  });
  document.addEventListener('keydown', (e) => {
    const b = e.target.closest && e.target.closest('[data-mode]');
    if (!b || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const other = b.parentElement.querySelector(`[data-mode]:not([data-mode="${b.dataset.mode}"])`);
    setMode(other.dataset.mode);
    other.focus();
  });

  /* Next pickup slots: today from 20 minutes out, otherwise tomorrow */
  function pickupSlots() {
    const now = klNow();
    const slots = [];
    const today = HOURS[now.getDay()];
    const earliest = Math.ceil((minutes(now) + 20) / 15) * 15;
    for (let m = Math.max(earliest, today[0] + 15); m <= today[1] - 15; m += 15) {
      slots.push({ value: `Today, ${clock(m)}`, label: `Today, ${clock(m)}` });
    }
    if (!slots.length) {
      const next = HOURS[(now.getDay() + 1) % 7];
      for (let m = next[0] + 30; m <= next[0] + 240; m += 15) {
        slots.push({ value: `Tomorrow, ${clock(m)}`, label: `Tomorrow, ${clock(m)}` });
      }
    }
    return slots;
  }
  function fillPickup() {
    const slots = pickupSlots();
    state.pickupTime = slots[0].value;
    $$('[data-bind="pickupTime"]').forEach((sel) => {
      sel.innerHTML = slots.map((s) => `<option>${s.label}</option>`).join('');
    });
  }

  /* Both copies of each field (section and cart) stay in step */
  document.addEventListener('input', (e) => {
    const key = e.target.dataset && e.target.dataset.bind;
    if (!key) return;
    state[key] = e.target.value;
    $$(`[data-bind="${key}"]`).forEach((f) => { if (f !== e.target) f.value = e.target.value; });
    if (key === 'address') clearError('cartAddress');
  });

  /* Cart drawer ------------------------------------------------------------ */
  const cart = $('cart');
  const overlay = $('overlay');
  const fab = $('cartFab');
  const cartView = $('cartView');
  const orderSuccess = $('orderSuccess');
  let lastFocus = null;

  function syncCart() {
    const n = count();
    // In-place updates keep the menu grid and order list from flickering
    $$('[data-action]').forEach((a) => { a.innerHTML = cardAction(a.dataset.action); });
    $$('[data-stepper]').forEach((s) => { s.innerHTML = stepper(s.dataset.stepper, qtyOf(s.dataset.stepper)); });

    $('cartItems').innerHTML = Object.entries(state.cart).map(([id, q]) => {
      const it = ITEMS[id];
      return `<li class="cart-row">
        <img src="${photo(it.img, 120, 120)}" width="60" height="60" loading="lazy" alt="">
        <div><span class="cart-row__name">${it.name}</span><span class="cart-row__price">${rm(it.price * q)}</span></div>
        ${stepper(id, q)}
      </li>`;
    }).join('');

    $('cartItems').hidden = !n;
    $('cartFoot').hidden = !n;
    $('cartEmpty').hidden = !!n;
    $('cartSubtotal').textContent = rm(subtotal());
    $('cartDeliveryRow').hidden = state.mode !== 'delivery';
    $('cartTotal').textContent = rm(total());

    fab.hidden = !n || cart.classList.contains('is-open');
    $('cartFabCount').textContent = n;
    $('cartFabTotal').textContent = rm(total());
    fab.setAttribute('aria-label', `Open cart, ${n} ${n === 1 ? 'item' : 'items'}, ${rm(total())}`);
    $('orderViewCartLabel').textContent = n ? `View cart (${n}) · ${rm(total())}` : 'Your cart is empty';
  }

  function openCart() {
    lastFocus = document.activeElement;
    toastEl.classList.remove('is-on');
    cart.inert = false;
    cart.classList.add('is-open');
    overlay.hidden = false;
    overlay.classList.remove('is-closing');
    document.body.classList.add('is-locked');
    fab.hidden = true;
    cart.focus({ preventScroll: true });
  }
  function closeCart() {
    if (!cart.classList.contains('is-open')) return;
    cart.classList.remove('is-open');
    cart.inert = true;
    overlay.classList.add('is-closing');
    setTimeout(() => { overlay.hidden = true; }, 300);
    document.body.classList.remove('is-locked');
    orderSuccess.hidden = true;
    cartView.hidden = false;
    syncCart();
    if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
  }

  fab.addEventListener('click', openCart);
  $('orderViewCart').addEventListener('click', openCart);
  $('cartClose').addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  $('cartBrowse').addEventListener('click', closeCart);
  $('orderDone').addEventListener('click', closeCart);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeCart(); if (!mobileMenu.hidden) setMenu(false); }
    if (e.key !== 'Tab' || !cart.classList.contains('is-open')) return;
    const focusable = $$('button, a[href], input, select, textarea', cart).filter((n) => n.offsetParent !== null && !n.disabled);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === cart)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  $('checkout').addEventListener('click', () => {
    if (state.mode === 'delivery' && state.address.trim().length < 8) {
      setError('cartAddress', 'Please enter your full delivery address.');
      $('cartAddress').focus();
      return;
    }
    const paid = rm(total());
    const n = count();
    const where = state.mode === 'delivery'
      ? `We'll deliver to ${state.address.trim()} in about 40 minutes.`
      : `It'll be ready for pickup at ${state.pickupTime.replace('Today, ', '').replace('Tomorrow, ', 'tomorrow, ')}.`;
    $('orderSuccessText').textContent = `${n} ${n === 1 ? 'item' : 'items'}, ${paid}. ${where} This is a demo, so no payment was taken.`;
    state.cart = {};
    persist();
    syncCart();
    cartView.hidden = true;
    orderSuccess.hidden = false;
    orderSuccess.focus();
  });

  /* Toast ------------------------------------------------------------------ */
  const toastEl = $('toast');
  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
  }

  /* Form helpers ----------------------------------------------------------- */
  function setError(id, msg) {
    const f = $(id);
    const err = $(`${id}-err`);
    f.setAttribute('aria-invalid', 'true');
    f.setAttribute('aria-describedby', `${id}-err`);
    if (err) err.textContent = msg;
  }
  function clearError(id) {
    const f = $(id);
    const err = $(`${id}-err`);
    f.removeAttribute('aria-invalid');
    f.removeAttribute('aria-describedby');
    if (err) err.textContent = '';
  }

  /* Booking ---------------------------------------------------------------- */
  const form = $('bookForm');
  const dateIn = $('bDate');
  const timeIn = $('bTime');
  const today = klNow();
  dateIn.min = isoDate(today);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + 60);
  dateIn.max = isoDate(limit);

  /* Half-hourly slots that respect that day's hours; last seating 1h before close */
  function fillBookingTimes() {
    if (!dateIn.value) {
      timeIn.innerHTML = '<option value="">Choose a date first</option>';
      return;
    }
    const [y, mo, d] = dateIn.value.split('-').map(Number);
    const day = new Date(y, mo - 1, d);
    const [open, close] = HOURS[day.getDay()];
    const now = klNow();
    const isToday = dateIn.value === isoDate(now);
    const from = isToday ? Math.max(open, Math.ceil((minutes(now) + 30) / 30) * 30) : open;
    const prev = timeIn.value;
    const opts = [];
    for (let m = Math.ceil(from / 30) * 30; m <= close - 60; m += 30) opts.push(clock(m));
    timeIn.innerHTML = opts.length
      ? '<option value="">Select a time</option>' + opts.map((o) => `<option${o === prev ? ' selected' : ''}>${o}</option>`).join('')
      : '<option value="">No more tables today</option>';
  }
  dateIn.addEventListener('change', fillBookingTimes);

  const validators = {
    bName: (v) => (v.trim().length >= 2 ? '' : 'Please enter your name.'),
    bPhone: (v) => (/^\+?[\d\s()-]{8,}$/.test(v.trim()) ? '' : 'Please enter a valid phone number.'),
    bEmail: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.'),
    bDate: (v) => {
      if (!v) return 'Please choose a date.';
      if (v < dateIn.min) return 'Please choose today or a later date.';
      if (v > dateIn.max) return 'We take bookings up to 60 days ahead.';
      return '';
    },
    bTime: (v) => (v ? '' : 'Please choose a time.'),
  };
  function check(id) {
    const msg = validators[id]($(id).value);
    if (msg) setError(id, msg); else clearError(id);
    return !msg;
  }
  Object.keys(validators).forEach((id) => {
    const f = $(id);
    f.addEventListener('blur', () => { if (f.value) check(id); });
    f.addEventListener('input', () => { if (f.getAttribute('aria-invalid')) check(id); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = Object.keys(validators).filter((id) => !check(id));
    if (bad.length) { $(bad[0]).focus(); return; }
    const data = new FormData(form);
    const first = data.get('name').trim().split(/\s+/)[0];
    const when = new Date(`${data.get('date')}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    const guests = data.get('guests');
    $('bookSuccessTitle').textContent = `See you soon, ${first}!`;
    $('bookSuccessText').textContent = `Your table for ${guests} is booked for ${when} at ${data.get('time')}. This is a demo, so no email was sent and no table was reserved.`;
    form.hidden = true;
    $('bookSuccess').hidden = false;
    $('bookSuccess').focus({ preventScroll: true });
  });
  $('bookAgain').addEventListener('click', () => {
    form.reset();
    fillBookingTimes();
    $('bookSuccess').hidden = true;
    form.hidden = false;
    $('bName').focus();
  });

  /* Open now --------------------------------------------------------------- */
  function renderOpenNow() {
    const now = klNow();
    const day = now.getDay();
    const m = minutes(now);
    const [open, close] = HOURS[day];
    const out = $('openNow');
    if (m >= open && m < close) {
      out.textContent = `Open now, until ${clock(close)}`;
      out.style.setProperty('--dot', 'var(--success)');
    } else {
      const next = m < open ? `today at ${clock(open)}` : `tomorrow at ${clock(HOURS[(day + 1) % 7][0])}`;
      out.textContent = `Closed now, opens ${next}`;
      out.style.setProperty('--dot', 'var(--caramel)');
    }
    const row = document.querySelector(`#hoursTable tr[data-day="${day}"]`);
    if (row) row.classList.add('is-today');
  }

  /* Newsletter ------------------------------------------------------------- */
  $('newsletter').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('nlEmail');
    const msg = $('newsletterMsg');
    if (!validators.bEmail(input.value)) {
      msg.textContent = "Thanks! You're on the list.";
      input.value = '';
    } else {
      msg.textContent = 'Please enter a valid email address.';
      input.focus();
    }
  });

  /* Boot ------------------------------------------------------------------- */
  $('year').textContent = today.getFullYear();
  renderMenu();
  renderOrderList();
  fillPickup();
  setMode(state.mode);
  renderOpenNow();
})();
