// checkout.js

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[checkout.js] DOMContentLoaded - Skrypt checkout.js rozpoczyna działanie.');

    let userData = null;
    while (typeof getStoredUserData === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    userData = getStoredUserData();

    if (!userData || !userData.id) {
        console.warn('[checkout.js] Brak danych użytkownika w localStorage po wczytaniu general.js. System autoryzacji powinien przekierować.');
        return;
    }

    const form = document.getElementById('checkout-form');
    const cancelBtn = document.querySelector('.cancel-button');

    const serviceTypeEl = document.getElementById('service-type');
    const summaryRegionEl = document.getElementById('summary-region');
    const summaryAccountTypeEl = document.getElementById('summary-account-type');
    const eloRangeRow = document.getElementById('elo-range-row');
    const summaryEloRangeEl = document.getElementById('summary-elo-range');
    const rankRangeRow = document.getElementById('rank-range-row');
    const summaryRankRangeEl = document.getElementById('summary-rank-range');
    const customizationListEl = document.getElementById('customization-list'); // Lista dla nazw wybranych extras
    
    const extrasPriceRow = document.getElementById('extras-price-row'); // <-- NOWOŚĆ: Wiersz dla ceny "Extras"
    const summaryExtrasPriceEl = document.getElementById('summary-extras-price'); // <-- NOWOŚĆ: Element dla ceny "Extras"

    const basePriceEl = document.getElementById('base-price');
    const discountAmountEl = document.getElementById('discount-amount');
    const totalPriceEl = document.getElementById('total-price');

    const loadOrderData = () => {
        try {
            const data = localStorage.getItem('orderDetails');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error parsing order data from localStorage:', error);
            return {};
        }
    };

    const fillOrderSummary = () => {
        const orderDetails = loadOrderData();

        if (orderDetails.serviceType) {
            if (serviceTypeEl) serviceTypeEl.textContent = orderDetails.serviceType;

            if (summaryRegionEl && orderDetails.region) {
                summaryRegionEl.textContent = orderDetails.region;
            }

            if (summaryAccountTypeEl && orderDetails.accountType) {
                summaryAccountTypeEl.textContent = orderDetails.accountType;
            }

            if (eloRangeRow) eloRangeRow.style.display = 'none';
            if (rankRangeRow) rankRangeRow.style.display = 'none';

            if (orderDetails.serviceType.includes('Faceit') && orderDetails.currentLevel && orderDetails.desiredLevel) {
                if (eloRangeRow) eloRangeRow.style.display = '';
                if (summaryEloRangeEl) summaryEloRangeEl.textContent = `${orderDetails.currentLevel} → ${orderDetails.desiredLevel}`;
            } else if (orderDetails.serviceType.includes('Premier') && orderDetails.currentLevel && orderDetails.desiredLevel) {
                if (rankRangeRow) rankRangeRow.style.display = '';
                if (summaryRankRangeEl) summaryRankRangeEl.textContent = `${orderDetails.currentLevel} → ${orderDetails.desiredLevel}`;
            }

            // Wyświetl cenę "Extras"
            const extraPrice = parseFloat(orderDetails.extraPrice) || 0; // <-- NOWOŚĆ: Pobierz cenę "Extras"
            if (extrasPriceRow && summaryExtrasPriceEl) {
                if (extraPrice > 0) {
                    extrasPriceRow.style.display = ''; // Pokaż wiersz
                    summaryExtrasPriceEl.textContent = `$${extraPrice.toFixed(2)}`;
                } else {
                    extrasPriceRow.style.display = 'none'; // Ukryj wiersz, jeśli 0
                }
            }

            // Wypełnianie listy "Selected Extras" (nazwy, nie cena)
            if (customizationListEl) {
                customizationListEl.innerHTML = ''; // Wyczyść listę
                if (orderDetails.customizations && orderDetails.customizations.length > 0) {
                    orderDetails.customizations.forEach(customization => {
                        const li = document.createElement('li');
                        li.textContent = customization;
                        customizationListEl.appendChild(li);
                    });
                } else {
                     const li = document.createElement('li');
                     li.textContent = 'None selected';
                     customizationListEl.appendChild(li);
                }
            }


            const basePrice = parseFloat(orderDetails.basePrice) || 0;
            const discount = parseFloat(orderDetails.discount) || 0;
            const total = parseFloat(orderDetails.totalPrice) || (basePrice + extraPrice - discount); // Upewnij się, że total uwzględnia extras

            if (basePriceEl) basePriceEl.textContent = `$${basePrice.toFixed(2)}`;
            if (discountAmountEl) discountAmountEl.textContent = `-$${discount.toFixed(2)}`;
            if (totalPriceEl) totalPriceEl.textContent = `$${total.toFixed(2)}`;

            if (discount > 0 && discountAmountEl) {
                discountAmountEl.parentElement.classList.add('has-discount');
                discountAmountEl.parentElement.style.display = '';
            } else if (discountAmountEl) {
                discountAmountEl.parentElement.classList.remove('has-discount');
                discountAmountEl.parentElement.style.display = 'none';
            }

        } else {
            console.warn('[checkout.js] Brak danych zamówienia w localStorage pod kluczem "orderDetails". Użytkownik powinien wybrać usługę przed przejściem do checkout.');
        }
    };

    fillOrderSummary();

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to cancel this order?')) {
                localStorage.removeItem('orderDetails');
                window.location.href = 'services.html';
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Proceed to Payment';
            if (submitBtn) {
                submitBtn.innerHTML = '<span class="loading-spinner"></span> Processing...';
                submitBtn.disabled = true;
            }

            try {
                const formData = new FormData(form);
                const orderDetails = loadOrderData();

                const dataToSend = {
                    firstName: formData.get('firstName')?.trim(),
                    lastName: formData.get('lastName')?.trim(),
                    email: formData.get('email')?.trim(),
                    steamLogin: formData.get('steamLogin')?.trim() || null,
                    steamPassword: formData.get('steamPassword')?.trim() || null,
                    faceitEmail: formData.get('faceitEmail')?.trim() || null,
                    faceitPassword: formData.get('faceitPassword')?.trim() || null,
                    ...orderDetails
                };

                if (!dataToSend.firstName || !dataToSend.lastName || !dataToSend.email) {
                    throw new Error('Please fill in all required personal information fields.');
                }
                if (!dataToSend.serviceType) {
                    throw new Error('Order details are missing. Please select a service again.');
                }

                const res = await fetch(`${API_BASE_URL}/create_order.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataToSend),
                    credentials: 'include'
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || `Failed to process order. Server status: ${res.status}`);
                }

                if (typeof showToast === 'function') {
                    showToast('Order placed successfully! Redirecting...');
                } else if (typeof toast === 'function') {
                    toast('Order placed successfully! Redirecting...', 'success');
                } else {
                    localShowToast('Order placed successfully! Redirecting...');
                }

                localStorage.removeItem('orderDetails');

                setTimeout(() => {
                    window.location.href = 'order-confirmation.html';
                }, 2000);

            } catch (err) {
                console.error('Order submission error:', err);
                if (typeof showToast === 'function') {
                    showToast(`Error: ${err.message}`, 'error');
                } else if (typeof toast === 'function') {
                    toast(`Error: ${err.message}`, 'error');
                } else {
                    localShowToast(`Error: ${err.message}`, 'error');
                }
                if (submitBtn) {
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                }
            }
        });
    } else {
        console.warn('[checkout.js] Formularz z ID "checkout-form" nie znaleziony. Obsługa formularza nie zostanie zainicjowana.');
    }

    function localShowToast(message, type = 'success') {
        const toastEl = document.createElement('div');
        toastEl.className = `toast ${type}`;
        toastEl.textContent = message;
        document.body.appendChild(toastEl);

        setTimeout(() => {
            toastEl.remove();
        }, 3000);
    }
});