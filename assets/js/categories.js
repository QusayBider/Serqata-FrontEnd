console.log('Categories.js: Script loaded');

// Categories Management System
const CategoryManager = {
    categoriesCache: null,
    currentDisplayedCount: 0,
    INITIAL_DISPLAY_COUNT: 5,

    // Get all categories from API
    async getAllCategories() {
        console.log('Categories.js: getAllCategories called');
        try {
            if (this.categoriesCache) {
                return this.categoriesCache;
            }

            if (typeof API_CONFIG === 'undefined') {
                throw new Error('API_CONFIG is not defined');
            }

            const url = API_CONFIG.getApiUrl('Categories');
            console.log('Categories.js: Fetching from', url);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success && data.data) {
                this.categoriesCache = data.data;
            }
            return data;
        } catch (error) {
            console.error("Categories.js: Failed to fetch categories:", error);
            throw error;
        }
    },

    // Load and render categories on index page
    async loadCategoriesForIndex() {
        console.log('Categories.js: loadCategoriesForIndex called');
        try {
            const container = document.getElementById('categories-banner-container');
            if (!container) {
                console.error('Categories.js: Container not found');
                return;
            }

            const categoriesData = await this.getAllCategories();
            console.log('Categories.js: API Response', categoriesData);

            if (categoriesData.success && categoriesData.data && categoriesData.data.length > 0) {
                const categories = categoriesData.data;
                const viewMoreContainer = document.getElementById('categories-view-more-container');
                const viewMoreBtn = document.getElementById('btn-view-more-categories');

                // Clear loading message
                container.innerHTML = '';
                this.currentDisplayedCount = 0;

                // Render initial batch
                this.renderCategoriesBatch(categories, container, this.INITIAL_DISPLAY_COUNT);

                // Setup "View More" button
                if (categories.length > this.INITIAL_DISPLAY_COUNT) {
                    if (viewMoreContainer) {
                        viewMoreContainer.style.display = 'block';
                    }

                    if (viewMoreBtn) {
                        viewMoreBtn.onclick = (e) => {
                            e.preventDefault();
                            window.location.href = './Category.html';
                        };
                    }
                } else {
                    if (viewMoreContainer) viewMoreContainer.style.display = 'none';
                }

            } else {
                console.warn('Categories.js: No categories found');
                this.renderFallback(container);
            }
        } catch (error) {
            console.error('Categories.js: Error loading categories:', error);
            const container = document.getElementById('categories-banner-container');
            this.renderError(container);
        }
    },

    renderCategoriesBatch(categories, container, count) {
    try {
        const startIndex = this.currentDisplayedCount;
        const endIndex = Math.min(startIndex + count, categories.length);
        const batch = categories.slice(startIndex, endIndex);

        if (batch.length === 0) return;

        let html = '';

        for (let i = 0; i < batch.length; i++) {
            const cat = batch[i];

            // global index in original categories array
            const index = startIndex + i;

            html += `
                <div class="${index < 2 ? 'col-md-6 banner-lg' : 'col-md-6 col-lg-4 banner-sm'} banner-item mb-4">
                    <div class="block1 wrap-pic-w category-banner-card">
                        <img 
                            src="${cat.image}" 
                            alt="${cat.name}"
                            class="category-banner-img"
                            onerror="this.src='assets/images/products/error/error.png'"
                        >

                        <a href="All_products.html?categoryId=${cat.id}" 
                        class="block1-txt ab-t-l s-full flex-col-l-sb p-lr-38 p-tb-34 trans-03 respon3">

                            <div class="block1-txt-child1 flex-col-l">
                                <span class="block1-name ltext-102 trans-04 p-b-8">
                                    ${cat.name}
                                </span>
                            </div>

                            <div class="block1-txt-child2 p-b-4 trans-05">
                                <div class="block1-name stext-101 cl0 trans-09">
                                     View Category
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            `;
        }

        container.insertAdjacentHTML('beforeend', html);
        this.currentDisplayedCount = endIndex;
    } catch (e) {
        console.error('Categories.js: Error rendering batch', e);
    }
},

    renderFallback(container) {
        if (container) {
            container.innerHTML = `
                <div class="col-lg-6">
                    <div class="banner banner-hover">
                        <a href="All_products.html">
                            <img src="assets/images/products/error/error.png" alt="error" onerror="this.src='assets/images/products/error/error.png'">
                        </a>
                        <div class="banner-content">
                            <h3 class="banner-title text-white"><a href="All_products.html">Shop Now</a></h3>
                            <a href="All_products.html" class="banner-link">Shop Now <i class="icon-long-arrow-right"></i></a>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    renderError(container) {
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <p class="text-muted">Unable to load categories. Please try again later.</p>
                </div>
            `;
        }
    },

    async getProductsByCategory(categoryId, numberOfPage = 0, pageSize = 0) {
        try {
            let url = API_CONFIG.getApiUrl(`Products/GetProductsByCategory/${categoryId}`);
            if (numberOfPage > 0 && pageSize > 0) {
                url += `?NumberOfPage=${numberOfPage}&PageSize=${pageSize}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Failed to fetch products by category:", error);
            throw error;
        }
    },

    getCategoryIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get('categoryId');
        return categoryId ? parseInt(categoryId) : null;
    },

    attachProductEventHandlers(container) {
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

        // Quick View buttons
        container.querySelectorAll('.btn-quickview').forEach(button => {
            button.addEventListener('click', function (e) {
                e.preventDefault();
                if (window.notyf) {
                    window.notyf.info('Quick view feature coming soon');
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

window.CategoryManager = CategoryManager;

$(document).ready(function () {
    console.log('Categories.js: Document ready');
    if (document.getElementById('categories-banner-container')) {
        console.log('Categories.js: Container found, initializing...');
        CategoryManager.loadCategoriesForIndex();
    } else {
        console.warn('Categories.js: categories-banner-container not found');
    }
});
