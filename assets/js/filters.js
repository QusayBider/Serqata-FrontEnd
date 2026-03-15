// Filter Management System
const FilterManager = {
    selectedColors: [],
    selectedCategories: [],
    selectedSizes: [],
    priceRange: { min: 0, max: 10000 },
    searchTerm: '',
    currentProducts: [],

    // Get search query from URL (?search= or ?q=)
    getSearchFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return (params.get('search') || params.get('q') || '').trim();
    },

    // Get all colors from API
    async getAllColors() {
        try {
            const response = await fetch(API_CONFIG.getApiUrl('Colors'));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Handle different response formats (API: { id, name, hexCode })
            if (data.success && data.data) {
                return Array.isArray(data.data) ? data.data : [data.data];
            } else if (Array.isArray(data)) {
                return data;
            } else if (data.data && Array.isArray(data.data)) {
                return data.data;
            }

            return [];
        } catch (error) {
            console.error("Failed to fetch colors:", error);
            return [];
        }
    },

    // Get all sizes from API (API shape: { id, name })
    async getAllSizes() {
        try {
            const response = await fetch(API_CONFIG.getApiUrl('Sizes'));
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.success && data.data) {
                return Array.isArray(data.data) ? data.data : [data.data];
            }
            if (Array.isArray(data)) return data;
            return [];
        } catch (error) {
            console.error("Failed to fetch sizes:", error);
            return [];
        }
    },

    // Get unique colors from products (fallback when Colors API is empty)
    getColorsFromProducts(products) {
        const byId = new Map();
        (products || []).forEach(p => {
            if (p.colors && Array.isArray(p.colors)) {
                p.colors.forEach(c => {
                    const id = c.id || c.colorId;
                    if (id != null && !byId.has(id)) {
                        byId.set(id, { id: id, name: c.name || c.colorName || 'Color', hexCode: c.hexCode || c.hex || c.colorCode || '#cccccc' });
                    }
                });
            }
        });
        return Array.from(byId.values()).sort((a, b) => a.id - b.id);
    },

    // Get unique sizes from products (fallback when Sizes API is empty)
    getSizesFromProducts(products) {
        const byId = new Map();
        (products || []).forEach(p => {
            if (p.sizes && Array.isArray(p.sizes)) {
                p.sizes.forEach(s => {
                    const id = s.id || s.sizeId;
                    if (id != null && !byId.has(id)) {
                        byId.set(id, { id: id, name: s.name || s.sizeName || s.value || 'Size' });
                    }
                });
            }
        });
        return Array.from(byId.values()).sort((a, b) => a.id - b.id);
    },

    // Fetch all products (for filter fallback)
    async fetchAllProducts() {
        try {
            const response = await fetch(API_CONFIG.getApiUrl('Products/GetAllProducts'));
            if (!response.ok) return [];
            const data = await response.json();
            const list = (data.success && data.data) ? (Array.isArray(data.data) ? data.data : [data.data]) : (Array.isArray(data) ? data : []);
            return list;
        } catch (e) {
            return [];
        }
    },

    // Load and render color filter (uses API, then fallback from products)
    async loadColorFilter(containerSelector = '.filter-colors') {
        try {
            let colors = await this.getAllColors();
            if (colors.length === 0) {
                const products = await this.fetchAllProducts();
                colors = this.getColorsFromProducts(products);
            }
            const container = document.querySelector(containerSelector);

            if (!container) {
                console.warn('Color filter container not found:', containerSelector);
                return;
            }

            if (colors.length === 0) {
                container.innerHTML = '<p class="text-muted">No colors available</p>';
                return;
            }

            // Render color filter buttons (API shape: id, name, hexCode)
            const colorsHtml = colors.map(color => {
                const hexColor = color.hexCode || color.hex || color.colorCode || '#cccccc';
                const colorName = color.name || color.colorName || 'Color';
                const colorId = color.id || color.colorId;

                return `
                    <a href="#" 
                       class="color-filter-item" 
                       data-color-id="${colorId}"
                       data-color-name="${colorName}"
                       style="background: ${hexColor};"
                       title="${colorName}">
                        <span class="sr-only">${colorName}</span>
                    </a>
                `;
            }).join('');

            container.innerHTML = colorsHtml;

            // Add click handlers
            container.querySelectorAll('.color-filter-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleColorFilter(item);
                });
            });
        } catch (error) {
            console.error('Error loading color filter:', error);
        }
    },

    // Toggle color filter
    toggleColorFilter(element) {
        const colorId = parseInt(element.getAttribute('data-color-id'));
        const isSelected = element.classList.contains('selected');

        if (isSelected) {
            element.classList.remove('selected');
            this.selectedColors = this.selectedColors.filter(id => id !== colorId);
        } else {
            element.classList.add('selected');
            if (!this.selectedColors.includes(colorId)) {
                this.selectedColors.push(colorId);
            }
        }

        // Trigger filter update
        this.applyFilters();
    },

    // Load and render size filter (uses API, then fallback from products)
    async loadSizeFilter(containerSelector = '#size-filter-container') {
        try {
            let sizes = await this.getAllSizes();
            if (sizes.length === 0) {
                const products = await this.fetchAllProducts();
                sizes = this.getSizesFromProducts(products);
            }
            const container = document.querySelector(containerSelector);
            if (!container) return;
            if (sizes.length === 0) {
                container.innerHTML = '<p class="text-muted small">No sizes available</p>';
                return;
            }
            const html = sizes.map(size => {
                const sizeId = size.id || size.sizeId;
                const sizeName = size.name || size.sizeName || size.value || 'Size';
                return `
                    <div class="filter-item">
                        <div class="custom-control custom-checkbox">
                            <input type="checkbox" class="custom-control-input size-filter-checkbox" id="size-filter-${sizeId}" data-size-id="${sizeId}">
                            <label class="custom-control-label" for="size-filter-${sizeId}">${sizeName}</label>
                        </div>
                    </div>
                `;
            }).join('');
            container.innerHTML = html;
            container.querySelectorAll('.size-filter-checkbox').forEach(cb => {
                cb.addEventListener('change', () => this.toggleSizeFilter(cb));
            });
        } catch (error) {
            console.error('Error loading size filter:', error);
        }
    },

    toggleSizeFilter(element) {
        const sizeId = parseInt(element.getAttribute('data-size-id'));
        if (element.checked) {
            if (!this.selectedSizes.includes(sizeId)) this.selectedSizes.push(sizeId);
        } else {
            this.selectedSizes = this.selectedSizes.filter(id => id !== sizeId);
        }
        this.applyFilters();
    },

    // Load and render category filter (from Categories API)
    async loadCategoryFilter(containerSelector = '#category-filter-container') {
        try {
            const container = document.querySelector(containerSelector);
            if (!container) return;
            let categories = [];
            if (typeof CategoryManager !== 'undefined' && CategoryManager.getAllCategories) {
                const res = await CategoryManager.getAllCategories();
                categories = (res.success && res.data) ? (Array.isArray(res.data) ? res.data : [res.data]) : (Array.isArray(res) ? res : []);
            }
            if (categories.length === 0) {
                container.innerHTML = '<p class="text-muted small">No categories</p>';
                return;
            }
            const html = categories.map(cat => `
                <div class="filter-item">
                    <div class="custom-control custom-checkbox">
                        <input type="checkbox" class="custom-control-input category-filter-checkbox" id="cat-filter-${cat.id}" data-category-id="${cat.id}">
                        <label class="custom-control-label" for="cat-filter-${cat.id}">${cat.name || ''}</label>
                    </div>
                    <span class="item-count">-</span>
                </div>
            `).join('');
            container.innerHTML = html;
            container.querySelectorAll('.category-filter-checkbox').forEach(cb => {
                cb.addEventListener('change', () => this.toggleCategoryFilter(cb));
            });
        } catch (error) {
            console.error('Error loading category filter:', error);
        }
    },

    toggleCategoryFilter(element) {
        const categoryId = parseInt(element.getAttribute('data-category-id'));
        if (element.checked) {
            if (!this.selectedCategories.includes(categoryId)) this.selectedCategories.push(categoryId);
        } else {
            this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
        }
        this.applyFilters();
    },

    // Fetch products then apply all filters client-side (reliable for any API)
    async getFilteredProducts(categoryId = null) {
        try {
            this.searchTerm = this.getSearchFromUrl();
            let url;
            let products = [];

            // When search term: fetch all products. Else: selected categories > URL category > all
            if (this.searchTerm) {
                url = API_CONFIG.getApiUrl('Products/GetAllProducts');
            } else if (this.selectedCategories.length > 0) {
                url = API_CONFIG.getApiUrl('Products/GetAllProducts');
            } else if (categoryId) {
                url = API_CONFIG.getApiUrl(`Products/GetProductsByCategory/${categoryId}`);
            } else {
                url = API_CONFIG.getApiUrl('Products/GetAllProducts');
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            products = (data.success && data.data) ? (Array.isArray(data.data) ? data.data : [data.data]) : (Array.isArray(data) ? data : []);

            // Category filter (when user selected categories)
            if (this.selectedCategories.length > 0) {
                products = products.filter(p => p.categoryId != null && this.selectedCategories.includes(parseInt(p.categoryId)));
            }

            // Search filter (name / description)
            if (this.searchTerm) {
                const term = this.searchTerm.toLowerCase();
                products = products.filter(p => {
                    const name = (p.name || '').toLowerCase();
                    const desc = (p.description || '').toLowerCase();
                    const code = (p.code || '').toLowerCase();
                    return name.includes(term) || desc.includes(term) || code.includes(term);
                });
            }

            // Color filter (product.colors: [{ id, name, hexCode }])
            if (this.selectedColors.length > 0 && products.length > 0) {
                products = products.filter(product => {
                    if (product.colors && Array.isArray(product.colors)) {
                        return product.colors.some(color => this.selectedColors.includes(color.id || color.colorId));
                    }
                    if (product.colorId != null) return this.selectedColors.includes(parseInt(product.colorId));
                    return false;
                });
            }

            // Size filter (product.sizes: [{ id, name }])
            if (this.selectedSizes.length > 0 && products.length > 0) {
                products = products.filter(product => {
                    if (product.sizes && Array.isArray(product.sizes)) {
                        return product.sizes.some(size => this.selectedSizes.includes(size.id || size.sizeId));
                    }
                    if (product.sizeId != null) return this.selectedSizes.includes(parseInt(product.sizeId));
                    return false;
                });
            }

            // Price filter
            const minP = this.priceRange.min;
            const maxP = this.priceRange.max;
            if (minP > 0 || maxP < 10000) {
                products = products.filter(p => {
                    const price = Number(p.price);
                    if (isNaN(price)) return false;
                    return price >= minP && price <= maxP;
                });
            }

            return products;
        } catch (error) {
            console.error('Error fetching filtered products:', error);
            try {
                const url = categoryId
                    ? API_CONFIG.getApiUrl(`Products/GetProductsByCategory/${categoryId}`)
                    : API_CONFIG.getApiUrl('Products/GetAllProducts');
                const response = await fetch(url);
                const data = await response.json();
                const list = (data.success && data.data) ? (Array.isArray(data.data) ? data.data : [data.data]) : (Array.isArray(data) ? data : []);
                return list;
            } catch (e) {
                return [];
            }
        }
    },

    // Apply all filters and update product display
    async applyFilters(containerId = 'category-products') {
        try {
            const categoryId = (typeof CategoryManager !== 'undefined' && CategoryManager.getCategoryIdFromUrl)
                ? CategoryManager.getCategoryIdFromUrl()
                : null;

            await this.updatePageTitle(categoryId);

            const products = await this.getFilteredProducts(categoryId);
            this.currentProducts = products;
            await this.renderProducts(products, containerId);
        } catch (error) {
            console.error('Error in applyFilters:', error);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="col-12 text-center">
                        <p class="text-danger">Error loading products. Please try again later.</p>
                        <p class="text-muted small">${error.message}</p>
                    </div>
                `;
            }
        }
    },

    // Update page title based on search, category, or "All Products"
    async updatePageTitle(categoryId = null) {
        try {
            const searchQ = this.getSearchFromUrl();
            if (searchQ) {
                document.title = 'Search: ' + searchQ + ' - serqata';
                const pageTitle = document.querySelector('#category-page-title, .page-title');
                if (pageTitle) {
                    const span = pageTitle.querySelector('span');
                    if (span) {
                        pageTitle.innerHTML = 'Search: "' + searchQ + '"<span>Shop</span>';
                    } else {
                        pageTitle.textContent = 'Search: ' + searchQ;
                    }
                }
                const breadcrumbActive = document.querySelector('#breadcrumb-category, .breadcrumb-item.active');
                if (breadcrumbActive) breadcrumbActive.textContent = 'Search results';
                return;
            }
            if (categoryId && typeof CategoryManager !== 'undefined' && CategoryManager.getAllCategories) {
                const categoryData = await CategoryManager.getAllCategories();
                const data = categoryData.success && categoryData.data ? categoryData.data : (Array.isArray(categoryData) ? categoryData : []);
                const category = Array.isArray(data) ? data.find(cat => cat.id === categoryId) : null;
                if (category) {
                    document.title = (category.name || 'Category') + ' - serqata';
                    const pageTitle = document.querySelector('#category-page-title, .page-title');
                    if (pageTitle) {
                        const span = pageTitle.querySelector('span');
                        if (span) {
                            pageTitle.innerHTML = (category.name || 'Category') + '<span>Shop</span>';
                        } else {
                            pageTitle.textContent = category.name || 'Category';
                        }
                    }
                    const breadcrumbActive = document.querySelector('#breadcrumb-category, .breadcrumb-item.active');
                    if (breadcrumbActive) breadcrumbActive.textContent = category.name || 'Category';
                    return;
                }
            }
            document.title = 'All product - serqata';
            const pageTitle = document.querySelector('#category-page-title, .page-title');
            if (pageTitle) {
                const span = pageTitle.querySelector('span');
                if (span) {
                    pageTitle.innerHTML = 'All product<span>Shop</span>';
                } else {
                    pageTitle.textContent = 'All product';
                }
            }
            const breadcrumbActive = document.querySelector('#breadcrumb-category, .breadcrumb-item.active');
            if (breadcrumbActive) breadcrumbActive.textContent = 'All product';
        } catch (error) {
            console.error('Error updating page title:', error);
        }
    },

    // Render products
    async renderProducts(products, containerId) {
        const container = document.getElementById(containerId);

        if (!container) {
            console.warn('Product container not found:', containerId);
            return;
        }

        if (products.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">No products found matching your filters.</p>
                </div>
            `;
            return;
        }

        // Get categories for display
        let categories = [];
        try {
            if (CategoryManager && typeof CategoryManager.getAllCategories === 'function') {
                const categoriesData = await CategoryManager.getAllCategories();
                categories = categoriesData.success && categoriesData.data ? categoriesData.data : [];
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }

        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.id] = cat.name;
        });

        // Helper function to check if product is in wishlist
        const isProductInWishlist = (productId) => {
            if (typeof WishlistManager !== 'undefined' && WishlistManager.loadWishlist) {
                const wishlist = WishlistManager.loadWishlist();
                return wishlist.includes(parseInt(productId));
            }
            return false;
        };

        // Render products
        const productsHtml = products.map(product => {
            // Handle different image formats from API
            let mainImage = 'assets/images/products/error/error.png';
            if (product.mainImage) {
                // If it's a full URL
                if (product.mainImage.startsWith('http')) {
                    mainImage = product.mainImage;
                }
                // If it's a path with /Images/
                else if (product.mainImage.includes('/Images/')) {
                    mainImage = `${API_CONFIG.BASE_URL}${product.mainImage}`;
                }
                // If it's just a filename
                else {
                    mainImage = `${API_CONFIG.BASE_URL}/Images/${product.mainImage}`;
                }
            } else if (product.image) {
                mainImage = product.image.startsWith('http')
                    ? product.image
                    : `${API_CONFIG.BASE_URL}/Images/${product.image}`;
            } else if (product.mainImageUrl) {
                mainImage = product.mainImageUrl;
            }

            const categoryName = categoryMap[product.categoryId] || product.category?.name || 'Uncategorized';
            const discount = product.discount || 0;
            const finalPrice = discount > 0 ? product.price * (1 - discount / 100) : product.price;
            const inWishlist = isProductInWishlist(product.id);
            const wishlistClass = inWishlist ? 'added' : '';
            const wishlistIcon = inWishlist ? 'icon-heart' : 'icon-heart-o';

            // Get product colors for color dots
            const colorDots = product.colors && Array.isArray(product.colors) && product.colors.length > 0
                ? product.colors.map((color, index) => `
                    <a href="#" class="${index === 0 ? 'active' : ''}" style="background: ${color.hexCode || color.hex || color.code || '#cccccc'};">
                        <span class="sr-only">${color.name || 'Color'}</span>
                    </a>
                `).join('')
                : '';

            // Calculate ratings (assuming rating is out of 5)
            const rating = product.rating || 0;
            const ratingPercentage = (rating / 5) * 100;
            const reviewCount = product.reviewCount || product.reviews?.length || 0;

            return `
    <div class="col-6 col-md-4 col-lg-3 d-flex">
        <div class="product product-4 product-card w-100" data-product-id="${product.id}">
            <figure class="product-media product-media-fixed">
                ${product.discount ? `<span class="product-label label-primary">Sale</span>` : ''}

                <a href="Product_Details.html?id=${product.id}" class="product-image-wrapper">
                    <img src="${mainImage}" 
                         alt="${product.name}" 
                         class="product-image product-image-main"
                         onerror="this.onerror=null; this.src='assets/images/products/error/error.png';">

                    ${
                        product.subImagesUrl && Array.isArray(product.subImagesUrl) && product.subImagesUrl.length
                            ? `<img src="${product.subImagesUrl[0]}" 
                                    alt="${product.name}" 
                                    class="product-image product-image-hover"
                                    onerror="this.onerror=null; this.src='assets/images/products/error/error.png';">`
                            : ''
                    }
                </a>

                <div class="product-action-vertical">
                    <a href="#"
                       class="btn-product-icon btn-wishlist ${wishlistClass}"
                       data-product-id="${product.id}"
                       onclick="addToWishlistHandler(event, ${product.id})"
                       title="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}">
                        <i class="${wishlistIcon}"></i>
                        <span>${inWishlist ? 'remove from wishlist' : 'add to wishlist'}</span>
                    </a>
                </div>

                <div class="product-action">
                    <a href="#" class="btn-product btn-cart" data-product-id="${product.id}">
                        <span>add to cart</span>
                    </a>
                </div>
            </figure>

            <div class="product-body product-body-fixed">
                <div class="product-cat">
                    <a href="./Category.html?id=${product.categoryId}">${categoryName}</a>
                </div>

                <h3 class="product-title product-title-fixed">
                    <a href="Product_Details.html?id=${product.id}">${product.name}</a>
                </h3>

                <div class="product-price">
                    ${
                        product.discount
                            ? `<span class="new-price">Now ILs ${(product.price * (1 - product.discount / 100)).toFixed(2)}</span>
                               <span class="old-price">Was ILs ${product.price.toFixed(2)}</span>`
                            : `ILs ${product.price.toFixed(2)}`
                    }
                </div>

                <div class="product-nav product-nav-dots ml-1">
                    ${
                        product.colors && Array.isArray(product.colors)
                            ? product.colors.map((color, index) => `
                                <a href="Product_Details.html?id=${product.id}"
                                   class="${index === 0 ? 'active' : ''}"
                                   style="background: ${color.hexCode || color.hex || color.code || '#cccccc'};"
                                   title="${color.name || 'Color'}">
                                    <span class="sr-only">${color.name || 'Color'}</span>
                                </a>
                            `).join('')
                            : ``
                    }
                </div>
            </div>
        </div>
    </div>
            `;
        }).join('');

        container.innerHTML = productsHtml;

        // Attach event handlers to dynamically loaded buttons
        this.attachProductEventHandlers(container);

        // Update product count
        const productCountElement = document.querySelector('.toolbox-info span');
        if (productCountElement) {
            productCountElement.textContent = `${products.length} of ${products.length}`;
        }
    },

    // Clear all filters and reapply
    clearFilters() {
        this.selectedColors = [];
        this.selectedCategories = [];
        this.selectedSizes = [];
        this.priceRange = { min: 0, max: 10000 };

        document.querySelectorAll('.color-filter-item.selected').forEach(item => item.classList.remove('selected'));
        document.querySelectorAll('.size-filter-checkbox:checked').forEach(cb => { cb.checked = false; });
        document.querySelectorAll('.category-filter-checkbox:checked').forEach(cb => { cb.checked = false; });

        const priceSlider = document.getElementById('price-slider');
        if (priceSlider && priceSlider.noUiSlider) {
            priceSlider.noUiSlider.set([0, 1000]);
        }
        const rangeEl = document.getElementById('filter-price-range');
        if (rangeEl) rangeEl.textContent = '0 - ILS 1000';
        // Keep priceRange default so price filter is not applied after clear
        this.priceRange = { min: 0, max: 10000 };

        this.applyFilters();
    },

    // Attach event handlers to product buttons
    attachProductEventHandlers(container) {
        // Note: Add to Cart buttons are handled by cart.js via event delegation
        // We only need to handle Wishlist buttons here

        // Wishlist buttons
        container.querySelectorAll('.btn-wishlist').forEach(button => {
            button.addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation(); // Prevent any other handlers

                const productId = parseInt(this.getAttribute('data-product-id'));

                if (typeof WishlistManager !== 'undefined' && WishlistManager.toggleWishlist) {
                    try {
                        const wasInWishlist = this.classList.contains('added');
                        const result = await WishlistManager.toggleWishlist(productId);

                        // Update button appearance
                        const icon = this.querySelector('i');
                        const span = this.querySelector('span');

                        if (result && result.added === false) {
                            // Was in wishlist, now removed
                            this.classList.remove('added');
                            if (icon) icon.className = 'icon-heart-o';
                            if (span) span.textContent = 'add to wishlist';
                            this.title = 'Add to wishlist';

                            if (window.notyf) {
                                window.notyf.success(result.message || 'Product removed from wishlist');
                            }
                        } else {
                            // Was not in wishlist, now added
                            this.classList.add('added');
                            if (icon) icon.className = 'icon-heart';
                            if (span) span.textContent = 'remove from wishlist';
                            this.title = 'Remove from wishlist';

                            if (window.notyf) {
                                window.notyf.success(result.message || 'Product added to wishlist');
                            }
                        }
                    } catch (error) {
                        console.error('Wishlist error:', error);
                        if (window.notyf) {
                            window.notyf.error('An error occurred while updating wishlist');
                        }
                    }
                } else {
                    if (window.notyf) {
                        window.notyf.error('Wishlist feature is not available');
                    }
                }
            });
        });

        // Compare buttons
        container.querySelectorAll('.btn-compare').forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                if (window.notyf) {
                    window.notyf.info('Compare feature coming soon');
                }
            });
        });
    }
};

// Make FilterManager globally available
window.FilterManager = FilterManager;

