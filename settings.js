/**
 * BOOSTINGKING - SETTINGS SCRIPT FILE
 * Handles user settings page logic, including profile data display and updates.
 */

// API_BASE_URL jest zdefiniowany w general.js i powinien być globalnie dostępny,
// pod warunkiem, że general.js jest ładowany przed settings.js w Twoim HTML-u.
// Jeśli masz problem z dostępem do API_BASE_URL, dodaj go na początku tego pliku:
// const API_BASE_URL = 'http://localhost/boostingking'; // <-- Odkomentuj, jeśli API_BASE_URL nie jest dostępne globalnie

document.addEventListener('DOMContentLoaded', () => {
    console.log('[settings.js] DOMContentLoaded - Skrypt settings.js rozpoczyna działanie.');

    loadUserSettings(); // Wypełnia pola danymi użytkownika

    // Inicjuje logikę formularza edycji
    // Upewnij się, że w settings.html formularz ma id="settingsForm" LUB zmien selektor na '.settings-form'
    const settingsForm = document.querySelector('.settings-form'); // Używam querySelector dla klasy
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsSubmit);
        console.log('[settings.js] Nasłuchiwanie na submit formularza ustawień.');

        // Dodaj listenery do pól input i select, aby aktywować przycisk "Zapisz zmiany"
        const usernameInput = document.getElementById('username');
        const currencySelect = document.getElementById('currency');
        const saveButton = document.getElementById('saveButton');

        if (usernameInput) {
            usernameInput.addEventListener('input', () => toggleSaveButton(usernameInput, currencySelect, saveButton));
        }
        if (currencySelect) {
            currencySelect.addEventListener('change', () => toggleSaveButton(usernameInput, currencySelect, saveButton));
        }

        // Dodaj event listener dla przycisku "Cancel"
        // Upewnij się, że w settings.html przycisk Anuluj ma id="cancelButton" LUB zmien selektor
        const cancelButton = document.querySelector('.cancel-button');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                cancelSettingsChanges();
                // Po anulowaniu, upewnij się, że przycisk Save jest zablokowany, jeśli wartości są oryginalne
                toggleSaveButton(usernameInput, currencySelect, saveButton);
            });
        }

    } else {
        console.warn('[settings.js] Formularz z klasą .settings-form nie znaleziony. Sprawdź HTML. Rozważ dodanie id="settingsForm" do elementu form.');
    }

    // Inicjalizacja ładowania zamówień
    // Sprawdź, czy funkcja loadUserOrders jest dostępna (np. zdefiniowana poniżej w tym pliku lub w general.js)
    if (typeof loadUserOrders === 'function') { 
        loadUserOrders();
    } else {
        console.warn('[settings.js] Funkcja loadUserOrders nie jest dostępna. Moduł zamówień może nie działać.');
    }
});


/**
 * Ładuje dane użytkownika z localStorage i wypełnia nimi pola formularza.
 * Zapisuje również oryginalne wartości do atrybutu dataset, co jest przydatne przy anulowaniu zmian.
 */
async function loadUserSettings() {
    // getStoredUserData jest zdefiniowane w general.js
    const userData = getStoredUserData();

    console.log('--- Debugging loadUserSettings ---');
    console.log('Pobrane userData z localStorage:', userData);

    if (userData && Object.keys(userData).length > 0) {
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('email');
        const currencySelect = document.getElementById('currency');
        const profileUsernameDisplay = document.querySelector('.profile-dropdown-content .dropdown-header');
        const saveButton = document.getElementById('saveButton'); // Odwołanie do przycisku "Save"

        // Ustawienie nazwy użytkownika
        if (usernameInput) {
            usernameInput.value = userData.username || '';
            usernameInput.dataset.originalValue = userData.username || ''; // Zapisz oryginalną wartość
            console.log(`[loadUserSettings] Ustawiono usernameInput.value na: "${usernameInput.value}"`);
        } else {
            console.warn('[loadUserSettings] Element usernameInput (ID "username") nie znaleziony.');
        }

        // Ustawienie adresu e-mail
        if (emailInput) {
            emailInput.value = userData.email || '';
            emailInput.dataset.originalValue = userData.email || ''; // Zapisz oryginalną wartość
            console.log(`[loadUserSettings] Ustawiono emailInput.value na: "${emailInput.value}"`);
        } else {
            console.warn('[loadUserSettings] Element emailInput (ID "email") nie znaleziony.');
        }
        
        // Ustawienie preferowanej waluty
        if (currencySelect) {
            currencySelect.value = userData.currency || 'PLN'; // Użyj istniejącej waluty lub 'PLN' jako domyślnej
            currencySelect.dataset.originalValue = userData.currency || 'PLN'; // Zapisz oryginalną wartość
            console.log(`[loadUserSettings] Ustawiono currencySelect.value na: "${currencySelect.value}"`);
        } else {
            console.warn('[loadUserSettings] Element currencySelect (ID "currency") nie znaleziony.');
        }

        // Aktualizacja nazwy użytkownika w nagłówku dropdownu (z general.js)
        if (profileUsernameDisplay) {
            const isBooster = userData?.role === 'booster';
            profileUsernameDisplay.innerHTML = isBooster
                ? `<div class="booster-header">
                    <span class="booster-badge">BOOSTER</span>
                    ${userData?.username || 'Guest'}
                   </div>`
                : userData?.username || 'Guest';
            console.log('[loadUserSettings] Zaktualizowano nazwę użytkownika w nagłówku dropdown.');
        } else {
            console.warn('[loadUserSettings] Element .profile-dropdown-content .dropdown-header nie znaleziony.');
        }

        // Po załadowaniu danych, przycisk "Save Changes" powinien być domyślnie wyłączony
        if (saveButton) {
            saveButton.disabled = true;
            console.log('[loadUserSettings] Przycisk Save Changes ustawiony na disabled.');
        } else {
            console.warn('[loadUserSettings] Przycisk saveButton (ID "saveButton") nie znaleziony.');
        }

    } else {
        console.warn('Brak danych użytkownika w localStorage. Przekierowanie do logowania...');
        sessionStorage.setItem('returnUrl', window.location.pathname);
        window.location.href = 'login.html';
    }
}

/**
 * Przełącza stan przycisku "Zapisz zmiany" w zależności od tego, czy wartości w polach formularza
 * różnią się od oryginalnych.
 * @param {HTMLInputElement} usernameInput Element input dla nazwy użytkownika.
 * @param {HTMLSelectElement} currencySelect Element select dla waluty.
 * @param {HTMLButtonElement} saveButton Element button dla zapisu zmian.
 */
function toggleSaveButton(usernameInput, currencySelect, saveButton) {
    if (!saveButton) {
        console.warn('[toggleSaveButton] Przycisk Save Changes nie znaleziony.');
        return;
    }

    let changesMade = false;

    if (usernameInput && usernameInput.value.trim() !== (usernameInput.dataset.originalValue || '')) {
        changesMade = true;
    }
    if (currencySelect && currencySelect.value !== (currencySelect.dataset.originalValue || 'PLN')) {
        changesMade = true;
    }

    saveButton.disabled = !changesMade;
    console.log(`[toggleSaveButton] Changes made: ${changesMade}. Save button disabled: ${!changesMade}`);
}

/**
 * Obsługuje wysyłanie formularza ustawień profilu (nazwa użytkownika, email, waluta).
 * Wysyła zaktualizowane dane do serwera i odświeża lokalne dane użytkownika.
 * @param {Event} event Zdarzenie submit formularza.
 */
async function handleSettingsSubmit(event) {
    event.preventDefault(); // Zapobiega domyślnej akcji przeglądarki (przeładowaniu strony)

    const saveButton = document.getElementById('saveButton');
    if (saveButton) {
        saveButton.disabled = true; // Wyłącz przycisk, aby zapobiec wielokrotnym kliknięciom
        saveButton.textContent = 'Zapisuję...';
    } else {
        console.warn('[handleSettingsSubmit] Przycisk saveButton (ID "saveButton") nie znaleziony.');
    }

    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email'); // Wciąż pobieramy, nawet jeśli disabled
    const currencySelect = document.getElementById('currency');

    // Pobierz wartości z pól formularza
    const newUsername = usernameInput ? usernameInput.value.trim() : '';
    const newCurrency = currencySelect ? currencySelect.value : '';

    // E-mail nie jest zmieniany przez formularz, więc wysyłamy tylko to, co zmieniamy
    const userDataToSend = {
        username: newUsername,
        currency: newCurrency
    };

    console.log('[settings.js] Wysyłam dane do aktualizacji:', userDataToSend);

    try {
        const response = await fetch(`${API_BASE_URL}/update_profile.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userDataToSend),
            credentials: 'include' // KLUCZOWE: Upewnia się, że ciasteczko auth_token zostanie wysłane!
        });

        const data = await response.json();
        console.log('[settings.js] Odpowiedź serwera:', data);

        if (response.ok && data.success) {
            alert(data.message);
            // Zaktualizuj dane użytkownika w localStorage na podstawie odpowiedzi serwera
            if (data.user) {
                localStorage.setItem('userData', JSON.stringify(data.user));
                console.log('[settings.js] userData zaktualizowane w localStorage.');
                // Odśwież ogólny interfejs użytkownika (np. nagłówek)
                if (typeof updateAuthUI === 'function') {
                    updateAuthUI(); // Ta funkcja odświeża UI na podstawie localStorage
                }
                // Przeładuj formularz, aby zaktualizować "oryginalne wartości" dla nowych danych
                loadUserSettings(); // Spowoduje ponowne załadowanie wartości i wyłączenie przycisku "Save"
            }
        } else {
            const errorMessage = data.message || 'Wystąpił nieznany błąd podczas aktualizacji.';
            alert('Błąd: ' + errorMessage);
            console.error('[settings.js] Błąd aktualizacji profilu:', response.status, errorMessage);
            if (response.status === 401 && typeof logoutUser === 'function') {
                logoutUser(); // Wyloguj, jeśli token jest nieważny
            }
        }

    } catch (error) {
        console.error('[settings.js] Błąd połączenia sieciowego lub parsowania JSON:', error);
        alert('Wystąpił błąd podczas komunikacji z serwerem. Spróbuj ponownie.');
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = 'Zapisz zmiany';
        }
    }
}

/**
 * Przywraca wartości pól formularza do ich oryginalnych, załadowanych wartości.
 */
function cancelSettingsChanges() {
    const usernameInput = document.getElementById('username');
    const currencySelect = document.getElementById('currency');
    const saveButton = document.getElementById('saveButton');

    // Przywróć wartości, jeśli istnieją i mają oryginalną wartość zapisaną w dataset
    if (usernameInput && usernameInput.dataset.originalValue !== undefined) {
        usernameInput.value = usernameInput.dataset.originalValue;
        console.log(`[cancelSettingsChanges] Przywrócono username do: "${usernameInput.value}"`);
    }
    // Email jest disabled, więc jego wartość nie powinna być zmieniana przez użytkownika,
    // ale możemy dla pewności przywrócić dataset.originalValue.
    const emailInput = document.getElementById('email');
    if (emailInput && emailInput.dataset.originalValue !== undefined) {
        emailInput.value = emailInput.dataset.originalValue;
        console.log(`[cancelSettingsChanges] Przywrócono email do: "${emailInput.value}"`);
    }
    if (currencySelect && currencySelect.dataset.originalValue !== undefined) {
        currencySelect.value = currencySelect.dataset.originalValue;
        console.log(`[cancelSettingsChanges] Przywrócono currency do: "${currencySelect.value}"`);
    }
    
    // Po anulowaniu, przycisk "Save Changes" powinien być wyłączony
    if (saveButton) {
        saveButton.disabled = true;
        console.log('[cancelSettingsChanges] Przycisk Save Changes ustawiony na disabled po anulowaniu.');
    } else {
        console.warn('[cancelSettingsChanges] Przycisk saveButton (ID "saveButton") nie znaleziony.');
    }
    alert('Zmiany zostały anulowane.');
    console.log('[settings.js] Zmiany w formularzu anulowane, przywrócono oryginalne wartości.');
}

/**
 * Funkcja do ładowania zamówień (przykładowa, jeśli posiadasz API).
 * Upewnij się, że masz plik get_orders.php na backendzie.
 */
async function loadUserOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) {
        console.warn('[settings.js] Element ordersList (ID "ordersList") nie znaleziony. Sekcja zamówień może nie działać.');
        return;
    }

    ordersList.innerHTML = '<p class="loading-message">Loading your orders...</p>';
    const userData = getStoredUserData(); // Sprawdź, czy masz dane użytkownika
    
    if (!userData || !userData.id) {
        ordersList.innerHTML = '<p class="no-orders-message">Please log in to view your orders.</p>';
        console.log('[loadUserOrders] Brak danych użytkownika lub ID, nie można załadować zamówień.');
        return;
    }

    try {
        // Używamy credentials: 'include' do wysłania ciasteczka autoryzacyjnego
        const response = await fetch(`${API_BASE_URL}/get_orders.php`, {
            method: 'GET', // Zazwyczaj GET dla pobierania danych
            credentials: 'include'
        });

        const result = await response.json();

        if (response.ok && Array.isArray(result) && result.length > 0) {
            ordersList.innerHTML = ''; // Wyczyść "Loading..."
            result.forEach(order => {
                const orderItem = document.createElement('div');
                orderItem.classList.add('order-item');
                // Pamiętaj, aby nazwy pól (service, status, order_date, price, currency)
                // zgadzały się z tym, co zwraca Twój backend w get_orders.php
                orderItem.innerHTML = `
                    <h3>Order ID: #${order.id || 'N/A'}</h3>
                    <p>Service: ${order.service || 'N/A'}</p>
                    <p>Status: <span class="order-status ${order.status ? order.status.toLowerCase() : 'unknown'}">${order.status || 'Unknown'}</span></p>
                    <p>Date: ${order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'}</p>
                    <p>Price: ${order.price || '0.00'} ${order.currency || ''}</p>
                `;
                ordersList.appendChild(orderItem);
            });
            console.log(`[loadUserOrders] Załadowano ${result.length} zamówień.`);
        } else if (response.ok && Array.isArray(result) && result.length === 0) {
             ordersList.innerHTML = '<p class="no-orders-message">You have no orders yet.</p>';
             console.log('[loadUserOrders] Brak zamówień do wyświetlenia.');
        } else if (response.status === 401) {
            ordersList.innerHTML = '<p class="no-orders-message">Session expired. Please log in again.</p>';
            console.error('[loadUserOrders] Sesja wygasła (401).');
            if (typeof logoutUser === 'function') {
                logoutUser();
            }
        } else {
            ordersList.innerHTML = `<p class="error-message">Failed to load orders: ${result.message || 'Unknown error.'}</p>`;
            console.error('Failed to fetch orders:', response.status, result);
        }
    } catch (error) {
        ordersList.innerHTML = '<p class="error-message">Network error. Could not load orders.</p>';
        console.error('Error fetching orders:', error);
    }
}

// WAŻNE: Funkcje takie jak getStoredUserData(), updateAuthUI(), logoutUser()
// są oczekiwane jako dostępne globalnie z pliku general.js.
// Upewnij się, że:
// 1. general.js jest załadowany w HTML-u PRZED settings.js.
// 2. W general.js te funkcje są zdefiniowane globalnie (np. przypisane do window.functionName,
//    albo po prostu zadeklarowane w głównym zakresie pliku, a nie wewnątrz DOMContentLoaded).