/*********************
 * KONFIGURACJA
 *********************/
const API_BASE_URL = 'http://localhost/boostingking';
const PAGE_ACCESS = {
    'settings.html': ['user'],
    'dashboard.html': ['user'],
    'booster-panel.html': ['booster']
};

/*********************
 * WERYFIKACJA I DOSTĘP
 *********************/
async function verifyToken() {
    try {
        const response = await fetch(`${API_BASE_URL}/verify_token.php`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('verifyToken status:', response.status);
        if (response.status === 401) {
            localStorage.removeItem('userData');
            return false;
        }

        const data = await response.json();
        console.log('verifyToken data:', data);

        if (data.valid && data.user) {
            localStorage.setItem('userData', JSON.stringify(data.user));
        } else {
            localStorage.removeItem('userData');
        }

        return data;
    } catch (error) {
        console.error('Token verification failed:', error);
        return false;
    }
}

async function protectRoute() {
    const currentPage = window.location.pathname.split('/').pop();
    if (!PAGE_ACCESS[currentPage]) return;

    const tokenValid = await verifyToken();
    if (!tokenValid || !tokenValid.valid) {
        sessionStorage.setItem('returnUrl', window.location.pathname);
        window.location.href = 'login.html';
        return;
    }

    const role = tokenValid.user.role;
    if (!PAGE_ACCESS[currentPage].includes(role)) {
        alert('Nie masz dostępu do tej strony.');
        window.location.href = role === 'booster' ? 'booster-panel.html' : 'dashboard.html';
    }
}

/*********************
 * LOGOWANIE I WYLOGOWANIE
 *********************/
function getStoredUserData() {
    try {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : {};
    } catch (e) {
        console.error('Error parsing user data:', e);
        return {};
    }
}

function logoutUser() {
    localStorage.clear();

    fetch(`${API_BASE_URL}/logout.php`, {
        method: 'POST',
        credentials: 'include'
    }).catch(console.error);

    // zamiast location.reload() robimy redirect na login
    window.location.href = 'login.html';
}

/*********************
 * AKTUALIZACJA INTERFEJSU
 *********************/
async function checkAuthStatus() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const verification = await verifyToken();
    if (!verification?.valid || !verification.user) {
        // zamiast wywoływać logoutUser(), robimy tylko redirect na login
        window.location.href = 'login.html';
        return;
    }

    authLink.textContent = 'Logout';
    authLink.href = '#';
    authLink.onclick = (e) => {
        e.preventDefault();
        logoutUser();
    };

    updateBoosterUI(verification.user);
}

function updateBoosterUI(userData) {
    const isBooster = userData?.role === 'booster';
    const boosterOptions = document.querySelector('.booster-options');
    const dropdownHeader = document.querySelector('.dropdown-header');

    if (boosterOptions) {
        boosterOptions.style.display = isBooster ? 'flex' : 'none';
        const currentPage = window.location.pathname.split('/').pop();
        boosterOptions.querySelectorAll('a').forEach(link => {
            link.classList.toggle('active-booster-link', link.getAttribute('href') === currentPage);
        });
    }

    if (dropdownHeader) {
        dropdownHeader.innerHTML = isBooster
            ? `<div class="booster-header"><span class="booster-badge">BOOSTER</span>${userData.username || ''}</div>`
            : userData.username || 'Guest';
    }
}

/*********************
 * DROPDOWNY I PRZYCISKI
 *********************/
const initProfileDropdown = () => {
    const profileDropdown = document.querySelector('.profile-dropdown');
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
 * START
 *********************/
document.addEventListener('DOMContentLoaded', async () => {
    await protectRoute();
    initDropdown();
    initProfileDropdown();
    initScrollToTop();
    initGlobalDropdownClose();
    await checkAuthStatus();
});
