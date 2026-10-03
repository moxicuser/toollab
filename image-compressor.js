const form = document.getElementById('compressor-form');
const fileInput = document.getElementById('image-file');
const formatSelect = document.getElementById('output-format');
const qualityInput = document.getElementById('quality');
const qualityValue = document.getElementById('quality-value');
const qualityControl = document.getElementById('quality-control');
const compressButton = document.getElementById('compress-btn');
const downloadButton = document.getElementById('download-btn');
const resetButton = document.getElementById('reset-btn');
const originalPanel = document.getElementById('original-panel');
const originalPreview = document.getElementById('original-preview');
const originalDetails = document.getElementById('original-details');
const compressedPanel = document.getElementById('compressed-panel');
const compressedPreview = document.getElementById('compressed-preview');
const compressedDetails = document.getElementById('compressed-details');
const status = document.getElementById('compress-status');

const maximumFileSize = 20 * 1024 * 1024;
let selectedFile;
let originalUrl;
let compressedUrl;
let compressedBlob;

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function clearCompressedOutput() {
  if (compressedUrl) {
    URL.revokeObjectURL(compressedUrl);
    compressedUrl = undefined;
  }
  compressedBlob = undefined;
  compressedPreview.removeAttribute('src');
  compressedPanel.hidden = true;
  downloadButton.disabled = true;
}

function updateQualityControl() {
  const isPng = formatSelect.value === 'image/png';
  qualityInput.disabled = isPng;
  qualityControl.classList.toggle('control-disabled', isPng);
  qualityValue.value = `${qualityInput.value}%`;
  qualityValue.textContent = `${qualityInput.value}%`;
}

function handleFileChange() {
  clearCompressedOutput();
  selectedFile = fileInput.files?.[0];
  status.textContent = '';
  originalPanel.hidden = true;
  compressButton.disabled = true;

  if (originalUrl) {
    URL.revokeObjectURL(originalUrl);
    originalUrl = undefined;
  }

  if (!selectedFile) {
    return;
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
    status.textContent = 'Choose a JPEG, PNG, or WebP image.';
    return;
  }
  if (selectedFile.size > maximumFileSize) {
    status.textContent = 'Choose an image smaller than 20 MB.';
    return;
  }

  originalUrl = URL.createObjectURL(selectedFile);
  originalPreview.src = originalUrl;
  originalPreview.onload = () => {
    originalDetails.textContent = `${originalPreview.naturalWidth} × ${originalPreview.naturalHeight} px · ${formatBytes(selectedFile.size)}`;
    originalPanel.hidden = false;
    compressButton.disabled = false;
  };
  originalPreview.onerror = () => {
    status.textContent = 'This image could not be opened by your browser.';
  };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob || blob.type !== type) {
        reject(new Error('This browser could not create that output format. Try JPEG, PNG, or WebP.'));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

async function compressImage(event) {
  event.preventDefault();
  if (!selectedFile || compressButton.disabled) {
    return;
  }

  clearCompressedOutput();
  compressButton.disabled = true;
  status.textContent = 'Compressing image in your browser...';

  try {
    const image = originalPreview;

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Your browser could not prepare this image.');
    }
    if (formatSelect.value === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0);

    compressedBlob = await canvasToBlob(
      canvas,
      formatSelect.value,
      Number(qualityInput.value) / 100
    );
    compressedUrl = URL.createObjectURL(compressedBlob);
    compressedPreview.src = compressedUrl;
    const difference = selectedFile.size - compressedBlob.size;
    const change = difference >= 0
      ? `${((difference / selectedFile.size) * 100).toFixed(1)}% smaller`
      : `${((Math.abs(difference) / selectedFile.size) * 100).toFixed(1)}% larger`;
    compressedDetails.textContent = `${canvas.width} × ${canvas.height} px · ${formatBytes(compressedBlob.size)} · ${change}`;
    compressedPanel.hidden = false;
    downloadButton.disabled = false;
    status.textContent = 'Compression complete. Compare the file sizes before downloading.';
  } catch (error) {
    status.textContent = error.message || 'Could not compress this image.';
  } finally {
    compressButton.disabled = false;
  }
}

function downloadCompressedImage() {
  if (!compressedBlob || !compressedUrl) {
    return;
  }
  const extension = formatSelect.value.split('/')[1].replace('jpeg', 'jpg');
  const filename = selectedFile.name.replace(/\.[^.]+$/, '');
  const link = document.createElement('a');
  link.href = compressedUrl;
  link.download = `${filename}-compressed.${extension}`;
  document.body.append(link);
  link.click();
  link.remove();
}

function resetForm() {
  form.reset();
  selectedFile = undefined;
  if (originalUrl) {
    URL.revokeObjectURL(originalUrl);
    originalUrl = undefined;
  }
  originalPreview.removeAttribute('src');
  originalPanel.hidden = true;
  clearCompressedOutput();
  compressButton.disabled = true;
  status.textContent = '';
  updateQualityControl();
}

fileInput.addEventListener('change', handleFileChange);
formatSelect.addEventListener('change', () => {
  updateQualityControl();
  clearCompressedOutput();
});
qualityInput.addEventListener('input', () => {
  updateQualityControl();
  clearCompressedOutput();
});
form.addEventListener('submit', compressImage);
downloadButton.addEventListener('click', downloadCompressedImage);
resetButton.addEventListener('click', resetForm);

updateQualityControl();