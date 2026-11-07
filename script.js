/* Shared behaviour: nav, fade-in on scroll, menu tabs, open-now status. */
(function () {
  'use strict';

  /* Nav: see-through over the dark top section, solid after it */
  const nav = document.getElementById('nav');
  const top = document.querySelector('.hero, .page-hero, .not-found');
  function updateNav() {
    nav.classList.toggle('is-solid', top.getBoundingClientRect().bottom <= nav.offsetHeight + 1);
  }
  addEventListener('scroll', updateNav, { passive: true });
  addEventListener('resize', updateNav, { passive: true });
  updateNav();

  /* Mobile menu */
  const toggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
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
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* Fade in and slide up as sections enter the screen */
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      reveal.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  document.querySelectorAll('.reveal').forEach((node) => {
    const siblings = [...node.parentElement.children].filter((n) => n.classList.contains('reveal'));
    node.style.setProperty('--d', `${Math.min(siblings.indexOf(node), 5) * 80}ms`);
    reveal.observe(node);
  });

  /* Menu tabs. Without JavaScript every category simply shows. */
  const tabs = [...document.querySelectorAll('.tab')];
  function selectTab(tab) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      selectTab(next);
      next.focus();
    });
  });
  if (tabs.length) selectTab(tabs[0]);

  /* Open now, in Kuala Lumpur time */
  const openNow = document.getElementById('openNow');
  if (openNow) {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
    const day = now.getDay();
    const hours = (d) => (d === 0 || d === 6 ? [480, 1320, '8am', '10pm'] : [450, 1260, '7:30am', '9pm']);
    const [open, close, opens, closes] = hours(day);
    const minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes >= open && minutes < close) {
      openNow.textContent = `Open now, until ${closes}`;
    } else {
      const next = minutes < open ? `today at ${opens}` : `tomorrow at ${hours((day + 1) % 7)[2]}`;
      openNow.textContent = `Closed now, opens ${next}`;
      openNow.style.setProperty('--dot', 'var(--color-accent)');
    }
    document.querySelectorAll('#hoursTable tr').forEach((row) => {
      row.classList.toggle('is-today', row.dataset.days.split(',').includes(String(day)));
    });
  }
})();
