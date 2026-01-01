// Checkout Management System
const CheckoutManager = {
    // Check if user is authenticated
    isAuthenticated: function() {
        return localStorage.getItem('isAuthenticated') === 'true';
    },

    // Get authentication token
    getToken: function() {
        return localStorage.getItem('authToken');
    },

    // Load cart items for checkout
    async loadCartForCheckout() {
        if (this.isAuthenticated()) {
            // Get cart from API
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
                    return { success: true, items: data.data.items || [], totalAmount: data.data.totalAmount || 0 };
                }
            } catch (error) {
                console.error('Error loading cart:', error);
            }
        } else {
            // Get cart from cookies
            const cart = CartManager.loadCartFromCookie();
            
            if (cart.length > 0) {
                try {
                    const productsResponse = await fetch(API_CONFIG.getApiUrl('Products/GetAllProducts'));
                    const productsData = await productsResponse.json();
                    
                    if (productsResponse.ok && productsData.success) {
                        const products = productsData.data || [];
                        const cartItems = cart.map(cartItem => {
                            const product = products.find(p => p.id === cartItem.productId);
                            if (product) {
                                return {
                                    productId: product.id,
                                    productName: product.name,
                                    quantity: cartItem.quantity,
                                    price: product.price,
                                    totalPrice: product.price * cartItem.quantity
                                };
                            }
                            return null;
                        }).filter(item => item !== null);
                        
                        const totalAmount = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
                        return { success: true, items: cartItems, totalAmount: totalAmount };
                    }
                } catch (error) {
                    console.error('Error fetching products:', error);
                }
            }
        }
        
        return { success: true, items: [], totalAmount: 0 };
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

            const data = await response.json();
            return data;
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

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error processing guest checkout:', error);
            return { success: false, message: error.message || 'An error occurred during checkout' };
        }
    },

    // Main checkout function
    async processCheckout(formData) {
        const cartData = await this.loadCartForCheckout();
        
        if (!cartData.success || cartData.items.length === 0) {
            return { success: false, message: 'Your cart is empty' };
        }

        // Determine payment method
        const paymentMethod = formData.paymentMethod === 'cash' ? 'Cash' : 'Visa';
        
        if (this.isAuthenticated()) {
            // Authenticated checkout
            const checkoutRequest = {
                paymentMethod: paymentMethod,
                address: formData.address,
                phone: formData.phone,
                deliveryCost: formData.deliveryCost || 0,
                discountCode: formData.discountCode || null
            };

            const result = await this.processAuthenticatedCheckout(checkoutRequest);
            
            if (result.success) {
                // Handle payment redirect for Visa
                if (paymentMethod === 'Visa' && result.url) {
                    window.location.href = result.url;
                    return result;
                } else {
                    // Cash payment - show success message
                    return result;
                }
            }
            
            return result;
        } else {
            // Guest checkout
            const checkoutRequest = {
                paymentMethod: paymentMethod,
                items: cartData.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price
                })),
                customerName: formData.firstName + ' ' + formData.lastName,
                customerEmail: formData.email,
                address: formData.address,
                phoneNumber: formData.phone,
                deliveryCost: formData.deliveryCost || 0,
                discountCode: formData.discountCode || null
            };

            const result = await this.processGuestCheckout(checkoutRequest);
            
            if (result.success) {
                // Handle payment redirect for Visa
                if (paymentMethod === 'Visa' && result.url) {
                    window.location.href = result.url;
                    return result;
                } else {
                    // Cash payment - clear cart and show success
                    CartManager.saveCartToCookie([]);
                    return result;
                }
            }
            
            return result;
        }
    }
};

// Make CheckoutManager globally available
window.CheckoutManager = CheckoutManager;

