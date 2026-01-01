// Delivery/Shipping Management System
const DeliveryManager = {
    deliveryOptions: [],
    selectedDelivery: null,

    // Get delivery options by section and city
    async getDeliveryOptions(sectionId = null, cityId = null) {
        try {
            let url = API_CONFIG.getApiUrl('Deliveries');
            const params = new URLSearchParams();
            
            if (sectionId) {
                params.append('sectionId', sectionId);
            }
            if (cityId) {
                params.append('cityId', cityId);
            }
            
            if (params.toString()) {
                url += '?' + params.toString();
            }
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Fetched delivery options:", data);
            
            // Handle different response formats
            if (data.success && data.data) {
                this.deliveryOptions = Array.isArray(data.data) ? data.data : [data.data];
            } else if (Array.isArray(data)) {
                this.deliveryOptions = data;
            } else if (data.data && Array.isArray(data.data)) {
                this.deliveryOptions = data.data;
            } else {
                this.deliveryOptions = [];
            }
            
            return this.deliveryOptions;
        } catch (error) {
            console.error("Failed to fetch delivery options:", error);
            this.deliveryOptions = [];
            return [];
        }
    },

    // Get all sections (for address selection)
    async getSections() {
        try {
            const response = await fetch(API_CONFIG.getApiUrl('Sections'));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.data) {
                return Array.isArray(data.data) ? data.data : [data.data];
            } else if (Array.isArray(data)) {
                return data;
            }
            
            return [];
        } catch (error) {
            console.error("Failed to fetch sections:", error);
            return [];
        }
    },

    // Get all cities
    async getCities() {
        try {
            const response = await fetch(API_CONFIG.getApiUrl('Cities'));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.data) {
                return Array.isArray(data.data) ? data.data : [data.data];
            } else if (Array.isArray(data)) {
                return data;
            }
            
            return [];
        } catch (error) {
            console.error("Failed to fetch cities:", error);
            return [];
        }
    },

    // Load and render shipping options
    async loadShippingOptions(containerSelector = '.summary-shipping-row', sectionId = null, cityId = null) {
        try {
            const options = await this.getDeliveryOptions(sectionId, cityId);
            const container = document.querySelector(containerSelector);
            
            if (!container) {
                console.warn('Shipping container not found');
                return;
            }

            // Find the parent tbody to insert rows
            const tbody = container.closest('tbody') || container.parentElement;
            if (!tbody) return;

            // Remove existing shipping rows (except the header)
            const existingRows = tbody.querySelectorAll('.summary-shipping-row');
            existingRows.forEach(row => {
                if (row.querySelector('input[name="shipping"]')) {
                    row.remove();
                }
            });

            if (options.length === 0) {
                // Default free shipping option
                const freeShippingRow = document.createElement('tr');
                freeShippingRow.className = 'summary-shipping-row';
                freeShippingRow.innerHTML = `
                    <td>
                        <div class="custom-control custom-radio">
                            <input type="radio" id="free-shipping" name="shipping" class="custom-control-input" value="0" checked>
                            <label class="custom-control-label" for="free-shipping">Free Shipping</label>
                        </div>
                    </td>
                    <td>$0.00</td>
                `;
                tbody.insertBefore(freeShippingRow, tbody.querySelector('.summary-shipping-estimate'));
                return;
            }

            // Render delivery options
            options.forEach((option, index) => {
                const deliveryId = option.id || option.deliveryId;
                const deliveryName = option.name || option.deliveryName || `Delivery Option ${index + 1}`;
                const cost = option.cost || option.price || 0;
                const isDefault = index === 0;

                const row = document.createElement('tr');
                row.className = 'summary-shipping-row';
                row.innerHTML = `
                    <td>
                        <div class="custom-control custom-radio">
                            <input type="radio" id="shipping-${deliveryId}" name="shipping" class="custom-control-input" value="${cost}" data-delivery-id="${deliveryId}" ${isDefault ? 'checked' : ''}>
                            <label class="custom-control-label" for="shipping-${deliveryId}">${deliveryName}</label>
                        </div>
                    </td>
                    <td>$${cost.toFixed(2)}</td>
                `;
                
                // Insert before the estimate row
                const estimateRow = tbody.querySelector('.summary-shipping-estimate');
                if (estimateRow) {
                    tbody.insertBefore(row, estimateRow);
                } else {
                    tbody.appendChild(row);
                }
            });

            // Add event listeners for shipping selection
            tbody.querySelectorAll('input[name="shipping"]').forEach(radio => {
                radio.addEventListener('change', function() {
                    DeliveryManager.selectedDelivery = {
                        id: this.getAttribute('data-delivery-id'),
                        cost: parseFloat(this.value)
                    };
                    // Trigger cart total update
                    if (typeof updateCartTotal === 'function') {
                        updateCartTotal();
                    }
                });
            });

            // Set default selection
            if (options.length > 0) {
                const firstOption = options[0];
                this.selectedDelivery = {
                    id: firstOption.id || firstOption.deliveryId,
                    cost: firstOption.cost || firstOption.price || 0
                };
            }
        } catch (error) {
            console.error('Error loading shipping options:', error);
        }
    }
};

// Make DeliveryManager globally available
window.DeliveryManager = DeliveryManager;

