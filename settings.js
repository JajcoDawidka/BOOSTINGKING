document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const settingsForm = document.querySelector('.settings-form');
    const cancelButton = document.querySelector('.cancel-button');
    const saveButton = document.getElementById('saveButton');
    const usernameInput = document.getElementById('username');
    const usernameChangeHint = document.getElementById('usernameChangeHint');
    const changeUsernameBtn = document.getElementById('changeUsernameBtn');
    const emailInput = document.getElementById('email');
    const avatarUpload = document.getElementById('avatarUpload');
    const avatarPreview = document.getElementById('avatarPreview');
    
    // State
    let isEditingUsername = false;
    let lastUsernameChange = localStorage.getItem('lastUsernameChange');
    let canChangeUsername = true;
    let currentAvatar = localStorage.getItem('avatar') || null;
    let newAvatar = null; // Track new avatar before saving
    
    // Initialize avatar
    if (currentAvatar) {
        setAvatar(currentAvatar);
    }
    
    // Check if username can be changed
    if (lastUsernameChange) {
        const lastChangeDate = new Date(lastUsernameChange);
        const now = new Date();
        const daysSinceChange = Math.floor((now - lastChangeDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceChange < 30) {
            canChangeUsername = false;
            const daysLeft = 30 - daysSinceChange;
            usernameChangeHint.textContent = `You can change your username again in ${daysLeft} days`;
            changeUsernameBtn.style.display = 'none';
        }
    }
    
    // Toggle username editing
    changeUsernameBtn.addEventListener('click', function() {
        if (!isEditingUsername) {
            usernameInput.readOnly = false;
            usernameInput.focus();
            usernameInput.style.backgroundColor = '#1f1f2a';
            changeUsernameBtn.textContent = 'Cancel';
            isEditingUsername = true;
            enableSaveButton();
        } else {
            resetUsernameField();
        }
    });
    
    // Username input validation
    usernameInput.addEventListener('input', function() {
        if (this.value.trim().length < 3 || this.value.trim().length > 20) {
            this.classList.add('invalid');
            saveButton.disabled = true;
        } else {
            this.classList.remove('invalid');
            enableSaveButton();
        }
    });
    
    // Form submission
    settingsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!canChangeUsername && isEditingUsername) {
            showToast('You can only change username once every 30 days');
            return;
        }
        
        // Show loading state
        saveButton.innerHTML = '<span class="loading-spinner"></span> Saving...';
        saveButton.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            // Save username changes if any
            if (isEditingUsername) {
                localStorage.setItem('lastUsernameChange', new Date().toISOString());
                showToast('Username changed successfully!');
                canChangeUsername = false;
                changeUsernameBtn.style.display = 'none';
                usernameChangeHint.textContent = 'You can change your username again in 30 days';
            }
            
            // Save new avatar if selected
            if (newAvatar) {
                localStorage.setItem('avatar', newAvatar);
                currentAvatar = newAvatar;
                newAvatar = null;
                showToast('Avatar updated successfully!');
            }
            
            showToast('All changes saved successfully!');
            resetForm();
        }, 1500);
    });
    
    // Cancel button
    cancelButton.addEventListener('click', function() {
        // Revert avatar if not saved
        if (newAvatar) {
            setAvatar(currentAvatar);
            newAvatar = null;
        }
        resetForm();
    });
    
    // Avatar upload handling
    avatarUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file (JPEG, PNG)');
            return;
        }
        
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image size must be less than 2MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            newAvatar = event.target.result;
            setAvatar(newAvatar);
            enableSaveButton();
            showToast('Avatar ready to save!');
        };
        reader.readAsDataURL(file);
    });
    
    // Helper functions
    function setAvatar(imageData) {
        // Remove existing avatar elements
        while (avatarPreview.firstChild) {
            avatarPreview.removeChild(avatarPreview.firstChild);
        }
        
        const img = document.createElement('img');
        img.src = imageData;
        img.alt = 'User Avatar';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '50%';
        avatarPreview.appendChild(img);
    }
    
    function enableSaveButton() {
        // Enable save button if there are pending changes
        saveButton.disabled = false;
    }
    
    function resetForm() {
        saveButton.textContent = 'Save Changes';
        saveButton.disabled = true;
        resetUsernameField();
    }
    
    function resetUsernameField() {
        usernameInput.readOnly = true;
        usernameInput.style.backgroundColor = '#252525';
        changeUsernameBtn.textContent = 'Change';
        isEditingUsername = false;
    }
    
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    // Prevent email input editing
    emailInput.addEventListener('keydown', function(e) {
        e.preventDefault();
    });
});

document.addEventListener('DOMContentLoaded', function() {
  const settingsLink = document.querySelector('.settings-link');
  const isLoggedIn = false; // Replace with actual authentication check
  
  settingsLink.addEventListener('click', function(e) {
    if (!isLoggedIn) {
      e.preventDefault();
      window.location.href = 'login.html';
      // Optional: Add redirect parameter to return to settings after login
      // window.location.href = 'login.html?redirect=settings.html';
    }
  });
});

// Loading spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,.3);
        border-radius: 50%;
        border-top-color: #0a0a0a;
        animation: spin 1s ease-in-out infinite;
        margin-right: 8px;
        vertical-align: middle;
    }
`;
document.head.appendChild(style);