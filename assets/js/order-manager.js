
class OrderModel {
    constructor(apiEndpoints, authManager) {
        this.apiEndpoints = apiEndpoints;
        this.authManager = authManager;
        this.orders = [];
        this.currentFilter = 'All';
    }

    async fetchOrders(status = 'All') {
        try {
            let url;
            
            if (status === 'All') {
                // Fetch all orders
                url = API_CONFIG.getApiUrl(this.apiEndpoints.orders);
            } else {
                // Fetch orders by status using path parameter (status in URL path)
                const encodedStatus = encodeURIComponent(status);
                url = API_CONFIG.getApiUrl(`${this.apiEndpoints.ordersByStatus}/${encodedStatus}`);
            }

            console.log('Fetching orders from:', url);
            
            const response = await fetch(url, { 
                headers: this.authManager.getHeaders() 
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                console.error('API Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText || errorText}`);
            }

            const data = await response.json();
            this.orders = data.data || data;
            this.currentFilter = status;
            
            console.log('Orders fetched successfully:', {
                status: status,
                count: this.orders.length || 0
            });
            
            return this.orders;
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    }

    async fetchOrderById(orderId) {
        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(`${this.apiEndpoints.getOrderById}?id=${orderId}`),
                { headers: this.authManager.getHeaders() }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch order: ${response.statusText}`);
            }

            const data = await response.json();
            return data.data || data;
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    }
    async updateStatus(orderId, status, carrierName = null, trackingNumber = null) {
        try {
            // Convert status string to numeric code for API
            const newStatus = OrderModel.getStatusCode(status);
            
            const body = { newStatus };
            
            if (status === 'Shipped') {
                body.carrierName = carrierName || null;
                body.trackingNumber = trackingNumber || null;
            }

            const response = await fetch(
                API_CONFIG.getApiUrl(`${this.apiEndpoints.changeOrderStatus}/${orderId}`),
                {
                    method: 'POST',
                    headers: this.authManager.getHeaders(),
                    body: JSON.stringify(body)
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to update status: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    }

    /**
     * Update paid amount for an order
     */
    async updatePaidAmount(orderId, paidAmount, switchToVisa = false) {
        try {
            const response = await fetch(
                API_CONFIG.getApiUrl(`${this.apiEndpoints.updatePaidAmount}/${orderId}`),
                {
                    method: 'POST',
                    headers: this.authManager.getHeaders(),
                    body: JSON.stringify({ paidAmount, switchToVisa })
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to update paid amount: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating paid amount:', error);
            throw error;
        }
    }

    /**
     * Generate delivery payment link
     */
    async generateDeliveryPaymentLink(orderId, paidAmount = 0, switchToVisa = false) {
        try {
            // Prepare the request body
            const body = {
                paidAmount: paidAmount && paidAmount > 0 ? paidAmount : 0,
                switchToVisa: Boolean(switchToVisa)
            };
            
            console.log('Generating payment link with:', { orderId, body });
            
            const response = await fetch(
                API_CONFIG.getApiUrl(`${this.apiEndpoints.generateDeliveryPaymentLink}/${orderId}`),
                {
                    method: 'POST',
                    headers: this.authManager.getHeaders(),
                    body: JSON.stringify(body)
                }
            );

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                console.error('API Error Response:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });
                throw new Error(`Failed to generate payment link: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Payment link response:', data);
            
            // Safely extract the link - check for string type to avoid function references
            let link = null;
            
            if (typeof data === 'string') {
                link = data;
            } else if (data && typeof data === 'object') {
                // Try specific nested paths first
                if (data.data && typeof data.data === 'object') {
                    if (typeof data.data.link === 'string') link = data.data.link;
                    else if (typeof data.data.paymentLink === 'string') link = data.data.paymentLink;
                    else if (typeof data.data.url === 'string') link = data.data.url;
                }
                // Try top-level properties
                if (!link && typeof data.paymentLink === 'string') link = data.paymentLink;
                if (!link && typeof data.url === 'string') link = data.url;
                // Last resort - check for any string property that looks like a URL
                if (!link) {
                    for (const key in data) {
                        if (typeof data[key] === 'string' && (data[key].startsWith('http') || data[key].includes('/'))) {
                            link = data[key];
                            break;
                        }
                    }
                }
            }
            
            console.log('Extracted link:', link);
            return link;
        } catch (error) {
            console.error('Error generating payment link:', error);
            throw error;
        }
    }

    /**
     * Calculate order statistics
     */
    getStatistics(orders = null) {
        const orderList = orders || this.orders;
        
        // Helper to get status string (handles both numeric and string statuses)
        const getStatusString = (status) => OrderModel.mapStatusCode(status);
        
        return {
            total: orderList ? orderList.length : 0,
            pending: orderList ? orderList.filter(o => getStatusString(o.status) === 'Pending').length : 0,
            approved: orderList ? orderList.filter(o => getStatusString(o.status) === 'Approved').length : 0,
            revenue: orderList ? orderList
                .filter(o => getStatusString(o.status) === 'Approved')
                .reduce((sum, o) => sum + (o.paidAmount || 0), 0) : 0
        };
    }

    /**
     * Map status strings back to numeric codes
     * Reverse of mapStatusCode
     */
    static getStatusCode(statusString) {
        if (!statusString) return 1; // Default to Pending
        
        // If already a number, return it as-is
        if (typeof statusString === 'number') {
            return statusString;
        }
        
        // Map status strings to numeric codes (matches backend enum)
        const statusCodeMap = {
            'Pending': 1,
            'Approved': 2,
            'Shipped': 3,
            'Delivered': 4,
            'Complete': 5,
            'Cancelled': 6
        };
        
        return statusCodeMap[statusString] || 1;
    }

    /**
     * Map payment method strings back to numeric codes
     * Reverse of mapPaymentMethod
     */
    static getPaymentMethodCode(methodString) {
        if (!methodString) return 1; // Default to Cash
        
        // If already a number, return it as-is
        if (typeof methodString === 'number') {
            return methodString;
        }
        
        // Map payment method strings to numeric codes (matches backend enum)
        const methodCodeMap = {
            'Cash': 1,
            'Visa': 2
        };
        
        return methodCodeMap[methodString] || 1;
    }

    /**
     * Map numeric status codes to status strings
     * Matches backend OrderStatus enum
     */
    static mapStatusCode(statusInput) {
        if (!statusInput && statusInput !== 0) return 'Pending';
        
        // If already a string, return it as-is
        if (typeof statusInput === 'string') {
            return statusInput;
        }
        
        // Map numeric codes to status strings (matches backend enum)
        const statusMap = {
            1: 'Pending',
            2: 'Approved',
            3: 'Shipped',
            4: 'Delivered',
            5: 'Complete',
            6: 'Cancelled'
        };
        
        return statusMap[statusInput] || String(statusInput || 'Pending');
    }

    /**
     * Map numeric payment method codes to payment method strings
     * Matches backend PaymentMethod enum
     */
    static mapPaymentMethod(methodInput) {
        if (!methodInput && methodInput !== 0) return 'Cash';
        
        // If already a string, return it as-is
        if (typeof methodInput === 'string') {
            return methodInput;
        }
        
        // Map numeric codes to payment method strings (matches backend enum)
        const methodMap = {
            1: 'Cash',
            2: 'Visa'
        };
        
        return methodMap[methodInput] || String(methodInput || 'Cash');
    }

    /**
     * Escape HTML to prevent XSS
     */
    static escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
}

class OrderView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container ${containerId} not found`);
        }
    }

    /**
     * Render orders table with all statistics
     */
    renderTable(orders, statistics, currentStatus = 'All') {
        // Normalize order data to ensure consistent types
        const normalizedOrders = orders.map(order => this._normalizeOrder(order));
        
        // Sort orders by ID in descending order
        normalizedOrders.sort((a, b) => b.id - a.id);
        
        const html = this._buildTableHtml(normalizedOrders, statistics, currentStatus);
        if (this.container) {
            this.container.innerHTML = html;
        }
    }

    _normalizeOrder(order) {
        return {
            ...order,
            status: OrderModel.mapStatusCode(order.status),
            userName: String(order.userName || ''),
            userEmail: String(order.userEmail || order.guestEmail || ''),
            trackingCode: String(order.trackingCode || ''),
            paymentMethod: OrderModel.mapPaymentMethod(order.paymentMethod),
            carrierName: String(order.carrierName || ''),
            trackingNumber: String(order.trackingNumber || '')
        };
    }

    /**
     * Build the complete orders HTML
     */
    _buildTableHtml(orders, stats, currentStatus) {
        const total = stats.total;
        const pending = stats.pending;
        const approved = stats.approved;
        const revenue = stats.revenue;

        let html = `
            <div class="orders-panel">
                <div class="orders-header">
                    <div>
                        <h2 class="orders-header-title">Orders Management</h2>
                        <div class="orders-header-meta">${total} order${total !== 1 ? 's' : ''} found</div>
                    </div>
                    <div style="display:flex; gap:12px; flex-wrap:wrap;">
                        <div class="orders-stat-card">
                            <span class="orders-stat-label">Pending</span>
                            <span class="orders-stat-value" style="color:#f59e0b;">${pending}</span>
                        </div>
                        <div class="orders-stat-card">
                            <span class="orders-stat-label">Approved</span>
                            <span class="orders-stat-value" style="color:#10b981;">${approved}</span>
                        </div>
                        <div class="orders-stat-card">
                            <span class="orders-stat-label">Revenue</span>
                            <span class="orders-stat-value" style="color:#f59e0b;">ILS ${revenue.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div class="orders-toolbar">
                    <div class="orders-search-wrap">
                        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input class="orders-search" id="orders-search-input" type="text"
                            placeholder="Search by ID, name, email, phone, tracking code..."
                            oninput="OrderController.filter()">
                    </div>
                    <select class="orders-filter-select" id="orders-status-filter"
                        onchange="OrderController.handleStatusChange(this.value)">
                        <option value="All"       ${currentStatus === 'All'       ? 'selected' : ''}>All Statuses</option>
                        <option value="Pending"   ${currentStatus === 'Pending'   ? 'selected' : ''}>Pending</option>
                        <option value="Approved"  ${currentStatus === 'Approved'  ? 'selected' : ''}>Approved</option>
                        <option value="Shipped"   ${currentStatus === 'Shipped'   ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Complete"  ${currentStatus === 'Complete'  ? 'selected' : ''}>Complete</option>
                        <option value="Cancelled" ${currentStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>

                <div style="overflow-x: auto; overflow-y: auto; max-height: 600px;">
                    <table class="table-orders" id="orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Tracking</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Paid</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        if (!orders || orders.length === 0) {
            html += `<tr><td colspan="9" class="text-center py-4">No orders found.</td></tr>`;
        } else {
            html += orders.map(order => this._buildOrderRow(order)).join('');
        }

        html += `</tbody></table></div></div>`;
        return html;
    }

    /**
     * Build a single order row
     */
    _buildOrderRow(order) {
        const statusClass = String(order.status || '').toLowerCase();
        const dateStr = order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB') : '—';
        const totalAmount = order.totalAmount || 0;
        const paidAmount = order.paidAmount || 0;
        const unpaid = totalAmount - paidAmount;
        const searchData = `${order.id} ${String(order.userName || '').toLowerCase()} ${String(order.userEmail || '').toLowerCase()} ${String(order.trackingCode || '').toLowerCase()} ${String(order.phone || order.guestPhoneNumber || '').toLowerCase()}`;

        const escapeHtml = OrderModel.escapeHtml;

        return `
            <tr class="order-row" data-search="${searchData}" data-order-id="${order.id}">
                <td><strong>#${order.id}</strong></td>
                <td style="font-size:12px; color:#888;">${order.trackingCode || '—'}</td>
                <td>
                    <div style="font-weight:500;">${escapeHtml(order.userName || 'Guest')}</div>
                    <div style="font-size:12px; color:#888;">${escapeHtml(order.userEmail || order.guestEmail || '—')}</div>
                </td>
                <td>${dateStr}</td>
                <td style="font-weight:600;">ILS ${totalAmount.toFixed(2)}</td>
                <td>
                    <span style="color:${paidAmount >= totalAmount ? '#10b981' : unpaid > 0 ? '#e55' : '#888'}; font-weight:600;">
                    ILS ${paidAmount.toFixed(2)}
                    </span>
                </td>
                <td>${order.paymentMethod || '—'}</td>
                <td><span class="order-status-pill ${statusClass}">${order.status || 'Pending'}</span></td>
                <td>
                    <button class="btn-order-view" onclick="OrderController.openModal(${order.id})">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        Manage
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Show order details modal
     */
    showModal(order) {
        // Normalize order data to ensure consistent types
        const normalizedOrder = this._normalizeOrder(order);
        const currentStatus = normalizedOrder.status;
        const totalAmount = normalizedOrder.totalAmount || 0;
        const paidAmount = normalizedOrder.paidAmount || 0;
        const unpaid = totalAmount - paidAmount;
        const totalItems = (normalizedOrder.orderItems || []).reduce((s, i) => s + (i.quantity || 0), 0);

        const itemsHtml = this._buildItemsHtml(normalizedOrder, totalAmount, totalItems);
        const paymentBadge = this._buildPaymentBadge(paidAmount, totalAmount, unpaid);
        const modalHtml = this._buildModalHtml(normalizedOrder, currentStatus, paidAmount, totalAmount, paymentBadge, itemsHtml);

        Swal.fire({
            title: `Manage Order #${normalizedOrder.id}`,
            html: modalHtml,
            width: '580px',
            showConfirmButton: false,
            showCloseButton: true,
            customClass: { container: 'order-management-modal' },
            didOpen: () => {
                this._setupModalHandlers();
            }
        });
    }

    /**
     * Build items HTML for modal
     */
    _buildItemsHtml(order, totalAmount, totalItems) {
        if (!order.orderItems || order.orderItems.length === 0) {
            return '<div style="color:#888; font-size:13px;">No items found.</div>';
        }

        let html = order.orderItems.map(item => {
            const variants = [item.colorName, item.sizeName].filter(Boolean).join(' / ');
            const escapeHtml = OrderModel.escapeHtml;
            return `
                <div class="order-item-row">
                    <div>
                        <span style="font-weight:500;">${escapeHtml(item.productName || 'Product')}</span>
                        <span style="color:#888; font-size:12px; margin-left:8px;">× ${item.quantity || 1}</span>
                        ${variants ? `<span style="color:#aaa; font-size:11px; margin-left:6px;">(${variants})</span>` : ''}
                    </div>
                    <div style="text-align:right;">
                        <div>ILS ${(item.productPrice || 0).toFixed(2)} ea.</div>
                        <div style="font-size:12px; color:#888;">= ILS ${(item.totalPrice || 0).toFixed(2)}</div>
                    </div>
                </div>
            `;
        }).join('');

        html += `
            <div class="order-item-row" style="border-top:1px solid #eee; padding-top:8px; margin-top:4px;">
                <span style="color:#888; font-size:13px;">Delivery</span>
                <span>ILS ${(order.deliveryCost || 0).toFixed(2)}</span>
            </div>
            <div class="order-item-row" style="font-weight:700;">
                <span>${totalItems} item${totalItems !== 1 ? 's' : ''} · Total</span>
                <span>ILS ${totalAmount.toFixed(2)}</span>
            </div>
        `;

        return html;
    }

    /**
     * Build payment badge HTML
     */
    _buildPaymentBadge(paidAmount, totalAmount, unpaid) {
        if (paidAmount >= totalAmount) {
            return `<span style="color:#10b981; font-weight:600;">✓ Fully Paid</span>`;
        }
        if (unpaid > 0) {
            return `<span style="color:#e55; font-weight:600; font-size:12px;">(ILS ${unpaid.toFixed(2)} unpaid)</span>`;
        }
        return '';
    }

    /**
     * Build complete modal HTML
     */
    _buildModalHtml(order, currentStatus, paidAmount, totalAmount, paymentBadge, itemsHtml) {
        const escapeHtml = OrderModel.escapeHtml;
        const isPaymentLocked =
            ['Complete', 'Cancelled'].includes(currentStatus) ||
            paidAmount >= totalAmount;

        return `
            <div style="text-align:left; padding:10px;">
                <!-- Order Info -->
                <div class="order-modal-section">
                    <div class="order-modal-title">Order Information</div>
                    <div class="order-detail-row">
                        <span class="order-detail-label">Order ID</span>
                        <span class="order-detail-value">#${order.id}</span>
                    </div>
                    <div class="order-detail-row">
                        <span class="order-detail-label">Tracking</span>
                        <span class="order-detail-value" style="font-size:12px;">${order.trackingCode || '—'}</span>
                    </div>
                    <div class="order-detail-row">
                        <span class="order-detail-label">Date</span>
                        <span class="order-detail-value">${order.orderDate ? new Date(order.orderDate).toLocaleString('en-GB') : '—'}</span>
                    </div>
                    <div class="order-detail-row">
                        <span class="order-detail-label">Customer</span>
                        <span class="order-detail-value">${escapeHtml(order.userName || 'Guest')}</span>
                    </div>
                    ${order.userEmail || order.guestEmail ? `
                    <div class="order-detail-row">
                        <span class="order-detail-label">Email</span>
                        <span class="order-detail-value">${escapeHtml(order.userEmail || order.guestEmail)}</span>
                    </div>` : ''}
                    ${order.phone || order.guestPhoneNumber ? `
                    <div class="order-detail-row">
                        <span class="order-detail-label">Phone</span>
                        <span class="order-detail-value">${escapeHtml(order.phone || order.guestPhoneNumber)}</span>
                    </div>` : ''}
                    ${order.address || order.guestAddress ? `
                    <div class="order-detail-row">
                        <span class="order-detail-label">Address</span>
                        <span class="order-detail-value">${escapeHtml(order.address || order.guestAddress)}</span>
                    </div>` : ''}
                    <div class="order-detail-row">
                        <span class="order-detail-label">Total</span>
                        <span class="order-detail-value" style="color:#c96;">ILS ${totalAmount.toFixed(2)}</span>
                    </div>
                    <div class="order-detail-row">
                        <span class="order-detail-label">Paid</span>
                        <span class="order-detail-value">ILS ${paidAmount.toFixed(2)} ${paymentBadge}</span>
                    </div>
                    <div class="order-detail-row">
                        <span class="order-detail-label">Payment</span>
                        <span class="order-detail-value">${order.paymentMethod || '—'}</span>
                    </div>
                </div>

                <!-- Items -->
                <div class="order-modal-section">
                    <div class="order-modal-title">Items</div>
                    <div class="order-items-list">${itemsHtml}</div>
                </div>

                <!-- Management -->
                <div class="order-modal-section">
                    <div class="order-modal-title">Management Actions</div>

                    <!-- Status -->
                    <div class="form-group mb-3">
                        <label style="font-size:13px; font-weight:600; color:#555;">Update Status</label>
                        <div style="display:flex; gap:10px;">
                            <select id="modal-order-status" class="form-control" style="font-size:14px;">
                                <option value="Pending"   ${currentStatus === 'Pending'   ? 'selected' : ''}>Pending</option>
                                <option value="Approved"  ${currentStatus === 'Approved'  ? 'selected' : ''}>Approved</option>
                                <option value="Shipped"   ${currentStatus === 'Shipped'   ? 'selected' : ''}>Shipped</option>
                                <option value="Delivered" ${currentStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="Complete"  ${currentStatus === 'Complete'  ? 'selected' : ''}>Complete</option>
                                <option value="Cancelled" ${currentStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                            <button onclick="OrderController.updateStatus(${order.id})"
                                class="btn btn-outline-primary-2" style="min-width:100px; padding:8px 15px;">
                                Update
                            </button>
                        </div>
                    </div>

                    <!-- Shipping info (shown when Shipped) -->
                    <div id="shipping-fields" style="display:${currentStatus === 'Shipped' ? 'block' : 'none'}; margin-bottom:12px;">
                        <label style="font-size:13px; font-weight:600; color:#555;">Carrier Name</label>
                        <input type="text" id="modal-carrier-name" class="form-control mb-2"
                            placeholder="e.g. DHL" value="${escapeHtml(order.carrierName || '')}">
                        <label style="font-size:13px; font-weight:600; color:#555;">Tracking Number</label>
                        <input type="text" id="modal-tracking-number" class="form-control"
                            placeholder="Tracking number" value="${escapeHtml(order.trackingNumber || '')}">
                    </div>

                    ${isPaymentLocked ? `
                        <div class="order-action-card" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-top:8px;">
                            <div style="font-size:13px;color:#4b5563;">
                                Further payment changes are <strong>disabled</strong> because this order is either
                                <strong>${escapeHtml(currentStatus)}</strong> or already fully paid.
                            </div>
                        </div>
                    ` : `
                        <!-- Payment - Update Amount -->
                        <div class="order-action-card" style="background: linear-gradient(135deg, #f5f7fa 0%, #fff 100%); border: 1px solid #e1e8ed; border-radius: 8px; padding: 16px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color: #4a90e2;">
                                    <rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>
                                </svg>
                                <label style="font-size:14px; font-weight:600; color:#2c3e50; margin:0;">Update Payment Amount</label>
                            </div>
                            
                            <div style="background: white; border: 1px solid #e1e8ed; border-radius: 6px; padding: 12px; margin-bottom: 10px;">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="font-size:12px; color:#666;">Current Paid Amount</span>
                                    <span style="font-weight:600; color:#10b981; font-size:14px;">ILS ${paidAmount.toFixed(2)}</span>
                                </div>
                                <div style="height: 1px; background: #eee; margin: 8px 0;"></div>
                                <div style="display: flex; align-items: center; justify-content: space-between;">
                                    <span style="font-size:12px; color:#666;">Remaining to Pay</span>
                                    <span style="font-weight:600; color:#${totalAmount - paidAmount > 0 ? 'e55' : '10b981'}; font-size:14px;">ILS ${(totalAmount - paidAmount).toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; margin-bottom: 10px;">
                                <input type="number" id="modal-paid-amount" class="form-control"
                                    placeholder="Enter new paid amount" value="${paidAmount}" step="0.01" min="0" max="${totalAmount}"
                                    style="border-radius: 6px; border: 1px solid #ddd; padding: 10px; font-size: 14px;"
                                    onchange="OrderController.validatePaidAmount(this.value, ${totalAmount})"
                                    oninput="OrderController.validatePaidAmount(this.value, ${totalAmount})">
                            </div>
                            <button onclick="OrderController.updatePaidAmount(${order.id})"
                                class="btn-order-view" style="background: #14760b; color: white; border: none; border-radius: 6px; padding: 10px 15px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s;">
                                Save
                            </button>
                            <div id="payment-error" style="color: #e55; font-size: 12px; margin-top: 8px; display: none;"></div>
                        </div>

                        <!-- Payment - Generate Link -->
                        <div class="order-action-card" style="background: linear-gradient(135deg, #fff5e6 0%, #fffbf0 100%); border: 1px solid #ffe8c2; border-radius: 8px; padding: 16px; margin-top: 12px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color: #f59e0b;">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                </svg>
                                <label style="font-size:14px; font-weight:600; color:#92400e; margin:0;">Generate Payment Link</label>
                            </div>
                            
                            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 10px; margin-bottom: 12px;">
                                <div style="display: flex; gap: 8px; font-size: 12px; color: #92400e;">
                                    <span style="font-weight: 600;">⚠️ Note:</span>
                                    <span>Payment link is valid for ONE-TIME use only</span>
                                </div>
                            </div>
                            
                            <div style="background: white; border: 1px solid #ffe8c2; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                                <label style="display: block; font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 600;">Amount for Payment Link</label>
                                <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px;">
                                    <input type="number" id="modal-payment-link-amount" class="form-control"
                                        placeholder="Enter amount" value="${paidAmount}" step="0.01" min="0" max="${totalAmount}"
                                        style="border-radius: 6px; border: 1px solid #ddd; padding: 10px; font-size: 14px;">
                                </div>
                                <label style="display: flex; padding: 8px; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #555; margin: 0;">
                                    <input type="checkbox" id="modal-switch-visa" ${order.paymentMethod === 'Visa' ? 'checked' : ''} style="cursor: pointer;">
                                    <span>Switch payment method to Visa</span>
                                </label>
                                <div id="link-amount-error" style="color: #e55; font-size: 12px; margin-top: 8px; display: none;"></div>
                            </div>
                            
                            <button onclick="OrderController.generatePaymentLink(${order.id})"
                                class="btn" style="width: 100%; background: #f59e0b; color: white; border: none; border-radius: 6px; padding: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                </svg>
                                Generate Payment Link
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    /**
     * Setup modal event handlers
     */
    _setupModalHandlers() {
        const statusSelect = document.getElementById('modal-order-status');
        const shippingFields = document.getElementById('shipping-fields');

        if (statusSelect) {
            statusSelect.addEventListener('change', function () {
                if (shippingFields) {
                    shippingFields.style.display = this.value === 'Shipped' ? 'block' : 'none';
                }
            });
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        if (this.container) {
            this.container.innerHTML = '<div class="text-center p-5">Loading orders...</div>';
        }
    }

    /**
     * Show error state
     */
    showError(message) {
        if (this.container) {
            this.container.innerHTML = `<div style="color:#e55;padding:20px;">${OrderModel.escapeHtml(message)}</div>`;
        }
    }
}

// ==========================================
// ORDER CONTROLLER - Business Logic Layer
// ==========================================
class OrderController {
    static model = null;
    static view = null;

    /**
     * Initialize controller with Model and View
     */
    static init(model, view) {
        this.model = model;
        this.view = view;
    }

    /**
     * Load orders by status
     */
    static async loadOrders(status = 'All') {
        if (!this.model || !this.view) {
            console.error('Controller not initialized');
            return;
        }

        try {
            this.view.showLoading();
            const orders = await this.model.fetchOrders(status);
            const stats = this.model.getStatistics(orders);
            this.view.renderTable(orders, stats, status);
        } catch (error) {
            console.error('Error loading orders:', error);
            
            // Provide more helpful error messages based on the error type
            let userMessage = 'Failed to load orders. Please try again.';
            
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                userMessage = 'Authentication failed. Please log in again.';
            } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                userMessage = 'You do not have permission to view orders.';
            } else if (error.message.includes('404') || error.message.includes('Not Found')) {
                userMessage = 'Orders endpoint not found. Please check your server.';
            } else if (error.message.includes('500')) {
                userMessage = 'Server error. Please try again later.';
            } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
                userMessage = 'Network error. Please check your internet connection.';
            }
            
            this.view.showError(userMessage);
            
            // Also show the raw error in console for debugging
            console.error('Raw error details:', error);
        }
    }

    /**
     * Handle status filter change
     */
    static async handleStatusChange(status) {
        await this.loadOrders(status);
    }

    /**
     * Filter orders by search term (client-side)
     */
    static filter() {
        const searchInput = document.getElementById('orders-search-input');
        const term = (searchInput?.value || '').toLowerCase();

        document.querySelectorAll('.order-row').forEach(row => {
            const searchData = (row.dataset.search || '').toLowerCase();
            row.style.display = searchData.includes(term) ? '' : 'none';
        });
    }

    /**
     * Validate paid amount input
     */
    static validatePaidAmount(value, totalAmount) {
        const errorDiv = document.getElementById('payment-error');
        const amount = parseFloat(value);
        
        // Reset error
        if (errorDiv) errorDiv.style.display = 'none';
        
        // Validation checks
        if (!value || value.trim() === '') {
            return true; // Allow empty
        }
        
        if (isNaN(amount)) {
            if (errorDiv) {
                errorDiv.textContent = '❌ Please enter a valid number';
                errorDiv.style.display = 'block';
            }
            return false;
        }
        
        if (amount < 0) {
            if (errorDiv) {
                errorDiv.textContent = '❌ Amount cannot be negative';
                errorDiv.style.display = 'block';
            }
            return false;
        }
        
        if (amount > totalAmount) {
            if (errorDiv) {
                errorDiv.textContent = `❌ Amount cannot exceed total (ILS ${totalAmount.toFixed(2)})`;
                errorDiv.style.display = 'block';
            }
            return false;
        }
        
        return true;
    }

    /**
     * Open order details modal
     */
    static async openModal(orderId) {
        if (!this.model || !this.view) {
            console.error('Controller not initialized');
            return;
        }

        try {
            Swal.fire({ 
                title: 'Loading...', 
                allowOutsideClick: false, 
                didOpen: () => Swal.showLoading() 
            });

            const order = await this.model.fetchOrderById(orderId);
            Swal.close();
            this.view.showModal(order);
        } catch (error) {
            console.error('Error opening order modal:', error);
            Swal.fire('Error', 'Could not load order details. Please try again.', 'error');
        }
    }

    /**
     * Update order status
     */
    static async updateStatus(orderId) {
        if (!this.model) {
            console.error('Controller not initialized');
            return;
        }

        const status = document.getElementById('modal-order-status')?.value;
        if (!status) {
            Swal.fire('Error', 'Please select a status', 'error');
            return;
        }

        let carrierName = null;
        let trackingNumber = null;

        if (status === 'Shipped') {
            carrierName = document.getElementById('modal-carrier-name')?.value || null;
            trackingNumber = document.getElementById('modal-tracking-number')?.value || null;
        }

        try {
            Swal.fire({ 
                title: 'Updating...', 
                allowOutsideClick: false, 
                didOpen: () => Swal.showLoading() 
            });

            await this.model.updateStatus(orderId, status, carrierName, trackingNumber);
            
            Swal.fire('Success', 'Order status updated successfully', 'success');
            
            // Refresh orders list
            const currentFilter = document.getElementById('orders-status-filter')?.value || 'All';
            Swal.close();
            await this.loadOrders(currentFilter);
        } catch (error) {
            console.error('Error updating order status:', error);
            Swal.fire('Error', error.message || 'Failed to update order status', 'error');
        }
    }

    /**
     * Update paid amount
     */
    static async updatePaidAmount(orderId) {
        if (!this.model) {
            console.error('Controller not initialized');
            return;
        }

        const paidAmountInput = document.getElementById('modal-paid-amount')?.value;
        const switchToVisa = document.getElementById('modal-switch-visa')?.checked || false;
        
        // Get total amount from the modal (we need to extract it from the modal)
        const modalContent = document.querySelector('.swal2-html-container');
        let totalAmount = 0;
        
        // Try to parse total amount from the modal content
        if (modalContent) {
            const text = modalContent.textContent;
            // This is a fallback - in production you might want to pass this differently
            totalAmount = 999999; // Large number to not restrict validation too much
        }

        if (!paidAmountInput || paidAmountInput.trim() === '') {
            Swal.fire('Error', 'Please enter a paid amount', 'error');
            return;
        }

        const paidAmount = parseFloat(paidAmountInput);

        if (isNaN(paidAmount)) {
            Swal.fire('Error', 'Please enter a valid number', 'error');
            return;
        }

        if (paidAmount < 0) {
            Swal.fire('Error', 'Amount cannot be negative', 'error');
            return;
        }

        try {
            Swal.fire({ 
                title: 'Updating...', 
                allowOutsideClick: false, 
                didOpen: () => Swal.showLoading() 
            });

            await this.model.updatePaidAmount(orderId, paidAmount, true);
            
            Swal.fire('Success', 'Paid amount updated successfully', 'success');
            
            // Refresh orders list
            const currentFilter = document.getElementById('orders-status-filter')?.value || 'All';
            Swal.close();
            await this.loadOrders(currentFilter);
        } catch (error) {
            console.error('Error updating paid amount:', error);
            Swal.fire('Error', error.message || 'Failed to update paid amount', 'error');
        }
    }

    /**
     * Clear payment link amount input
     */
    static clearLinkAmount() {
        const input = document.getElementById('modal-payment-link-amount');
        if (input) {
            input.value = '';
            const errorDiv = document.getElementById('link-amount-error');
            if (errorDiv) errorDiv.style.display = 'none';
        }
    }

    /**
     * Validate payment link amount
     */
    static validateLinkAmount(value, totalAmount) {
        const errorDiv = document.getElementById('link-amount-error');
        const amount = parseFloat(value);
        
        // Reset error
        if (errorDiv) errorDiv.style.display = 'none';
        
        // Validation checks
        if (!value || value.trim() === '') {
            if (errorDiv) {
                errorDiv.textContent = '❌ Please enter an amount for the payment link';
                errorDiv.style.display = 'block';
            }
            return false;
        }
        
        if (isNaN(amount)) {
            if (errorDiv) {
                errorDiv.textContent = '❌ Please enter a valid number';
                errorDiv.style.display = 'block';
            }
            return false;
        }
        
        if (amount <= 0) {
            if (errorDiv) {
                errorDiv.textContent = '❌ Amount must be greater than 0';
                errorDiv.style.display = 'block';
            }
            return false;
        }
        
        if (amount > totalAmount) {
            if (errorDiv) {
                errorDiv.textContent = `❌ Amount cannot exceed total (ILS ${totalAmount.toFixed(2)})`;
                errorDiv.style.display = 'block';
            }
            return false;
        }
        
        return true;
    }

    /**
     * Generate delivery payment link
     */
    static async generatePaymentLink(orderId) {
        if (!this.model) {
            console.error('Controller not initialized');
            return;
        }

        const linkAmountInput = document.getElementById('modal-payment-link-amount')?.value;
        const switchToVisa = document.getElementById('modal-switch-visa')?.checked || false;
        
        // Get total amount (we'll assume a large number for validation)
        let totalAmount = 999999;
        
        if (!linkAmountInput || linkAmountInput.trim() === '') {
            Swal.fire('Error', 'Please enter an amount for the payment link', 'error');
            return;
        }

        const paidAmount = parseFloat(linkAmountInput);

        if (isNaN(paidAmount)) {
            Swal.fire('Error', 'Please enter a valid number', 'error');
            return;
        }

        if (paidAmount <= 0) {
            Swal.fire('Error', 'Amount must be greater than 0', 'error');
            return;
        }

        try {
            Swal.fire({ 
                title: 'Generating Payment Link...', 
                allowOutsideClick: false, 
                didOpen: () => Swal.showLoading() 
            });

            console.log('Calling generateDeliveryPaymentLink with:', { orderId, paidAmount, switchToVisa });
            
            const link = await this.model.generateDeliveryPaymentLink(orderId, paidAmount, switchToVisa);
            Swal.close();

            if (link && typeof link === 'string' && link.length > 0) {
                // Show success alert with copy button and notes
                Swal.fire({
                    title: 'Payment Link Generated!',
                    html: `
                        <div style="text-align: left; padding: 20px;">
                            <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 12px; margin-bottom: 15px;">
                                <strong style="color: #856404;">⚠️ Important:</strong>
                                <p style="margin: 8px 0 0 0; color: #856404; font-size: 14px;">This link can only be used <strong>ONE TIME</strong>. Please share it with the customer immediately.</p>
                            </div>
                            
                            <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; padding: 12px; margin-bottom: 15px;">
                                <label style="display: block; font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 600;">Payment Link:</label>
                                <div style="overflow-wrap: break-word; word-break: break-all; font-size: 12px; color: #333; font-family: monospace; background: white; padding: 8px; border-radius: 3px; border: 1px solid #ddd;">
                                    ${OrderModel.escapeHtml(link)}
                                </div>
                            </div>
                            
                            <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 4px; padding: 12px;">
                                <strong style="color: #004085;">📝 Notes:</strong>
                                <ul style="margin: 8px 0 0 0; color: #004085; font-size: 14px; padding-left: 20px;">
                                    <li>Share this link with the customer to complete payment</li>
                                    <li>Link expires after first use</li>
                                    <li>Keep a record of this transaction</li>
                                    <li>Customer can contact support if link doesn't work</li>
                                </ul>
                            </div>
                        </div>
                    `,
                    icon: 'success',
                    allowOutsideClick: true,
                    confirmButtonText: 'Copy Link & Close',
                    showCancelButton: true,
                    cancelButtonText: 'Close',
                    didOpen: () => {
                        // Add click handler to copy button
                        const confirmBtn = Swal.getConfirmButton();
                        confirmBtn.addEventListener('click', () => {
                            navigator.clipboard.writeText(link).then(() => {
                                Swal.fire('Copied!', 'Payment link copied to clipboard', 'success').then(() => {
                                    Swal.close();
                                });
                            }).catch(() => {
                                alert('Failed to copy. Please copy manually: ' + link);
                            });
                        });
                    }
                });
            } else {
                Swal.fire('Success', 'Payment link generated successfully. Please check your backend logs for the link details.', 'success');
            }
            
            // Refresh orders list
            const currentFilter = document.getElementById('orders-status-filter')?.value || 'All';
            await this.loadOrders(currentFilter);
        } catch (error) {
            console.error('Error generating payment link:', error);
            Swal.fire('Error', error.message || 'Failed to generate delivery payment link. Please check the console for details.', 'error');
        }
    }
}

// Export for use in admin-dashboard.js
window.OrderController = OrderController;
window.OrderModel = OrderModel;
window.OrderView = OrderView;
