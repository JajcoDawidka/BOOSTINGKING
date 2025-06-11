// booster.js – Panel Boostera

// Inicjalizacja po załadowaniu DOM
// ----------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  let token = localStorage.getItem('token');
  let userData = null;

  try {
    const userDataString = localStorage.getItem('userData');
    userData = userDataString ? JSON.parse(userDataString) : null;

    if (!token || !userData || userData.role !== 'booster') throw new Error('Brak dostępu');
  } catch (err) {
    console.error('Błąd autoryzacji:', err);
    alert('Dostęp tylko dla boosterów. Zaloguj się.');
    return (window.location.href = 'login.html');
  }

  try {
    document.getElementById('profile-username').textContent = userData.username || 'Booster';

    document.getElementById('auth-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = 'login.html';
    });

    await Promise.all([
      fetchActiveOrders(),
      fetchOrderHistory(),
      fetchRanking(),
      fetchAccountStatus()
    ]);

    document.getElementById('availability-toggle')?.addEventListener('click', toggleAvailability);
    document.getElementById('support-btn')?.addEventListener('click', () => {
      window.location.href = 'contact.html?subject=Booster+Support';
    });
  } catch (error) {
    console.error('Błąd inicjalizacji:', error);
    showErrorToast('Nie udało się załadować panelu');
  }
});

// Pobranie aktywnych zamówień
// -----------------------------
async function fetchActiveOrders() {
  const container = document.querySelector('.orders-list');
  container?.classList.add('loading');

  try {
    const res = await fetch('https://boosting-backend.onrender.com/api/booster/active-orders', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Status: ${res.status}`);

    const orders = await res.json();
    container.classList.remove('loading');

    if (!orders.length) {
      container.innerHTML = '<div class="no-orders">Brak aktywnych zamówień</div>';
      document.getElementById('active-orders-count').textContent = '0';
      return;
    }

    container.innerHTML = orders.map(orderCardHTML).join('');
    document.getElementById('active-orders-count').textContent = orders.length;

    document.querySelectorAll('.view-details').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = `order-details.html?id=${btn.dataset.id}`;
      });
    });
  } catch (err) {
    handleFetchError(container, 'Nie udało się pobrać aktywnych zamówień', fetchActiveOrders);
  }
}

// Historia zamówień + zarobki
// -----------------------------
async function fetchOrderHistory() {
  const container = document.querySelector('.history-list');
  container?.classList.add('loading');

  try {
    const res = await fetch('https://boosting-backend.onrender.com/api/booster/order-history', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Status: ${res.status}`);

    const orders = await res.json();
    container.classList.remove('loading');

    if (!orders.length) {
      container.innerHTML = '<div class="no-orders">Brak historii</div>';
      document.getElementById('completed-orders-count').textContent = '0';
      document.getElementById('earnings-amount').textContent = '$0.00';
      return;
    }

    container.innerHTML = orders.slice(0, 5).map(historyCardHTML).join('');
    document.getElementById('completed-orders-count').textContent = orders.length;

    const total = orders.reduce((sum, o) => sum + o.earnings, 0);
    document.getElementById('earnings-amount').textContent = `$${total.toFixed(2)}`;
  } catch (err) {
    handleFetchError(container, 'Nie udało się załadować historii', fetchOrderHistory);
  }
}

// Leaderboard boosterów
// ------------------------
async function fetchRanking() {
  const container = document.querySelector('.ranking-list');
  container?.classList.add('loading');

  try {
    const res = await fetch('https://boosting-backend.onrender.com/api/booster/leaderboard', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Status: ${res.status}`);

    const boosters = await res.json();
    container.classList.remove('loading');

    if (!boosters.length) {
      container.innerHTML = '<div class="no-data">Brak danych</div>';
      document.getElementById('ranking-position').textContent = '#-';
      return;
    }

    container.innerHTML = boosters.slice(0, 10).map((b, i) => `
      <li class="ranking-item ${b.isCurrent ? 'current-user' : ''}">
        <span class="rank">${i + 1}.</span>
        <span class="name">${b.username}</span>
        <span class="points">${b.points} pts</span>
      </li>
    `).join('');

    const current = boosters.find(b => b.isCurrent);
    if (current) document.getElementById('ranking-position').textContent = `#${current.position}`;
  } catch (err) {
    handleFetchError(container, 'Błąd ładowania rankingu', fetchRanking);
  }
}

// Status konta boostera
// ----------------------
async function fetchAccountStatus() {
  const container = document.querySelector('.status-info');
  container?.classList.add('loading');

  try {
    const res = await fetch('https://boosting-backend.onrender.com/api/booster/status', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error(`Status: ${res.status}`);

    const data = await res.json();
    container.classList.remove('loading');

    container.innerHTML = `
      <div class="status-card">
        <div class="status-item"><span class="label">Status:</span><span class="value badge ${data.status.toLowerCase()}">${data.status}</span></div>
        <div class="status-item"><span class="label">Ocena:</span><span class="value">${data.rating}/5.0 (${data.reviews} recenzji)</span></div>
        <div class="status-item"><span class="label">Od:</span><span class="value">${new Date(data.joinDate).toLocaleDateString()}</span></div>
      </div>`;

    const btn = document.getElementById('availability-toggle');
    if (btn) {
      btn.textContent = data.available ? 'Ustaw jako niedostępny' : 'Ustaw jako dostępny';
      btn.className = data.available ? 'btn warning' : 'btn success';
    }
  } catch (err) {
    handleFetchError(container, 'Błąd pobierania statusu konta', fetchAccountStatus);
  }
}

// Przełączanie dostępności
// -------------------------
async function toggleAvailability() {
  const btn = document.getElementById('availability-toggle');
  if (!btn) return;

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aktualizacja...';

    const res = await fetch('https://boosting-backend.onrender.com/api/booster/toggle-availability', {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!res.ok) throw new Error(`Status: ${res.status}`);
    const data = await res.json();

    btn.innerHTML = data.available ? 'Ustaw jako niedostępny' : 'Ustaw jako dostępny';
    btn.className = data.available ? 'btn warning' : 'btn success';
    showSuccessToast(`Status: ${data.available ? 'Dostępny' : 'Niedostępny'}`);
  } catch (err) {
    console.error('toggleAvailability error:', err);
    showErrorToast('Nie udało się zmienić dostępności');
  } finally {
    btn.disabled = false;
  }
}

// Szablony kart
// -------------------------
function orderCardHTML(order) {
  return `
    <div class="order-card">
      <div class="order-header">
        <span class="order-id">#${order.id}</span>
        <span class="order-status ${order.status.toLowerCase()}">${order.status}</span>
      </div>
      <div class="order-body">
        <p><i class="fas fa-gamepad"></i> ${order.game}</p>
        <p><i class="fas fa-calendar"></i> ${new Date(order.createdAt).toLocaleDateString()}</p>
        <p><i class="fas fa-coins"></i> $${order.reward.toFixed(2)}</p>
      </div>
      <button class="btn view-details" data-id="${order.id}">Szczegóły <i class="fas fa-chevron-right"></i></button>
    </div>`;
}

function historyCardHTML(order) {
  return `
    <div class="order-card">
      <div class="order-header">
        <span class="order-id">#${order.id}</span>
        <span class="order-status completed">Zakończone</span>
      </div>
      <div class="order-body">
        <p><i class="fas fa-check-circle"></i> ${new Date(order.completedDate).toLocaleDateString()}</p>
        <p><i class="fas fa-coins"></i> $${order.earnings.toFixed(2)}</p>
      </div>
    </div>`;
}

// Uniwersalne funkcje
// -------------------------
function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  };
}

function handleFetchError(container, msg, retryFn) {
  console.error(msg);
  if (container) {
    container.classList.remove('loading');
    container.innerHTML = `
      <div class="error-card">
        <i class="fas fa-exclamation-triangle"></i>
        <p>${msg}</p>
        <button class="btn retry-btn" onclick="(${retryFn.toString()})()">Spróbuj ponownie</button>
      </div>`;
  }
  showErrorToast(msg);
}

function showSuccessToast(message) {
  toast(message, 'success');
}

function showErrorToast(message) {
  toast(message, 'error');
}

function toast(message, type) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// Modal z regulaminem
// -------------------------
function toggleRulesModal() {
  const modal = document.getElementById('rules-modal');
  modal.style.display = (modal.style.display === 'flex' || modal.style.display === '') ? 'none' : 'flex';
}
