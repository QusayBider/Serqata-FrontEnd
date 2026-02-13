
const DashboardManager = {
    // API Endpoints (don't include 'api/' prefix - API_CONFIG adds it automatically)
    endpoints: {
        profile: 'customer/Profile/GetProfile', 
        orders: 'customer/Orders/GetMyOrders',
        addresses: 'customer/Addresses'
    },

    init: async function () {
        console.log('[Dashboard] Initializing DashboardManager...');
        if (!this.isAuthenticated()) {
            console.log('[Dashboard] User not authenticated, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        // Initialize tabs
        this.bindEvents();

        // Load initial data
        console.log('[Dashboard] Loading dashboard data...');
        await this.loadUserProfile();
        await this.loadOrders();
        await this.loadAddresses();
    },
    isAuthenticated: function () {
        return isAuthenticated(); 
    },

    getToken: function () {
        // Try multiple ways to get token
        let token = getToken(); // From auth.js
        
        if (!token) {
            // Fallback: try to get from cookies directly
            token = this.getCookie('authToken') || this.getCookie('token') || this.getCookie('access_token');
        }
        
        console.log('[Dashboard] Token retrieved:', token ? `Present (${token.substring(0, 20)}...)` : 'Missing');
        console.log('[Dashboard] All cookies:', document.cookie);
        
        return token;
    },

    getCookie: function(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },

    getHeaders: function () {
        const token = this.getToken();
        if (!token) {
            console.error('[Dashboard] No authentication token available!');
        }
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        console.log('[Dashboard] Headers being sent:', {
            Authorization: token ? `Bearer ${token.substring(0, 20)}...` : 'NO TOKEN',
            'Content-Type': 'application/json'
        });
        return headers;
    },

    // --- Profile Section ---
    loadUserProfile: async function () {
        try {
            console.log('[Dashboard] Fetching user profile...');
            const url = API_CONFIG.getApiUrl(this.endpoints.profile);
            console.log('[Dashboard] Profile URL:', url);

            // Attempt to fetch profile
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            console.log('[Dashboard] Profile response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('[Dashboard] Profile data received:', data);
                this.renderProfile(data.data || data);
            } else {
                console.warn('[Dashboard] Failed to load profile. Status:', response.status);
                const errorText = await response.text();
                console.warn('[Dashboard] Error response:', errorText);
                // Fallback: try to load from cookies/user info from auth
                this.renderProfileFromAuth();
            }
        } catch (error) {
            console.error('[Dashboard] Error loading profile:', error);
            this.renderProfileFromAuth();
        }
    },

    renderProfileFromAuth: function () {
        // Fallback to get user info from cookies set during login
        const userName = getUserName() || 'User';
        const userEmail = getUserEmail() || '';
        
        $('#dashboard-hello-user').text(userName);
        $('#dashboard-not-user').text(userName);
        $('#acc-email').val(userEmail);
        console.log('[Dashboard] Profile rendered from auth cookies:', userName);
    },

    renderProfile: function (user) {
        if (!user) {
            console.warn('[Dashboard] No user data to render');
            this.renderProfileFromAuth();
            return;
        }

        console.log('[Dashboard] Rendering profile:', user);

        // Update Dashboard Greeting
        const displayName = user.firstName || user.fullName || user.userName || 'User';
        const lastName = user.lastName || '';
        const email = user.email || '';

        $('#dashboard-hello-user').text(displayName);
        $('#dashboard-not-user').text(displayName);

        // Update Account Details Form
        $('#acc-firstname').val(displayName);
        $('#acc-lastname').val(lastName);
        $('#acc-display-name').val(displayName);
        $('#acc-email').val(email);
    },

    updateProfile: async function (formData) {
        try {
            console.log('[Dashboard] Updating profile with data:', formData);
            const response = await fetch(API_CONFIG.getApiUrl('api/customers/update-profile'), {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(formData)
            });

            console.log('[Dashboard] Update response status:', response.status);
            const data = await response.json();
            
            if (response.ok) {
                alert('Profile updated successfully');
                this.loadUserProfile(); // Reload
            } else {
                alert(data.message || 'Failed to update profile');
                console.error('[Dashboard] Update failed:', data);
            }
        } catch (error) {
            console.error('[Dashboard] Error updating profile:', error);
            alert('An error occurred while updating profile');
        }
    },

    // --- Orders Section ---
    loadOrders: async function () {
        const $tabOrders = $('#tab-orders');
        try {
            console.log('[Dashboard] Fetching orders...');
            const url = API_CONFIG.getApiUrl(this.endpoints.orders);
            console.log('[Dashboard] Orders URL:', url);
            const headers = this.getHeaders();
            console.log('[Dashboard] Headers:', headers);

            $tabOrders.html('<p>Loading orders...</p>');

            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                mode: 'cors',
                credentials: 'include'
            });

            console.log('[Dashboard] Orders response status:', response.status);
            console.log('[Dashboard] Orders response headers:', {
                contentType: response.headers.get('content-type'),
                contentLength: response.headers.get('content-length')
            });

            // Get raw response text first for debugging
            const responseText = await response.text();
            console.log('[Dashboard] Raw response:', responseText);

            if (response.ok) {
                try {
                    const result = JSON.parse(responseText);
                    console.log('[Dashboard] Parsed orders result:', result);
                    
                    // Handle different possible response formats
                    let orders = result.data || result.orders || result;
                    
                    // If result is wrapped in success property
                    if (result.success && result.data) {
                        orders = result.data;
                    }
                    
                    console.log('[Dashboard] Extracted orders:', orders);
                    console.log('[Dashboard] Orders is array?', Array.isArray(orders));

                    if (Array.isArray(orders) && orders.length > 0) {
                        this.renderOrders(orders);
                    } else {
                        console.log('[Dashboard] No orders found in response');
                        $tabOrders.html(`
                            <p>No order has been made yet.</p>
                            <a href="category.html" class="btn btn-outline-primary-2"><span>GO SHOP</span><i class="icon-long-arrow-right"></i></a>
                        `);
                    }
                } catch (parseError) {
                    console.error('[Dashboard] Error parsing response JSON:', parseError);
                    console.error('[Dashboard] Response text was:', responseText);
                    $tabOrders.html('<p>Error parsing server response.</p>');
                }
            } else {
                console.warn('[Dashboard] Failed to load orders. Status:', response.status);
                console.warn('[Dashboard] Error response:', responseText);
                $tabOrders.html(`<p>Failed to load orders (Status: ${response.status}). Please try again later.</p>`);
            }
        } catch (error) {
            console.error('[Dashboard] Exception loading orders:', error);
            console.error('[Dashboard] Error message:', error.message);
            console.error('[Dashboard] Error type:', error.name);
            console.error('[Dashboard] Error stack:', error.stack);
            $tabOrders.html('<p>Error loading orders. Please try again later.</p>');
        }
    },

    // Status mapping for numeric values
    getStatusLabel: function (statusCode) {
        const statusMap = {
            0: 'Pending',
            1: 'Processing',
            2: 'Shipped',
            3: 'Delivered',
            4: 'Cancelled',
            5: 'Refunded'
        };
        return statusMap[statusCode] || `Status ${statusCode}`;
    },

    renderOrders: function (orders) {
        const $tabOrders = $('#tab-orders');
        if (!Array.isArray(orders) || orders.length === 0) {
            console.warn('[Dashboard] No orders to render');
            return;
        }

        console.log('[Dashboard] Rendering', orders.length, 'orders');
        let html = `
            <table class="table table-cart table-mobile">
                <thead>
                    <tr>
                        <th>Order</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        orders.forEach(order => {
            try {
                const date = new Date(order.orderDate).toLocaleDateString();
                const total = order.totalAmount || 0;
                const statusLabel = this.getStatusLabel(order.status);
                const orderId = order.id || 'N/A';
                const trackingCode = order.trackingCode || `ORD-${orderId}`;

                html += `
                    <tr>
                        <td class="product-col">#${orderId} <br><small>${trackingCode}</small></td>
                        <td class="price-col">${date}</td>
                        <td class="stock-col"><span class="in-stock">${statusLabel}</span></td>
                        <td class="price-col">ILS ${Number(total).toFixed(2)}</td>
                        <td class="action-col">
                            <button class="btn btn-outline-primary-2 btn-order-view" data-id="${orderId}">View</button>
                        </td>
                    </tr>
                `;
            } catch (e) {
                console.error('[Dashboard] Error rendering order:', order, e);
            }
        });

        html += '</tbody></table>';
        $tabOrders.html(html);
    },

    loadAddresses: async function () {
        try {
            console.log('[Dashboard] Loading addresses...');
            const url = API_CONFIG.getApiUrl(this.endpoints.addresses);
            console.log('[Dashboard] Addresses URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            console.log('[Dashboard] Addresses response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('[Dashboard] Addresses data received:', data);
                this.renderAddresses(data.data || data);
            } else {
                console.warn('[Dashboard] Failed to load addresses. Status:', response.status);
            }
        } catch (error) {
            console.error('[Dashboard] Error loading addresses:', error);
        }
    },

    renderAddresses: function (addresses) {
        if (!addresses) {
            console.log('[Dashboard] No addresses to render');
            return;
        }

        console.log('[Dashboard] Rendering addresses:', addresses);
        
        // Render billing address if available
        if (addresses.billing) {
            const billing = addresses.billing;
            const billingHTML = `
                <p>
                    <strong>${billing.firstName} ${billing.lastName}</strong><br>
                    ${billing.address}<br>
                    ${billing.city}, ${billing.state} ${billing.zip}<br>
                    ${billing.country}
                </p>
            `;
            $('#billing-address-content').html(billingHTML);
        }

        // Render shipping address if available
        if (addresses.shipping) {
            const shipping = addresses.shipping;
            const shippingHTML = `
                <p>
                    <strong>${shipping.firstName} ${shipping.lastName}</strong><br>
                    ${shipping.address}<br>
                    ${shipping.city}, ${shipping.state} ${shipping.zip}<br>
                    ${shipping.country}
                </p>
            `;
            $('#shipping-address-content').html(shippingHTML);
        }
    },

    bindEvents: function () {
        console.log('[Dashboard] Binding events...');
        
        // Sign out
        $('.nav-dashboard a[href="#"]').each((index, element) => {
            if ($(element).text().includes('Sign Out')) {
                $(element).on('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
        });

        // Profile Form Submit
        $('#account-details-form').on('submit', (e) => {
            e.preventDefault();
            const formData = {
                firstName: $('#acc-firstname').val(),
                lastName: $('#acc-lastname').val(),
                displayName: $('#acc-display-name').val(),
                email: $('#acc-email').val()
            };
            this.updateProfile(formData);
        });

        console.log('[Dashboard] Events bound successfully');
    },

    logout: function () {
        console.log('[Dashboard] Logging out...');
        if (typeof NavigationManager !== 'undefined' && NavigationManager.handleLogout) {
            NavigationManager.handleLogout();
        } else {
            clearAuth();
            window.location.href = 'index.html';
        }
    }
};

$(document).ready(function () {
    console.log('[Dashboard] Document ready, checking for dashboard element...');
    // Only init if we are on the dashboard page
    if ($('.dashboard').length > 0) {
        console.log('[Dashboard] Dashboard found, initializing...');
        DashboardManager.init();
    } else {
        console.log('[Dashboard] Dashboard element not found on this page');
    }
});
