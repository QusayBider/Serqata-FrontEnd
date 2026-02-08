// Cart Management System
const CartManager = {
    cookieName: 'userCart',
    cookieExpireDays: 30,
    productsCache: null,

    // Check if user is authenticated
    isAuthenticated: function () {
        return localStorage.getItem('isAuthenticated') === 'true';
    },

    // Get authentication token
    getToken: function () {
        return localStorage.getItem('authToken');
    },

    // Cookie management
    setCookie: function (name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        const cookieValue = JSON.stringify(value);
        const domain = API_CONFIG ? API_CONFIG.getDomain() : window.location.hostname;
        const domainAttr = (domain === 'localhost' || domain === '127.0.0.1')
            ? ''
            : ";domain=." + domain;
        document.cookie = name + "=" + cookieValue + ";" + expires + ";path=/" + domainAttr;
    },

    getCookie: function (name) {
        const nameEQ = name + "=";
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.indexOf(nameEQ) === 0) {
                const value = cookie.substring(nameEQ.length);
                try {
                    return JSON.parse(value);
                } catch (e) {
                    console.error('Error parsing cookie:', e);
                    return null;
                }
            }
        }
        return null;
    },

    // Load cart from cookie (returns array of {productId, quantity})
    loadCartFromCookie: function () {
        const cart = this.getCookie(this.cookieName);
        if (!cart || !Array.isArray(cart)) {
            return [];
        }
        return cart;
    },

    // Save cart to cookie
    saveCartToCookie: function (cart) {
        this.setCookie(this.cookieName, cart, this.cookieExpireDays);
    },

    async addToCartAPI(productId, quantity = 1, colorId = null, sizeId = null) {
        try {
            const token = this.getToken();
            if (!token) {
                throw new Error('User not authenticated');
            }

            const requestBody = {
                productId: productId,
                quantity: quantity
            };

            // Add color and size if provided
            if (colorId) {
                requestBody.colorId = colorId;
            }
            if (sizeId) {
                requestBody.sizeId = sizeId;
            }

            const response = await fetch(API_CONFIG.getApiUrl('Customer/Carts/AddProductsToCart'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Trigger custom event for immediate UI update
                if (typeof window !== 'undefined' && window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('cartUpdated', {
                        detail: { productId, quantity, action: 'added' }
                    }));
                }

                return { success: true, message: data.message || 'Product added to cart' };
            } else {
                return { success: false, message: data.message || 'Failed to add product to cart' };
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            return { success: false, message: error.message || 'An error occurred' };
        }
    },

    // Add product to cart (guest user - save to cookies)
    addToCartCookie(productId, quantity = 1, colorId = null, sizeId = null) {
        try {
            let cart = this.loadCartFromCookie();

            // Ensure cart is an array
            if (!Array.isArray(cart)) {
                cart = [];
            }

            // Check if same product with same color and size already exists
            const existingItem = cart.find(item =>
                item.productId === productId &&
                (item.colorId || null) === (colorId || null) &&
                (item.sizeId || null) === (sizeId || null)
            );

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({
                    productId: productId,
                    quantity: quantity,
                    colorId: colorId || null,
                    sizeId: sizeId || null
                });
            }

            this.saveCartToCookie(cart);

            // Trigger custom event for immediate UI update
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('cartUpdated', {
                    detail: { productId, quantity, action: 'added' }
                }));
            }

            return { success: true, message: 'Product added to cart' };
        } catch (error) {
            console.error('Error adding to cart cookie:', error);
            return { success: false, message: 'Failed to add product to cart: ' + error.message };
        }
    },

    // Main add to cart function
    async addToCart(productId, quantity = 1, colorId = null, sizeId = null) {
        const isAuth = this.isAuthenticated();
        if (isAuth) {
            // User is logged in - save to API/database
            try {
                return await this.addToCartAPI(productId, quantity, colorId, sizeId);
            } catch (error) {
                console.error('Error adding to cart via API:', error);
                return { success: false, message: 'Failed to add to cart. Please try again.' };
            }
        } else {
            // Guest user - save to cookies
            return this.addToCartCookie(productId, quantity, colorId, sizeId);
        }
    },

    // Add to cart with variants (color and size)
    async addToCartWithVariants(cartItem) {
        const { productId, quantity = 1, colorId = null, sizeId = null } = cartItem;
        return await this.addToCart(productId, quantity, colorId, sizeId);
    },

    // Get cart items (from API if logged in, from cookies if guest)
    async getCartItems() {
        if (this.isAuthenticated()) {
            try {
                const token = this.getToken();
                const response = await fetch(API_CONFIG.getApiUrl('Customer/Carts/GetCart'), {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const items = (data.data.items || []).map(item => {
                        const discount = item.discount || item.product?.discount || (item.price && typeof item.price === 'object' ? item.price.discount : 0) || 0;
                        let originalPrice = 0;
                        if (typeof item.price === 'number') {
                            originalPrice = item.price;
                        } else if (item.price && typeof item.price === 'object') {
                            originalPrice = item.price.price || (item.price.product ? item.price.product.price : 0);
                        } else {
                            originalPrice = item.product?.price || 0;
                        }

                        const priceAfterDiscount = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
                        const totalPrice = priceAfterDiscount * (item.quantity || 1);
                        const originalTotalPrice = originalPrice * (item.quantity || 1);

                        return {
                            ...item,
                            price: originalPrice,
                            discount: discount,
                            priceAfterDiscount: priceAfterDiscount,
                            totalPrice: totalPrice,
                            originalTotalPrice: originalTotalPrice,
                            mainImageUrl: item.mainImageUrl || item.productImageUrl || item.product?.mainImageUrl || (item.mainImage ? `${API_CONFIG.BASE_URL}/Images/${item.mainImage}` : 'assets/images/products/error/error.png'),
                            productImageUrl: item.productImageUrl || item.mainImageUrl || item.product?.mainImageUrl || (item.mainImage ? `${API_CONFIG.BASE_URL}/Images/${item.mainImage}` : 'assets/images/products/error/error.png')
                        };
                    });
                    // Calculate totals
                    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
                    const originalTotalAmount = items.reduce((sum, item) => sum + item.originalTotalPrice, 0);

                    // Centralized Best Discount Logic
                    const productDiscountBenefit = Math.max(0, originalTotalAmount - totalAmount);
                    let couponBenefit = 0;
                    let appliedCoupon = null;

                    if (typeof CouponManager !== 'undefined') {
                        appliedCoupon = CouponManager.loadCouponFromStorage();
                        if (appliedCoupon) {
                            couponBenefit = CouponManager.getDiscountAmount(originalTotalAmount);
                        }
                    }

                    const useCoupon = couponBenefit > productDiscountBenefit;
                    const discountSource = useCoupon ? 'coupon' : 'product';
                    const bestTotalAmount = useCoupon ? (originalTotalAmount - couponBenefit) : totalAmount;

                    return {
                        success: true,
                        items: items,
                        totalAmount: totalAmount,
                        originalTotalAmount: originalTotalAmount,
                        bestTotalAmount: bestTotalAmount,
                        discountSource: discountSource,
                        couponBenefit: couponBenefit,
                        appliedCoupon: appliedCoupon
                    };
                } else {
                    return { success: false, items: [], totalAmount: 0 };
                }
            } catch (error) {
                console.error('Error fetching cart:', error);
                return { success: false, items: [], totalAmount: 0 };
            }
        } else {
            // Load from cookies
            const cart = this.loadCartFromCookie();

            // Fetch product details for cart items
            if (cart.length > 0) {
                try {
                    // Fetch products (required)
                    const productsResponse = await fetch(API_CONFIG.getApiUrl('Products/GetAllProducts'));

                    if (!productsResponse.ok) {
                        throw new Error(`Failed to fetch products: ${productsResponse.status}`);
                    }

                    const productsData = await productsResponse.json();

                    let colors = [];
                    let sizes = [];

                    try {
                        const colorsResponse = await fetch(API_CONFIG.getApiUrl('Colors/GetAllColors')).catch(() => null);

                        if (colorsResponse && colorsResponse.ok && colorsResponse.status !== 404) {
                            const colorsData = await colorsResponse.json();
                            if (colorsData.success && colorsData.data) {
                                colors = Array.isArray(colorsData.data) ? colorsData.data : [colorsData.data];
                            } else if (Array.isArray(colorsData)) {
                                colors = colorsData;
                            }
                        }
                    } catch (colorError) {

                    }

                    // Only fetch sizes if API endpoint exists (silently fail if 404)
                    try {
                        const sizesResponse = await fetch(API_CONFIG.getApiUrl('Sizes/GetAllSizes')).catch(() => null);

                        if (sizesResponse && sizesResponse.ok && sizesResponse.status !== 404) {
                            const sizesData = await sizesResponse.json();
                            if (sizesData.success && sizesData.data) {
                                sizes = Array.isArray(sizesData.data) ? sizesData.data : [sizesData.data];
                            } else if (Array.isArray(sizesData)) {
                                sizes = sizesData;
                            }
                        }
                    } catch (sizeError) {

                    }

                    if (productsData.success) {
                        const products = productsData.data || [];
                        const cartItems = cart.map(cartItem => {
                            const product = products.find(p => p.id === cartItem.productId);
                            if (product) {
                                let colorName = null;
                                let sizeName = null;

                                if (cartItem.colorId) {
                                    if (product.colors && Array.isArray(product.colors)) {
                                        const color = product.colors.find(c => (c.id || c.colorId) === cartItem.colorId);
                                        if (color) colorName = color.name || color.colorName;
                                    }
                                    if (colorName == null && colors.length > 0) {
                                        const color = colors.find(c => (c.id || c.colorId) === cartItem.colorId);
                                        if (color) colorName = color.name || color.colorName;
                                    }
                                }

                                if (cartItem.sizeId) {
                                    if (product.sizes && Array.isArray(product.sizes)) {
                                        const size = product.sizes.find(s => (s.id || s.sizeId) === cartItem.sizeId);
                                        if (size) sizeName = size.name || size.sizeName || size.value;
                                    }
                                    if (sizeName == null && sizes.length > 0) {
                                        const size = sizes.find(s => (s.id || s.sizeId) === cartItem.sizeId);
                                        if (size) sizeName = size.name || size.sizeName || size.value;
                                    }
                                }

                                // Calculate price with discount
                                const discount = product.discount || 0;
                                const originalPrice = product.price || 0;
                                const priceAfterDiscount = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
                                const totalPrice = priceAfterDiscount * cartItem.quantity;
                                const originalTotalPrice = originalPrice * cartItem.quantity;

                                return {
                                    productId: product.id,
                                    productName: product.name,
                                    quantity: cartItem.quantity,
                                    price: originalPrice,
                                    discount: discount,
                                    priceAfterDiscount: priceAfterDiscount,
                                    colorId: cartItem.colorId || null,
                                    sizeId: cartItem.sizeId || null,
                                    colorName: colorName,
                                    sizeName: sizeName,
                                    mainImageUrl: product.mainImageUrl || (product.mainImage ? `${API_CONFIG.BASE_URL}/Images/${product.mainImage}` : 'assets/images/products/error/error.png'),
                                    productImageUrl: product.mainImageUrl || (product.mainImage ? `${API_CONFIG.BASE_URL}/Images/${product.mainImage}` : 'assets/images/products/error/error.png'),
                                    totalPrice: totalPrice,
                                    originalTotalPrice: originalTotalPrice
                                };
                            }
                            return null;
                        }).filter(item => item !== null);

                        const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
                        const originalTotalAmount = cartItems.reduce((sum, item) => sum + item.originalTotalPrice, 0);

                        // Centralized Best Discount Logic
                        const productDiscountBenefit = Math.max(0, originalTotalAmount - totalAmount);
                        let couponBenefit = 0;
                        let appliedCoupon = null;

                        if (typeof CouponManager !== 'undefined') {
                            appliedCoupon = CouponManager.loadCouponFromStorage();
                            if (appliedCoupon) {
                                couponBenefit = CouponManager.getDiscountAmount(originalTotalAmount);
                            }
                        }

                        const useCoupon = couponBenefit > productDiscountBenefit;
                        const discountSource = useCoupon ? 'coupon' : 'product';
                        const bestTotalAmount = useCoupon ? (originalTotalAmount - couponBenefit) : totalAmount;

                        return {
                            success: true,
                            items: cartItems,
                            totalAmount: totalAmount,
                            originalTotalAmount: originalTotalAmount,
                            bestTotalAmount: bestTotalAmount,
                            discountSource: discountSource,
                            couponBenefit: couponBenefit,
                            appliedCoupon: appliedCoupon
                        };
                    }
                } catch (error) {
                    console.error('Error fetching products for cart:', error);
                    return { success: true, items: [], totalAmount: 0 };
                }
            }

            return { success: true, items: [], totalAmount: 0 };
        }
    },

    async removeFromCart(productId, colorId = null, sizeId = null) {
        if (this.isAuthenticated()) {
            try {
                const token = this.getToken();
                // Build URL with optional color and size parameters
                let url = API_CONFIG.getApiUrl(`Customer/Carts/DeleteProductFromCart/${productId}`);
                const params = new URLSearchParams();
                if (colorId) params.append('colorId', colorId);
                if (sizeId) params.append('sizeId', sizeId);
                if (params.toString()) {
                    url += '?' + params.toString();
                }

                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                return { success: response.ok && data.success, message: data.message || '' };
            } catch (error) {
                console.error('Error removing from cart:', error);
                return { success: false, message: error.message };
            }
        } else {
            // Remove from cookies - match by productId, colorId, and sizeId
            let cart = this.loadCartFromCookie();
            cart = cart.filter(item =>
                !(item.productId === productId &&
                    (item.colorId || null) === (colorId || null) &&
                    (item.sizeId || null) === (sizeId || null))
            );
            this.saveCartToCookie(cart);
            return { success: true, message: 'Product removed from cart' };
        }
    },

    // Update quantity
    async updateQuantity(productId, quantity, colorId = null, sizeId = null) {
        if (this.isAuthenticated()) {

            try {
                const token = this.getToken();
                // First get current cart to find current quantity
                const cartResponse = await fetch(API_CONFIG.getApiUrl('Customer/Carts/GetCart'), {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const cartData = await cartResponse.json();
                if (cartData.success && cartData.data.items) {
                    // Find item matching productId, colorId, and sizeId
                    const item = cartData.data.items.find(i =>
                        i.productId === productId &&
                        (i.colorId || null) === (colorId || null) &&
                        (i.sizeId || null) === (sizeId || null)
                    );
                    if (item) {
                        const currentQty = item.quantity;
                        const diff = quantity - currentQty;

                        if (diff > 0) {
                            // Increase - add color and size params if needed
                            let url = API_CONFIG.getApiUrl(`Customer/Carts/IncreaseCartItemQuantity/${productId}?quantity=${diff}`);
                            const params = new URLSearchParams();
                            if (colorId) params.append('colorId', colorId);
                            if (sizeId) params.append('sizeId', sizeId);
                            if (params.toString()) {
                                url += '&' + params.toString();
                            }

                            const response = await fetch(url, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            const data = await response.json();
                            return { success: response.ok && data.success, message: data.message || '' };
                        } else if (diff < 0) {
                            // Decrease
                            let url = API_CONFIG.getApiUrl(`Customer/Carts/DecreaseCartItemQuantity/${productId}?quantity=${Math.abs(diff)}`);
                            const params = new URLSearchParams();
                            if (colorId) params.append('colorId', colorId);
                            if (sizeId) params.append('sizeId', sizeId);
                            if (params.toString()) {
                                url += '&' + params.toString();
                            }

                            const response = await fetch(url, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            const data = await response.json();
                            return { success: response.ok && data.success, message: data.message || '' };
                        }
                    }
                }
                return { success: true, message: 'Quantity updated' };
            } catch (error) {
                console.error('Error updating quantity:', error);
                return { success: false, message: error.message };
            }
        } else {
            // Update in cookies - match by productId, colorId, and sizeId
            let cart = this.loadCartFromCookie();
            const item = cart.find(i =>
                i.productId === productId &&
                (i.colorId || null) === (colorId || null) &&
                (i.sizeId || null) === (sizeId || null)
            );
            if (item) {
                item.quantity = quantity;
                this.saveCartToCookie(cart);
                return { success: true, message: 'Quantity updated' };
            }
            return { success: false, message: 'Product not found in cart' };
        }
    },

    // Get cart count
    async getCartCount() {
        const cartData = await this.getCartItems();
        if (cartData.success) {
            return cartData.items.reduce((sum, item) => sum + item.quantity, 0);
        }
        return 0;
    },

    // Update navbar cart dropdown
    async updateNavbarCart() {
        const cartData = await this.getCartItems();
        const cartDropdown = document.querySelector('.dropdown-cart-products');
        const cartCount = document.querySelector('.cart-count');
        const cartTotal = document.querySelector('.cart-total-price');

        // Update cart count - always use the actual cart data (single source of truth)
        if (cartCount) {
            const actualCount = cartData.success ? cartData.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
            cartCount.textContent = actualCount;
            // Show/hide cart count badge
            if (actualCount === 0) {
                cartCount.style.display = 'none';
            } else {
                cartCount.style.display = '';
            }
        }

        // Update cart dropdown content
        if (cartDropdown) {
            if (!cartData.success || cartData.items.length === 0) {
                cartDropdown.innerHTML = '<div class="text-center p-3">Your cart is empty</div>';
                if (cartTotal) {
                    cartTotal.textContent = 'ILS 0.00';
                }
                return;
            }

            // Render cart items in dropdown
            cartDropdown.innerHTML = cartData.items.slice(0, 3).map(item => {
                const variantInfo = [];
                if (item.colorName) variantInfo.push(`Color: ${item.colorName}`);
                if (item.sizeName) variantInfo.push(`Size: ${item.sizeName}`);
                const variantText = variantInfo.length > 0 ? `<div class="text-muted small">${variantInfo.join(', ')}</div>` : '';

                return `
                <div class="product" data-product-id="${item.productId}" data-color-id="${item.colorId || ''}" data-size-id="${item.sizeId || ''}">
                    <div class="product-cart-details">
                        <h4 class="product-title">
                            <a href="product.html?id=${item.productId}">${item.productName}</a>
                        </h4>
                        ${variantText}
                        <span class="cart-product-info">
                            <span class="cart-product-qty">${item.quantity}</span>
                            x ILS ${item.priceAfterDiscount.toFixed(2)}
                        </span>
                    </div>
                    <figure class="product-image-container">
                        <a href="product.html?id=${item.productId}" class="product-image">
                            <img src="${item.mainImageUrl || item.productImageUrl || 'assets/images/products/error/error.png'}" alt="${item.productName}" onerror="this.onerror=null; this.src='assets/images/products/error/error.png';">
                        </a>
                    </figure>
                    <a href="#" class="btn-remove navbar-remove-item" data-product-id="${item.productId}" data-color-id="${item.colorId || ''}" data-size-id="${item.sizeId || ''}" title="Remove Product">
                        <i class="icon-close"></i>
                    </a>
                </div>
            `;
            }).join('');

            // Update total
            if (cartTotal) {
                cartTotal.textContent = `ILS ${Math.round(cartData.bestTotalAmount)}`;
            }

            // Attach remove item listeners
            cartDropdown.querySelectorAll('.navbar-remove-item').forEach(btn => {
                btn.addEventListener('click', async function (e) {
                    e.preventDefault();
                    const productId = parseInt(this.getAttribute('data-product-id'));
                    const colorId = this.getAttribute('data-color-id') ? parseInt(this.getAttribute('data-color-id')) : null;
                    const sizeId = this.getAttribute('data-size-id') ? parseInt(this.getAttribute('data-size-id')) : null;
                    const result = await CartManager.removeFromCart(productId, colorId, sizeId);
                    if (result.success) {
                        await CartManager.updateNavbarCart();
                        if (window.notyf) {
                            window.notyf.success('Item removed from cart');
                        }
                    } else {
                        if (window.notyf) {
                            window.notyf.error(result.message || 'Failed to remove item from cart');
                        }
                    }
                });
            });
        }
    }
};

window.CartManager = CartManager;

$(document).ready(async function () {
    await CartManager.updateNavbarCart();

    window.addEventListener('cartUpdated', async function (event) {

        if (CartManager.updateNavbarCart) {
            setTimeout(async () => {
                await CartManager.updateNavbarCart().catch(err => console.error('Error updating cart:', err));
            }, 300);
        }
    });

    if (document.querySelector('.cart-dropdown')) {
        setInterval(async () => {
            await CartManager.updateNavbarCart();
        }, 5000);
    }
    // Handle add to cart buttons (only for non-product-details pages)
    $(document).on('click', '.btn-cart, .add-to-cart-btn', async function (e) {
        // Skip if this is on product details page (it has its own handler)
        const $clickedElement = $(e.target);
        const $button = $clickedElement.hasClass('btn-cart') || $clickedElement.hasClass('add-to-cart-btn')
            ? $clickedElement
            : $clickedElement.closest('.btn-cart, .add-to-cart-btn');

        if ($button.length === 0) {
            return;
        }

        if ($button.closest('.product-details-action').length > 0 ||
            $button.closest('.product-details').length > 0 ||
            window.location.pathname.includes('product.html')) {
            // Let product-details.js handle it
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        let productId = $button.data('product-id');

        if (!productId) {
            productId = $button.attr('data-product-id');
        }

        if (!productId) {
            productId = $button.closest('[data-product-id]').attr('data-product-id') ||
                $button.closest('[data-product-id]').data('product-id');
        }

        if (!productId) {
            const href = $button.attr('href');
            if (href && href.includes('product.html?id=')) {
                const match = href.match(/id=(\d+)/);
                if (match) {
                    productId = match[1];
                }
            }
        }

        if (!productId) {
            console.error('Product ID not found. Button:', $button[0]);
            console.error('Button classes:', $button.attr('class'));
            console.error('Button data attributes:', $button[0] ? $button[0].attributes : 'no element');
            if (window.notyf) {
                window.notyf.error('Product ID not found. Please try again.');
            }
            return;
        }

        productId = parseInt(productId);
        if (isNaN(productId) || productId <= 0) {
            console.error('Invalid product ID:', productId);
            if (window.notyf) {
                window.notyf.error('Invalid product ID. Please try again.');
            }
            return;
        }

        // Get quantity if available
        const quantityInput = $button.closest('.product-details-action, .product, .product-4').find('input[type="number"]');
        const quantity = quantityInput.length > 0 ? parseInt(quantityInput.val()) || 1 : 1;

        // Disable button temporarily
        const originalText = $button.html();
        $button.prop('disabled', true).html('<span>Adding...</span>');

        try {
            // Check if CartManager is available
            if (typeof CartManager === 'undefined') {
                throw new Error('CartManager is not available');
            }

            const result = await CartManager.addToCart(productId, quantity);

            if (result && result.success) {
                // Show success notification immediately
                if (window.notyf) {
                    window.notyf.success(result.message || 'Product added to cart successfully');
                }

                const cartCountElement = document.querySelector('.cart-count');
                if (cartCountElement) {
                    const currentCount = parseInt(cartCountElement.textContent) || 0;
                    const optimisticCount = currentCount + quantity;
                    cartCountElement.textContent = optimisticCount;
                    cartCountElement.style.display = optimisticCount > 0 ? '' : 'none';
                }

                if (CartManager.updateNavbarCart) {
                    setTimeout(async () => {
                        await CartManager.updateNavbarCart();
                    }, 300);
                }
            } else {
                // Show error message
                const errorMsg = result ? (result.message || 'Failed to add product to cart') : 'Failed to add product to cart';
                if (window.notyf) {
                    window.notyf.error(errorMsg);
                }
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            if (window.notyf) {
                window.notyf.error('An error occurred. Please try again.');
            }
        } finally {
            // Re-enable button
            $button.prop('disabled', false).html(originalText);
        }
    });
});

