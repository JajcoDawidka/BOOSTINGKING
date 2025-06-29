/*********************
 * KONFIGURACJA
 *********************/
// BASE_URL wskazuje na katalog główny Twojego projektu (gdzie są pliki HTML)
const BASE_URL = 'http://localhost/boostingking'; 
// API_BASE_URL wskazuje na katalog główny Twojego projektu (gdzie teraz są pliki API PHP)
const API_BASE_URL = 'http://localhost/boostingking'; 

const PAGE_ACCESS = {
    'settings.html': ['user', 'booster'],
    'booster-panel.html': ['booster'],
    'checkout.html': ['user', 'booster'] 
};

/*********************
 * TOKEN I DOSTĘP
 *********************/
async function verifyToken() {
    try {
        // verify_token.php jest teraz w głównym katalogu, więc używamy API_BASE_URL
        const response = await fetch(`${API_BASE_URL}/verify_token.php`, { 
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn('[verifyToken] Serwer zwrócił błąd weryfikacji tokena:', response.status, errorText);
            localStorage.removeItem('userData');
            return null;
        }

        const data = await response.json();
        console.log('[verifyToken] Odpowiedź JSON z verify_token.php:', data);

        if (data.valid && data.user) {
            localStorage.setItem('userData', JSON.stringify(data.user));
            console.log(`[verifyToken] Użytkownik ${data.user.username} zweryfikowany pomyślnie.`);
            return data.user;
        } else {
            console.warn('[verifyToken] Token nieważny lub brak danych użytkownika w odpowiedzi PHP. Usuwam dane z localStorage.');
            localStorage.removeItem('userData');
            return null;
        }
    } catch (error) {
        console.error('[verifyToken] Błąd połączenia lub przetwarzania w verifyToken:', error);
        localStorage.removeItem('userData');
        return null;
    }
}

// Funkcja odpowiedzialna za ochronę ścieżek
async function protectRoute(user) {
    const currentPage = window.location.pathname.split('/').pop();
    const allowedRoles = PAGE_ACCESS[currentPage];

    console.log(`[protectRoute] Sprawdzam dostęp do strony: ${currentPage}`);
    console.log(`[protectRoute] Wymagane role:`, allowedRoles);
    console.log(`[protectRoute] Rola użytkownika:`, user ? user.role : 'Brak (niezalogowany)');

    if (!allowedRoles) {
        console.log(`[protectRoute] Strona ${currentPage} nie wymaga określonej ochrony rolami.`);
        return; 
    }

    if (!user || !allowedRoles.includes(user.role)) {
        console.warn(`[protectRoute] Brak dostępu dla użytkownika (${user ? user.username + ', rola: ' + user.role : 'niezalogowany'}) do strony ${currentPage}. Przekierowuję do login.html.`);
        window.location.href = 'login.html';
        throw new Error('Unauthorized access'); 
    }

    console.log(`[protectRoute] Użytkownik (${user.username}, rola: ${user.role}) ma dostęp do strony ${currentPage}.`);
}


/*********************
 * LOGOUT
 *********************/
function logoutUser() {
    console.log('[logoutUser] Rozpoczynanie procesu wylogowania.');
    localStorage.clear();

    // logout.php jest teraz w głównym katalogu, więc używamy API_BASE_URL
    fetch(`${API_BASE_URL}/logout.php`, { 
        method: 'POST',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            console.error('[logoutUser] Błąd serwera podczas wylogowania:', response.status, response.statusText);
        }
        console.log('[logoutUser] Wylogowano pomyślnie. Przekierowuję do login.html.');
        window.location.href = 'login.html';
    })
    .catch(error => {
        console.error('[logoutUser] Błąd połączenia sieciowego podczas wylogowania:', error);
        window.location.href = 'login.html';
    });
}

/*********************
 * FUNKCJE POMOCNICZE I UI (globalne)
 *********************/

function getStoredUserData() {
    try {
        const userDataString = localStorage.getItem('userData');
        if (userDataString) {
            return JSON.parse(userDataString);
        }
    } catch (e) {
        console.error('Błąd podczas parsowania userData z localStorage:', e);
        localStorage.removeItem('userData');
    }
    return null;
}

function updateProfileAvatar() {
    const userData = getStoredUserData();
    const profileIcons = document.querySelectorAll('.profile-icon');

    profileIcons.forEach(icon => {
        if (userData && userData.avatar) {
            icon.innerHTML = `<img src="${userData.avatar}" alt="Profile" class="profile-avatar">`;
        } else {
            icon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="default-avatar">
                    <circle cx="128" cy="128" r="128" fill="#1f1f2a"/>
                    <path fill="#F8D57E" d="M128 64a44 44 0 1 1 0 88 44 44 0 0 1 0-88zm0 112c40 0 72 21.5 72 48v8H56v-8c0-26.5 32-48 72-48z"/>
                </svg>`;
        }
    });
}

async function updateAuthUI() {
    const user = getStoredUserData();
    await checkAuthStatus(user);
    updateProfileAvatar();
}

async function checkAuthStatus(user) {
    const authLink = document.getElementById('auth-link');
    if (!authLink) {
        console.log('[checkAuthStatus] Element #auth-link nie znaleziony w DOM.');
        return;
    }

    if (!user) {
        authLink.textContent = 'Login';
        authLink.href = 'login.html';
        authLink.onclick = null;
        console.log('[checkAuthStatus] Użytkownik niezalogowany. Link autoryzacji ustawiony na "Login".');
        return;
    }

    authLink.textContent = 'Logout';
    authLink.href = '#';
    authLink.onclick = (e) => {
        e.preventDefault();
        logoutUser();
    };

    console.log(`[checkAuthStatus] Użytkownik ${user.username} zalogowany. Aktualizuję UI.`);
    updateBoosterUI(user);
}

function updateBoosterUI(user) {
    const isBooster = user?.role === 'booster';
    const boosterOptions = document.querySelector('.booster-options');
    const dropdownHeader = document.querySelector('.dropdown-header');

    if (boosterOptions) {
        boosterOptions.style.display = isBooster ? 'flex' : 'none';
        const currentPage = window.location.pathname.split('/').pop();
        boosterOptions.querySelectorAll('a').forEach(link => {
            link.classList.toggle('active-booster-link', link.getAttribute('href') === currentPage);
        });
        console.log('[updateBoosterUI] Widoczność opcji boostera dostosowana.');
    }

    if (dropdownHeader) {
        dropdownHeader.innerHTML = isBooster
            ? `<div class="booster-header"><span class="booster-badge">BOOSTER</span>${user.username || 'Booster'}</div>`
            : user.username || 'Guest';
        console.log('[updateBoosterUI] Nagłówek profilu użytkownika dostosowany.');
    }
}

// Globalna funkcja toast do użycia w innych skryptach
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Nowe, globalnie dostępne funkcje do wyświetlania toastów o sukcesie i błędzie
function showSuccessToast(message) {
    showToast(message, 'success');
}

function showErrorToast(message) {
    showToast(message, 'error');
}

// Funkcja do pobierania nagłówków autoryzacyjnych (dla API)
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json'
    };
}


// Inicjalizacja Dropdownów i Skroll
const initProfileDropdown = () => {
    const profileDropdown = document.querySelector('.profile-dropdown');
    // Poprawiona literówka: 'document =' zmieniono na 'document.querySelector'
    const profileBtn = document.querySelector('.profile-btn'); 
    const dropdownContent = document.querySelector('.profile-dropdown-content');

    if (!profileDropdown || !profileBtn) return;

    profileBtn.addEventListener('click', e => {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
    });

    dropdownContent?.addEventListener('click', e => e.stopPropagation());
};

const initDropdown = () => {
    const dropdown = document.querySelector('.dropdown');
    if (!dropdown) return;

    dropdown.querySelector('.dropbtn').addEventListener('click', e => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });
};

const initScrollToTop = () => {
    const btn = document.getElementById('scrollToTop');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
        btn.style.display = window.pageYOffset > 300 ? 'block' : 'none';
    });

    btn.style.display = window.pageYOffset > 300 ? 'block' : 'none';
};

const initGlobalDropdownClose = () => {
    document.addEventListener('click', () => {
        document.querySelector('.dropdown')?.classList.remove('open');
        document.querySelector('.profile-dropdown')?.classList.remove('active');
    });
};

/*********************
 * START (Główne uruchamianie skryptu po załadowaniu DOM)
 *********************/
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[general.js] DOMContentLoaded - Skrypt general.js rozpoczyna działanie.');

    let user = null;
    let maxRetries = 3;
    let retryDelay = 100; // ms

    for (let i = 0; i < maxRetries; i++) {
        user = await verifyToken();
        if (user) {
            break; // Token zweryfikowany pomyślnie, wychodzimy z pętli
        }
        // Używamy prawidłowej składni template string
        console.log(`[general.js] Próba weryfikacji tokena nieudana (próba ${i + 1}/${maxRetries}). Ponawiam...`); 
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Zwiększ opóźnienie dla kolejnych prób
    }

    // Jeśli po wszystkich próbach user nadal jest null, protectRoute przekieruje
    try {
        await protectRoute(user);
    } catch (e) {
        if (e.message === 'Unauthorized access') {
            console.log('[general.js] Zatrzymuję dalsze inicjalizacje z powodu braku autoryzacji.');
            return; 
        }
        throw e; 
    }

    updateAuthUI(); 

    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'booster-panel.html') {
        if (user && user.role === 'booster') {
            if (typeof initBoosterPanel === 'function') {
                console.log('[general.js] Strona to booster-panel.html i użytkownik jest boosterem. Wywołuję initBoosterPanel.');
                initBoosterPanel(user); 
            } else {
                console.error('[general.js] Funkcja initBoosterPanel nie została znaleziona. Upewnij się, że booster.js jest poprawnie załadowany i definiuje tę funkcję globalnie.');
            }
        } else {
            console.log('[general.js] Na stronie booster-panel.html, ale użytkownik nie jest zalogowany jako booster. Inicjalizacja panelu boostera pominięta.');
        }
    } else {
        console.log(`[general.js] Strona nie jest booster-panel.html (${currentPage}). Pomijam inicjalizację panelu boostera.`);
    }

    initDropdown();
    initProfileDropdown();
    initScrollToTop();
    initGlobalDropdownClose();

    console.log('[general.js] Wszystkie inicjalizacje DOMContentLoaded zakończone.');
});


// === Ważne: Eksportowanie funkcji globalnie, aby były dostępne dla innych skryptów ===
// Te funkcje muszą być dostępne dla settings.js, booster.js i chat.html
// dlatego przypisujemy je do obiektu window.
window.BASE_URL = BASE_URL; // Upewnienie się, że BASE_URL jest globalne
window.API_BASE_URL = API_BASE_URL; // Upewnienie się, że API_BASE_URL jest globalne
window.getAuthHeaders = getAuthHeaders; 
window.getStoredUserData = getStoredUserData;
window.logoutUser = logoutUser;
window.showToast = showToast;
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;