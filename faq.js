// FAQ accordion
const initFAQ = () => {
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.question');
    const answer = item.querySelector('.answer');
    const icon = document.createElement('div');
    icon.classList.add('icon');
    icon.textContent = '+';
    question.appendChild(icon);

    question.addEventListener('click', () => {
      const isOpen = answer.classList.contains('open');
      document.querySelectorAll('.answer.open').forEach(ans => {
        ans.classList.remove('open');
        ans.style.maxHeight = null;
        ans.previousElementSibling.querySelector('.icon').textContent = '+';
      });
      if (!isOpen) {
        answer.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        icon.textContent = '–';
      }
    });
  });
};
initFAQ();