// Order Success logic
$(document).ready(async function () {
    const $statusMsg = $('#success-status-msg');
    const $displayOrderId = $('#display-order-id');
    const $displayTracking = $('#display-tracking-number');
    const $orderInfoContainer = $('#order-info-container');
    const $trackingContainer = $('#tracking-container');

    // 1. Get orderId and tracking from URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get('orderId');
    const urlTrackingParam = urlParams.get('trackingNumber');

    if (!orderIdParam) {
        $statusMsg.text('Thank you for your order.');
        return;
    }

    // Helper to display IDs
    const displayIds = (orderId, trackingNum) => {
        // Display Order ID
        if ($displayOrderId.is('input,textarea,select')) {
            $displayOrderId.val(orderId);
        } else {
            $displayOrderId.text(orderId);
        }
        $orderInfoContainer.show();

        // Display Tracking Number
        if (trackingNum) {
            if ($displayTracking.is('input,textarea,select')) {
                $displayTracking.val(trackingNum);
            } else {
                $displayTracking.text(trackingNum);
            }
            $trackingContainer.show();
        }
    };

    // 2. Check if order is already confirmed to prevent duplicate API calls/emails
    const confirmationKey = `order_confirmed_${orderIdParam}`;
    // We check if this specific order ID has been processed in this browser session
    const isConfirmed = localStorage.getItem(confirmationKey) === 'true';

    if (isConfirmed) {
        console.log('Order already confirmed. Skipping API call to prevent duplicate emails.');
        $statusMsg.text('Your order has been confirmed.');

        // Recover tracking from local cache if available, or use URL param
        const cachedTracking = localStorage.getItem(`tracking_${orderIdParam}`);
        const trackingToDisplay = urlTrackingParam || cachedTracking;

        displayIds(orderIdParam, trackingToDisplay);

    } else {
        try {
            // 3. Fetch order details from API Only if NOT confirmed
            console.log('Fetching order confirmation from API...');
            const response = await fetch(API_CONFIG.getApiUrl(`Customer/CheckOuts/Success/${orderIdParam}`), {
                method: 'GET'
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Order details fetched successfully:', result);

                // CRITICAL: Mark as confirmed immediately to prevent future calls
                localStorage.setItem(confirmationKey, 'true');

                // Success Message
                $statusMsg.text(result.message || 'Your order has been confirmed.');

                // Extract IDs from API response
                const apiOrderId = result.orderId || (result.data && result.data.orderId) || orderIdParam;
                const apiTracking = result.trackingCode || result.trackingNumber ||
                    (result.data && (result.data.trackingCode || result.data.trackingNumber)) ||
                    urlTrackingParam;

                // Display
                displayIds(apiOrderId, apiTracking);

                // Save tracking for refresh
                if (apiTracking) {
                    localStorage.setItem(`tracking_${orderIdParam}`, apiTracking);
                }

            } else {
                console.warn('Backend returned non-ok status');
                $statusMsg.text('Order received. We are processing your request.');
                // Fallback display
                displayIds(orderIdParam, urlTrackingParam);
            }

        } catch (error) {
            console.error('Error fetching order details:', error);
            $statusMsg.text('Order received. Thank you!');
            // Fallback display
            displayIds(orderIdParam, urlTrackingParam);
        }
    }

    // 4. Cleanup logic (Cart & Cookies) - Always run cleanup to be safe
    try {
        if (typeof CartManager !== 'undefined') {
            CartManager.saveCartToCookie([]);
            await CartManager.updateNavbarCart();
        }
        localStorage.removeItem('applied_coupon');
        localStorage.removeItem('shipping_country');
        localStorage.removeItem('shipping_city');
    } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
    }
});
