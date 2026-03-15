console.log('Categories.js: Modern version loaded');

// Categories Management System
const CategoryManager = {
    categoriesCache: null,
    currentDisplayedCount: 0,
    INITIAL_DISPLAY_COUNT: 5,

    // Get all categories from API
    async getAllCategories() {
        console.log('CategoryManager: getAllCategories called');
        try {
            if (this.categoriesCache) {
                return this.categoriesCache;
            }

            if (typeof API_CONFIG === 'undefined') {
                throw new Error('API_CONFIG is not defined');
            }

            const url = API_CONFIG.getApiUrl('Categories');
            console.log('CategoryManager: Fetching from', url);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success && data.data) {
                this.categoriesCache = data.data;
                console.log('CategoryManager: Cached', data.data.length, 'categories');
            }
            return data;
        } catch (error) {
            console.error("CategoryManager: Failed to fetch categories:", error);
            throw error;
        }
    },

    // Load and render all categories on category page
    async loadCategoriesForCategoryPage() {
        console.log('CategoryManager: loadCategoriesForCategoryPage called');
        try {
            const container = document.getElementById('categories-grid-container');
            if (!container) {
                console.error('CategoryManager: Container not found');
                return;
            }

            // Show loader
            this.showLoader(container);

            const categoriesData = await this.getAllCategories();
            console.log('CategoryManager: API Response', categoriesData);

            if (categoriesData.success && categoriesData.data && categoriesData.data.length > 0) {
                const categories = categoriesData.data;
                
                // Clear loading message
                container.innerHTML = '';

                // Render all categories
                this.renderCategories(categories, container);
            } else {
                console.warn('CategoryManager: No categories found');
                this.renderEmpty(container);
            }
        } catch (error) {
            console.error('CategoryManager: Error loading categories:', error);
            const container = document.getElementById('categories-grid-container');
            this.renderError(container);
        }
    },

    // Load and render categories on index page (limited)
    async loadCategoriesForIndex() {
        console.log('CategoryManager: loadCategoriesForIndex called');
        try {
            const container = document.getElementById('categories-banner-container');
            if (!container) {
                console.error('CategoryManager: Container not found');
                return;
            }

            const categoriesData = await this.getAllCategories();
            console.log('CategoryManager: API Response for index', categoriesData);

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
                console.warn('CategoryManager: No categories found');
                this.renderFallback(container);
            }
        } catch (error) {
            console.error('CategoryManager: Error loading categories:', error);
            const container = document.getElementById('categories-banner-container');
            this.renderError(container);
        }
    },

    // Render all categories with modern styling
    renderCategories(categories, container) {
        try {
            let html = '';

            categories.forEach((cat, index) => {
                const categoryCardHTML = `
                    <div class="category-card ">
                        <div class="category-card-image-wrapper">
                            <img 
                                src="${cat.image}" 
                                alt="${cat.name}"
                                class="category-card-image"
                                loading="lazy"
                                onerror="this.src='assets/images/products/error/error.png'"
                            >
                        </div>
                        <div class="category-card-content">
                            ${cat.parentId ? `<span class="category-card-badge">Subcategory</span>` : `<span class="category-card-badge">Category</span>`}
                            <h3 class="category-card-title">${this.escapeHtml(cat.name)}</h3>
                            <p class="category-card-desc">${this.escapeHtml(cat.description || 'Browse our collection')}</p>
                            <a href="All_products.html?categoryId=${cat.id}" class="category-card-link">
                                View Products →
                            </a>
                        </div>
                    </div>
                `;
                html += categoryCardHTML;
            });

            container.innerHTML = html;
            
            // Force grid reflow to ensure proper display
            container.style.display = 'grid';
            container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(30px, 1fr))';
            container.style.gap = '2rem';
            container.style.padding = '2rem 0';
            
            // Trigger reflow
            void container.offsetHeight;
            
            console.log('CategoryManager: Rendered', categories.length, 'categories with forced grid display');
        } catch (e) {
            console.error('CategoryManager: Error rendering categories', e);
            this.renderError(container);
        }
    },

    // Render batch for index page
    renderCategoriesBatch(categories, container, count) {
        try {
            const startIndex = this.currentDisplayedCount;
            const endIndex = Math.min(startIndex + count, categories.length);
            const batch = categories.slice(startIndex, endIndex);

            if (batch.length === 0) return;

            let html = '';

            for (let i = 0; i < batch.length; i++) {
                const cat = batch[i];
                const index = startIndex + i;

                html += `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="block1 wrap-pic-w category-banner-card">
                            <img 
                                src="${cat.image}" 
                                alt="${cat.name}"
                                class="category-banner-img"
                                loading="lazy"
                                onerror="this.src='assets/images/products/error/error.png'"
                            >

                            <a href="All_products.html?categoryId=${cat.id}" 
                            class="block1-txt ab-t-l s-full flex-col-l-sb p-lr-38 p-tb-34 trans-03 respon3">

                                <div class="block1-txt-child1 flex-col-l">
                                    <span class="block1-name ltext-102 trans-04 p-b-8">
                                        ${this.escapeHtml(cat.name)}
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
            console.error('CategoryManager: Error rendering batch', e);
        }
    },

    renderFallback(container) {
        if (container) {
            container.innerHTML = `

            `;
        }
    },

    showLoader(container) {
        container.innerHTML = `
            <div class="loader-container">
                <div class="loader-spinner"></div>
                <p class="loader-text">Loading categories...</p>
            </div>
        `;
    },

    renderEmpty(container) {
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <h3 class="empty-state-title">No Categories Available</h3>
                    <p class="empty-state-text">Please check back soon for our latest collections.</p>
                    <a href="index.html" class="btn btn-primary">Return to Home</a>
                </div>
            `;
        }
    },

    renderError(container) {
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <h3 class="empty-state-title">Oops! Something went wrong</h3>
                    <p class="empty-state-text">We couldn't load the categories. Please try again later.</p>
                    <button class="btn btn-primary" onclick="CategoryManager.loadCategoriesForCategoryPage()">
                        Retry
                    </button>
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

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    attachProductEventHandlers(container) {
        container.querySelectorAll('.btn-wishlist').forEach(button => {
            button.addEventListener('click', async function (e) {
                e.preventDefault();
                e.stopPropagation();

                const productId = parseInt(this.getAttribute('data-product-id'));

                if (typeof WishlistManager !== 'undefined' && WishlistManager.toggleWishlist) {
                    try {
                        const result = await WishlistManager.toggleWishlist(productId);

                        const icon = this.querySelector('i');
                        const span = this.querySelector('span');

                        if (result && result.added === false) {
                            this.classList.remove('added');
                            if (icon) icon.className = 'icon-heart-o';
                            if (span) span.textContent = 'add to wishlist';
                            this.title = 'Add to wishlist';
                        } else {
                            this.classList.add('added');
                            if (icon) icon.className = 'icon-heart';
                            if (span) span.textContent = 'remove from wishlist';
                            this.title = 'Remove from wishlist';
                        }
                    } catch (error) {
                        console.error('Wishlist error:', error);
                    }
                }
            });
        });
    }
};

window.CategoryManager = CategoryManager;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('CategoryManager: DOM Content Loaded');
    
    // Ensure grid container is set to display: grid FIRST
    const container = document.getElementById('categories-grid-container');
    if (container) {
        // Force grid immediately
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        container.style.gap = '2rem';
        container.style.padding = '2rem 0';
        
        console.log('CategoryManager: Grid initialized, skipping loadCategoriesForCategoryPage() to let product-category.js handle it');
        // CategoryManager.loadCategoriesForCategoryPage();
    }

    // Check for index page container
    const indexContainer = document.getElementById('categories-banner-container');
    if (indexContainer) {
        console.log('CategoryManager: Found categories-banner-container, loading index categories');
        CategoryManager.loadCategoriesForIndex();
    }
});

$(document).ready(function () {
    console.log('CategoryManager: jQuery ready');
    if (document.getElementById('categories-banner-container')) {
        CategoryManager.loadCategoriesForIndex();
    }
});
