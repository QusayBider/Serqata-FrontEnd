
const DeliveryManager = {
    deliverySections: [],
    freeDeliveryAboveAmount: 0,
    selectedSection: null,
    selectedCity: null,

    // Fetch delivery costs by section (all sections with cities)
    async getDeliveryCostsBySection() {
        try {
            const response = await fetch(API_CONFIG.getApiUrl('DeliveryCosts/GetBySection'));
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.success && data.data) {
                this.deliverySections = Array.isArray(data.data) ? data.data : [data.data];
            } else if (Array.isArray(data)) {
                this.deliverySections = data;
            } else {
                this.deliverySections = [];
            }
            return this.deliverySections;
        } catch (error) {
            console.error('Failed to fetch delivery costs:', error);
            this.deliverySections = [];
            return [];
        }
    },

    // Fetch company settings for free delivery threshold
    async getCompanySettings() {
        try {
            const response = await fetch(API_CONFIG.getApiUrl('Company/GetAllCompanies'));
            if (!response.ok) return;
            const data = await response.json();
            const list = (data.success && data.data) ? (Array.isArray(data.data) ? data.data : [data.data]) : (Array.isArray(data) ? data : []);
            const company = list && list.length > 0 ? list[0] : null;
            if (company && (company.freeDeliveryAboveAmount != null || company.freeDeliveryAbove != null)) {
                this.freeDeliveryAboveAmount = parseFloat(company.freeDeliveryAboveAmount ?? company.freeDeliveryAbove) || 0;
            }
        } catch (error) {
            console.error('Failed to fetch company settings:', error);
        }
    },

    getShippingCost(cartSubtotal) {
        const subtotal = parseFloat(cartSubtotal) || 0;

        // Step 1: Check for "checked by team" (-1) status first
        let rawCost = 0;
        if (this.selectedCity != null && this.selectedCity.cost != null) {
            rawCost = parseFloat(this.selectedCity.cost);
        } else if (this.selectedSection != null && this.selectedSection.cost != null) {
            rawCost = parseFloat(this.selectedSection.cost);
        }

        if (rawCost === -1) {
            return -1;
        }

        // Step 2: Check for free delivery threshold
        if (this.freeDeliveryAboveAmount > 0 && subtotal >= this.freeDeliveryAboveAmount) {
            return 0;
        }

        return rawCost || 0;
    },

    // Check if delivery is free for given subtotal
    isFreeDelivery(cartSubtotal) {
        const subtotal = parseFloat(cartSubtotal) || 0;

        // If cost is -1, it's NOT free delivery (must be checked by team)
        if (this.getShippingCost(subtotal) === -1) {
            return false;
        }

        return this.freeDeliveryAboveAmount > 0 && subtotal >= this.freeDeliveryAboveAmount;
    },

    // Load and render shipping / "Estimate for Your Country" UI
    async loadShippingOptions() {
        await this.getCompanySettings();
        const sections = await this.getDeliveryCostsBySection();

        const shippingRow = document.querySelector('.summary-shipping td:last-child');
        const estimateRow = document.getElementById('shipping-estimate-row');
        if (!estimateRow) return;

        const estimateTd = document.getElementById('delivery-estimate-content') || estimateRow.querySelector('td');
        if (!estimateTd) return;

        // Build section/city dropdowns and cost display
        if (sections.length === 0) {
            estimateTd.innerHTML = '<span class="text-muted">No delivery options</span>';
            if (shippingRow) shippingRow.textContent = 'ILS 0.00';
            return;
        }

        const firstSection = sections[0];
        const firstCities = firstSection.cities || [];
        const firstCity = firstCities.length > 0 ? firstCities[0] : null;
        this.selectedSection = firstSection;
        this.selectedCity = firstCity;
        const sectionSelectId = 'delivery-section-select';
        const citySelectId = 'delivery-city-select';
        const shippingCostSpanId = 'shipping-cost-display';

        const sectionOptions = sections.map((s, i) =>
            `<option value="${i}">${(s.sectionName || 'Country').replace(/</g, '&lt;')}</option>`
        ).join('');
        const cityOptions = firstCities.map((c) =>
            `<option value="${c.id}" data-cost="${c.cost != null ? c.cost : (firstSection.cost != null ? firstSection.cost : 0)}">${(c.cityName || 'City').replace(/</g, '&lt;')}</option>`
        ).join('');

        estimateTd.innerHTML = `
            <div class="delivery-estimate">
                <label for="${sectionSelectId}" class="d-block mb-1">Country</label>
                <select id="${sectionSelectId}" class="form-control form-control-sm mb-1">
                    ${sectionOptions}
                </select>
                <label for="${citySelectId}" class="d-block mb-1">City</label>
                <select id="${citySelectId}" class="form-control form-control-sm mb-1">
                    ${cityOptions}
                </select>
            </div>
           
        `;

        const sectionSelect = document.getElementById(sectionSelectId);
        const citySelect = document.getElementById(citySelectId);
        const shippingCostSpan = document.getElementById(shippingCostSpanId);

        // Helper to save current selection to localStorage
        const saveSelection = () => {
            if (sectionSelect && sectionSelect.selectedIndex >= 0) {
                const selectedOption = sectionSelect.options[sectionSelect.selectedIndex];
                if (selectedOption) localStorage.setItem('shipping_country', selectedOption.text);
            }
            if (citySelect && citySelect.selectedIndex >= 0) {
                const selectedOption = citySelect.options[citySelect.selectedIndex];
                if (selectedOption) localStorage.setItem('shipping_city', selectedOption.text);
            }
        };

        const updateCityDropdown = (sectionIndex) => {
            const section = sections[Number(sectionIndex)];
            if (!section || !citySelect) return;
            const cities = section.cities || [];
            citySelect.innerHTML = cities.length
                ? cities.map(c =>
                    `<option value="${c.id}" data-cost="${c.cost != null ? c.cost : (section.cost != null ? section.cost : 0)}">${(c.cityName || 'City').replace(/</g, '&lt;')}</option>`
                ).join('')
                : `<option value="" data-cost="${section.cost != null ? section.cost : 0}">${(section.sectionName || 'Section').replace(/</g, '&lt;')}</option>`;
            const first = cities[0];
            DeliveryManager.selectedSection = section;
            DeliveryManager.selectedCity = first || (cities.length === 0 ? { cost: section.cost } : null);
            if (shippingCostSpan) {
                const cost = first ? (first.cost != null ? first.cost : section.cost) : (section.cost != null ? section.cost : 0);
                const deliveryNoteEl = document.getElementById('delivery-note');
                if (cost === -1) {
                    shippingCostSpan.innerHTML = '<span class="orderText">Delivery cost will be estimated by our team.</span>';
                    if (deliveryNoteEl) deliveryNoteEl.innerHTML = '<span class="checkout-shipping text-left d-block">Delivery cost will be estimated by our team.</span>';
                } else {
                    shippingCostSpan.textContent = 'ILS ' + (cost != null ? Number(cost).toFixed(2) : '0.00');
                    if (deliveryNoteEl) deliveryNoteEl.textContent = '';
                }
            }
            updateShippingRowDisplay();
            if (typeof updateCartTotal === 'function') updateCartTotal();
            saveSelection();
        };

        const updateShippingRowDisplay = () => {
            const subtotalEl = document.getElementById('cart-subtotal');
            const subtotal = subtotalEl ? parseFloat(subtotalEl.textContent.replace(/[ILS$,\s]/g, '')) || 0 : 0;
            const cost = DeliveryManager.getShippingCost(subtotal);
            const isFree = DeliveryManager.isFreeDelivery(subtotal);
            if (shippingRow) {
                if (cost === -1) {
                    shippingRow.innerHTML = '<span class="text-danger text-left d-block">Delivery cost will be estimated by our team.</span>';
                } else {
                    shippingRow.textContent = isFree ? 'Free' : ('ILS ' + cost.toFixed(2));
                }
            }
            if (shippingCostSpan) {
                const deliveryNoteEl = document.getElementById('delivery-note');
                if (cost === -1) {
                    shippingCostSpan.innerHTML = '<span class="orderText">Delivery cost will be estimated by our team.</span>';
                    if (deliveryNoteEl) deliveryNoteEl.innerHTML = '<span class="checkout-shipping  text-left d-block">Delivery cost will be estimated by our team.</span>';
                } else {
                    shippingCostSpan.textContent = isFree ? 'Free (order above ILS ' + DeliveryManager.freeDeliveryAboveAmount + ')' : ('ILS ' + cost.toFixed(2));
                    if (deliveryNoteEl) deliveryNoteEl.textContent = '';
                }
            }
        };

        sectionSelect.addEventListener('change', function () {
            updateCityDropdown(this.value);
        });

        citySelect.addEventListener('change', function () {
            const opt = this.options[this.selectedIndex];
            const cost = opt ? parseFloat(opt.getAttribute('data-cost')) : 0;
            DeliveryManager.selectedCity = {
                id: this.value ? parseInt(this.value, 10) : null,
                cityName: opt ? opt.textContent : '',
                cost: cost
            };
            if (shippingCostSpan) {
                const deliveryNoteEl = document.getElementById('delivery-note');
                if (cost === -1) {
                    shippingCostSpan.innerHTML = '<span class="orderText">Delivery cost will be estimated by our team.</span>';
                    if (deliveryNoteEl) deliveryNoteEl.innerHTML = '<span class="checkout-shipping  text-left d-block">Delivery cost will be estimated by our team.</span>';
                } else {
                    shippingCostSpan.textContent = 'ILS ' + cost.toFixed(2);
                    if (deliveryNoteEl) deliveryNoteEl.textContent = '';
                }
            }
            updateShippingRowDisplay();
            if (typeof updateCartTotal === 'function') updateCartTotal();
            saveSelection();
        });

        // Initial display
        updateShippingRowDisplay();
        // Also save initial selection (usually the first one)
        saveSelection();

        if (shippingRow) {
            const subtotalEl = document.getElementById('cart-subtotal');
            const subtotal = subtotalEl ? parseFloat(subtotalEl.textContent.replace(/[ILS$,\s]/g, '')) || 0 : 0;
            const cost = this.getShippingCost(subtotal);
            const isFree = this.isFreeDelivery(subtotal);
            if (cost === -1) {
                shippingRow.innerHTML = '<span class=".checkout-shipping text-left d-block">Delivery cost will be estimated by our team.</span>';
            } else {
                shippingRow.textContent = isFree ? 'Free' : ('ILS ' + cost.toFixed(2));
            }
        }
    },

    // Call after cart subtotal changes (e.g. after renderCart) to refresh shipping row and total
    refreshShippingDisplay() {
        const shippingRow = document.querySelector('.summary-shipping td:last-child');
        const shippingCostSpan = document.getElementById('shipping-cost-display');
        const subtotalEl = document.getElementById('cart-subtotal');
        const subtotal = subtotalEl ? parseFloat(subtotalEl.textContent.replace(/[ILS$,\s]/g, '')) || 0 : 0;
        const cost = this.getShippingCost(subtotal);
        const isFree = this.isFreeDelivery(subtotal);
        if (shippingRow) {
            if (cost === -1) {
                shippingRow.innerHTML = '<span class="checkout-shipping text-left d-block">Delivery cost will be estimated by our team.</span>';
            } else {
                shippingRow.textContent = isFree ? 'Free' : ('ILS ' + cost.toFixed(2));
            }
        }
        if (shippingCostSpan) {
            if (cost === -1) {
                shippingCostSpan.innerHTML = '<span class="text-danger">Delivery cost will be estimated by our team.</span>';
            } else {
                shippingCostSpan.textContent = isFree ? 'Free (order above ILS ' + this.freeDeliveryAboveAmount + ')' : ('ILS ' + cost.toFixed(2));
            }
        }
    }
};

window.DeliveryManager = DeliveryManager;
