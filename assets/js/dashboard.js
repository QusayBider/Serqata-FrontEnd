
const DashboardManager = {
    // API Endpoints (don't include 'api/' prefix - API_CONFIG adds it automatically)
    endpoints: {
        profile: 'Identity/Account/Profile', 
        orders: 'Customer/Orders/GetMyOrders',
        orderById: 'Customer/Orders/GetMyOrderById',
        addresses: 'Customer/Addresses'
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
            Authorization: token ? `Bearer ${token.substring(0, 20)}` : 'NO TOKEN',
            'Content-Type': 'application/json'
        });
        return headers;
    },

    // --- Profile Section ---
    loadUserProfile: async function () {
        try {
            // Check authentication first
            if (!this.isAuthenticated()) {
                console.warn('[Dashboard] User not authenticated for profile');
                this.renderProfileFromAuth();
                return;
            }

            const token = this.getToken();
            if (!token) {
                console.error('[Dashboard] No authentication token available for profile');
                this.renderProfileFromAuth();
                return;
            }

            console.log('[Dashboard] Fetching user profile...');
            const url = API_CONFIG.getApiUrl(this.endpoints.profile);
            console.log('[Dashboard] Profile URL:', url);
            const headers = this.getHeaders();
            console.log('[Dashboard] Profile Headers:', headers);

            // Attempt to fetch profile
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                mode: 'cors'
            });

            console.log('[Dashboard] Profile response status:', response.status);

            // Get raw response text first for debugging
            const responseText = await response.text();
            console.log('[Dashboard] Profile raw response:', responseText);

            if (response.ok) {
                try {
                    // Handle empty response
                    if (!responseText || responseText.trim() === '') {
                        console.log('[Dashboard] Empty profile response received');
                        this.renderProfileFromAuth();
                        return;
                    }

                    const result = JSON.parse(responseText);
                    console.log('[Dashboard] Parsed profile result:', result);
                    
                    // Check if result indicates an error (even with 200 status)
                    if (result.success === false || (result.error && !result.data)) {
                        const errorMsg = result.message || result.error || 'Failed to load profile.';
                        console.error('[Dashboard] API returned error:', errorMsg);
                        this.renderProfileFromAuth();
                        return;
                    }
                    
                    // Handle different possible response formats
                    let userData = null;
                    
                    // Check if result has a success property and data
                    if (result.success !== undefined && result.data !== undefined) {
                        userData = result.data;
                    } 
                    // Check if result has data property
                    else if (result.data !== undefined) {
                        userData = result.data;
                    }
                    // Check if result is directly the user object
                    else if (result && typeof result === 'object' && !Array.isArray(result)) {
                        userData = result;
                    }
                    
                    console.log('[Dashboard] Extracted user data:', userData);

                    if (userData) {
                        this.renderProfile(userData);
                    } else {
                        console.warn('[Dashboard] Could not extract user data from response structure:', result);
                        this.renderProfileFromAuth();
                    }
                } catch (parseError) {
                    console.error('[Dashboard] Error parsing profile response JSON:', parseError);
                    console.error('[Dashboard] Response text was:', responseText);
                    this.renderProfileFromAuth();
                }
            } else {
                // Handle specific HTTP error codes
                let errorMessage = 'Failed to load profile.';
                
                if (response.status === 401) {
                    errorMessage = 'Authentication failed. Please login again.';
                } else if (response.status === 403) {
                    errorMessage = 'You do not have permission to view profile.';
                } else if (response.status === 404) {
                    errorMessage = 'Profile endpoint not found.';
                } else if (response.status >= 500) {
                    errorMessage = 'Server error. Please try again later.';
                }

                console.warn('[Dashboard] Failed to load profile. Status:', response.status);
                console.warn('[Dashboard] Error response:', responseText);
                
                // Try to parse error response for more details
                try {
                    const errorData = JSON.parse(responseText);
                    if (errorData.message) {
                        console.warn('[Dashboard] Error message:', errorData.message);
                    }
                } catch (e) {
                    // Ignore parse errors for error response
                }
                
                // Fallback: try to load from cookies/user info from auth
                this.renderProfileFromAuth();
            }
        } catch (error) {
            console.error('[Dashboard] Exception loading profile:', error);
            console.error('[Dashboard] Error message:', error.message);
            console.error('[Dashboard] Error type:', error.name);
            console.error('[Dashboard] Error stack:', error.stack);
            this.renderProfileFromAuth();
        }
    },

    renderProfileFromAuth: function () {
        // Fallback to get user info from cookies set during login
        const userName = getUserName() || 'User';
        const userEmail = getUserEmail() || '';
        
        // Try to split userName into first and last name if it contains a space
        let firstName = userName;
        let lastName = '';
        if (userName && userName.includes(' ')) {
            const nameParts = userName.split(' ');
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
        }
        
        // Update Dashboard Greeting
        $('#dashboard-hello-user').text(userName);
        $('#dashboard-not-user').text(userName);
        
        // Update Account Details Form
        $('#acc-firstname').val(firstName);
        $('#acc-lastname').val(lastName);
        $('#acc-display-name').val(userName);
        $('#acc-email').val(userEmail);
        
        console.log('[Dashboard] Profile rendered from auth cookies:', {
            userName,
            firstName,
            lastName,
            email: userEmail
        });
    },

    renderProfile: function (user) {
        if (!user) {
            console.warn('[Dashboard] No user data to render');
            this.renderProfileFromAuth();
            return;
        }

        console.log('[Dashboard] Rendering profile:', user);

        // Update Dashboard Greeting - handle multiple property name variations
        // Priority: fullName > userName > firstName > name
        const fullName = user.fullName || 
                        user.fullname || 
                        user.full_name || '';
        
        const userName = user.userName || 
                        user.username ||
                        user.user_name || '';
        
        const firstName = user.firstName || 
                          user.firstname || 
                          user.first_name || '';
        
        // Determine display name and split into first/last if needed
        let displayName = fullName || userName || firstName || user.name || 'User';
        let lastName = user.lastName || user.lastname || user.last_name || '';
        
        // If we have fullName but no separate lastName, try to split it
        if (fullName && !lastName && fullName.includes(' ')) {
            const nameParts = fullName.trim().split(/\s+/);
            displayName = nameParts[0]; // First name
            lastName = nameParts.slice(1).join(' '); // Rest as last name
        } else if (fullName) {
            displayName = fullName;
        } else if (userName && !firstName) {
            displayName = userName;
        }
        
        const email = user.email || 
                     user.emailAddress || 
                     user.email_address ||
                     '';

        // Update Dashboard Greeting
        $('#dashboard-hello-user').text(displayName);
        $('#dashboard-not-user').text(displayName);

        // Update Account Details Form
        $('#acc-firstname').val(displayName);
        $('#acc-lastname').val(lastName);
        $('#acc-display-name').val(displayName);
        $('#acc-email').val(email);
        
        console.log('[Dashboard] Profile rendered successfully:', {
            displayName,
            lastName,
            email
        });
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
            // Check authentication first
            if (!this.isAuthenticated()) {
                console.warn('[Dashboard] User not authenticated, redirecting to login');
                $tabOrders.html('<p>Please <a href="login.html">login</a> to view your orders.</p>');
                return;
            }

            const token = this.getToken();
            if (!token) {
                console.error('[Dashboard] No authentication token available');
                $tabOrders.html('<p>Authentication required. Please <a href="login.html">login</a> again.</p>');
                return;
            }

            console.log('[Dashboard] Fetching orders...');
            const url = API_CONFIG.getApiUrl(this.endpoints.orders);
            console.log('[Dashboard] Orders URL:', url);
            const headers = this.getHeaders();
            console.log('[Dashboard] Headers:', headers);

            $tabOrders.html('<p>Loading orders...</p>');

            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
                mode: 'cors'
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
                    // Handle empty response
                    if (!responseText || responseText.trim() === '') {
                        console.log('[Dashboard] Empty response received');
                        $tabOrders.html(`
                            <p>No order has been made yet.</p>
                            <a href="category.html" class="btn btn-outline-primary-2"><span>GO SHOP</span><i class="icon-long-arrow-right"></i></a>
                        `);
                        return;
                    }

                    const result = JSON.parse(responseText);
                    console.log('[Dashboard] Parsed orders result:', result);
                    
                    // Check if result indicates an error (even with 200 status)
                    if (result.success === false || (result.error && !result.data)) {
                        const errorMsg = result.message || result.error || 'Failed to load orders.';
                        console.error('[Dashboard] API returned error:', errorMsg);
                        $tabOrders.html(`<p>${errorMsg}</p>`);
                        return;
                    }
                    
                    // Handle different possible response formats
                    let orders = null;
                    
                    // Check if result has a success property and data
                    if (result.success !== undefined && result.data !== undefined) {
                        orders = result.data;
                    } 
                    // Check if result has data property
                    else if (result.data !== undefined) {
                        orders = result.data;
                    }
                    // Check if result has orders property
                    else if (result.orders !== undefined) {
                        orders = result.orders;
                    }
                    // Check if result is directly an array
                    else if (Array.isArray(result)) {
                        orders = result;
                    }
                    
                    console.log('[Dashboard] Extracted orders:', orders);
                    console.log('[Dashboard] Orders is array?', Array.isArray(orders));

                    if (Array.isArray(orders) && orders.length > 0) {
                        this.renderOrders(orders);
                    } else if (orders === null) {
                        // Could not extract orders from response
                        console.error('[Dashboard] Could not extract orders from response structure:', result);
                        $tabOrders.html(`<p>Unexpected response format. Please check the console for details.</p>`);
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
                    $tabOrders.html(`<p>Error parsing server response. Please check the console for details.</p>`);
                }
            } else {
                // Handle specific HTTP error codes
                let errorMessage = 'Failed to load orders.';
                
                if (response.status === 401) {
                    errorMessage = 'Authentication failed. Please <a href="login.html">login</a> again.';
                } else if (response.status === 403) {
                    errorMessage = 'You do not have permission to view orders.';
                } else if (response.status === 404) {
                    errorMessage = 'Orders endpoint not found. Please contact support.';
                } else if (response.status >= 500) {
                    errorMessage = 'Server error. Please try again later.';
                } else {
                    errorMessage = `Failed to load orders (Status: ${response.status}).`;
                }

                console.warn('[Dashboard] Failed to load orders. Status:', response.status);
                console.warn('[Dashboard] Error response:', responseText);
                
                // Try to parse error response for more details
                try {
                    const errorData = JSON.parse(responseText);
                    if (errorData.message) {
                        errorMessage += ` ${errorData.message}`;
                    }
                } catch (e) {
                    // Ignore parse errors for error response
                }
                
                $tabOrders.html(`<p>${errorMessage}</p>`);
            }
        } catch (error) {
            console.error('[Dashboard] Exception loading orders:', error);
            console.error('[Dashboard] Error message:', error.message);
            console.error('[Dashboard] Error type:', error.name);
            console.error('[Dashboard] Error stack:', error.stack);
            
            // Provide more specific error messages
            let errorMessage = 'Error loading orders. ';
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage += 'Network error. Please check your internet connection.';
            } else if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += 'Please try again later.';
            }
            
            $tabOrders.html(`<p>${errorMessage}</p>`);
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
                // Handle date formatting with better error handling
                let dateStr = 'N/A';
                try {
                    if (order.orderDate) {
                        const date = new Date(order.orderDate);
                        if (!isNaN(date.getTime())) {
                            dateStr = date.toLocaleDateString();
                        }
                    }
                } catch (dateError) {
                    console.warn('[Dashboard] Error parsing date for order:', order.id, dateError);
                }

                const total = order.totalAmount || order.total || 0;
                const statusLabel = this.getStatusLabel(order.status);
                const orderId = order.id || order.orderId || 'N/A';
                const trackingCode = order.trackingCode || order.trackingNumber || `ORD-${orderId}`;

                html += `
                    <tr>
                        <td class="product-col">#${orderId} <br><small>${trackingCode}</small></td>
                        <td class="price-col">${dateStr}</td>
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

    // --- Order Details Section ---
    loadOrderDetails: async function (orderId) {
        try {
            if (!orderId) {
                console.error('[Dashboard] No order ID provided');
                $('#order-details-modal .modal-body').html('<p>Invalid order ID.</p>');
                return null;
            }

            const token = this.getToken();
            if (!token) {
                console.error('[Dashboard] No authentication token available!');
                $('#order-details-modal .modal-body').html('<p>Authentication required. Please <a href="login.html">login</a> again.</p>');
                return null;
            }

            console.log('[Dashboard] Fetching order details for order ID:', orderId);
            const url = API_CONFIG.getApiUrl(`${this.endpoints.orderById}${orderId}`);
            console.log('[Dashboard] Order details URL:', url);
            const headers = this.getHeaders();
            console.log('[Dashboard] Order details Headers:', headers);
            const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ orderId })
        });


            console.log('[Dashboard] Order details response status:', response.status);

            // Get raw response text first for debugging
            const responseText = await response.text();
            console.log('[Dashboard] Order details raw response:', responseText);

            if (response.ok) {
                try {
                    // Handle empty response
                    if (!responseText || responseText.trim() === '') {
                        console.log('[Dashboard] Empty order details response received');
                        $('#order-details-modal .modal-body').html('<p>No order details found for this order.</p>');
                        return null;
                    }

                    const result = JSON.parse(responseText);
                    console.log('[Dashboard] Parsed order details result:', result);
                    
                    // Check if result indicates an error (even with 200 status)
                    if (result.success === false || (result.error && !result.data)) {
                        const errorMsg = result.message || result.error || 'Failed to load order details.';
                        console.error('[Dashboard] API returned error:', errorMsg);
                        $('#order-details-modal .modal-body').html(`<p>${errorMsg}</p>`);
                        return null;
                    }
                    
                    // Handle different possible response formats
                    let orderData = null;
                    
                    // Check if result has a success property and data
                    if (result.success !== undefined && result.data !== undefined) {
                        orderData = result.data;
                    } 
                    // Check if result has data property
                    else if (result.data !== undefined) {
                        orderData = result.data;
                    }
                    // Check if result is directly the order object
                    else if (result && typeof result === 'object' && !Array.isArray(result)) {
                        orderData = result;
                    }
                    
                    console.log('[Dashboard] Extracted order data:', orderData);
                    return orderData;
                } catch (parseError) {
                    console.error('[Dashboard] Error parsing order details response JSON:', parseError);
                    console.error('[Dashboard] Response text was:', responseText);
                    $('#order-details-modal .modal-body').html('<p>Error parsing order details. Please try again later.</p>');
                    return null;
                }
            } else {
                let errorMessage = 'Failed to load order details.';
                if (response.status === 401) {
                    errorMessage = 'Authentication failed. Please <a href="login.html">login</a> again.';
                } else if (response.status === 403) {
                    errorMessage = 'You do not have permission to view this order.';
                } else if (response.status === 404) {
                    errorMessage = 'Order not found. It may have been deleted or does not exist.';
                } else if (response.status >= 500) {
                    errorMessage = 'Server error. Please try again later.';
                }
                // Try to parse error response for more details
                try {
                    const errorData = JSON.parse(responseText);
                    if (errorData.message) {
                        errorMessage += ` ${errorData.message}`;
                    }
                } catch (e) {
                    // Ignore parse errors for error response
                }
                $('#order-details-modal .modal-body').html(`<p>${errorMessage}</p>`);
                console.warn('[Dashboard] Failed to load order details. Status:', response.status);
                console.warn('[Dashboard] Error response:', responseText);
                return null;
            }
        } catch (error) {
            console.error('[Dashboard] Exception loading order details:', error);
            console.error('[Dashboard] Error message:', error.message);
            $('#order-details-modal .modal-body').html('<p>Error loading order details. Please try again later.</p>');
            return null;
        }
    },

    renderOrderDetails: function (order) {
    if (!order) {
        console.warn('[Dashboard] No order data to render');
        return;
    }

    console.log('[Dashboard] Rendering order details:', order);

    // ---------- Helpers ----------
    const safe = (v, fallback = 'N/A') => (v !== undefined && v !== null && String(v).trim() !== '' ? v : fallback);

    const money = (v) => {
        const n = Number(v);
        return `ILS ${(!isNaN(n) ? n : 0).toFixed(2)}`;
    };

    const formatDate = (dateValue) => {
        if (!dateValue) return 'N/A';
        try {
            const d = new Date(dateValue);
            if (isNaN(d.getTime())) return 'N/A';
            return d.toLocaleDateString() + ' • ' + d.toLocaleTimeString();
        } catch {
            return 'N/A';
        }
    };

    const statusText = this.getStatusLabel(order.status);
    const statusLower = String(statusText || '').toLowerCase();

    // Badge styling by status text (safe fallback)
    let badgeClass = 'badge badge-secondary';
    if (statusLower.includes('complete') || statusLower.includes('deliver') || statusLower.includes('paid')) badgeClass = 'badge badge-success';
    else if (statusLower.includes('pending') || statusLower.includes('process')) badgeClass = 'badge badge-warning';
    else if (statusLower.includes('cancel') || statusLower.includes('fail') || statusLower.includes('reject')) badgeClass = 'badge badge-danger';
    else if (statusLower.includes('ship') || statusLower.includes('out for')) badgeClass = 'badge badge-info';

    // ---------- Order core info ----------
    const orderId = safe(order.id || order.orderId);
    const trackingCode = safe(order.trackingCode || order.trackingNumber || (orderId !== 'N/A' ? `ORD-${orderId}` : 'N/A'));
    const orderDate = formatDate(order.orderDate);

    const total = order.totalAmount || order.total || 0;
    const subtotal = order.subtotal || order.subTotal || total;
    const shipping = order.shippingCost || order.shipping || 0;
    const tax = order.tax || order.taxAmount || 0;

    // ---------- Shipping address ----------
    const addr = order.shippingAddress || order.address || null;
    const fullName = safe(addr?.fullName || addr?.name, '');
    const street = safe(addr?.street || addr?.address, '');
    const city = safe(addr?.city, '');
    const state = safe(addr?.state, '');
    const zip = safe(addr?.zipCode || addr?.zip, '');
    const country = safe(addr?.country, '');

    const hasAddress = !!(addr && (fullName || street || city || state || zip || country));

    // ---------- Items ----------
    let orderItemsHtml = '';
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        order.items.forEach(item => {
            const itemName = safe(item.productName || item.name || item.product?.name, 'Unknown Product');
            const itemQuantity = Number(item.quantity || 1);
            const itemPrice = Number(item.price || item.unitPrice || 0);
            const itemTotal = Number(item.totalPrice || (itemPrice * itemQuantity));
            const itemImage = item.image || item.productImage || item.product?.image || '';

            const imgHtml = itemImage
                ? `<img src="${itemImage}" alt="${itemName}"
                        class="rounded"
                        style="width:58px;height:58px;object-fit:cover;"
                        onerror="this.style.display='none'; this.onerror=null;">`
                : `<div class="rounded d-flex align-items-center justify-content-center"
                        style="width:58px;height:58px;background:#f1f1f1;color:#888;font-size:12px;">
                        N/A
                   </div>`;

            orderItemsHtml += `
                <tr>
                    <td class="product-col">
                        <div class="d-flex align-items-center" style="gap:12px;">
                            ${imgHtml}
                            <div class="d-flex flex-column">
                                <span class="font-weight-600" style="font-weight:600;">${itemName}</span>
                                <small class="text-muted">Unit: ${money(itemPrice)}</small>
                            </div>
                        </div>
                    </td>
                    <td class="quantity-col text-center">
                        <span class="badge badge-light" style="padding:.45rem .6rem;">${isNaN(itemQuantity) ? 1 : itemQuantity}</span>
                    </td>
                    <td class="price-col text-right">${money(itemPrice)}</td>
                    <td class="total-col text-right font-weight-600" style="font-weight:600;">${money(itemTotal)}</td>
                </tr>
            `;
        });
    } else {
        orderItemsHtml = `
            <tr>
                <td colspan="4" class="text-center text-muted" style="padding:18px;">
                    No items found
                </td>
            </tr>
        `;
    }

    // ---------- Beautiful UI HTML ----------
    const orderDetailsHtml = `
        <div class="order-details-modal-content">

            <div class="d-flex align-items-start justify-content-between flex-wrap" style="gap:12px;">
                <div>
                    <div class="d-flex align-items-center" style="gap:10px;">
                        <h4 class="mb-0" style="font-weight:700;">Order #${orderId}</h4>
                        <span class="${badgeClass}" style="padding:.45rem .7rem;border-radius:999px;">${safe(statusText, 'N/A')}</span>
                    </div>
                    <div class="text-muted mt-1" style="font-size:14px;">
                        <span>Placed: ${orderDate}</span>
                        <span class="mx-2">•</span>
                        <span>Tracking: <strong>${trackingCode}</strong></span>
                    </div>
                </div>

                <div class="text-right">
                    <div class="text-muted" style="font-size:13px;">Total</div>
                    <div style="font-size:22px;font-weight:800;">${money(total)}</div>
                </div>
            </div>

            <hr class="my-3">

            <div class="row">
                <div class="col-lg-6 mb-3">
                    <div class="card" style="border-radius:14px;">
                        <div class="card-body" style="padding:16px;">
                            <h6 class="mb-3" style="font-weight:700;">Order Information</h6>
                            <div class="d-flex justify-content-between py-1">
                                <span class="text-muted">Order ID</span>
                                <span style="font-weight:600;">#${orderId}</span>
                            </div>
                            <div class="d-flex justify-content-between py-1">
                                <span class="text-muted">Tracking Code</span>
                                <span style="font-weight:600;">${trackingCode}</span>
                            </div>
                            <div class="d-flex justify-content-between py-1">
                                <span class="text-muted">Order Date</span>
                                <span style="font-weight:600;">${orderDate}</span>
                            </div>
                            <div class="d-flex justify-content-between py-1">
                                <span class="text-muted">Status</span>
                                <span class="${badgeClass}" style="padding:.35rem .6rem;border-radius:999px;">${safe(statusText, 'N/A')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-lg-6 mb-3">
                    <div class="card" style="border-radius:14px;">
                        <div class="card-body" style="padding:16px;">
                            <h6 class="mb-3" style="font-weight:700;">Shipping Address</h6>
                            ${
                                hasAddress
                                ? `
                                    <div style="line-height:1.7;">
                                        ${fullName ? `<div style="font-weight:700;">${fullName}</div>` : ''}
                                        ${street ? `<div>${street}</div>` : ''}
                                        ${(city || state || zip) ? `<div>${city}${city && state ? ', ' : ''}${state} ${zip}</div>` : ''}
                                        ${country ? `<div>${country}</div>` : ''}
                                    </div>
                                  `
                                : `<div class="text-muted">No shipping address available</div>`
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mt-2" style="border-radius:14px;">
                <div class="card-body" style="padding:16px;">
                    <div class="d-flex align-items-center justify-content-between flex-wrap" style="gap:10px;">
                        <h6 class="mb-0" style="font-weight:700;">Order Items</h6>
                        <span class="text-muted" style="font-size:13px;">
                            ${Array.isArray(order.items) ? order.items.length : 0} item(s)
                        </span>
                    </div>

                    <div class="table-responsive mt-3">
                        <table class="table table-cart mb-0" style="min-width:720px;">
                            <thead>
                                <tr>
                                    <th style="width:55%;">Product</th>
                                    <th class="text-center" style="width:12%;">Qty</th>
                                    <th class="text-right" style="width:16%;">Unit Price</th>
                                    <th class="text-right" style="width:17%;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orderItemsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="row mt-3">
                <div class="col-lg-6"></div>
                <div class="col-lg-6">
                    <div class="card" style="border-radius:14px;">
                        <div class="card-body" style="padding:16px;">
                            <h6 class="mb-3" style="font-weight:700;">Summary</h6>

                            <div class="d-flex justify-content-between py-1">
                                <span class="text-muted">Subtotal</span>
                                <span style="font-weight:600;">${money(subtotal)}</span>
                            </div>

                            ${Number(shipping) > 0 ? `
                                <div class="d-flex justify-content-between py-1">
                                    <span class="text-muted">Shipping</span>
                                    <span style="font-weight:600;">${money(shipping)}</span>
                                </div>
                            ` : ''}

                            ${Number(tax) > 0 ? `
                                <div class="d-flex justify-content-between py-1">
                                    <span class="text-muted">Tax</span>
                                    <span style="font-weight:600;">${money(tax)}</span>
                                </div>
                            ` : ''}

                            <hr class="my-2">

                            <div class="d-flex justify-content-between align-items-center">
                                <span style="font-weight:800;font-size:16px;">Total</span>
                                <span style="font-weight:900;font-size:18px;">${money(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    `;

    // Update modal content
    $('#order-details-modal .modal-body').html(orderDetailsHtml);
    $('#order-details-modal').modal('show');
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

        // Order View Button (using event delegation for dynamically loaded content)
        $(document).on('click', '.btn-order-view', async (e) => {
            e.preventDefault();
            const orderId = $(e.currentTarget).data('id');
            console.log('[Dashboard] View order clicked:', orderId);
            
            if (!orderId || orderId === 'N/A') {
                alert('Invalid order ID');
                return;
            }

            // Show loading state
            $('#order-details-modal .modal-body').html('<p>Loading order details...</p>');
            $('#order-details-modal').modal('show');

            // Load order details
            const order = await this.loadOrderDetails(orderId);
            
            if (order) {
                this.renderOrderDetails(order);
            } else {
                $('#order-details-modal .modal-body').html('<p>Failed to load order details. Please try again later.</p>');
            }
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
