// boostingzakup.js

// --- Inicjalizacja i obsługa kodów rabatowych ---
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
    let curr = parseFloat(totalEl.textContent.replace('$', '')) || 0;

    if (applied) {
      msg.textContent = 'Discount code already used!';
      msg.className = 'discount-message error';
    } else if (code === 'KING10') {
      applied = true;

      const discount = curr * rate;
      const basePrice = curr;
      const newPrice = Math.max(0, basePrice - discount);

      totalEl.textContent = `$${newPrice.toFixed(2)}`;
      totalEl.setAttribute('data-base-price', basePrice.toFixed(2));

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
            const basePrice = parseFloat(totalEl.getAttribute('data-base-price'));
            if (!isNaN(basePrice)) {
              const discount = basePrice * rate;
              const newPrice = Math.max(0, basePrice - discount);
              totalEl.textContent = `$${newPrice.toFixed(2)}`;

              msg.innerHTML = `✔ 10% discount applied!<br>` +
                `<span class="discount-details">You saved: <strong>$${discount.toFixed(2)}</strong></span>`;
              msg.className = 'discount-message success';
            }
          } else {
            const basePrice = parseFloat(totalEl.getAttribute('data-base-price'));
            if (!isNaN(basePrice)) {
              totalEl.textContent = `$${basePrice.toFixed(2)}`;
              msg.textContent = '';
              msg.className = 'discount-message';
            }
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

// --- Konfiguracja przycisku finalizacji zamówienia ---
const setupCheckoutButton = () => {
  const checkoutBtn = document.getElementById('checkout-btn'); // <- poprawka
  if (!checkoutBtn) return;

  checkoutBtn.addEventListener('click', e => {
    e.preventDefault(); // <- ważne, zawsze zatrzymuj domyślne zachowanie

    const regionSelected = document.querySelector('input[name="region"]:checked');
    if (!regionSelected) {
      showFloatingRegionError();
    } else {
      window.location.href = 'checkout.html';
    }
  });
};

// --- Inicjalizacja całego modułu po załadowaniu DOM ---
document.addEventListener('DOMContentLoaded', () => {
  initDiscount();
  setupCheckoutButton();
});