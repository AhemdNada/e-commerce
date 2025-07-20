
document.addEventListener('DOMContentLoaded', function() {
    // Toggle between login and signup forms
    const toggleSignup = document.getElementById('toggleSignup');
    const toggleLogin = document.getElementById('toggleLogin');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    toggleSignup.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        document.querySelector('h2').textContent = 'Create a new account';
        document.getElementById('toggleSignupText').classList.add('hidden');
    });
    
    toggleLogin.addEventListener('click', function(e) {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        document.querySelector('h2').textContent = 'Sign in to your account';
        document.getElementById('toggleSignupText').classList.remove('hidden');
    });
    
    // Password visibility toggles
    function setupPasswordToggle(eyeIconId, passwordFieldId) {
        const eyeIcon = document.getElementById(eyeIconId);
        const passwordField = document.getElementById(passwordFieldId);
        
        eyeIcon.addEventListener('click', function() {
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
            } else {
                passwordField.type = 'password';
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
            }
        });
    }
    
    setupPasswordToggle('toggleLoginPassword', 'login-password');
    setupPasswordToggle('toggleSignupPassword', 'signup-password');
    setupPasswordToggle('toggleSignupConfirmPassword', 'signup-confirm-password');
    
    // Helper to show messages above forms
    function showMessage(form, message, type = 'error') {
        let msgDiv = form.querySelector('.form-message');
        if (!msgDiv) {
            msgDiv = document.createElement('div');
            msgDiv.className = 'form-message';
            form.prepend(msgDiv);
        }
        msgDiv.textContent = message;
        msgDiv.className = 'form-message ' + (type === 'error' ? 'error' : 'success');
    }

    // Helper to set label color
    function setLabelError(input, hasError) {
        const label = input.closest('div').querySelector('label');
        if (label) {
            if (hasError) {
                label.classList.add('label-error');
            } else {
                label.classList.remove('label-error');
            }
        }
    }
    
    // Form submissions
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        let valid = true;
        // Clear previous errors
        loginForm.querySelectorAll('label').forEach(l => l.classList.remove('label-error'));
        if (loginForm.querySelector('.form-message')) loginForm.querySelector('.form-message').remove();
        // Validation
        const email = document.getElementById('login-email');
        const password = document.getElementById('login-password');
        if (!email.value.trim()) {
            setLabelError(email, true);
            valid = false;
        }
        if (!password.value.trim()) {
            setLabelError(password, true);
            valid = false;
        }
        if (!valid) {
            showMessage(loginForm, 'Please fill in all fields', 'error');
            return;
        }
        // Success (replace with real logic)
        showMessage(loginForm, 'Login successful (demo)', 'success');
    });
    
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        let valid = true;
        // Clear previous errors
        signupForm.querySelectorAll('label').forEach(l => l.classList.remove('label-error'));
        if (signupForm.querySelector('.form-message')) signupForm.querySelector('.form-message').remove();
        // Validation
        const name = document.getElementById('signup-name');
        const email = document.getElementById('signup-email');
        const password = document.getElementById('signup-password');
        const confirmPassword = document.getElementById('signup-confirm-password');
        if (!name.value.trim()) {
            setLabelError(name, true);
            valid = false;
        }
        if (!email.value.trim()) {
            setLabelError(email, true);
            valid = false;
        }
        if (!password.value.trim()) {
            setLabelError(password, true);
            valid = false;
        }
        if (!confirmPassword.value.trim()) {
            setLabelError(confirmPassword, true);
            valid = false;
        }
        if (password.value !== confirmPassword.value) {
            setLabelError(password, true);
            setLabelError(confirmPassword, true);
            showMessage(signupForm, 'Passwords do not match', 'error');
            return;
        }
        if (!valid) {
            showMessage(signupForm, 'Please fill in all fields', 'error');
            return;
        }
        // Success (replace with real logic)
        showMessage(signupForm, 'Account created successfully (demo)', 'success');
    });
});
