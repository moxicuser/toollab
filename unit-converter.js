const form = document.getElementById('unit-form');
const categorySelect = document.getElementById('category');
const quantityInput = document.getElementById('quantity');
const fromUnitSelect = document.getElementById('from-unit');
const toUnitSelect = document.getElementById('to-unit');
const swapButton = document.getElementById('swap-btn');
const copyButton = document.getElementById('copy-btn');
const resetButton = document.getElementById('reset-btn');
const resultLabel = document.getElementById('result-label');
const conversionResult = document.getElementById('conversion-result');
const copyStatus = document.getElementById('copy-status');

const unitGroups = {
  length: {
    label: 'Length',
    units: {
      meter: { name: 'meters', factor: 1 },
      kilometer: { name: 'kilometers', factor: 1000 },
      centimeter: { name: 'centimeters', factor: 0.01 },
      millimeter: { name: 'millimeters', factor: 0.001 },
      mile: { name: 'miles', factor: 1609.344 },
      yard: { name: 'yards', factor: 0.9144 },
      foot: { name: 'feet', factor: 0.3048 },
      inch: { name: 'inches', factor: 0.0254 },
    },
    defaults: ['kilometer', 'mile'],
  },
  weight: {
    label: 'Weight',
    units: {
      kilogram: { name: 'kilograms', factor: 1 },
      gram: { name: 'grams', factor: 0.001 },
      milligram: { name: 'milligrams', factor: 0.000001 },
      pound: { name: 'pounds', factor: 0.45359237 },
      ounce: { name: 'ounces', factor: 0.028349523125 },
      stone: { name: 'stones', factor: 6.35029318 },
    },
    defaults: ['kilogram', 'pound'],
  },
  temperature: {
    label: 'Temperature',
    units: {
      celsius: { name: 'degrees Celsius' },
      fahrenheit: { name: 'degrees Fahrenheit' },
      kelvin: { name: 'kelvin' },
    },
    defaults: ['celsius', 'fahrenheit'],
  },
  volume: {
    label: 'Volume',
    units: {
      liter: { name: 'liters', factor: 1 },
      milliliter: { name: 'milliliters', factor: 0.001 },
      cubicMeter: { name: 'cubic meters', factor: 1000 },
      usGallon: { name: 'US gallons', factor: 3.785411784 },
      usQuart: { name: 'US quarts', factor: 0.946352946 },
      usCup: { name: 'US cups', factor: 0.2365882365 },
      usFluidOunce: { name: 'US fluid ounces', factor: 0.0295735295625 },
    },
    defaults: ['liter', 'usGallon'],
  },
  speed: {
    label: 'Speed',
    units: {
      meterPerSecond: { name: 'meters per second', factor: 1 },
      kilometerPerHour: { name: 'kilometers per hour', factor: 1 / 3.6 },
      milePerHour: { name: 'miles per hour', factor: 0.44704 },
      knot: { name: 'knots', factor: 0.514444444444 },
    },
    defaults: ['kilometerPerHour', 'milePerHour'],
  },
};

let resultToCopy = '';

function getCurrentGroup() {
  return unitGroups[categorySelect.value];
}

function populateUnits() {
  const group = getCurrentGroup();
  const options = Object.entries(group.units).map(([value, unit]) => new Option(unit.name, value));

  fromUnitSelect.replaceChildren(...options.map((option) => option.cloneNode(true)));
  toUnitSelect.replaceChildren(...options);
  fromUnitSelect.value = group.defaults[0];
  toUnitSelect.value = group.defaults[1];
  conversionResult.textContent = 'Choose units and convert';
  resultLabel.textContent = `${group.label} conversion`;
  copyStatus.textContent = '';
  resultToCopy = '';
  copyButton.disabled = true;
}

function convertTemperature(value, fromUnit, toUnit) {
  let celsius;

  if (fromUnit === 'celsius') {
    celsius = value;
  } else if (fromUnit === 'fahrenheit') {
    celsius = (value - 32) * (5 / 9);
  } else {
    celsius = value - 273.15;
  }

  if (toUnit === 'celsius') {
    return celsius;
  }
  if (toUnit === 'fahrenheit') {
    return (celsius * 9) / 5 + 32;
  }
  return celsius + 273.15;
}

function formatValue(value) {
  return new Intl.NumberFormat(undefined, {
    maximumSignificantDigits: 8,
  }).format(value);
}

function handleSubmit(event) {
  event.preventDefault();

  const value = Number(quantityInput.value);
  if (!Number.isFinite(value)) {
    conversionResult.textContent = 'Enter a valid number';
    copyButton.disabled = true;
    return;
  }

  const group = getCurrentGroup();
  const fromUnit = fromUnitSelect.value;
  const toUnit = toUnitSelect.value;
  const result = categorySelect.value === 'temperature'
    ? convertTemperature(value, fromUnit, toUnit)
    : (value * group.units[fromUnit].factor) / group.units[toUnit].factor;

  resultLabel.textContent = `${formatValue(value)} ${group.units[fromUnit].name} equals`;
  conversionResult.textContent = `${formatValue(result)} ${group.units[toUnit].name}`;
  resultToCopy = `${resultLabel.textContent} ${conversionResult.textContent}`;
  copyStatus.textContent = '';
  copyButton.disabled = false;
}

function swapUnits() {
  const previousFromUnit = fromUnitSelect.value;
  fromUnitSelect.value = toUnitSelect.value;
  toUnitSelect.value = previousFromUnit;
  form.requestSubmit();
}

async function copyResult() {
  if (!resultToCopy) {
    return;
  }

  try {
    await navigator.clipboard.writeText(resultToCopy);
    copyStatus.textContent = 'Result copied.';
  } catch {
    copyStatus.textContent = 'Could not copy. Select the result text to copy it manually.';
  }
}

function resetForm() {
  form.reset();
  quantityInput.value = '1';
  populateUnits();
}

categorySelect.addEventListener('change', populateUnits);
form.addEventListener('submit', handleSubmit);
swapButton.addEventListener('click', swapUnits);
copyButton.addEventListener('click', copyResult);
resetButton.addEventListener('click', resetForm);

resetForm();