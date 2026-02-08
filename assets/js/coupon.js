
const CouponManager = {
    appliedCoupon: null,

    saveCouponToStorage(coupon) {
        if (coupon) {
            localStorage.setItem('applied_coupon', JSON.stringify(coupon));
        } else {
            localStorage.removeItem('applied_coupon');
        }
    },

    // Load coupon from localStorage
    loadCouponFromStorage() {
        try {
            const stored = localStorage.getItem('applied_coupon');
            if (stored) {
                this.appliedCoupon = JSON.parse(stored);
                return this.appliedCoupon;
            }
        } catch (error) {
            console.error('Error loading coupon from storage:', error);
        }
        return null;
    },

    async applyCoupon(couponCode, subtotal = null) {
        try {
            if (!couponCode || couponCode.trim() === '') {
                return { success: false, message: 'Please enter a coupon code' };
            }

            const subtotalNum = subtotal != null ? Number(subtotal) : (() => {
                const el = document.getElementById('cart-subtotal');
                if (!el || !el.textContent) return 0;
                return parseFloat(String(el.textContent).replace(/[ILS$,\s]/g, '')) || 0;
            })();

            const response = await fetch(API_CONFIG.getApiUrl('DiscountCodes/Validate'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: couponCode.trim(),
                    subtotal: subtotalNum
                })
            });

            const text = await response.text();
            let data = null;
            if (text && text.trim()) {
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('Coupon response not valid JSON:', e);
                    return { success: false, message: 'Invalid response from server' };
                }
            }

            if (!data) {
                return { success: false, message: response.ok ? 'Invalid coupon' : 'Server error. Please try again.' };
            }

            if (!data.isValid) {
                this.removeCoupon(); // Clear storage if invalid
                return { success: false, message: data.message || 'Invalid coupon code' };
            }

            this.appliedCoupon = {
                code: couponCode.trim(),
                discountPercentage: data.discountPercentage != null ? Number(data.discountPercentage) : 0,
                discountAmount: data.discountAmount != null ? Number(data.discountAmount) : 0,
                message: data.message || ''
            };

            // Save to localStorage
            this.saveCouponToStorage(this.appliedCoupon);

            return {
                success: true,
                message: data.message || 'Coupon applied successfully',
                coupon: this.appliedCoupon
            };
        } catch (error) {
            console.error('Error applying coupon:', error);
            this.removeCoupon(); // Clear storage on error
            return { success: false, message: error.message || 'Failed to apply coupon code' };
        }
    },

    removeCoupon() {
        this.appliedCoupon = null;
        this.saveCouponToStorage(null);
    },

    getDiscountAmount(subtotal) {
        if (!this.appliedCoupon) return 0;
        if (this.appliedCoupon.discountAmount != null && this.appliedCoupon.discountAmount > 0) {
            return this.appliedCoupon.discountAmount;
        }
        if (this.appliedCoupon.discountPercentage != null && this.appliedCoupon.discountPercentage > 0) {
            const s = parseFloat(subtotal) || 0;
            return (s * this.appliedCoupon.discountPercentage) / 100;
        }
        return 0;
    }
};

window.CouponManager = CouponManager;
