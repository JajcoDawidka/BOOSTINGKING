// boostingzakup.js

const getServiceType = () => {
    if (window.location.pathname.includes('faceit.html')) {
        return 'Faceit Boosting';
    } else if (window.location.pathname.includes('premier.html')) {
        return 'Premier Boosting';
    }
    return 'Unknown Service';
};

const initDiscount = () => {
    const btn = document.getElementById('apply-discount');
    const input = document.getElementById('discount-code');
    const msg = document.getElementById('discount-message');
    if (!btn || !input || !msg) return;

    let applied = false;
    const rate = 0.1;

    const applyDiscount = e => {
        e.preventDefault();
        const code = input.value.trim().toUpperCase();
        const totalEl = document.getElementById('total-price');
        let currentTotalBeforeDiscount = parseFloat(totalEl.getAttribute('data-base-price-before-discount')) ||
            (parseFloat(document.getElementById('base-price').textContent.replace('$', '')) || 0) +
            (parseFloat(document.getElementById('extra-price').textContent.replace('$', '')) || 0);

        if (applied) {
            msg.textContent = 'Discount code already used!';
            msg.className = 'discount-message error';
        } else if (code === 'KING10') {
            applied = true;

            const discount = currentTotalBeforeDiscount * rate;
            const newPrice = Math.max(0, currentTotalBeforeDiscount - discount);

            totalEl.textContent = `$${newPrice.toFixed(2)}`;
            totalEl.setAttribute('data-base-price-before-discount', currentTotalBeforeDiscount.toFixed(2));
            totalEl.setAttribute('data-applied-discount-value', discount.toFixed(2));

            msg.innerHTML = `✔ 10% discount applied!<br><span class="discount-details">You saved: <strong>$${discount.toFixed(2)}</strong></span>`;
            msg.className = 'discount-message success';
        } else {
            msg.textContent = "Invalid code. Use 'KING10' for 10% off.";
            msg.className = 'discount-message error';
        }
    };

    btn.addEventListener('click', applyDiscount);
    input.addEventListener('keyup', e => { if (e.key === 'Enter') applyDiscount(e); });

    const priceSelectors = [
        '#current-elo', '#target-elo', '#current-rating-input', '#target-rating-input',
        '.level-input-btn', '.custom-opt', 'input[name="accType"]', 'input[name="region"]'
    ];

    priceSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            ['input', 'change', 'click'].forEach(evt => {
                el.addEventListener(evt, () => {
                    const totalEl = document.getElementById('total-price');
                    const msg = document.getElementById('discount-message');

                    if (applied) {
                        const currentTotalBeforeDiscount = parseFloat(totalEl.getAttribute('data-base-price-before-discount')) ||
                            (parseFloat(document.getElementById('base-price').textContent.replace('$', '')) || 0) +
                            (parseFloat(document.getElementById('extra-price').textContent.replace('$', '')) || 0);

                        const discount = currentTotalBeforeDiscount * rate;
                        const newPrice = Math.max(0, currentTotalBeforeDiscount - discount);

                        totalEl.textContent = `$${newPrice.toFixed(2)}`;
                        totalEl.setAttribute('data-base-price-before-discount', currentTotalBeforeDiscount.toFixed(2));
                        totalEl.setAttribute('data-applied-discount-value', discount.toFixed(2));

                        msg.innerHTML = `✔ 10% discount applied!<br><span class="discount-details">You saved: <strong>$${discount.toFixed(2)}</strong></span>`;
                        msg.className = 'discount-message success';
                    } else {
                        msg.textContent = '';
                        msg.className = 'discount-message';
                    }
                });
            });
        });
    });
};

// Zmieniona funkcja do wyświetlania ogólnych błędów
const showFloatingError = (message) => {
    let existing = document.getElementById('floating-error-message');
    if (existing) {
        existing.textContent = message; // Update the message
        existing.style.display = 'block';
        return;
    }

    const error = document.createElement('div');
    error.id = 'floating-error-message';
    error.textContent = message;
    error.style.position = 'fixed';
    error.style.bottom = '20px';
    error.style.left = '50%';
    error.style.transform = 'translateX(-50%)';
    error.style.backgroundColor = '#ff4444';
    error.style.color = 'white';
    error.style.padding = '12px 24px';
    error.style.borderRadius = '8px';
    error.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
    error.style.zIndex = '9999';
    error.style.fontWeight = 'bold';
    error.style.fontSize = '16px';
    error.style.textAlign = 'center';

    document.body.appendChild(error);

    setTimeout(() => {
        error.style.display = 'none';
        error.remove(); // Usunięcie elementu po zniknięciu, aby nie zaśmiecać DOM
    }, 3000);
};

const setupCheckoutButton = () => {
    const checkoutBtn = document.getElementById('checkout-btn');
    if (!checkoutBtn) return;

    checkoutBtn.addEventListener('click', e => {
        e.preventDefault();

        const regionSelectedInput = document.querySelector('input[name="region"]:checked');
        if (!regionSelectedInput) {
            showFloatingError('Please select a region.'); // Używamy nowej funkcji
            return;
        }

        const serviceType = getServiceType();

        const regionLabel = document.querySelector(`label[for="${regionSelectedInput.id}"] .region-title`);
        const region = regionLabel ? regionLabel.textContent : regionSelectedInput.value;

        const accountTypeInput = document.querySelector('input[name="accType"]:checked');
        const accountTypeLabel = document.querySelector(`label[for="${accountTypeInput.id}"] .account-type-title`);
        const accountType = accountTypeLabel ? accountTypeLabel.textContent : (accountTypeInput?.value || 'Solo (Shared Account)');

        let currentLevel = null;
        let desiredLevel = null;

        if (serviceType === 'Faceit Boosting') {
            currentLevel = document.getElementById('current-elo')?.value;
            desiredLevel = document.getElementById('target-elo')?.value;
        } else if (serviceType === 'Premier Boosting') {
            currentLevel = document.getElementById('current-rating-input')?.value;
            desiredLevel = document.getElementById('target-rating-input')?.value;
        }

        const customizationOptions = document.querySelectorAll('.custom-opt:checked');
        const customizations = Array.from(customizationOptions).map(option => {
            const optionTitleEl = document.querySelector(`label[for="${option.id}"] .option-title`);
            return optionTitleEl ? optionTitleEl.textContent : option.id.charAt(0).toUpperCase() + option.id.slice(1);
        });

        const basePriceElement = document.getElementById('base-price');
        const extraPriceElement = document.getElementById('extra-price');
        const totalElement = document.getElementById('total-price');

        // Ensure all prices are non-negative when read and stored
        const basePrice = Math.max(0, parseFloat(basePriceElement?.textContent.replace('$', '')) || 0);
        const extraPrice = Math.max(0, parseFloat(extraPriceElement?.textContent.replace('$', '')) || 0);
        const total = Math.max(0, parseFloat(totalElement?.textContent.replace('$', '')) || 0);

        // --- Nowa walidacja minimalnej ceny ---
        const MIN_ORDER_PRICE = 10;
        if (total < MIN_ORDER_PRICE) {
            showFloatingError(`Minimal order price is $${MIN_ORDER_PRICE.toFixed(2)}.`);
            return;
        }
        // --- Koniec nowej walidacji ---

        let discountAmount = 0;
        if (totalElement.hasAttribute('data-applied-discount-value')) {
            discountAmount = Math.max(0, parseFloat(totalElement.getAttribute('data-applied-discount-value')) || 0);
        } else {
            const originalTotalBeforeDiscount = (parseFloat(totalElement.getAttribute('data-base-price-before-discount')) || basePrice + extraPrice);
            discountAmount = Math.max(0, originalTotalBeforeDiscount - total);
        }

        const orderDetails = {
            serviceType: serviceType,
            region: region,
            accountType: accountType,
            currentLevel: currentLevel,
            desiredLevel: desiredLevel,
            customizations: customizations,
            basePrice: basePrice,
            extraPrice: extraPrice,
            discount: discountAmount,
            totalPrice: total
        };

        localStorage.setItem('orderDetails', JSON.stringify(orderDetails));
        window.location.href = 'checkout.html';
    });
};


// Nowa funkcja do obsługi tooltipów
let currentTooltip = null; // Zmienna globalna do śledzenia aktualnego tooltipa
let hideTooltipTimeout = null; // Do zarządzania timeoutem ukrywania

const hideCurrentTooltip = () => {
    if (hideTooltipTimeout) { // Wyczyść poprzedni timeout, jeśli istnieje
        clearTimeout(hideTooltipTimeout);
        hideTooltipTimeout = null;
    }
    if (currentTooltip) {
        currentTooltip.classList.remove('visible');
        // Usuń tooltip po zakończeniu animacji (0.3s z CSS)
        // Dajemy krótszy czas, żeby tooltip zniknął szybciej przy przejściu na inny element
        hideTooltipTimeout = setTimeout(() => {
            if (currentTooltip) {
                currentTooltip.remove();
                currentTooltip = null;
            }
        }, 150); // Skrócono czas do 150ms
    }
};

const setupTooltips = () => {
    const tooltipTriggers = document.querySelectorAll('.tooltip-icon'); // Wybieramy ikonki Font Awesome z klasą tooltip-icon

    // Usuwamy atrybut 'title' z wszystkich ikonek zaraz po załadowaniu strony
    tooltipTriggers.forEach(trigger => {
        if (trigger.hasAttribute('title')) {
            trigger.removeAttribute('title');
        }
    });

    tooltipTriggers.forEach(trigger => {
        let showTooltipTimeout; // Timeout dla opóźnienia pojawienia się tooltipa

        trigger.addEventListener('mouseenter', function() {
            // Natychmiast usuń każdy istniejący tooltip, zanim pokażesz nowy
            hideCurrentTooltip();
            
            const tooltipText = this.getAttribute('data-tooltip');
            if (!tooltipText) return;

            // Ustaw timeout na pokazanie tooltipa, aby uniknąć migotania
            showTooltipTimeout = setTimeout(() => {
                const tooltipDiv = document.createElement('div');
                tooltipDiv.classList.add('js-dynamic-tooltip');
                tooltipDiv.textContent = tooltipText;
                document.body.appendChild(tooltipDiv);
                currentTooltip = tooltipDiv;

                const rect = this.getBoundingClientRect();
                const scrollX = window.scrollX || window.pageXOffset;
                const scrollY = window.scrollY || window.pageYOffset;

                tooltipDiv.style.left = `${rect.left + rect.width / 2 + scrollX}px`;
                tooltipDiv.style.top = `${rect.top + scrollY - tooltipDiv.offsetHeight - 10}px`;

                // Dopasuj pozycję tooltipa, jeśli wykracza poza ekran
                const tooltipRect = tooltipDiv.getBoundingClientRect();
                if (tooltipRect.left < 0) {
                    tooltipDiv.style.left = `${scrollX}px`;
                    tooltipDiv.style.transform = 'translateX(0)';
                }
                if (tooltipRect.right > window.innerWidth) {
                    tooltipDiv.style.left = `${window.innerWidth + scrollX - tooltipRect.width}px`;
                    tooltipDiv.style.transform = 'translateX(0)';
                }
                tooltipDiv.classList.add('visible'); // Dodaj klasę widoczności
            }, 100); // Małe opóźnienie przed pojawieniem się (np. 100ms)
        });

        trigger.addEventListener('mouseleave', function() {
            // Wyczyść timeout pokazania tooltipa, jeśli mysz szybko opuści element
            if (showTooltipTimeout) {
                clearTimeout(showTooltipTimeout);
            }
            hideCurrentTooltip(); // Wywołaj funkcję ukrywającą
        });

        // Dodaj obsługę, gdy użytkownik przewinie stronę, aby tooltip zniknął
        window.addEventListener('scroll', () => {
            hideCurrentTooltip();
        }, { passive: true });
    });
};


document.addEventListener('DOMContentLoaded', () => {
    initDiscount();
    setupCheckoutButton();
    setupTooltips(); // Inicjalizacja nowej logiki tooltipów
});