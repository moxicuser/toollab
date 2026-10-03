const form = document.getElementById('date-form');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const resetButton = document.getElementById('reset-btn');
const copyButton = document.getElementById('copy-btn');
const rangeLabel = document.getElementById('range-label');
const daysBetween = document.getElementById('days-between');
const weeksAndDays = document.getElementById('weeks-and-days');
const inclusiveDays = document.getElementById('inclusive-days');
const copyStatus = document.getElementById('copy-status');

let resultToCopy = '';

function parseDate(value) {
  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return null;
  }

  return date;
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(date);
}

function calculateDifference(firstDate, secondDate) {
  const earlierDate = firstDate <= secondDate ? firstDate : secondDate;
  const laterDate = firstDate <= secondDate ? secondDate : firstDate;
  const dayDifference = (laterDate - earlierDate) / 86400000;

  return {
    earlierDate,
    laterDate,
    dayDifference,
    weeks: Math.floor(dayDifference / 7),
    remainingDays: dayDifference % 7,
  };
}

function handleSubmit(event) {
  event.preventDefault();

  const firstDate = parseDate(startDateInput.value);
  const secondDate = parseDate(endDateInput.value);

  if (!firstDate || !secondDate) {
    rangeLabel.textContent = 'Enter two valid dates';
    copyStatus.textContent = 'Both dates are required.';
    copyButton.disabled = true;
    return;
  }

  const result = calculateDifference(firstDate, secondDate);
  const inclusiveCount = result.dayDifference + 1;
  const weekText = `${result.weeks} ${result.weeks === 1 ? 'week' : 'weeks'} and ${result.remainingDays} ${result.remainingDays === 1 ? 'day' : 'days'}`;

  rangeLabel.textContent = `${formatDate(result.earlierDate)} to ${formatDate(result.laterDate)}`;
  daysBetween.textContent = `${result.dayDifference} ${result.dayDifference === 1 ? 'day' : 'days'}`;
  weeksAndDays.textContent = weekText;
  inclusiveDays.textContent = `${inclusiveCount} ${inclusiveCount === 1 ? 'day' : 'days'}`;
  resultToCopy = `${rangeLabel.textContent}: ${daysBetween.textContent} between (${weekText}); ${inclusiveDays.textContent} inclusive.`;
  copyStatus.textContent = '';
  copyButton.disabled = false;
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
  rangeLabel.textContent = 'Choose two dates';
  daysBetween.textContent = '-';
  weeksAndDays.textContent = '-';
  inclusiveDays.textContent = '-';
  copyStatus.textContent = '';
  resultToCopy = '';
  copyButton.disabled = true;
}

form.addEventListener('submit', handleSubmit);
resetButton.addEventListener('click', resetForm);
copyButton.addEventListener('click', copyResult);