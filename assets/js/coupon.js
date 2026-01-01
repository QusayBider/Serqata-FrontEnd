// Coupon/Discount Code Management System
const CouponManager = {
    appliedCoupon: null,

    // Apply coupon code
    async applyCoupon(couponCode) {
        try {
            if (!couponCode || couponCode.trim() === '') {
                return { success: false, message: 'Please enter a coupon code' };
            }

            const response = await fetch(API_CONFIG.getApiUrl(`Discounts/ApplyDiscount/${encodeURIComponent(couponCode)}`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                return { success: false, message: errorData.message || 'Invalid coupon code' };
            }

            const data = await response.json();
            
            if (data.success) {
                this.appliedCoupon = {
                    code: couponCode,
                    discount: data.data.discount || data.data.discountPercentage || 0,
                    discountAmount: data.data.discountAmount || 0,
                    data: data.data
                };
                return { 
                    success: true, 
                    message: data.message || 'Coupon applied successfully',
                    coupon: this.appliedCoupon
                };
            } else {
                return { success: false, message: data.message || 'Invalid coupon code' };
            }
        } catch (error) {
            console.error('Error applying coupon:', error);
            return { success: false, message: error.message || 'Failed to apply coupon code' };
        }
    },

    // Remove applied coupon
    removeCoupon() {
        this.appliedCoupon = null;
    },

    // Get discount amount
    getDiscountAmount(subtotal) {
        if (!this.appliedCoupon) {
            return 0;
        }

        if (this.appliedCoupon.discountAmount) {
            return this.appliedCoupon.discountAmount;
        }

        if (this.appliedCoupon.discount) {
            return (subtotal * this.appliedCoupon.discount) / 100;
        }

        return 0;
    }
};

// Make CouponManager globally available
window.CouponManager = CouponManager;

