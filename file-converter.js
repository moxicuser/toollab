const form = document.getElementById('file-converter-form');
const fileInput = document.getElementById('source-file');
const targetFormat = document.getElementById('target-format');
const convertButton = document.getElementById('convert-file-btn');
const resetButton = document.getElementById('reset-btn');
const sourceSummary = document.getElementById('source-summary');
const sourcePreview = document.getElementById('source-preview');
const imagePreview = document.getElementById('image-preview');
const conversionStatus = document.getElementById('conversion-status');
const downloadLink = document.getElementById('download-link');

const maximumFileSize = 25 * 1024 * 1024;
const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'webp']);
const supportedExtensions = new Set([
  'pdf', 'docx', 'txt', 'md', 'csv', 'tsv', 'json', 'xml', 'yaml', 'yml', 'html', 'htm', 'rtf',
  ...imageExtensions,
]);
let currentFile;
let currentSource;
let imageObjectUrl;
let downloadObjectUrl;

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function getExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function parseXmlNode(node) {
  const children = Array.from(node.children);
  const attributes = Array.from(node.attributes);
  const text = Array.from(node.childNodes)
    .filter((child) => child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE)
    .map((child) => child.nodeValue)
    .join('')
    .trim();

  if (!children.length && !attributes.length) {
    return text;
  }

  const result = {};
  attributes.forEach((attribute) => {
    result[`@_${attribute.name}`] = attribute.value;
  });

  children.forEach((child) => {
    const value = parseXmlNode(child);
    if (Object.hasOwn(result, child.nodeName)) {
      result[child.nodeName] = Array.isArray(result[child.nodeName])
        ? [...result[child.nodeName], value]
        : [result[child.nodeName], value];
    } else {
      result[child.nodeName] = value;
    }
  });

  if (text) {
    result['#text'] = text;
  }
  return result;
}

function parseXml(text) {
  const document = new DOMParser().parseFromString(text, 'application/xml');
  if (document.querySelector('parsererror')) {
    throw new Error('This XML file is not well formed.');
  }
  return { [document.documentElement.nodeName]: parseXmlNode(document.documentElement) };
}

function xmlEscape(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[character]);
}

function xmlName(value) {
  const name = String(value).replace(/^@_/, '').replace(/[^\w.:-]/g, '_');
  return /^[A-Za-z_:]/.test(name) ? name : `item_${name}`;
}

function valueToXml(name, value) {
  if (Array.isArray(value)) {
    return value.map((item) => valueToXml(name, item)).join('');
  }
  if (value && typeof value === 'object') {
    const attributes = Object.entries(value)
      .filter(([key]) => key.startsWith('@_'))
      .map(([key, attribute]) => ` ${xmlName(key)}="${xmlEscape(attribute)}"`)
      .join('');
    const inner = Object.entries(value)
      .filter(([key]) => !key.startsWith('@_'))
      .map(([key, child]) => key === '#text'
        ? xmlEscape(child)
        : valueToXml(key, child))
      .join('');
    return `<${name}${attributes}>${inner}</${name}>`;
  }
  return `<${name}>${xmlEscape(value ?? '')}</${name}>`;
}

function structuredData(source) {
  if (source.data !== undefined) {
    return source.data;
  }
  return { text: source.text };
}

function asTable(data) {
  function containsArray(value) {
    if (Array.isArray(value)) return true;
    if (!value || typeof value !== 'object') return false;
    return Object.values(value).some(containsArray);
  }

  function flattenRecord(value, prefix = '', row = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      row[prefix || 'value'] = value;
      return row;
    }

    Object.entries(value).forEach(([key, entry]) => {
      const column = prefix ? `${prefix}.${key}` : key;
      if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
        flattenRecord(entry, column, row);
      } else {
        row[column] = Array.isArray(entry) ? JSON.stringify(entry) : entry;
      }
    });
    return row;
  }

  function expandRows(value, prefix = '') {
    if (Array.isArray(value)) {
      return value.flatMap((item) => expandRows(item, prefix));
    }
    if (!value || typeof value !== 'object') {
      return [flattenRecord(value, prefix)];
    }

    const entries = Object.entries(value);
    const repeatedEntry = entries.find(([, entry]) => containsArray(entry));
    if (!repeatedEntry) {
      return [flattenRecord(value, prefix)];
    }

    const [key, repeatedValue] = repeatedEntry;
    const columnPrefix = prefix ? `${prefix}.${key}` : key;
    const baseRow = flattenRecord(Object.fromEntries(entries.filter(([entryKey]) => entryKey !== key)), prefix);
    return expandRows(repeatedValue, columnPrefix).map((row) => ({ ...baseRow, ...row }));
  }

  const rows = expandRows(data);
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return rows.map((row) => Object.fromEntries(columns.map((column) => [column, row[column] ?? ''])));
}

function toDelimited(data, delimiter) {
  return Papa.unparse(asTable(data), { delimiter, newline: '\r\n' });
}

function toSql(data) {
  const rows = asTable(data);
  if (!rows.length) return '';
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const table = 'converted_data';
  const identifiers = columns.map((column) => `"${column.replace(/"/g, '""')}"`).join(', ');
  const values = rows.map((row) => {
    const fields = columns.map((column) => {
      const value = row[column];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
      return `'${text.replace(/'/g, "''")}'`;
    });
    return `INSERT INTO "${table}" (${identifiers}) VALUES (${fields.join(', ')});`;
  });
  return values.join('\n');
}

function sourceText(source) {
  if (source.text !== undefined) return source.text;
  if (source.data !== undefined) return JSON.stringify(source.data, null, 2);
  return '';
}

function makePlainText(source, format) {
  if (format === 'json') return JSON.stringify(structuredData(source), null, 2);
  if (format === 'yaml') return jsyaml.dump(structuredData(source), { noRefs: true });
  if (format === 'xml') return `<?xml version="1.0" encoding="UTF-8"?>\n${valueToXml('root', structuredData(source))}`;
  if (format === 'csv') return toDelimited(structuredData(source), ',');
  if (format === 'tsv') return toDelimited(structuredData(source), '\t');
  if (format === 'sql') return toSql(structuredData(source));
  if (format === 'html') {
    if (source.originalHtml !== undefined) return source.originalHtml;
    return `<!doctype html>\n<html lang="en"><meta charset="utf-8"><pre>${escapeHtml(sourceText(source))}</pre></html>`;
  }
  if (format === 'md') return sourceText(source);
  if (format === 'rtf') {
    const escaped = sourceText(source)
      .replace(/\\/g, '\\\\')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/\r?\n/g, '\\par\n');
    return `{\\rtf1\\ansi\\deff0 ${escaped}}`;
  }
  return sourceText(source);
}

async function parsePdf(file) {
  if (!window.pdfjsLib) throw new Error('PDF reader library did not load. Check your connection and retry.');
  const document = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(' '));
  }
  return pages.join('\n\n');
}

async function parseDocx(file) {
  if (!window.JSZip) throw new Error('DOCX reader library did not load. Check your connection and retry.');
  const archive = await JSZip.loadAsync(await file.arrayBuffer());
  const documentXml = await archive.file('word/document.xml')?.async('string');
  if (!documentXml) throw new Error('This DOCX file does not contain a readable document body.');

  const document = new DOMParser().parseFromString(documentXml, 'application/xml');
  if (document.querySelector('parsererror')) throw new Error('This DOCX document body could not be read.');
  const namespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  return Array.from(document.getElementsByTagNameNS(namespace, 'p'))
    .map((paragraph) => Array.from(paragraph.getElementsByTagNameNS(namespace, 't'))
      .map((textNode) => textNode.textContent)
      .join(''))
    .join('\n');
}

async function readSource(file, extension) {
  if (imageExtensions.has(extension)) {
    return { kind: 'image', extension, file };
  }
  if (extension === 'pdf') {
    return { kind: 'text', extension, text: await parsePdf(file) };
  }
  if (extension === 'docx') {
    return { kind: 'text', extension, text: await parseDocx(file) };
  }

  const text = await file.text();
  if (extension === 'json') {
    return { kind: 'data', extension, data: JSON.parse(text) };
  }
  if (extension === 'xml') {
    return { kind: 'data', extension, data: parseXml(text) };
  }
  if (extension === 'yaml' || extension === 'yml') {
    if (!window.jsyaml) throw new Error('YAML parser did not load. Check your connection and retry.');
    return { kind: 'data', extension, data: jsyaml.load(text) };
  }
  if (extension === 'csv' || extension === 'tsv') {
    if (!window.Papa) throw new Error('CSV parser did not load. Check your connection and retry.');
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      delimiter: extension === 'tsv' ? '\t' : '',
      dynamicTyping: true,
    });
    if (parsed.errors.length) throw new Error(parsed.errors[0].message);
    return { kind: 'data', extension, data: parsed.data };
  }
  if (extension === 'html' || extension === 'htm') {
    const document = new DOMParser().parseFromString(text, 'text/html');
    return {
      kind: 'text',
      extension,
      text: document.body.innerText || document.body.textContent || '',
      originalHtml: text,
    };
  }
  if (extension === 'rtf') {
    return { kind: 'text', extension, text: text.replace(/\\par\b ?/g, '\n').replace(/\\'[0-9a-f]{2}/gi, ' ').replace(/\\[a-z]+-?\d* ?/gi, '').replace(/[{}]/g, '') };
  }
  return { kind: 'text', extension, text };
}

function renderSourcePreview(source, file) {
  sourceSummary.textContent = `${file.name} · ${formatBytes(file.size)}`;
  sourcePreview.hidden = true;
  imagePreview.hidden = true;

  if (source.kind === 'image') {
    if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
    imageObjectUrl = URL.createObjectURL(file);
    imagePreview.src = imageObjectUrl;
    imagePreview.hidden = false;
    return;
  }

  const preview = source.data !== undefined ? JSON.stringify(source.data, null, 2) : source.text;
  sourcePreview.textContent = (preview || '(No readable text found.)').slice(0, 1800);
  sourcePreview.hidden = false;
}

async function handleFileSelection() {
  const file = fileInput.files?.[0];
  currentFile = file;
  currentSource = undefined;
  convertButton.disabled = true;
  downloadLink.hidden = true;
  conversionStatus.textContent = '';
  if (downloadObjectUrl) {
    URL.revokeObjectURL(downloadObjectUrl);
    downloadObjectUrl = undefined;
  }
  if (!file) return;
  if (file.size > maximumFileSize) {
    conversionStatus.textContent = 'Choose a file smaller than 25 MB.';
    return;
  }

  const extension = getExtension(file.name);
  if (!supportedExtensions.has(extension)) {
    conversionStatus.textContent = 'This file type is not supported. Choose a listed document, data, or image format.';
    return;
  }

  conversionStatus.textContent = 'Reading file locally...';
  try {
    currentSource = await readSource(file, extension);
    renderSourcePreview(currentSource, file);
    const options = [...targetFormat.options];
    options.forEach((option) => {
      option.disabled = currentSource.kind === 'image' && option.value !== 'pdf';
    });
    targetFormat.value = currentSource.kind === 'image'
      ? 'pdf'
      : extension === 'pdf'
        ? 'docx'
        : extension === 'docx'
          ? 'pdf'
          : extension === 'xml'
            ? 'json'
            : 'pdf';
    convertButton.disabled = false;
    conversionStatus.textContent = currentSource.kind === 'image'
      ? 'Image loaded. This image can be converted to PDF.'
      : currentSource.text === '' && currentSource.kind === 'text'
        ? 'File loaded, but no readable text was found. A scanned PDF may need OCR.'
        : 'File ready to convert.';
  } catch (error) {
    currentSource = undefined;
    conversionStatus.textContent = error.message || 'Could not read this file.';
  }
}

async function createPdf(source) {
  if (!window.jspdf?.jsPDF) throw new Error('PDF writer library did not load. Check your connection and retry.');
  const { jsPDF } = window.jspdf;
  const document = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 42;
  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();

  if (source.kind === 'image') {
    const image = imagePreview;
    const scale = Math.min((pageWidth - margin * 2) / image.naturalWidth, (pageHeight - margin * 2) / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const type = source.file.type === 'image/jpeg' ? 'JPEG' : source.file.type === 'image/png' ? 'PNG' : 'WEBP';
    document.addImage(image, type, (pageWidth - width) / 2, (pageHeight - height) / 2, width, height);
    return document.output('blob');
  }

  const text = makePlainText(source, 'txt');
  const lines = document.splitTextToSize(text || '(No readable text found.)', pageWidth - margin * 2);
  let y = margin;
  for (const line of lines) {
    if (y > pageHeight - margin) {
      document.addPage();
      y = margin;
    }
    document.text(line, margin, y);
    y += 14;
  }
  return document.output('blob');
}

async function createDocx(source) {
  if (!window.docx?.Document || !window.docx?.Packer) {
    throw new Error('DOCX writer library did not load. Check your connection and retry.');
  }
  const paragraphs = makePlainText(source, 'txt').split(/\r?\n/).map((line) => new docx.Paragraph({
    children: [new docx.TextRun(line || ' ')],
  }));
  const document = new docx.Document({ sections: [{ children: paragraphs }] });
  return docx.Packer.toBlob(document);
}

async function convertFile(event) {
  event.preventDefault();
  if (!currentFile || !currentSource) return;

  conversionStatus.textContent = 'Converting in your browser...';
  downloadLink.hidden = true;
  if (downloadObjectUrl) URL.revokeObjectURL(downloadObjectUrl);

  try {
    const outputFormat = targetFormat.value;
    let blob;
    if (outputFormat === 'pdf') {
      blob = await createPdf(currentSource);
    } else if (outputFormat === 'docx') {
      if (currentSource.kind === 'image') throw new Error('Choose PDF as the output for images.');
      blob = await createDocx(currentSource);
    } else {
      if (currentSource.kind === 'image') throw new Error('Images can only be converted to PDF.');
      const text = makePlainText(currentSource, outputFormat);
      const mimeTypes = {
        txt: 'text/plain', md: 'text/markdown', html: 'text/html', csv: 'text/csv', tsv: 'text/tab-separated-values',
        json: 'application/json', xml: 'application/xml', yaml: 'text/yaml', rtf: 'application/rtf', sql: 'text/plain',
      };
      blob = new Blob([text], { type: `${mimeTypes[outputFormat]};charset=utf-8` });
    }

    downloadObjectUrl = URL.createObjectURL(blob);
    const filename = currentFile.name.replace(/\.[^.]+$/, '') || 'converted-file';
    downloadLink.href = downloadObjectUrl;
    downloadLink.download = `${filename}.${outputFormat}`;
    downloadLink.textContent = `Download ${filename}.${outputFormat} · ${formatBytes(blob.size)}`;
    downloadLink.hidden = false;
    conversionStatus.textContent = 'Conversion complete. Your original file has not been changed.';
  } catch (error) {
    conversionStatus.textContent = error.message || 'Could not convert this file.';
  }
}

function resetForm() {
  form.reset();
  currentFile = undefined;
  currentSource = undefined;
  convertButton.disabled = true;
  sourceSummary.textContent = 'Choose a file to begin';
  sourcePreview.textContent = '';
  sourcePreview.hidden = true;
  imagePreview.removeAttribute('src');
  imagePreview.hidden = true;
  conversionStatus.textContent = '';
  downloadLink.hidden = true;
  if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
  if (downloadObjectUrl) URL.revokeObjectURL(downloadObjectUrl);
  imageObjectUrl = undefined;
  downloadObjectUrl = undefined;
  [...targetFormat.options].forEach((option) => {
    option.disabled = false;
  });
}

fileInput.addEventListener('change', handleFileSelection);
form.addEventListener('submit', convertFile);
resetButton.addEventListener('click', resetForm);