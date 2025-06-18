// chat.js

const CHAT_REFRESH_INTERVAL = 3000;
let orderId;
let currentUserId;
let currentUserRole;
let orderStatus; // Store order status

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    orderId = urlParams.get('orderId');

    if (!orderId) {
        alert('Order ID is missing!');
        window.location.href = 'dashboard.html'; // Redirect to dashboard or appropriate page
        return;
    }

    document.getElementById('order-id-display').textContent = orderId;
    await fetchMessages(); // Initial fetch of messages and details
    
    // Refresh messages every X seconds
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
            const targetId = this.dataset.target; // e.g., "detail-steam-password" or "detail-faceit-password"
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

    // Logika dla przycisków w nagłówku kolumny detali
    document.querySelector('.deliver-order-btn')?.addEventListener('click', () => {
        console.log('Deliver Order clicked for Order ID:', orderId);
        if (typeof completeOrder === 'function') {
            completeOrder(orderId);
        } else {
            // Tymczasowy toast, jeśli completeOrder nie jest globalnie dostępne
            if (typeof showSuccessToast === 'function') {
                showSuccessToast('Order delivery simulated. (completeOrder function not globally available).');
            } else {
                alert('Order delivery simulated.');
            }
        }
    });

    document.querySelector('.notify-customer-btn')?.addEventListener('click', () => {
        console.log('Notify Customer clicked for Order ID:', orderId);
        if (typeof showSuccessToast === 'function') {
            showSuccessToast('Customer notified!');
        } else {
            alert('Customer notified!');
        }
    });

    document.querySelector('.more-options-btn')?.addEventListener('click', () => {
        console.log('More Options clicked for Order ID:', orderId);
        if (typeof showSuccessToast === 'function') {
            showSuccessToast('More options coming soon!');
        } else {
            alert('More options coming soon!');
        }
    });
});

// Funkcja pomocnicza do parsowania daty w formacie YYYY-MM-DD HH:MM:SS
function parseDateString(dateString) {
    if (!dateString) return null;
    // Zamienia format "YYYY-MM-DD HH:MM:SS" na "YYYY-MM-DDTHH:MM:SS" (wymagany przez Date constructor dla spójności)
    const formattedDateString = dateString.replace(' ', 'T');
    const date = new Date(formattedDateString);
    // Sprawdź, czy data jest prawidłowa
    return isNaN(date.getTime()) ? null : date;
}


// Funkcja pomocnicza do formatowania czasu, aby była bardziej precyzyjna
function formatTimeElapsed(orderDateString) {
    const orderDate = parseDateString(orderDateString);
    if (!orderDate) return 'N/A';

    const now = new Date();
    const diffMs = now - orderDate;

    if (diffMs < 0) return 'Future order'; // Jeśli data zamówienia jest w przyszłości

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const remainingHours = hours % 24;
    const remainingMinutes = minutes % 60;

    let parts = [];
    if (days > 0) {
        parts.push(`${days}d`);
    }
    if (remainingHours > 0) {
        parts.push(`${remainingHours}h`);
    }
    // Zawsze pokaż minuty, jeśli nie ma dni/godzin, chyba że to 0m i są inne jednostki
    if (remainingMinutes > 0 || (days === 0 && hours === 0 && minutes === 0)) {
        parts.push(`${remainingMinutes}m`);
    }

    return parts.join(' ') || '0m'; // Zwróć '0m' jeśli czas jest krótszy niż minuta
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

    if (!messagesContainer || !orderSummaryBlock || !detailsColumn) return;

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
        
        if (data.orderDetails) {
            const order = data.orderDetails;

            document.getElementById('detail-id-main').textContent = order.id || 'N/A';
            document.getElementById('detail-client-username-main').textContent = order.client_username || 'N/A';
            
            // Poprawione wyświetlanie daty zamówienia
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
            // document.getElementById('detail-num-wins').textContent = order.num_wins || 'N/A'; // Usunięto z HTML

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


            if (currentUserRole === 'booster') {
                if (detailsColumn) detailsColumn.style.display = 'flex';
                updateAccountCredentialsBlock(order);
            } else {
                if (detailsColumn) detailsColumn.style.display = 'none';
            }

        } else {
            if (detailsColumn) detailsColumn.style.display = 'none';
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
        }

        data.messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-message');
            messageElement.classList.add(msg.sender_id == currentUserId ? 'sent' : 'received');

            // ZREDUKOWANO STRUKTURĘ HTML WIADOMOŚCI
            const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // BEZPIECZNE WSTAWIANIE TEKSTU I METADANYCH
            const messageBubble = document.createElement('div');
            messageBubble.classList.add('message-bubble');
            messageBubble.textContent = msg.message_text; // Użyj textContent dla XSS safety

            const messageMeta = document.createElement('div');
            messageMeta.classList.add('message-meta');
            messageMeta.textContent = `${msg.username} (${msg.role}) - ${timestamp}`; 

            // Dodaj dymek i metadane bezpośrednio do chat-message
            messageElement.appendChild(messageBubble);
            messageElement.appendChild(messageMeta);
            
            messagesContainer.appendChild(messageElement);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        messagesContainer.classList.remove('loading');

    } catch (err) {
        console.error('Error fetching chat messages or order details:', err);
        messagesContainer.innerHTML = `<div class="error-message">Error loading messages or order details: ${err.message}.</div>`;
        messagesContainer.classList.remove('loading');
        if (typeof showErrorToast === 'function') {
            showErrorToast('Failed to load chat messages or order details.');
        }
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