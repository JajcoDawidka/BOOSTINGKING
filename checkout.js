document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Form elements
  const form = document.getElementById('checkout-form');
  const cancelBtn = document.querySelector('.cancel-button');
  
  // Summary elements
  const serviceTypeEl = document.getElementById('service-type');
  const basePriceEl = document.getElementById('base-price');
  const discountAmountEl = document.getElementById('discount-amount');
  const totalPriceEl = document.getElementById('total-price');

  // Load order data from localStorage or API
  const loadOrderData = async () => {
    try {
      // Try to get from localStorage first
      const orderData = JSON.parse(localStorage.getItem('orderData') || '{}');
      
      // If no data in localStorage, fetch from API (example)
      if (!orderData.service) {
        const response = await fetch('https://your-api-endpoint.com/current-order', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          return await response.json();
        }
      }
      
      return orderData;
    } catch (error) {
      console.error('Error loading order data:', error);
      return {};
    }
  };

  // Fill form with order data
  const fillOrderSummary = async () => {
    const orderData = await loadOrderData();
    
    if (orderData.service) {
      serviceTypeEl.textContent = orderData.service;
      
      const basePrice = orderData.basePrice || 0;
      const discount = orderData.discount || 0;
      const total = basePrice - discount;
      
      basePriceEl.textContent = `$${basePrice.toFixed(2)}`;
      discountAmountEl.textContent = `-$${discount.toFixed(2)}`;
      totalPriceEl.textContent = `$${total.toFixed(2)}`;
      
      // Apply discount styling if applicable
      if (discount > 0) {
        discountAmountEl.parentElement.classList.add('has-discount');
      }
    }
  };

  // Initialize form
  fillOrderSummary();

  // Cancel button handler
  cancelBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      window.location.href = 'services.html';
    }
  });

  // Form submission handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Processing...';
    submitBtn.disabled = true;

    try {
      // Get form data
      const formData = new FormData(form);
      const data = {
        firstName: formData.get('firstName').trim(),
        lastName: formData.get('lastName').trim(),
        email: formData.get('email').trim(),
        steamLogin: formData.get('steamLogin')?.trim() || null,
        steamPassword: formData.get('steamPassword')?.trim() || null,
        faceitEmail: formData.get('faceitEmail')?.trim() || null,
        faceitPassword: formData.get('faceitPassword')?.trim() || null,
        ...JSON.parse(localStorage.getItem('orderData') || '{}')
      };

      // Basic validation
      if (!data.firstName || !data.lastName || !data.email) {
        throw new Error('Please fill in all required personal information fields.');
      }

      // Submit to API
      const res = await fetch('https://boosting-backend.onrender.com/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to process order.');
      }

      // Show success message
      showToast('Order placed successfully! Redirecting...');
      
      // Clear order data from storage
      localStorage.removeItem('orderData');
      
      // Redirect to confirmation
      setTimeout(() => {
        window.location.href = 'order-confirmation.html';
      }, 2000);
      
    } catch (err) {
      console.error('Order submission error:', err);
      showToast(`Error: ${err.message}`, 'error');
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  });

  // Toast notification function
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove after animation
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
});