const form = document.getElementById('resizer-form');
const fileInput = document.getElementById('image-file');
const widthInput = document.getElementById('image-width');
const heightInput = document.getElementById('image-height');
const keepAspectInput = document.getElementById('keep-aspect');
const formatSelect = document.getElementById('output-format');
const qualityInput = document.getElementById('quality');
const qualityValue = document.getElementById('quality-value');
const qualityControl = document.getElementById('quality-control');
const resizeButton = document.getElementById('resize-btn');
const downloadButton = document.getElementById('download-btn');
const resetButton = document.getElementById('reset-btn');
const originalPanel = document.getElementById('original-panel');
const originalPreview = document.getElementById('original-preview');
const originalDetails = document.getElementById('original-details');
const resizedPanel = document.getElementById('resized-panel');
const resizedPreview = document.getElementById('resized-preview');
const resizedDetails = document.getElementById('resized-details');
const status = document.getElementById('resize-status');

const maximumFileSize = 20 * 1024 * 1024;
let selectedFile;
let originalUrl;
let resizedUrl;
let resizedBlob;
let originalWidth;
let originalHeight;

function getOutputType() {
  return formatSelect.value === 'source' ? selectedFile?.type : formatSelect.value;
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function clearResizedOutput() {
  if (resizedUrl) {
    URL.revokeObjectURL(resizedUrl);
    resizedUrl = undefined;
  }
  resizedBlob = undefined;
  resizedPreview.removeAttribute('src');
  resizedPanel.hidden = true;
  downloadButton.disabled = true;
}

function updateQualityControl() {
  const isPng = getOutputType() === 'image/png';
  qualityInput.disabled = isPng;
  qualityControl.classList.toggle('control-disabled', isPng);
  qualityValue.value = `${qualityInput.value}%`;
  qualityValue.textContent = `${qualityInput.value}%`;
}

function updateDimensions(changedInput) {
  if (!keepAspectInput.checked || !originalWidth || !originalHeight) {
    clearResizedOutput();
    return;
  }

  const ratio = originalWidth / originalHeight;
  if (changedInput === widthInput && widthInput.value) {
    heightInput.value = Math.max(1, Math.round(Number(widthInput.value) / ratio));
  } else if (changedInput === heightInput && heightInput.value) {
    widthInput.value = Math.max(1, Math.round(Number(heightInput.value) * ratio));
  }
  clearResizedOutput();
}

function handleFileChange() {
  clearResizedOutput();
  selectedFile = fileInput.files?.[0];
  status.textContent = '';
  originalPanel.hidden = true;
  resizeButton.disabled = true;

  if (originalUrl) {
    URL.revokeObjectURL(originalUrl);
    originalUrl = undefined;
  }
  widthInput.disabled = true;
  heightInput.disabled = true;
  keepAspectInput.disabled = true;
  originalWidth = undefined;
  originalHeight = undefined;

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
    originalWidth = originalPreview.naturalWidth;
    originalHeight = originalPreview.naturalHeight;
    widthInput.value = originalWidth;
    heightInput.value = originalHeight;
    widthInput.disabled = false;
    heightInput.disabled = false;
    keepAspectInput.disabled = false;
    originalDetails.textContent = `${originalWidth} × ${originalHeight} px · ${formatBytes(selectedFile.size)}`;
    originalPanel.hidden = false;
    resizeButton.disabled = false;
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

async function resizeImage(event) {
  event.preventDefault();
  if (!selectedFile || resizeButton.disabled) {
    return;
  }

  const width = Number(widthInput.value);
  const height = Number(heightInput.value);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 10000 || height > 10000) {
    status.textContent = 'Enter whole-number dimensions between 1 and 10,000 pixels.';
    return;
  }

  clearResizedOutput();
  resizeButton.disabled = true;
  status.textContent = 'Resizing image in your browser...';

  try {
    const image = originalPreview;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Your browser could not prepare this image.');
    }
    const outputType = getOutputType();
    if (outputType === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(image, 0, 0, width, height);

    resizedBlob = await canvasToBlob(canvas, outputType, Number(qualityInput.value) / 100);
    resizedUrl = URL.createObjectURL(resizedBlob);
    resizedPreview.src = resizedUrl;
    resizedDetails.textContent = `${width} × ${height} px · ${formatBytes(resizedBlob.size)}`;
    resizedPanel.hidden = false;
    downloadButton.disabled = false;
    status.textContent = 'Resize complete. Review the preview before downloading.';
  } catch (error) {
    status.textContent = error.message || 'Could not resize this image.';
  } finally {
    resizeButton.disabled = false;
  }
}

function downloadResizedImage() {
  if (!resizedBlob || !resizedUrl) {
    return;
  }
  const extension = getOutputType().split('/')[1].replace('jpeg', 'jpg');
  const filename = selectedFile.name.replace(/\.[^.]+$/, '');
  const link = document.createElement('a');
  link.href = resizedUrl;
  link.download = `${filename}-${widthInput.value}x${heightInput.value}.${extension}`;
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
  originalWidth = undefined;
  originalHeight = undefined;
  widthInput.disabled = true;
  heightInput.disabled = true;
  keepAspectInput.disabled = true;
  resizeButton.disabled = true;
  status.textContent = '';
  clearResizedOutput();
  updateQualityControl();
}

fileInput.addEventListener('change', handleFileChange);
widthInput.addEventListener('input', () => updateDimensions(widthInput));
heightInput.addEventListener('input', () => updateDimensions(heightInput));
keepAspectInput.addEventListener('change', clearResizedOutput);
formatSelect.addEventListener('change', () => {
  updateQualityControl();
  clearResizedOutput();
});
qualityInput.addEventListener('input', () => {
  updateQualityControl();
  clearResizedOutput();
});
form.addEventListener('submit', resizeImage);
downloadButton.addEventListener('click', downloadResizedImage);
resetButton.addEventListener('click', resetForm);

updateQualityControl();