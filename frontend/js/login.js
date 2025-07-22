
document.addEventListener('DOMContentLoaded', function() {
    // Toggle between login and signup forms with animation
    const toggleSignup = document.getElementById('toggleSignup');
    const toggleLogin = document.getElementById('toggleLogin');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const formTitle = document.getElementById('formTitle') || document.querySelector('h2');
    const signupText = document.getElementById('toggleSignupText');

    function fadeOutIn(hideForm, showForm, newTitle, showSignupText) {
        hideForm.classList.add('animate-fade-in');
        hideForm.classList.add('hidden');
        showForm.classList.remove('hidden');
        showForm.classList.add('animate-fade-in');
        setTimeout(() => {
            showForm.classList.remove('animate-fade-in');
        }, 700);
        formTitle.textContent = newTitle;
        if (signupText) signupText.classList.toggle('hidden', !showSignupText);
    }

    toggleSignup.addEventListener('click', function(e) {
        e.preventDefault();
        fadeOutIn(loginForm, signupForm, 'Create a new account', false);
    });
    toggleLogin.addEventListener('click', function(e) {
        e.preventDefault();
        fadeOutIn(signupForm, loginForm, 'Sign in to your account', true);
    });

    // Password visibility toggles with icon animation
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
            eyeIcon.classList.add('animate-pulse');
            setTimeout(() => eyeIcon.classList.remove('animate-pulse'), 300);
        });
    }
    setupPasswordToggle('toggleLoginPassword', 'login-password');
    setupPasswordToggle('toggleSignupPassword', 'signup-password');
    setupPasswordToggle('toggleSignupConfirmPassword', 'signup-confirm-password');

    // Helper to show messages above forms (fade in/out)
    function showMessage(form, message, type = 'error') {
        let msgDiv = form.querySelector('.form-message');
        if (!msgDiv) {
            msgDiv = document.createElement('div');
            msgDiv.className = 'form-message';
            form.prepend(msgDiv);
        }
        msgDiv.textContent = message;
        msgDiv.className = 'form-message ' + (type === 'error' ? 'error' : 'success');
        msgDiv.style.opacity = '0';
        setTimeout(() => {
            msgDiv.style.opacity = '1';
        }, 10);
        // Remove after 3s if success
        if (type === 'success') {
            setTimeout(() => {
                if (msgDiv.parentNode) msgDiv.parentNode.removeChild(msgDiv);
            }, 3000);
        }
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

    // Loading spinner helpers
    function setLoading(form, isLoading) {
        const btn = form.querySelector('button[type="submit"]');
        const btnText = btn.querySelector('span');
        const spinner = btn.querySelector('.fa-spinner')?.parentNode;
        if (isLoading) {
            btn.disabled = true;
            if (btnText) btnText.style.opacity = '0.5';
            if (spinner) spinner.classList.remove('hidden');
        } else {
            btn.disabled = false;
            if (btnText) btnText.style.opacity = '1';
            if (spinner) spinner.classList.add('hidden');
        }
    }

    const API_BASE = 'http://localhost:7000/api';

    // Check if already logged in
    if (localStorage.getItem('token')) {
        window.location.href = localStorage.getItem('redirectAfterLogin') || 'index.html';
        return;
    }

    // Form submissions
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        let valid = true;
        loginForm.querySelectorAll('label').forEach(l => l.classList.remove('label-error'));
        if (loginForm.querySelector('.form-message')) loginForm.querySelector('.form-message').remove();
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
        setLoading(loginForm, true);
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.value.trim(), password: password.value })
            });
            const data = await res.json();
            setLoading(loginForm, false);
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showMessage(loginForm, 'Login successful!', 'success');
                setTimeout(() => {
                    window.location.href = localStorage.getItem('redirectAfterLogin') || 'index.html';
                }, 800);
            } else {
                showMessage(loginForm, data.message || 'Login failed', 'error');
            }
        } catch (err) {
            setLoading(loginForm, false);
            showMessage(loginForm, 'Login failed. Please try again.', 'error');
        }
    });

    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        let valid = true;
        signupForm.querySelectorAll('label').forEach(l => l.classList.remove('label-error'));
        if (signupForm.querySelector('.form-message')) signupForm.querySelector('.form-message').remove();
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
        setLoading(signupForm, true);
        try {
            const res = await fetch(`${API_BASE}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.value.trim(), email: email.value.trim(), password: password.value })
            });
            const data = await res.json();
            setLoading(signupForm, false);
            if (data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showMessage(signupForm, 'Account created successfully!', 'success');
                setTimeout(() => {
                    window.location.href = localStorage.getItem('redirectAfterLogin') || 'index.html';
                }, 800);
            } else {
                showMessage(signupForm, data.message || 'Signup failed', 'error');
            }
        } catch (err) {
            setLoading(signupForm, false);
            showMessage(signupForm, 'Signup failed. Please try again.', 'error');
        }
    });
});
