// Authentication API Configuration
const API_BASE_URL = 'https://serqata.runasp.net/api/Identity/Account';

// Helper function to show messages
function showMessage(elementId, message, isError = false) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = isError ? 'alert alert-danger' : 'alert alert-success';
        messageElement.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }
}

// Helper function to hide messages
function hideMessage(elementId) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.style.display = 'none';
    }
}

// Store token in localStorage
function storeToken(token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('isAuthenticated', 'true');
}

// Get token from localStorage
function getToken() {
    return localStorage.getItem('authToken');
}

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('isAuthenticated') === 'true';
}

// Clear authentication
function clearAuth() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
}

// Register function
async function register(email, password, userName, fullName, phoneNumber) {
    try {
        hideMessage('register-message');
        hideMessage('register-error');
        
        const response = await fetch(`${API_BASE_URL}/Register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
                userName: userName,
                fullName: fullName,
                phoneNumber: phoneNumber
            })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            storeToken(data.token);
            showMessage('register-message', 'Registration successful! Redirecting...', false);
            
            // Redirect to home page after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            // Handle error response
            const errorMessage = data.message || data.title || 'Registration failed. Please try again.';
            showMessage('register-error', errorMessage, true);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('register-error', 'An error occurred. Please check your connection and try again.', true);
    }
}

// Login function
async function login(email, password) {
    try {
        hideMessage('login-message');
        hideMessage('login-error');
        
        const response = await fetch(`${API_BASE_URL}/Login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            storeToken(data.token);
            showMessage('login-message', 'Login successful! Redirecting...', false);
            
            // Redirect to home page after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            // Handle error response
            const errorMessage = data.message || data.title || 'Login failed. Please check your credentials.';
            showMessage('login-error', errorMessage, true);
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('login-error', 'An error occurred. Please check your connection and try again.', true);
    }
}

// Handle login form submission (page form)
$(document).ready(function() {
    // Handle login form on the login page
    $('#signin-2 form').on('submit', function(e) {
        e.preventDefault();
        const email = $('#singin-email-2').val().trim();
        const password = $('#singin-password-2').val();
        
        if (!email || !password) {
            showMessage('login-error', 'Please fill in all required fields.', true);
            return;
        }
        
        login(email, password);
    });

    // Handle register form on the login page
    $('#register-2 form').on('submit', function(e) {
        e.preventDefault();
        const email = $('#register-email-2').val().trim();
        const password = $('#register-password-2').val();
        const userName = $('#register-username-2').val().trim();
        const fullName = $('#register-fullname-2').val().trim();
        const phoneNumber = $('#register-phone-2').val().trim();
        
        if (!email || !password || !userName || !fullName || !phoneNumber) {
            showMessage('register-error', 'Please fill in all required fields.', true);
            return;
        }
        
        register(email, password, userName, fullName, phoneNumber);
    });

    // Handle login form in modal
    $('#signin form').on('submit', function(e) {
        e.preventDefault();
        hideMessage('login-modal-message');
        const email = $('#singin-email').val().trim();
        const password = $('#singin-password').val();
        
        if (!email || !password) {
            showMessage('login-modal-message', 'Please fill in all required fields.', true);
            return;
        }
        
        // Use modal-specific login function
        loginModal(email, password);
    });

    // Handle register form in modal
    $('#register form').on('submit', function(e) {
        e.preventDefault();
        hideMessage('register-modal-message');
        const email = $('#register-email').val().trim();
        const password = $('#register-password').val();
        const userName = $('#register-username').val().trim();
        const fullName = $('#register-fullname').val().trim();
        const phoneNumber = $('#register-phone').val().trim();
        
        if (!email || !password || !userName || !fullName || !phoneNumber) {
            showMessage('register-modal-message', 'Please fill in all required fields.', true);
            return;
        }
        
        // Use modal-specific register function
        registerModal(email, password, userName, fullName, phoneNumber);
    });

    // Handle forget password form (using event delegation in case modal is loaded dynamically)
    $(document).on('submit', '#forget-password-form', function(e) {
        e.preventDefault();
        hideMessage('forget-password-message');
        hideMessage('forget-password-error');
        
        const email = $('#forget-password-email').val().trim();
        
        if (!email) {
            showMessage('forget-password-error', 'Please enter your email address.', true);
            return;
        }
        
        forgetPassword(email);
    });

    // Handle reset password form
    $('#reset-password-form').on('submit', function(e) {
        e.preventDefault();
        const email = $('#reset-password-email').val().trim();
        const code = $('#reset-password-code').val().trim();
        const password = $('#reset-password-new-password').val();
        const confirmPassword = $('#reset-password-confirm-password').val();
        
        if (!email || !code || !password || !confirmPassword) {
            showMessage('reset-password-error', 'Please fill in all required fields.', true);
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('reset-password-error', 'Passwords do not match.', true);
            return;
        }
        
        resetPassword(email, code, password);
    });

});

// Login function for modal
async function loginModal(email, password) {
    try {
        hideMessage('login-modal-message');
        
        const response = await fetch(`${API_BASE_URL}/Login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            storeToken(data.token);
            showMessage('login-modal-message', 'Login successful! Redirecting...', false);
            
            // Close modal and redirect after 1.5 seconds
            setTimeout(() => {
                $('#signin-modal').modal('hide');
                window.location.href = 'index.html';
            }, 1500);
        } else {
            const errorMessage = data.message || data.title || 'Login failed. Please check your credentials.';
            showMessage('login-modal-message', errorMessage, true);
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('login-modal-message', 'An error occurred. Please check your connection and try again.', true);
    }
}

// Register function for modal
async function registerModal(email, password, userName, fullName, phoneNumber) {
    try {
        hideMessage('register-modal-message');
        
        const response = await fetch(`${API_BASE_URL}/Register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
                userName: userName,
                fullName: fullName,
                phoneNumber: phoneNumber
            })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            storeToken(data.token);
            showMessage('register-modal-message', 'Registration successful! Redirecting...', false);
            
            // Close modal and redirect after 1.5 seconds
            setTimeout(() => {
                $('#signin-modal').modal('hide');
                window.location.href = 'index.html';
            }, 1500);
        } else {
            const errorMessage = data.message || data.title || 'Registration failed. Please try again.';
            showMessage('register-modal-message', errorMessage, true);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('register-modal-message', 'An error occurred. Please check your connection and try again.', true);
    }
}

// Forget Password function
async function forgetPassword(email) {
    try {
        hideMessage('forget-password-message');
        hideMessage('forget-password-error');
        
        const response = await fetch(`${API_BASE_URL}/ForgetPassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email
            })
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            // If response is not JSON, try to get text
            const text = await response.text();
            data = text;
        }

        if (response.ok) {
            // Store email for reset password page
            sessionStorage.setItem('resetPasswordEmail', email);
            const message = (typeof data === 'string') ? data : (data.message || 'Check your email — we\'ve sent you a message with instructions to reset your password.');
            showMessage('forget-password-message', message, false);
            
            // Show reset password form after 2 seconds
            setTimeout(() => {
                $('#forget-password-modal').modal('hide');
                // Navigate to reset password or show reset form
                window.location.href = 'reset-password.html?email=' + encodeURIComponent(email);
            }, 2000);
        } else {
            // Handle error - try to extract error message
            let errorMessage = 'Failed to send reset code. Please try again.';
            if (typeof data === 'string') {
                errorMessage = data;
            } else if (data && data.message) {
                errorMessage = data.message;
            } else if (data && data.title) {
                errorMessage = data.title;
            }
            showMessage('forget-password-error', errorMessage, true);
        }
    } catch (error) {
        console.error('Forget password error:', error);
        showMessage('forget-password-error', 'An error occurred. Please check your connection and try again.', true);
    }
}

// Reset Password function
async function resetPassword(email, code, password) {
    try {
        hideMessage('reset-password-message');
        hideMessage('reset-password-error');
        
        const response = await fetch(`${API_BASE_URL}/ResetPassword`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                code: code,
                password: password
            })
        });

        let data;
        try {
            data = await response.json();
        } catch (e) {
            // If response is not JSON, try to get text
            const text = await response.text();
            data = text;
        }

        if (response.ok) {
            const message = (typeof data === 'string') ? data : (data.message || 'Password Changed Successfully');
            showMessage('reset-password-message', message, false);
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                sessionStorage.removeItem('resetPasswordEmail');
                window.location.href = 'login.html';
            }, 2000);
        } else {
            // Handle error - try to extract error message
            let errorMessage = 'Failed to reset password. Please try again.';
            if (typeof data === 'string') {
                errorMessage = data;
            } else if (data && data.message) {
                errorMessage = data.message;
            } else if (data && data.title) {
                errorMessage = data.title;
            }
            showMessage('reset-password-error', errorMessage, true);
        }
    } catch (error) {
        console.error('Reset password error:', error);
        showMessage('reset-password-error', 'An error occurred. Please check your connection and try again.', true);
    }
}

