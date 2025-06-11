/**
 * Job Application Form Validator
 * Comprehensive form validation system with:
 * - Real-time validation
 * - Custom rules
 * - Error messages
 * - Accessibility support
 */
const JobsFormValidator = {
  // Validation configuration
  config: {
    minAge: 16,                     // Minimum required age
    minElo: 2500,                   // Minimum required Faceit ELO
    messages: {                     // Custom error messages
      required: 'This field is required',
      age: 'Minimum age is 16 years',
      elo: 'Minimum Faceit ELO is 2500',
      email: 'Please enter a valid email address',
      url: 'Please enter a valid URL'
    },
    errorDisplayDuration: 5000       // Global error display time (ms)
  },

  /**
   * Initialize form validator
   * Gets form, creates error containers and sets up event listeners
   */
  init: function() {
    this.form = document.querySelector('.application-form');
    if (!this.form) return;  // Exit if form doesn't exist
    
    this.createErrorContainers();    // Create error message containers
    this.setupEventListeners();      // Set up input, submit, change listeners
    this.initCustomValidations();    // Set up custom validations (age, ELO)
    
    return this;  // Allow method chaining
  },

  /**
   * Create DOM elements for error messages
   * Adds empty divs for error messages next to required fields
   */
  createErrorContainers: function() {
    this.form.querySelectorAll('[required]').forEach(field => {
      if (!field.parentNode.querySelector('.form-error')) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.setAttribute('aria-live', 'polite'); // For screen readers
        field.parentNode.appendChild(errorDiv);
      }
    });
  },

  /**
   * Set up all form event listeners:
   * - input: validation while typing
   * - submit: full form validation before submission
   * - change: validation for select elements
   */
  setupEventListeners: function() {
    // Real-time validation while typing
    this.form.addEventListener('input', (e) => {
      this.validateField(e.target);
    });

    // Full form validation on submit
    this.form.addEventListener('submit', (e) => {
      if (!this.validateForm()) {
        e.preventDefault();  // Prevent submission if invalid
        this.focusFirstInvalidField();  // Focus first invalid field
      }
    });

    // Validation for select changes
    this.form.addEventListener('change', (e) => {
      if (e.target.tagName === 'SELECT') {
        this.validateField(e.target);
      }
    });
  },

  /**
   * Set up custom validation rules
   * For special fields like age and ELO
   */
  initCustomValidations: function() {
    const ageInput = document.getElementById('age');
    if (ageInput) {
      ageInput.addEventListener('blur', () => {
        if (ageInput.value && ageInput.value < this.config.minAge) {
          this.showError(ageInput, this.config.messages.age);
        }
      });
    }
    
    const eloInput = document.getElementById('faceit-elo');
    if (eloInput) {
      eloInput.addEventListener('blur', () => {
        if (eloInput.value && eloInput.value < this.config.minElo) {
          this.showError(eloInput, this.config.messages.elo);
        }
      });
    }
  },

  /**
   * Validate entire form
   * @returns {boolean} true if valid, false if invalid
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
   * Validate single form field and show/hide error
   * @param {HTMLElement} field - form field to validate
   * @returns {boolean} true if valid, false if invalid
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
      case 'select-one':
        if (field.value === '') {
          this.showError(field, this.config.messages.required);
          return false;
        }
        break;
      case 'number':
        if (field.id === 'age' && field.value < this.config.minAge) {
          this.showError(field, this.config.messages.age);
          return false;
        }
        if (field.id === 'faceit-elo' && field.value < this.config.minElo) {
          this.showError(field, this.config.messages.elo);
          return false;
        }
        break;
      case 'email':
        if (!this.validateEmail(field.value)) {
          this.showError(field, this.config.messages.email);
          return false;
        }
        break;
      case 'checkbox':
        if (!field.checked) {
          this.showError(field, this.config.messages.required);
          return false;
        }
        break;
      case 'url':
        if (!this.validateUrl(field.value)) {
          this.showError(field, this.config.messages.url);
          return false;
        }
        break;
    }

    this.hideError(field);
    return true;
  },

  /**
   * Validate email format using regex
   * @param {string} email - email to validate
   * @returns {boolean} true if valid email format
   */
  validateEmail: function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} true if valid URL
   */
  validateUrl: function(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Show error message for specific field
   * @param {HTMLElement} field - form field
   * @param {string} message - error message to display
   */
  showError: function(field, message) {
    const errorElement = field.parentNode.querySelector('.form-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      field.setAttribute('aria-invalid', 'true'); // For screen readers
    }
    field.classList.add('invalid'); // Add error CSS class
  },

  /**
   * Hide error message for specific field
   * @param {HTMLElement} field - form field
   */
  hideError: function(field) {
    const errorElement = field.parentNode.querySelector('.form-error');
    if (errorElement) {
      errorElement.style.display = 'none';
      field.removeAttribute('aria-invalid');
    }
    field.classList.remove('invalid'); // Remove error CSS class
  },

  /**
   * Show global form error message at top of form
   * @param {string} message - error message to display
   */
  showFormError: function(message) {
    const existingError = this.form.querySelector('.form-global-error');
    if (existingError) existingError.remove();
    
    const errorBox = document.createElement('div');
    errorBox.className = 'form-global-error';
    errorBox.textContent = message;
    errorBox.setAttribute('role', 'alert'); // For screen readers
    
    this.form.insertBefore(errorBox, this.form.firstChild);
    
    // Hide message after timeout with fade animation
    setTimeout(() => {
      errorBox.classList.add('fade-out');
      setTimeout(() => errorBox.remove(), 300);
    }, this.config.errorDisplayDuration);
  },

  /**
   * Focus first invalid field
   * Helps users quickly correct the form
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

// Initialize validator when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => JobsFormValidator.init());