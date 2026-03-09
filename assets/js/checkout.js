// Checkout Management System
const CheckoutManager = {
    // Company settings
    freeDeliveryAboveAmount: 0,
    currentDeliveryCost: 0,
    currentDeliveryCostId: null,
    currentSubtotal: 0,
    originalSubtotal: 0,
    currentDiscount: 0,
    appliedCoupon: null,
    deliverySections: [],

    // Check if user is authenticated
    isAuthenticated: function () {
        if (typeof window.isAuthenticated === 'function') {
            const isAuth = window.isAuthenticated();
            if (isAuth && typeof window.getUserRole === 'function') {
                const role = window.getUserRole();
                if (role && role.toLowerCase() === 'admin') return false;
            }
            return isAuth;
        }

        const isAuthCookie = this.getCookieValue('isAuthenticated') === 'true';
        const hasToken = this.getCookieValue('authToken') !== null;
        if (isAuthCookie && hasToken) {
            const role = this.getCookieValue('userRole');
            if (role && role.toLowerCase() === 'admin') return false;
            return true;
        }
        return false;
    },

    // Get authentication token
    getToken: function () {
        if (typeof window.getToken === 'function') {
            return window.getToken();
        }
        return this.getCookieValue('authToken');
    },

    // Helper to get cookie value by name
    getCookieValue: function (name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },

    // Load cart items for checkout
    async loadCartForCheckout() {
        try {
            const cartData = await CartManager.getCartItems();
            return cartData;
        } catch (error) {
            console.error('Error loading cart for checkout:', error);
            return { success: false, items: [], totalAmount: 0 };
        }
    },

    // Process checkout for authenticated user
    async processAuthenticatedCheckout(checkoutData) {
        try {
            const token = this.getToken();
            const response = await fetch(API_CONFIG.getApiUrl('Customer/CheckOuts/Payment'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(checkoutData)
            });

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                return { success: response.ok, ...data };
            } else {
                const text = await response.text();
                // Sometimes successful requests might return empty body or text
                return { success: response.ok, message: text || (response.ok ? 'Checkout successful' : 'Checkout failed') };
            }
        } catch (error) {
            console.error('Error processing checkout:', error);
            return { success: false, message: error.message || 'An error occurred during checkout' };
        }
    },

    // Process checkout for guest user
    async processGuestCheckout(checkoutData) {
        try {
            const response = await fetch(API_CONFIG.getApiUrl('Customer/CheckOuts/GuestPayment'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(checkoutData)
            });

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                return { success: response.ok, ...data };
            } else {
                const text = await response.text();
                return { success: response.ok, message: text || (response.ok ? 'Checkout successful' : 'Checkout failed') };
            }
        } catch (error) {
            console.error('Error processing guest checkout:', error);
            return { success: false, message: error.message || 'An error occurred during checkout' };
        }
    },

    // Fetch company settings for free delivery threshold
    async fetchCompanySettings() {
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

    // Calculate delivery cost based on country, city, and subtotal
    calculateDeliveryCost(countryName, cityName, subtotal) {
        // Find the selected section (country)
        const section = this.deliverySections.find(s => s.sectionName === countryName);

        if (!section) return 0;


        if ((countryName.toLowerCase() === 'palestine' || section.cost == -1) && this.freeDeliveryAboveAmount > 0 && subtotal >= this.freeDeliveryAboveAmount) {
            return 0;
        }

        // Find city cost if city is selected
        if (cityName && section.cities) {
            const city = section.cities.find(c => c.cityName === cityName);
            if (city && city.cost != null) {
                return parseFloat(city.cost);
            }
        }

        // Fallback to section cost
        if (section.cost != null) {
            return parseFloat(section.cost);
        }

        return 0;
    },

    updateOrderSummaryWithDiscount() {
        const $shipping = $('#checkout-shipping');
        const $total = $('#checkout-total');
        const $subtotalDisplay = $('#checkout-subtotal');
        const $msg = $('#checkout-coupon-message');

        const cartData = this.latestCartData;
        if (!cartData) return 'product';

        const useCoupon = cartData.discountSource === 'coupon';
        const finalSubtotal = useCoupon ? (cartData.originalTotalAmount || 0) : (cartData.totalAmount || 0);
        const appliedDiscount = useCoupon ? (cartData.couponBenefit || 0) : 0;

        // Update display subtotal
        $subtotalDisplay.text(`ILS ${finalSubtotal.toFixed(2)}`);

        if (this.currentDeliveryCost === -1) {
            $shipping.html('<span class="text-danger orderText text-left d-block">Delivery cost will be estimated by our team.</span>');
        } else if (this.currentDeliveryCost === 0) {
            // Check if it's free because of Palestine rule
            const countrySelect = document.getElementById('checkout-country');
            const selectedCountry = countrySelect ? countrySelect.options[countrySelect.selectedIndex]?.text : '';

            if (selectedCountry.toLowerCase() === 'palestine' && this.freeDeliveryAboveAmount > 0 && finalSubtotal >= this.freeDeliveryAboveAmount) {
                $shipping.html(`<span class="text-success">Free shoping</span>`);
            } else {
                $shipping.text('Free shipping');
            }
        } else {
            $shipping.text(`ILS ${this.currentDeliveryCost.toFixed(2)}`);
        }

        // Show/update discount row if discount is applied
        let $discountRow = $('#checkout-discount-row');
        if (appliedDiscount > 0) {
            if ($discountRow.length === 0) {
                // Add discount row after shipping row
                const discountRowHTML = `
                    <tr id="checkout-discount-row">
                        <td>Discount:</td>
                        <td class="text-success">-ILS ${appliedDiscount.toFixed(2)}</td>
                    </tr>
                `;
                $shipping.parent().after(discountRowHTML);
            } else {
                // Update existing discount row
                $discountRow.find('td:last').html(`<span class="text-success">-ILS ${appliedDiscount.toFixed(2)}</span>`);
            }
        } else {
            // Remove discount row if no discount
            $discountRow.remove();
        }

        // Inform user if coupon is redundant
        if (cartData.appliedCoupon) {
            if (useCoupon) {
                $msg.text('Coupon provides a better discount! Applied to original prices.').removeClass('text-info').addClass('text-success').show();
            } else {
                $msg.text('Product discounts are better than this coupon. Store discounts applied.').removeClass('text-success').addClass('text-info').show();
            }
        } else {
            $msg.hide();
        }

        const deliveryToAdd = this.currentDeliveryCost > 0 ? this.currentDeliveryCost : 0;
        let finalTotal = finalSubtotal + deliveryToAdd - appliedDiscount;
        if (finalTotal < 0) finalTotal = 0; // Ensure total doesn't go negative

        $total.text(`ILS ${Math.round(finalTotal)}`);

        return cartData.discountSource;
    },

    updateOrderSummary(deliveryCost, subtotal) {
        this.currentDeliveryCost = deliveryCost;
        this.currentSubtotal = subtotal;
        this.updateOrderSummaryWithDiscount();
    },

    async initializeAddressFields() {
        try {
            const sections = await DeliveryManager.getDeliveryCostsBySection();
            const countrySelect = document.getElementById('checkout-country');
            const citySelect = document.getElementById('checkout-city');
            const phoneInput = document.getElementById('checkout-phone');

            if (!countrySelect || !citySelect) return;

            // Store sections for delivery cost calculation
            this.deliverySections = sections;

            // Comprehensive world country phone codes
            const worldPhoneCodes = {
                'Afghanistan': '+93', 'Albania': '+355', 'Algeria': '+213', 'Andorra': '+376',
                'Angola': '+244', 'Argentina': '+54', 'Armenia': '+374', 'Australia': '+61',
                'Austria': '+43', 'Azerbaijan': '+994', 'Bahamas': '+1-242', 'Bahrain': '+973',
                'Bangladesh': '+880', 'Belarus': '+375', 'Belgium': '+32', 'Belize': '+501',
                'Benin': '+229', 'Bhutan': '+975', 'Bolivia': '+591', 'Bosnia and Herzegovina': '+387',
                'Botswana': '+267', 'Brazil': '+55', 'Brunei': '+673', 'Bulgaria': '+359',
                'Burkina Faso': '+226', 'Burundi': '+257', 'Cambodia': '+855', 'Cameroon': '+237',
                'Canada': '+1', 'Cape Verde': '+238', 'Central African Republic': '+236', 'Chad': '+235',
                'Chile': '+56', 'China': '+86', 'Colombia': '+57', 'Comoros': '+269',
                'Congo': '+242', 'Costa Rica': '+506', 'Croatia': '+385', 'Cuba': '+53',
                'Cyprus': '+357', 'Czech Republic': '+420', 'Denmark': '+45', 'Djibouti': '+253',
                'Dominican Republic': '+1-809', 'Ecuador': '+593', 'Egypt': '+20', 'El Salvador': '+503',
                'Equatorial Guinea': '+240', 'Eritrea': '+291', 'Estonia': '+372', 'Ethiopia': '+251',
                'Fiji': '+679', 'Finland': '+358', 'France': '+33', 'Gabon': '+241',
                'Gambia': '+220', 'Georgia': '+995', 'Germany': '+49', 'Ghana': '+233',
                'Greece': '+30', 'Grenada': '+1-473', 'Guatemala': '+502', 'Guinea': '+224',
                'Guinea-Bissau': '+245', 'Guyana': '+592', 'Haiti': '+509', 'Honduras': '+504',
                'Hungary': '+36', 'Iceland': '+354', 'India': '+91', 'Indonesia': '+62',
                'Iran': '+98', 'Iraq': '+964', 'Ireland': '+353', 'Israel': '+972',
                'Italy': '+39', 'Jamaica': '+1-876', 'Japan': '+81', 'Jordan': '+962',
                'Kazakhstan': '+7', 'Kenya': '+254', 'Kuwait': '+965', 'Kyrgyzstan': '+996',
                'Laos': '+856', 'Latvia': '+371', 'Lebanon': '+961', 'Lesotho': '+266',
                'Liberia': '+231', 'Libya': '+218', 'Liechtenstein': '+423', 'Lithuania': '+370',
                'Luxembourg': '+352', 'Madagascar': '+261', 'Malawi': '+265', 'Malaysia': '+60',
                'Maldives': '+960', 'Mali': '+223', 'Malta': '+356', 'Mauritania': '+222',
                'Mauritius': '+230', 'Mexico': '+52', 'Moldova': '+373', 'Monaco': '+377',
                'Mongolia': '+976', 'Montenegro': '+382', 'Morocco': '+212', 'Mozambique': '+258',
                'Myanmar': '+95', 'Namibia': '+264', 'Nepal': '+977', 'Netherlands': '+31',
                'New Zealand': '+64', 'Nicaragua': '+505', 'Niger': '+227', 'Nigeria': '+234',
                'North Korea': '+850', 'North Macedonia': '+389', 'Norway': '+47', 'Oman': '+968',
                'Pakistan': '+92', 'Palestine': '+970', 'Panama': '+507', 'Papua New Guinea': '+675',
                'Paraguay': '+595', 'Peru': '+51', 'Philippines': '+63', 'Poland': '+48',
                'Portugal': '+351', 'Qatar': '+974', 'Romania': '+40', 'Russia': '+7',
                'Rwanda': '+250', 'Saudi Arabia': '+966', 'Senegal': '+221', 'Serbia': '+381',
                'Seychelles': '+248', 'Sierra Leone': '+232', 'Singapore': '+65', 'Slovakia': '+421',
                'Slovenia': '+386', 'Somalia': '+252', 'South Africa': '+27', 'South Korea': '+82',
                'South Sudan': '+211', 'Spain': '+34', 'Sri Lanka': '+94', 'Sudan': '+249',
                'Suriname': '+597', 'Sweden': '+46', 'Switzerland': '+41', 'Syria': '+963',
                'Taiwan': '+886', 'Tajikistan': '+992', 'Tanzania': '+255', 'Thailand': '+66',
                'Togo': '+228', 'Trinidad and Tobago': '+1-868', 'Tunisia': '+216', 'Turkey': '+90',
                'Turkmenistan': '+993', 'Uganda': '+256', 'Ukraine': '+380', 'United Arab Emirates': '+971',
                'United Kingdom': '+44', 'United States': '+1', 'Uruguay': '+598', 'Uzbekistan': '+998',
                'Venezuela': '+58', 'Vietnam': '+84', 'Yemen': '+967', 'Zambia': '+260', 'Zimbabwe': '+263'
            };

            // Map to store phone codes by country index
            const phoneCodeMap = new Map();

            // Populate Countries and build phone code map
            let countryOptions = '<option value="">Select a country</option>';
            sections.forEach((section, index) => {
                const countryName = section.sectionName || 'Country';
                const phoneCode = section.phoneCode || worldPhoneCodes[countryName] || '';

                countryOptions += `<option value="${index}" data-name="${countryName}" data-id="${section.id}" data-phone-code="${phoneCode}">${countryName}</option>`;

                if (phoneCode) {
                    phoneCodeMap.set(index, phoneCode);
                }
            });
            countrySelect.innerHTML = countryOptions;

            // Handle Country Change - update cities, phone code, and delivery cost
            countrySelect.addEventListener('change', function () {
                const selectedIndex = this.value;
                citySelect.innerHTML = '<option value="">Select a city</option>';

                if (selectedIndex !== "") {
                    const section = sections[selectedIndex];

                    // Update cities
                    if (section && section.cities && section.cities.length > 0) {
                        section.cities.forEach(city => {
                            citySelect.innerHTML += `<option value="${city.id}" data-name="${city.cityName}" data-cost="${city.cost ?? section.cost ?? 0}">${city.cityName}</option>`;
                        });
                        // Clear deliveryCostId until a city is selected, or use section ID as default?
                        // Usually, if cities exist, one must be chosen.
                        CheckoutManager.currentDeliveryCostId = null;
                    } else if (section) {
                        // No cities, use section ID as deliveryCostId
                        CheckoutManager.currentDeliveryCostId = section.id;
                        CheckoutManager.currentDeliveryCost = parseFloat(section.cost) || 0;
                    }

                    // Get phone code from API or fallback to world codes
                    const countryName = section.sectionName;
                    const phoneCode = section.phoneCode || worldPhoneCodes[countryName] || '';

                    // Update phone field with country code
                    if (phoneInput && phoneCode) {
                        const currentPhone = phoneInput.value;

                        // Remove any existing country code from the phone number
                        let phoneNumber = currentPhone;
                        Object.values(worldPhoneCodes).forEach(code => {
                            if (phoneNumber.startsWith(code)) {
                                phoneNumber = phoneNumber.substring(code.length).trim();
                            }
                        });

                        // Set new phone code with the cleaned number
                        phoneInput.value = phoneCode + (phoneNumber ? ' ' + phoneNumber : ' ');
                        phoneInput.placeholder = `${phoneCode} XXXXXXXXX`;
                    }

                    // Update delivery cost
                    const deliveryCost = CheckoutManager.calculateDeliveryCost(countryName, '', CheckoutManager.currentSubtotal);
                    CheckoutManager.updateOrderSummary(deliveryCost, CheckoutManager.currentSubtotal);
                }
            });

            // Handle City Change - update delivery cost and ID
            citySelect.addEventListener('change', function () {
                const countryIndex = countrySelect.value;
                if (countryIndex !== "") {
                    const section = sections[countryIndex];
                    const countryName = section.sectionName;
                    const selectedCityOption = this.options[this.selectedIndex];
                    const cityName = selectedCityOption ? selectedCityOption.getAttribute('data-name') : '';
                    const cityId = this.value;

                    CheckoutManager.currentDeliveryCostId = cityId ? parseInt(cityId) : section.id;

                    const deliveryCost = CheckoutManager.calculateDeliveryCost(countryName, cityName, CheckoutManager.currentSubtotal);
                    CheckoutManager.updateOrderSummary(deliveryCost, CheckoutManager.currentSubtotal);
                }
            });

            // Pre-fill from localStorage if available
            const savedCountry = localStorage.getItem('shipping_country');
            const savedCity = localStorage.getItem('shipping_city');

            if (savedCountry) {
                // Find option with text matching savedCountry
                const countryOption = Array.from(countrySelect.options).find(opt => opt.text === savedCountry);
                if (countryOption) {
                    countrySelect.value = countryOption.value;
                    // Trigger change to populate cities and phone code
                    countrySelect.dispatchEvent(new Event('change'));

                    if (savedCity) {
                        const cityOption = Array.from(citySelect.options).find(opt => opt.getAttribute('data-name') === savedCity);
                        if (cityOption) {
                            citySelect.value = cityOption.value;
                            citySelect.dispatchEvent(new Event('change'));
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error initializing address fields:', error);
        }
    },

    // Main checkout function
    async processCheckout(formData) {
        const cartData = await this.loadCartForCheckout();

        if (!cartData.success || cartData.items.length === 0) {
            if (typeof notyf !== 'undefined') {
                notyf.error('Your cart is empty');
            } else {
                alert('Your cart is empty');
            }
            return;
        }

        // Use the centralized discount decision
        const effectiveDiscountCode = (cartData.discountSource === 'coupon' && cartData.appliedCoupon)
            ? cartData.appliedCoupon.code
            : null;

        if (this.isAuthenticated()) {
            const checkoutRequest = {
                paymentMethod: formData.paymentMethod,
                discountCode: effectiveDiscountCode,
                address: formData.address,
                phone: formData.phone,
                country: formData.country,
                deliveryCostId: this.currentDeliveryCostId
            };
            const result = await this.processAuthenticatedCheckout(checkoutRequest);
            this.handleCheckoutResult(result);
            return result;
        } else {
            const guestItems = cartData.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity
            }));

            const checkoutRequest = {
                paymentMethod: formData.paymentMethod,
                items: guestItems,
                customerName: `${formData.firstName} ${formData.lastName}`.trim(),
                customerEmail: formData.email,
                address: formData.address,
                phoneNumber: formData.phone,
                discountCode: effectiveDiscountCode,
                country: formData.country,
                deliveryCostId: this.currentDeliveryCostId
            };
            const result = await this.processGuestCheckout(checkoutRequest);
            this.handleCheckoutResult(result);
            return result;
        }
    },

    handleCheckoutResult(result) {
        // Mark as handled to prevent duplicate handling in submit handler
        result.handled = true;

        if (result.success) {
            // Determine redirect URL from various fields
            const redirectUrl = result.checkoutUrl || result.url || result.link ||
                (result.data && (result.data.url || result.data.link));

            if (redirectUrl) {
                // Redirect to payment provider
                window.location.href = redirectUrl;
            } else {
                // Direct success (e.g., cash on delivery)
                const paymentMethod = $('input[name="paymentMethod"]:checked').val() === 'cash' ? 'Cash' : 'Visa';
                const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);

                // Extract distinct Order ID and Tracking Code
                const actualOrderId = result.orderId || result.id || (result.data && (result.data.orderId || result.data.id));
                const trackingCode = result.trackingCode || result.trackingNumber || (result.data && (result.data.trackingCode || result.data.trackingNumber));


                const finalOrderId = actualOrderId || trackingCode; // Use tracking code as ID if ID is missing (fallback)
                const finalTracking = trackingCode;

                // Show message
                let successMsg = result.message || 'Order placed successfully!';
                if (finalOrderId) successMsg += ` Order ID: ${finalOrderId}`;
                if (finalTracking && finalTracking !== finalOrderId) successMsg += ` Tracking Number: ${finalTracking}`;

                $('#checkout-message').addClass('alert alert-success').text(successMsg).show();

                // Redirect if we have an ID
                if (finalOrderId) {
                    // Cleanup
                    localStorage.removeItem('applied_coupon');
                    localStorage.removeItem('shipping_country');
                    localStorage.removeItem('shipping_city');
                    if (!this.isAuthenticated()) {
                        if (typeof CartManager !== 'undefined') {
                            CartManager.saveCartToCookie([]);
                        }
                    }

                    setTimeout(() => {
                        let url = `${baseUrl}order-success.html?orderId=${finalOrderId}&paymentMethod=${paymentMethod}`;
                        if (finalTracking) url += `&trackingNumber=${finalTracking}`;
                        window.location.href = url;
                    }, 500);
                } else {
                    // Fallback if success but no ID found
                    // Cleanup anyway
                    localStorage.removeItem('applied_coupon');
                    localStorage.removeItem('shipping_country');
                    localStorage.removeItem('shipping_city');
                    if (!this.isAuthenticated()) CartManager.saveCartToCookie([]);

                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                }
            }
        } else {
            if (typeof notyf !== 'undefined') {
                notyf.error(result.message || 'Checkout failed');
            } else {
                alert(result.message || 'Checkout failed');
            }
        }
    }
};

// Make CheckoutManager globally available
window.CheckoutManager = CheckoutManager;

// Initialize on page load
$(document).ready(async function () {
    // Only run on checkout page
    if ($('.checkout').length === 0) return;

    // Helper to load order summary
    async function loadOrderSummary() {
        const $tbody = $('#checkout-items-tbody');
        const $subtotal = $('#checkout-subtotal');
        const $total = $('#checkout-total');
        const $btn = $('#checkout-submit-btn');

        // Show loading state
        $tbody.html('<tr><td colspan="2" class="text-center">Loading...</td></tr>');
        $btn.prop('disabled', true);

        const cartData = await CheckoutManager.loadCartForCheckout();

        if (cartData.success && cartData.items.length > 0) {
            // Store cart data in CheckoutManager
            CheckoutManager.currentSubtotal = cartData.totalAmount;
            CheckoutManager.originalSubtotal = cartData.originalTotalAmount;
            CheckoutManager.latestCartData = cartData;

            // Determine which discount source is better
            const discountSource = CheckoutManager.updateOrderSummaryWithDiscount();

            $tbody.empty();
            cartData.items.forEach(item => {
                const itemPrice = discountSource === 'coupon' ? item.originalTotalPrice : item.totalPrice;
                const html = `
                    <tr>
                        <td><a href="Product_Details.html?id=${item.productId}">${item.productName}</a> x${item.quantity}</td>
                        <td>ILS ${itemPrice.toFixed(2)}${discountSource === 'coupon' && item.discount > 0 ? `` : ''}</td>
                    </tr>
                `;
                $tbody.append(html);
            });

            // Calculate initial delivery cost based on saved country/city
            const savedCountry = localStorage.getItem('shipping_country');
            const savedCity = localStorage.getItem('shipping_city');

            if (savedCountry) {
                const deliveryCost = CheckoutManager.calculateDeliveryCost(savedCountry, savedCity || '', CheckoutManager.originalSubtotal);
                CheckoutManager.updateOrderSummary(deliveryCost, CheckoutManager.currentSubtotal);
            }

            $btn.prop('disabled', false);
        } else {
            $tbody.html('<tr><td colspan="2" class="text-center">Your cart is empty.</td></tr>');
            $subtotal.text('ILS 0.00');
            $total.text('ILS 0.00');
            $btn.prop('disabled', true);
        }
    }

    await CheckoutManager.fetchCompanySettings();
    await CheckoutManager.initializeAddressFields();
    await loadOrderSummary();

    try {
        const storedCoupon = localStorage.getItem('applied_coupon');
        if (storedCoupon) {
            const coupon = JSON.parse(storedCoupon);
            if (coupon && coupon.code) {
                const couponInput = document.getElementById('checkout-discount-input');
                if (couponInput) {
                    couponInput.value = coupon.code;
                    couponInput.classList.add('has-value');
                }

                if (typeof CouponManager !== 'undefined') {
                    const result = await CouponManager.applyCoupon(coupon.code, CheckoutManager.originalSubtotal);
                    const $msg = $('#checkout-coupon-message');
                    const $input = $('#checkout-discount-input');

                    if (result.success && result.coupon) {
                        CheckoutManager.appliedCoupon = result.coupon;
                        CheckoutManager.updateOrderSummaryWithDiscount();
                        // Rerender items to show original prices if coupon is better
                        await loadOrderSummary();

                        $msg.text(result.message || 'Coupon applied!').removeClass('text-danger').addClass('text-success').show();
                        $input.css('border-color', '#28a745');
                    } else {
                        $msg.text(result.message || 'Coupon code does not exist.').removeClass('text-success').addClass('text-danger').show();
                        $input.css('border-color', '#dc3545');
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading coupon:', error);
    }

    // Add event listener for coupon input changes
    const couponInput = document.getElementById('checkout-discount-input');
    if (couponInput) {
        let couponValidationTimeout;

        couponInput.addEventListener('input', function () {
            const couponCode = this.value.trim();

            // Add/remove has-value class based on input
            if (couponCode) {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }

            // Clear previous timeout
            if (couponValidationTimeout) {
                clearTimeout(couponValidationTimeout);
            }

            // Validate after user stops typing (500ms delay)
            couponValidationTimeout = setTimeout(async () => {
                const $msg = $('#checkout-coupon-message');
                if (couponCode && typeof CouponManager !== 'undefined') {
                    const result = await CouponManager.applyCoupon(couponCode, CheckoutManager.originalSubtotal);
                    if (result.success && result.coupon) {
                        CheckoutManager.appliedCoupon = result.coupon;
                        CheckoutManager.updateOrderSummaryWithDiscount();
                        // Rerender items to show original prices if coupon is better
                        await loadOrderSummary();

                        // Note: updateOrderSummaryWithDiscount might have updated the message
                        if (!$msg.text().includes('Applied to original prices')) {
                            $msg.text(result.message || 'Coupon applied!').removeClass('text-danger').addClass('text-success').show();
                        }
                        $(this).css('border-color', '#28a745'); // Green for success
                    } else {
                        // Invalid coupon, clear discount
                        CheckoutManager.appliedCoupon = null;
                        CheckoutManager.updateOrderSummaryWithDiscount();
                        await loadOrderSummary();

                        // Show error message
                        $msg.text(result.message || 'Coupon code does not exist.').removeClass('text-success').addClass('text-danger').show();
                        $(this).css('border-color', '#dc3545'); // Red for error
                    }
                } else if (!couponCode) {
                    // Empty input, clear discount, storage and messages
                    if (typeof CouponManager !== 'undefined') {
                        CouponManager.removeCoupon();
                    }
                    CheckoutManager.appliedCoupon = null;
                    CheckoutManager.updateOrderSummaryWithDiscount();
                    await loadOrderSummary();
                    $msg.hide();
                    $(this).css('border-color', '');
                }
            }, 500);
        });
    }

    // Handle form submission
    $('#checkout-form').on('submit', async function (e) {
        e.preventDefault();

        const $form = $(this);
        const $btn = $('#checkout-submit-btn');
        const $message = $('#checkout-message');

        // Basic validation
        if (!this.checkValidity()) {
            e.stopPropagation();
            $form.addClass('was-validated');
            $form.find(':invalid').first().focus();
            return;
        }

        // Gather form data
        const countrySelect = document.getElementById('checkout-country');
        const countryText = countrySelect ? countrySelect.options[countrySelect.selectedIndex].text : '';
        const citySelect = document.getElementById('checkout-city');
        const city = citySelect ? citySelect.options[citySelect.selectedIndex].text : '';
        const address = $('#checkout-address').val()?.trim() || '';

        const formData = {
            firstName: $('#checkout-firstname').val()?.trim() || '',
            lastName: $('#checkout-lastname').val()?.trim() || '',
            address: address,
            city: city,
            country: countryText,
            phone: $('#checkout-phone').val()?.trim() || '',
            email: $('#checkout-email').val()?.trim() || '',
            notes: $('#checkout-notes').val()?.trim() || '',
            paymentMethod: $('input[name="paymentMethod"]:checked').val(),
            discountCode: $('#checkout-discount-input').val()?.trim() || null
        };

        // Create full address for API if needed, otherwise use street address
        let fullAddress = address;
        if (city) fullAddress += ', ' + city;
        if (countryText) fullAddress += ', ' + countryText;
        formData.address = fullAddress;

        // Check main discount input if the top one is empty
        if (!formData.discountCode) {
            formData.discountCode = $('#checkout-discount').val()?.trim() || null;
        }
        if (formData.discountCode === "") formData.discountCode = null;

        // Disable button and show processing state
        const originalBtnText = $btn.html();

        // Validate phone number (simple regex for digits, spaces, and optional leading +)
        const phone = formData.phone;
        const phoneRegex = /^\+?[0-9\s-]{7,15}$/;
        const $phoneError = $('#phone-error');
        if (!phoneRegex.test(phone)) {
            $phoneError.text('Please enter a valid phone number (7-15 digits).').show();
            $('#checkout-phone').addClass('is-invalid').focus();
            return;
        } else {
            $phoneError.hide();
            $('#checkout-phone').removeClass('is-invalid');
        }

        $btn.prop('disabled', true).html('<span>Processing...</span>');
        $message.hide().removeClass('alert-success alert-danger');

        try {
            const result = await CheckoutManager.processCheckout(formData);

            if (result.success) {
                // Check if already handled (e.g., by Cash checkout redirect)
                if (result.handled) return;

                // Success
                $message.addClass('alert alert-success').text(result.message || 'Order placed successfully!').show();

                // Handle redirect for Visa or success page
                const redirectUrl = result.url || result.link || (result.data && result.data.link) || (result.data && result.data.url);
                const orderId = result.orderId || (result.data && result.data.orderId);

                if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else if (orderId) {
                    // Redirect to success page with orderId
                    const currentPath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
                    const baseUrl = window.location.origin + currentPath;
                    window.location.href = `${baseUrl}order-success.html?orderId=${orderId}&paymentMethod=${formData.paymentMethod === 'cash' ? 'Cash' : 'Visa'}`;
                } else {
                    // Fallback redirect to home after a delay
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                }
            } else {
                // Error
                $message.addClass('alert alert-danger').text(result.message || 'Failed to place order. Please try again.').show();
                $btn.prop('disabled', false).html(originalBtnText);

                // Scroll to message
                $('html, body').animate({
                    scrollTop: $message.offset().top - 100
                }, 500);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            $message.addClass('alert alert-danger').text('An unexpected error occurred. Please try again.').show();
            $btn.prop('disabled', false).html(originalBtnText);
        }
    });

    // Sync payment method selection when accordion headers are clicked
    $('.accordion-summary .card-header a').on('click', function () {
        const $radio = $(this).find('input[type="radio"]');
        if ($radio.length) {
            $radio.prop('checked', true);
        }
    });

    // Also ensure clicking the radio button itself doesn't cause issues
    $('input[name="paymentMethod"]').on('change', function () {
        const targetId = $(this).attr('id') === 'payment-cash' ? '#collapse-cash' : '#collapse-visa';
        $('.accordion-summary .collapse').collapse('hide');
        $(targetId).collapse('show');
    });
});
