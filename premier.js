const initPremierCalculator = () => {
    const currentRatingInput = document.getElementById('current-rating-input');
    if (!currentRatingInput) return;

    // Zaktualizowane ceny za 1000 Premier Ratingu w USD (obniżone o 10%)
    const priceRanges = [
        { maxRating: 4999, pricePer1000: 8 * 0.9 }, // 0 - 4999 -> 7.2 USD
        { maxRating: 9999, pricePer1000: 12 * 0.9 }, // 5000 - 9999 -> 10.8 USD
        { maxRating: 14999, pricePer1000: 18 * 0.9 }, // 10000 - 14999 -> 16.2 USD
        { maxRating: 20000, pricePer1000: 25 * 0.9 } // 15000 - 20000 (nowy max) -> 22.5 USD
    ];

    const MAX_CUR = 20000; // Nowy maksymalny aktualny rating
    const MAX_TAR = 20000; // Nowy maksymalny docelowy rating
    const STEP = 250; // Skok co 250 ratingu
    const baseEl = document.getElementById('base-price');
    const extraEl = document.getElementById('extra-price');
    const totalEl = document.getElementById('total-price');
    const targetRatingInput = document.getElementById('target-rating-input');
    const badgeCur = document.getElementById('current-badge');
    const badgeTar = document.getElementById('target-badge');
    const currentRatingDisplay = badgeCur.querySelector('.rating-value');
    const targetRatingDisplay = badgeTar.querySelector('.rating-value');
    // const checkoutButton = document.getElementById('checkout-button'); // Przenosimy do boostingzakup.js

    const getImg = v =>
        v < 5000 ? 'premier1.webp'
        : v < 10000 ? 'premier2.webp'
        : v < 15000 ? 'premier3.webp'
        : v <= 20000 ? 'premier4.webp' // Użyj odpowiedniego obrazka dla 20000
        : 'premier4.webp';

    const updateDisplays = () => {
        const currentVal = parseInt(currentRatingInput.value) || 0;
        const targetVal = parseInt(targetRatingInput.value) || currentVal + STEP;

        currentRatingDisplay.textContent = currentVal;
        targetRatingDisplay.textContent = targetVal;

        badgeCur.querySelector('img').src = getImg(currentVal);
        badgeTar.querySelector('img').src = getImg(targetVal);
    };

    const updateExtrasDetails = extrasDetails => {
        let container = document.querySelector('.checkout-extras-details');
        if (!container) {
            container = document.createElement('div');
            container.className = 'checkout-extras-details';
            const totalRow = document.querySelector('.price-row.total');
            totalRow.parentNode.insertBefore(container, totalRow);
        }
        if (extrasDetails.length === 0) {
            container.innerHTML = '<div class="extra-detail-row">No extras selected</div>';
        } else {
            container.innerHTML = '<div class="extras-header">Extras Breakdown</div>' +
                extrasDetails.map(d =>
                    `<div class="extra-detail-row"><span class="extra-name">${d.name}</span>` +
                    `<span class="extra-percent">${d.percent}%</span><span class="extra-value">+$${d.value.toFixed(2)}</span></div>`
                ).join('');
        }
    };

    window.calculatePremier = () => { // Zmieniono na globalną funkcję
        let currentVal = parseInt(currentRatingInput.value) || 0;
        let targetVal = parseInt(targetRatingInput.value) || currentVal + STEP;

        currentVal = Math.max(0, Math.min(MAX_CUR, currentVal));
        targetVal = Math.max(currentVal + STEP, Math.min(MAX_TAR, targetVal));

        currentVal = Math.round(currentVal / STEP) * STEP;
        targetVal = Math.round(targetVal / STEP) * STEP;

        if (targetVal <= currentVal) {
            targetVal = currentVal + STEP;
        }

        currentRatingInput.value = currentVal;
        targetRatingInput.value = targetVal;

        updateDisplays();

        let totalPrice = 0;
        let tempCurrent = currentVal;

        while (tempCurrent < targetVal) {
            const remainingToTarget = targetVal - tempCurrent;
            let segmentPrice = 0;
            let segmentRating = 0;

            for (const range of priceRanges) {
                if (tempCurrent < range.maxRating + 1) {
                    segmentRating = Math.min(remainingToTarget, range.maxRating + 1 - tempCurrent);
                    segmentPrice = (segmentRating / 1000) * range.pricePer1000;
                    break;
                }
            }
            totalPrice += segmentPrice;
            tempCurrent += segmentRating;
        }

        let base = totalPrice;
        let extras = 0;
        const extrasDetails = [];

        const accType = document.querySelector('input[name="accType"]:checked')?.value;
        if (accType === 'duo') {
            const duoPercentage = 100;
            const duoValue = base * (duoPercentage / 100);
            extras += duoValue;
            extrasDetails.push({ name: 'Duo Queue', percent: duoPercentage, value: duoValue });
        }

        document.querySelectorAll('.customize-option input[type="checkbox"]:checked').forEach(opt => {
            const pct = parseFloat(opt.value) || 0;
            const val = base * pct / 100;
            extras += val;
            const map = {
                offline: 'Play Offline',
                streaming: 'Streaming',
                express: 'Express Delivery',
                solo: 'Solo Only',
                normalize: 'Normalize Scores'
            };
            extrasDetails.push({ name: map[opt.id] || opt.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), percent: pct, value: val });
        });

        const finalTotal = base + extras;

        baseEl.textContent = `$${base.toFixed(2)}`;
        extraEl.textContent = `$${extras.toFixed(2)}`;
        totalEl.textContent = `$${finalTotal.toFixed(2)}`;
        updateExtrasDetails(extrasDetails);
        
        // Brak logiki checkoutButton, ponieważ jest teraz w boostingzakup.js
    };

    document.querySelectorAll('.level-input-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            let input;
            if (target === 'current') input = currentRatingInput;
            else if (target === 'target') input = targetRatingInput;
            else return;

            let val = parseInt(input.value) || 0;
            val += btn.classList.contains('plus') ? STEP : -STEP;

            if (target === 'current') {
                val = Math.max(0, Math.min(MAX_CUR, val));
            } else if (target === 'target') {
                val = Math.max((parseInt(currentRatingInput.value) || 0) + STEP, Math.min(MAX_TAR, val));
            }

            input.value = val;
            window.calculatePremier(); // Wywołanie globalnej funkcji
        });
    });

    ['input', 'change'].forEach(evt => {
        currentRatingInput.addEventListener(evt, window.calculatePremier); // Wywołanie globalnej funkcji
        targetRatingInput.addEventListener(evt, window.calculatePremier); // Wywołanie globalnej funkcji
        document.querySelectorAll('input[name="accType"], .customize-option input[type="checkbox"]').forEach(el => el.addEventListener(evt, window.calculatePremier)); // Wywołanie globalnej funkcji
    });

    currentRatingInput.addEventListener('blur', window.calculatePremier); // Wywołanie globalnej funkcji
    targetRatingInput.addEventListener('blur', window.calculatePremier); // Wywołanie globalnej funkcji

    window.calculatePremier(); // Inicjalne wywołanie globalnej funkcji
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#current-rating-input')) {
        initPremierCalculator();
    }
});