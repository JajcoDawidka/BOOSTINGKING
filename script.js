// Info slider - works on index.html
const infoSlider = () => {
  const messages = document.querySelectorAll('#info-slider .info-message');
  let index = 0;

  if (messages.length > 0) {
    messages.forEach((msg, i) => {
      msg.style.display = i === 0 ? 'block' : 'none';
    });

    setInterval(() => {
      messages[index].style.display = 'none';
      index = (index + 1) % messages.length;
      messages[index].style.display = 'block';
    }, 4000);
  }
};

// Dropdown menu toggle
const initDropdown = () => {
  const dropdown = document.querySelector('.dropdown');
  if (!dropdown) return;
  const btn = dropdown.querySelector('.dropbtn');
  btn.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => dropdown.classList.remove('open'));
};

// Profile dropdown functionality
const initProfileDropdown = () => {
  const profileDropdown = document.querySelector('.profile-dropdown');
  const profileBtn = document.querySelector('.profile-btn');
  
  if (!profileDropdown || !profileBtn) return;
  
  // Toggle dropdown
  profileBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    profileDropdown.classList.toggle('active');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function() {
    profileDropdown.classList.remove('active');
  });
  
  // Prevent dropdown from closing when clicking inside
  const dropdownContent = document.querySelector('.profile-dropdown-content');
  if (dropdownContent) {
    dropdownContent.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }
  
  // Check if user is booster
  function checkIfBooster() {
    const isBooster = localStorage.getItem('userRole') === 'booster';
    if (isBooster) {
      document.querySelector('.booster-options').style.display = 'block';
    }
  }
  
  // Settings link redirection for unauthenticated users
  const settingsLink = document.querySelector('.settings-link');
  if (settingsLink) {
    settingsLink.addEventListener('click', function(e) {
      const isLoggedIn = localStorage.getItem('authToken') !== null;
      if (!isLoggedIn) {
        e.preventDefault();
        alert('Please login to access settings');
        window.location.href = 'login.html?redirect=settings.html';
      }
    });
  }
  
  checkIfBooster();
};

document.addEventListener('DOMContentLoaded', () => {
  const headerIconContainer = document.querySelector('.profile-icon');
  const defaultSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <circle cx="128" cy="128" r="128" fill="#1f1f2a"/>
      <path fill="#F8D57E"
            d="M128 64a44 44 0 1 1 0 88 44 44 0 0 1 0-88zm0 112
               c40 0 72 21.5 72 48v8H56v-8c0-26.5 32-48 72-48z"/>
    </svg>
  `;
  
  // 1) Spróbuj pobrać wgrany avatar
  const storedAvatar = localStorage.getItem('avatar');
  
  if (storedAvatar) {
    // jeśli jest w localStorage — wstaw obrazek
    headerIconContainer.innerHTML = `<img src="${storedAvatar}" alt="Avatar" />`;
  } else {
    // inaczej — wstaw domyślny SVG
    headerIconContainer.innerHTML = defaultSVG;
  }
});


// FAQ accordion
const initFAQ = () => {
  document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.question');
    const answer = item.querySelector('.answer');
    const icon = document.createElement('div');
    icon.classList.add('icon');
    icon.textContent = '+';
    question.appendChild(icon);

    question.addEventListener('click', () => {
      const isOpen = answer.classList.contains('open');
      document.querySelectorAll('.answer.open').forEach(ans => {
        ans.classList.remove('open');
        ans.style.maxHeight = null;
        ans.previousElementSibling.querySelector('.icon').textContent = '+';
      });
      if (!isOpen) {
        answer.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        icon.textContent = '–';
      }
    });
  });
};

// Form validation for jobs page
const initJobsFormValidation = () => {
  const form = document.querySelector('.styled-form');
  
  if (form) {
    // Add error messages containers
    document.querySelectorAll('[required]').forEach(field => {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'form-error';
      field.parentNode.appendChild(errorDiv);
    });

    // Validate on input
    form.addEventListener('input', (e) => {
      validateField(e.target);
    });

    // Validate on submit
    form.addEventListener('submit', (e) => {
      let isValid = true;
      const requiredFields = form.querySelectorAll('[required]');
      
      requiredFields.forEach(field => {
        if (!validateField(field)) {
          isValid = false;
        }
      });

      if (!isValid) {
        e.preventDefault();
        alert('Please fill all required fields correctly');
      }
    });

    // Special validation for number fields
    const ageInput = document.getElementById('age');
    const eloInput = document.getElementById('faceit-elo');
    
    if (ageInput) {
      ageInput.addEventListener('change', () => {
        if (ageInput.value < 16) {
          showError(ageInput, 'Minimum age is 16');
        }
      });
    }
    
    if (eloInput) {
      eloInput.addEventListener('change', () => {
        if (eloInput.value < 2500) {
          showError(eloInput, 'Minimum Faceit ELO is 2500');
        }
      });
    }
  }

  function validateField(field) {
    const errorElement = field.parentNode.querySelector('.form-error');
    
    if (field.required) {
      if (field.type === 'select-one') {
        if (field.value === '') {
          showError(field, 'This field is required');
          return false;
        }
      } 
      else if (field.value.trim() === '' || 
              (field.type === 'number' && field.value < field.min) ||
              (field.type === 'email' && !field.checkValidity())) {
        
        let message = 'This field is required';
        if (field.type === 'number' && field.value < field.min) {
          message = field.id === 'age' ? 'Minimum age is 16' : 'Minimum Faceit ELO is 2500';
        }
        showError(field, message);
        return false;
      }
    }
    
    hideError(field);
    return true;
  }

  function showError(field, message) {
    const errorElement = field.parentNode.querySelector('.form-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
    field.classList.add('invalid');
  }

  function hideError(field) {
    const errorElement = field.parentNode.querySelector('.form-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    field.classList.remove('invalid');
  }
};

// Helper for region error
const createRegionError = () => {
  const regionOptions = document.querySelector('.region-options');
  if (!regionOptions) return null;
  const error = document.createElement('div');
  error.className = 'region-error';
  error.textContent = 'Please select a region';
  error.style.display = 'none';
  regionOptions.parentNode.insertBefore(error, regionOptions.nextSibling);
  return error;
};

const setupCheckoutButton = (regionError) => {
  const checkoutBtn = document.querySelector('.checkout-box button');
  if (!checkoutBtn) return;
  checkoutBtn.addEventListener('click', e => {
    if (!document.querySelector('input[name="region"]:checked')) {
      e.preventDefault();
      if (regionError) regionError.style.display = 'block';
    } else {
      if (regionError) regionError.style.display = 'none';
      alert('Order processed successfully!');
    }
  });
};

// Faceit Boosting Calculator
const initFaceitCalculator = () => {
  const currentElo = document.getElementById('current-elo');
  const targetElo = document.getElementById('target-elo');
  if (!currentElo || !targetElo) return;
  
  const baseEl = document.getElementById('base-price');
  const extraEl = document.getElementById('extra-price');
  const totalEl = document.getElementById('total-price');
  const imgStart = document.getElementById('img-start');
  const imgEnd = document.getElementById('img-end');

  const regionError = createRegionError();
  setupCheckoutButton(regionError);

  // Map ELO to Faceit levels
  const getFaceitLevel = (elo) => {
    elo = parseInt(elo) || 100;
    if (elo >= 2001) return 10;
    if (elo >= 1751) return 9;
    if (elo >= 1531) return 8;
    if (elo >= 1351) return 7;
    if (elo >= 1201) return 6;
    if (elo >= 1051) return 5;
    if (elo >= 901) return 4;
    if (elo >= 751) return 3;
    if (elo >= 501) return 2;
    return 1;
  };

  const updateExtrasDetails = (extrasDetails) => {
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

  const calculateFaceit = () => {
    let start = parseInt(currentElo.value) || 100;
    let end = parseInt(targetElo.value) || start + 50;

    // Validate values
    if (start < 100) start = 100;
    if (start > 2150) start = 2150;
    if (end <= start) end = start + 50;
    if (end > 2200) end = 2200;
    
    currentElo.value = start;
    targetElo.value = end;

    // Calculate price
    const diff = end - start;
    const base = Math.floor(diff / 50) * 5; // $5 per 50 ELO

    // Calculate extras
    let extras = 0;
    const extrasDetails = [];
    const accType = document.querySelector('input[name="accType"]:checked')?.value;
    if (accType === 'duo') {
      extras += base;
      extrasDetails.push({ name: 'Duo Queue', percent: 100, value: base });
    }
    
    document.querySelectorAll('.custom-opt:checked').forEach(opt => {
      const pct = parseFloat(opt.value) || 0;
      const val = base * pct / 100;
      extras += val;
      const map = {
        offline: 'Play Offline',
        streaming: 'Streaming',
        express: 'Express Delivery',
        solo: 'Solo Only',
        normalize: 'Normalize Scores'
      };
      extrasDetails.push({ name: map[opt.id] || opt.id, percent: pct, value: val });
    });

    // Update UI
    baseEl.textContent = `$${base.toFixed(2)}`;
    extraEl.textContent = `$${extras.toFixed(2)}`;
    totalEl.textContent = `$${(base + extras).toFixed(2)}`;
    updateExtrasDetails(extrasDetails);

    // Update level images
    const startLevel = getFaceitLevel(start);
    const endLevel = getFaceitLevel(end);
    if (imgStart) imgStart.src = `faceit${startLevel}.svg`;
    if (imgEnd) imgEnd.src = `faceit${endLevel}.svg`;
  };

  // Initialize +/- buttons
  document.querySelectorAll('.faceit-boosting .level-input-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const isPlus = btn.classList.contains('plus');
      const input = btn.closest('.level-input-group').querySelector('input');
      input.value = parseInt(input.value) + (isPlus ? 50 : -50);
      calculateFaceit();
    });
  });

  // Listen for changes
  ['input', 'change'].forEach(evt => {
    currentElo.addEventListener(evt, calculateFaceit);
    targetElo.addEventListener(evt, calculateFaceit);
    document.querySelectorAll('input[name="accType"], input[name="region"], .custom-opt')
      .forEach(el => el.addEventListener(evt, calculateFaceit));
  });

  // Initial calculation
  calculateFaceit();
};

// Premier Boosting Calculator - UPDATED VERSION
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
  
  const glow = {
    premier1: 'rgba(150,150,150,0.7)',
    premier2: 'rgba(100,180,240,0.7)',
    premier3: 'rgba(0,100,255,0.7)',
    premier4: 'rgba(150,50,200,0.7)',
    premier5: 'rgba(255,100,200,0.7)',
    premier6: 'rgba(255,50,50,0.7)'
  };

  const getImg = v =>
    v < 5000 ? 'premier1.webp'
    : v < 10000 ? 'premier2.webp'
    : v < 15000 ? 'premier3.webp'
    : v < 20000 ? 'premier4.webp'
    : v < 25000 ? 'premier5.webp'
    : 'premier6.webp';

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

  const updateDisplays = () => {
    const currentVal = parseInt(currentRatingInput.value) || 0;
    const targetVal = parseInt(targetRatingInput.value) || currentVal + STEP;
    
    // Update displayed ratings on badges
    currentRatingDisplay.textContent = currentVal;
    targetRatingDisplay.textContent = targetVal;
    
    // Update badge images
    const currentImg = getImg(currentVal);
    const targetImg = getImg(targetVal);
    badgeCur.querySelector('img').src = currentImg;
    badgeTar.querySelector('img').src = targetImg;
    
    // Update glow effects
    badgeCur.style.setProperty('--glow-color', glow[currentImg.replace('.webp','')]);
    badgeTar.style.setProperty('--glow-color', glow[targetImg.replace('.webp','')]);
  };

  const calculatePremier = () => {
    let cur = parseInt(currentRatingInput.value, 10);
    let tar = parseInt(targetRatingInput.value, 10);
    if (isNaN(cur) || cur < 0) cur = 0;
    if (cur > MAX_CUR) cur = MAX_CUR;
    if (isNaN(tar) || tar <= cur) tar = cur + STEP;
    if (tar > MAX_TAR) tar = MAX_TAR;
    currentRatingInput.value = cur;
    targetRatingInput.value = tar;

    updateDisplays();

    const diff = tar - cur;
    const base = Math.floor(diff / 1000) * pricePer1000;
    let extras = 0;
    const extrasDetails = [];
    if (document.querySelector('input[name="accType"]:checked')?.value === 'duo') {
      extras += base;
      extrasDetails.push({ name: 'Duo Queue', percent: 100, value: base });
    }
    document.querySelectorAll('.custom-opt:checked').forEach(opt => {
      const pct = parseFloat(opt.value) || 0;
      const val = base * pct / 100;
      extras += val;
      const map = {
        offline: 'Play Offline',
        streaming: 'Streaming',
        express: 'Express Delivery',
        solo: 'Solo Only',
        normalize: 'Normalize Scores'
      };
      extrasDetails.push({ name: map[opt.id] || opt.id, percent: pct, value: val });
    });

    baseEl.textContent = `$${base.toFixed(2)}`;
    extraEl.textContent = `$${extras.toFixed(2)}`;
    totalEl.textContent = `$${(base + extras).toFixed(2)}`;

    updateExtrasDetails(extrasDetails);
  };

  // Initialize +/- buttons
  document.querySelectorAll('.premier-level .level-input-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const isPlus = btn.classList.contains('plus');
      const input = btn.closest('.level-input-group').querySelector('input');
      const step = parseInt(input.getAttribute('step')) || STEP;
      input.value = parseInt(input.value) + (isPlus ? step : -step);
      calculatePremier();
    });
  });

  ['input','change','click'].forEach(evt => {
    document.querySelectorAll(
      'input[name="accType"], input[name="region"], .custom-opt, #current-rating-input, #target-rating-input'
    ).forEach(el => el.addEventListener(evt, calculatePremier));
  });
  
  // Initial calculation
  calculatePremier();
};

// Discount code handling
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
    const curr = parseFloat(totalEl.textContent.replace('$','')) || 0;
    if (applied) {
      msg.textContent = 'Discount code already used!';
      msg.className = 'discount-message error';
    } else if (code === 'KING10') {
      applied = true;
      const discount = curr * rate;
      totalEl.textContent = `$${(curr - discount).toFixed(2)}`;
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

  // Reapply discount when price changes
  const priceSelectors = [
    '#current-elo', '#target-elo', '#current-rating-input', '#target-rating-input',
    '.level-input-btn', '.custom-opt', 'input[name="accType"]', 'input[name="region"]'
  ];
  priceSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      ['input','change','click'].forEach(evt => {
        el.addEventListener(evt, () => {
          if (applied) {
            const totalEl2 = document.getElementById('total-price');
            const curr2 = parseFloat(totalEl2.textContent.replace('$','')) || 0;
            const discount2 = curr2 * rate;              
            totalEl2.textContent = `$${(curr2 - discount2).toFixed(2)}`;
            msg.innerHTML = `✔ 10% discount applied!<br>` +
              `<span class="discount-details">You saved: <strong>$${discount2.toFixed(2)}</strong></span>`;
            msg.className = 'discount-message success';
          }
        });
      });
    });
  });
};

document.querySelectorAll('textarea.auto-expand').forEach(textarea => {
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  });
});

// Initialize all components
document.addEventListener('DOMContentLoaded', () => {
  infoSlider();
  initDropdown();
  initProfileDropdown();
  initFAQ();
  
  // Initialize the appropriate calculator based on page
  if (document.querySelector('.faceit-boosting')) {
    initFaceitCalculator();
  } else if (document.querySelector('.premier-level')) {
    initPremierCalculator();
  }
  
  initDiscount();
  
  // Initialize jobs form validation if on jobs page
  if (document.querySelector('.styled-form')) {
    initJobsFormValidation();
  }
});