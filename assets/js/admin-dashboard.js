
const AdminDashboardManager = {
    // API Endpoints
    endpoints: {
        analytics: 'Admin/Analytics',
        //orders
        orders: 'Admin/Orders/Get-All-Orders',
        ordersByStatus: 'Admin/Orders/Get-orders-by-status',
        changeOrderStatus: 'Admin/Orders/Change-order-status',
        getOrderById: 'Admin/Orders/GetOrderById',
        updatePaidAmount: 'Admin/Orders/Update-paid-amount',
        generateDeliveryPaymentLink: 'Admin/Orders/Generate-delivery-payment-link',
        editOrder: 'Admin/Orders/Edit',   
        //products
        products: 'Products/GetAllProducts',
        //advertisements
        advertisements: 'Admin/Advertisements',
        addAdvertisement: 'Admin/Advertisements/AddAdvertisement',
        updateAdvertisement: 'Admin/Advertisements/UpdateAdvertisement',
        toggleAdvertisement: 'Admin/Advertisements/ToggleStatus',
        getAdvertisementById: 'Admin/Advertisements/GetAdvertisementById',
        deleteAdvertisement: 'Admin/Advertisements',
        //brands
        brands: 'Admin/Brands/GetAllBrands',
        addBrand: 'Admin/Brands/AddBrand',
        updateBrand: 'Admin/Brands/UpdateBrand',
        toggleBrand: 'Admin/Brands/ToggleStatus',
        getBrandById: 'Admin/Brands/GetBrandById',
        deleteBrand: 'Admin/Brands',
        //categories
        categories: 'Admin/Categories',
        addCategory: 'Admin/Categories/AddCategory',
        updateCategory: 'Admin/Categories/UpdateCategory',
        toggleCategory: 'Admin/Categories/ToggleStatus',
        getCategoryById: 'Admin/Categories/GetCategoryById',
        deleteCategory: 'Admin/Categories',
        //company
        company: 'Admin/Company',
        addCompany: 'Admin/Company/AddCompany',
        updateCompany: 'Admin/Company/UpdateCompany',
        toggleCompany: 'Admin/Company/ToggleStatus',
        getCompanyById: 'Admin/Company/GetCompanyById',
        //delivery costs
        deliveryCosts: 'DeliveryCosts/GetBySection',
        addDeliveryCost: 'Admin/DeliveryCosts/AddDeliveryCost',
        updateDeliveryCost: 'Admin/DeliveryCosts/UpdateDeliveryCost',
        toggleDeliveryCost: 'Admin/DeliveryCosts/ToggleStatus',
        getDeliveryCostById: 'Admin/DeliveryCosts/GetDeliveryCostById',
        deleteDeliveryCost: 'Admin/DeliveryCosts/DeleteDeliveryCost',
        //discount codes
        discountCodes: 'Admin/DiscountCodes/GetAllDiscountCodes',
        addDiscountCode: 'Admin/DiscountCodes/AddDiscountCode',
        updateDiscountCode: 'Admin/DiscountCodes/UpdateDiscountCode',
        getDiscountCodeById: 'Admin/DiscountCodes/GetDiscountCodeById',
        deleteDiscountCode: 'Admin/DiscountCodes/DeleteDiscountCode',
        resetDiscountCodeAmount: 'Admin/DiscountCodes/ResetDiscountAmounts',
        //users
        users: 'Admin/Users',
        blockUser: 'Admin/Users/Block',
        unBlockUser: 'Admin/Users/UnBlock',
        isBlockedUser: 'Admin/Users/IsBlocked',
        changeUserRole: 'Admin/Users/ChangeRole',
        deleteUser: 'Admin/Users',
        updateUserProfile: 'Admin/Users',
        changeUserPassword: 'Admin/Users/ChangePassword',
        getUserFullDetails: 'Admin/Users/FullDetails',
        //SocialMedia
        socialMedia: 'Admin/SocialMedia',
        getSocialMediaById: 'Admin/SocialMedia/GetSocialMediaById',
        addSocialMedia: 'Admin/SocialMedia/AddSocialMedia',
        updateSocialMedia: 'Admin/SocialMedia/UpdateSocialMedia',
        toggleSocialMedia: 'Admin/SocialMedia/ToggleStatus',
        deleteSocialMedia: 'Admin/SocialMedia',
        // Colors
        getAllColors:       'Admin/ProductColors/GetAllColors?includeInactive=true',
        getColorById:       'Admin/ProductColors/GetColorById',
        addColor:           'Admin/ProductColors/AddColor',
        updateColor:        'Admin/ProductColors/UpdateColor',
        toggleColorStatus:  'Admin/ProductColors/ToggleStatus',
        deleteColor:        'Admin/ProductColors',
        // Sizes
        getAllSizes:         'Admin/ProductSizes/GetAllSizes?includeInactive=true',
        getSizeById:        'Admin/ProductSizes/GetSizeById',
        addSize:            'Admin/ProductSizes/AddSize',
        updateSize:         'Admin/ProductSizes/UpdateSize',
        toggleSizeStatus:   'Admin/ProductSizes/ToggleStatus',
        deleteSize:         'Admin/ProductSizes',
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

        // Initialize Order Management System with Model-View-Controller pattern
        if (typeof OrderController !== 'undefined') {
            const authManager = {
                getHeaders: () => self.getHeaders()
            };
            
            const orderModel = new OrderModel(self.endpoints, authManager);
            const orderView = new OrderView('admin-orders-container');
            
            OrderController.init(orderModel, orderView);
        }
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
        } else if (tabTarget === '#tab-deliverycosts') {
            this.loadDeliveryCosts();
        } else if (tabTarget === '#tab-discountcodes') {
            this.loadDiscountCodes();
        } else if (tabTarget === '#tab-SocialMedia') {
            this.loadSocialMedia();
        } else if (tabTarget === '#tab-colors-sizes') {
            this.loadColorsAndSizes();
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

    // =====================
    // --- Orders ---
    // =====================
   
   // --- Orders ---
    loadOrders: async function (status = 'All') {
        // normalize status so filter/count logic stays correct
        status = (status === undefined || status === null || status === '') ? 'All' : String(status).trim();
        if (typeof OrderController !== 'undefined' && OrderController.model && OrderController.view) {
            return await OrderController.loadOrders(status);
        } else {
            // Fallback for legacy code
            $('#admin-orders-container').html('<div style="color:#e55;padding:20px;">Order management system not initialized.</div>');
        }
    },
    filterOrdersLocal: function (status = 'All') {
        if (typeof OrderController !== 'undefined') {
            status = (status === undefined || status === null || status === '') ? 'All' : String(status).trim();
            return OrderController.filter(status);
        }
    },
    openOrderModal: async function (orderId) {
        if (typeof OrderController !== 'undefined') {
            return await OrderController.openModal(orderId);
        }
    },
    updateOrderStatus: async function (orderId) {
        if (typeof OrderController !== 'undefined') {
            const result = await OrderController.updateStatus(orderId);
            // refresh using current active filter so status numbers/view stay correct
            let activeStatus = 'All';
            const $active = $('.order-status-filter.active, .active[data-status]').first();
            if ($active.length) {
                activeStatus = $active.data('status') || 'All';
            }
            await OrderController.loadOrders(activeStatus);
            return result;
        }
    },
    updateOrderPaidAmount: async function (orderId) {
        if (typeof OrderController !== 'undefined') {
            return await OrderController.updatePaidAmount(orderId);
        }
    },
    generateDeliveryPaymentLink: async function (orderId) {
        if (typeof OrderController !== 'undefined') {
            return await OrderController.generatePaymentLink(orderId);
        }
    },
    editOrder: async function (orderId) {
    if (typeof OrderController === 'undefined' || !OrderController.model) return;

    let order;
    try {
        order = await OrderController.model.fetchOrderById(orderId);
    } catch (err) {
        Swal.fire('Error', 'Could not load order details. Please try again.', 'error');
        return;
    }
    if (!order) return;

    // Fetch all products
    let products = [];
    try {
        const productsResp = await fetch(API_CONFIG.getApiUrl(this.endpoints.products), { headers: this.getHeaders() });
        if (productsResp.ok) {
            const productsData = await productsResp.json();
            products = productsData.data || productsData;
        }
    } catch (e) {}

    let sectionsData = [];
    let flatCities   = [];

    try {
        const deliveryResp = await fetch(API_CONFIG.getApiUrl(this.endpoints.deliveryCosts), { headers: this.getHeaders() });
        if (deliveryResp.ok) {
            const deliveryData = await deliveryResp.json();
            sectionsData = deliveryData.data || deliveryData;
            sectionsData.forEach(sec => {
                (sec.cities || []).forEach(city => flatCities.push(city));
            });
        }
    } catch (e) {}

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getSectionNames = () => sectionsData.map(s => s.sectionName).filter(Boolean);

    const getCitiesForSection = (sectionName) => {
        const sec = sectionsData.find(s => s.sectionName === sectionName);
        return sec ? (sec.cities || []) : [];
    };

    const findCityById = (cityId) => flatCities.find(c => c.id === cityId) || null;

    const findCityByNameAndSection = (sectionName, cityName) =>
        flatCities.find(c => c.sectionName === sectionName && c.cityName === cityName) || null;

    // ── Resolve initial section/city from order ───────────────────────────────
    let initialSection   = (order.sectionName || '').trim();
    let initialCity      = (order.cityName    || '').trim();
    let initialCityId    = order.deliveryCostId || null;

    if ((!initialSection || !initialCity) && initialCityId) {
        const matched = findCityById(initialCityId);
        if (matched) {
            initialSection = matched.sectionName;
            initialCity    = matched.cityName;
        }
    }

    if (!initialSection || !initialCity) {
        const rawAddress = (order.guestAddress || order.address || '').trim();
        if (rawAddress) {
            const parts = rawAddress.split(',').map(p => p.trim()).filter(Boolean);
            if (parts.length >= 2) {
                const candidateSection = parts[parts.length - 1];
                const candidateCity    = parts[parts.length - 2];
                const secExists  = sectionsData.some(s => s.sectionName === candidateSection);
                const cityExists = flatCities.some(c => c.cityName === candidateCity && c.sectionName === candidateSection);
                if (secExists  && !initialSection) initialSection = candidateSection;
                if (cityExists && !initialCity)    initialCity    = candidateCity;
            }
            if (!initialSection || !initialCity) {
                const addressLower = rawAddress.toLowerCase();
                const sorted = [...flatCities].sort((a, b) =>
                    (b.sectionName + b.cityName).length - (a.sectionName + a.cityName).length
                );
                for (const c of sorted) {
                    const sec  = (c.sectionName || '').toLowerCase();
                    const city = (c.cityName    || '').toLowerCase();
                    if (!initialSection && sec  && addressLower.includes(sec))  initialSection = c.sectionName;
                    if (!initialCity    && city && addressLower.includes(city)) initialCity    = c.cityName;
                    if (initialSection && initialCity) break;
                }
            }
        }
    }

    let displayAddress = (order.guestAddress || order.address || '').trim();
    let streetAddress = displayAddress;
    if (displayAddress && initialCity && initialSection) {
        const parts = displayAddress.split(',').map(p => p.trim());
        streetAddress = parts[0] || '';
        const suffix1 = `, ${initialCity}, ${initialSection}`;
        const suffix2 = `, ${initialSection}, ${initialCity}`;
        if (displayAddress.endsWith(suffix1)) {
            displayAddress = displayAddress.slice(0, -suffix1.length).trim();
        } else if (displayAddress.endsWith(suffix2)) {
            displayAddress = displayAddress.slice(0, -suffix2.length).trim();
        }
    }

    if (!initialCityId && initialSection && initialCity) {
        const matched = findCityByNameAndSection(initialSection, initialCity);
        if (matched) initialCityId = matched.id;
    }

    // ── Build dropdown option strings ─────────────────────────────────────────
    const buildSectionOptions = (selected) =>
        getSectionNames().map(s =>
            `<option value="${s}"${s === selected ? ' selected' : ''}>${s}</option>`
        ).join('');

    const buildCityOptions = (sectionName, selectedCity) => {
        const cities = getCitiesForSection(sectionName);
        if (!cities.length) return '<option value="">Select City</option>';
        return cities.map(c =>
            `<option value="${c.cityName}"${c.cityName === selectedCity ? ' selected' : ''}>${c.cityName}</option>`
        ).join('');
    };

    const sectionOptions = buildSectionOptions(initialSection);
    const cityOptions    = buildCityOptions(initialSection, initialCity);

    // ── Product helpers ───────────────────────────────────────────────────────
    function getProductName(productId) {
        const p = products.find(p => p.id === productId);
        return p ? p.name : productId;
    }
    function getColorName(productId, colorId) {
        const p = products.find(p => p.id === productId);
        if (!p || !p.colors) return colorId;
        const c = p.colors.find(c => c.id === colorId);
        return c ? c.name : colorId;
    }
    function getSizeName(productId, sizeId) {
        const p = products.find(p => p.id === productId);
        if (!p || !p.sizes) return sizeId;
        const s = p.sizes.find(s => s.id === sizeId);
        return s ? s.name : sizeId;
    }

    const buildItemRows = (items = []) =>
        items.map((item, i) => `
            <tr data-index="${i}">
                <td>
                    <input class="form-control edit-item-productId" type="hidden" value="${item.productId ?? ''}" />
                    <span class="edit-item-productName">${getProductName(item.productId)}</span>
                </td>
                <td>
                    <input class="form-control edit-item-colorId" type="hidden" value="${item.colorId ?? ''}" />
                    <span class="edit-item-colorName">${getColorName(item.productId, item.colorId)}</span>
                </td>
                <td>
                    <input class="form-control edit-item-sizeId" type="hidden" value="${item.sizeId ?? ''}" />
                    <span class="edit-item-sizeName">${getSizeName(item.productId, item.sizeId)}</span>
                </td>
                <td>
                    <input class="form-control edit-item-quantity" type="number" value="${item.quantity ?? 1}" min="1" />
                </td>
                <td>
                    <input type="hidden" class="edit-item-id" value="${item.id ?? ''}" />
                    <button type="button" class="btn btn-sm btn-danger remove-edit-item-row">&times;</button>
                </td>
            </tr>`).join('');

    // ── Modal HTML — styled to match manage order modal ───────────────────────
    const modalHtml = `
        <div style="text-align:left; padding:4px 0;">

            <!-- Customer Info Section -->
            <div class="order-modal-section">
                <div class="order-modal-title">Customer Information</div>

                <div class="edit-field-row">
                    <div class="edit-field-group">
                        <label class="edit-label">Name <span class="edit-required">*</span></label>
                        <input id="edit-guestName" class="form-control" placeholder="Full name" value="${order.guestName ?? ''}" />
                    </div>
                    <div class="edit-field-group">
                        <label class="edit-label">Email</label>
                        <input id="edit-guestEmail" class="form-control" placeholder="Email address" value="${order.guestEmail ?? ''}" />
                    </div>
                </div>

                <div class="edit-field-row">
                    <div class="edit-field-group">
                        <label class="edit-label">Phone <span class="edit-required">*</span></label>
                        <input id="edit-guestPhoneNumber" class="form-control" placeholder="Phone number" value="${order.guestPhoneNumber ?? order.phone ?? ''}" />
                    </div>
                    <div class="edit-field-group">
                        <label class="edit-label">Street / Detail Address <span class="edit-required">*</span></label>
                        <input id="edit-guestAddress" class="form-control" placeholder="Street address" value="${streetAddress}" />
                    </div>
                </div>

                <div class="edit-field-row">
                    <div class="edit-field-group">
                        <label class="edit-label">Section (Region)</label>
                        <select id="edit-section" class="form-control">
                            <option value="">Select Section</option>
                            ${sectionOptions}
                        </select>
                    </div>
                    <div class="edit-field-group">
                        <label class="edit-label">City</label>
                        <select id="edit-city" class="form-control">
                            <option value="">Select City</option>
                            ${cityOptions}
                        </select>
                    </div>
                </div>

                <div class="edit-field-row">
                    <div class="edit-field-group">
                        <label class="edit-label">Discount Code</label>
                        <input id="edit-discountCode" class="form-control" placeholder="Discount code (optional)" value="${order.discountCode ?? ''}" />
                    </div>
                </div>
            </div>

            <!-- Order Items Section -->
            <div class="order-modal-section">
                <div class="order-modal-title">Order Items</div>
                <table class="table table-bordered table-sm edit-items-table-styled" id="edit-items-table">
                    <thead>
                        <tr><th>Product</th><th>Color</th><th>Size</th><th>Qty</th><th></th></tr>
                    </thead>
                    <tbody>${buildItemRows(order.orderItems)}</tbody>
                </table>
                <button type="button" id="add-edit-item-row" class="btn-add-item">
                    <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Item
                </button>
                <div id="edit-order-error" class="edit-order-error" style="display:none;"></div>
            </div>

        </div>`;

    // ── Open via SweetAlert2 — matching manage order modal pattern ────────────
    const self = this;

    Swal.fire({
        title: `Edit Order <span style="color:var(--gold,#c96);">#${orderId}</span>`,
        html: modalHtml,
        width: '620px',
        showConfirmButton: true,
        confirmButtonText: 'Save Changes',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        showCloseButton: true,
        customClass: {
            container: 'order-management-modal edit-order-swal',
            confirmButton: 'swal-btn-primary',
            cancelButton: 'swal-btn-secondary',
        },
        didOpen: () => {
            // ── Clear invalid state on input ─────────────────────────────────
            ['edit-guestName', 'edit-guestPhoneNumber', 'edit-guestAddress'].forEach(id => {
                document.getElementById(id)?.addEventListener('input', function () {
                    this.classList.remove('edit-field-invalid');
                    if (document.getElementById('edit-order-error')) {
                        document.getElementById('edit-order-error').style.display = 'none';
                    }
                });
            });

            // ── Section → City cascade ────────────────────────────────────────
            document.getElementById('edit-section')?.addEventListener('change', function () {
                const cities = getCitiesForSection(this.value);
                let cityHtml = '<option value="">Select City</option>';
                cityHtml += cities.map(c => `<option value="${c.cityName}">${c.cityName}</option>`).join('');
                document.getElementById('edit-city').innerHTML = cityHtml;
            });

            // ── Add new item row ──────────────────────────────────────────────
            document.getElementById('add-edit-item-row')?.addEventListener('click', function () {
                const newIndex = document.querySelectorAll('#edit-items-table tbody tr').length;
                const productOptions = products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
                const tbody = document.querySelector('#edit-items-table tbody');
                const tr = document.createElement('tr');
                tr.dataset.index = newIndex;
                tr.innerHTML = `
                    <td>
                        <select class="form-control edit-item-productId">
                            <option value="">Select Product</option>
                            ${productOptions}
                        </select>
                    </td>
                    <td><select class="form-control edit-item-colorId"><option value="">Color</option></select></td>
                    <td><select class="form-control edit-item-sizeId"><option value="">Size</option></select></td>
                    <td><input class="form-control edit-item-quantity" type="number" value="1" min="1" /></td>
                    <td>
                        <input type="hidden" class="edit-item-id" value="" />
                        <button type="button" class="btn btn-sm btn-danger remove-edit-item-row">&times;</button>
                    </td>`;
                tbody.appendChild(tr);

                tr.querySelector('.edit-item-productId').addEventListener('change', function () {
                    const productId = parseInt(this.value);
                    const product   = products.find(p => p.id === productId);
                    let colorHtml = '<option value="">Color</option>';
                    let sizeHtml  = '<option value="">Size</option>';
                    if (product?.colors) colorHtml += product.colors.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
                    if (product?.sizes)  sizeHtml  += product.sizes.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
                    tr.querySelector('.edit-item-colorId').innerHTML = colorHtml;
                    tr.querySelector('.edit-item-sizeId').innerHTML  = sizeHtml;
                });

                tr.querySelector('.remove-edit-item-row').addEventListener('click', function () {
                    tr.remove();
                });
            });

            // ── Remove existing item rows ────────────────────────────────────
            document.querySelectorAll('.remove-edit-item-row').forEach(btn => {
                btn.addEventListener('click', function () {
                    this.closest('tr').remove();
                });
            });
        },
        preConfirm: async () => {
            const errorEl = document.getElementById('edit-order-error');
            errorEl.style.display = 'none';
            errorEl.textContent = '';

            // ── Required field validation ─────────────────────────────────────
            const nameVal    = document.getElementById('edit-guestName')?.value.trim()        || '';
            const phoneVal   = document.getElementById('edit-guestPhoneNumber')?.value.trim() || '';
            const addressVal = document.getElementById('edit-guestAddress')?.value.trim()     || '';

            // Clear previous invalid states
            ['edit-guestName', 'edit-guestPhoneNumber', 'edit-guestAddress'].forEach(id => {
                document.getElementById(id)?.classList.remove('edit-field-invalid');
            });

            // Strip all non-digit characters to check if a real number was entered
            const phoneDigits = phoneVal.replace(/\D/g, '');

            const missing = [];
            const invalid = [];

            if (!nameVal)    { missing.push('Name');    document.getElementById('edit-guestName')?.classList.add('edit-field-invalid'); }
            if (!addressVal) { missing.push('Address'); document.getElementById('edit-guestAddress')?.classList.add('edit-field-invalid'); }

            if (!phoneVal || phoneDigits.length === 0) {
                // Field is empty or only had symbols like "+", "()", "-"
                missing.push('Phone');
                document.getElementById('edit-guestPhoneNumber')?.classList.add('edit-field-invalid');
            } else if (phoneDigits.length < 7) {
                // Has some digits but not enough to be a real phone number
                invalid.push('Phone must contain at least 7 digits');
                document.getElementById('edit-guestPhoneNumber')?.classList.add('edit-field-invalid');
            }

            if (missing.length > 0) {
                errorEl.textContent = `Required field${missing.length > 1 ? 's' : ''} missing: ${missing.join(', ')}.`;
                errorEl.style.display = 'block';
                return false;
            }

            if (invalid.length > 0) {
                errorEl.textContent = invalid.join(' · ');
                errorEl.style.display = 'block';
                return false;
            }

            // ── Collect order items ───────────────────────────────────────────
            const orderItems = [];
            let valid = true;
            document.querySelectorAll('#edit-items-table tbody tr').forEach(row => {
                const productId = parseInt(row.querySelector('.edit-item-productId')?.value);
                const quantity  = parseInt(row.querySelector('.edit-item-quantity')?.value);
                const colorId   = row.querySelector('.edit-item-colorId')?.value;
                const sizeId    = row.querySelector('.edit-item-sizeId')?.value;
                const itemId    = row.querySelector('.edit-item-id')?.value;
                if (!productId || !quantity || quantity < 1) { valid = false; return; }
                orderItems.push({
                    id:        itemId ? parseInt(itemId) : undefined,
                    productId: productId,
                    colorId:   colorId ? parseInt(colorId) : null,
                    sizeId:    sizeId  ? parseInt(sizeId)  : null,
                    quantity:  quantity,
                });
            });

            if (!valid || orderItems.length === 0) {
                errorEl.textContent = 'Please fill in all required item fields (Product & Quantity).';
                errorEl.style.display = 'block';
                return false;
            }

            // ── Discount code validation ──────────────────────────────────────
            const discountCode = document.getElementById('edit-discountCode')?.value.trim() || '';
            if (discountCode) {
                try {
                    const resp = await fetch(API_CONFIG.getApiUrl('DiscountCodes/Validate'), {
                        method: 'POST',
                        headers: self.getHeaders(),
                        body: JSON.stringify({ code: discountCode })
                    });
                    let data = {};
                    try { data = await resp.json(); } catch (_) {}
                    if (data.success === false) {
                        errorEl.textContent = data.message || 'Invalid discount code.';
                        errorEl.style.display = 'block';
                        return false;
                    }
                } catch (e) {
                    console.warn('Discount validation network error:', e);
                }
            }

            // ── Resolve deliveryCostId ────────────────────────────────────────
            const selectedSection = document.getElementById('edit-section')?.value || '';
            const selectedCity    = document.getElementById('edit-city')?.value    || '';
            const matchedCity     = findCityByNameAndSection(selectedSection, selectedCity);
            const streetAddr      = document.getElementById('edit-guestAddress')?.value.trim() || '';

            // ── Build payload ─────────────────────────────────────────────────
            const payload = {
                guestName:      document.getElementById('edit-guestName')?.value        || null,
                guestEmail:     document.getElementById('edit-guestEmail')?.value       || null,
                Address:        streetAddr                                               || null,
                Phone:          document.getElementById('edit-guestPhoneNumber')?.value || null,
                discountCode:   discountCode                                             || null,
                sectionName:    selectedSection                                          || null,
                cityName:       selectedCity                                             || null,
                deliveryCostId: matchedCity ? matchedCity.id                            : null,
                orderItems,
            };

            console.log('DEBUG: submitting payload:', payload);

            try {
                Swal.showLoading();
                await self._submitEditOrder(orderId, payload);
                return true;
            } catch (err) {
                console.error('DEBUG: submit error:', err);
                Swal.hideLoading();
                errorEl.textContent = err?.message || 'Failed to save changes. Please try again.';
                errorEl.style.display = 'block';
                return false;
            }
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({
                icon: 'success',
                title: 'Order Updated',
                text: 'Changes saved successfully.',
                timer: 1800,
                showConfirmButton: false,
            });
            let activeStatus = 'All';
            const $active = $('.order-status-filter.active, .active[data-status]').first();
            if ($active.length) activeStatus = $active.data('status') || 'All';
            await OrderController.loadOrders(activeStatus);
        }
    });
    },
    _submitEditOrder: async function (orderId, payload) {
        const response = await fetch(
            API_CONFIG.getApiUrl(`${this.endpoints.editOrder}/${orderId}`),
            {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            let msg = `Server error: ${response.status}`;
            try { const err = await response.json(); msg = err.message || msg; } catch (_) {}
            throw new Error(msg);
        }

        const data = await response.json().catch(() => ({}));
        return data.data || data;
    },
    closeOrderModal: function () {
        if (typeof Swal !== 'undefined' && Swal.isVisible()) {
            Swal.close();
        }
    },


    
    // =====================
    // --- Products ---
    // =====================
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
        $container.html(html);
    },

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
                    </div>

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

    // =====================
    // --- Delivery Costs ---
    // =====================

    loadDeliveryCosts: async function () {
        const $container = $('#admin-deliverycosts-container');

        $container.html(`
            <div class="ads-panel">
                <div class="ads-header">
                    <div>
                        <h2 class="ads-header-title">Delivery <span>Costs</span></h2>
                    </div>
                </div>
                <div style="padding:20px;">Loading delivery costs…</div>
            </div>
        `);

        try {
            const response = await fetch(API_CONFIG.getApiUrl('Admin/DeliveryCosts/GetAllDeliveryCosts'), {
                headers: this.getHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                let costs = [];
                if (Array.isArray(data)) {
                    costs = data;
                } else if (Array.isArray(data.data)) {
                    costs = data.data;
                } else if (data.data && Array.isArray(data.data.items)) {
                    costs = data.data.items;
                }
                this.renderDeliveryCosts(costs);
            } else {
                this.renderDeliveryCosts([]);
            }
        } catch (e) {
            $container.html(`<div class="dc-load-error">Error loading delivery costs.</div>`);
        }
    },

    renderDeliveryCosts: function (costs) {
        const $container = $('#admin-deliverycosts-container');
        const total = costs ? costs.length : 0;

        let html = `
            <div class="ads-panel">
                <div class="ads-header">
                    <div>
                        <h2 class="ads-header-title">Delivery <span>Costs</span></h2>
                        <div class="ads-header-meta">${total} record${total !== 1 ? 's' : ''} total</div>
                    </div>
                    <button class="btn-ad-new" onclick="AdminDashboardManager.openDeliveryCostModal()">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        New Cost
                    </button>
                </div>

                <div class="ads-toolbar">
                    <div class="ads-search-wrap">
                        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            class="ads-search"
                            id="dc-search-input"
                            type="text"
                            placeholder="Search by city or section…"
                            oninput="AdminDashboardManager.filterDeliveryCosts()"
                        >
                    </div>
                </div>

                <div class="table-responsive dc-table-wrap">
                    <table class="table" id="dc-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Country</th>
                                <th>City</th>
                                <th>Cost</th>
                                <th>Status</th>
                                <th class="dc-col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (!costs || costs.length === 0) {
            html += `
                <tr>
                    <td colspan="6" class="dc-empty-row">No delivery costs found.</td>
                </tr>
            `;
        } else {
            costs.forEach(dc => {
                const statusStr = (dc.status || '').toString().toLowerCase().replace('_', '');
                const isActive = statusStr === 'active' || dc.isActive === true || dc.status === true;

                const dcId = dc.id ?? dc.Id ?? '';
                const dcCity = dc.cityName || dc.CityName || '—';
                const dcSection = dc.sectionName || dc.SectionName || '—';
                const dcCost = typeof dc.cost === 'number' ? dc.cost
                    : typeof dc.Cost === 'number' ? dc.Cost : 0;

                html += `
                    <tr class="dc-row"
                        data-city="${(dc.cityName || '').toLowerCase()}"
                        data-section="${(dc.sectionName || '').toLowerCase()}">

                        <td><span class="dc-id-badge">#${dcId}</span></td>
                        <td>${dcSection}</td>
                        <td>${dcCity}</td>
                        <td><span class="dc-cost-pill">ILS ${dcCost.toFixed(2)}</span></td>

                        <td>
                            <label class="ad-card-toggle status-toggle dc-toggle-label"
                                title="Toggle Status"
                                onclick="event.preventDefault(); AdminDashboardManager.toggleDeliveryCostStatus(${dcId})">
                                <span class="dc-status-text ${isActive ? 'dc-status-active' : 'dc-status-inactive'}">
                                    ${isActive ? 'Active' : 'Inactive'}
                                </span>
                                <input type="checkbox" ${isActive ? 'checked' : ''}>
                                <span class="ad-card-toggle-slider"></span>
                            </label>
                        </td>

                        <td class="dc-col-actions">
                            <button class="btn-ad-edit dc-btn-table"
                                onclick="AdminDashboardManager.openDeliveryCostModal(${dcId})">
                                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                Edit
                            </button>
                            <button class="btn-ad-edit dc-btn-table dc-btn-delete"
                                onclick="AdminDashboardManager.deleteDeliveryCost(${dcId})">
                                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h16zM10 11v6M14 11v6"/>
                                </svg>
                                Delete
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table></div></div>`;
        $container.html(html);
    },

    filterDeliveryCosts: function () {
        const query = (document.getElementById('dc-search-input')?.value || '').toLowerCase();
        document.querySelectorAll('#dc-table .dc-row').forEach(row => {
            const city = row.dataset.city || '';
            const section = row.dataset.section || '';
            row.style.display = (!query || city.includes(query) || section.includes(query)) ? '' : 'none';
        });
    },

    openDeliveryCostModal: async function (id = null) {

        let dc = null;

        if (id) {
            try {
                const response = await fetch(
                    API_CONFIG.getApiUrl(`Admin/DeliveryCosts/GetDeliveryCostById/${id}`),
                    { headers: this.getHeaders() }
                );
                if (response.ok) {
                    const data = await response.json();
                    dc = data.data || data;
                }
            } catch (e) { }
        }

        // Remove any stale modal
        document.getElementById('dc-modal-overlay')?.remove();

        const isEdit = !!id;
        const badgeLabel = isEdit ? 'Edit Record' : 'New Entry';
        const titleLabel = isEdit ? 'Edit' : 'New';
        const subLabel = isEdit ? `Updating record #${id}` : 'Add a new delivery cost region';
        const btnIcon = isEdit
            ? '<path d="M20 6L9 17l-5-5"/>'
            : '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
        const btnLabel = isEdit ? 'Update Cost' : 'Add Cost';

        const sectionVal = dc?.sectionName || dc?.SectionName || '';
        const cityVal = dc?.cityName || dc?.CityName || '';
        const costVal = dc?.cost ?? dc?.Cost ?? '';

        const overlay = document.createElement('div');
        overlay.id = 'dc-modal-overlay';
        overlay.className = 'dc-overlay';
        overlay.innerHTML = `
            <div class="dc-modal" id="dc-modal-card">

                <div class="dc-modal-head">
                    <div>
                        <div class="dc-badge">
                            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                <path d="M1 3h22l-2 13H3L1 3z"/>
                                <circle cx="9" cy="20" r="1"/>
                                <circle cx="17" cy="20" r="1"/>
                            </svg>
                            ${badgeLabel}
                        </div>
                        <h3>${titleLabel} <span>Delivery Cost</span></h3>
                        <p>${subLabel}</p>
                    </div>
                    <button class="dc-close-btn" id="dc-close-btn" title="Close">
                        <svg width="14" height="14" fill="none" stroke="#666" stroke-width="2.5" viewBox="0 0 24 24">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <div class="dc-modal-body">
                    <div class="dc-error-msg" id="dc-error-msg"></div>

                    <div class="dc-field">
                        <label>Country</label>
                        <input id="dc-section" type="text"
                            placeholder="e.g. Palestine, West Bank, etc."
                            value="${sectionVal}">
                    </div>

                    <div class="dc-field">
                        <label>City Name <span>*</span></label>
                        <input id="dc-city" type="text"
                            placeholder="e.g. Jerusalem"
                            value="${cityVal}">
                    </div>

                    <div class="dc-field">
                        <label>Cost (ILS) <span>*</span></label>
                        <input id="dc-cost" type="number" step="1"
                            placeholder="0.00"
                            value="${costVal}">
                    </div>
                </div>

                <div class="dc-modal-foot">
                    <button class="dc-btn-cancel" id="dc-cancel-btn">Cancel</button>
                    <button class="dc-btn-confirm" id="dc-confirm-btn">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            ${btnIcon}
                        </svg>
                        ${btnLabel}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('dc-visible')));

        const closeModal = () => {
            overlay.classList.remove('dc-visible');
            setTimeout(() => overlay.remove(), 300);
        };

        document.getElementById('dc-close-btn').addEventListener('click', closeModal);
        document.getElementById('dc-cancel-btn').addEventListener('click', closeModal);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

        document.getElementById('dc-confirm-btn').addEventListener('click', async () => {
            const sectionName = document.getElementById('dc-section').value.trim();
            const cityName = document.getElementById('dc-city').value.trim();
            const costVal = document.getElementById('dc-cost').value;
            const errorEl = document.getElementById('dc-error-msg');
            const confirmBtn = document.getElementById('dc-confirm-btn');

            errorEl.classList.remove('visible');

            if (!cityName || costVal === '') {
                errorEl.textContent = 'City Name and Cost are required.';
                errorEl.classList.add('visible');
                return;
            }

            const formValues = { sectionName, cityName, cost: parseFloat(costVal) };

            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `
                <svg class="dc-spinning" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
                </svg>
                Saving…
            `;

            closeModal();

            if (id) {
                await this.updateDeliveryCost(id, formValues);
            } else {
                await this.addDeliveryCost(formValues);
            }
        });
    },

    addDeliveryCost: async function (formValues) {
        try {
            const response = await fetch(API_CONFIG.getApiUrl('Admin/DeliveryCosts/AddDeliveryCost'), {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    sectionName: formValues.sectionName,
                    cityName: formValues.cityName,
                    cost: formValues.cost
                })
            });
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Delivery Cost added!', timer: 1500, showConfirmButton: false });
                this.loadDeliveryCosts();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not add.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    updateDeliveryCost: async function (id, formValues) {
        try {
            const response = await fetch(API_CONFIG.getApiUrl(`Admin/DeliveryCosts/UpdateDeliveryCost/${id}`), {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    sectionName: formValues.sectionName,
                    cityName: formValues.cityName,
                    cost: formValues.cost
                })
            });
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Delivery Cost updated!', timer: 1500, showConfirmButton: false });
                this.loadDeliveryCosts();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not update.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    toggleDeliveryCostStatus: async function (id) {
        const result = await Swal.fire({
            title: 'Toggle Status?',
            text: 'This will activate or deactivate the delivery cost.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, toggle it',
            confirmButtonColor: '#c96',
        });
        if (!result.isConfirmed) return;

        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(`Admin/DeliveryCosts/ToggleStatus/${id}`),
                { method: 'PATCH', headers: this.getHeaders() }
            );
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Status updated!', timer: 1500, showConfirmButton: false });
                this.loadDeliveryCosts();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Could not toggle status.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    deleteDeliveryCost: async function (id) {
        const result = await Swal.fire({
            title: 'Delete Delivery Cost?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            confirmButtonColor: '#d33',
        });
        if (!result.isConfirmed) return;

        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(`Admin/DeliveryCosts/DeleteDeliveryCost/${id}`),
                { method: 'DELETE', headers: this.getHeaders() }
            );
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
                this.loadDeliveryCosts();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Could not delete.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    // =====================
    // --- Discount Codes ---
    // =====================

    loadDiscountCodes: async function () {
        const $container = $('#admin-discountcodes-container');

        $container.html(`
            <div class="ads-panel">
                <div class="ads-header">
                    <div>
                        <h2 class="ads-header-title">Discount <span>Codes</span></h2>
                    </div>
                </div>
                <div style="padding:20px;">Loading discount codes…</div>
            </div>
        `);

        try {
            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.discountCodes), {
                headers: this.getHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                let codes = [];

                if (Array.isArray(data)) {
                    codes = data;
                } else if (Array.isArray(data.data)) {
                    codes = data.data;
                } else if (data.data && Array.isArray(data.data.items)) {
                    codes = data.data.items;
                }

                this.renderDiscountCodes(codes);
            } else {
                this.renderDiscountCodes([]);
            }
        } catch (e) {
            $container.html(`<div class="dc-load-error">Error loading discount codes.</div>`);
        }
    },

    renderDiscountCodes: function (codes) {
        const $container = $('#admin-discountcodes-container');
        const total = codes ? codes.length : 0;

        const escapeHtml = (value) => {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        const formatNumber = (value) => {
            const num = Number(value ?? 0);
            return Number.isFinite(num) ? num.toLocaleString() : '0';
        };

        let html = `
            <div class="ads-panel">
                <div class="ads-header">
                    <div>
                        <h2 class="ads-header-title">Discount <span>Codes</span></h2>
                        <div class="ads-header-meta">${total} record${total !== 1 ? 's' : ''} total</div>
                    </div>
                    <button class="btn-ad-new" onclick="AdminDashboardManager.openDiscountCodeModal()">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        New Code
                    </button>
                </div>

                <div class="ads-toolbar">
                    <div class="ads-search-wrap">
                        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            class="ads-search"
                            id="dsc-search-input"
                            type="text"
                            placeholder="Search code…"
                            oninput="AdminDashboardManager.filterDiscountCodes()"
                        >
                    </div>
                </div>

                <div class="table-responsive dc-table-wrap">
                    <table class="table" id="dsc-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Code</th>
                                <th>Discount</th>
                                <th>Usage Count</th>
                                <th>Total Amount Saved</th>
                                <th>Total Order Amount</th>
                                <th class="dc-col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (!codes || codes.length === 0) {
            html += `
                <tr>
                    <td colspan="7" class="dc-empty-row">No discount codes found.</td>
                </tr>
            `;
        } else {
            codes.forEach(dc => {
                const dcId = dc.id ?? dc.Id ?? '';
                const codeName = dc.code || dc.Code || '—';
                const discount =
                    dc.discountPercentage ?? dc.DiscountPercentage ?? 0;
                const usageCount =
                    dc.usageCount ?? dc.UsageCount ?? 0;
                const totalAmountSaved =
                    dc.totalAmountSaved ?? dc.TotalAmountSaved ?? 0;
                const totalOrderAmount =
                    dc.totalOrderAmount ?? dc.TotalOrderAmount ?? 0;

                html += `
                    <tr class="dc-row" data-code="${escapeHtml(String(codeName).toLowerCase())}">
                        <td><span class="dc-id-badge">#${escapeHtml(dcId)}</span></td>
                        <td style="font-weight:600;">${escapeHtml(codeName)}</td>
                        <td><span class="dc-cost-pill">${escapeHtml(discount)}%</span></td>
                        <td>${formatNumber(usageCount)}</td>
                        <td>${formatNumber(totalAmountSaved)}</td>
                        <td>${formatNumber(totalOrderAmount)}</td>
                        <td class="dc-col-actions">
                            <button class="btn-ad-edit dc-btn-table"
                                onclick="AdminDashboardManager.openDiscountCodeModal(${Number(dcId) || 0})">
                                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                Edit
                            </button>

                            <button class="btn-ad-edit dc-btn-table dc-btn-delete"
                                onclick="AdminDashboardManager.deleteDiscountCode(${Number(dcId) || 0})">
                                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h16zM10 11v6M14 11v6"/>
                                </svg>
                                Delete
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        html += `</tbody></table></div></div>`;
        $container.html(html);
    },

    filterDiscountCodes: function () {
        const query = (document.getElementById('dsc-search-input')?.value || '').toLowerCase();

        document.querySelectorAll('#dsc-table .dc-row').forEach(row => {
            const code = row.dataset.code || '';
            row.style.display = (!query || code.includes(query)) ? '' : 'none';
        });
    },

    openDiscountCodeModal: async function (id = null) {
        let dc = null;

        if (id) {
            try {
                const response = await fetch(
                    API_CONFIG.getApiUrl(`${this.endpoints.getDiscountCodeById}/${id}`),
                    { headers: this.getHeaders() }
                );

                if (response.ok) {
                    const data = await response.json();
                    dc = data.data || data;
                }
            } catch (e) { }
        }

        document.getElementById('dc-modal-overlay')?.remove();

        const isEdit = !!id;
        const badgeLabel = isEdit ? 'Edit Record' : 'New Entry';
        const titleLabel = isEdit ? 'Edit' : 'New';
        const subLabel = isEdit ? `Updating record #${id}` : 'Add a new discount code';
        const btnIcon = isEdit
            ? '<path d="M20 6L9 17l-5-5"/>'
            : '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
        const btnLabel = isEdit ? 'Update Code' : 'Add Code';

        const codeVal = dc?.code || dc?.Code || '';
        const discountVal = dc?.discountPercentage ?? dc?.DiscountPercentage ?? '';
        const usageCount = dc?.usageCount ?? dc?.UsageCount ?? 0;
        const totalAmountSaved = dc?.totalAmountSaved ?? dc?.TotalAmountSaved ?? 0;
        const totalOrderAmount = dc?.totalOrderAmount ?? dc?.TotalOrderAmount ?? 0;

        const escapeAttr = (value) => {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };

        const formatNumber = (value) => {
            const num = Number(value ?? 0);
            return Number.isFinite(num) ? num.toLocaleString() : '0';
        };

        const overlay = document.createElement('div');
        overlay.id = 'dc-modal-overlay';
        overlay.className = 'dc-overlay';
        overlay.innerHTML = `
        <div class="dc-modal" id="dc-modal-card" style="max-height:90vh;display:flex;flex-direction:column;">
            <div class="dc-modal-head" style="flex:0 0 auto;">
                <div>
                    <div class="dc-badge">
                        <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <path d="M1 3h22l-2 13H3L1 3z"/>
                            <circle cx="9" cy="20" r="1"/>
                            <circle cx="17" cy="20" r="1"/>
                        </svg>
                        ${badgeLabel}
                    </div>
                    <h3>${titleLabel} <span>Discount Code</span></h3>
                    <p>${subLabel}</p>
                </div>
                <button class="dc-close-btn" id="dc-close-btn" title="Close">
                    <svg width="14" height="14" fill="none" stroke="#666" stroke-width="2.5" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>

            <div class="dc-modal-body" style="flex:1 1 auto;overflow-y:auto;max-height:calc(90vh - 150px);padding-right:6px;">
                <div class="dc-error-msg" id="dc-error-msg"></div>

                ${isEdit ? `
                    <div class="dc-stats-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px;">
                        <div class="dc-stat-card" style="padding:12px;border:1px solid #eee;border-radius:12px;background:#fafafa;">
                            <div style="font-size:12px;color:#777;">Usage Count</div>
                            <div id="dc-usage-count" style="font-size:18px;font-weight:700;margin-top:4px;">${formatNumber(usageCount)}</div>
                        </div>
                        <div class="dc-stat-card" style="padding:12px;border:1px solid #eee;border-radius:12px;background:#fafafa;">
                            <div style="font-size:12px;color:#777;">Total Amount Saved</div>
                            <div id="dc-total-saved" style="font-size:18px;font-weight:700;margin-top:4px;">${formatNumber(totalAmountSaved)}</div>
                        </div>
                        <div class="dc-stat-card" style="padding:12px;border:1px solid #eee;border-radius:12px;background:#fafafa;">
                            <div style="font-size:12px;color:#777;">Total Order Amount</div>
                            <div id="dc-total-order" style="font-size:18px;font-weight:700;margin-top:4px;">${formatNumber(totalOrderAmount)}</div>
                        </div>
                    </div>

                    <div id="dc-reset-box" style="margin-bottom:16px;">
                        <div id="dc-reset-message" style="display:none;padding:12px 14px;border-radius:10px;font-size:14px;font-weight:600;"></div>

                        <div id="dc-reset-confirm" style="display:none;margin-top:10px;padding:12px 14px;border:1px solid #fecdca;background:#fff7ed;border-radius:10px;">
                            <div style="font-size:14px;font-weight:600;color:#9a3412;margin-bottom:10px;">
                                Are you sure you want to reset discount amounts?
                            </div>
                            <div style="display:flex;gap:8px;">
                                <button type="button" id="dc-reset-yes"
                                    style="padding:8px 12px;border:none;border-radius:8px;background:#ea580c;color:white;font-weight:600;cursor:pointer;">
                                    Yes, Reset
                                </button>
                                <button type="button" id="dc-reset-no"
                                    style="padding:8px 12px;border:1px solid #ddd;border-radius:8px;background:white;color:#444;font-weight:600;cursor:pointer;">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="dc-field">
                    <label>Discount Code <span>*</span></label>
                    <input id="dsc-code" type="text"
                        placeholder="e.g. SUMMER2024"
                        value="${escapeAttr(codeVal)}">
                </div>

                <div class="dc-field">
                    <label>Discount Percentage (%) <span>*</span></label>
                    <input id="dsc-percentage" type="number" step="0.01" min="0" max="100"
                        placeholder="e.g. 15"
                        value="${escapeAttr(discountVal)}">
                </div>
            </div>

            <div class="dc-modal-foot" style="flex:0 0 auto;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
                <div>
                    ${isEdit ? `
                        <button class="dc-btn-reset" id="dc-reset-btn" type="button"
                            style="display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:none;border-radius:10px;background:#fff3cd;color:#8a6100;font-weight:600;cursor:pointer;">
                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                <polyline points="1 4 1 10 7 10"></polyline>
                                <path d="M3.51 15a9 9 0 1 0 .49-9.36L1 10"></path>
                            </svg>
                            Reset Amounts
                        </button>
                    ` : ''}
                </div>

                <div style="display:flex;gap:10px;">
                    <button class="dc-btn-cancel" id="dc-cancel-btn">Cancel</button>
                    <button class="dc-btn-confirm" id="dc-confirm-btn">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            ${btnIcon}
                        </svg>
                        ${btnLabel}
                    </button>
                </div>
            </div>
        </div>
    `;

        document.body.appendChild(overlay);

        requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('dc-visible')));

        const closeModal = () => {
            overlay.classList.remove('dc-visible');
            setTimeout(() => overlay.remove(), 300);
        };

        const showResetMessage = (message, type = 'success') => {
            const el = document.getElementById('dc-reset-message');
            if (!el) return;

            el.textContent = message;
            el.style.display = 'block';

            if (type === 'success') {
                el.style.background = '#ecfdf3';
                el.style.color = '#067647';
                el.style.border = '1px solid #abefc6';
            } else {
                el.style.background = '#fef2f2';
                el.style.color = '#b91c1c';
                el.style.border = '1px solid #fecaca';
            }
        };

        document.getElementById('dc-close-btn').addEventListener('click', closeModal);
        document.getElementById('dc-cancel-btn').addEventListener('click', closeModal);
        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeModal();
        });

        if (isEdit) {
            const resetBtn = document.getElementById('dc-reset-btn');
            const confirmBox = document.getElementById('dc-reset-confirm');
            const yesBtn = document.getElementById('dc-reset-yes');
            const noBtn = document.getElementById('dc-reset-no');

            resetBtn?.addEventListener('click', () => {
                confirmBox.style.display = 'block';
            });

            noBtn?.addEventListener('click', () => {
                confirmBox.style.display = 'none';
            });

            yesBtn?.addEventListener('click', async () => {
                const oldHtml = yesBtn.innerHTML;
                yesBtn.disabled = true;
                yesBtn.innerHTML = 'Resetting...';

                try {
                    const response = await fetch(
                        API_CONFIG.getApiUrl(`${this.endpoints.resetDiscountCodeAmount}/${id}`),
                        {
                            method: 'POST',
                            headers: this.getHeaders()
                        }
                    );

                    if (response.ok) {
                        showResetMessage('Discount amounts reset successfully.', 'success');
                        confirmBox.style.display = 'none';

                        this.loadDiscountCodes();

                        setTimeout(() => {
                            closeModal();
                        }, 800);
                    } else {
                        const err = await response.json().catch(() => ({}));
                        showResetMessage(err.message || 'Could not reset discount amounts.', 'error');
                    }
                } catch (e) {
                    showResetMessage('Network error while resetting amounts.', 'error');
                } finally {
                    yesBtn.disabled = false;
                    yesBtn.innerHTML = oldHtml;
                }
            });
        }

        document.getElementById('dc-confirm-btn').addEventListener('click', async () => {
            const codeName = document.getElementById('dsc-code').value.trim();
            const discountInput = document.getElementById('dsc-percentage').value;
            const errorEl = document.getElementById('dc-error-msg');
            const confirmBtn = document.getElementById('dc-confirm-btn');

            errorEl.textContent = '';
            errorEl.classList.remove('visible');

            if (!codeName || discountInput === '') {
                errorEl.textContent = 'Code and Discount Percentage are required.';
                errorEl.classList.add('visible');
                return;
            }

            const parsedDiscount = parseFloat(discountInput);

            if (Number.isNaN(parsedDiscount) || parsedDiscount < 0 || parsedDiscount > 100) {
                errorEl.textContent = 'Discount Percentage must be a number between 0 and 100.';
                errorEl.classList.add('visible');
                return;
            }

            const formValues = {
                code: codeName,
                discountPercentage: parsedDiscount
            };

            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `
            <svg class="dc-spinning" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
            </svg>
            Saving…
        `;

            closeModal();

            if (id) {
                await this.updateDiscountCode(id, formValues);
            } else {
                await this.addDiscountCode(formValues);
            }
        });
    },

    addDiscountCode: async function (formValues) {
        try {
            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.addDiscountCode), {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    code: formValues.code,
                    discountPercentage: formValues.discountPercentage
                })
            });

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Code added!',
                    timer: 1500,
                    showConfirmButton: false
                });
                this.loadDiscountCodes();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.message || 'Could not add.'
                });
            }
        } catch (e) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Network error.'
            });
        }
    },

    updateDiscountCode: async function (id, formValues) {
        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(`${this.endpoints.updateDiscountCode}/${id}`),
                {
                    method: 'PATCH',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        code: formValues.code,
                        discountPercentage: formValues.discountPercentage
                    })
                }
            );

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Code updated!',
                    timer: 1500,
                    showConfirmButton: false
                });
                this.loadDiscountCodes();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.message || 'Could not update.'
                });
            }
        } catch (e) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Network error.'
            });
        }
    },

    resetDiscountCodeAmount: async function (id) {
        const result = await Swal.fire({
            title: 'Reset discount amounts?',
            text: 'This will reset the saved amounts for this discount code.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, reset',
            confirmButtonColor: '#f59e0b'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(`${this.endpoints.resetDiscountCodeAmount}/${id}`),
                {
                    method: 'POST',
                    headers: this.getHeaders()
                }
            );

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Amounts reset!',
                    timer: 1500,
                    showConfirmButton: false
                });
                this.loadDiscountCodes();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.message || 'Could not reset amounts.'
                });
            }
        } catch (e) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Network error.'
            });
        }
    },

    deleteDiscountCode: async function (id) {
        const result = await Swal.fire({
            title: 'Delete Discount Code?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            confirmButtonColor: '#d33'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(`${this.endpoints.deleteDiscountCode}/${id}`),
                {
                    method: 'DELETE',
                    headers: this.getHeaders()
                }
            );

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    timer: 1500,
                    showConfirmButton: false
                });
                this.loadDiscountCodes();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.message || 'Could not delete.'
                });
            }
        } catch (e) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Network error.'
            });
        }
    },

    // =====================
    // --- Users Management ---
    // =====================
    loadUsers: async function () {
        const $container = $('#admin-users-container');

        const skeletonHtml = Array(6).fill(0).map(() => `
            <div class="user-skeleton">
                <div class="skel-row">
                    <div class="skel skel-avatar"></div>
                    <div class="skel-info">
                        <div class="skel" style="width:120px;height:13px;margin-bottom:7px;"></div>
                        <div class="skel" style="width:170px;height:11px;"></div>
                    </div>
                </div>
                <div class="skel-actions">
                    ${Array(6).fill('<div class="skel skel-btn"></div>').join('')}
                </div>
            </div>
        `).join('');

        $container.html(`
            <div class="um-header">
                <h2 class="um-title">Users Management</h2>
            </div>
            <div class="um-toolbar">
                <div class="um-search-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input type="text" id="user-search-input" placeholder="Search users…" class="form-control">
                </div>
            </div>
            <div class="um-skeleton-wrap">${skeletonHtml}</div>
        `);

        try {
            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.users), {
                headers: this.getHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                this.renderUsers(data.data || data);
            } else {
                $container.html(`<div class="um-error"><span>⚠</span> Could not load users.</div>`);
            }
        } catch (e) {
            $container.html(`<div class="um-error"><span>⚠</span> Network error: ${e.message}</div>`);
        }
    },

    renderUsers: function (users) {
        const $container = $('#admin-users-container');

        if (!users || users.length === 0) {
            $container.html(`
                <div class="um-header"><h2 class="um-title">Users Management</h2></div>
                <div class="um-empty">
                    <div class="um-empty-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <p>No users found.</p>
                </div>
            `);
            return;
        }

        let html = `
            <div class="um-header">
                <h2 class="um-title">
                    Users
                    <span class="um-title-count">${users.length}</span>
                </h2>
            </div>
            <div class="um-toolbar">
                <div class="um-search-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input type="text" id="user-search-input" placeholder="Search by name or email…" class="form-control">
                </div>
            </div>
            <div class="um-table-wrap">
            <table class="um-table" id="users-table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th class="um-hide-sm">Username</th>
                        <th class="um-hide-md">Phone</th>
                        <th class="um-hide-sm">Role</th>
                        <th>Status</th>
                        <th class="um-hide-lg">Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        users.forEach(user => {
            const userName    = user.userName    || '—';
            const email       = user.email       || '—';
            const fullName    = user.fullName    || '—';
            const phone       = user.phoneNumber || '—';
            const role        = (Array.isArray(user.roles) && user.roles[0]) || user.userRole || 'Customer';
            const createdDate = this.formatDate(user.createdAt || user.create_at);

            const isBlocked   = !!user.isBlocked || (user.status && user.status.toLowerCase() === 'blocked');
            const statusLabel = isBlocked ? 'Blocked' : 'Active';
            const isAdmin     = ['admin','superadmin'].includes(role.toLowerCase());
            const initials    = (fullName !== '—' ? fullName : userName)
                .split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'U';

            html += `
                <tr data-user-id="${user.id}">
                    <td>
                        <div class="um-user-cell">
                            <div class="um-avatar ${isAdmin ? 'um-avatar-admin' : ''}">${initials}</div>
                            <div class="um-user-info">
                                <div class="um-fullname">${fullName}</div>
                                <div class="um-email-sub">${email}</div>
                            </div>
                        </div>
                    </td>
                    <td class="um-hide-sm um-mono-text">${userName}</td>
                    <td class="um-hide-md">${phone}</td>
                    <td class="um-hide-sm">
                        <span class="um-role-badge ${isAdmin ? 'um-role-admin' : 'um-role-customer'}">${role}</span>
                    </td>
                    <td>
                        <span class="um-status-badge ${isBlocked ? 'um-status-blocked' : 'um-status-active'}">
                            <span class="um-status-dot"></span>${statusLabel}
                        </span>
                    </td>
                    <td class="um-hide-lg um-date-text">${createdDate}</td>
                    <td>
                        <div class="um-actions">
                            <button class="um-btn um-btn-view"     onclick="AdminDashboardManager.viewUserDetails('${user.id}')"            title="View Details">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                <span class="um-btn-label">View</span>
                            <button class="um-btn um-btn-delete"   onclick="AdminDashboardManager.deleteUser('${user.id}')"                  title="Delete">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                <span class="um-btn-label">Delete</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        $container.html(html);
        $('#user-search-input').on('input', function () {
            const q = $(this).val().toLowerCase().trim();
            $('#users-table tbody tr').each(function () {
                const name  = $(this).find('.um-fullname').text().toLowerCase();
                const email = $(this).find('.um-email-sub').text().toLowerCase();
                const uname = $(this).find('td:eq(1)').text().toLowerCase();
                $(this).toggle(!q || name.includes(q) || email.includes(q) || uname.includes(q));
            });
        });
    },

    _fetchUserFullDetails: async function(userId) {
        const url = API_CONFIG.getApiUrl(this.endpoints.getUserFullDetails + '/' + userId);

        const response = await fetch(url, { headers: this.getHeaders() });

        let json;
        try { json = await response.json(); } catch(e) { json = {}; }

        if (!response.ok) {
            const msg = json.message || json.title || ('Server returned ' + response.status);
            throw new Error(msg);
        }

        let user = null;
        if (json && typeof json === 'object') {
            if (json.success === true && json.data && json.data.id) {
                user = json.data;
            } else if (json.data && typeof json.data === 'object' && json.data.id) {
                user = json.data;
            } else if (json.id) {
                user = json;
            }
        }

        if (!user || !user.id) {
            console.error('[UM] Unexpected response shape:', json);
            throw new Error('No user data in response.');
        }

        user._isBlocked = !!user.isBlocked || (user.status && user.status.toLowerCase() === 'blocked');

        return user;
    },

    viewUserDetails: async function(userId) {        
        $('#um-details-overlay').remove();
        const loadingHtml = `
            <div id="um-details-overlay" class="um-overlay um-overlay-visible">
                <div class="um-modal um-modal-details">
                    <div class="um-modal-loading">
                        <div class="um-spinner-ring"></div>
                        <span>Loading user details…</span>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(loadingHtml);
        
        try {
            const user = await this._fetchUserFullDetails(userId);
            this._showUserDetailsModal(user);
        } catch (e) {
            console.error('[UM] Error fetching user details:', e);
            $('#um-details-overlay').remove();
            await Swal.fire({ 
                icon: 'error', 
                title: 'Could not load details', 
                text: e.message 
            });
        }
    },

    _showUserDetailsModal: function(user) {
        const role        = Array.isArray(user.roles) ? user.roles.join(', ') : (user.userRole || '—');
        const ordersCount = Array.isArray(user.orders) ? user.orders.length : 0;
        const city        = user.city   || '—';
        const street      = user.street || '—';

        const isBlocked   = user._isBlocked || (user.status && user.status.toLowerCase() === 'blocked');
        const statusText  = isBlocked ? 'Blocked' : 'Active';
        const statusClass = isBlocked ? 'um-status-blocked' : 'um-status-active';

        const initials = (user.fullName || user.userName || 'U')
            .split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

        const isAdmin = ['admin', 'superadmin'].includes(role.toLowerCase());

        const detailCards = [
            { icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`, color: 'blue',   label: 'Username',     value: user.userName || '—' },
            { icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.18 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.29 6.29l.83-.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`, color: 'purple', label: 'Phone',        value: user.phoneNumber || '—' },
            { icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`, color: 'teal',   label: 'City',         value: city },
            { icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`, color: 'orange', label: 'Street',       value: street },
            { icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`, color: 'green',  label: 'Total Orders', value: ordersCount },
        ].map(c => `
            <div class="um-detail-card">
                <div class="um-detail-icon um-icon-${c.color}">${c.icon}</div>
                <div>
                    <div class="um-detail-label">${c.label}</div>
                    <div class="um-detail-value">${c.value}</div>
                </div>
            </div>
        `).join('');

        const ordersHtml = ordersCount > 0 ? `
            <div class="um-section-title" style="margin-top:20px;">Orders <span class="um-count-pill">${ordersCount}</span></div>
            <div class="um-orders-list">
                ${user.orders.map(o => `
                    <div class="um-order-row">
                        <span class="um-order-id">#${o.id || o.orderId || '—'}</span>
                        <span class="um-order-status um-os-${(o.status||'').toLowerCase()}">${o.status || '—'}</span>
                        <span class="um-order-total">${o.totalAmount != null ? 'ILS ' + Number(o.totalAmount).toFixed(2) : '—'}</span>
                    </div>
                `).join('')}
            </div>
        ` : '';

        const modalHtml = `
            <div id="um-details-overlay" class="um-overlay" onclick="if(event.target===this)AdminDashboardManager._closeDetailsModal()">
                <div class="um-modal um-modal-details">
                    <button class="um-modal-close" onclick="AdminDashboardManager._closeDetailsModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>

                    <div class="um-modal-hero">
                        <div class="um-hero-avatar-wrap">
                            <div class="um-hero-avatar ${isAdmin ? 'um-avatar-admin' : ''}">${initials}</div>
                            <div class="um-hero-status-dot ${statusClass}"></div>
                        </div>
                        <div class="um-hero-info">
                            <div class="um-hero-name">${user.fullName || '—'}</div>
                            <div class="um-hero-email">${user.email || '—'}</div>
                            <div class="um-hero-badges">
                                <span class="um-role-badge ${isAdmin ? 'um-role-admin' : 'um-role-customer'}">${role}</span>
                                <span class="um-status-badge ${statusClass}"><span class="um-status-dot"></span>${statusText}</span>
                            </div>
                        </div>
                    </div>

                    <div class="um-divider"></div>

                    <div class="um-modal-body">
                        <div class="um-section-title">Account Information</div>
                        <div class="um-detail-grid">${detailCards}</div>

                        <div class="um-id-card">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                            <span class="um-id-label">User ID</span>
                            <span class="um-id-value" title="${user.id || ''}">${user.id || '—'}</span>
                        </div>

                        ${ordersHtml}
                    </div>

                    <div class="um-modal-footer">
                        <div class="um-footer-actions">
                            <button class="um-btn um-btn-view-modal" onclick="AdminDashboardManager._closeDetailsModal(); AdminDashboardManager.editProfileModal('${user.id}')">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                                Edit Profile
                            </button>
                            ${!isBlocked
                                ? `<button class="um-btn um-btn-block-modal" onclick="AdminDashboardManager._closeDetailsModal(); AdminDashboardManager.blockUserModal('${user.id}')" title="Block User">
                                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                       Block
                                   </button>`
                                : `<button class="um-btn um-btn-unblock-modal" onclick="AdminDashboardManager._closeDetailsModal(); AdminDashboardManager.unblockUser('${user.id}')" title="Unblock">
                                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                                       Unblock
                                   </button>`
                            }
                        </div>
                        <div class="um-footer-secondary">
                            <button class="um-btn um-btn-small um-btn-role-modal" onclick="AdminDashboardManager._closeDetailsModal(); AdminDashboardManager.changeRoleModal('${user.id}', '${role}')" title="Change Role">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
                                Role
                            </button>
                            <button class="um-btn um-btn-small um-btn-password-modal" onclick="AdminDashboardManager._closeDetailsModal(); AdminDashboardManager._closeDetailsModal(); AdminDashboardManager.changePasswordModal('${user.id}')" title="Change Password">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                                Password
                            </button>
                            <button class="um-btn um-btn-small um-btn-close-modal" onclick="AdminDashboardManager._closeDetailsModal()">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove old modal if exists
        $('#um-details-overlay').remove();
        
        // Append new modal HTML
        $('body').append(modalHtml);
        
        // Verify modal was added
        const $overlay = $('#um-details-overlay');
        if ($overlay.length === 0) {
            console.error('[UM] ERROR: Modal overlay not found in DOM after append');
            alert('Error: Could not display modal');
            return;
        }
        
        console.log('[UM] Modal appended to DOM successfully');
        
        requestAnimationFrame(() => {
            $overlay[0].style.setProperty('display', 'flex', 'important');
            $overlay[0].style.setProperty('visibility', 'visible', 'important');
            $overlay[0].style.setProperty('opacity', '0', 'important');
            
            void $overlay[0].offsetHeight;
            
            // Now add the visible class which will toggle opacity to 1
            $overlay.addClass('um-overlay-visible');
            
            $overlay[0].style.setProperty('opacity', '1', 'important');
        });
        
        // Handle escape key
        $(document).one('keydown.umdetails', e => { 
            if (e.key === 'Escape') AdminDashboardManager._closeDetailsModal(); 
        });
    },

    _closeDetailsModal: function() {
        const $o = $('#um-details-overlay');
        $o.removeClass('um-overlay-visible');
        setTimeout(() => $o.remove(), 280);
        $(document).off('keydown.umdetails');
    },

    checkIsBlocked: async function(userId) {
        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(this.endpoints.isBlocked + '/' + userId),
                { headers: this.getHeaders() }
            );
            if (response.ok) {
                const json = await response.json();
                // Handle both {data:{isBlocked}} and {isBlocked} and status string
                if (json.data?.isBlocked !== undefined) return !!json.data.isBlocked;
                if (json.isBlocked !== undefined) return !!json.isBlocked;
                if (json.data?.status) return json.data.status.toLowerCase() === 'blocked';
                if (json.status) return json.status.toLowerCase() === 'blocked';
            }
        } catch (e) { console.error('checkIsBlocked:', e); }
        return false;
    },

    blockUserModal: async function(userId) {
        const { value: days } = await Swal.fire({
            title: 'Block User',
            input: 'number',
            inputLabel: 'Block Duration (days)',
            inputValue: '1',
            inputAttributes: { min: 1, max: 365, step: 1 },
            showCancelButton: true,
            confirmButtonText: 'Block User',
            confirmButtonColor: '#f59e0b',
            customClass: { popup: 'um-swal-popup' },
            inputValidator: v => {
                if (!v || parseInt(v) < 1) return 'Enter at least 1 day.';
                if (parseInt(v) > 365)    return 'Maximum is 365 days.';
            }
        });
        if (days !== undefined && days !== null) {
            await this.blockUser(userId, parseInt(days));
        }
    },

    blockUser: async function(userId, days) {
        try {
            const url = API_CONFIG.getApiUrl(this.endpoints.blockUser + '/' + userId + '?days=' + (days || 1));
            const response = await fetch(url, { method: 'PATCH', headers: this.getHeaders() });
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'User Blocked', text: `Blocked for ${days} day(s).`, timer: 1800, showConfirmButton: false });
                this.loadUsers();
            } else {
                const err = await response.json().catch(() => ({}));
                await Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not block user.' });
            }
        } catch (e) {
            await Swal.fire({ icon: 'error', title: 'Error', text: 'Network error: ' + e.message });
        }
    },

    unblockUser: function(userId) {
        $('#um-confirm-overlay').remove();

        $('body').append(`
            <div id="um-confirm-overlay" class="um-overlay" onclick="if(event.target===this)AdminDashboardManager._closeConfirmModal()">
                <div class="um-modal um-modal-confirm">
                    <button class="um-modal-close" onclick="AdminDashboardManager._closeConfirmModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                    <div class="um-confirm-body">
                        <div class="um-confirm-icon um-confirm-icon-success">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                <polyline points="9 12 11 14 15 10"/>
                            </svg>
                        </div>
                        <div class="um-confirm-title">Unblock User?</div>
                        <div class="um-confirm-text">This will restore full account access immediately.</div>
                    </div>
                    <div class="um-modal-footer um-confirm-footer">
                        <button class="um-modal-btn um-btn-cancel-modal" onclick="AdminDashboardManager._closeConfirmModal()">Cancel</button>
                        <button class="um-modal-btn um-btn-confirm-success" onclick="AdminDashboardManager._doUnblock('${userId}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Yes, Unblock
                        </button>
                    </div>
                </div>
            </div>
        `);

        requestAnimationFrame(() => $('#um-confirm-overlay').addClass('um-overlay-visible'));
        $(document).one('keydown.umconfirm', e => { if (e.key === 'Escape') AdminDashboardManager._closeConfirmModal(); });
    },

    _closeConfirmModal: function() {
        const $o = $('#um-confirm-overlay');
        $o.removeClass('um-overlay-visible');
        setTimeout(() => $o.remove(), 280);
        $(document).off('keydown.umconfirm');
    },

    _doUnblock: async function(userId) {
        this._closeConfirmModal();
        try {
            const url = API_CONFIG.getApiUrl(this.endpoints.unBlockUser + '/' + userId);
            const response = await fetch(url, { method: 'PATCH', headers: this.getHeaders() });
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'User Unblocked', text: 'Account access restored.', timer: 1800, showConfirmButton: false });
                this.loadUsers();
            } else {
                const err = await response.json().catch(() => ({}));
                await Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not unblock user.' });
            }
        } catch (e) {
            await Swal.fire({ icon: 'error', title: 'Error', text: 'Network error: ' + e.message });
        }
    },

    changeRoleModal: async function(userId, currentRole) {
        const { value: newRole } = await Swal.fire({
            title: 'Change User Role',
            input: 'select',
            inputOptions: { 'Customer': 'Customer', 'Admin': 'Admin', 'SuperAdmin': 'SuperAdmin' },
            inputValue: currentRole,
            showCancelButton: true,
            confirmButtonText: 'Update Role',
            confirmButtonColor: '#4f6ef7',
            customClass: { popup: 'um-swal-popup' }
        });
        if (!newRole) return;
        if (newRole === currentRole) {
            await Swal.fire({ icon: 'info', title: 'No Change', text: `Role is already ${currentRole}.`, timer: 1500, showConfirmButton: false });
            return;
        }
        await this.changeUserRole(userId, newRole);
    },

    changeUserRole: async function(userId, newRole) {
        try {
            const url = API_CONFIG.getApiUrl(this.endpoints.changeUserRole + '/' + userId);
            const response = await fetch(url, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({ newRole })
            });
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Role Updated', text: `Changed to ${newRole}.`, timer: 1800, showConfirmButton: false });
                this.loadUsers();
            } else {
                const err = await response.json().catch(() => ({}));
                await Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not change role.' });
            }
        } catch (e) {
            await Swal.fire({ icon: 'error', title: 'Error', text: 'Network error: ' + e.message });
        }
    },

    editProfileModal: async function(userId) {
        
        $('#um-edit-overlay').remove();
        const loadingHtml = `
            <div id="um-edit-overlay" class="um-overlay um-overlay-visible">
                <div class="um-modal um-modal-edit">
                    <div class="um-modal-loading">
                        <div class="um-spinner-ring"></div>
                        <span>Loading profile…</span>
                    </div>
                </div>
            </div>
        `;
        $('body').append(loadingHtml);

        let user = {};
        try {
            user = await this._fetchUserFullDetails(userId);
        } catch (e) {
            console.error('[UM] Error fetching user details for edit:', e.message);
            $('#um-edit-overlay').remove();
            await Swal.fire({ 
                icon: 'error', 
                title: 'Error', 
                text: 'Could not load user profile: ' + e.message 
            });
            return;
        }

        const isAdmin = Array.isArray(user.roles) && ['admin','superadmin'].includes(user.roles[0]);
        const initials = ((user.fullName || user.userName || 'U')
            .split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()) || 'U';
       
        const formHtml = `
            <div id="um-edit-overlay" class="um-overlay um-overlay-visible" onclick="if(event.target===this)AdminDashboardManager._closeEditModal()">
                <div class="um-modal um-modal-edit">
                    <button class="um-modal-close" onclick="AdminDashboardManager._closeEditModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>

                    <div class="um-modal-hero um-edit-hero">
                        <div class="um-hero-avatar ${isAdmin ? 'um-avatar-admin' : ''}">${initials}</div>
                        <div>
                            <div class="um-hero-name" style="font-size:16px;">${this._esc(user.fullName || user.userName || 'Edit User')}</div>
                            <div class="um-hero-email">${this._esc(user.email || '')}</div>
                        </div>
                    </div>

                    <div class="um-divider"></div>

                    <div class="um-modal-body">
                        <div class="um-form-grid">
                            <div class="um-form-field um-form-full">
                                <label class="um-form-label" for="ep-fullName">Full Name <span class="um-required">*</span></label>
                                <div class="um-input-wrap">
                                    <svg class="um-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    <input id="ep-fullName" class="um-input" type="text" placeholder="Enter full name" value="${this._esc(user.fullName || '')}">
                                </div>
                            </div>
                            <div class="um-form-field um-form-full">
                                <label class="um-form-label" for="ep-phone">Phone Number</label>
                                <div class="um-input-wrap">
                                    <svg class="um-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.18 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.29 6.29l.83-.83a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                    <input id="ep-phone" class="um-input" type="tel" placeholder="Enter phone number" value="${this._esc(user.phoneNumber || '')}">
                                </div>
                            </div>
                            <div class="um-form-field">
                                <label class="um-form-label" for="ep-city">City</label>
                                <div class="um-input-wrap">
                                    <svg class="um-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    <input id="ep-city" class="um-input" type="text" placeholder="City" value="${this._esc(user.city || '')}">
                                </div>
                            </div>
                            <div class="um-form-field">
                                <label class="um-form-label" for="ep-street">Street</label>
                                <div class="um-input-wrap">
                                    <svg class="um-input-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                    <input id="ep-street" class="um-input" type="text" placeholder="Street address" value="${this._esc(user.street || '')}">
                                </div>
                            </div>
                        </div>
                        <div id="um-edit-error" class="um-form-error" style="display:none;"></div>
                    </div>

                    <div class="um-modal-footer">
                        <button class="um-modal-btn um-btn-cancel-modal" onclick="AdminDashboardManager._closeEditModal()">Cancel</button>
                        <button class="um-modal-btn um-btn-save-modal" id="um-edit-save-btn" onclick="AdminDashboardManager._doEditProfile('${userId}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;

        $('#um-edit-overlay').remove();
        $('body').append(formHtml);
        
        // Ensure modal visibility with proper inline styles
        requestAnimationFrame(() => {
            const editOverlay = document.getElementById('um-edit-overlay');
            if (editOverlay) {
                // Set with !important to ensure styles apply
                editOverlay.style.setProperty('display', 'flex', 'important');
                editOverlay.style.setProperty('visibility', 'visible', 'important');
                editOverlay.style.setProperty('opacity', '1', 'important');
                editOverlay.style.setProperty('pointer-events', 'auto', 'important');
            }
        });
        
        // Wait for DOM to render and then populate data
        setTimeout(() => {
            
            // Set and verify each field's value
            const fullNameInput = document.getElementById('ep-fullName');
            const phoneInput = document.getElementById('ep-phone');
            const cityInput = document.getElementById('ep-city');
            const streetInput = document.getElementById('ep-street');
            
            if (fullNameInput) {
                fullNameInput.value = user.fullName || '';
            }
            if (phoneInput) {
                phoneInput.value = user.phoneNumber || '';
            }
            if (cityInput) {
                cityInput.value = user.city || '';
            }
            if (streetInput) {
                streetInput.value = user.street || '';
            }
            
            const inputFields = document.querySelectorAll('.um-input');
            inputFields.forEach(field => {
                field.addEventListener('focus', function() {
                    this.select();
                });
                
                if (field.value) {
                    field.classList.add('um-input-filled');
                }
            });
            
            // Focus first field for easy editing
            if (fullNameInput) {
                fullNameInput.focus();
                fullNameInput.select();
            }
        }, 150);
        
        $(document).one('keydown.umedit', e => { 
            if (e.key === 'Escape') AdminDashboardManager._closeEditModal(); 
        });
    },

    _esc: function(str) {
        return String(str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    },

    _closeEditModal: function() {
        const $o = $('#um-edit-overlay');
        $o.removeClass('um-overlay-visible');
        setTimeout(() => $o.remove(), 280);
        $(document).off('keydown.umedit');
    },

    _doEditProfile: async function(userId) {
        const fullName = document.getElementById('ep-fullName')?.value.trim();
        const phone    = document.getElementById('ep-phone')?.value.trim()  || null;
        const city     = document.getElementById('ep-city')?.value.trim()   || null;
        const street   = document.getElementById('ep-street')?.value.trim() || null;

        const $error = $('#um-edit-error');
        const $btn   = $('#um-edit-save-btn');

        if (!fullName) {
            $error.text('Full Name is required.').show();
            document.getElementById('ep-fullName')?.focus();
            return;
        }
        $error.hide();
        $btn.prop('disabled', true).html(`
            <svg class="um-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Saving…
        `);

        const success = await this.updateUserProfile(userId, { fullName, phoneNumber: phone, city, street });

        $btn.prop('disabled', false).html(`
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save Changes
        `);
    },

    updateUserProfile: async function(userId, profileData) {
        try {
            // ✅ Endpoint: PUT /api/Admin/Users/{userId}
            const url = API_CONFIG.getApiUrl(this.endpoints.updateUserProfile + '/' + userId);
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(profileData)
            });
            
            if (response.ok) {
                const responseData = await response.json().catch(() => ({}));
                
                this._closeEditModal();
                await Swal.fire({ 
                    icon: 'success', 
                    title: 'Profile Updated', 
                    text: 'User profile saved successfully',
                    timer: 1800, 
                    showConfirmButton: false 
                });
                this.loadUsers();
                return true;
            } else {
                const err = await response.json().catch(() => ({}));
                const errorMsg = err.message || 'Could not update profile.';
                $('#um-edit-error').text(errorMsg).show();
                return false;
            }
        } catch (e) {
            $('#um-edit-error').text('Network error: ' + e.message).show();
            return false;
        }
    },

    changePasswordModal: async function(userId) {
        const { value: formValues } = await Swal.fire({
            title: 'Change Password',
            html: `
                <div class="um-swal-form">
                    <div class="um-swal-field">
                        <label>New Password <span style="color:#dc2626">*</span></label>
                        <input id="swal-np" class="swal2-input" type="password" placeholder="Min. 6 characters">
                    </div>
                    <div class="um-swal-field">
                        <label>Confirm Password <span style="color:#dc2626">*</span></label>
                        <input id="swal-cp" class="swal2-input" type="password" placeholder="Repeat password">
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Change Password',
            confirmButtonColor: '#0d9488',
            customClass: { popup: 'um-swal-popup' },
            preConfirm: () => {
                const np = document.getElementById('swal-np').value;
                const cp = document.getElementById('swal-cp').value;
                if (!np || np.length < 6) { Swal.showValidationMessage('Minimum 6 characters.'); return false; }
                if (np !== cp)            { Swal.showValidationMessage('Passwords do not match.'); return false; }
                return { newPassword: np };
            }
        });
        if (formValues) await this.changeUserPassword(userId, formValues.newPassword);
    },

    changeUserPassword: async function(userId, newPassword) {
        try {
            const url = API_CONFIG.getApiUrl(this.endpoints.changeUserPassword + '/' + userId);
            const response = await fetch(url, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({ newPassword })
            });
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Password Changed', timer: 1800, showConfirmButton: false });
            } else {
                const err = await response.json().catch(() => ({}));
                await Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not change password.' });
            }
        } catch (e) {
            await Swal.fire({ icon: 'error', title: 'Error', text: 'Network error: ' + e.message });
        }
    },

    deleteUser: async function(userId) {
        const result = await Swal.fire({
            title: 'Delete User?',
            text: 'This cannot be undone. All user data will be permanently removed.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Delete',
            confirmButtonColor: '#dc2626',
            customClass: { popup: 'um-swal-popup' }
        });
        if (!result.isConfirmed) return;

        try {
            const url = API_CONFIG.getApiUrl(this.endpoints.deleteUser + '/' + userId);
            const response = await fetch(url, { method: 'DELETE', headers: this.getHeaders() });
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'User Deleted', timer: 1800, showConfirmButton: false });
                this.loadUsers();
            } else {
                const err = await response.json().catch(() => ({}));
                await Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not delete user.' });
            }
        } catch (e) {
            await Swal.fire({ icon: 'error', title: 'Error', text: 'Network error: ' + e.message });
        }
    },


    // ====================
    // --- Social Media ---
    // ====================

    loadSocialMedia: async function () {
        const $container = $('#admin-SocialMedia-container'); // ← fixed: was '#admin-SocialMedia-container'

        // Skeleton loading state
        const skeletonHtml = Array(4).fill(0).map(() => `
            <div class="sm-skeleton">
                <div class="sm-skel-icon"></div>
                <div class="sm-skel-body">
                    <div class="sm-skel-line w70"></div>
                    <div class="sm-skel-line w45"></div>
                </div>
            </div>
        `).join('');

        $container.html(`
            <div class="sm-panel">
                <div class="sm-header">
                    <div>
                        <h2 class="sm-header-title">Social <span>Media</span></h2>
                        <div class="sm-header-meta">Loading platforms…</div>
                    </div>
                </div>
                <div class="sm-grid">${skeletonHtml}</div>
            </div>
        `);

        try {
            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.socialMedia), {
                headers: this.getHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                this.renderSocialMedia(data.data || data);
            } else {
                $container.html(`
                    <div class="sm-panel">
                        <div class="sm-header">
                            <div>
                                <h2 class="sm-header-title">Social <span>Media</span></h2>
                                <div class="sm-header-meta">Could not load platforms</div>
                            </div>
                            <button class="btn-sm-new" onclick="AdminDashboardManager.openSocialMediaModal()">
                                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                New Platform
                            </button>
                        </div>
                        <div style="color:#e55;font-size:13px;padding:20px 0;">Could not load social media platforms.</div>
                    </div>
                `);
            }
        } catch (e) {
            $container.html(`
                <div class="sm-panel">
                    <div class="sm-header">
                        <div>
                            <h2 class="sm-header-title">Social <span>Media</span></h2>
                            <div class="sm-header-meta">Error loading platforms</div>
                        </div>
                        <button class="btn-sm-new" onclick="AdminDashboardManager.openSocialMediaModal()">
                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            New Platform
                        </button>
                    </div>
                    <div style="color:#e55;font-size:13px;padding:20px 0;">Error loading social media.</div>
                </div>
            `);
        }
    },

    renderSocialMedia: function (items) {
        const $container = $('#admin-SocialMedia-container');
        const total  = items ? items.length : 0;
        const active = items ? items.filter(i => i.isActive !== false).length : 0;

        let html = `
        <div class="sm-panel">
            <div class="sm-header">
                <div>
                    <h2 class="sm-header-title">Social <span>Media</span></h2>
                    <div class="sm-header-meta">${total} platform${total !== 1 ? 's' : ''} configured</div>
                </div>
                <button class="btn-sm-new" onclick="AdminDashboardManager.openSocialMediaModal()">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    New Platform
                </button>
            </div>
        `;

        // ── Only render toolbar + grid when there is data ─────────────────────
        if (!items || items.length === 0) {
            html += `
            <div class="sm-empty">
                <h4>No Platforms Yet</h4>
                <p>Add your first social media link to get started.</p>
                <button class="btn-sm-new" style="margin-top:16px;" onclick="AdminDashboardManager.openSocialMediaModal()">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add First Platform
                </button>
            </div>
            `;
        } else {
            html += `
            <div class="sm-toolbar">
                <div class="sm-search-wrap">
                    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input class="sm-search" id="sm-search-input" type="text"
                        placeholder="Search by name or URL…"
                        oninput="AdminDashboardManager.filterSocialMedia()">
                </div>
                <select class="sm-filter-select" id="sm-filter-status"
                    onchange="AdminDashboardManager.filterSocialMedia()">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            <div class="sm-grid" id="sm-grid">
            `;

            items.forEach(item => {
                const isActive = (item.status || item.Status || '').toLowerCase() === 'active';
                const name     = item.name  || item.Name  || 'Untitled';
                const links    = item.links || item.Links || '';
                const imageUrl = item.imageUrl || item.image || item.Image || '';
                const id       = item.id || item.Id;

                const imgBlock = imageUrl
                    ? `<img src="${imageUrl}" alt="${name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                    : '';
                const placeholderStyle = imageUrl ? 'style="display:none"' : '';

                html += `
                    <div class="sm-card"
                        data-name="${name.toLowerCase()}"
                        data-links="${links.toLowerCase()}"
                        data-active="${isActive}">

                        <div class="sm-card-img">
                            ${imgBlock}
                            <div class="sm-card-img-placeholder" ${placeholderStyle}>
                                <span>${name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div class="sm-status-pill ${isActive ? 'active' : 'inactive'}">
                                ${isActive ? '● Active' : '○ Inactive'}
                            </div>
                        </div>

                        <div class="sm-card-body">
                            <div class="sm-card-top">
                                <h4 class="sm-card-name">${name}</h4>
                                <span class="sm-card-id">#${id}</span>
                            </div>
                            ${links
                                ? `<a class="sm-card-link" href="${links}" target="_blank" rel="noopener" title="${links}">
                                    ${links}
                                </a>`
                                : `<span class="sm-card-link no-link">No URL set</span>`
                            }
                        </div>

                        <div class="sm-card-footer">
                            <button class="btn-sm-edit" onclick="AdminDashboardManager.openSocialMediaModal(${id})">
                                Edit
                            </button>
                            <button class="btn-sm-edit btn-sm-delete"
                                onclick="AdminDashboardManager.deleteSocialMedia(${id}, '${name.replace(/'/g, "\\'")}')"
                                title="Delete platform">
                                Delete
                            </button>
                            <label class="sm-card-toggle status-toggle" title="Toggle Status"
                                onclick="event.preventDefault(); AdminDashboardManager.toggleSocialMediaStatus(${id})">
                                <span style="font-size:11px;margin-right:2px;font-weight:600;color:#555;">
                                    ${isActive ? 'Active' : 'Inactive'}
                                </span>
                                <input type="checkbox" ${isActive ? 'checked' : ''}>
                                <span class="sm-card-toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                `;
            });

            html += `</div>`; // close #sm-grid
        }

        html += `</div>`; // close .sm-panel
        $container.html(html);
    },

    filterSocialMedia: function () {
        const query  = (document.getElementById('sm-search-input')?.value || '').toLowerCase();
        const status = document.getElementById('sm-filter-status')?.value || 'all';
        document.querySelectorAll('#sm-grid .sm-card').forEach(card => {
            const name   = card.dataset.name  || '';
            const links  = card.dataset.links || '';
            const active = card.dataset.active === 'true';
            const matchQ = !query  || name.includes(query) || links.includes(query);
            const matchS = status === 'all'
                || (status === 'active'   &&  active)
                || (status === 'inactive' && !active);
            card.style.display = (matchQ && matchS) ? '' : 'none';
        });
    },

    openSocialMediaModal: async function (id = null) {
        let item = null;
        if (id) {
            try {
                const response = await fetch(
                    API_CONFIG.getApiUrl(`${this.endpoints.getSocialMediaById}/${id}`),
                    { headers: this.getHeaders() }
                );
                if (response.ok) {
                    const data = await response.json();
                    item = data.data || data;
                }
            } catch (e) {}
        }

        const existingImage = item?.imageUrl || item?.image || item?.Image || '';
        const existingName  = item?.name  || item?.Name  || '';
        const existingLinks = item?.links || item?.Links || '';

        const { value: formValues } = await Swal.fire({
            title: '',
            width: '520px',
            padding: '0',
            background: '#fff',
            html: `
                <div class="sm-swal-form" style="padding:28px 28px 4px;">

                    <!-- Modal header -->
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                        <div>
                            <div style="font-family:'DM Sans',sans-serif;font-size:20px;font-weight:800;color:#111;letter-spacing:-0.3px;">
                                ${id ? 'Edit' : 'New'} <span style="color:#c96;">Social Media</span>
                            </div>
                            <div style="font-size:11px;color:#aaa;margin-top:2px;">
                                ${id ? `Editing platform #${id}` : 'Add a new social media platform'}
                            </div>
                        </div>

                    </div>

                    <!-- Image upload — reuses .af-img-upload from ads CSS -->
                    <div class="af-section-title" style="margin-top:0;">Platform Icon / Image</div>
                    <div class="af-img-upload ${existingImage ? 'has-image' : ''}" id="sm-img-upload-box">
                        <input type="file" id="sm-image-file" accept="image/*">
                        <img class="af-img-preview" id="sm-img-preview"
                            src="${existingImage}"
                            style="${existingImage ? 'display:block' : 'display:none'}">
                        <div class="af-img-placeholder" id="sm-img-placeholder"
                            style="${existingImage ? 'display:none' : ''}">
                            <div class="af-upload-label">Click to upload icon</div>
                            <div class="af-upload-sub">PNG, JPG, SVG, WebP — recommended 64×64</div>
                        </div>
                        <div class="af-img-overlay">
                            <span>Change Image</span>
                        </div>
                        <button class="af-img-remove" type="button" title="Remove image"
                            onclick="event.stopPropagation(); AdminDashboardManager._clearSocialMediaImage()">
                        </button>
                    </div>

                    <!-- Platform details -->
                    <div class="af-section-title">Platform Details</div>
                    <div class="af-group">
                        <label>Platform Name <span style="color:#c96;">*</span></label>
                        <input id="sm-input-name" class="af-input"
                            placeholder="e.g. Instagram, Facebook, TikTok"
                            value="${existingName}">
                    </div>
                    <div class="af-group" style="margin-top:12px;">
                        <label>Profile / Page URL <span style="color:#c96;">*</span></label>
                        <input id="sm-input-links" class="af-input"
                            placeholder="https://..."
                            value="${existingLinks}">
                    </div>

                    <div style="height:20px;"></div>
                </div>
            `,
            didOpen: () => {
                const fileInput   = document.getElementById('sm-image-file');
                const previewImg  = document.getElementById('sm-img-preview');
                const placeholder = document.getElementById('sm-img-placeholder');
                const uploadBox   = document.getElementById('sm-img-upload-box');

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
            confirmButtonText: id ? '✓ Save Changes' : '+ Add Platform',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#111',
            preConfirm: () => {
                const name  = document.getElementById('sm-input-name')?.value.trim()  || '';
                const links = document.getElementById('sm-input-links')?.value.trim() || '';

                if (!name) {
                    Swal.showValidationMessage('Platform name is required');
                    return false;
                }
                if (!links) {
                    Swal.showValidationMessage('URL is required');
                    return false;
                }
                if (!/^https?:\/\/.+/.test(links)) {
                    Swal.showValidationMessage('URL must start with http:// or https://');
                    return false;
                }

                const fileInput  = document.getElementById('sm-image-file');
                const imageFile  = fileInput?.files?.[0] || null;
                const previewImg = document.getElementById('sm-img-preview');
                const imageUrl   = (!imageFile && previewImg?.src && !previewImg.src.startsWith('data:'))
                    ? previewImg.src : '';

                return { name, links, imageFile, imageUrl };
            }
        });

        if (formValues) {
            if (id) {
                await this.updateSocialMedia(id, formValues);
            } else {
                await this.addSocialMedia(formValues);
            }
        }
    },

    _clearSocialMediaImage: function () {
        const fileInput   = document.getElementById('sm-image-file');
        const previewImg  = document.getElementById('sm-img-preview');
        const placeholder = document.getElementById('sm-img-placeholder');
        const uploadBox   = document.getElementById('sm-img-upload-box');
        if (fileInput)   fileInput.value = '';
        if (previewImg)  { previewImg.src = ''; previewImg.style.display = 'none'; }
        if (placeholder) placeholder.style.display = '';
        if (uploadBox)   uploadBox.classList.remove('has-image');
    },

    _buildSocialMediaFormData: function (fields) {
        const fd = new FormData();
        fd.append('Name',  fields.name);
        fd.append('Links', fields.links);
        if (fields.imageFile) {
            fd.append('Image', fields.imageFile, fields.imageFile.name);
        } else if (fields.imageUrl) {
            fd.append('Image', fields.imageUrl);
        }
        return fd;
    },

    addSocialMedia: async function (fields) {
        try {
            const formData = this._buildSocialMediaFormData(fields);
            const response = await fetch(API_CONFIG.getApiUrl(this.endpoints.addSocialMedia), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.getToken()}` },
                body: formData
            });
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Platform added!', timer: 1500, showConfirmButton: false });
                this.loadSocialMedia();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not add platform.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    updateSocialMedia: async function (id, fields) {
        try {
            const formData = this._buildSocialMediaFormData(fields);
            const response = await fetch(API_CONFIG.getApiUrl(`${this.endpoints.updateSocialMedia}/${id}`), {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${this.getToken()}` },
                body: formData
            });
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Platform updated!', timer: 1500, showConfirmButton: false });
                this.loadSocialMedia();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not update platform.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    toggleSocialMediaStatus: async function (id) {
        const result = await Swal.fire({
            title: 'Toggle Status?',
            text: 'This will activate or deactivate the platform.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, toggle it',
            confirmButtonColor: '#c96',
        });
        if (!result.isConfirmed) return;
        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(`${this.endpoints.toggleSocialMedia}/${id}`),
                { method: 'PATCH', headers: this.getHeaders() }
            );
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Status updated!', timer: 1500, showConfirmButton: false });
                this.loadSocialMedia();
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: 'Could not toggle status.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    deleteSocialMedia: async function (id, name) {
        const result = await Swal.fire({
            title: 'Delete Platform?',
            text: `This will permanently remove "${name}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
        });
        if (!result.isConfirmed) return;
        try {
            const response = await fetch(API_CONFIG.getApiUrl(`${this.endpoints.deleteSocialMedia}?id=${id}`),
                { method: 'DELETE', headers: this.getHeaders() }
            );
            if (response.ok) {
                await Swal.fire({ icon: 'success', title: 'Platform deleted!', timer: 1500, showConfirmButton: false });
                this.loadSocialMedia();
            } else {
                const err = await response.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not delete platform.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    // ======================
    // --- Colors & Sizes ---
    // ======================

    loadColorsAndSizes: async function () {
        const $container = $('#admin-colors-sizes-container');
        if (!$container.length) {
            console.error('[ColorsAndSizes] Container #admin-colors-sizes-container not found.');
            return;
        }

        $container.html(`
            <div class="cs-panel">
                <div class="cs-header">
                    <div>
                        <h2 class="cs-header-title">Colors <span>&</span> Sizes</h2>
                        <div class="cs-header-meta">Loading…</div>
                    </div>
                </div>
                <div class="cs-tabs">
                    <button class="cs-tab cs-tab--active" data-tab="colors">
                        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
                        </svg>
                        Colors
                    </button>
                    <button class="cs-tab" data-tab="sizes">
                        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M21 6H3M16 12H3M11 18H3"/>
                        </svg>
                        Sizes
                    </button>
                </div>
                <div class="cs-skeleton-grid">
                    ${Array(6).fill(0).map(() => `
                        <div class="cs-skeleton-row">
                            <div class="cs-skel-circle"></div>
                            <div class="cs-skel-line w60"></div>
                            <div class="cs-skel-line w30" style="margin-left:auto"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `);

        try {
            const [colorsResp, sizesResp] = await Promise.all([
                fetch(API_CONFIG.getApiUrl(this.endpoints.getAllColors), { headers: this.getHeaders() }),
                fetch(API_CONFIG.getApiUrl(this.endpoints.getAllSizes),  { headers: this.getHeaders() })
            ]);

            const colorsData = colorsResp.ok ? await colorsResp.json() : null;
            const sizesData  = sizesResp.ok  ? await sizesResp.json()  : null;

            const colors = Array.isArray(colorsData?.data) ? colorsData.data : [];
            const sizes  = Array.isArray(sizesData?.data)  ? sizesData.data  : [];

            console.log('[ColorsAndSizes] Colors:', colors.length, '| Sizes:', sizes.length);
            this.renderColorsAndSizes(colors, sizes, 'colors');

        } catch (e) {
            console.error('[ColorsAndSizes] Error:', e);
            $container.html(`
                <div class="cs-panel">
                    <div class="cs-header">
                        <h2 class="cs-header-title">Colors <span>&</span> Sizes</h2>
                        <div class="cs-header-meta" style="color:#e55;">Network error</div>
                    </div>
                    <div class="cs-error-box">
                        Failed to load — check your connection and try again.
                        <br><small style="color:#bbb;">${e.message || ''}</small>
                    </div>
                </div>
            `);
        }
    },

    renderColorsAndSizes: function (colors, sizes, activeTab = 'colors') {
        const $container = $('#admin-colors-sizes-container');
        if (!$container.length) return;

        const totalColors  = colors.length;
        const activeColors = colors.filter(c => (c.status || c.Status || '').toLowerCase() === 'active').length;
        const totalSizes   = sizes.length;
        const activeSizes  = sizes.filter(s => (s.status || s.Status || '').toLowerCase() === 'active').length;

        let html = `
        <div class="cs-panel">

            <!-- Header -->
            <div class="cs-header">
                <div>
                    <h2 class="cs-header-title">Colors <span>&</span> Sizes</h2>
                    <div class="cs-header-meta">${totalColors} color${totalColors !== 1 ? 's' : ''} · ${totalSizes} size${totalSizes !== 1 ? 's' : ''}</div>
                </div>
                <button class="cs-btn-add" id="cs-add-btn"
                    onclick="AdminDashboardManager.${activeTab === 'colors' ? 'openColorModal' : 'openSizeModal'}()">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add ${activeTab === 'colors' ? 'Color' : 'Size'}
                </button>
            </div>

            <!-- Stats -->
            <div class="cs-stats">
                <div class="cs-stat-card">
                    <div class="cs-stat-label">Total Colors</div>
                    <div class="cs-stat-value accent">${totalColors}</div>
                </div>
                <div class="cs-stat-card">
                    <div class="cs-stat-label">Active Colors</div>
                    <div class="cs-stat-value green">${activeColors}</div>
                </div>
                <div class="cs-stat-card">
                    <div class="cs-stat-label">Total Sizes</div>
                    <div class="cs-stat-value accent">${totalSizes}</div>
                </div>
                <div class="cs-stat-card">
                    <div class="cs-stat-label">Active Sizes</div>
                    <div class="cs-stat-value green">${activeSizes}</div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="cs-tabs">
                <button class="cs-tab ${activeTab === 'colors' ? 'cs-tab--active' : ''}" data-tab="colors"
                    onclick="AdminDashboardManager._csSwitchTab('colors')">
                    <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
                    </svg>
                    Colors <span class="cs-tab-badge">${totalColors}</span>
                </button>
                <button class="cs-tab ${activeTab === 'sizes' ? 'cs-tab--active' : ''}" data-tab="sizes"
                    onclick="AdminDashboardManager._csSwitchTab('sizes')">
                    <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M21 6H3M16 12H3M11 18H3"/>
                    </svg>
                    Sizes <span class="cs-tab-badge">${totalSizes}</span>
                </button>
            </div>

            <!-- Search -->
            <div class="cs-toolbar">
                <div class="cs-search-wrap">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input class="cs-search" id="cs-search-input" type="text"
                        placeholder="Search…"
                        oninput="AdminDashboardManager._csFilter()">
                </div>
                <select class="cs-filter-select" id="cs-filter-status" onchange="AdminDashboardManager._csFilter()">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            <!-- Colors Tab -->
            <div id="cs-tab-colors" class="cs-tab-content" style="${activeTab === 'colors' ? '' : 'display:none'}">
        `;

        // ── Colors list ────────────────────────────────────────────────────────
        if (totalColors === 0) {
            html += `
                <div class="cs-empty">
                    <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
                    </svg>
                    <h4>No Colors Yet</h4>
                    <p>Add your first color to get started.</p>
                    <button class="cs-btn-add" onclick="AdminDashboardManager.openColorModal()">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add First Color
                    </button>
                </div>`;
        } else {
            html += `<div class="cs-list" id="cs-colors-list">`;
            colors.forEach(color => {
                const isActive = (color.status || color.Status || '').toLowerCase() === 'active';
                const name     = color.name || color.Name || '—';
                const hex      = color.hexCode || color.HexCode || '#cccccc';
                const id       = color.id || color.Id;

                html += `
                <div class="cs-row" data-name="${name.toLowerCase()}" data-active="${isActive}">
                    <div class="cs-row-left">
                        <span class="cs-color-swatch" style="background:${hex};" title="${hex}"></span>
                        <div class="cs-row-info">
                            <span class="cs-row-name">${name}</span>
                            <span class="cs-row-sub">${hex}</span>
                        </div>
                    </div>
                    <div class="cs-row-right">

                        <button class="cs-btn-icon cs-btn-edit" title="Edit"
                            onclick="AdminDashboardManager.openColorModal(${id})">
                            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <label class="cs-toggle-wrap" onclick="event.preventDefault(); AdminDashboardManager.toggleColorStatus(${id}, this)">
                            <span class="cs-toggle-label">${isActive ? 'Active' : 'Inactive'}</span>
                            <span class="cs-toggle-track ${isActive ? 'cs-toggle--on' : 'cs-toggle--off'}">
                                <span class="cs-toggle-thumb"></span>
                            </span>
                        </label>
                        <button class="cs-btn-icon cs-btn-delete" title="Delete"
                            onclick="AdminDashboardManager.deleteColor(${id}, '${name.replace(/'/g, "\\'")}')">
                            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14"/>
                            </svg>
                        </button>
                    </div>
                </div>`;
            });
            html += `</div>`;
        }

        html += `</div>`; // close #cs-tab-colors

        // ── Sizes Tab ──────────────────────────────────────────────────────────
        html += `<div id="cs-tab-sizes" class="cs-tab-content" style="${activeTab === 'sizes' ? '' : 'display:none'}">`;

        if (totalSizes === 0) {
            html += `
                <div class="cs-empty">
                    <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <path d="M21 6H3M16 12H3M11 18H3"/>
                    </svg>
                    <h4>No Sizes Yet</h4>
                    <p>Add your first size to get started.</p>
                    <button class="cs-btn-add" onclick="AdminDashboardManager.openSizeModal()">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add First Size
                    </button>
                </div>`;
        } else {
            html += `<div class="cs-list" id="cs-sizes-list">`;
            sizes.forEach(size => {
                const isActive = (size.status || size.Status || '').toLowerCase() === 'active';
                const name     = size.name || size.Name || '—';
                const id       = size.id || size.Id;

                html += `
                <div class="cs-row" data-name="${name.toLowerCase()}" data-active="${isActive}">
                    <div class="cs-row-left">
                        <span class="cs-size-badge">${name}</span>
                    </div>
                    <div class="cs-row-right">

                        <button class="cs-btn-icon cs-btn-edit" title="Edit"
                            onclick="AdminDashboardManager.openSizeModal(${id})">
                            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <label class="cs-toggle-wrap" onclick="event.preventDefault(); AdminDashboardManager.toggleSizeStatus(${id}, this)">
                            <span class="cs-toggle-label">${isActive ? 'Active' : 'Inactive'}</span>
                            <span class="cs-toggle-track ${isActive ? 'cs-toggle--on' : 'cs-toggle--off'}">
                                <span class="cs-toggle-thumb"></span>
                            </span>
                        </label>
                        <button class="cs-btn-icon cs-btn-delete" title="Delete"
                            onclick="AdminDashboardManager.deleteSize(${id}, '${name.replace(/'/g, "\\'")}')">
                            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14"/>
                            </svg>
                        </button>
                    </div>
                </div>`;
            });
            html += `</div>`;
        }

        html += `</div>`; // close #cs-tab-sizes
        html += `</div>`; // close .cs-panel

        $container.html(html);

        // Store data on container for tab switching without re-fetch
        $container.data('cs-colors', colors);
        $container.data('cs-sizes',  sizes);
    },

    // ── Tab switching ──────────────────────────────────────────────────────────
    _csSwitchTab: function (tab) {
        document.querySelectorAll('.cs-tab').forEach(btn => {
            btn.classList.toggle('cs-tab--active', btn.dataset.tab === tab);
        });
        document.getElementById('cs-tab-colors').style.display = tab === 'colors' ? '' : 'none';
        document.getElementById('cs-tab-sizes').style.display  = tab === 'sizes'  ? '' : 'none';
        const addBtn = document.getElementById('cs-add-btn');
        if (addBtn) {
            addBtn.innerHTML = `
                <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add ${tab === 'colors' ? 'Color' : 'Size'}`;
            addBtn.setAttribute('onclick',
                `AdminDashboardManager.${tab === 'colors' ? 'openColorModal' : 'openSizeModal'}()`);
        }
        this._csFilter();
    },

    // ── Search / status filter ─────────────────────────────────────────────────
    _csFilter: function () {
        const query  = (document.getElementById('cs-search-input')?.value || '').toLowerCase();
        const status = document.getElementById('cs-filter-status')?.value || 'all';

        ['cs-colors-list', 'cs-sizes-list'].forEach(listId => {
            const list = document.getElementById(listId);
            if (!list) return;
            list.querySelectorAll('.cs-row').forEach(row => {
                const name   = row.dataset.name   || '';
                const active = row.dataset.active === 'true';
                const matchQ = !query  || name.includes(query);
                const matchS = status === 'all'
                    || (status === 'active'   &&  active)
                    || (status === 'inactive' && !active);
                row.style.display = (matchQ && matchS) ? '' : 'none';
            });
        });
    },

    // ── Shared DOM toggle helper — flips row/label/track without any re-render
    _csApplyToggleDOM: function (row, _unused, toggleWrap, nowActive) {
        // 1. Update data-active so the filter keeps working
        if (row) row.dataset.active = String(nowActive);

        // 2. Flip label text
        const label = toggleWrap?.querySelector('.cs-toggle-label');
        if (label) label.textContent = nowActive ? 'Active' : 'Inactive';

        // 3. Flip track class (controls color + thumb position)
        const track = toggleWrap?.querySelector('.cs-toggle-track');
        if (track) {
            track.classList.toggle('cs-toggle--on',  nowActive);
            track.classList.toggle('cs-toggle--off', !nowActive);
        }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // COLORS
    // ══════════════════════════════════════════════════════════════════════════

    openColorModal: async function (id = null) {
        let color = null;
        if (id) {
            try {
                const resp = await fetch(
                    API_CONFIG.getApiUrl(`${this.endpoints.getColorById}/${id}?includeInactive=true`),
                    { headers: this.getHeaders() }
                );
                if (resp.ok) {
                    const data = await resp.json();
                    color = data.data || data;
                }
            } catch (e) { console.error('[Colors] fetchById error:', e); }
        }

        const existingName = color?.name || color?.Name || '';
        const existingHex  = color?.hexCode || color?.HexCode || '#000000';

        const { value: formValues } = await Swal.fire({
            title: '',
            width: '420px',
            padding: '0',
            background: '#fff',
            html: `
                <div style="padding:28px 28px 4px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                        <div>
                            <div style="font-family:'DM Sans',sans-serif;font-size:20px;font-weight:800;color:#111;letter-spacing:-0.3px;">
                                ${id ? 'Edit' : 'New'} <span style="color:#c96;">Color</span>
                            </div>
                            <div style="font-size:11px;color:#aaa;margin-top:2px;">
                                ${id ? `Editing color #${id}` : 'Add a new product color'}
                            </div>
                        </div>
                        <div class="cs-modal-icon-wrap">
                            <span id="cs-color-preview-icon" style="display:block;width:28px;height:28px;border-radius:50%;background:${existingHex};border:2px solid rgba(0,0,0,0.1);"></span>
                        </div>
                    </div>

                    <div class="af-section-title" style="margin-top:0;">Color Details</div>

                    <div class="af-group">
                        <label>Color Name <span style="color:#c96;">*</span></label>
                        <input id="cs-color-name" class="af-input"
                            placeholder="e.g. Midnight Black, Ocean Blue"
                            value="${existingName}">
                    </div>

                    <div class="af-group" style="margin-top:12px;">
                        <label>Hex Code</label>
                        <div class="cs-hex-row">
                            <input type="color" id="cs-color-picker" value="${existingHex}"
                                class="cs-color-picker-input"
                                oninput="AdminDashboardManager._csColorPickerSync(this.value)">
                            <input id="cs-color-hex" class="af-input cs-hex-text"
                                placeholder="#000000"
                                value="${existingHex}"
                                oninput="AdminDashboardManager._csHexTextSync(this.value)">
                        </div>
                    </div>

                    <div style="height:20px;"></div>
                </div>
            `,
            didOpen: () => {
                AdminDashboardManager._csColorPickerSync(existingHex);
            },
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: id ? '✓ Save Changes' : '+ Add Color',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#111',
            preConfirm: () => {
                const name    = document.getElementById('cs-color-name')?.value.trim() || '';
                const hexCode = document.getElementById('cs-color-hex')?.value.trim()  || null;
                if (!name) {
                    Swal.showValidationMessage('Color name is required');
                    return false;
                }
                if (hexCode && !/^#[0-9A-Fa-f]{3,8}$/.test(hexCode)) {
                    Swal.showValidationMessage('Invalid hex code (e.g. #FF5500)');
                    return false;
                }
                return { name, hexCode: hexCode || null };
            }
        });

        if (formValues) {
            if (id) await this.updateColor(id, formValues);
            else        await this.addColor(formValues);
        }
    },

    _csColorPickerSync: function (val) {
        const hexInput = document.getElementById('cs-color-hex');
        const preview  = document.getElementById('cs-color-preview-icon');
        if (hexInput) hexInput.value = val;
        if (preview)  preview.style.background = val;
    },

    _csHexTextSync: function (val) {
        const picker  = document.getElementById('cs-color-picker');
        const preview = document.getElementById('cs-color-preview-icon');
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            if (picker)  picker.value = val;
            if (preview) preview.style.background = val;
        }
    },

    addColor: async function (fields) {
        try {
            const resp = await fetch(API_CONFIG.getApiUrl(this.endpoints.addColor), {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ name: fields.name, hexCode: fields.hexCode })
            });
            if (resp.ok) {
                await Swal.fire({ icon: 'success', title: 'Color added!', timer: 1500, showConfirmButton: false });
                this.loadColorsAndSizes();
            } else {
                const err = await resp.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not add color.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    updateColor: async function (id, fields) {
        try {
            const resp = await fetch(API_CONFIG.getApiUrl(`${this.endpoints.updateColor}/${id}`), {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({ name: fields.name, hexCode: fields.hexCode })
            });
            if (resp.ok) {
                await Swal.fire({ icon: 'success', title: 'Color updated!', timer: 1500, showConfirmButton: false });
                this.loadColorsAndSizes();
            } else {
                const err = await resp.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not update color.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    // ── Toggle color: flips DOM instantly, reverts on API failure ─────────────
    toggleColorStatus: async function (id, btn) {
        const row       = btn.closest('.cs-row');
        const badge     = row?.querySelector('.cs-status-badge');
        const wasActive = row?.dataset.active === 'true';

        // Flip immediately (optimistic)
        this._csApplyToggleDOM(row, badge, btn, !wasActive);

        try {
            const resp = await fetch(
                API_CONFIG.getApiUrl(`${this.endpoints.toggleColorStatus}/${id}`),
                { method: 'PATCH', headers: this.getHeaders() }
            );
            if (!resp.ok) {
                // Revert on failure
                this._csApplyToggleDOM(row, badge, btn, wasActive);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Could not toggle color status.' });
            }
        } catch (e) {
            this._csApplyToggleDOM(row, badge, btn, wasActive);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    deleteColor: async function (id, name) {
        const result = await Swal.fire({
            title: 'Delete Color?',
            text: `This will permanently remove "${name}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
        });
        if (!result.isConfirmed) return;
        try {
            const resp = await fetch(
                API_CONFIG.getApiUrl(`${this.endpoints.deleteColor}/${id}`),
                { method: 'DELETE', headers: this.getHeaders() }
            );
            if (resp.ok) {
                await Swal.fire({ icon: 'success', title: 'Color deleted!', timer: 1500, showConfirmButton: false });
                this.loadColorsAndSizes();
            } else {
                const err = await resp.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not delete color.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // SIZES
    // ══════════════════════════════════════════════════════════════════════════

    openSizeModal: async function (id = null) {
        let size = null;
        if (id) {
            try {
                const resp = await fetch(
                    API_CONFIG.getApiUrl(`${this.endpoints.getSizeById}/${id}?includeInactive=true`),
                    { headers: this.getHeaders() }
                );
                if (resp.ok) {
                    const data = await resp.json();
                    size = data.data || data;
                }
            } catch (e) { console.error('[Sizes] fetchById error:', e); }
        }

        const existingName = size?.name || size?.Name || '';

        const { value: formValues } = await Swal.fire({
            title: '',
            width: '400px',
            padding: '0',
            background: '#fff',
            html: `
                <div style="padding:28px 28px 4px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                        <div>
                            <div style="font-family:'DM Sans',sans-serif;font-size:20px;font-weight:800;color:#111;letter-spacing:-0.3px;">
                                ${id ? 'Edit' : 'New'} <span style="color:#c96;">Size</span>
                            </div>
                            <div style="font-size:11px;color:#aaa;margin-top:2px;">
                                ${id ? `Editing size #${id}` : 'Add a new product size'}
                            </div>
                        </div>
                        <div class="cs-modal-icon-wrap">
                            <svg width="20" height="20" fill="none" stroke="#c96" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M21 6H3M16 12H3M11 18H3"/>
                            </svg>
                        </div>
                    </div>

                    <div class="af-section-title" style="margin-top:0;">Size Details</div>

                    <div class="af-group">
                        <label>Size Name <span style="color:#c96;">*</span></label>
                        <input id="cs-size-name" class="af-input"
                            placeholder="e.g. XS, S, M, L, XL, 42, 28x32"
                            value="${existingName}">
                    </div>

                    <div style="height:20px;"></div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: id ? '✓ Save Changes' : '+ Add Size',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#111',
            preConfirm: () => {
                const name = document.getElementById('cs-size-name')?.value.trim() || '';
                if (!name) {
                    Swal.showValidationMessage('Size name is required');
                    return false;
                }
                return { name };
            }
        });

        if (formValues) {
            if (id) await this.updateSize(id, formValues);
            else        await this.addSize(formValues);
        }
    },

    addSize: async function (fields) {
        try {
            const resp = await fetch(API_CONFIG.getApiUrl(this.endpoints.addSize), {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ name: fields.name })
            });
            if (resp.ok) {
                await Swal.fire({ icon: 'success', title: 'Size added!', timer: 1500, showConfirmButton: false });
                this.loadColorsAndSizes();
            } else {
                const err = await resp.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not add size.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    updateSize: async function (id, fields) {
        try {
            const resp = await fetch(API_CONFIG.getApiUrl(`${this.endpoints.updateSize}/${id}`), {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({ name: fields.name })
            });
            if (resp.ok) {
                await Swal.fire({ icon: 'success', title: 'Size updated!', timer: 1500, showConfirmButton: false });
                this.loadColorsAndSizes();
            } else {
                const err = await resp.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not update size.' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    // ── Toggle size: flips DOM instantly, reverts on API failure ──────────────
    toggleSizeStatus: async function (id, btn) {
        const row       = btn.closest('.cs-row');
        const badge     = row?.querySelector('.cs-status-badge');
        const wasActive = row?.dataset.active === 'true';

        // Flip immediately (optimistic)
        this._csApplyToggleDOM(row, badge, btn, !wasActive);

        try {
            const resp = await fetch(
                API_CONFIG.getApiUrl(`${this.endpoints.toggleSizeStatus}/${id}`),
                { method: 'PATCH', headers: this.getHeaders() }
            );
            if (!resp.ok) {
                // Revert on failure
                this._csApplyToggleDOM(row, badge, btn, wasActive);
                Swal.fire({ icon: 'error', title: 'Error', text: 'Could not toggle size status.' });
            }
        } catch (e) {
            this._csApplyToggleDOM(row, badge, btn, wasActive);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Network error.' });
        }
    },

    deleteSize: async function (id, name) {
        const result = await Swal.fire({
            title: 'Delete Size?',
            text: `This will permanently remove "${name}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
        });
        if (!result.isConfirmed) return;
        try {
            const resp = await fetch(
                API_CONFIG.getApiUrl(`${this.endpoints.deleteSize}/${id}`),
                { method: 'DELETE', headers: this.getHeaders() }
            );
            if (resp.ok) {
                await Swal.fire({ icon: 'success', title: 'Size deleted!', timer: 1500, showConfirmButton: false });
                this.loadColorsAndSizes();
            } else {
                const err = await resp.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Could not delete size.' });
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


    
