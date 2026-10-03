const form = document.getElementById('age-form');
const birthDateInput = document.getElementById('birth-date');
const resetButton = document.getElementById('reset-btn');
const ageResult = document.getElementById('age-result');
const birthdayResult = document.getElementById('birthday-result');

function dateFromInput(value) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function getToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function pluralize(value, unit) {
  return `${value} ${unit}${value === 1 ? '' : 's'}`;
}

function calculateAge(birthDate, today) {
  if (birthDate > today) {
    return null;
  }

  const isLeapDayBirthday = birthDate.getUTCMonth() === 1 && birthDate.getUTCDate() === 29;
  const isCurrentYearLeap = new Date(Date.UTC(today.getUTCFullYear(), 1, 29)).getUTCDate() === 29;
  const birthdayDayThisYear = isLeapDayBirthday && !isCurrentYearLeap ? 28 : birthDate.getUTCDate();
  let years = today.getUTCFullYear() - birthDate.getUTCFullYear();
  let months = today.getUTCMonth() - birthDate.getUTCMonth();
  let days = today.getUTCDate() - birthdayDayThisYear;

  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0)).getUTCDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  let nextBirthdayYear = today.getUTCFullYear();
  let nextBirthdayDay = birthDate.getUTCDate();
  const isBirthdayPassed =
    birthDate.getUTCMonth() < today.getUTCMonth() ||
    (birthDate.getUTCMonth() === today.getUTCMonth() && birthdayDayThisYear <= today.getUTCDate());

  if (isBirthdayPassed) {
    nextBirthdayYear += 1;
  }

  if (isLeapDayBirthday) {
    const isNextYearLeap = new Date(Date.UTC(nextBirthdayYear, 1, 29)).getUTCDate() === 29;
    if (!isNextYearLeap) {
      nextBirthdayDay = 28;
    }
  }

  const nextBirthday = new Date(
    Date.UTC(nextBirthdayYear, birthDate.getUTCMonth(), nextBirthdayDay)
  );
  const daysUntilBirthday = Math.round((nextBirthday - today) / 86400000);

  return { years, months, days, daysUntilBirthday };
}

function handleSubmit(event) {
  event.preventDefault();

  const birthDate = dateFromInput(birthDateInput.value);
  const today = getToday();

  if (!birthDate || birthDate > today) {
    ageResult.textContent = 'Enter a valid date of birth';
    birthdayResult.textContent = 'Your date of birth must be today or earlier.';
    return;
  }

  const age = calculateAge(birthDate, today);
  ageResult.textContent = [
    pluralize(age.years, 'year'),
    pluralize(age.months, 'month'),
    pluralize(age.days, 'day'),
  ].join(', ');
  birthdayResult.textContent =
    age.daysUntilBirthday === 0
      ? 'Happy birthday!'
      : `${pluralize(age.daysUntilBirthday, 'day')} until your next birthday.`;
}

function resetForm() {
  form.reset();
  ageResult.textContent = 'Enter your date of birth';
  birthdayResult.textContent = 'Your next birthday will appear here.';
}

form.addEventListener('submit', handleSubmit);
resetButton.addEventListener('click', resetForm);