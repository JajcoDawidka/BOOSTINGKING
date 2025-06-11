// faceit.js

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

  // Map ELO to Faceit levels
  const getFaceitLevel = (elo) => {
    elo = parseInt(elo) || 100;
    if (elo >= 2001) return 10;
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

  const calculateFaceit = () => {
    let start = parseInt(currentElo.value) || 100;
    let end = parseInt(targetElo.value) || start + 50;

    if (start < 100) start = 100;
    if (start > 2150) start = 2150;
    if (end <= start) end = start + 50;
    if (end > 2200) end = 2200;
    
    currentElo.value = start;
    targetElo.value = end;

    const diff = end - start;
    const base = Math.floor(diff / 50) * 5; // $5 per 50 ELO

    let extras = 0;
    const extrasDetails = [];
    const accType = document.querySelector('input[name="accType"]:checked')?.value;
    if (accType === 'duo') {
      extras += base;
      extrasDetails.push({ name: 'Duo Queue', percent: 100, value: base });
    }
    
    document.querySelectorAll('.custom-opt:checked').forEach(opt => {
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
      extrasDetails.push({ name: map[opt.id] || opt.id, percent: pct, value: val });
    });

    baseEl.textContent = `$${base.toFixed(2)}`;
    extraEl.textContent = `$${extras.toFixed(2)}`;
    totalEl.textContent = `$${(base + extras).toFixed(2)}`;
    updateExtrasDetails(extrasDetails);

    const startLevel = getFaceitLevel(start);
    const endLevel = getFaceitLevel(end);
    if (imgStart) imgStart.src = `faceit${startLevel}.svg`;
    if (imgEnd) imgEnd.src = `faceit${endLevel}.svg`;
  };

  document.querySelectorAll('.faceit-boosting .level-input-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isPlus = btn.classList.contains('plus');
      const input = btn.closest('.level-input-group').querySelector('input');
      input.value = parseInt(input.value) + (isPlus ? 50 : -50);
      calculateFaceit();
    });
  });

  ['input', 'change'].forEach(evt => {
    currentElo.addEventListener(evt, calculateFaceit);
    targetElo.addEventListener(evt, calculateFaceit);
    document.querySelectorAll('input[name="accType"], input[name="region"], .custom-opt')
      .forEach(el => el.addEventListener(evt, calculateFaceit));
  });

  calculateFaceit();
};

// Automatycznie inicjalizuj po załadowaniu DOM, jeśli na stronie są elementy Faceit
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#current-elo')) {
    initFaceitCalculator();
  }
});
