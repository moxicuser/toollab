const navigation = document.getElementById('site-navigation');
const openButton = document.querySelector('[data-nav-open]');
const closeControls = document.querySelectorAll('[data-nav-close]');
const backdrop = document.querySelector('.nav-scrim');
const languageStorageKey = 'toollab-language';
const languages = {
  en: {
    name: 'English', direction: 'ltr', menu: 'Tools and pages', categories: 'Categories', allTools: 'All tools',
    finance: 'Finance Tools', everyday: 'Everyday Utilities', documents: 'Documents & Images',
    currency: 'Currency Converter', age: 'Age Calculator', date: 'Date Difference', units: 'Unit Converter',
    qr: 'QR Generator', compressor: 'Image Compressor', resizer: 'Image Resizer', converter: 'File Converter',
    how: 'How it works', faq: 'FAQ', about: 'About', contact: 'Contact', privacy: 'Privacy Policy',
    terms: 'Terms of Use', guides: 'Guides', appearance: 'Appearance', language: 'Language',
    light: 'Light', dark: 'Dark', system: 'System', open: 'Open navigation', close: 'Close navigation',
    tagline: 'Free browser-based tools for everyday tasks, documents, and images.',
    copyright: '© 2026 ToolLab. All rights reserved.', rates: 'Currency reference rates by ',
    toolCategories: 'Tool categories', allToolsLabel: 'All tools', aboutToolLab: 'About ToolLab',
  },
  es: {
    name: 'Español', direction: 'ltr', menu: 'Herramientas y páginas', categories: 'Categorías', allTools: 'Todas las herramientas',
    finance: 'Finanzas', everyday: 'Utilidades diarias', documents: 'Documentos e imágenes',
    currency: 'Conversor de divisas', age: 'Calculadora de edad', date: 'Diferencia entre fechas', units: 'Conversor de unidades',
    qr: 'Generador de códigos QR', compressor: 'Compresor de imágenes', resizer: 'Redimensionador de imágenes', converter: 'Conversor de archivos',
    how: 'Cómo funciona', faq: 'Preguntas frecuentes', about: 'Acerca de', contact: 'Contacto', privacy: 'Política de privacidad',
    terms: 'Términos de uso', guides: 'Guías', appearance: 'Apariencia', language: 'Idioma',
    light: 'Claro', dark: 'Oscuro', system: 'Sistema', open: 'Abrir navegación', close: 'Cerrar navegación',
    tagline: 'Herramientas gratuitas en el navegador para tareas cotidianas, documentos e imágenes.',
    copyright: '© 2026 ToolLab. Todos los derechos reservados.', rates: 'Tipos de cambio de referencia de ',
    toolCategories: 'Categorías de herramientas', allToolsLabel: 'Todas las herramientas', aboutToolLab: 'Acerca de ToolLab',
  },
  fr: {
    name: 'Français', direction: 'ltr', menu: 'Outils et pages', categories: 'Catégories', allTools: 'Tous les outils',
    finance: 'Finance', everyday: 'Outils du quotidien', documents: 'Documents et images',
    currency: 'Convertisseur de devises', age: 'Calculateur d’âge', date: 'Différence entre dates', units: 'Convertisseur d’unités',
    qr: 'Générateur de QR code', compressor: 'Compresseur d’images', resizer: 'Redimensionner une image', converter: 'Convertisseur de fichiers',
    how: 'Fonctionnement', faq: 'FAQ', about: 'À propos', contact: 'Contact', privacy: 'Confidentialité',
    terms: 'Conditions d’utilisation', guides: 'Guides', appearance: 'Apparence', language: 'Langue',
    light: 'Clair', dark: 'Sombre', system: 'Système', open: 'Ouvrir la navigation', close: 'Fermer la navigation',
    tagline: 'Des outils gratuits dans le navigateur pour les tâches courantes, les documents et les images.',
    copyright: '© 2026 ToolLab. Tous droits réservés.', rates: 'Taux de change de référence par ',
    toolCategories: 'Catégories d’outils', allToolsLabel: 'Tous les outils', aboutToolLab: 'À propos de ToolLab',
  },
  pt: {
    name: 'Português', direction: 'ltr', menu: 'Ferramentas e páginas', categories: 'Categorias', allTools: 'Todas as ferramentas',
    finance: 'Finanças', everyday: 'Utilidades do dia a dia', documents: 'Documentos e imagens',
    currency: 'Conversor de moedas', age: 'Calculadora de idade', date: 'Diferença entre datas', units: 'Conversor de unidades',
    qr: 'Gerador de QR Code', compressor: 'Compressor de imagens', resizer: 'Redimensionador de imagens', converter: 'Conversor de arquivos',
    how: 'Como funciona', faq: 'Perguntas frequentes', about: 'Sobre', contact: 'Contato', privacy: 'Política de privacidade',
    terms: 'Termos de uso', guides: 'Guias', appearance: 'Aparência', language: 'Idioma',
    light: 'Claro', dark: 'Escuro', system: 'Sistema', open: 'Abrir navegação', close: 'Fechar navegação',
    tagline: 'Ferramentas gratuitas no navegador para tarefas diárias, documentos e imagens.',
    copyright: '© 2026 ToolLab. Todos os direitos reservados.', rates: 'Taxas de câmbio de referência por ',
    toolCategories: 'Categorias de ferramentas', allToolsLabel: 'Todas as ferramentas', aboutToolLab: 'Sobre o ToolLab',
  },
  ar: {
    name: 'العربية', direction: 'rtl', menu: 'الأدوات والصفحات', categories: 'الفئات', allTools: 'كل الأدوات',
    finance: 'أدوات مالية', everyday: 'أدوات يومية', documents: 'المستندات والصور',
    currency: 'محول العملات', age: 'حاسبة العمر', date: 'الفرق بين تاريخين', units: 'محول الوحدات',
    qr: 'منشئ رموز QR', compressor: 'ضغط الصور', resizer: 'تغيير حجم الصور', converter: 'محول الملفات',
    how: 'طريقة العمل', faq: 'الأسئلة الشائعة', about: 'حول الموقع', contact: 'اتصل بنا', privacy: 'سياسة الخصوصية',
    terms: 'شروط الاستخدام', guides: 'أدلة', appearance: 'المظهر', language: 'اللغة',
    light: 'فاتح', dark: 'داكن', system: 'النظام', open: 'فتح القائمة', close: 'إغلاق القائمة',
    tagline: 'أدوات مجانية في المتصفح للمهام اليومية والمستندات والصور.',
    copyright: '© 2026 ToolLab. جميع الحقوق محفوظة.', rates: 'أسعار الصرف المرجعية من ',
    toolCategories: 'فئات الأدوات', allToolsLabel: 'كل الأدوات', aboutToolLab: 'حول ToolLab',
  },
  hi: {
    name: 'हिन्दी', direction: 'ltr', menu: 'टूल और पेज', categories: 'श्रेणियाँ', allTools: 'सभी टूल',
    finance: 'वित्त टूल', everyday: 'रोज़मर्रा के टूल', documents: 'दस्तावेज़ और चित्र',
    currency: 'मुद्रा परिवर्तक', age: 'आयु कैलकुलेटर', date: 'तिथियों का अंतर', units: 'इकाई परिवर्तक',
    qr: 'QR कोड जनरेटर', compressor: 'चित्र संपीड़क', resizer: 'चित्र का आकार बदलें', converter: 'फ़ाइल परिवर्तक',
    how: 'कैसे काम करता है', faq: 'अक्सर पूछे जाने वाले प्रश्न', about: 'परिचय', contact: 'संपर्क', privacy: 'गोपनीयता नीति',
    terms: 'उपयोग की शर्तें', guides: 'गाइड', appearance: 'दिखावट', language: 'भाषा',
    light: 'लाइट', dark: 'डार्क', system: 'सिस्टम', open: 'नेविगेशन खोलें', close: 'नेविगेशन बंद करें',
    tagline: 'रोज़मर्रा के कामों, दस्तावेज़ों और चित्रों के लिए मुफ़्त ब्राउज़र टूल।',
    copyright: '© 2026 ToolLab. सर्वाधिकार सुरक्षित।', rates: 'मुद्रा संदर्भ दरें: ',
    toolCategories: 'टूल श्रेणियाँ', allToolsLabel: 'सभी टूल', aboutToolLab: 'ToolLab के बारे में',
  },
  'zh-CN': {
    name: '简体中文', direction: 'ltr', menu: '工具和页面', categories: '分类', allTools: '所有工具',
    finance: '金融工具', everyday: '日常工具', documents: '文档和图片',
    currency: '货币换算器', age: '年龄计算器', date: '日期间隔', units: '单位换算器',
    qr: '二维码生成器', compressor: '图片压缩器', resizer: '图片尺寸调整', converter: '文件转换器',
    how: '使用说明', faq: '常见问题', about: '关于', contact: '联系', privacy: '隐私政策',
    terms: '使用条款', guides: '指南', appearance: '外观', language: '语言',
    light: '浅色', dark: '深色', system: '跟随系统', open: '打开导航', close: '关闭导航',
    tagline: '适用于日常任务、文档和图片的免费浏览器工具。',
    copyright: '© 2026 ToolLab。保留所有权利。', rates: '汇率参考数据来自 ',
    toolCategories: '工具分类', allToolsLabel: '所有工具', aboutToolLab: '关于 ToolLab',
  },
};
const languageIds = Object.keys(languages);
const languageSourceKeys = {
  'Tools and pages': 'menu',
  Categories: 'categories',
  'All tools': 'allTools',
  'Finance Tools': 'finance',
  'Everyday Utilities': 'everyday',
  'Documents & Images': 'documents',
  'Currency Converter': 'currency',
  'Age Calculator': 'age',
  'Date Difference': 'date',
  'Unit Converter': 'units',
  'QR Generator': 'qr',
  'Image Compressor': 'compressor',
  'Image Resizer': 'resizer',
  'File Converter': 'converter',
  'How it works': 'how',
  FAQ: 'faq',
  About: 'about',
  Contact: 'contact',
  'Privacy Policy': 'privacy',
  'Terms of Use': 'terms',
  Guides: 'guides',
};
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

const languageControl = document.createElement('div');
languageControl.className = 'language-control';
const languageLabel = document.createElement('label');
languageLabel.className = 'theme-control-label';
languageLabel.htmlFor = 'site-language';
const languageSelect = document.createElement('select');
languageSelect.className = 'language-select';
languageSelect.id = 'site-language';
languageIds.forEach((language) => {
  languageSelect.add(new Option(languages[language].name, language));
});
languageControl.append(languageLabel, languageSelect);
themeControl.after(languageControl);

let selectedLanguage = 'en';
try {
  const storedLanguage = localStorage.getItem(languageStorageKey);
  if (languageIds.includes(storedLanguage)) {
    selectedLanguage = storedLanguage;
  }
} catch {
  selectedLanguage = 'en';
}

function translateSharedInterface(language) {
  const messages = languages[language] || languages.en;
  const translatable = document.querySelectorAll(
    '.sidebar-header span, .sidebar-section-label, .nav-links a, .footer-brand p, .footer-group h2, .footer-group a'
  );

  translatable.forEach((element) => {
    const sourceText = element.dataset.englishText || element.textContent.trim();
    element.dataset.englishText = sourceText;
    const key = languageSourceKeys[sourceText];
    if (key) {
      element.textContent = messages[key];
    }
  });

  const footerNavigationLabels = document.querySelectorAll('.footer-group[aria-label]');
  footerNavigationLabels.forEach((group) => {
    const original = group.dataset.englishLabel || group.getAttribute('aria-label');
    group.dataset.englishLabel = original;
    if (original === 'Tool categories') group.setAttribute('aria-label', messages.toolCategories);
    if (original === 'All tools') group.setAttribute('aria-label', messages.allToolsLabel);
    if (original === 'About ToolLab') group.setAttribute('aria-label', messages.aboutToolLab);
  });

  themeLabel.textContent = messages.appearance;
  themeControl.setAttribute('aria-label', messages.appearance);
  themeButtons.forEach((button) => {
    button.textContent = messages[button.dataset.themeChoice];
  });
  languageLabel.textContent = messages.language;
  languageSelect.setAttribute('aria-label', messages.language);
  openButton.setAttribute('aria-label', openButton.getAttribute('aria-expanded') === 'true' ? messages.close : messages.open);

  const closeButton = navigation.querySelector('.nav-close');
  closeButton?.setAttribute('aria-label', messages.close);
  navigation.setAttribute('lang', language);
  navigation.dir = messages.direction;
  const footer = document.querySelector('.footer');
  footer?.setAttribute('lang', language);
  if (footer) {
    footer.dir = messages.direction;
    const bottomLines = footer.querySelectorAll('.footer-bottom p');
    if (bottomLines[0]) bottomLines[0].textContent = messages.copyright;
    if (bottomLines[1]?.firstChild?.nodeType === Node.TEXT_NODE) {
      bottomLines[1].firstChild.nodeValue = messages.rates;
    }
  }
}

function applyLanguage(language, persist = false) {
  selectedLanguage = languageIds.includes(language) ? language : 'en';
  languageSelect.value = selectedLanguage;
  translateSharedInterface(selectedLanguage);
  if (persist) {
    try {
      localStorage.setItem(languageStorageKey, selectedLanguage);
    } catch {
      return;
    }
  }
}

languageSelect.addEventListener('change', () => applyLanguage(languageSelect.value, true));
applyLanguage(selectedLanguage);

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
  openButton.setAttribute('aria-label', isOpen ? languages[selectedLanguage].close : languages[selectedLanguage].open);
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