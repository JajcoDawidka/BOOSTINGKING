const initPremierCalculator = () => {
  const currentRatingInput = document.getElementById('current-rating-input');
  if (!currentRatingInput) return;

  const pricePer1000 = 15;
  const MAX_CUR = 25000;
  const MAX_TAR = 26000;
  const STEP = 250;
  const baseEl = document.getElementById('base-price');
  const extraEl = document.getElementById('extra-price');
  const totalEl = document.getElementById('total-price');
  const targetRatingInput = document.getElementById('target-rating-input');
  const badgeCur = document.getElementById('current-badge');
  const badgeTar = document.getElementById('target-badge');
  const currentRatingDisplay = badgeCur.querySelector('.rating-value');
  const targetRatingDisplay = badgeTar.querySelector('.rating-value');

  const getImg = v =>
    v < 5000 ? 'premier1.webp'
    : v < 10000 ? 'premier2.webp'
    : v < 15000 ? 'premier3.webp'
    : v < 20000 ? 'premier4.webp'
    : v < 25000 ? 'premier5.webp'
    : 'premier6.webp';

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

  const calculatePremier = () => {
    let currentVal = parseInt(currentRatingInput.value) || 0;
    let targetVal = parseInt(targetRatingInput.value) || currentVal + STEP;

    if (currentVal < 0) currentVal = 0;
    if (currentVal > MAX_CUR) currentVal = MAX_CUR;
    if (targetVal <= currentVal) targetVal = currentVal + STEP;
    if (targetVal > MAX_TAR) targetVal = MAX_TAR;

    currentRatingInput.value = currentVal;
    targetRatingInput.value = targetVal;

    updateDisplays();

    const diff = targetVal - currentVal;
    const base = Math.floor(diff / 1000) * pricePer1000;

    let extras = 0;
    const extrasDetails = [];

    document.querySelectorAll('.custom-opt:checked').forEach(opt => {
      const pct = parseFloat(opt.value) || 0;
      const val = base * pct / 100;
      extras += val;
      const map = {
        offline: 'Play Offline',
        streaming: 'Streaming',
        express: 'Express Delivery',
        duo: 'Duo Queue',
        normalize: 'Normalize Scores'
      };
      extrasDetails.push({ name: map[opt.id] || opt.id, percent: pct, value: val });
    });

    baseEl.textContent = `$${base.toFixed(2)}`;
    extraEl.textContent = `$${extras.toFixed(2)}`;
    totalEl.textContent = `$${(base + extras).toFixed(2)}`;
    updateExtrasDetails(extrasDetails);
  };

  document.querySelectorAll('.level-input-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target'); // 'current' lub 'target'
      let input;
      if (target === 'current') input = currentRatingInput;
      else if (target === 'target') input = targetRatingInput;
      else return;

      let val = parseInt(input.value) || 0;
      val += btn.classList.contains('plus') ? STEP : -STEP;

      if (target === 'current') {
        if (val < 0) val = 0;
        if (val > MAX_CUR) val = MAX_CUR;
      } else if (target === 'target') {
        if (val <= (parseInt(currentRatingInput.value) || 0)) val = (parseInt(currentRatingInput.value) || 0) + STEP;
        if (val > MAX_TAR) val = MAX_TAR;
      }

      input.value = val;
      calculatePremier();
    });
  });

  ['input', 'change'].forEach(evt => {
    currentRatingInput.addEventListener(evt, calculatePremier);
    targetRatingInput.addEventListener(evt, calculatePremier);
    document.querySelectorAll('.custom-opt').forEach(el => el.addEventListener(evt, calculatePremier));
  });

  calculatePremier();
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('#current-rating-input')) {
    initPremierCalculator();
  }
});
