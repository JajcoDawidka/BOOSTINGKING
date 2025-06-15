// boostingzakup.js

// Helper function to get service type based on the current page
const getServiceType = () => {
    if (window.location.pathname.includes('faceit.html')) {
        return 'Faceit Boosting';
    } else if (window.location.pathname.includes('premier.html')) {
        return 'Premier Boosting';
    }
    return 'Unknown Service'; // Fallback
};

// --- Inicjalizacja i obsługa kodów rabatowych ---
const initDiscount = () => {
    const btn = document.getElementById('apply-discount');
    const input = document.getElementById('discount-code');
    const msg = document.getElementById('discount-message');
    if (!btn || !input || !msg) return;

    let applied = false;
    const rate = 0.1; // 10% discount

    const applyDiscount = e => {
        e.preventDefault();
        const code = input.value.trim().toUpperCase();
        const totalEl = document.getElementById('total-price');
        let curr = parseFloat(totalEl.textContent.replace('$', '')) || 0;

        if (applied) {
            msg.textContent = 'Discount code already used!';
            msg.className = 'discount-message error';
        } else if (code === 'KING10') {
            applied = true;

            const discount = curr * rate;
            const basePrice = curr; // Store current total as base for discount calculation
            const newPrice = Math.max(0, basePrice - discount);

            totalEl.textContent = `$${newPrice.toFixed(2)}`;
            totalEl.setAttribute('data-base-price-before-discount', basePrice.toFixed(2)); // Store total before discount
            totalEl.setAttribute('data-applied-discount-value', discount.toFixed(2)); // Store discount value

            msg.innerHTML = `✔ 10% discount applied!<br>` +
                `<span class="discount-details">You saved: <strong>$${discount.toFixed(2)}</strong></span>`;
            msg.className = 'discount-message success';
        } else {
            msg.textContent = "Invalid code. Use 'KING10' for 10% off.";
            msg.className = 'discount-message error';
        }
    };

    btn.addEventListener('click', applyDiscount);
    input.addEventListener('keyup', e => { if (e.key === 'Enter') applyDiscount(e); });

    // Re-calculate discount if any price-affecting input changes
    const priceSelectors = [
        '#current-elo', '#target-elo', '#current-rating-input', '#target-rating-input',
        '.level-input-btn', '.custom-opt', 'input[name="accType"]', 'input[name="region"]'
    ];

    priceSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            ['input', 'change', 'click'].forEach(evt => {
                el.addEventListener(evt, () => {
                    // This logic assumes that price calculation (base, extra, total)
                    // is handled elsewhere in boostingzakup.js or general.js
                    // and updates #total-price accordingly.
                    // Here, we just re-apply the discount if it was already active.

                    const totalEl = document.getElementById('total-price');
                    const msg = document.getElementById('discount-message');

                    if (applied) {
                        // Recalculate based on the *new* total price (before any discount re-application)
                        const currentTotalBeforeDiscount = parseFloat(totalEl.textContent.replace('$', '')) || 0;
                        const discount = currentTotalBeforeDiscount * rate;
                        const newPrice = Math.max(0, currentTotalBeforeDiscount - discount);

                        totalEl.textContent = `$${newPrice.toFixed(2)}`;
                        totalEl.setAttribute('data-base-price-before-discount', currentTotalBeforeDiscount.toFixed(2));
                        totalEl.setAttribute('data-applied-discount-value', discount.toFixed(2));

                        msg.innerHTML = `✔ 10% discount applied!<br>` +
                            `<span class="discount-details">You saved: <strong>$${discount.toFixed(2)}</strong></span>`;
                        msg.className = 'discount-message success';
                    } else {
                        // If no discount was applied, ensure message is clear
                        msg.textContent = '';
                        msg.className = 'discount-message';
                    }
                });
            });
        });
    });
};

// --- Tworzenie pływającego powiadomienia o błędzie ---
const showFloatingRegionError = () => {
    let existing = document.getElementById('floating-region-error');
    if (existing) {
        existing.style.display = 'block';
        return;
    }

    const error = document.createElement('div');
    error.id = 'floating-region-error';
    error.textContent = 'Please select a region.';
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
    }, 3000);
};

// --- Konfiguracja przycisku finalizacji zamówienia i zapisywanie danych ---
const setupCheckoutButton = () => {
    const checkoutBtn = document.getElementById('checkout-btn');
    if (!checkoutBtn) return;

    checkoutBtn.addEventListener('click', e => {
        e.preventDefault();

        const regionSelectedInput = document.querySelector('input[name="region"]:checked');
        if (!regionSelectedInput) {
            showFloatingRegionError();
            return; // Stop execution if no region is selected
        }

        // Gather all necessary data
        const serviceType = getServiceType();

        // Pobierz tekst wyświetlany dla Regionu
        const regionLabel = document.querySelector(`label[for="${regionSelectedInput.id}"] .region-title`);
        const region = regionLabel ? regionLabel.textContent : regionSelectedInput.value;

        // Pobierz tekst wyświetlany dla Account Type
        const accountTypeInput = document.querySelector('input[name="accType"]:checked');
        const accountTypeLabel = document.querySelector(`label[for="${accountTypeInput.id}"] .account-type-title`);
        const accountType = accountTypeLabel ? accountTypeLabel.textContent : (accountTypeInput?.value || 'Solo (Shared Account)'); // Default to solo if not found

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
            // Upewnij się, że pobierasz .option-title, jeśli istnieje, inaczej fallback do id
            const optionTitleEl = document.querySelector(`label[for="${option.id}"] .option-title`);
            return optionTitleEl ? optionTitleEl.textContent : option.id.charAt(0).toUpperCase() + option.id.slice(1);
        });

        // Get prices from the display (assuming these are updated by your price calculation logic)
        const basePriceElement = document.getElementById('base-price');
        const extraPriceElement = document.getElementById('extra-price'); // <-- POBIERZ EXTRA PRICE
        const totalElement = document.getElementById('total-price');

        const basePrice = parseFloat(basePriceElement?.textContent.replace('$', '')) || 0;
        const extraPrice = parseFloat(extraPriceElement?.textContent.replace('$', '')) || 0; // <-- SPARSUJ EXTRA PRICE
        const total = parseFloat(totalElement?.textContent.replace('$', '')) || 0;

        // Calculate discount based on the difference between basePrice and total if a discount was applied
        let discountAmount = 0;
        if (totalElement.hasAttribute('data-applied-discount-value')) {
            discountAmount = parseFloat(totalElement.getAttribute('data-applied-discount-value')) || 0;
        } else {
            // If no explicit discount attribute, calculate it as difference from potential base price stored or current base price
            const originalTotalBeforeDiscount = parseFloat(totalElement.getAttribute('data-base-price-before-discount')) || basePrice;
            discountAmount = originalTotalBeforeDiscount - total;
        }


        const orderDetails = {
            serviceType: serviceType,
            region: region, // Teraz zawiera "Europe", "Americas" itd.
            accountType: accountType, // Teraz zawiera "Solo (Shared Account)" lub "Duo Queue"
            currentLevel: currentLevel, // Will be ELO or Rating
            desiredLevel: desiredLevel, // Will be ELO or Rating
            customizations: customizations, // Lista nazw wybranych dodatków
            basePrice: basePrice,
            extraPrice: extraPrice, // <-- DODANE: Cena dodatków
            discount: discountAmount,
            totalPrice: total
        };

        localStorage.setItem('orderDetails', JSON.stringify(orderDetails));
        window.location.href = 'checkout.html';
    });
};

// --- Inicjalizacja całego modułu po załadowaniu DOM ---
document.addEventListener('DOMContentLoaded', () => {
    initDiscount();
    setupCheckoutButton();
    // Any other global initializations should go here
    // calculatePrices(); // Jeśli masz taką funkcję, upewnij się, że jest tutaj wywołana
});

// You'll also need to ensure your price calculation logic (which should update
// #base-price, #extra-price, and #total-price) is also part of this file
// or general.js and runs on DOMContentLoaded as well.
// For example, if you have a function like calculatePrices(), call it here:
// calculatePrices();