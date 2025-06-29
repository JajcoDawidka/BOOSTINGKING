// booster.js – Booster Panel

const REFRESH_INTERVAL_AVAILABLE = 15000;
const REFRESH_INTERVAL_ACTIVE = 30000;
const REFRESH_INTERVAL_COMPLETED = 60000;
const REFRESH_INTERVAL_STATS = 10000;

const BOOSTER_COMMISSION_RATE = 0.60; // 60% prowizji dla boostera

let availableOrdersInterval;
let activeOrdersInterval;
let completedOrdersInterval;
let boosterStatsInterval;

async function initBoosterPanel(userData) {
    console.log('[booster.js] initBoosterPanel - STARTING. Received userData:', userData);
    console.log('[booster.js] initBoosterPanel: Authorization OK. Continuing panel load.');

    try {
        const authLinkEl = document.getElementById('auth-link');
        if (authLinkEl) {
            authLinkEl.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof logoutUser === 'function') {
                    clearInterval(availableOrdersInterval);
                    clearInterval(activeOrdersInterval);
                    clearInterval(completedOrdersInterval);
                    clearInterval(boosterStatsInterval);
                    logoutUser();
                } else {
                    console.error('logoutUser function is not available. Clearing localStorage and redirecting.');
                    localStorage.clear();
                    window.location.href = 'login.html';
                }
            });
        } else {
            console.warn('[booster.js] Element with ID "auth-link" not found. This is normal if general.js handles it.');
        }

        await Promise.all([
            fetchAvailableOrders(),
            fetchActiveOrders(),
            fetchCompletedOrders(),
            fetchBoosterStats(),
        ]);

        availableOrdersInterval = setInterval(fetchAvailableOrders, REFRESH_INTERVAL_AVAILABLE);
        activeOrdersInterval = setInterval(fetchActiveOrders, REFRESH_INTERVAL_ACTIVE);
        completedOrdersInterval = setInterval(fetchCompletedOrders, REFRESH_INTERVAL_COMPLETED);
        boosterStatsInterval = setInterval(fetchBoosterStats, REFRESH_INTERVAL_STATS);

    } catch (error) {
        console.error('[booster.js] Booster panel initialization error:', error);
        if (typeof showErrorToast === 'function') {
            showErrorToast('Failed to load booster panel.');
        }
    }
}

async function fetchBoosterStats() {
    const completedOrdersCountEl = document.getElementById('completed-orders-count');
    const earningsAmountEl = document.getElementById('earnings-amount');
    const rankingPositionEl = document.getElementById('ranking-position');

    if (completedOrdersCountEl) completedOrdersCountEl.innerHTML = '<i class="fas fa-spinner fa-spin loading-spinner-small"></i>';
    if (earningsAmountEl) earningsAmountEl.innerHTML = '<i class="fas fa-spinner fa-spin loading-spinner-small"></i>';
    if (rankingPositionEl) rankingPositionEl.innerHTML = '<i class="fas fa-spinner fa-spin loading-spinner-small"></i>';

    try {
        const res = await fetch(`${API_BASE_URL}/api/booster/stats.php`, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders()
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `Status: ${res.status} ${res.statusText}`);
        }

        const stats = await res.json();
        console.log('[booster.js] Pobrane statystyki boostera:', stats);

        if (stats.success) {
            if (completedOrdersCountEl) {
                completedOrdersCountEl.textContent = stats.completedOrders || 0;
            }
            if (earningsAmountEl) {
                // earnings jest już obliczone jako 60% na backendzie
                earningsAmountEl.textContent = `$${(parseFloat(stats.earnings) || 0).toFixed(2)}`;
            }
            if (rankingPositionEl) {
                rankingPositionEl.textContent = stats.ranking ? `#${stats.ranking}` : '#-';
            }
        } else {
            throw new Error(stats.message || 'Failed to retrieve booster stats.');
        }

    } catch (err) {
        console.error('[booster.js] Error fetching booster stats:', err);
        if (completedOrdersCountEl) completedOrdersCountEl.textContent = 'Error';
        if (earningsAmountEl) earningsAmountEl.textContent = '$N/A';
        if (rankingPositionEl) rankingPositionEl.textContent = '#-';
        if (typeof showErrorToast === 'function') {
            showErrorToast(err.message || 'Failed to load booster statistics.');
        }
    }
}


async function fetchAvailableOrders() {
    const container = document.getElementById('available-orders-list');
    if (!container) return;
    container.innerHTML = '<div class="loading-spinner-small"></div> Loading orders...';
    container.classList.add('loading');

    try {
        const res = await fetch(`${API_BASE_URL}/api/booster/available-orders.php`, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `Status: ${res.status} ${res.statusText}`);
        }

        const orders = await res.json();
        container.classList.remove('loading');

        if (!orders || orders.length === 0) {
            container.innerHTML = '<div class="no-orders">No orders available for acceptance.</div>';
            return;
        }

        container.innerHTML = orders.map(order => availableOrderCardHTML(order)).join('');

        document.querySelectorAll('#available-orders-list .accept-order-btn').forEach(btn => {
            btn.addEventListener('click', () => acceptOrder(btn.dataset.id));
        });

    } catch (err) {
        console.error('[booster.js] Error fetching available orders:', err);
        if (typeof showErrorToast === 'function') {
            showErrorToast(err.message || 'Failed to load available orders.');
        }
        container.innerHTML = `<div class="error-message">Error loading available orders: ${err.message}.</div>`;
        container.classList.remove('loading');
    }
}

async function fetchActiveOrders() {
    const container = document.getElementById('active-orders-list');
    if (!container) return;
    container.innerHTML = '<div class="loading-spinner-small"></div> Loading orders...';
    container.classList.add('loading');

    try {
        const res = await fetch(`${API_BASE_URL}/api/booster/active-orders.php`, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `Status: ${res.status} ${res.statusText}`);
        }

        const orders = await res.json();
        container.classList.remove('loading');

        if (!orders || orders.length === 0) {
            container.innerHTML = '<div class="no-orders">You currently have no active orders.</div>';
            return;
        }

        container.innerHTML = orders.map(order => activeOrderCardHTML(order)).join('');

        document.querySelectorAll('#active-orders-list .chat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.href = `chat.html?orderId=${btn.dataset.id}`;
            });
        });

        document.querySelectorAll('#active-orders-list .complete-order-btn').forEach(btn => {
            btn.addEventListener('click', () => completeOrder(btn.dataset.id));
        });

    } catch (err) {
        console.error('[booster.js] Error fetching active orders:', err);
        if (typeof showErrorToast === 'function') {
            showErrorToast(err.message || 'Failed to load active orders.');
        }
        container.innerHTML = `<div class="error-message">Error loading active orders: ${err.message}.</div>`;
        container.classList.remove('loading');
    }
}

async function fetchCompletedOrders() {
    const container = document.getElementById('completed-orders-list');
    if (!container) return;
    container.innerHTML = '<div class="loading-spinner-small"></div> Loading orders...';
    container.classList.add('loading');

    try {
        const res = await fetch(`${API_BASE_URL}/api/booster/completed-orders.php`, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `Status: ${res.status} ${res.statusText}`);
        }

        const orders = await res.json();
        container.classList.remove('loading');

        if (!orders || orders.length === 0) {
            container.innerHTML = '<div class="no-orders">You have not completed any orders yet.</div>';
            return;
        }

        container.innerHTML = orders.map(order => completedOrderCardHTML(order)).join('');

    } catch (err) {
        console.error('[booster.js] Error fetching completed orders:', err);
        if (typeof showErrorToast === 'function') {
            showErrorToast(err.message || 'Failed to load completed orders.');
        }
        container.innerHTML = `<div class="error-message">Error loading completed orders: ${err.message}.</div>`;
        container.classList.remove('loading');
    }
}

async function acceptOrder(orderId) {
    if (!confirm(`Are you sure you want to accept order #${orderId}?`)) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/booster/accept-order.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ orderId: orderId })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `Failed to accept order. Status: ${res.status}`);
        }

        const data = await res.json();
        if (data.success) {
            if (typeof showSuccessToast === 'function') {
                showSuccessToast(data.message || `Order #${orderId} accepted!`);
            }
            // Odśwież statystyki po zaakceptowaniu, aby zaktualizować potencjalne zarobki/ranking
            await Promise.all([fetchAvailableOrders(), fetchActiveOrders(), fetchBoosterStats()]);
        } else {
            throw new Error(data.message || 'Failed to accept order.');
        }
    } catch (err) {
        console.error('[booster.js] Error accepting order:', err);
        if (typeof showErrorToast === 'function') {
            showErrorToast(err.message || `Failed to accept order #${orderId}.`);
        }
    }
}

async function completeOrder(orderId) {
    if (!confirm(`Are you sure you want to mark order #${orderId} as completed?`)) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/booster/complete-order.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ orderId: orderId })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `Failed to complete order. Status: ${res.status}`);
        }

        const data = await res.json();
        if (data.success) {
            if (typeof showSuccessToast === 'function') {
                showSuccessToast(data.message || `Order #${orderId} marked as completed!`);
            }
            // Odśwież statystyki po ukończeniu, aby zaktualizować faktyczne zarobki/ranking
            await Promise.all([fetchActiveOrders(), fetchCompletedOrders(), fetchBoosterStats()]);
        } else {
            throw new Error(data.message || 'Failed to complete order.');
        }
    } catch (err) {
        console.error('[booster.js] Error completing order:', err);
        if (typeof showErrorToast === 'function') {
            showErrorToast(err.message || `Failed to complete order #${orderId}.`);
        }
    }
}

// Funkcja pomocnicza do parsowania i formatowania customizacji
function formatCustomizations(customizationsJson) {
    let customizations = [];
    try {
        if (customizationsJson) {
            const parsedCustoms = JSON.parse(customizationsJson);
            if (Array.isArray(parsedCustoms)) {
                customizations = parsedCustoms.map(c => {
                    switch (c) {
                        case 'offline': return 'Play Offline';
                        case 'streaming': return 'Streaming';
                        case 'express': return 'Express Delivery';
                        case 'solo': return 'Solo Only';
                        case 'normalize': return 'Normalize Scores';
                        default: return c;
                    }
                });
            } else if (typeof parsedCustoms === 'string') {
                customizations.push(parsedCustoms);
            }
        }
    } catch (e) {
        console.error('Error parsing customizations:', e, customizationsJson);
    }
    return customizations.length > 0 ? customizations.join(', ') : 'None';
}


// Karta dla zamówień DOSTĘPNYCH
function availableOrderCardHTML(order) {
    const levelDisplay = order.current_level && order.desired_level
        ? `${order.current_level} → ${order.desired_level}`
        : 'N/A';
    // Oblicz nagrodę dla boostera w karcie
    const boosterReward = (parseFloat(order.total_price) * BOOSTER_COMMISSION_RATE || 0).toFixed(2);
    const currencySymbol = order.currency || '$';
    const customizationsDisplay = formatCustomizations(order.customizations);

    return `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">#${order.id}</span>
                <span class="order-status pending">Available</span>
            </div>
            <div class="order-body">
                <p><i class="fas fa-gamepad"></i> <span>${order.service_type || 'Unknown Service'}</span></p>
                <p><i class="fas fa-chart-line"></i> <span>Level: ${levelDisplay}</span></p>
                <p><i class="fas fa-coins"></i> <span>Your Reward: ${currencySymbol}${boosterReward}</span></p>
                <p><i class="fas fa-globe-americas"></i> <span>Region: ${order.region || 'N/A'}</span></p>
                <p><i class="fas fa-user-friends"></i> <span>Type: ${order.account_type || 'N/A'}</span></p>
                <p><i class="fas fa-cogs"></i> <span>Custom: ${customizationsDisplay}</span></p>
            </div>
            <button class="btn success accept-order-btn" data-id="${order.id}">Accept Order</button>
        </div>`;
}

// Karta dla zamówień AKTYWNYCH
function activeOrderCardHTML(order) {
    const levelDisplay = order.current_level && order.desired_level
        ? `${order.current_level} → ${order.desired_level}`
        : 'N/A';
    // Oblicz nagrodę dla boostera w karcie
    const boosterReward = (parseFloat(order.total_price) * BOOSTER_COMMISSION_RATE || 0).toFixed(2);
    const currencySymbol = order.currency || '$';
    const customizationsDisplay = formatCustomizations(order.customizations);

    return `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">#${order.id}</span>
                <span class="order-status in-progress">Active</span>
            </div>
            <div class="order-body">
                <p><i class="fas fa-gamepad"></i> <span>${order.service_type || 'Unknown Service'}</span></p>
                <p><i class="fas fa-chart-line"></i> <span>Level: ${levelDisplay}</span></p>
                <p><i class="fas fa-coins"></i> <span>Your Reward: ${currencySymbol}${boosterReward}</span></p>
                <p><i class="fas fa-globe-americas"></i> <span>Region: ${order.region || 'N/A'}</span></p>
                <p><i class="fas fa-user-friends"></i> <span>Type: ${order.account_type || 'N/A'}</span></p>
                <p><i class="fas fa-cogs"></i> <span>Custom: ${customizationsDisplay}</span></p>
            </div>
            <button class="btn success complete-order-btn" data-id="${order.id}">Mark as Completed</button>
            <button class="btn secondary chat-btn" data-id="${order.id}"><i class="fas fa-comment"></i> Chat</button>
        </div>`;
}

// Karta dla zamówień ZAKOŃCZONYCH
function completedOrderCardHTML(order) {
    const levelDisplay = order.current_level && order.desired_level
        ? `${order.current_level} → ${order.desired_level}`
        : 'N/A';
    // Oblicz nagrodę dla boostera w karcie (tutaj "Earnings")
    const boosterEarnings = (parseFloat(order.total_price) * BOOSTER_COMMISSION_RATE || 0).toFixed(2);
    const currencySymbol = order.currency || '$';
    const completionDate = order.completed_date ? new Date(order.completed_date).toLocaleDateString() : 'N/A';
    const customizationsDisplay = formatCustomizations(order.customizations);

    return `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">#${order.id}</span>
                <span class="order-status completed">Completed</span>
            </div>
            <div class="order-body">
                <p><i class="fas fa-gamepad"></i> <span>${order.service_type || 'Unknown Service'}</span></p>
                <p><i class="fas fa-chart-line"></i> <span>Level: ${levelDisplay}</span></p>
                <p><i class="fas fa-coins"></i> <span>Earnings: ${currencySymbol}${boosterEarnings}</span></p>
                <p><i class="fas fa-calendar-check"></i> <span>On: ${completionDate}</span></p>
                <p><i class="fas fa-globe-americas"></i> <span>Region: ${order.region || 'N/A'}</span></p>
                <p><i class="fas fa-user-friends"></i> <span>Type: ${order.account_type || 'N/A'}</span></p>
                <p><i class="fas fa-cogs"></i> <span>Custom: ${customizationsDisplay}</span></p>
            </div>
        </div>`;
}

// Universal functions (assumed to be from general.js or defined globally)
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json'
    };
}

function showSuccessToast(message) {
    if (typeof toast === 'function') {
        toast(message, 'success');
    } else {
        console.warn('Toast function not available. Message:', message);
    }
}

function showErrorToast(message) {
    if (typeof toast === 'function') {
        toast(message, 'error');
    } else {
        console.warn('Toast function not available. Message:', message);
    }
}

// Fallback toast function if not globally defined (remove if already in general.js)
function toast(message, type) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function handleFetchError(container, message, retryFunction) {
    container.innerHTML = `<div class="error-message">${message}. <button onclick="${retryFunction.name}()">Try again</button></div>`;
    container.classList.remove('loading');
    if (typeof showErrorToast === 'function') {
        showErrorToast(message);
    }
}

// Optional functions (review if still needed or duplicated)
async function fetchOrderHistory() {
    const container = document.querySelector('.history-list');
    if (!container) return;
    container.classList.add('loading');

    try {
        const res = await fetch(`${API_BASE_URL}/api/booster/order-history.php`, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `Status: ${res.status} ${res.statusText}`);
        }

        const orders = await res.json();
        container.classList.remove('loading');

        if (!orders || orders.length === 0) {
            container.innerHTML = '<div class="no-orders">No order history available.</div>';
            return;
        }
        container.innerHTML = orders.slice(0, 5).map(historyCardHTML).join('');

    } catch (err) {
        console.error('[booster.js] Error fetching order history:', err);
        handleFetchError(container, 'Failed to load order history.', fetchOrderHistory);
    }
}

function historyCardHTML(order) {
    const earningsFormatted = (parseFloat(order.earnings || order.reward) || 0).toFixed(2);
    const currencySymbol = order.currency || '$';
    const completionDate = order.completedDate ? new Date(order.completedDate).toLocaleDateString() : 'N/A';

    return `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">#${order.id}</span>
                <span class="order-status completed">Completed</span>
            </div>
            <div class="order-body">
                <p><i class="fas fa-calendar-check"></i> <span>${completionDate}</span></p>
                <p><i class="fas fa-coins"></i> <span>${currencySymbol}${earningsFormatted}</span></p>
            </div>
        </div>`;
}

async function fetchRanking() {
    const container = document.querySelector('.ranking-list');
    if (!container) return;
    container.classList.add('loading');

    try {
        const res = await fetch(`${API_BASE_URL}/api/booster/leaderboard.php`, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || `Status: ${res.status} ${res.statusText}`);
        }

        const boosters = await res.json();
        container.classList.remove('loading');

        if (!boosters || boosters.length === 0) {
            container.innerHTML = '<div class="no-data">No ranking data.</div>';
            return;
        }

        container.innerHTML = boosters.slice(0, 10).map((b, i) => `
            <li class="ranking-item ${b.isCurrent ? 'current-user' : ''}">
                <span class="rank">${i + 1}.</span>
                <span class="name">${b.username}</span>
                <span class="points">${b.points} pts</span>
            </li>
        `).join('');

    } catch (err) {
        console.error('[booster.js] Error fetching ranking:', err);
        handleFetchError(container, 'Error loading ranking.', fetchRanking);
    }
}

// ZAKTUALIZOWANA FUNKCJA
function toggleRulesModal() {
    const modal = document.getElementById('rules-modal');
    modal.classList.toggle('show-modal'); // Dodaj lub usuń klasę 'show-modal'
}