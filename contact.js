/**
 * Form Validation for Contact Form
 * Comprehensive validation system for the contact form
 * Features: real-time validation, custom rules, error messages, and accessibility support
 */
const ContactFormValidator = {
  // Configuration object for validation settings
  config: {
    messages: {                     // Custom error messages
      required: 'This field is required',
      email: 'Please enter a valid email address',
      minLength: 'Message must be at least 20 characters long'
    },
    minMessageLength: 20,           // Minimum length for message
    errorDisplayDuration: 5000      // Duration to show global error (milliseconds)
  },

  /**
   * Initialize the form validator
   * Sets up form references, error containers, and event handlers
   */
  init: function() {
    this.form = document.querySelector('.contact-form');
    if (!this.form) return;  // Stop if form not found

    this.createErrorContainers();    // Prepare DOM for error messages
    this.setupEventListeners();      // Attach input and submit handlers
    this.initCustomValidations();    // Setup special field validations

    // Create loader element (hidden initially)
    this.createLoader();

    return this;  // Enable method chaining
  },

  /**
   * Create error message containers for all required fields
   * Adds empty divs to show validation errors dynamically
   */
  createErrorContainers: function() {
    this.form.querySelectorAll('[required]').forEach(field => {
      if (!field.parentNode.querySelector('.form-error')) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.setAttribute('aria-live', 'polite'); // Accessibility: announce changes
        field.parentNode.appendChild(errorDiv);
      }
    });
  },

  /**
   * Create and insert a loader element into the form (hidden by default)
   */
  createLoader: function() {
    this.loader = document.createElement('div');
    this.loader.className = 'form-loader';
    this.loader.style.display = 'none';
    this.loader.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    this.form.appendChild(this.loader);
  },

  /**
   * Show loader spinner
   */
  showLoader: function() {
    if (this.loader) this.loader.style.display = 'block';
  },

  /**
   * Hide loader spinner
   */
  hideLoader: function() {
    if (this.loader) this.loader.style.display = 'none';
  },

  /**
   * Set up all event listeners for validation and submission
   */
  setupEventListeners: function() {
    // Real-time validation on input events
    this.form.addEventListener('input', (e) => {
      this.validateField(e.target);
    });

    // Validate entire form on submit
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();  // Always prevent default, handle submit ourselves

      if (!this.validateForm()) {
        this.focusFirstInvalidField();  // Focus first invalid input for accessibility
        return;
      }

      // If valid, send form data
      this.showLoader();

      try {
        const formData = new FormData(this.form);

        // Replace URL with your actual form submission endpoint
        const response = await fetch(this.form.action || '/contact-submit', {
          method: 'POST',
          body: formData,
          headers: {
            // 'Content-Type': 'multipart/form-data' => browser sets this automatically with FormData
            'Accept': 'application/json',
          },
        });

        this.hideLoader();

        if (response.ok) {
          const result = await response.json().catch(() => null);

          // You can customize the success message or use server response
          this.showFormSuccess(result?.message || 'Your message has been sent! We will respond soon.');
          this.form.reset();
          // Also clear any errors
          this.form.querySelectorAll('.form-error').forEach(el => el.textContent = '');
        } else {
          // Handle server error
          const errorText = await response.text();
          this.showFormError(`Error sending message: ${errorText || response.statusText}`);
        }
      } catch (error) {
        this.hideLoader();
        this.showFormError('Network error. Please try again later.');
        console.error('Contact form submission error:', error);
      }
    });

    // Validate select dropdown changes
    this.form.addEventListener('change', (e) => {
      if (e.target.tagName === 'SELECT') {
        this.validateField(e.target);
      }
    });
  },

  /**
   * Initialize custom validation rules for special fields
   */
  initCustomValidations: function() {
    const messageInput = document.getElementById('message');
    if (messageInput) {
      messageInput.addEventListener('blur', () => {
        if (messageInput.value && messageInput.value.length < this.config.minMessageLength) {
          this.showError(messageInput, this.config.messages.minLength);
        }
      });
    }
  },

  /**
   * Validate the entire form; returns true if valid, false otherwise
   */
  validateForm: function() {
    let isValid = true;
    const requiredFields = this.form.querySelectorAll('[required]');

    requiredFields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    if (!isValid) {
      this.showFormError('Please correct the highlighted fields');
    }

    return isValid;
  },

  /**
   * Validate a single form field and show/hide error accordingly
   * @param {HTMLElement} field - The form field to validate
   * @returns {boolean} True if valid, false if invalid
   */
  validateField: function(field) {
    const errorElement = field.parentNode.querySelector('.form-error');

    if (!field.required) {
      this.hideError(field);
      return true;
    }

    if (field.value.trim() === '') {
      this.showError(field, this.config.messages.required);
      return false;
    }

    switch (field.type) {
      case 'email':
        if (!this.validateEmail(field.value)) {
          this.showError(field, this.config.messages.email);
          return false;
        }
        break;
      case 'textarea':
        if (field.id === 'message' && field.value.length < this.config.minMessageLength) {
          this.showError(field, this.config.messages.minLength);
          return false;
        }
        break;
    }

    this.hideError(field);
    return true;
  },

  /**
   * Validate email address format using regex
   * @param {string} email - Email string to validate
   * @returns {boolean} True if valid email format
   */
  validateEmail: function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Show an error message for a specific field
   * @param {HTMLElement} field - The field to show error for
   * @param {string} message - Error message text
   */
  showError: function(field, message) {
    const errorElement = field.parentNode.querySelector('.form-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      field.setAttribute('aria-invalid', 'true');
    }
    field.classList.add('invalid');
  },

  /**
   * Hide the error message for a specific field
   * @param {HTMLElement} field - The field to clear error from
   */
  hideError: function(field) {
    const errorElement = field.parentNode.querySelector('.form-error');
    if (errorElement) {
      errorElement.style.display = 'none';
      field.removeAttribute('aria-invalid');
    }
    field.classList.remove('invalid');
  },

  /**
   * Show a global form error message at the top of the form
   * @param {string} message - Message to display
   */
  showFormError: function(message) {
    const existingError = this.form.querySelector('.form-global-error');
    if (existingError) existingError.remove();

    const errorBox = document.createElement('div');
    errorBox.className = 'form-global-error';
    errorBox.textContent = message;
    errorBox.setAttribute('role', 'alert');

    this.form.insertBefore(errorBox, this.form.firstChild);

    setTimeout(() => {
      errorBox.classList.add('fade-out');
      setTimeout(() => errorBox.remove(), 300);
    }, this.config.errorDisplayDuration);
  },

  /**
   * Show a success message after form submission
   * @param {string} message - Success message to display
   */
  showFormSuccess: function(message) {
    const successBox = document.createElement('div');
    successBox.className = 'form-success-message';
    successBox.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    `;
    successBox.setAttribute('role', 'status');

    const formContainer = document.querySelector('.contact-form-section');
    formContainer.insertBefore(successBox, formContainer.firstChild);

    setTimeout(() => {
      successBox.classList.add('fade-out');
      setTimeout(() => successBox.remove(), 300);
    }, this.config.errorDisplayDuration);
  },

  /**
   * Focus the first invalid input field to assist user correction
   */
  focusFirstInvalidField: function() {
    const firstInvalid = this.form.querySelector('.invalid');
    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }
};

// Initialize form validation when DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => ContactFormValidator.init());
