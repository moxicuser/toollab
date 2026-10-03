const navigation = document.getElementById('site-navigation');
const openButton = document.querySelector('[data-nav-open]');
const closeControls = document.querySelectorAll('[data-nav-close]');
const backdrop = document.querySelector('.nav-scrim');

function setNavigationOpen(isOpen) {
  navigation.classList.toggle('is-open', isOpen);
  navigation.setAttribute('aria-hidden', String(!isOpen));
  navigation.inert = !isOpen;
  openButton.setAttribute('aria-expanded', String(isOpen));
  openButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  backdrop.hidden = !isOpen;
  backdrop.classList.toggle('is-open', isOpen);
  document.body.classList.toggle('nav-open', isOpen);

  if (isOpen) {
    navigation.querySelector('a, button')?.focus();
  } else {
    openButton.focus();
  }
}

openButton.addEventListener('click', () => {
  setNavigationOpen(openButton.getAttribute('aria-expanded') !== 'true');
});

closeControls.forEach((control) => {
  control.addEventListener('click', () => setNavigationOpen(false));
});

navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setNavigationOpen(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && openButton.getAttribute('aria-expanded') === 'true') {
    setNavigationOpen(false);
    return;
  }

  if (event.key !== 'Tab' || openButton.getAttribute('aria-expanded') !== 'true') {
    return;
  }

  const focusableElements = [...navigation.querySelectorAll('a, button:not(:disabled)')];
  const firstElement = focusableElements[0];
  const lastElement = focusableElements.at(-1);

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
});