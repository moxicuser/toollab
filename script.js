const form = document.getElementById('converter-form');
const resetButton = document.getElementById('reset-btn');
const swapButton = document.getElementById('swap-btn');
const amountInput = document.getElementById('amount');
const fromCurrency = document.getElementById('from-currency');
const toCurrency = document.getElementById('to-currency');
const resultLabel = document.getElementById('result-label');
const conversionResult = document.getElementById('conversion-result');
const rateNote = document.getElementById('rate-note');
const convertButton = document.getElementById('convert-btn');
let activeRequestController;

function formatAmount(value, currency) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 4,
  }).format(value);
}

async function loadSupportedCurrencies() {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    if (data.result !== 'success' || !data.rates) {
      return;
    }

    const displayNames = new Intl.DisplayNames([navigator.language], { type: 'currency' });
    const currencies = Object.keys(data.rates).sort();

    [fromCurrency, toCurrency].forEach((select) => {
      const selectedCurrency = select.value;
      select.replaceChildren(
        ...currencies.map((currency) => {
          const name = displayNames.of(currency) || currency;
          return new Option(`${currency} - ${name}`, currency);
        })
      );
      select.value = selectedCurrency;
    });
  } catch {
    return;
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const amount = Number(amountInput.value);
  const base = fromCurrency.value;
  const target = toCurrency.value;

  if (!Number.isFinite(amount) || amount < 0) {
    rateNote.textContent = 'Enter a valid amount of zero or more.';
    return;
  }

  resultLabel.textContent = `${formatAmount(amount, base)} converts to`;
  activeRequestController?.abort();
  const requestController = new AbortController();
  activeRequestController = requestController;
  const timeoutId = setTimeout(() => requestController.abort(), 10000);
  convertButton.disabled = true;
  convertButton.textContent = 'Loading rates...';
  rateNote.textContent = 'Getting the latest available daily rate...';

  try {
    if (base === target) {
      conversionResult.textContent = formatAmount(amount, target);
      rateNote.textContent = 'Same currency selected. No exchange rate is needed.';
      return;
    }

    const response = await fetch(
      `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`,
      { signal: requestController.signal }
    );

    if (!response.ok) {
      throw new Error('Rate service returned an error.');
    }

    const data = await response.json();
    const exchangeRate = data.result === 'success' ? data.rates?.[target] : undefined;

    if (!Number.isFinite(exchangeRate)) {
      throw new Error('No rate was available for this currency pair.');
    }

    conversionResult.textContent = formatAmount(amount * exchangeRate, target);
    const updatedDate = new Date(data.time_last_update_utc).toISOString().slice(0, 10);
    rateNote.textContent = `1 ${base} = ${exchangeRate} ${target} | Rate updated ${updatedDate}.`;
  } catch (error) {
    if (activeRequestController === requestController) {
      conversionResult.textContent = 'Conversion unavailable';
      rateNote.textContent = 'Could not load exchange rates. Check your connection and try again.';
    }
  } finally {
    clearTimeout(timeoutId);
    if (activeRequestController === requestController) {
      activeRequestController = undefined;
      convertButton.disabled = false;
      convertButton.textContent = 'Convert';
    }
  }
}

function swapCurrencies() {
  const previousFrom = fromCurrency.value;
  fromCurrency.value = toCurrency.value;
  toCurrency.value = previousFrom;
  form.requestSubmit();
}

function resetForm() {
  activeRequestController?.abort();
  activeRequestController = undefined;
  convertButton.disabled = false;
  convertButton.textContent = 'Convert';
  form.reset();
  amountInput.value = '100';
  fromCurrency.value = 'USD';
  toCurrency.value = 'EUR';
  resultLabel.textContent = '100 USD converts to';
  conversionResult.textContent = 'Enter an amount and convert';
  rateNote.textContent = 'Daily rates are provided by ExchangeRate-API Open Access.';
}

form.addEventListener('submit', handleSubmit);
resetButton.addEventListener('click', resetForm);
swapButton.addEventListener('click', swapCurrencies);

resetForm();
loadSupportedCurrencies();
