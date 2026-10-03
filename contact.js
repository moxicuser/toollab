const contactForm = document.getElementById('contact-form');

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const topic = document.getElementById('contact-topic').value;
  const title = document.getElementById('contact-title').value.trim();
  const details = document.getElementById('contact-details').value.trim();
  const parameters = new URLSearchParams({
    title: `[${topic}] ${title}`,
    body: `Topic: ${topic}\n\n${details}\n\nSubmitted from ToolLab.`,
  });

  window.location.href = `https://github.com/moxicuser/toollab/issues/new?${parameters}`;
});