// chat.js

const CHAT_REFRESH_INTERVAL = 3000;
let orderId;
let currentUserId;
let currentUserRole;
let orderStatus; // Store order status

// Audio object for notification sound
// WAŻNE: ZMIEŃ PONIŻSZĄ ŚCIEŻKĘ NA RZECZYWISTĄ ŚCIEŻKĘ DO TWOJEGO PLIKU MP3/WAV!
// Przykład: new Audio('/assets/sounds/notification.mp3') lub new Audio('sounds/notification.mp3')
const notificationSound = new Audio('/boostingking/path/to/your/notification.mp3'); 

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    orderId = urlParams.get('orderId');

    if (!orderId) {
        alert('Order ID is missing!');
        window.location.href = 'dashboard.html'; 
        return;
    }

    document.getElementById('order-id-display').textContent = orderId;
    await fetchMessages(); 
    
    setInterval(fetchMessages, CHAT_REFRESH_INTERVAL);

    document.getElementById('send-button').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Obsługa przycisków "Show/Hide" dla haseł
    document.querySelectorAll('.toggle-visibility').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.dataset.target; 
            const hiddenSpan = document.getElementById(`${targetId}-hidden`);
            const revealedSpan = document.getElementById(`${targetId}-revealed`);

            if (hiddenSpan.style.display !== 'none') {
                hiddenSpan.style.display = 'none';
                revealedSpan.style.display = 'inline';
                this.textContent = 'Hide';
            } else {
                hiddenSpan.style.display = 'inline';
                revealedSpan.style.display = 'none';
                this.textContent = 'Show';
            }
        });
    });

    // --- Logika dla przycisków "Notify Other Party" i "Deliver Order" ---
    const notifyOtherPartyBtn = document.getElementById('notify-other-party-btn'); 
    const deliverOrderBtn = document.querySelector('.deliver-order-btn');
    
    // Modal elements for Deliver Order
    const deliverOrderModal = document.getElementById('deliverOrderModal');
    const closeButton = deliverOrderModal?.querySelector('.close-button');
    const confirmDeliverButton = document.getElementById('confirmDeliverButton');
    const screenshotLinkInput = document.getElementById('screenshotLinkInput');
    const modalError = document.getElementById('modalError');

    // Notify Other Party button logic
    if (notifyOtherPartyBtn) { // Dodatkowe sprawdzenie, czy przycisk istnieje
        notifyOtherPartyBtn.addEventListener('click', async () => {
            if (orderStatus !== 'In Progress' && orderStatus !== 'Pending') { 
                if (typeof showErrorToast === 'function') {
                    showErrorToast('You can only notify when order is "Pending" or "In Progress".');
                } else {
                    alert('You can only notify when order is "Pending" or "In Progress".');
                }
                return;
            }
            
            notifyOtherPartyBtn.disabled = true;
            try {
                const res = await fetch(`${API_BASE_URL}/api/booster/notify_customer.php`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    credentials: 'include',
                    body: JSON.stringify({ orderId: orderId, notifierRole: currentUserRole }) 
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error("Raw PHP error response for notify_customer.php:", errorText);
                    throw new Error(`Server responded with status ${res.status}. Check console for PHP error details.`);
                }

                const data = await res.json();
                if (data.success) {
                    if (typeof showSuccessToast === 'function') {
                        showSuccessToast(data.message || 'Notification sent successfully!'); 
                    } else {
                        alert('Notification sent successfully!');
                    }
                    notificationSound.play().catch(e => console.error("Error playing sound:", e)); 
                } else {
                    throw new Error(data.message || 'Failed to send notification.');
                }
            } catch (err) {
                console.error('Error sending notification:', err);
                if (typeof showErrorToast === 'function') {
                    showErrorToast(err.message || 'Failed to send notification.');
                } else {
                    alert('Failed to send notification: ' + err.message);
                }
            } finally {
                notifyOtherPartyBtn.disabled = false;
            }
        });
    }

    // Deliver Order button logic (opens modal)
    if (deliverOrderBtn) { // Dodatkowe sprawdzenie, czy przycisk istnieje
        deliverOrderBtn.addEventListener('click', () => {
            if (orderStatus !== 'In Progress') {
                if (typeof showErrorToast === 'function') {
                    showErrorToast('You can only deliver "In Progress" orders.');
                } else {
                    alert('You can only deliver "In Progress" orders.');
                }
                return;
            }
            // Tylko booster może dostarczyć zamówienie
            if (currentUserRole !== 'booster') {
                if (typeof showErrorToast === 'function') {
                    showErrorToast('Only boosters can deliver orders.');
                } else {
                    alert('Only boosters can deliver orders.');
                }
                return;
            }

            if (deliverOrderModal) {
                screenshotLinkInput.value = ''; // Clear previous input
                modalError.style.display = 'none'; // Hide previous errors
                deliverOrderModal.style.display = 'flex'; // Show the modal
            }
        });
    }

    // Modal Close Button
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            if (deliverOrderModal) deliverOrderModal.style.display = 'none';
        });
    }

    // Close modal when clicking outside of content
    window.addEventListener('click', (event) => {
        if (event.target === deliverOrderModal) {
            if (deliverOrderModal) deliverOrderModal.style.display = 'none';
        }
    });

    // Confirm Delivery Button in Modal
    if (confirmDeliverButton) { // Dodatkowe sprawdzenie, czy przycisk istnieje
        confirmDeliverButton.addEventListener('click', async () => {
            const screenshotLink = screenshotLinkInput.value.trim();
            if (!screenshotLink) {
                modalError.textContent = 'Screenshot link cannot be empty.';
                modalError.style.display = 'block';
                return;
            }
            if (!screenshotLink.startsWith('http://') && !screenshotLink.startsWith('https://')) {
                modalError.textContent = 'Please enter a valid URL (starting with http:// or https://).';
                modalError.style.display = 'block';
                return;
            }

            confirmDeliverButton.disabled = true;
            modalError.style.display = 'none';

            try {
                const res = await fetch(`${API_BASE_URL}/api/booster/complete_order_with_screenshot.php`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    credentials: 'include',
                    body: JSON.stringify({ orderId: orderId, screenshotLink: screenshotLink })
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error("Raw PHP error response for complete_order_with_screenshot.php:", errorText);
                    throw new Error(`Server responded with status ${res.status}. Check console for PHP error details.`);
                }

                const data = await res.json();
                if (data.success) {
                    if (typeof showSuccessToast === 'function') {
                        showSuccessToast(data.message || `Order #${orderId} delivered!`);
                    } else {
                        alert(`Order #${orderId} delivered!`);
                    }
                    if (deliverOrderModal) deliverOrderModal.style.display = 'none'; 
                    await fetchMessages(); 
                    if (typeof fetchActiveOrders === 'function') fetchActiveOrders(); 
                    if (typeof fetchCompletedOrders === 'function') fetchCompletedOrders(); 

                } else {
                    throw new Error(data.message || 'Failed to deliver order.');
                }
            } catch (err) {
                console.error('Error delivering order:', err);
                modalError.textContent = err.message || 'Failed to deliver order.';
                modalError.style.display = 'block';
                if (typeof showErrorToast === 'function') {
                    showErrorToast(err.message || `Failed to deliver order #${orderId}.`);
                } else {
                    alert('Failed to deliver order: ' + err.message);
                }
            } finally {
                confirmDeliverButton.disabled = false;
            }
        });
    }
});

// Funkcja pomocnicza do parsowania daty
function parseDateString(dateString) {
    if (!dateString) return null;
    const formattedDateString = dateString.replace(' ', 'T');
    const date = new Date(formattedDateString);
    return isNaN(date.getTime()) ? null : date;
}

// Funkcja pomocnicza do formatowania czasu
function formatTimeElapsed(orderDateString) {
    const orderDate = parseDateString(orderDateString);
    if (!orderDate) return 'N/A';

    const now = new Date();
    const diffMs = now - orderDate;

    if (diffMs < 0) return 'Future order';

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const remainingHours = hours % 24;
    const remainingMinutes = minutes % 60;

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (remainingHours > 0) parts.push(`${remainingHours}h`);
    if (remainingMinutes > 0 || (days === 0 && hours === 0 && minutes === 0 && seconds > 0)) {
        parts.push(`${remainingMinutes}m`);
    }

    return parts.join(' ') || '0m'; 
}

// Funkcja odpowiedzialna za wyświetlanie/ukrywanie sekcji danych logowania
function updateAccountCredentialsBlock(order) {
    const accountCredentialsBlock = document.getElementById('account-credentials-block');

    if (!accountCredentialsBlock) return;

    if (currentUserRole === 'booster' && order && order.account_type && order.account_type.toLowerCase().includes('solo')) {
        accountCredentialsBlock.style.display = 'block';

        document.getElementById('detail-steam-login').textContent = order.steam_login || 'N/A';
        document.getElementById('detail-steam-password-revealed').textContent = order.steam_password || 'N/A';
        document.getElementById('detail-faceit-email').textContent = order.faceit_email || 'N/A';
        document.getElementById('detail-faceit-password-revealed').textContent = order.faceit_password || 'N/A';
    } else {
        accountCredentialsBlock.style.display = 'none';
    }
}


async function fetchMessages() {
    const messagesContainer = document.getElementById('chat-messages');
    const orderSummaryBlock = document.getElementById('order-summary-block');
    const detailsColumn = document.querySelector('.details-column'); 
    const notifyOtherPartyBtn = document.getElementById('notify-other-party-btn'); 

    // --- NOWE LINIE DO DEBUGOWANIA ---
    console.log("--- ROZPOCZYNAM FETCH MESSAGES ---");
    console.log("Status elementu notifyOtherPartyBtn na początku fetchMessages:", notifyOtherPartyBtn);
    // --- KONIEC NOWYCH LINII ---

    if (!messagesContainer || !orderSummaryBlock || !detailsColumn || !notifyOtherPartyBtn) {
        console.error("Błąd: Brak jednego z kluczowych elementów DOM na stronie czatu. Zatrzymuję fetchMessages.");
        return;
    }

    if (messagesContainer.innerHTML.includes('Loading messages...')) {
        messagesContainer.classList.add('loading'); 
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/booster/get_chat_details.php?order_id=${orderId}`, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders()
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error("Raw PHP error response for get_chat_details.php:", errorText);
            throw new Error(`Server responded with status ${res.status}. Check console for PHP error details.`);
        }

        const data = await res.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch chat details and messages.');
        }

        currentUserId = data.currentUserId;
        currentUserRole = data.currentUserRole;
        orderStatus = data.orderStatus;
        
        // --- NOWE LINIE DO DEBUGOWANIA ---
        console.log("DEBUG: Dane z API:", data);
        console.log("DEBUG: orderStatus z API:", orderStatus);
        console.log("DEBUG: currentUserRole z API:", currentUserRole);
        console.log("DEBUG: orderDetails.booster_id z API:", data.orderDetails ? data.orderDetails.order_booster_id : 'N/A');
        console.log("DEBUG: orderDetails.user_id z API:", data.orderDetails ? data.orderDetails.order_user_id : 'N/A');
        // --- KONIEC NOWYCH LINII ---

        if (data.orderDetails) {
            const order = data.orderDetails;

            document.getElementById('detail-id-main').textContent = order.id || 'N/A';
            document.getElementById('detail-client-username-main').textContent = order.client_username || 'N/A';
            
            const orderDate = parseDateString(order.order_date);
            document.getElementById('detail-order-date').textContent = orderDate ? orderDate.toLocaleDateString() : 'N/A';
            
            document.getElementById('detail-currency-main').textContent = order.currency || '$';
            document.getElementById('detail-total-price-main').textContent = parseFloat(order.total_price || 0).toFixed(2);
            document.getElementById('detail-status-main').textContent = order.status || 'N/A';
            document.getElementById('detail-status-main').setAttribute('data-status', order.status.toLowerCase()); 

            document.getElementById('detail-time-elapsed').textContent = formatTimeElapsed(order.order_date);

            document.getElementById('detail-service-type').textContent = order.service_type || 'N/A';
            document.getElementById('detail-region').textContent = order.region || 'N/A';

            document.getElementById('detail-current-level').textContent = order.current_level || 'N/A';
            document.getElementById('detail-desired-level').textContent = order.desired_level || 'N/A';

            document.getElementById('detail-account-type').textContent = order.account_type || 'N/A';

            let customizations = [];
            try {
                if (order.customizations) {
                    const parsedCustoms = JSON.parse(order.customizations);
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
                console.error('Error parsing customizations in chat.js:', e, order.customizations);
            }
            const customizationsDisplay = customizations.length > 0 ? customizations.join(', ') : 'None';
            document.getElementById('detail-options').textContent = customizationsDisplay; 


            // === LOGIKA WIDOCZNOŚCI PRZYCISKU NOTIFY ===
            // --- NOWE LINIE DO DEBUGOWANIA ---
            console.log("DEBUG: Ocena warunków widoczności przycisku Notify:");
            console.log(`DEBUG: orderStatus === 'Pending' || orderStatus === 'In Progress' => ${orderStatus === 'Pending' || orderStatus === 'In Progress'}`);
            console.log(`DEBUG: currentUserRole === 'user' && order.booster_id => ${currentUserRole === 'user' && order.order_booster_id}`);
            console.log(`DEBUG: currentUserRole === 'booster' && order.user_id => ${currentUserRole === 'booster' && order.order_user_id}`);
            // --- KONIEC NOWYCH LINII ---

            if ((orderStatus === 'Pending' || orderStatus === 'In Progress')) {
                // Jeśli zalogowany użytkownik jest klientem i rozmawia z boosterem
                if (currentUserRole === 'user' && order.order_booster_id) { // Używam order.order_booster_id z API
                    notifyOtherPartyBtn.textContent = 'Notify Booster';
                    notifyOtherPartyBtn.style.display = 'flex'; 
                    console.log("DEBUG: Ustawiono przycisk Notify dla klienta.");
                } 
                // Jeśli zalogowany użytkownik jest boosterem i rozmawia z klientem
                else if (currentUserRole === 'booster' && order.order_user_id) { // Używam order.order_user_id z API
                    notifyOtherPartyBtn.textContent = 'Notify Customer';
                    notifyOtherPartyBtn.style.display = 'flex'; 
                    console.log("DEBUG: Ustawiono przycisk Notify dla boostera.");
                } else {
                    notifyOtherPartyBtn.style.display = 'none'; 
                    console.log("DEBUG: Brak przypisanej drugiej strony dla powiadomienia. Ukrywam przycisk.");
                }
            } else {
                notifyOtherPartyBtn.style.display = 'none'; 
                console.log(`DEBUG: Status zamówienia (${orderStatus}) nie pozwala na powiadomienie. Ukrywam przycisk.`);
            }

            // === LOGIKA WIDOCZNOŚCI KOLUMN I BLOKÓW ===
            // Użyłem order_booster_id oraz order_user_id zamiast booster_id i user_id
            // bo tak są nazwane w Twoim JSON-ie.
            if (currentUserRole === 'booster' && order.order_booster_id === currentUserId) { // Upewnij się, że to TEN booster
                if (detailsColumn) detailsColumn.style.display = 'flex';
                updateAccountCredentialsBlock(order);
            } else if (currentUserRole === 'user' && order.order_user_id === currentUserId) { // Upewnij się, że to TEN użytkownik
                // Jeśli to klient, ukryj kolumnę szczegółów, bo nie jest mu potrzebna
                if (detailsColumn) detailsColumn.style.display = 'none';
            } else {
                // Jeśli nie jesteś ani klientem ani boosterem tego zamówienia, ukryj szczegóły.
                if (detailsColumn) detailsColumn.style.display = 'none';
            }

        } else {
            if (detailsColumn) detailsColumn.style.display = 'none';
            console.log("DEBUG: Brak orderDetails w odpowiedzi API. Ukrywam kolumnę szczegółów.");
        }

        messagesContainer.innerHTML = ''; // Clear existing messages
        if (data.messages.length === 0) {
            let systemMessage = '';
            if (orderStatus === 'Pending Payment') {
                systemMessage = 'Your order is pending payment. Chat will be active once payment is confirmed.';
            } else if (orderStatus === 'Pending' && currentUserRole === 'user') {
                systemMessage = 'Your order has been successfully placed and is awaiting acceptance by a booster. You will be notified when a booster accepts it.';
            } else if (orderStatus === 'In Progress' && currentUserRole === 'user' && !data.messages.some(msg => msg.role === 'booster')) {
                systemMessage = 'Your order has been accepted by a booster! Feel free to send your first message. (If this is your first time here, please wait for the booster to initiate contact or provide details).';
            } else if (orderStatus === 'Completed') {
                systemMessage = 'This order has been completed. If you have any further questions, please contact support.';
            } else {
                systemMessage = 'Welcome to the chat for this order.';
            }
            messagesContainer.innerHTML = `<div class="system-message-bubble">${systemMessage}</div>`;
            console.log("DEBUG: Wyświetlono wiadomość systemową.");
        }

        data.messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-message');
            messageElement.classList.add(msg.sender_id == currentUserId ? 'sent' : 'received');

            const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            const messageBubble = document.createElement('div');
            messageBubble.classList.add('message-bubble');
            messageBubble.textContent = msg.message_text; // Use textContent for XSS safety

            const messageMeta = document.createElement('div');
            messageMeta.classList.add('message-meta');
            messageMeta.textContent = `${msg.username} (${msg.role}) - ${timestamp}`; 

            messageElement.appendChild(messageBubble);
            messageElement.appendChild(messageMeta);
            
            messagesContainer.appendChild(messageElement);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        messagesContainer.classList.remove('loading');
        console.log("--- ZAKOŃCZONO FETCH MESSAGES ---");

    } catch (err) {
        console.error('Error fetching chat messages or order details:', err);
        messagesContainer.innerHTML = `<div class="error-message">Error loading messages or order details: ${err.message}.</div>`;
        messagesContainer.classList.remove('loading');
        if (typeof showErrorToast === 'function') {
            showErrorToast('Failed to load chat messages or order details.');
        }
        console.log("--- BŁĄD PODCZAS FETCH MESSAGES ---");
    }
}

async function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const messageText = chatInput.value.trim();

    if (!messageText) return;

    if (orderStatus === 'Cancelled' || orderStatus === 'Refunded' || orderStatus === 'Pending Payment' || orderStatus === 'Completed') {
        if (typeof showErrorToast === 'function') {
            showErrorToast('You cannot send messages for this order status.');
        }
        return;
    }

    sendButton.disabled = true;
    chatInput.disabled = true;

    try {
        const res = await fetch(`${API_BASE_URL}/api/booster/send_chat_message.php`, {
            method: 'POST',
            headers: getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({
                order_id: orderId,
                message_text: messageText
            })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Raw PHP error response for send_chat_message.php:", errorText);
            throw new Error(`Server responded with status ${res.status}. Check console for PHP error details.`);
        }

        const data = await res.json();
        if (data.success) {
            chatInput.value = '';
            await fetchMessages();
        } else {
            throw new Error(data.message || 'Failed to send message.');
        }
    } catch (err) {
        console.error('Error sending message:', err);
        if (typeof showErrorToast === 'function') {
            showErrorToast(err.message || 'Failed to send message.');
        }
    } finally {
        sendButton.disabled = false;
        chatInput.disabled = false;
    }
}