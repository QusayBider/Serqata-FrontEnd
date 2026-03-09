
const TOKEN_EXPIRY_MINUTES = 30;
/**
 * Set a cookie with expiration time
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} minutes - Expiry time in minutes
 */
function setCookie(name, value, minutes) {
    const date = new Date();
    date.setTime(date.getTime() + (minutes * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/;SameSite=Strict";
}

/**
 * Get cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null
 */
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

/**
 * Delete a cookie
 * @param {string} name - Cookie name
 */
function deleteCookie(name) {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
}

/**
 * Decode JWT token to extract payload
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null
 */
function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
}

/**
 * Check if token is expired
 * @param {object} decodedToken - Decoded JWT payload
 * @returns {boolean} True if expired
 */
function isTokenExpired(decodedToken) {
    if (!decodedToken || !decodedToken.exp) return true;
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp < currentTime;
}

/**
 * Store authentication token and user info in cookies
 * @param {string} token - JWT token
 */
function storeToken(token) {
    const decoded = decodeJWT(token);

    if (decoded && !isTokenExpired(decoded)) {
        // Store token
        setCookie('authToken', token, TOKEN_EXPIRY_MINUTES);
        setCookie('isAuthenticated', 'true', TOKEN_EXPIRY_MINUTES);

        // Store user info from JWT - Robust extraction (handle case-sensitivity)
        const userName = decoded.Name ||
            decoded.name ||
            decoded.unique_name ||
            decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
            decoded.sub ||
            'User';
        setCookie('userName', userName, TOKEN_EXPIRY_MINUTES);

        // Email can be in: email, sub, upn
        const userEmail = decoded.email || decoded.sub || decoded.upn || '';
        if (userEmail) {
            setCookie('userEmail', userEmail, TOKEN_EXPIRY_MINUTES);
        }

        // Role can be in: role, roles (array), 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
        let userRole = null;

        // Check standard role claim
        if (decoded.role) {
            userRole = Array.isArray(decoded.role) ? decoded.role[0] : decoded.role;
        }
        // Check roles array
        else if (decoded.roles) {
            userRole = Array.isArray(decoded.roles) ? decoded.roles[0] : decoded.roles;
        }
        // Check Microsoft identity claim
        else if (decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
            const msRole = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
            userRole = Array.isArray(msRole) ? msRole[0] : msRole;
        }

        if (userRole) {
            setCookie('userRole', userRole, TOKEN_EXPIRY_MINUTES);
        } else {
            console.warn('No role found in JWT token. Available claims:', Object.keys(decoded));
            // Set default role as Customer if no role found
            setCookie('userRole', 'Customer', TOKEN_EXPIRY_MINUTES);
        }

        // Set up automatic logout timer
        setupAutoLogout();
    } else {
        console.error('Invalid or expired token');
    }
}

/**
 * Get authentication token from cookies
 * @returns {string|null} Token or null
 */
function getToken() {
    return getCookie('authToken');
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
function isAuthenticated() {
    const token = getToken();
    if (!token) return false;

    const decoded = decodeJWT(token);
    if (!decoded || isTokenExpired(decoded)) {
        clearAuth();
        return false;
    }

    return getCookie('isAuthenticated') === 'true';
}

/**
 * Get current user's role
 * @returns {string|null} User role (Admin, Customer, User) or null
 */
function getUserRole() {
    return getCookie('userRole');
}

/**
 * Get current user's name
 * @returns {string|null} User name or null
 */
function getUserName() {
    return getCookie('userName');
}

/**
 * Get current user's email
 * @returns {string|null} User email or null
 */
function getUserEmail() {
    return getCookie('userEmail');
}

/**
 * Get complete user info
 * @returns {object} User information object
 */
function getUserInfo() {
    return {
        name: getUserName(),
        email: getUserEmail(),
        role: getUserRole(),
        isAuthenticated: isAuthenticated()
    };
}

/**
 * Clear all authentication data
 */
function clearAuth() {
    deleteCookie('authToken');
    deleteCookie('isAuthenticated');
    deleteCookie('userName');
    deleteCookie('userEmail');
    deleteCookie('userRole');

    // Clear any auto-logout timer
    if (window.autoLogoutTimer) {
        clearTimeout(window.autoLogoutTimer);
    }
    
    // Clear token validation interval
    if (window.tokenValidationInterval) {
        clearInterval(window.tokenValidationInterval);
    }
}

/**
 * Setup automatic logout when token expires
 */
function setupAutoLogout() {
    // Clear existing timer
    if (window.autoLogoutTimer) {
        clearTimeout(window.autoLogoutTimer);
    }

    // Set new timer for TOKEN_EXPIRY_MINUTES
    window.autoLogoutTimer = setTimeout(() => {
        clearAuth();
        window.location.href = 'index.html';
    }, TOKEN_EXPIRY_MINUTES * 60 * 1000);
}

/**
 * Initialize authentication on page load
 * Validates token, reinitializes timeout timer, and redirects if expired
 */
function initializeAuth() {
    const token = getToken();
    
    // If no token, user is not authenticated
    if (!token) {
        return;
    }

    const decoded = decodeJWT(token);
    
    // If token is expired, clear auth and redirect to login
    if (isTokenExpired(decoded)) {
        clearAuth();
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
        return;
    }

    // Token is valid - reinitialize auto-logout timer
    setupAutoLogout();
}

/**
 * Setup auth initialization on page load (for all pages)
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    
    // Start periodic token validation check every 1 minute
    startTokenValidationCheck();
});

/**
 * Periodic token validation - checks every minute if token is still valid
 * This ensures users are logged out if token expires while they're browsing
 */
function startTokenValidationCheck() {
    // Check every 60 seconds
    window.tokenValidationInterval = setInterval(() => {
        const token = getToken();
        
        if (!token) return;
        
        const decoded = decodeJWT(token);
        
        // If token has expired, log out the user
        if (isTokenExpired(decoded)) {
            clearAuth();
            // Show warning and redirect
            alert('Your session has expired. Please log in again.');
            window.location.href = 'login.html';
        }
    }, 60000); // Check every 60 seconds
}


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

// Register function
async function register(email, password, userName, fullName, phoneNumber) {
    try {
        hideMessage('register-message');
        hideMessage('register-error');

        const response = await fetch(API_CONFIG.getApiUrl('Identity/Account/Register'), {
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

        // Check different possible token field names (handle nested structures)
        const token = data.token || data.Token || data.accessToken || data.access_token || data.result?.token || data.data?.token;

        if (response.ok && token) {
            storeToken(token);
            showMessage('register-message', 'Registration successfully', false);

            // Sync cart if CartManager exists
            if (typeof CartManager !== 'undefined' && CartManager.syncCartWithAPI) {
                CartManager.syncCartWithAPI();
            }

            setTimeout(() => {
             window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            // Handle error response
            const errorMessage = data.message || data.title || data.error || 'Registration failed. Please try again.';
            console.error('Registration error:', errorMessage);
            console.error('Full response:', data);
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

        const response = await fetch(API_CONFIG.getApiUrl('Identity/Account/Login'), {
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

        // Check different possible token field names (handle nested structures)
        const token = data.token || data.Token || data.accessToken || data.access_token || data.result?.token || data.data?.token;
        
        if (response.ok && token) {
            storeToken(token);
            showMessage('login-message', 'Login successfully', false);

            // Sync cart if CartManager exists
            if (typeof CartManager !== 'undefined' && CartManager.syncCartWithAPI) {
                CartManager.syncCartWithAPI();
            }

            // Role-based redirect after 1.5 seconds
            setTimeout(() => {
                window.location.href = './index.html';
            }, 1500);
        } else {
            // Handle error response
            const errorMessage = data.message || data.title || data.error || 'Login failed. Please check your credentials.';
            console.error('Login error:', errorMessage);
            console.error('Full response:', data);
            showMessage('login-message', errorMessage, true);
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('login-message', 'An error occurred. Please check your connection and try again.', true);
    }
}

// NOTE: Form submission handlers have been moved to login_auth.js for the glassmorphism UI
// The functions below (loginModal, registerModal) are kept for backward compatibility
// with other pages that may need modal-based authentication

// Login function for modal
async function loginModal(email, password) {
    try {
        hideMessage('login-modal-message');

        const response = await fetch(API_CONFIG.getApiUrl('Identity/Account/Login'), {
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

        // Check different possible token field names (handle nested structures)
        const token = data.token || data.Token || data.accessToken || data.access_token || data.result?.token || data.data?.token;

        if (response.ok && token) {
            storeToken(token);
            showMessage('login-modal-message', 'Login successfully', false);

            // Sync cart if CartManager exists
            if (typeof CartManager !== 'undefined' && CartManager.syncCartWithAPI) {
                CartManager.syncCartWithAPI();
            }

            setTimeout(() => {
                if (typeof $ !== 'undefined' && $('#signin-modal').length) {
                    $('#signin-modal').modal('hide');
                }
                window.location.href = './index.html'; 
            }, 1500);
        } else {
            const errorMessage = data.message || data.title || data.error || 'Login failed. Please check your credentials.';
            console.error('Login Modal error:', errorMessage, data);
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

        const response = await fetch(API_CONFIG.getApiUrl('Identity/Account/Register'), {
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

        // Check different possible token field names (handle nested structures)
        const token = data.token || data.Token || data.accessToken || data.access_token || data.result?.token || data.data?.token;

        if (response.ok && token) {
            storeToken(token);
            showMessage('register-modal-message', 'Registration successfully', false);

            // Sync cart if CartManager exists
            if (typeof CartManager !== 'undefined' && CartManager.syncCartWithAPI) {
                CartManager.syncCartWithAPI();
            }

            // Close modal and role-based redirect after 1.5 seconds
            setTimeout(() => {
                if (typeof $ !== 'undefined' && $('#signin-modal').length) {
                    $('#signin-modal').modal('hide');
                }
                window.location.href = './index.html';
            }, 1500);
        } else {
            const errorMessage = data.message || data.title || data.error || 'Registration failed. Please try again.';
            console.error('Register Modal error:', errorMessage, data);
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

        const response = await fetch(API_CONFIG.getApiUrl('Identity/Account/ForgetPassword'), {
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

        const response = await fetch(API_CONFIG.getApiUrl('Identity/Account/ResetPassword'), {
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
