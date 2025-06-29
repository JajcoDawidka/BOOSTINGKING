// checkout.js

// === WAŻNE: API_BASE_URL i BASE_URL powinny być zdefiniowane w general.js ===
// Upewnij się, że general.js jest załadowany PRZED checkout.js w Twoim HTML.
// Przykład z general.js:
// const API_BASE_URL = `${window.location.origin}/boostingking`; // Dla plików w głównym katalogu
// const BASE_URL = `${window.location.origin}/boostingking`; // Dla ścieżek strony, np. powrotów po płatności

document.addEventListener('DOMContentLoaded', async () => {
    let userData = null;
    // Czekaj na dostępność getStoredUserData (z general.js)
    while (typeof getStoredUserData === 'undefined' || typeof API_BASE_URL === 'undefined' || typeof BASE_URL === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    userData = getStoredUserData();

    const form = document.getElementById('checkout-form');
    const cancelBtn = document.querySelector('.cancel-button');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Proceed to Payment';

    const serviceTypeEl = document.getElementById('service-type');
    const summaryRegionEl = document.getElementById('summary-region');
    const summaryAccountTypeEl = document.getElementById('summary-account-type'); // Poprawiono: było 'document =' zamiast 'document.getElementById'
    const eloRangeRow = document.getElementById('elo-range-row');
    const summaryEloRangeEl = document.getElementById('summary-elo-range');
    const rankRangeRow = document.getElementById('rank-range-row');
    const summaryRankRangeEl = document.getElementById('summary-rank-range');
    const customizationListEl = document.getElementById('customization-list');

    const extrasPriceRow = document.getElementById('extras-price-row');
    const summaryExtrasPriceEl = document.getElementById('summary-extras-price');

    const basePriceEl = document.getElementById('base-price');
    const discountAmountEl = document.getElementById('discount-amount');
    const totalPriceEl = document.getElementById('total-price');

    const paymentErrorsEl = document.getElementById('payment-errors'); // Element do wyświetlania błędów płatności

    const loadOrderData = () => {
        try {
            const data = localStorage.getItem('orderDetails');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Błąd parsowania danych zamówienia z localStorage:', error);
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
                if (eloRangeRow) eloRangeRow.style.display = 'flex';
                if (summaryEloRangeEl) summaryEloRangeEl.textContent = `${orderDetails.currentLevel} → ${orderDetails.desiredLevel}`;
            } else if (orderDetails.serviceType.includes('Premier') && orderDetails.currentLevel && orderDetails.desiredLevel) {
                if (rankRangeRow) rankRangeRow.style.display = 'flex';
                if (summaryRankRangeEl) summaryRankRangeEl.textContent = `${orderDetails.currentLevel} → ${orderDetails.desiredLevel}`;
            }

            const extraPrice = parseFloat(orderDetails.extraPrice) || 0;
            if (extrasPriceRow && summaryExtrasPriceEl) {
                if (extraPrice > 0) {
                    extrasPriceRow.style.display = 'flex';
                    summaryExtrasPriceEl.textContent = `$${extraPrice.toFixed(2)}`;
                } else {
                    extrasPriceRow.style.display = 'none';
                }
            }

            if (customizationListEl) {
                customizationListEl.innerHTML = '';
                if (orderDetails.customizations && orderDetails.customizations.length > 0) {
                    orderDetails.customizations.forEach(customization => {
                        const li = document.createElement('li');
                        li.textContent = customization;
                        customizationListEl.appendChild(li);
                    });
                } else {
                    const li = document.createElement('li');
                    li.textContent = 'Brak wybranych dodatków';
                    customizationListEl.appendChild(li);
                }
            }

            const basePrice = parseFloat(orderDetails.basePrice) || 0;
            const discount = parseFloat(orderDetails.discount) || 0;
            const total = parseFloat(orderDetails.totalPrice) || (basePrice + extraPrice - discount);

            if (basePriceEl) basePriceEl.textContent = `$${basePrice.toFixed(2)}`;
            if (discountAmountEl) discountAmountEl.textContent = `-$${discount.toFixed(2)}`;
            if (totalPriceEl) totalPriceEl.textContent = `$${total.toFixed(2)}`;

            if (discount > 0 && discountAmountEl) {
                discountAmountEl.parentElement.classList.add('has-discount');
                discountAmountEl.parentElement.style.display = 'flex';
            } else if (discountAmountEl) {
                discountAmountEl.parentElement.classList.remove('has-discount');
                discountAmountEl.parentElement.style.display = 'none';
            }

        } else {
            console.warn('[checkout.js] Brak danych zamówienia w localStorage pod kluczem "orderDetails". Użytkownik powinien wybrać usługę przed przejściem do checkout.');
            // Opcjonalnie: przekieruj na stronę wyboru usług, jeśli brak orderDetails
            // window.location.href = 'services.html'; 
        }
    };

    fillOrderSummary();

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Czy na pewno chcesz anulować to zamówienie?')) {
                localStorage.removeItem('orderDetails');
                window.location.href = 'services.html'; // Przekieruj na stronę usług
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            submitBtn.innerHTML = '<span class="loading-spinner"></span> Przetwarzam...';
            submitBtn.disabled = true;
            paymentErrorsEl.style.display = 'none'; // Ukryj poprzednie błędy

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
                    ...orderDetails, // Dodaj wszystkie szczegóły zamówienia z localStorage
                    paymentMethod: formData.get('paymentMethod') // Dodaj wybraną metodę płatności
                };

                if (!dataToSend.firstName || !dataToSend.lastName || !dataToSend.email) {
                    throw new Error('Proszę wypełnić wszystkie wymagane pola danych osobowych.');
                }
                if (!dataToSend.serviceType) {
                    throw new new Error('Brakuje szczegółów zamówienia. Proszę wybrać usługę ponownie.'); // Poprawiono: new new Error
                }
                if (!dataToSend.paymentMethod) {
                    throw new Error('Proszę wybrać metodę płatności.');
                }

                // Krok 1: Utwórz zamówienie w bazie danych ze statusem "Pending Payment"
                // create_order.php jest w głównym katalogu, więc używamy API_BASE_URL (z general.js)
                const createOrderRes = await fetch(`${API_BASE_URL}/create_order.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(dataToSend),
                    credentials: 'include'
                });

                if (!createOrderRes.ok) {
                    const errorData = await createOrderRes.json();
                    throw new Error(errorData.message || `Nie udało się utworzyć zamówienia. Status serwera: ${createOrderRes.status}`);
                }

                const createOrderResponse = await createOrderRes.json();
                if (!createOrderResponse.success || !createOrderResponse.orderId) {
                    throw new Error(createOrderResponse.message || 'Nie udało się utworzyć zamówienia. Brakuje ID zamówienia z serwera.');
                }

                const orderId = createOrderResponse.orderId;
                const totalAmount = dataToSend.totalPrice; // Całkowita kwota zamówienia

                // Krok 2: Przekieruj do bramki płatniczej w zależności od wybranej metody
                let paymentRedirectUrl = '';
                switch (dataToSend.paymentMethod) {
                    case 'stripe':
                        // initiate_stripe_payment.php jest w folderze api/, więc używamy API_BASE_URL i dodajemy ścieżkę
                        const stripeRes = await fetch(`${API_BASE_URL}/api/initiate_stripe_payment.php`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                orderId: orderId,
                                amount: totalAmount,
                                email: dataToSend.email,
                                currency: 'USD', // Dodana linia
                                // BASE_URL jest pobierane z general.js (przez window) i wskazuje na katalog główny
                                success_url: `${window.BASE_URL}/order-confirmation.html?orderId=${orderId}`,
                                cancel_url: `${window.BASE_URL}/checkout.html?orderId=${orderId}`
                            }),
                            credentials: 'include'
                        });
                        if (!stripeRes.ok) {
                            const errorData = await stripeRes.json();
                            throw new Error(errorData.message || 'Nie udało się zainicjować płatności Stripe.');
                        }
                        const stripeData = await stripeRes.json();
                        if (!stripeData.success || !stripeData.checkoutSessionUrl) {
                            throw new Error(stripeData.message || 'Inicjacja płatności Stripe nie powiodła się.');
                        }
                        paymentRedirectUrl = stripeData.checkoutSessionUrl;
                        break;

                    case 'przelewy24': // Teraz ta opcja jest zablokowana w HTML, ale tu jest zabezpieczenie
                    case 'crypto': // Ta opcja też jest zablokowana w HTML
                        throw new Error('Wybrana metoda płatności jest obecnie niedostępna. Proszę wybrać Stripe.');

                    default:
                        throw new Error('Wybrana metoda płatności nie jest obsługiwana.');
                }

                // Usunięcie orderDetails z localStorage, bo teraz orderId jest w URL
                localStorage.removeItem('orderDetails');

                // showSuccessToast i showErrorToast są z general.js
                if (typeof showSuccessToast === 'function') {
                    showSuccessToast('Zamówienie utworzone. Przekierowuję do płatności...');
                } else if (typeof toast === 'function') {
                    toast('Zamówienie utworzone. Przekierowuję do płatności...', 'success');
                } else {
                    localShowToast('Zamówienie utworzone. Przekierowuję do płatności...');
                }

                setTimeout(() => {
                    window.location.href = paymentRedirectUrl;
                }, 1500);

            } catch (err) {
                console.error('Błąd złożenia zamówienia/płatności:', err);
                paymentErrorsEl.textContent = `Błąd: ${err.message}`;
                paymentErrorsEl.style.display = 'block';

                if (typeof showErrorToast === 'function') {
                    showErrorToast(`Błąd: ${err.message}`);
                } else if (typeof toast === 'function') {
                    toast(`Błąd: ${err.message}`, 'error');
                } else {
                    localShowToast(`Błąd: ${err.message}`, 'error');
                }

                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    } else {
        console.warn('[checkout.js] Formularz z ID "checkout-form" nie znaleziony. Obsługa formularza nie zostanie zainicjowana.');
    }

    // Lokalna funkcja do wyświetlania toastów, jeśli globalne showToast/toast nie są dostępne
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