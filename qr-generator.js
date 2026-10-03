const form = document.getElementById('qr-form');
const typeSelect = document.getElementById('qr-type');
const fieldGroups = document.querySelectorAll('.qr-field');
const sizeSelect = document.getElementById('qr-size');
const qrPreview = document.getElementById('qr-preview');
const qrStatus = document.getElementById('qr-status');
const encodedDetails = document.getElementById('encoded-details');
const encodedContent = document.getElementById('encoded-content');
const copyButton = document.getElementById('copy-btn');
const downloadButton = document.getElementById('download-btn');
const resetButton = document.getElementById('reset-btn');

const socialUrls = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  tiktok: 'https://www.tiktok.com/@',
  youtube: 'https://www.youtube.com/@',
  linkedin: 'https://www.linkedin.com/in/',
  x: 'https://x.com/',
  snapchat: 'https://www.snapchat.com/add/',
};

let generatedContent = '';

function getField(id) {
  return document.getElementById(id).value.trim();
}

function requireValue(value, label) {
  if (!value) {
    throw new Error(`${label} is required.`);
  }
  return value;
}

function makeHttpUrl(value) {
  const url = new URL(requireValue(value, 'A link'));
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Enter a link that starts with http:// or https://.');
  }
  return url.toString();
}

function escapeWifiValue(value) {
  return value.replace(/[\\;,:]/g, '\\$&');
}

function makeContent() {
  const type = typeSelect.value;

  if (type === 'link') {
    return makeHttpUrl(getField('link-url'));
  }

  if (type === 'whatsapp') {
    const phone = getField('whatsapp-number').replace(/\D/g, '');
    if (phone.length < 7 || phone.length > 15) {
      throw new Error('Enter a WhatsApp number with its country code.');
    }
    const message = getField('whatsapp-message');
    const query = message ? `?text=${encodeURIComponent(message)}` : '';
    return `https://wa.me/${phone}${query}`;
  }

  if (type === 'social') {
    const profile = requireValue(getField('social-profile'), 'A profile name or URL');
    if (/^https?:\/\//i.test(profile)) {
      return makeHttpUrl(profile);
    }
    const handle = profile.replace(/^@/, '');
    if (!/^[\w.-]+$/.test(handle)) {
      throw new Error('Enter a valid username or full profile URL.');
    }
    return `${socialUrls[getField('social-platform')] || socialUrls.instagram}${encodeURIComponent(handle)}`;
  }

  if (type === 'email') {
    const email = requireValue(getField('email-address'), 'An email address');
    const subject = getField('email-subject');
    const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
    return `mailto:${email}${query}`;
  }

  if (type === 'phone') {
    const phone = requireValue(getField('phone-number'), 'A phone number');
    if (!/^[+\d][\d\s().-]{5,24}$/.test(phone)) {
      throw new Error('Enter a valid phone number.');
    }
    return `tel:${phone.replace(/[\s().-]/g, '')}`;
  }

  if (type === 'wifi') {
    const name = escapeWifiValue(requireValue(getField('wifi-name'), 'A network name'));
    const security = getField('wifi-security');
    const password = getField('wifi-password');
    if (security !== 'nopass' && !password) {
      throw new Error('Enter the Wi-Fi password or choose No password.');
    }
    const passwordPart = security === 'nopass' ? '' : `P:${escapeWifiValue(password)};`;
    const hidden = document.getElementById('wifi-hidden').checked ? 'true' : 'false';
    return `WIFI:T:${security};S:${name};${passwordPart}H:${hidden};;`;
  }

  return requireValue(getField('plain-text'), 'Text');
}

function updateVisibleFields() {
  fieldGroups.forEach((group) => {
    const visible = group.dataset.field === typeSelect.value;
    group.hidden = !visible;
    group.querySelectorAll('input, select, textarea').forEach((input) => {
      input.disabled = !visible;
    });
  });

  const passwordGroup = document.getElementById('wifi-password-group');
  const passwordInput = document.getElementById('wifi-password');
  const passwordNeeded = typeSelect.value === 'wifi' && getField('wifi-security') !== 'nopass';
  passwordGroup.hidden = !passwordNeeded;
  passwordInput.disabled = !passwordNeeded;
}

function clearGeneratedCode() {
  qrPreview.replaceChildren();
  const placeholder = document.createElement('span');
  placeholder.id = 'qr-placeholder';
  placeholder.textContent = 'Your QR code will appear here';
  qrPreview.append(placeholder);
  generatedContent = '';
  encodedContent.textContent = '';
  encodedDetails.hidden = true;
  copyButton.disabled = true;
  downloadButton.disabled = true;
}

function handleSubmit(event) {
  event.preventDefault();

  try {
    if (typeof QRCode === 'undefined') {
      throw new Error('QR generator library did not load. Check your connection and try again.');
    }

    const content = makeContent();
    const size = Number(sizeSelect.value);
    qrPreview.replaceChildren();
    new QRCode(qrPreview, {
      text: content,
      width: size,
      height: size,
      colorDark: '#111827',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });

    generatedContent = content;
    encodedContent.textContent = content;
    encodedDetails.hidden = false;
    copyButton.disabled = false;
    downloadButton.disabled = false;
    qrStatus.textContent = 'QR code generated in your browser.';
  } catch (error) {
    clearGeneratedCode();
    qrStatus.textContent = error.message || 'Could not generate this QR code. Check the entered content.';
  }
}

async function copyContent() {
  if (!generatedContent) {
    return;
  }

  try {
    await navigator.clipboard.writeText(generatedContent);
    qrStatus.textContent = 'Encoded content copied.';
  } catch {
    qrStatus.textContent = 'Could not copy content. Select it in Encoded content to copy manually.';
  }
}

function downloadCode() {
  const canvas = qrPreview.querySelector('canvas');
  if (!canvas || !generatedContent) {
    qrStatus.textContent = 'Generate a QR code before downloading.';
    return;
  }

  const link = document.createElement('a');
  link.download = 'toollab-qr-code.png';
  link.href = canvas.toDataURL('image/png');
  document.body.append(link);
  link.click();
  link.remove();
}

function resetForm() {
  form.reset();
  updateVisibleFields();
  clearGeneratedCode();
  qrStatus.textContent = '';
}

typeSelect.addEventListener('change', () => {
  updateVisibleFields();
  clearGeneratedCode();
  qrStatus.textContent = '';
});
document.getElementById('wifi-security').addEventListener('change', updateVisibleFields);
sizeSelect.addEventListener('change', clearGeneratedCode);
form.addEventListener('submit', handleSubmit);
copyButton.addEventListener('click', copyContent);
downloadButton.addEventListener('click', downloadCode);
resetButton.addEventListener('click', resetForm);

updateVisibleFields();
clearGeneratedCode();