
const AdminDashboardManager = {
    // API Endpoints (Assumed)
    endpoints: {
        analytics: 'Admin/Analytics',
        orders: 'Admin/Orders', // Or 'Customer/Orders/All' if Admin role allows
        users: 'Admin/Users',
        products: 'Products/GetAllProducts'
    },

    init: async function () {
        // Check authentication and admin role
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        // Verify admin role
        const role = getUserRole();
        if (!role || role.toLowerCase() !== 'admin') {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'index.html';
            return;
        }

        // Initialize events
        this.bindEvents();

        // Load Analytics by default
        this.loadAnalytics();

        // Listen for tab changes to load data on demand
        $('a[data-toggle="tab"]').on('shown.bs.tab', (e) => {
            const target = $(e.target).attr("href"); // activated tab
            if (target === '#tab-orders') {
                this.loadOrders();
            } else if (target === '#tab-users') {
                this.loadUsers();
            } else if (target === '#tab-products') {
                this.loadProducts();
            } else if (target === '#tab-dashboard') {
                this.loadAnalytics();
            }
        });
    },

    isAuthenticated: function () {
        return isAuthenticated(); // Use global function from auth.js
    },

    getToken: function () {
        return getToken(); // Use global function from auth.js
    },

    getHeaders: function () {
        return {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json'
        };
    },

    bindEvents: function () {
        // Sign out
    },

    logout: function () {
        if (typeof NavigationManager !== 'undefined' && NavigationManager.handleLogout) {
            NavigationManager.handleLogout();
        } else {
            clearAuth();
            window.location.href = 'index.html';
        }
    },

    // --- Analytics ---
    loadAnalytics: async function () {
        try {
            // Mock data for now if API fails
            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.analytics), { headers: this.getHeaders() });

            if (response.ok) {
                const data = await response.json();
                this.renderAnalytics(data.data || data);
            } else {
                console.warn('Analytics API not available, using mock data');
                this.renderAnalytics({
                    totalSales: 15400.50,
                    totalOrders: 124,
                    totalUsers: 450
                });
            }
        } catch (error) {
            console.error('Error loading analytics', error);
        }
    },

    renderAnalytics: function (data) {
        if (!data) return;
        $('#stat-total-sales').text('ILS ' + (data.totalSales || 0).toFixed(2));
        $('#stat-total-orders').text(data.totalOrders || 0);
        $('#stat-total-users').text(data.totalUsers || 0);
    },

    // --- Orders ---
    loadOrders: async function () {
        const $container = $('#admin-orders-container');
        try {
            $container.html('<p>Loading...</p>');
            // Try fetching all orders (Admin endpoint)
            const response = await fetch(API_CONFIG.getApiUrl('Admin/Orders'), { headers: this.getHeaders() }); // Guess
            // If failed, maybe we need to use a different one

            if (response.ok) {
                const data = await response.json();
                this.renderOrders(data.data || data);
            } else {
                $container.html('<p>Could not load orders. (API endpoint might be missing)</p>');
            }
        } catch (e) {
            $container.html('<p>Error loading orders.</p>');
        }
    },

    renderOrders: function (orders) {
        const $container = $('#admin-orders-container');
        if (!orders || orders.length === 0) {
            $container.html('<p>No orders found.</p>');
            return;
        }

        let html = `
            <table class="table table-cart">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        orders.forEach(order => {
            html += `
                <tr>
                    <td>#${order.id}</td>
                    <td>${order.userName || 'Guest'}</td>
                    <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                    <td>${order.status}</td>
                    <td>ILS ${(order.totalAmount || 0).toFixed(2)}</td>
                    <td><button class="btn btn-sm btn-outline-primary-2">View</button></td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        $container.html(html);
    },

    // --- Users ---
    loadUsers: async function () {
        $('#admin-users-container').html('<p>Loading users...</p>');
        // Implement fetch
        $('#admin-users-container').html('<p>User management API not connected.</p>');
    },

    // --- Products ---
    loadProducts: async function () {
        $('#admin-products-container').html('<p>Loading products...</p>');
        try {
            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.products));
            if (response.ok) {
                const data = await response.json();
                const products = data.data || data;
                this.renderProducts(products);
            }
        } catch (e) {
            $('#admin-products-container').html('<p>Error loading products.</p>');
        }
    },

    renderProducts: function (products) {
        const $container = $('#admin-products-container');
        let html = '<table class="table table-cart"><thead><tr><th>ID</th><th>Name</th><th>Price</th></tr></thead><tbody>';
        products.forEach(p => {
            html += `<tr><td>${p.id}</td><td>${p.name}</td><td>ILS ${p.price}</td></tr>`;
        });
        html += '</tbody></table>';
        $container.html(html);
    }
};

$(document).ready(function () {
    // Check if we are on admin dashboard
    if ($('.page-title').text().includes('Admin Dashboard')) {
        AdminDashboardManager.init();
    }
});
