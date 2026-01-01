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
                                    <img src="${firstCategory.image}" alt="${firstCategory.name}" onerror="this.src='assets/images/demos/demo-18/banners/banner-1.jpg'">
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
                                    <img src="${secondCategory.image}" alt="${secondCategory.name}" onerror="this.src='assets/images/demos/demo-18/banners/banner-2.jpg'">
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
                    const thirdCategory = categories[2];
                    const fourthCategory = categories[3];
                    
                    html += `
                        <div class="col-sm-6 col-lg-3">
                            <div class="banner banner-hover">
                                <a href="category-fullwidth.html?categoryId=${thirdCategory.id}">
                                    <img src="${thirdCategory.image}" alt="${thirdCategory.name}" onerror="this.src='assets/images/demos/demo-18/banners/banner-3.jpg'">
                                </a>
                                <div class="banner-content">
                                    <h3 class="banner-title text-white"><a href="category-fullwidth.html?categoryId=${thirdCategory.id}">${thirdCategory.name}</a></h3>
                                    <a href="category-fullwidth.html?categoryId=${thirdCategory.id}" class="banner-link">Shop Now <i class="icon-long-arrow-right"></i></a>
                                </div>
                            </div>
                            ${fourthCategory ? `
                            <div class="banner banner-hover">
                                <a href="category-fullwidth.html?categoryId=${fourthCategory.id}">
                                    <img src="${fourthCategory.image }" alt="${fourthCategory.name}" onerror="this.src='assets/images/demos/demo-18/banners/banner-4.jpg'">
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
                                    <img src="assets/images/demos/demo-18/banners/banner-1.jpg" alt="Banner">
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

    // Load and display products filtered by category
    async loadProductsByCategory(containerId) {
        const categoryId = this.getCategoryIdFromUrl();
        
        if (!categoryId) {
            console.log('No category ID in URL, loading all products');
            // If no category ID, you might want to load all products
            return null;
        }

        try {
            const productsData = await this.getProductsByCategory(categoryId);
            const container = document.getElementById(containerId);
            
            if (!container) {
                console.error('Container not found:', containerId);
                return;
            }

            if (productsData.success && productsData.data && productsData.data.length > 0) {
                const products = productsData.data;
                
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
                        : 'assets/images/products/product-1.jpg';
                    
                    const inWishlist = isProductInWishlist(product.id);
                    const wishlistClass = inWishlist ? 'added' : '';
                    const wishlistIcon = inWishlist ? 'icon-heart' : 'icon-heart-o';
                    
                    return `
                        <div class="col-6 col-md-4 col-lg-4 col-xl-3 col-xxl-2">
                            <div class="product">
                                <figure class="product-media">
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
                                        <a href="#">${product.category?.name || 'Category'}</a>
                                    </div>
                                    <h3 class="product-title">
                                        <a href="product.html?id=${product.id}">${product.name}</a>
                                    </h3>
                                    <div class="product-price">
                                        $${product.price?.toFixed(2) || '0.00'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                container.innerHTML = productsHtml;
                
                // Update page title if category name is available
                const categoryData = await this.getAllCategories();
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
                    }
                }
            } else {
                container.innerHTML = `
                    <div class="col-12 text-center">
                        <p class="text-muted">No products found in this category.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading products by category:', error);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="col-12 text-center">
                        <p class="text-danger">Error loading products. Please try again later.</p>
                    </div>
                `;
            }
        }
    }
};

// Make CategoryManager globally available
window.CategoryManager = CategoryManager;

// Auto-load categories on index page
$(document).ready(function() {
    // Check if we're on index page and categories container exists
    if (document.getElementById('categories-banner-container')) {
        CategoryManager.loadCategoriesForIndex();
    }
    
    // Check if we're on category page and need to filter products
    // This will be handled by the page-specific script in category-fullwidth.html
});

