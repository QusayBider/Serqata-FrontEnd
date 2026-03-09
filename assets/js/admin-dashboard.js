const AdminDashboardManager = {
    // API Endpoints
    endpoints: {
        analytics: 'Admin/Analytics',
        orders: 'Admin/Orders',
        users: 'Admin/Users',
        products: 'Products/GetAllProducts',
        advertisements: 'Admin/Advertisements',
        addAdvertisement: 'Admin/Advertisements/AddAdvertisement',
        updateAdvertisement: 'Admin/Advertisements/UpdateAdvertisement',
        toggleAdvertisement: 'Admin/Advertisements/ToggleStatus',
        getAdvertisementById: 'Admin/Advertisements/GetAdvertisementById',
        deleteAdvertisement: 'Admin/Advertisements',
        brands: 'Admin/Brands/GetAllBrands',
        addBrand: 'Admin/Brands/AddBrand',
        updateBrand: 'Admin/Brands/UpdateBrand',
        toggleBrand: 'Admin/Brands/ToggleStatus',
        getBrandById: 'Admin/Brands/GetBrandById',
        deleteBrand: 'Admin/Brands',
        categories: 'Admin/Categories',
        addCategory: 'Admin/Categories/AddCategory',
        updateCategory: 'Admin/Categories/UpdateCategory',
        toggleCategory: 'Admin/Categories/ToggleStatus',
        getCategoryById: 'Admin/Categories/GetCategoryById',
        deleteCategory: 'Admin/Categories',
        company: 'Admin/Company',
        addCompany: 'Admin/Company/AddCompany',
        updateCompany: 'Admin/Company/UpdateCompany',
        toggleCompany: 'Admin/Company/ToggleStatus',
        getCompanyById: 'Admin/Company/GetCompanyById',
    },

    init: async function () {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        const role = getUserRole();
        if (!role || role.toLowerCase() !== 'admin') {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'index.html';
            return;
        }

        this.bindEvents();
        this.loadAnalytics();
    },

    isAuthenticated: function () {
        return isAuthenticated();
    },

    getToken: function () {
        return getToken();
    },

    getHeaders: function () {
        return {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/json'
        };
    },

    getFormHeaders: function () {
        return {
            'Authorization': `Bearer ${this.getToken()}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        };
    },

    bindEvents: function () {
        // Bind tab switching events - handle both Bootstrap and manual tab switching
        const self = this;
        
        // Handle clicks on tab links
        $(document).off('click.admintabs').on('click.admintabs', 'a[data-toggle="tab"]', function (e) {
            e.preventDefault(); // Prevent default link behavior
            
            const tabTarget = $(this).attr("href");
            if (!tabTarget) return;
            
            // Manually switch tab content visibility
            // Hide all tab panes
            $('.tab-pane').removeClass('show active');
            
            // Show the target tab pane
            $(tabTarget).addClass('show active');
            
            // Update nav link active state
            $('a[data-toggle="tab"]').removeClass('active');
            $(this).addClass('active');
            
            // Load data for the tab
            self.loadTabContent(tabTarget);
        });
    },

    loadTabContent: function (tabTarget) {
        if (tabTarget === '#tab-orders') {
            this.loadOrders();
        } else if (tabTarget === '#tab-users') {
            this.loadUsers();
        } else if (tabTarget === '#tab-products') {
            this.loadProducts();
        } else if (tabTarget === '#tab-dashboard') {
            this.loadAnalytics();
        } else if (tabTarget === '#tab-advertisements') {
            this.loadAdvertisements();
        } else if (tabTarget === '#tab-brands') {
            this.loadBrands();
        } else if (tabTarget === '#tab-categories') {
            this.loadCategories();
        } else if (tabTarget === '#tab-company') {
            this.loadCompany();
        }
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
            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.analytics), { headers: this.getHeaders() });

            if (response.ok) {
                const data = await response.json();
                this.renderAnalytics(data.data || data);
            } else {
                this.renderAnalytics({
                    totalSales: 15400.50,
                    totalOrders: 124,
                    totalUsers: 450
                });
            }
        } catch (error) {
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
            const response = await fetch(API_CONFIG.getApiUrl('Admin/Orders'), { headers: this.getHeaders() });

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
                        <th>ID</th><th>User</th><th>Date</th><th>Status</th><th>Total</th><th>Actions</th>
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
        $('#admin-users-container').html('<p>User management API not connected.</p>');
    },

    // --- Products ---
    loadProducts: async function () {
        $('#admin-products-container').html('<p>Loading products...</p>');
        try {
            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.products));
            if (response.ok) {
                const data = await response.json();
                this.renderProducts(data.data || data);
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
    },

    // =====================
    // --- Advertisements ---
    // =====================

    /* Styles live in assets/css/admin-advertisements.css */

    loadAdvertisements: async function () {
        const $container = $('#admin-advertisements-container');

        // Skeleton loading state
        const skeletonHtml = Array(4).fill(0).map(() => `
            <div class="ad-skeleton">
                <div class="ad-skel-img"></div>
                <div class="ad-skel-body">
                    <div class="ad-skel-line w80"></div>
                    <div class="ad-skel-line w50"></div>
                    <div class="ad-skel-line w65"></div>
                </div>
            </div>
        `).join('');

        $container.html(`
            <div class="ads-panel">
                <div class="ads-header">
                    <div>
                        <h2 class="ads-header-title">Advertise<span>ments</span></h2>
                        <div class="ads-header-meta">Loading campaigns…</div>
                    </div>
                </div>
                <div class="ads-grid">${skeletonHtml}</div>
            </div>
        `);

        try {
            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.advertisements), {
                headers: this.getHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                this.renderAdvertisements(data.data || data);
            } else {
                $container.html(`
                    <div class="ads-panel">
                        <div class="ads-header">
                            <h2 class="ads-header-title">Advertise<span>ments</span></h2>
                            <button class="btn-ad-new" onclick="AdminDashboardManager.openAdModal()">
                                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                New Ad
                            </button>
                        </div>
                        <div style="color:#e55;font-size:13px;padding:20px 0;">Could not load advertisements.</div>
                    </div>
                `);
            }
        } catch (e) {
            $container.html(`<div style="color:#e55;padding:20px;font-size:13px;">Error loading advertisements.</div>`);
        }
    },

    renderAdvertisements: function (ads) {
        const $container = $('#admin-advertisements-container');
        const total = ads ? ads.length : 0;
        const active = ads ? ads.filter(a => a.isActive || a.status === 'Active').length : 0;
        const mainPage = ads ? ads.filter(a => a.showInMainPage).length : 0;

        let html = `
            <div class="ads-panel">
                <div class="ads-header">
                    <div>
                        <h2 class="ads-header-title">Advertise<span>ments</span></h2>
                        <div class="ads-header-meta">${total} campaign${total !== 1 ? 's' : ''} total</div>
                    </div>
                    <button class="btn-ad-new" onclick="AdminDashboardManager.openAdModal()">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        New Ad
                    </button>
                </div>

                <div class="ads-stats">
                    <div class="ads-stat-card">
                        <div class="ads-stat-label">Total</div>
                        <div class="ads-stat-value accent">${total}</div>
                    </div>
                    <div class="ads-stat-card">
                        <div class="ads-stat-label">Active</div>
                        <div class="ads-stat-value green">${active}</div>
                    </div>
                    <div class="ads-stat-card">
                        <div class="ads-stat-label">Main Page</div>
                        <div class="ads-stat-value muted">${mainPage}</div>
                    </div>
                </div>

                <div class="ads-toolbar">
                    <div class="ads-search-wrap">
                        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input class="ads-search" id="ads-search-input" type="text" placeholder="Search by name or type…" oninput="AdminDashboardManager.filterAds()">
                    </div>
                    <select class="ads-filter-select" id="ads-filter-status" onchange="AdminDashboardManager.filterAds()">
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div class="ads-grid" id="ads-grid">
        `;

        if (!ads || ads.length === 0) {
            html += `
                <div class="ads-empty">
                    <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="3"/>
                        <path d="M3 9h18M9 21V9"/>
                    </svg>
                    <h4>No Advertisements Yet</h4>
                    <p>Create your first campaign to get started.</p>
                </div>
            `;
        } else {
            ads.forEach(ad => {
                const isActive = ad.isActive || ad.status === 'Active';
                const imageUrl = ad.imageUrl || ad.image || (ad.imagePath ? API_CONFIG.getApiUrl(ad.imagePath) : '');
                const imgBlock = imageUrl
                    ? `<img src="${imageUrl}" alt="${ad.name || ''}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                    : '';
                const placeholderStyle = imageUrl ? 'style="display:none"' : '';

                html += `
                    <div class="ad-card" data-name="${(ad.name || '').toLowerCase()}" data-type="${(ad.type || '').toLowerCase()}" data-active="${isActive}">
                        <div class="ad-card-img">
                            ${imgBlock}
                            <div class="ad-card-img-placeholder" ${placeholderStyle}>
                                <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <path d="M21 15l-5-5L5 21"/>
                                </svg>
                                <span>No Image</span>
                            </div>
                            <div class="ad-status-pill ${isActive ? 'active' : 'inactive'}">
                                ${isActive ? '● Active' : '○ Inactive'}
                            </div>
                            ${ad.showInMainPage ? `<div class="ad-main-pill">★ Main Page</div>` : ''}
                        </div>

                        <div class="ad-card-body">
                            <div class="ad-card-top">
                                <h4 class="ad-card-name">${ad.name || 'Untitled'}</h4>
                                <span class="ad-card-id">#${ad.id}</span>
                            </div>

                            ${ad.description ? `<p class="ad-card-desc">${ad.description}</p>` : ''}

                            <div class="ad-card-meta">
                                ${ad.type ? `
                                    <span class="ad-chip type">
                                        <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 7h10M7 12h10M7 17h6"/></svg>
                                        ${ad.type}
                                    </span>` : ''}
                            </div>

                            ${(ad.startDate || ad.endDate) ? `
                            <div class="ad-dates">
                                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                <span>${ad.startDate ? new Date(ad.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                                <span class="ad-dates-arrow">→</span>
                                <span>${ad.endDate ? new Date(ad.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
                            </div>` : ''}

                            ${(ad.upText || ad.downText) ? `
                            <div class="ad-texts">
                                ${ad.upText ? `<div class="ad-text-item"><label>Up Text</label><span>${ad.upText}</span></div>` : ''}
                                ${ad.downText ? `<div class="ad-text-item"><label>Down Text</label><span>${ad.downText}</span></div>` : ''}
                            </div>` : ''}
                        </div>

                        <div class="ad-card-footer">
                            <button class="btn-ad-edit" onclick="AdminDashboardManager.openAdModal(${ad.id})">
                                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                Edit
                            </button>
                            <button class="btn-ad-edit" style="color: #e55;" onclick="AdminDashboardManager.deleteAdvertisement(${ad.id})" title="Delete advertisement">
                                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h16zM10 11v6M14 11v6"/></svg>
                                Delete
                            </button>
                            <label class="ad-card-toggle status-toggle" title="Toggle Status" onclick="event.preventDefault(); AdminDashboardManager.toggleAdStatus(${ad.id})">
                                <span style="font-size: 11px; margin-right: 8px; font-weight: 600; color: #555;">${isActive ? 'Active' : 'Inactive'}</span>
                                <input type="checkbox" ${isActive ? 'checked' : ''}>
                                <span class="ad-card-toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div></div>`;
        $container.html(html);
    },

    filterAds: function () {
        const query = (document.getElementById('ads-search-input')?.value || '').toLowerCase();
        const status = document.getElementById('ads-filter-status')?.value || 'all';
        document.querySelectorAll('#ads-grid .ad-card').forEach(card => {
            const name = card.dataset.name || '';
            const type = card.dataset.type || '';
            const active = card.dataset.active === 'true';
            const matchQ = !query || name.includes(query) || type.includes(query);
            const matchS = status === 'all' || (status === 'active' && active) || (status === 'inactive' && !active);
            card.style.display = (matchQ && matchS) ? '' : 'none';
        });
    },

    openAdModal: async function (id = null) {
        let ad = null;
        if (id) {
            try {
                const response = await fetch(
                    API_CONFIG.getApiUrl(`${this.endpoints.getAdvertisementById}/${id}`),
                    { headers: this.getHeaders() }
                );
                if (response.ok) {
                    const data = await response.json();
                    ad = data.data || data;
                }
            } catch (e) {
            }
        }

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            return new Date(dateStr).toISOString().slice(0, 10);
        };

        // Existing image URL (from server) — shown when editing
        const existingImage = ad?.imageUrl || ad?.image || '';

        const { value: formValues } = await Swal.fire({
            title: '',
            width: '660px',
            padding: '0',
            background: '#fff',
            html: `
                <div class="ad-swal-form" style="padding:28px 28px 4px">
                    <!-- Modal header -->
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
                        <div>
                            <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#111;letter-spacing:-0.3px">
                                ${id ? 'Edit' : 'New'} <span style="color:#c96">Advertisement</span>
                            </div>
                            <div style="font-size:11px;color:#aaa;margin-top:2px">${id ? `Editing campaign #${id}` : 'Create a new ad campaign'}</div>
                        </div>
                        <div style="width:42px;height:42px;background:#fdf4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <svg width="20" height="20" fill="none" stroke="#c96" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg>
                        </div>
                    </div>

                    <!-- ── Image upload box ── -->
                    <div class="af-section-title" style="margin-top:0">Ad Image</div>
                    <div class="af-img-upload ${existingImage ? 'has-image' : ''}" id="af-img-upload-box">
                        <!-- File input — covers entire box -->
                        <input type="file" id="ad-image-file" accept="image/*">

                        <!-- Preview img (shown after pick or when editing) -->
                        <img class="af-img-preview" id="af-img-preview"
                            src="${existingImage}"
                            style="${existingImage ? 'display:block' : 'display:none'}">

                        <!-- Placeholder (shown when no image) -->
                        <div class="af-img-placeholder" id="af-img-placeholder"
                            style="${existingImage ? 'display:none' : ''}">
                            <svg width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="3"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <path d="M21 15l-5-5L5 21"/>
                            </svg>
                            <div class="af-upload-label">Click or drag to upload image</div>
                            <div class="af-upload-sub">PNG, JPG, WEBP — max 5 MB</div>
                        </div>

                        <!-- Hover overlay (shown when image loaded) -->
                        <div class="af-img-overlay">
                            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            <span>Change Image</span>
                        </div>

                        <!-- Remove button -->
                        <button class="af-img-remove" type="button" id="af-img-remove-btn" title="Remove image"
                            onclick="event.stopPropagation(); AdminDashboardManager._clearModalImage()">
                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>

                    <!-- ── Basic info ── -->
                    <div class="af-section-title">Basic Info</div>
                    <div class="af-row">
                        <div class="af-col">
                            <div class="af-group">
                                <label>Name <span style="color:#c96">*</span></label>
                                <input id="ad-name" class="af-input" placeholder="Campaign name" value="${ad?.name || ''}">
                            </div>
                        </div>
                        <div class="af-col">
                            <div class="af-group">
                                <label>Type</label>
                                <input id="ad-type" class="af-input" placeholder="Banner, Popup, Slider…" value="${ad?.type || ''}">
                            </div>
                        </div>
                    </div>
                    <div class="af-group">
                        <label>Description</label>
                        <textarea id="ad-description" class="af-textarea" placeholder="Brief description of this ad…">${ad?.description || ''}</textarea>
                    </div>

                    <!-- ── Content texts ── -->
                    <div class="af-section-title">Content Texts</div>
                    <div class="af-row">
                        <div class="af-col">
                            <div class="af-group">
                                <label>Up Text</label>
                                <input id="ad-uptext" class="af-input" placeholder="Headline above image" value="${ad?.upText || ''}">
                            </div>
                        </div>
                        <div class="af-col">
                            <div class="af-group">
                                <label>Down Text</label>
                                <input id="ad-downtext" class="af-input" placeholder="Caption below image" value="${ad?.downText || ''}">
                            </div>
                        </div>
                    </div>

                    <!-- ── Schedule ── -->
                    <div class="af-section-title">Schedule</div>
                    <div class="af-row">
                        <div class="af-col">
                            <div class="af-group">
                                <label>Start Date</label>
                                <input id="ad-startdate" type="date" class="af-input" value="${formatDate(ad?.startDate)}">
                            </div>
                        </div>
                        <div class="af-col">
                            <div class="af-group">
                                <label>End Date</label>
                                <input id="ad-enddate" type="date" class="af-input" value="${formatDate(ad?.endDate)}">
                            </div>
                        </div>
                    </div>

                    <!-- ── Display options ── -->
                    <div class="af-section-title">Display Options</div>
                    <div class="af-toggle-row" onclick="document.getElementById('ad-showmain').click()">
                        <label class="af-toggle" onclick="event.stopPropagation()">
                            <input type="checkbox" id="ad-showmain" ${ad?.showInMainPage ? 'checked' : ''}>
                            <span class="af-toggle-slider"></span>
                        </label>
                        <label for="ad-showmain" style="cursor:pointer">Show on Main Page</label>
                        <span style="font-size:11px;color:#bbb;margin-left:auto">Displays in homepage hero</span>
                    </div>
                    <div style="height:20px"></div>
                </div>
            `,
            didOpen: () => {
                // Wire up file input → live preview
                const fileInput = document.getElementById('ad-image-file');
                const previewImg = document.getElementById('af-img-preview');
                const placeholder = document.getElementById('af-img-placeholder');
                const uploadBox = document.getElementById('af-img-upload-box');

                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                        Swal.showValidationMessage('Image must be under 5 MB');
                        fileInput.value = '';
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        previewImg.src = ev.target.result;
                        previewImg.style.display = 'block';
                        placeholder.style.display = 'none';
                        uploadBox.classList.add('has-image');
                    };
                    reader.readAsDataURL(file);
                });
            },
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: id ? '✓ Update Campaign' : '+ Create Campaign',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#111',
            preConfirm: () => {
                const name = document.getElementById('ad-name').value.trim();
                if (!name) {
                    Swal.showValidationMessage('Name is required');
                    return false;
                }
                const fileInput = document.getElementById('ad-image-file');
                const imageFile = fileInput?.files?.[0] || null;
                const previewImg = document.getElementById('af-img-preview');
                // Use file if newly picked, else keep existing URL (src of preview when no new file)
                const imageUrl = (!imageFile && previewImg?.src && !previewImg.src.startsWith('data:'))
                    ? previewImg.src
                    : '';
                return {
                    name,
                    description: document.getElementById('ad-description').value.trim(),
                    imageFile,     // File object (may be null)
                    imageUrl,      // Existing URL fallback
                    type: document.getElementById('ad-type').value.trim(),
                    upText: document.getElementById('ad-uptext').value.trim(),
                    downText: document.getElementById('ad-downtext').value.trim(),
                    startDate: document.getElementById('ad-startdate').value,
                    endDate: document.getElementById('ad-enddate').value,
                    showInMainPage: document.getElementById('ad-showmain').checked,
                };
            }
        });

        if (formValues) {
            if (id) {
                await this.updateAdvertisement(id, formValues);
            } else {
                await this.addAdvertisement(formValues);
            }
        }
    },

    // Helper to clear the modal image (called by remove button)
    _clearModalImage: function () {
        const fileInput = document.getElementById('ad-image-file');
        const previewImg = document.getElementById('af-img-preview');
        const placeholder = document.getElementById('af-img-placeholder');
        const uploadBox = document.getElementById('af-img-upload-box');
        if (fileInput) fileInput.value = '';
        if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
        if (placeholder) placeholder.style.display = '';
        if (uploadBox) uploadBox.classList.remove('has-image');
    },

    _buildFormData: function (fields) {
        const fd = new FormData();
        fd.append('Name', fields.name);
        fd.append('Description', fields.description || '');
        fd.append('Type', fields.type || '');
        fd.append('UpText', fields.upText || '');
        fd.append('DownText', fields.downText || '');
        fd.append('ShowInMainPage', fields.showInMainPage ? 'true' : 'false');
        if (fields.startDate) fd.append('StartDate', new Date(fields.startDate).toISOString());
        if (fields.endDate) fd.append('EndDate', new Date(fields.endDate).toISOString());
        // Attach file if one was picked; otherwise pass existing URL string
        if (fields.imageFile) {
            fd.append('Image', fields.imageFile, fields.imageFile.name);
        } else if (fields.imageUrl) {
            fd.append('Image', fields.imageUrl);
        }
        return fd;
    },

    addAdvertisement: async function (fields) {
        try {
            const formData = this._buildFormData(fields);
            // Don't set Content-Type — browser sets it automatically with boundary for FormData
            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.addAdvertisement), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.getToken()}` },
                body: formData
            });
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Advertisement added!', timer: 1500, showConfirmButton: false });
                this.loadAdvertisements();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not add advertisement.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    updateAdvertisement: async function (id, fields) {
        try {
            const formData = this._buildFormData(fields);
            const response = await fetch(API_CONFIG.getApiUrl(`${this.endpoints.updateAdvertisement}/${id}`), {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${this.getToken()}` },
                body: formData
            });
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Advertisement updated!', timer: 1500, showConfirmButton: false });
                this.loadAdvertisements();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not update advertisement.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    toggleAdStatus: async function (id) {
        const result = await Swal.fire({
            title: 'Toggle Status?',
            text: 'This will activate or deactivate the advertisement.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, toggle it',
            confirmButtonColor: '#c96',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(`${this.endpoints.toggleAdvertisement}/${id}`),
                { method: 'PATCH', headers: this.getHeaders() }
            );

            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Status updated!', timer: 1500, showConfirmButton: false });
                this.loadAdvertisements();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Could not toggle status.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    deleteAdvertisement: async function (id) {
        const result = await Swal.fire({
            title: 'Delete Advertisement?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(`${this.endpoints.deleteAdvertisement}?id=${id}`),
                { method: 'DELETE', headers: this.getHeaders() }
            );

            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Advertisement deleted!', timer: 1500, showConfirmButton: false });
                this.loadAdvertisements();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not delete advertisement.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    // =====================
    // --- Brands ---
    // =====================

    loadBrands: async function () {
        const $container = $('#admin-brands-container');
        $container.html('<p>Loading...</p>');

        try {
            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.brands), {
                headers: this.getHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                const brandsList = data.data || data;
                this.renderBrands(brandsList);
            } else {
                $container.html('<p>Could not load brands. (API endpoint might be missing)</p>');
            }
        } catch (e) {
            $container.html('<p>Error loading brands.</p>');
        }
    },

    formatDate: function (dateStr) {
        if (!dateStr || dateStr === '0001-01-01T00:00:00') return '—';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + 
                   ' ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '—';
        }
    },

    renderBrands: function (brands) {
    const $container = $('#admin-brands-container');
    if (!brands || brands.length === 0) {
        $container.html(`
            <div class="ads-header">
            <h2 class="ads-header-title">Bra<span>nds</span></h2>
            <button class="btn-ad-new" onclick="AdminDashboardManager.openBrandModal()">
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Brand
            </button>
            </div>  
        `);
        return;
    }

    let html = `
        <div class="ads-header">
        <h2 class="ads-header-title">Bra<span>nds</span></h2>
        <button class="btn-ad-new" onclick="AdminDashboardManager.openBrandModal()">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Brand
        </button>
        </div>  

        <div class="brands-grid">
    `;

    brands.forEach(brand => {
        const isActive = brand.status === 'Active';
        const imageUrl = brand.image || '';
        const createdDate = this.formatDate(brand.create_at);
        const updatedDate = this.formatDate(brand.update_at);

        html += `
            <div class="brand-card" 
                data-name="${(brand.name || '').toLowerCase()}"
                data-active="${isActive}">

                <div class="brand-card-img">
                    ${imageUrl ? `
                        <img src="${imageUrl}" alt="${brand.name}">
                    ` : ''}

                    <div class="brand-card-img-placeholder" ${imageUrl ? 'style="display:none"' : ''}>
                        <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="3"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <path d="M21 15l-5-5L5 21"/>
                        </svg>
                        <span>No Image</span>
                    </div>

                    <div class="brand-status-pill ${isActive ? 'active' : 'inactive'}">
                        ${isActive ? '● Active' : '○ Inactive'}
                    </div>
                </div>

                <div class="brand-card-body">
                    <div class="brand-card-top">
                        <h4 class="brand-card-name">${brand.name}</h4>
                        <span class="brand-card-id">#${brand.id}</span>
                    </div>
                    <div style="font-size: 11px; color: #666; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; line-height: 1.6;">
                        <div style="margin-bottom: 6px;"><strong>Created:</strong> ${createdDate}</div>
                        <div><strong>Updated:</strong> ${updatedDate}</div>
                    </div>
                </div>

                <div class="brand-card-footer">
                    <button class="btn-ad-edit"
                        onclick="AdminDashboardManager.openBrandModal(${brand.id})">
                        Edit
                    </button>
                    
                    <button class="btn-ad-edit" style="color: #e55;"
                        onclick="AdminDashboardManager.deleteBrand(${brand.id})" title="Delete brand">
                        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h16zM10 11v6M14 11v6"/></svg>
                        Delete
                    </button>
                    <label class="brand-card-toggle"
                        onclick="event.preventDefault(); AdminDashboardManager.toggleBrandStatus(${brand.id})">
                        <span class="toggle-text">${isActive ? 'Active' : 'Inactive'}</span>
                        <input type="checkbox" ${isActive ? 'checked' : ''}>
                        <span class="brand-card-toggle-slider"></span>
                    </label>
                    
                </div>
            </div>
            `;
    });

    html += `</div>`;
    $container.html(html);},

    openBrandModal: async function (id = null) {
        let brand = null;
        
        if (id) {
            try {
                const response = await fetch(
                    API_CONFIG.getApiUrl(`${this.endpoints.getBrandById}/${id}`),
                    { headers: this.getHeaders() }
                );
                if (response.ok) {
                    const data = await response.json();
                    brand = data.data || data;
                }
            } catch (e) {
            }
        }

        const existingImage = brand?.image || '';

        const { value: formValues } = await Swal.fire({
            title: id ? 'Edit Brand' : 'Add Brand',
            width: '500px',
            padding: '30px',
            background: '#fff',
            html: `
                <div style="text-align: left;">
                    <div class="af-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Brand Name <span style="color: #c96;">*</span></label>
                        <input id="brand-name" class="af-input" placeholder="Enter brand name" value="${brand?.name || ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    
                    <div class="af-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Brand Image</label>
                        <div id="brand-img-upload-box" class="af-img-upload ${existingImage ? 'has-image' : ''}" style="border: 2px dashed #ddd; border-radius: 8px; padding: 20px; text-align: center; cursor: pointer; position: relative; min-height: 150px;">
                            <input type="file" id="brand-image-file" accept="image/*" style="display: none;">
                            
                            <img class="brand-img-preview" id="brand-img-preview"
                                src="${existingImage}"
                                style="${existingImage ? 'display: block; max-width: 100%; max-height: 150px;' : 'display: none;'}">
                            
                            <div class="brand-img-placeholder" id="brand-img-placeholder"
                                style="${existingImage ? 'display: none;' : ''}">
                                <div style="font-size: 14px; color: #666; cursor: pointer; padding: 20px;">
                                    Click to upload or drag and drop
                                </div>
                            </div>
                            
                            ${existingImage ? `
                            <button class="btn-ad-edit" type="button" id="brand-img-remove-btn" style="position: absolute; top: 5px; right: 5px; padding: 5px 10px;" title="Remove image" onclick="event.stopPropagation(); AdminDashboardManager._clearBrandModalImage()">
                                ✕ Remove
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `,
            didOpen: () => {
                const uploadBox = document.getElementById('brand-img-upload-box');
                const fileInput = document.getElementById('brand-image-file');
                const previewImg = document.getElementById('brand-img-preview');
                const placeholder = document.getElementById('brand-img-placeholder');

                uploadBox.addEventListener('click', () => fileInput.click());
                uploadBox.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadBox.style.backgroundColor = '#f0f0f0';
                });
                uploadBox.addEventListener('dragleave', () => {
                    uploadBox.style.backgroundColor = '';
                });
                uploadBox.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadBox.style.backgroundColor = '';
                    if (e.dataTransfer.files.length) {
                        fileInput.files = e.dataTransfer.files;
                        fileInput.dispatchEvent(new Event('change'));
                    }
                });

                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                        Swal.showValidationMessage('Image must be under 5 MB');
                        fileInput.value = '';
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        previewImg.src = ev.target.result;
                        previewImg.style.display = 'block';
                        placeholder.style.display = 'none';
                        uploadBox.classList.add('has-image');
                    };
                    reader.readAsDataURL(file);
                });
            },
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: id ? '✓ Update Brand' : '+ Add Brand',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#111',
            preConfirm: () => {
                const name = document.getElementById('brand-name').value.trim();
                if (!name) {
                    Swal.showValidationMessage('Brand name is required');
                    return false;
                }
                const fileInput = document.getElementById('brand-image-file');
                const imageFile = fileInput?.files?.[0] || null;
                const previewImg = document.getElementById('brand-img-preview');
                const imageUrl = (!imageFile && previewImg?.src && !previewImg.src.startsWith('data:'))
                    ? previewImg.src
                    : '';
                return { name, imageFile, imageUrl };
            }
        });

        if (formValues) {
            if (id) {
                await this.updateBrand(id, formValues);
            } else {
                await this.addBrand(formValues);
            }
        }
    },

    _clearBrandModalImage: function () {
        const fileInput = document.getElementById('brand-image-file');
        const previewImg = document.getElementById('brand-img-preview');
        const placeholder = document.getElementById('brand-img-placeholder');
        const uploadBox = document.getElementById('brand-img-upload-box');
        const removeBtn = document.getElementById('brand-img-remove-btn');
        
        if (fileInput) fileInput.value = '';
        if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
        if (placeholder) placeholder.style.display = '';
        if (uploadBox) uploadBox.classList.remove('has-image');
        if (removeBtn) removeBtn.remove();
    },

    addBrand: async function (formValues) {
        try {
            const formData = new FormData();
            formData.append('Name', formValues.name);
            if (formValues.imageFile) {
                formData.append('MainImage', formValues.imageFile, formValues.imageFile.name);
            } else if (formValues.imageUrl) {
                formData.append('MainImage', formValues.imageUrl);
            }

            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.addBrand), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.getToken()}` },
                body: formData
            });

            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Brand added!', timer: 1500, showConfirmButton: false });
                this.loadBrands();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not add brand.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    updateBrand: async function (id, formValues) {
        try {
            // Always use FormData for consistency with backend expectations
            const formData = new FormData();
            formData.append('Name', formValues.name);
            
            if (formValues.imageFile) {
                formData.append('MainImage', formValues.imageFile, formValues.imageFile.name);
            } else if (formValues.imageUrl) {
                formData.append('MainImage', formValues.imageUrl);
            }

            const response = await fetch(API_CONFIG.getApiUrl(`${this.endpoints.updateBrand}/${id}`), {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${this.getToken()}` },
                body: formData
            });

            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Brand updated!', timer: 1500, showConfirmButton: false });
                this.loadBrands();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not update brand.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    toggleBrandStatus: async function (id) {
        const result = await Swal.fire({
            title: 'Toggle Status?',
            text: 'This will activate or deactivate the brand.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, toggle it',
            confirmButtonColor: '#c96',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(`${this.endpoints.toggleBrand}/${id}`),
                { method: 'PATCH', headers: this.getHeaders() }
            );

            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Status updated!', timer: 1500, showConfirmButton: false });
                this.loadBrands();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Could not toggle status.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    deleteBrand: async function (id) {
        const result = await Swal.fire({
            title: 'Delete Brand?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(`${this.endpoints.deleteBrand}?id=${id}`),
                { method: 'DELETE', headers: this.getHeaders() }
            );

            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Brand deleted!', timer: 1500, showConfirmButton: false });
                this.loadBrands();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not delete brand.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    // =====================
    // --- Categories ---
    // =====================

    loadCategories: async function () {
        const $container = $('#admin-categories-container');
        $container.html('<p>Loading...</p>');

        try {
            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.categories), {
                headers: this.getHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                const categoriesList = data.data || data;
                this.renderCategories(categoriesList);
            } else {
                $container.html('<p>Could not load categories. (API endpoint might be missing)</p>');
            }
        } catch (e) {
            $container.html('<p>Error loading categories.</p>');
        }
    },

    renderCategories: function (categories) {
        const $container = $('#admin-categories-container');
        const total = categories ? categories.length : 0;
        const active = categories ? categories.filter(c => c.status === 'Active').length : 0;
        
        if (!categories || categories.length === 0) {
            $container.html(`
                <div class="ads-panel">
                    <div class="ads-header">
                        <h2 class="ads-header-title">Catego<span>ries</span></h2>
                        <button class="btn-ad-new" onclick="AdminDashboardManager.openCategoryModal()">
                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            New Category
                        </button>
                    </div>
                    <div class="ads-empty">
                        <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="3"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <path d="M21 15l-5-5L5 21"/>
                        </svg>
                        <h4>No Categories Yet</h4>
                        <p>Create your first category to get started.</p>
                    </div>
                </div>
            `);
            return;
        }

        let html = `
            <div class="ads-panel">
                <div class="ads-header">
                    <div>
                        <h2 class="ads-header-title">Catego<span>ries</span></h2>
                        <div class="ads-header-meta">${total} categor${total !== 1 ? 'ies' : 'y'} total</div>
                    </div>
                    <button class="btn-ad-new" onclick="AdminDashboardManager.openCategoryModal()">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        New Category
                    </button>
                </div>

                <div class="ads-stats">
                    <div class="ads-stat-card">
                        <div class="ads-stat-label">Total</div>
                        <div class="ads-stat-value accent">${total}</div>
                    </div>
                    <div class="ads-stat-card">
                        <div class="ads-stat-label">Active</div>
                        <div class="ads-stat-value green">${active}</div>
                    </div>
                    <div class="ads-stat-card">
                        <div class="ads-stat-label">Inactive</div>
                        <div class="ads-stat-value muted">${total - active}</div>
                    </div>
                </div>

                <div class="ads-toolbar">
                    <div class="ads-search-wrap">
                        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input class="ads-search" id="categories-search-input" type="text" placeholder="Search by name…" oninput="AdminDashboardManager.filterCategories()">
                    </div>
                    <select class="ads-filter-select" id="categories-filter-status" onchange="AdminDashboardManager.filterCategories()">
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div class="ads-grid" id="categories-grid">
        `;

        categories.forEach(category => {
            const isActive = category.status === 'Active';
            const imageUrl = category.image || '';
            const createdDate = this.formatDate(category.create_at);
            const updatedDate = this.formatDate(category.update_at);

            html += `
                <div class="ad-card" data-name="${(category.name || '').toLowerCase()}" data-active="${isActive}">
                    <div class="ad-card-img">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${category.name}">` : ''}
                        
                        <div class="ad-card-img-placeholder" ${imageUrl ? 'style="display:none"' : ''}>
                            <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="3"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <path d="M21 15l-5-5L5 21"/>
                            </svg>
                            <span>No Image</span>
                        </div>
                        
                        <div class="ad-status-pill ${isActive ? 'active' : 'inactive'}">
                            ${isActive ? '● Active' : '○ Inactive'}
                        </div>
                    </div>

                    <div class="ad-card-body">
                        <div class="ad-card-top">
                            <h4 class="ad-card-name">${category.name}</h4>
                            <span class="ad-card-id">#${category.id}</span>
                        </div>
                        
                        <div style="font-size: 11px; color: #666; margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee; line-height: 1.6;">
                            <div style="margin-bottom: 6px;"><strong>Created:</strong> ${createdDate}</div>
                            <div><strong>Updated:</strong> ${updatedDate}</div>
                        </div>
                    </div>

                    <div class="ad-card-footer">
                        <button class="btn-ad-edit" onclick="AdminDashboardManager.openCategoryModal(${category.id})">
                            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            Edit
                        </button>
                        <button class="btn-ad-edit" style="color: #e55;" onclick="AdminDashboardManager.deleteCategory(${category.id})" title="Delete category">
                            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h16zM10 11v6M14 11v6"/></svg>
                            Delete
                        </button>
                        <label class="ad-card-toggle status-toggle" title="Toggle Status" onclick="event.preventDefault(); AdminDashboardManager.toggleCategoryStatus(${category.id})">
                            <span style="font-size: 11px; margin-right: 8px; font-weight: 600; color: #555;">${isActive ? 'Active' : 'Inactive'}</span>
                            <input type="checkbox" ${isActive ? 'checked' : ''}>
                            <span class="ad-card-toggle-slider"></span>
                        </label>
                    </div>
                </div>
            `;
        });

        html += `</div></div>`;
        $container.html(html);
    },

    filterCategories: function () {
        const query = (document.getElementById('categories-search-input')?.value || '').toLowerCase();
        const status = document.getElementById('categories-filter-status')?.value || 'all';
        document.querySelectorAll('#categories-grid .ad-card').forEach(card => {
            const name = card.dataset.name || '';
            const active = card.dataset.active === 'true';
            const matchQ = !query || name.includes(query);
            const matchS = status === 'all' || (status === 'active' && active) || (status === 'inactive' && !active);
            card.style.display = (matchQ && matchS) ? '' : 'none';
        });
    },

    openCategoryModal: async function (id = null) {
        let category = null;
        
        if (id) {
            try {
                const response = await fetch(
                    API_CONFIG.getApiUrl(`${this.endpoints.getCategoryById}/${id}`),
                    { headers: this.getHeaders() }
                );
                if (response.ok) {
                    const data = await response.json();
                    category = data.data || data;
                }
            } catch (e) {
            }
        }

        const existingImage = category?.image || '';

        const { value: formValues } = await Swal.fire({
            title: id ? 'Edit Category' : 'Add Category',
            width: '500px',
            padding: '30px',
            background: '#fff',
            html: `
                <div style="text-align: left;">
                    <div class="af-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Category Name <span style="color: #c96;">*</span></label>
                        <input id="category-name" class="af-input" placeholder="Enter category name" value="${category?.name || ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    
                    <div class="af-group" style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Category Image</label>
                        <div id="category-img-upload-box" class="af-img-upload ${existingImage ? 'has-image' : ''}" style="border: 2px dashed #ddd; border-radius: 8px; padding: 20px; text-align: center; cursor: pointer; position: relative; min-height: 150px;">
                            <input type="file" id="category-image-file" accept="image/*" style="display: none;">
                            
                            <img class="category-img-preview" id="category-img-preview"
                                src="${existingImage}"
                                style="${existingImage ? 'display: block; max-width: 100%; max-height: 150px;' : 'display: none;'}">
                            
                            <div class="category-img-placeholder" id="category-img-placeholder"
                                style="${existingImage ? 'display: none;' : ''}">
                                <div style="font-size: 14px; color: #666; cursor: pointer; padding: 20px;">
                                    Click to upload or drag and drop
                                </div>
                            </div>
                            
                            ${existingImage ? `
                            <button class="btn-ad-edit" type="button" id="category-img-remove-btn" style="position: absolute; top: 5px; right: 5px; padding: 5px 10px;" title="Remove image" onclick="event.stopPropagation(); AdminDashboardManager._clearCategoryModalImage()">
                                ✕ Remove
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `,
            didOpen: () => {
                const uploadBox = document.getElementById('category-img-upload-box');
                const fileInput = document.getElementById('category-image-file');
                const previewImg = document.getElementById('category-img-preview');
                const placeholder = document.getElementById('category-img-placeholder');

                uploadBox.addEventListener('click', () => fileInput.click());
                uploadBox.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadBox.style.backgroundColor = '#f0f0f0';
                });
                uploadBox.addEventListener('dragleave', () => {
                    uploadBox.style.backgroundColor = '';
                });
                uploadBox.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadBox.style.backgroundColor = '';
                    if (e.dataTransfer.files.length) {
                        fileInput.files = e.dataTransfer.files;
                        fileInput.dispatchEvent(new Event('change'));
                    }
                });

                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                        Swal.showValidationMessage('Image must be under 5 MB');
                        fileInput.value = '';
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        previewImg.src = ev.target.result;
                        previewImg.style.display = 'block';
                        placeholder.style.display = 'none';
                        uploadBox.classList.add('has-image');
                    };
                    reader.readAsDataURL(file);
                });
            },
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: id ? '✓ Update Category' : '+ Add Category',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#111',
            preConfirm: () => {
                const name = document.getElementById('category-name').value.trim();
                if (!name) {
                    Swal.showValidationMessage('Category name is required');
                    return false;
                }
                const fileInput = document.getElementById('category-image-file');
                const imageFile = fileInput?.files?.[0] || null;
                const previewImg = document.getElementById('category-img-preview');
                const imageUrl = (!imageFile && previewImg?.src && !previewImg.src.startsWith('data:'))
                    ? previewImg.src
                    : '';
                return { name, imageFile, imageUrl };
            }
        });

        if (formValues) {
            if (id) {
                await this.updateCategory(id, formValues);
            } else {
                await this.addCategory(formValues);
            }
        }
    },

    _clearCategoryModalImage: function () {
        const fileInput = document.getElementById('category-image-file');
        const previewImg = document.getElementById('category-img-preview');
        const placeholder = document.getElementById('category-img-placeholder');
        const uploadBox = document.getElementById('category-img-upload-box');
        const removeBtn = document.getElementById('category-img-remove-btn');
        
        if (fileInput) fileInput.value = '';
        if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
        if (placeholder) placeholder.style.display = '';
        if (uploadBox) uploadBox.classList.remove('has-image');
        if (removeBtn) removeBtn.remove();
    },

    addCategory: async function (formValues) {
        try {
            const formData = new FormData();
            formData.append('Name', formValues.name);
            if (formValues.imageFile) {
                formData.append('Image', formValues.imageFile, formValues.imageFile.name);
            } else if (formValues.imageUrl) {
                formData.append('Image', formValues.imageUrl);
            }

            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.addCategory), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.getToken()}` },
                body: formData
            });

            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Category added!', timer: 1500, showConfirmButton: false });
                this.loadCategories();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not add category.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    updateCategory: async function (id, formValues) {
        try {
            if (formValues.imageFile) {
                const formData = new FormData();
                formData.append('Name', formValues.name);
                formData.append('Image', formValues.imageFile, formValues.imageFile.name);

                const response = await fetch(API_CONFIG.getApiUrl(`${this.endpoints.updateCategory}/${id}`), {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${this.getToken()}` },
                    body: formData
                });

                if (response.ok) {
                    await Swal.fire({ icon: 'success', title: 'Category updated!', timer: 1500, showConfirmButton: false });
                    this.loadCategories();
                } else {
                    const err = await response.json().catch(() => ({}));
                    Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not update category.' });
                }
            } else {
                const formData = new FormData();
                formData.append('Name', formValues.name);

                const response = await fetch(API_CONFIG.getApiUrl(`${this.endpoints.updateCategory}/${id}`), {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${this.getToken()}` },
                    body: formData
                });

                if (response.ok) {
                    await Swal.fire({ icon: 'success', title: 'Category updated!', timer: 1500, showConfirmButton: false });
                    this.loadCategories();
                } else {
                    const err = await response.json().catch(() => ({}));
                    Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not update category.' });
                }
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    toggleCategoryStatus: async function (id) {
        const result = await Swal.fire({
            title: 'Toggle Status?',
            text: 'This will activate or deactivate the category.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, toggle it',
            confirmButtonColor: '#c96',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(`${this.endpoints.toggleCategory}/${id}`),
                { method: 'PATCH', headers: this.getHeaders() }
            );

            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Status updated!', timer: 1500, showConfirmButton: false });
                this.loadCategories();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Could not toggle status.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    deleteCategory: async function (id) {
        const result = await Swal.fire({
            title: 'Delete Category?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(`${this.endpoints.deleteCategory}?id=${id}`),
                { method: 'DELETE', headers: this.getHeaders() }
            );

            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Category deleted!', timer: 1500, showConfirmButton: false });
                this.loadCategories();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not delete category.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    // =====================
    // --- Company ---
    // =====================

    loadCompany: async function () {
        const $container = $('#admin-company-container');
        $container.html('<p>Loading...</p>');

        try {
            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.company), {
                headers: this.getHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Get company array from data
                const companies = data.data || data;
                const company = Array.isArray(companies) && companies.length > 0 ? companies[0] : null;
                
                this.renderCompany(company);
            } else {
                $container.html('<p>Could not load company. (API endpoint might be missing)</p>');
            }
        } catch (e) {
            $container.html('<p>Error loading company.</p>');
        }
    },

    renderCompany: function (company) {
        const $container = $('#admin-company-container');
        
        if (!company || typeof company !== 'object') {
            $container.html(`
                <div class="ads-header">
                    <h2 class="ads-header-title">Comp<span>any</span></h2>
                </div>
            `);
            return;
        }

        const isActive = company.status === 'Active' || company.isActive;
        const imageUrl = company.imageUrl || company.image || '';
        const logoUrl = company.logoUrl || company.logo || '';
        const createdDate = this.formatDate(company.createdAt || company.created_at || company.create_at);
        const updatedDate = this.formatDate(company.updatedAt || company.updated_at || company.update_at);

        let html = `
            <div class="company-panel">
                <div class="ads-header">
                    <h2 class="ads-header-title">Company<span>Information</span></h2>
                    <button class="btn-ad-new" onclick="AdminDashboardManager.openCompanyModal(${company.id})">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Edit Company
                    </button>
                </div>
                <div class="company-card">
                    <div class="company-card-header">
                        <div class="company-logos">
                            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="company-logo">` : '<div class="company-logo-placeholder">Logo</div>'}
                            ${imageUrl ? `<img src="${imageUrl}" alt="Image" class="company-image">` : '<div class="company-image-placeholder">Image</div>'}
                        </div>
                    </div>

                    <div class="company-card-body">
                        <div class="company-info-header">
                           <div class="company-info-section">
                            <h3 class="pt-1 text-lg font-bold">${company.name || 'N/A'}</h3>
                            <p class="company-founded">${company.foundedYear ? 'Founded: ' + company.foundedYear : ''}</p>

                           </div>
                             <div class="company-status-pill ${isActive ? 'active' : 'inactive'}">
                                ${isActive ? '● Active' : '○ Inactive'}
                            </div>
                        </div>
                       

                        <div class="company-info-grid">
                            <div class="company-info-item">
                                <label>Description</label>
                                <p>${company.description || '—'}</p>
                            </div>
                            <div class="company-info-item">
                                <label>About Us</label>
                                <p>${company.aboutUs || '—'}</p>
                            </div>
                            <div class="company-info-item">
                                <label>Location</label>
                                <p>${company.location || '—'}</p>
                            </div>
                            <div class="company-info-item">
                                <label>Email</label>
                                <p><a href="mailto:${company.email}">${company.email || '—'}</a></p>
                            </div>
                            <div class="company-info-item">
                                <label>Phone</label>
                                <p><a href="tel:${company.phone}">${company.phone || '—'}</a></p>
                            </div>
                            <div class="company-info-item">
                                <label>WhatsApp</label>
                                <p>${company.whatsApp || '—'}</p>
                            </div>
                            <div class="company-info-item">
                                <label>Free Delivery Above</label>
                                <p>ILS ${(company.freeDeliveryAboveAmount || 0).toFixed(2)}</p>
                            </div>
                        </div>

                        <div style="font-size: 11px; color: #666; margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; line-height: 1.6;">
                            <div style="margin-bottom: 6px;"><strong>Created:</strong> ${createdDate}</div>
                            <div><strong>Updated:</strong> ${updatedDate}</div>
                            <div class="company-status">
                           
                            <label class="company-toggle " onclick="event.preventDefault(); AdminDashboardManager.toggleCompanyStatus(${company.id})">
                                <span class="toggle-text">${isActive ? 'Active' : 'Inactive'}</span>
                                <input type="checkbox" ${isActive ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        </div>
                         
                    </div>
                </div>
            </div>
        `;

        $container.html(html);
    },

    openCompanyModal: async function (id = null) {
        let company = null;
        
        if (id) {
            try {
                const response = await fetch(
                    API_CONFIG.getApiUrl(`${this.endpoints.getCompanyById}/${id}`),
                    { headers: this.getHeaders() }
                );
                if (response.ok) {
                    const data = await response.json();
                    company = data.data || data;
                }
            } catch (e) {
            }
        }

        const existingImage = company?.imageUrl || company?.image || '';
        const existingLogo = company?.logoUrl || company?.logo || '';

        // Helper to escape HTML attributes
        const escapeAttr = (str) => {
            if (!str) return '';
            return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };

        // Helper to escape HTML content
        const escapeHtml = (str) => {
            if (!str) return '';
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        };

        const { value: formValues } = await Swal.fire({
            title: 'Company Information',
            width: '660px',
            padding: '0',
            background: '#fff',
            html: `
                <div class="af-swal-form" style="padding:28px 28px 4px">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
                        <div>
                            <div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#111;letter-spacing:-0.3px">
                                ${id ? 'Edit' : 'New'} Company <span style="color:#c96">Info</span>
                            </div>
                            ${id ? `<div style="font-size:11px;color:#aaa;margin-top:4px">Editing company #${id}</div>` : ''}
                        </div>
                        <div style="width:42px;height:42px;background:#fdf4e7;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <svg width="20" height="20" fill="none" stroke="#c96" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                        </div>
                    </div>

                    <!-- Basic Info -->
                    <div class="af-section-title" style="margin-top:0">Basic Information</div>
                    <div class="af-row">
                        <div class="af-col">
                            <div class="af-group">
                                <label>Company Name <span style="color:#c96">*</span></label>
                                <input id="company-name" class="af-input" placeholder="Company name" value="${escapeAttr(company?.name || '')}">
                            </div>
                        </div>
                        <div class="af-col">
                            <div class="af-group">
                                <label>Founded Year</label>
                                <input id="company-founded" type="number" class="af-input" placeholder="2020" value="${escapeAttr(company?.foundedYear || '')}">
                            </div>
                        </div>
                    </div>

                    <div class="af-group">
                        <label>Description</label>
                        <textarea id="company-description" class="af-textarea" placeholder="Brief description">${escapeHtml(company?.description || '')}</textarea>
                    </div>

                    <div class="af-group">
                        <label>About Us</label>
                        <textarea id="company-about" class="af-textarea" placeholder="About us content">${escapeHtml(company?.aboutUs || '')}</textarea>
                    </div>

                    <!-- Contact & Location -->
                    <div class="af-section-title">Contact & Location</div>
                    <div class="af-row">
                        <div class="af-col">
                            <div class="af-group">
                                <label>Location</label>
                                <input id="company-location" class="af-input" placeholder="Address" value="${escapeAttr(company?.location || '')}">
                            </div>
                        </div>
                        <div class="af-col">
                            <div class="af-group">
                                <label>Email</label>
                                <input id="company-email" type="email" class="af-input" placeholder="email@company.com" value="${escapeAttr(company?.email || '')}">
                            </div>
                        </div>
                    </div>

                    <div class="af-row">
                        <div class="af-col">
                            <div class="af-group">
                                <label>Phone</label>
                                <input id="company-phone" class="af-input" placeholder="+1234567890" value="${escapeAttr(company?.phone || '')}">
                            </div>
                        </div>
                        <div class="af-col">
                            <div class="af-group">
                                <label>WhatsApp</label>
                                <input id="company-whatsapp" class="af-input" placeholder="+1234567890" value="${escapeAttr(company?.whatsApp || '')}">
                            </div>
                        </div>
                    </div>

                    <!-- Images & Settings -->
                    <div class="af-section-title">Images & Settings</div>
                    <div class="af-row">
                        <div class="af-col">
                            <div class="af-group">
                                <label>Company Logo</label>
                                <div class="af-img-upload ${existingLogo ? 'has-image' : ''}" id="company-logo-upload-box">
                                    <input type="file" id="company-logo-file" accept="image/*">
                                    <img class="af-img-preview" id="company-logo-preview" src="${existingLogo}" style="${existingLogo ? 'display:block' : 'display:none'}" alt="Logo preview">
                                    <div class="af-img-placeholder" id="company-logo-placeholder" style="${existingLogo ? 'display:none' : ''}">
                                        <svg width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                                        <div class="af-upload-label">Click to upload logo</div>
                                    </div>
                                    <div class="af-img-overlay"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>Change Logo</span></div>
                                    <button class="af-img-remove" type="button" id="company-logo-remove-btn" title="Remove logo" onclick="event.stopPropagation(); AdminDashboardManager._clearCompanyLogoImage()" style="${existingLogo ? '' : 'display:none'}">
                                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="af-col">
                            <div class="af-group">
                                <label>Company Image</label>
                                <div class="af-img-upload ${existingImage ? 'has-image' : ''}" id="company-image-upload-box">
                                    <input type="file" id="company-image-file" accept="image/*">
                                    <img class="af-img-preview" id="company-image-preview" src="${existingImage}" style="${existingImage ? 'display:block' : 'display:none'}" alt="Image preview">
                                    <div class="af-img-placeholder" id="company-image-placeholder" style="${existingImage ? 'display:none' : ''}">
                                        <svg width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                                        <div class="af-upload-label">Click to upload image</div>
                                    </div>
                                    <div class="af-img-overlay"><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>Change Image</span></div>
                                    <button class="af-img-remove" type="button" id="company-image-remove-btn" title="Remove image" onclick="event.stopPropagation(); AdminDashboardManager._clearCompanyImage()" style="${existingImage ? '' : 'display:none'}">
                                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="af-group">
                        <label>Free Delivery Above Amount (ILS)</label>
                        <input id="company-free-delivery" type="number" step="0.01" class="af-input" placeholder="0.00" value="${escapeAttr(company?.freeDeliveryAboveAmount || '')}">
                    </div>

                    <div style="height:20px"></div>
                </div>
            `,
            didOpen: () => {
                // Logo upload handler
                const logoUploadBox = document.getElementById('company-logo-upload-box');
                const logoFileInput = document.getElementById('company-logo-file');
                const logoPreview = document.getElementById('company-logo-preview');
                const logoPlaceholder = document.getElementById('company-logo-placeholder');
                const logoRemoveBtn = document.getElementById('company-logo-remove-btn');

                logoUploadBox.addEventListener('click', () => logoFileInput.click());
                logoFileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                        Swal.showValidationMessage('Logo must be under 5 MB');
                        logoFileInput.value = '';
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        logoPreview.src = ev.target.result;
                        logoPreview.style.display = 'block';
                        logoPlaceholder.style.display = 'none';
                        logoUploadBox.classList.add('has-image');
                        if (logoRemoveBtn) logoRemoveBtn.style.display = 'flex';
                    };
                    reader.readAsDataURL(file);
                });

                // Image upload handler
                const imageUploadBox = document.getElementById('company-image-upload-box');
                const imageFileInput = document.getElementById('company-image-file');
                const imagePreview = document.getElementById('company-image-preview');
                const imagePlaceholder = document.getElementById('company-image-placeholder');
                const imageRemoveBtn = document.getElementById('company-image-remove-btn');

                imageUploadBox.addEventListener('click', () => imageFileInput.click());
                imageFileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                        Swal.showValidationMessage('Image must be under 5 MB');
                        imageFileInput.value = '';
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        imagePreview.src = ev.target.result;
                        imagePreview.style.display = 'block';
                        imagePlaceholder.style.display = 'none';
                        imageUploadBox.classList.add('has-image');
                        if (imageRemoveBtn) imageRemoveBtn.style.display = 'flex';
                    };
                    reader.readAsDataURL(file);
                });
            },
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: id ? '✓ Update Company' : '+ Add Company',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#111',
            preConfirm: () => {
                const name = document.getElementById('company-name').value.trim();
                if (!name) {
                    Swal.showValidationMessage('Company name is required');
                    return false;
                }
                return {
                    name,
                    foundedYear: document.getElementById('company-founded').value || '',
                    description: document.getElementById('company-description').value.trim(),
                    aboutUs: document.getElementById('company-about').value.trim(),
                    location: document.getElementById('company-location').value.trim(),
                    email: document.getElementById('company-email').value.trim(),
                    phone: document.getElementById('company-phone').value.trim(),
                    whatsApp: document.getElementById('company-whatsapp').value.trim(),
                    freeDeliveryAboveAmount: document.getElementById('company-free-delivery').value || '0',
                    logoFile: document.getElementById('company-logo-file')?.files?.[0] || null,
                    logoUrl: (!document.getElementById('company-logo-file')?.files?.[0] && document.getElementById('company-logo-preview')?.src && !document.getElementById('company-logo-preview')?.src.startsWith('data:')) ? document.getElementById('company-logo-preview')?.src : '',
                    imageFile: document.getElementById('company-image-file')?.files?.[0] || null,
                    imageUrl: (!document.getElementById('company-image-file')?.files?.[0] && document.getElementById('company-image-preview')?.src && !document.getElementById('company-image-preview')?.src.startsWith('data:')) ? document.getElementById('company-image-preview')?.src : '',
                };
            }
        });

        if (formValues) {
            if (id) {
                await this.updateCompany(id, formValues);
            } else {
                await this.addCompany(formValues);
            }
        }
    },

    _clearCompanyImage: function () {
        const fileInput = document.getElementById('company-image-file');
        const previewImg = document.getElementById('company-image-preview');
        const placeholder = document.getElementById('company-image-placeholder');
        const uploadBox = document.getElementById('company-image-upload-box');
        if (fileInput) fileInput.value = '';
        if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
        if (placeholder) placeholder.style.display = '';
        if (uploadBox) uploadBox.classList.remove('has-image');
    },

    _clearCompanyLogoImage: function () {
        const fileInput = document.getElementById('company-logo-file');
        const previewImg = document.getElementById('company-logo-preview');
        const placeholder = document.getElementById('company-logo-placeholder');
        const uploadBox = document.getElementById('company-logo-upload-box');
        if (fileInput) fileInput.value = '';
        if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
        if (placeholder) placeholder.style.display = '';
        if (uploadBox) uploadBox.classList.remove('has-image');
    },

    addCompany: async function (formValues) {
        try {
            const formData = new FormData();
            formData.append('Name', formValues.name);
            formData.append('FoundedYear', formValues.foundedYear || '');
            formData.append('Description', formValues.description);
            formData.append('AboutUs', formValues.aboutUs);
            formData.append('Location', formValues.location);
            formData.append('Email', formValues.email);
            formData.append('Phone', formValues.phone);
            formData.append('WhatsApp', formValues.whatsApp);
            formData.append('FreeDeliveryAboveAmount', formValues.freeDeliveryAboveAmount);
            
            if (formValues.logoFile) {
                formData.append('Logo', formValues.logoFile, formValues.logoFile.name);
            } else if (formValues.logoUrl) {
                formData.append('Logo', formValues.logoUrl);
            }
            
            if (formValues.imageFile) {
                formData.append('Image', formValues.imageFile, formValues.imageFile.name);
            } else if (formValues.imageUrl) {
                formData.append('Image', formValues.imageUrl);
            }

            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.addCompany), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.getToken()}` },
                body: formData
            });

            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Company added!', timer: 1500, showConfirmButton: false });
                this.loadCompany();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not add company.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    updateCompany: async function (id, formValues) {
        try {
            const formData = new FormData();
            formData.append('Name', formValues.name);
            formData.append('FoundedYear', formValues.foundedYear || '');
            formData.append('Description', formValues.description);
            formData.append('AboutUs', formValues.aboutUs);
            formData.append('Location', formValues.location);
            formData.append('Email', formValues.email);
            formData.append('Phone', formValues.phone);
            formData.append('WhatsApp', formValues.whatsApp);
            formData.append('FreeDeliveryAboveAmount', formValues.freeDeliveryAboveAmount);
            
            if (formValues.logoFile) {
                formData.append('Logo', formValues.logoFile, formValues.logoFile.name);
            } else if (formValues.logoUrl) {
                formData.append('Logo', formValues.logoUrl);
            }
            
            if (formValues.imageFile) {
                formData.append('Image', formValues.imageFile, formValues.imageFile.name);
            } else if (formValues.imageUrl) {
                formData.append('Image', formValues.imageUrl);
            }

            const response = await fetch(API_CONFIG.getApiUrl(`${this.endpoints.updateCompany}/${id}`), {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${this.getToken()}` },
                body: formData
            });

            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Company updated!', timer: 1500, showConfirmButton: false });
                this.loadCompany();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not update company.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    toggleCompanyStatus: async function (id) {
        const result = await Swal.fire({
            title: 'Toggle Status?',
            text: 'This will activate or deactivate the company.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, toggle it',
            confirmButtonColor: '#c96',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(`${this.endpoints.toggleCompany}/${id}`),
                { method: 'PATCH', headers: this.getHeaders() }
            );

            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Status updated!', timer: 1500, showConfirmButton: false });
                this.loadCompany();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Could not toggle status.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },
};

$(document).ready(function () {
    if ($('.page-title').text().includes('Admin Dashboard')) {
        AdminDashboardManager.init();
    }
});