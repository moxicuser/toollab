const navigation = document.getElementById('site-navigation');
const openButton = document.querySelector('[data-nav-open]');
const closeControls = document.querySelectorAll('[data-nav-close]');
const backdrop = document.querySelector('.nav-scrim');
const themeStorageKey = 'toollab-theme';
const themeChoices = ['light', 'dark', 'system'];
const themeControl = document.createElement('div');
themeControl.className = 'theme-control';
themeControl.setAttribute('role', 'group');
themeControl.setAttribute('aria-label', 'Color theme');

const themeLabel = document.createElement('span');
themeLabel.className = 'theme-control-label';
themeLabel.textContent = 'Appearance';
themeControl.append(themeLabel);

const themeButtons = themeChoices.map((choice) => {
  const button = document.createElement('button');
  button.className = 'theme-option';
  button.type = 'button';
  button.dataset.themeChoice = choice;
  button.textContent = choice[0].toUpperCase() + choice.slice(1);
  button.setAttribute('aria-pressed', 'false');
  themeControl.append(button);
  return button;
});

navigation.querySelector('.sidebar-header')?.after(themeControl);

let selectedTheme = 'system';
try {
  const storedTheme = localStorage.getItem(themeStorageKey);
  if (themeChoices.includes(storedTheme)) {
    selectedTheme = storedTheme;
  }
} catch {
  selectedTheme = 'system';
}

function applyTheme(choice, persist = false) {
  selectedTheme = choice;
  const useDark = choice === 'dark' ||
    (choice === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.documentElement.dataset.theme = useDark ? 'dark' : 'light';
  themeButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === choice));
  });

  if (persist) {
    try {
      localStorage.setItem(themeStorageKey, choice);
    } catch {
      return;
    }
  }
}

themeButtons.forEach((button) => {
  button.addEventListener('click', () => applyTheme(button.dataset.themeChoice, true));
});

applyTheme(selectedTheme);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (selectedTheme === 'system') {
    applyTheme('system');
  }
});

function setNavigationOpen(isOpen) {
  navigation.classList.toggle('is-open', isOpen);
  navigation.setAttribute('aria-hidden', String(!isOpen));
  navigation.inert = !isOpen;
  openButton.setAttribute('aria-expanded', String(isOpen));
  openButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  backdrop.hidden = !isOpen;
  backdrop.classList.toggle('is-open', isOpen);
  document.documentElement.classList.toggle('nav-open', isOpen);
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

navigation.addEventListener('wheel', (event) => {
  if (openButton.getAttribute('aria-expanded') !== 'true' || event.deltaY === 0) {
    return;
  }

  event.preventDefault();
  navigation.scrollTop += event.deltaY;
}, { passive: false });

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