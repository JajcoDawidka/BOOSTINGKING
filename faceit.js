// Faceit Boosting Calculator
const initFaceitCalculator = () => {
    const currentElo = document.getElementById('current-elo');
    const targetElo = document.getElementById('target-elo');
    if (!currentElo || !targetElo) return;

    const baseEl = document.getElementById('base-price');
    const extraEl = document.getElementById('extra-price');
    const totalEl = document.getElementById('total-price');
    const imgStart = document.getElementById('img-start');
    const imgEnd = document.getElementById('img-end');
    // const checkoutButton = document.getElementById('checkout-button'); // Przenosimy do boostingzakup.js

    // Zaktualizowane ceny za 100 ELO w USD (obniżone o 10%)
    const pricePer100Elo = {
        // Poziom 1-3
        '1': 7 * 0.9, '2': 7 * 0.9, '3': 7 * 0.9, // -> 6.3 USD
        // Poziom 3-5
        '4': 10 * 0.9, '5': 10 * 0.9,             // -> 9.0 USD
        // Poziom 5-7
        '6': 15 * 0.9, '7': 15 * 0.9,             // -> 13.5 USD
        // Poziom 7-9
        '8': 22 * 0.9, '9': 22 * 0.9,             // -> 19.8 USD
        // Poziom 9-10
        '10': 35 * 0.9                           // -> 31.5 USD
    };

    // Map ELO to Faceit levels
    const getFaceitLevel = (elo) => {
        elo = parseInt(elo) || 100;
        if (elo >= 2001) return 10; // Faceit Level 10 zaczyna się od 2001 ELO
        if (elo >= 1751) return 9;
        if (elo >= 1531) return 8;
        if (elo >= 1351) return 7;
        if (elo >= 1201) return 6;
        if (elo >= 1051) return 5;
        if (elo >= 901) return 4;
        if (elo >= 751) return 3;
        if (elo >= 501) return 2;
        return 1;
    };

    // Granice ELO dla każdego poziomu (górne, wyłączając następny poziom)
    const levelEloBoundaries = {
        1: 500, 2: 750, 3: 900, 4: 1050, 5: 1200,
        6: 1350, 7: 1530, 8: 1750, 9: 2000, // Zmieniono granicę dla poziomu 9/10 na 2000 ELO
        10: 2000 // Maksymalne ELO na Faceit to teraz 2000
    };

    const MAX_CUR_ELO = 1950; // Maksymalne ELO, które można wybrać jako początkowe (aby cel 2000 był możliwy)
    const MAX_TAR_ELO = 2000; // Nowe maksymalne docelowe ELO dla Faceit

    const updateExtrasDetails = (extrasDetails) => {
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

    window.calculateFaceit = () => { // Zmieniono na globalną funkcję
        let start = parseInt(currentElo.value) || 100;
        let end = parseInt(targetElo.value) || start + 50;

        start = Math.max(100, Math.min(MAX_CUR_ELO, start));
        end = Math.max(start + 50, Math.min(MAX_TAR_ELO, end));

        start = Math.round(start / 50) * 50;
        end = Math.round(end / 50) * 50;

        if (end <= start) {
            end = start + 50;
        }

        currentElo.value = start;
        targetElo.value = end;

        let totalPrice = 0;
        let tempCurrent = start;

        while (tempCurrent < end) {
            const currentLevel = getFaceitLevel(tempCurrent);
            const priceFor100 = pricePer100Elo[currentLevel.toString()];

            const nextLevelBoundaryElo = levelEloBoundaries[currentLevel] + 1;
            const eloInCurrentLevelSegment = Math.min(end - tempCurrent, nextLevelBoundaryElo - tempCurrent);

            if (eloInCurrentLevelSegment <= 0) break;

            totalPrice += (eloInCurrentLevelSegment / 100) * priceFor100;
            tempCurrent += eloInCurrentLevelSegment;
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

    document.querySelectorAll('.faceit-boosting .level-input-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const isPlus = btn.classList.contains('plus');
            const input = btn.closest('.level-input-group').querySelector('input');
            let val = parseInt(input.value) || 0;
            val += isPlus ? 50 : -50;

            if (input.id === 'current-elo') {
                val = Math.max(100, Math.min(MAX_CUR_ELO, val));
            } else if (input.id === 'target-elo') {
                val = Math.max((parseInt(currentElo.value) || 0) + 50, Math.min(MAX_TAR_ELO, val));
            }
            input.value = val;
            window.calculateFaceit(); // Wywołanie globalnej funkcji
        });
    });

    ['input', 'change'].forEach(evt => {
        currentElo.addEventListener(evt, window.calculateFaceit); // Wywołanie globalnej funkcji
        targetElo.addEventListener(evt, window.calculateFaceit); // Wywołanie globalnej funkcji
        document.querySelectorAll('input[name="accType"], .customize-option input[type="checkbox"]')
            .forEach(el => el.addEventListener(evt, window.calculateFaceit)); // Wywołanie globalnej funkcji
    });

    currentElo.addEventListener('blur', window.calculateFaceit); // Wywołanie globalnej funkcji
    targetElo.addEventListener('blur', window.calculateFaceit); // Wywołanie globalnej funkcji

    window.calculateFaceit();
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#current-elo')) {
        initFaceitCalculator();
    }
});