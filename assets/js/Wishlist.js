
const WishlistManager = {
    cookieName: 'userWishlist',
    cookieExpireDays: 30,
    productsCache: null, // Cache for all products
   
    getApiUrl: function() {
        return API_CONFIG ? API_CONFIG.getApiUrl('Products/GetAllProducts') : '';
    },

    setCookie: function(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        // Store as simple JSON array of numbers
        const cookieValue = JSON.stringify(value);
        // Get domain from global config if available
        const domain = API_CONFIG ? API_CONFIG.getDomain() : window.location.hostname;
        const domainAttr = (domain === 'localhost' || domain === '127.0.0.1') 
            ? '' 
            : ";domain=." + domain;
        document.cookie = name + "=" + cookieValue + ";" + expires + ";path=/" + domainAttr;
    },

    // Get cookie - Returns parsed JSON array
    getCookie: function(name) {
        const nameEQ = name + "=";
        const cookies = document.cookie.split(';');
        for(let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if(cookie.indexOf(nameEQ) === 0) {
                const value = cookie.substring(nameEQ.length);
                try {
                    const parsed = JSON.parse(value);
                    return parsed;
                } catch(e) {
                    console.error('Error parsing cookie:', e);
                    return null;
                }
            }
        }
        return null;
    },

    // Load wishlist from cookie (returns array of product IDs only)
    loadWishlist: function() {
        const wishlist = this.getCookie(this.cookieName) || [];
        return wishlist;
    },

    saveWishlist: function(productIds) {
        // Ensure all IDs are numbers
        const numericIds = productIds.map(id => parseInt(id, 10));
        this.setCookie(this.cookieName, numericIds, this.cookieExpireDays);
    },

    fetchAllProducts: async function() {
        // Return cached products if available
        if(this.productsCache) {
            return this.productsCache;
        }

        try {
             const response = await fetch(this.getApiUrl());
            if(!response.ok) {
               
                throw new Error(`API error: ${response.status}`);
            }
            const products = await response.json();
            // Cache the products
            this.productsCache = Array.isArray(products) ? products : [products];
            return this.productsCache;
        } catch(error) {
            console.error('Error fetching products:', error);
            const html = document.getElementById('wishlistTable');
            html.innerHTML = `<div class="loader">Loading...</div>`;
            return [];
        }
    },

    fetchProductDetails: async function(productId) {
        const products = await this.fetchAllProducts();
        // Ensure we're comparing as numbers
        const id = parseInt(productId, 10);
        const product = products.find(p => parseInt(p.id, 10) === id);
        
        if(!product) {
            return null;
        }

        return {
            id: product.id,
            name: product.name,
            price: '$' + product.price.toFixed(2),
            image: product.mainImageUrl,
            stockStatus: product.quantity > 0 ? 'In stock' : 'Out of stock',
            description: product.description,
            discount: product.discount,
            quantity: product.quantity,
            status: product.status
        };
    },

    // Add item to wishlist (stores only product ID)
    addItem: function(productId) {
        const wishlist = this.loadWishlist();
        
        // Ensure productId is a number
        const id = parseInt(productId, 10);
        
        // Check if product already exists
        const exists = wishlist.includes(id);
        if(!exists) {
            wishlist.push(id);
            this.saveWishlist(wishlist);
            return true;
        }
        return false;
    },

    // Remove item from wishlist
    removeItem: function(productId) {
        const id = parseInt(productId, 10);
        let wishlist = this.loadWishlist();
        wishlist = wishlist.filter(pid => parseInt(pid, 10) !== id);
        this.saveWishlist(wishlist);
    },

    // Clear entire wishlist (properly delete the cookie)
    clearWishlist: function() {
        // Get domain from global config if available
        const domain = API_CONFIG ? API_CONFIG.getDomain() : window.location.hostname;
        // Delete cookie with multiple approaches to ensure it's deleted
        document.cookie = this.cookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
        document.cookie = this.cookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=" + domain + ";";
        document.cookie = this.cookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=." + domain + ";";
        // Also clear cache
        this.productsCache = null;
        console.log('Cookie cleared. Verifying...');
        console.log('Cookie value after clear:', this.getCookie(this.cookieName));
    },

    // Get wishlist count
    getCount: function() {
        return this.loadWishlist().length;
    }
};

// Render wishlist items on page (fetches product data from API)
async function renderWishlist() {
    const wishlist = WishlistManager.loadWishlist();
    const wishlistBody = document.getElementById('wishlistBody');
    const emptyMessage = document.getElementById('emptyWishlist');
    
    if(!wishlistBody) {
        updateWishlistCount();
        return;
    }
    
    if(wishlist.length === 0) {
        wishlistBody.innerHTML = '';
        if(emptyMessage) {
            emptyMessage.style.display = 'block';
        }
        updateWishlistCount();
        return;
    }

    if(emptyMessage) {
        emptyMessage.style.display = 'none';
    }
    
    let html = '';
    
    // Fetch details for all products in wishlist
    for(const productId of wishlist) {
        const product = await WishlistManager.fetchProductDetails(productId);
        if(product) {
            const inStock = product.stockStatus === 'In stock';
            html += `
                <tr data-product-id="${product.id}">
                    <td class="product-col">
                        <div class="product">
                            <figure class="product-media">
                                <a href="#">
                                    <img src="${product.image}" alt="Product image">
                                </a>
                            </figure>
                            <h3 class="product-title">
                                <a href="#">${product.name}</a>
                            </h3>
                        </div>
                    </td>
                    <td class="price-col">${product.price}</td>
                    <td class="stock-col"><span class="${inStock ? 'in-stock' : 'out-of-stock'}">${product.stockStatus}</span></td>
                    <td class="action-col">
                        ${inStock ? 
                            `<button class="btn btn-block btn-outline-primary-2 add-to-cart-btn" data-product-id="${product.id}">
                                <i class="icon-cart-plus"></i>Add to Cart
                            </button>` : 
                            `<button class="btn btn-block btn-outline-primary-2 disabled">Out of Stock</button>`
                        }
                    </td>
                    <td class="remove-col">
                        <button class="btn-remove remove-from-wishlist" data-product-id="${product.id}" title="Remove from wishlist">
                            <i class="icon-close"></i>
                        </button>
                    </td>
                </tr>
            `;
        }
    }

    wishlistBody.innerHTML = html;
    attachEventListeners();
    updateWishlistCount();
}

// Attach event listeners to wishlist items
function attachEventListeners() {
    // Remove from wishlist buttons
    document.querySelectorAll('.remove-from-wishlist').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            WishlistManager.removeItem(productId);
            renderWishlist();
        });
    });

    // Add to cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            notyf.success('Product added to cart!');
            // You can implement actual cart functionality here
        });
    });
}

// Update wishlist count in header
function updateWishlistCount() {
    const count = WishlistManager.getCount();    
    const wishlistCountElements = document.querySelectorAll('.wishlist-count, .header-dropdown a[href="wishlist.html"] span');
    
    wishlistCountElements.forEach(el => {
        if(el) {
            if(count > 0) {
                el.textContent = `${count}`;
                el.classList.remove('hidden');
            } else {
                el.textContent = '';
                el.classList.add('hidden');
            }
        }
    });
}

// Initialize wishlist on page load
document.addEventListener('DOMContentLoaded', function() {
    renderWishlist();
    window.addToWishlist = function(productId) {
        const success = WishlistManager.addItem(productId);
        if(success) {
            notyf.success('Product added to wishlist!');
            updateWishlistCount();
        } else {
            notyf.error('Product is already in your wishlist!');
        }
    };
    
});
