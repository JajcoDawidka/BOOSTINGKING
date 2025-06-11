// === Info Slider ===
// Przełącza wiadomości informacyjne co 4 sekundy
function initInfoSlider(containerSelector = '#info-slider .info-message', intervalMs = 4000) {
  const messages = document.querySelectorAll(containerSelector);
  let currentIndex = 0;

  if (messages.length === 0) return;

  // Pokazujemy tylko pierwszą wiadomość
  messages.forEach((msg, i) => {
    msg.style.display = i === 0 ? 'block' : 'none';
  });

  setInterval(() => {
    messages[currentIndex].style.display = 'none';
    currentIndex = (currentIndex + 1) % messages.length;
    messages[currentIndex].style.display = 'block';
  }, intervalMs);
}

// === Scrolling Reviews ===
// Inicjalizuje nieskończone przewijanie recenzji w kolumnach
function initScrollingReviews(columnsSelector = '.column', gap = 30, speedPxPerSec = 10) {
  document.querySelectorAll(columnsSelector).forEach(column => {
    const originalReviews = column.querySelectorAll('.review');
    if (originalReviews.length === 0) return;

    // Tworzymy kontener dla animowanych recenzji
    const scrollContainer = document.createElement('div');
    scrollContainer.classList.add('reviews-loop');

    // Duplikujemy recenzje 2x dla płynnego przejścia (scrollujemy tylko 50%)
    for (let i = 0; i < 2; i++) {
      originalReviews.forEach(review => {
        scrollContainer.appendChild(review.cloneNode(true));
      });
    }

    // Wyczyść oryginalną zawartość i dodaj kontener
    column.innerHTML = '';
    column.appendChild(scrollContainer);

    // Obliczamy wysokość jednej recenzji + odstęp
    const singleReviewHeight = originalReviews[0].offsetHeight + gap;
    const scrollDistance = singleReviewHeight * originalReviews.length;

    // Czas animacji tylko dla połowy (bo duplikujemy)
    const duration = scrollDistance / speedPxPerSec;

    // Nazwa animacji zależna od kierunku
    const animationName = column.classList.contains('scroll-up') ? 'seamlessScrollUp' : 'seamlessScrollDown';
    scrollContainer.style.animation = `${animationName} ${duration}s linear infinite`;

    // Pauzowanie animacji przy najechaniu
    column.addEventListener('mouseenter', () => {
      scrollContainer.style.animationPlayState = 'paused';
    });
    column.addEventListener('mouseleave', () => {
      scrollContainer.style.animationPlayState = 'running';
    });
  });
}

// === Inicjalizacja po załadowaniu DOM ===
document.addEventListener('DOMContentLoaded', () => {
  initInfoSlider();
  initScrollingReviews();
});
