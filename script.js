/* Mobile menu: opens and closes the nav on phones. */
const navToggle = document.querySelector('.nav__toggle');
const navMenu = document.querySelector('.nav__menu');

function setMenu(open) {
  navMenu.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

navToggle.addEventListener('click', () => {
  setMenu(!navMenu.classList.contains('is-open'));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});
