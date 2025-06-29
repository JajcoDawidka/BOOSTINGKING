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
function initScrollingReviews(columnsSelector = '.column', gap = 30, speedPxPerSec = 5) {
    document.querySelectorAll(columnsSelector).forEach(column => {
        const originalReviews = Array.from(column.querySelectorAll('.review')); // Konwersja na Array
        if (originalReviews.length === 0) return;

        // Tworzymy kontener dla animowanych recenzji
        const scrollContainer = document.createElement('div');
        scrollContainer.classList.add('reviews-loop');

        // Duplikujemy recenzje co najmniej 3 razy, aby zapewnić płynne przejście i pokrycie
        // Nawet jeśli kolumna jest długa, nie będzie pustego miejsca
        const numberOfCopies = 3; 
        for (let i = 0; i < numberOfCopies; i++) {
            originalReviews.forEach(review => {
                scrollContainer.appendChild(review.cloneNode(true));
            });
        }

        // Wyczyść oryginalną zawartość i dodaj kontener
        column.innerHTML = '';
        column.appendChild(scrollContainer);

        // Ustawienie początkowej pozycji dla scroll-down
        if (column.classList.contains('scroll-down')) {
            scrollContainer.style.top = `-${(scrollContainer.scrollHeight / numberOfCopies)}px`;
        }

        // Obliczamy wysokość jednej "kopii" wszystkich oryginalnych recenzji
        // Jest to odległość, o którą musimy przewinąć, aby zapętlić animację
        let totalOriginalContentHeight = 0;
        originalReviews.forEach(review => {
            totalOriginalContentHeight += review.offsetHeight + gap;
        });
        totalOriginalContentHeight -= gap; // Odejmij ostatni odstęp

        const scrollDistance = totalOriginalContentHeight;

        // Czas animacji (im większa odległość i mniejsza prędkość, tym dłużej)
        const duration = scrollDistance / speedPxPerSec; // w sekundach

        // Nazwa animacji zależna od kierunku
        const animationName = column.classList.contains('scroll-up') ? 'seamlessScrollUp' : 'seamlessScrollDown';
        
        // Zastosowanie animacji
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