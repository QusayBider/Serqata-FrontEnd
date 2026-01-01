// Filter Management System
const FilterManager = {
    selectedColors: [],
    selectedCategories: [],
    selectedSizes: [],
    priceRange: { min: 0, max: 10000 },
    currentProducts: [],

    // Get all colors from API
    async getAllColors() {
        try {
            const response = await fetch(API_CONFIG.getApiUrl('Colors'));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Fetched colors:", data);
            
            // Handle different response formats
            if (data.success && data.data) {
                return data.data;
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

    // Load and render color filter
    async loadColorFilter(containerSelector = '.filter-colors') {
        try {
            const colors = await this.getAllColors();
            const container = document.querySelector(containerSelector);
            
            if (!container) {
                console.warn('Color filter container not found:', containerSelector);
                return;
            }

            if (colors.length === 0) {
                container.innerHTML = '<p class="text-muted">No colors available</p>';
                return;
            }

            // Render color filter buttons
            const colorsHtml = colors.map(color => {
                // Get hex color or use a default
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

    // Get products with filters applied
    async getFilteredProducts(categoryId = null) {
        try {
            let url;
            
            if (categoryId) {
                url = API_CONFIG.getApiUrl(`Products/GetProductsByCategory/${categoryId}`);
            } else {
                url = API_CONFIG.getApiUrl('Products/GetAllProducts');
            }

            // Add filter parameters
            const params = new URLSearchParams();
            
            if (this.selectedColors.length > 0) {
                // Try different parameter formats that the API might accept
                params.append('colorIds', this.selectedColors.join(','));
                // Also try as array format
                this.selectedColors.forEach(colorId => {
                    params.append('colorIds[]', colorId);
                });
            }
            
            if (this.selectedSizes.length > 0) {
                params.append('sizeIds', this.selectedSizes.join(','));
                this.selectedSizes.forEach(sizeId => {
                    params.append('sizeIds[]', sizeId);
                });
            }
            
            if (this.priceRange.min > 0 || this.priceRange.max < 10000) {
                params.append('minPrice', this.priceRange.min);
                params.append('maxPrice', this.priceRange.max);
            }

            // Build URL with filters
            let finalUrl = url;
            if (params.toString()) {
                // Remove duplicate colorIds/sizeIds entries and keep only the array format
                const cleanParams = new URLSearchParams();
                if (this.selectedColors.length > 0) {
                    this.selectedColors.forEach(colorId => {
                        cleanParams.append('colorIds', colorId);
                    });
                }
                if (this.selectedSizes.length > 0) {
                    this.selectedSizes.forEach(sizeId => {
                        cleanParams.append('sizeIds', sizeId);
                    });
                }
                if (this.priceRange.min > 0 || this.priceRange.max < 10000) {
                    cleanParams.append('minPrice', this.priceRange.min);
                    cleanParams.append('maxPrice', this.priceRange.max);
                }
                finalUrl = url + '?' + cleanParams.toString();
            }

            const response = await fetch(finalUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Handle different response formats
            if (data.success && data.data) {
                // If filters are applied, filter the results client-side as fallback
                let products = Array.isArray(data.data) ? data.data : [];
                
                // Client-side filtering if API doesn't support server-side filtering
                if (this.selectedColors.length > 0 && products.length > 0) {
                    // Filter by colors (assuming products have a colors array or colorId property)
                    products = products.filter(product => {
                        if (product.colors && Array.isArray(product.colors)) {
                            return product.colors.some(color => 
                                this.selectedColors.includes(color.id || color.colorId)
                            );
                        } else if (product.colorId) {
                            return this.selectedColors.includes(product.colorId);
                        }
                        // If product doesn't have color info, include it
                        return true;
                    });
                }
                
                return products;
            } else if (Array.isArray(data)) {
                return data;
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching filtered products:', error);
            // Fallback: try without filters
            try {
                const fallbackUrl = categoryId 
                    ? API_CONFIG.getApiUrl(`Products/GetProductsByCategory/${categoryId}`)
                    : API_CONFIG.getApiUrl('Products/GetAllProducts');
                const response = await fetch(fallbackUrl);
                const data = await response.json();
                return data.success && data.data ? data.data : (Array.isArray(data) ? data : []);
            } catch (fallbackError) {
                console.error('Fallback fetch also failed:', fallbackError);
                return [];
            }
        }
    },

    // Apply all filters and update product display
    async applyFilters(containerId = 'category-products') {
        const categoryId = (CategoryManager && typeof CategoryManager.getCategoryIdFromUrl === 'function') 
            ? CategoryManager.getCategoryIdFromUrl() 
            : null;
        
        // Update page title first
        await this.updatePageTitle(categoryId);
        
        // If no filters are selected and we have a category, use CategoryManager
        if (categoryId && this.selectedColors.length === 0 && this.selectedSizes.length === 0 
            && this.priceRange.min === 0 && this.priceRange.max === 10000) {
            // No filters, use standard category loading
            if (CategoryManager && typeof CategoryManager.loadProductsByCategory === 'function') {
                await CategoryManager.loadProductsByCategory(containerId);
                // Update title after loading (CategoryManager might update it, but we ensure it's correct)
                await this.updatePageTitle(categoryId);
                return;
            }
        }
        
        // Apply filters
        const products = await this.getFilteredProducts(categoryId);
        this.currentProducts = products;
        
        // Render filtered products
        await this.renderProducts(products, containerId);
    },

    // Update page title based on category
    async updatePageTitle(categoryId = null) {
        try {
            if (categoryId && CategoryManager && typeof CategoryManager.getAllCategories === 'function') {
                const categoryData = await CategoryManager.getAllCategories();
                if (categoryData.success && categoryData.data) {
                    const category = categoryData.data.find(cat => cat.id === categoryId);
                    if (category) {
                        // Update document title
                        document.title = `${category.name} - Molla`;
                        
                        // Update page heading
                        const pageTitle = document.querySelector('#category-page-title, .page-title');
                        if (pageTitle) {
                            const span = pageTitle.querySelector('span');
                            if (span) {
                                pageTitle.innerHTML = `${category.name}<span>Shop</span>`;
                            } else {
                                pageTitle.textContent = category.name;
                            }
                        }
                        
                        // Update breadcrumb
                        const breadcrumbActive = document.querySelector('#breadcrumb-category, .breadcrumb-item.active');
                        if (breadcrumbActive) {
                            breadcrumbActive.textContent = category.name;
                        }
                        
                        return;
                    }
                }
            }
            
            // No category or category not found - show "All Products"
            document.title = 'All Products - Molla';
            const pageTitle = document.querySelector('#category-page-title, .page-title');
            if (pageTitle) {
                const span = pageTitle.querySelector('span');
                if (span) {
                    pageTitle.innerHTML = `All Products<span>Shop</span>`;
                } else {
                    pageTitle.textContent = 'All Products';
                }
            }
            
            // Update breadcrumb
            const breadcrumbActive = document.querySelector('#breadcrumb-category, .breadcrumb-item.active');
            if (breadcrumbActive) {
                breadcrumbActive.textContent = 'All Products';
            }
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
            const mainImage = product.mainImage 
                ? `${API_CONFIG.BASE_URL}/Images/${product.mainImage}` 
                : (product.mainImageUrl || 'assets/images/products/product-1.jpg');
            
            const categoryName = categoryMap[product.categoryId] || product.category?.name || 'Uncategorized';
            const discount = product.discount || 0;
            const finalPrice = discount > 0 ? product.price * (1 - discount) : product.price;
            const inWishlist = isProductInWishlist(product.id);
            const wishlistClass = inWishlist ? 'added' : '';
            const wishlistIcon = inWishlist ? 'icon-heart' : 'icon-heart-o';

            return `
                <div class="col-6 col-md-4 col-lg-4 col-xl-3 col-xxl-2">
                    <div class="product">
                        <figure class="product-media">
                            ${discount > 0 ? `<span class="product-label label-primary">Sale</span>` : ''}
                            <a href="product.html?id=${product.id}">
                                <img src="${mainImage}" alt="${product.name}" class="product-image" onerror="this.src='assets/images/products/product-1.jpg'">
                            </a>
                            <div class="product-action-vertical">
                                <a href="#" class="btn-product-icon btn-wishlist btn-expandable ${wishlistClass}" data-product-id="${product.id}" title="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}">
                                    <i class="${wishlistIcon}"></i>
                                    <span>${inWishlist ? 'remove from wishlist' : 'add to wishlist'}</span>
                                </a>
                            </div>
                            <div class="product-action action-icon-top">
                                <a href="#" class="btn-product btn-cart" data-product-id="${product.id}" title="Add to cart">
                                    <span>add to cart</span>
                                </a>
                                <a href="popup/quickView.html" class="btn-product btn-quickview" title="Quick view">
                                    <span>quick view</span>
                                </a>
                                <a href="#" class="btn-product btn-compare" title="Compare">
                                    <span>compare</span>
                                </a>
                            </div>
                        </figure>
                        <div class="product-body">
                            <div class="product-cat">
                                <a href="#">${categoryName}</a>
                            </div>
                            <h3 class="product-title">
                                <a href="product.html?id=${product.id}">${product.name}</a>
                            </h3>
                            <div class="product-price">
                                ${discount > 0 
                                    ? `<span class="new-price">Now ILs ${finalPrice.toFixed(2)}</span><span class="old-price">Was ILs ${product.price.toFixed(2)}</span>`
                                    : `ILs ${product.price.toFixed(2)}`}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = productsHtml;

        // Update product count
        const productCountElement = document.querySelector('.toolbox-info span');
        if (productCountElement) {
            productCountElement.textContent = `${products.length} of ${products.length}`;
        }
    },

    // Clear all filters
    clearFilters() {
        this.selectedColors = [];
        this.selectedCategories = [];
        this.selectedSizes = [];
        this.priceRange = { min: 0, max: 10000 };

        // Remove selected class from all filter items
        document.querySelectorAll('.color-filter-item.selected').forEach(item => {
            item.classList.remove('selected');
        });

        // Reapply filters (which will show all products)
        this.applyFilters();
    }
};

// Make FilterManager globally available
window.FilterManager = FilterManager;

