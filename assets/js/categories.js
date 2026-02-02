// Categories Management System
const CategoryManager = {
    categoriesCache: null,

    // Get all categories from API
    async getAllCategories() {
        try {
            const response = await fetch(API_CONFIG.getApiUrl('Categories'));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            throw error;
        }
    },

    // Load and render categories on index page
    async loadCategoriesForIndex() {
        try {
            const categoriesData = await this.getAllCategories();
            
            if (categoriesData.success && categoriesData.data && categoriesData.data.length > 0) {
                const categories = categoriesData.data;
                const container = document.getElementById('categories-banner-container');
                
                if (!container) return;
                
                // Clear loading message
                container.innerHTML = '';
                
                // Render categories in banner layout
                let html = '';
                
                if (categories.length > 0) {
                    // First large banner
                    const firstCategory = categories[0];
                    html += `
                        <div class="col-lg-6">
                            <div class="banner banner-hover">
                                <a href="category-fullwidth.html?categoryId=${firstCategory.id}">
                                    <img src="${firstCategory.image}" alt="${firstCategory.name}" onerror="this.src='assets/images/products/error/error.png'">
                                </a>
                                <div class="banner-content">
                                    <h3 class="banner-title text-white"><a href="category-fullwidth.html?categoryId=${firstCategory.id}">${firstCategory.name}</a></h3>
                                    <a href="category-fullwidth.html?categoryId=${firstCategory.id}" class="banner-link">Shop Now <i class="icon-long-arrow-right"></i></a>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                // Second category in separate column
                if (categories.length > 1) {
                    const secondCategory = categories[1];
                    html += `
                        <div class="col-sm-6 col-lg-3">
                            <div class="banner banner-hover">
                                <a href="category-fullwidth.html?categoryId=${secondCategory.id}">
                                    <img src="${secondCategory.image}" alt="${secondCategory.name}" onerror="this.src='assets/images/products/error/error.png'">
                                </a>
                                <div class="banner-content">
                                    <h3 class="banner-title text-white"><a href="category-fullwidth.html?categoryId=${secondCategory.id}">${secondCategory.name}</a></h3>
                                    <a href="category-fullwidth.html?categoryId=${secondCategory.id}" class="banner-link">Shop Now <i class="icon-long-arrow-right"></i></a>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                if (categories.length > 2) {
                    const thirdCategory = categories[4];
                    const fourthCategory = categories[7];
                    
                    html += `
                        <div class="col-sm-6 col-lg-3">
                            <div class="banner banner-hover">
                                <a href="category-fullwidth.html?categoryId=${thirdCategory.id}">
                                    <img src="${thirdCategory.image}" alt="${thirdCategory.name}" onerror="this.src='assets/images/products/error/error.png'">
                                </a>
                                <div class="banner-content">
                                    <h3 class="banner-title text-white"><a href="category-fullwidth.html?categoryId=${thirdCategory.id}">${thirdCategory.name}</a></h3>
                                    <a href="category-fullwidth.html?categoryId=${thirdCategory.id}" class="banner-link">Shop Now <i class="icon-long-arrow-right"></i></a>
                                </div>
                            </div>
                            ${fourthCategory ? `
                            <div class="banner banner-hover">
                                <a href="category-fullwidth.html?categoryId=${fourthCategory.id}">
                                    <img src="${fourthCategory.image }" alt="${fourthCategory.name}" onerror="this.src='assets/images/products/error/error.png'">
                                </a>
                                <div class="banner-content">
                                    <h3 class="banner-title text-white"><a href="category-fullwidth.html?categoryId=${fourthCategory.id}">${fourthCategory.name}</a></h3>
                                    <a href="category-fullwidth.html?categoryId=${fourthCategory.id}" class="banner-link">Shop Now <i class="icon-long-arrow-right"></i></a>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    `;
                }
                
                container.innerHTML = html;
            } else {
                // Fallback to default banners if no categories
                const container = document.getElementById('categories-banner-container');
                if (container) {
                    container.innerHTML = `
                        <div class="col-lg-6">
                            <div class="banner banner-hover">
                                <a href="category-fullwidth.html">
                                    <img src="assets/images/products/error/error.png" alt="error" onerror="this.src='assets/images/products/error/error.png'">
                                </a>
                                <div class="banner-content">
                                    <h3 class="banner-title text-white"><a href="category-fullwidth.html">Shop Now</a></h3>
                                    <a href="category-fullwidth.html" class="banner-link">Shop Now <i class="icon-long-arrow-right"></i></a>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            const container = document.getElementById('categories-banner-container');
            if (container) {
                container.innerHTML = `
                    <div class="col-12 text-center">
                        <p class="text-muted">Unable to load categories. Please try again later.</p>
                    </div>
                `;
            }
        }
    },

    // Get products by category ID
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
            console.log("Fetched products by category:", data);
            return data;
        } catch (error) {
            console.error("Failed to fetch products by category:", error);
            throw error;
        }
    },

    // Get category ID from URL parameter
    getCategoryIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get('categoryId');
        return categoryId ? parseInt(categoryId) : null;
    },

 
    attachProductEventHandlers(container) {
            container.querySelectorAll('.btn-wishlist').forEach(button => {
            button.addEventListener('click', async function(e) {
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
            button.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.notyf) {
                    window.notyf.info('Quick view feature coming soon');
                }
            });
        });

        // Compare buttons
        container.querySelectorAll('.btn-compare').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.notyf) {
                    window.notyf.info('Compare feature coming soon');
                }
            });
        });
    }
};

window.CategoryManager = CategoryManager;
$(document).ready(function() {
    if (document.getElementById('categories-banner-container')) {
        CategoryManager.loadCategoriesForIndex();
    }
    
});

