/**
 * BOOSTINGKING - MAIN SCRIPT FILE v3.0
 * Complete authentication and UI management
 */

const API_BASE_URL = 'http://localhost/boostingking';
const PROTECTED_PAGES = ['settings.html', 'profile.html', 'dashboard.html'];

// ==================== AUTHENTICATION SYSTEM ====================

async function verifyToken() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/verify_token.php`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            return false;
        }

        return response.ok;
    } catch (error) {
        console.error('Token verification failed:', error);
        return false;
    }
}

async function protectRoute() {
    const currentPage = window.location.pathname.split('/').pop();
    if (PROTECTED_PAGES.includes(currentPage)) {
        const tokenValid = await verifyToken();
        if (!tokenValid) {
            sessionStorage.setItem('returnUrl', window.location.pathname);
            window.location.href = 'login.html';
        }
    }
}

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
    const userData = getStoredUserData();
    const avatar = userData.avatar || null;
    
    localStorage.clear();
    if (avatar) {
        localStorage.setItem('tempUserData', JSON.stringify({ avatar }));
    }
    
    fetch(`${API_BASE_URL}/logout.php`, {
        method: 'POST',
        credentials: 'include'
    }).catch(console.error);
    
    window.location.href = 'index.html';
}

// ==================== UI COMPONENTS ====================

function initDropdown() {
    const dropdown = document.querySelector('.dropdown');
    if (!dropdown) return;

    const btn = dropdown.querySelector('.dropbtn');
    btn.addEventListener('click', e => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
    });
}

function initProfileDropdown() {
    const profileDropdown = document.querySelector('.profile-dropdown');
    const profileBtn = document.querySelector('.profile-btn');
    const dropdownContent = document.querySelector('.profile-dropdown-content');

    if (!profileDropdown || !profileBtn) return;

    profileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
    });

    if (dropdownContent) {
        dropdownContent.addEventListener('click', e => e.stopPropagation());
    }

    updateAuthUI();
}

async function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    if (!authLink) return;

    const tokenValid = await verifyToken();
    const userData = getStoredUserData();

    if (tokenValid) {
        authLink.textContent = 'Logout';
        authLink.href = '#';
        authLink.onclick = (e) => {
            e.preventDefault();
            logoutUser();
        };
        updateBoosterUI(userData);
        updateProfileAvatar();
    } else {
        authLink.textContent = 'Login';
        authLink.href = 'login.html';
        authLink.onclick = null;
        
        const tempData = JSON.parse(localStorage.getItem('tempUserData') || '{}');
        if (tempData.avatar) {
            updateProfileAvatar();
        }
    }
}

function updateBoosterUI(userData) {
    const isBooster = userData?.role === 'booster';
    const boosterOptions = document.querySelector('.booster-options');
    const dropdownHeader = document.querySelector('.dropdown-header');

    if (boosterOptions) {
        boosterOptions.style.display = isBooster ? 'flex' : 'none';
        const currentPage = window.location.pathname.split('/').pop();
        
        boosterOptions.querySelectorAll('a').forEach(link => {
            link.classList.toggle(
                'active-booster-link', 
                link.getAttribute('href') === currentPage
            );
        });
    }

    if (dropdownHeader) {
        dropdownHeader.innerHTML = isBooster
            ? `<div class="booster-header">
                <span class="booster-badge">BOOSTER</span>
                ${userData?.username || ''}
               </div>`
            : userData?.username || 'Guest';
    }
}

function updateProfileAvatar() {
    JSON.parse(localStorage.getItem('userData') || '{}')
    const profileIcons = document.querySelectorAll('.profile-icon');

    profileIcons.forEach(icon => {
        if (userData.avatar) {
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

// ==================== UTILITY FUNCTIONS ====================

function initScrollToTop() {
    const btn = document.getElementById('scrollToTop');
    if (!btn) return;

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToTop();
    });

    window.addEventListener('scroll', () => {
        btn.style.display = window.pageYOffset > 300 ? 'block' : 'none';
    });

    btn.style.display = window.pageYOffset > 300 ? 'block' : 'none';
}

function initGlobalDropdownClose() {
    document.addEventListener('click', () => {
        document.querySelector('.dropdown')?.classList.remove('open');
        document.querySelector('.profile-dropdown')?.classList.remove('active');
    });
}

// ==================== INITIALIZATION ====================

async function initializeApp() {
    await protectRoute();
    
    initDropdown();
    initProfileDropdown();
    initScrollToTop();
    initGlobalDropdownClose();
    
    if (typeof initProfileAvatar === 'function') {
        initProfileAvatar();
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);

// ==================== POLYFILLS ====================

(function() {
    const vendors = ['ms', 'moz', 'webkit', 'o'];
    for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        let lastTime = 0;
        window.requestAnimationFrame = function(callback) {
            const currTime = new Date().getTime();
            const timeToCall = Math.max(0, 16 - (currTime - lastTime));
            const id = window.setTimeout(() => callback(currTime + timeToCall), timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());