// Product Category Page Manager
const ProductCategoryManager = {
    categories: [],

    // Load and render all categories dynamically
    async loadCategories() {
        try {
            // Show loading state
            this.showLoading();

            // Fetch categories from API
            const categoriesData = await CategoryManager.getAllCategories();
            
            if (categoriesData.success && categoriesData.data && categoriesData.data.length > 0) {
                this.categories = categoriesData.data;
                
                // Fetch product count for each category
                await this.fetchProductCounts();
                
                this.renderCategories(this.categories);
            } else {
                this.showNoCategories();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError();
        }
    },

    // Fetch product count for all categories
    async fetchProductCounts() {
        try {
            // Fetch product counts for each category in parallel
            const productCountPromises = this.categories.map(async (category) => {
                try {
                    const productsData = await CategoryManager.getProductsByCategory(category.id);
                    if (productsData.success && productsData.data) {
                        category.productCount = Array.isArray(productsData.data) ? productsData.data.length : 0;
                    } else {
                        category.productCount = 0;
                    }
                } catch (error) {
                    console.error(`Error fetching products for category ${category.id}:`, error);
                    category.productCount = 0;
                }
            });

            // Wait for all product counts to be fetched
            await Promise.all(productCountPromises);
        } catch (error) {
            console.error('Error fetching product counts:', error);
        }
    },

    // Show loading state
    showLoading() {
        const container = document.getElementById('categories-grid-container');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="loader" style="margin: 50px auto;">
                        <i class="icon-refresh" style="font-size: 48px; animation: spin 1s linear infinite;"></i>
                        <p class="mt-3">Loading categories...</p>
                    </div>
                </div>
            `;
        }
    },

    // Show no categories message
    showNoCategories() {
        const container = document.getElementById('categories-grid-container');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">No categories available at the moment.</p>
                </div>
            `;
        }
    },

    // Show error message
    showError() {
        const container = document.getElementById('categories-grid-container');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-danger">Error loading categories. Please try again later.</p>
                </div>
            `;
        }
    },

    // Count products in a category (if the API provides this)
    getProductCount(category) {
        // If API provides product count
        if (category.productCount !== undefined) {
            return category.productCount;
        }
        // If API provides products array
        if (category.products && Array.isArray(category.products)) {
            return category.products.length;
        }
        // Default to 0
        return 0;
    },

    // Format product count text
    formatProductCount(count) {
        if (count === 0) {
            return '0 Products';
        } else if (count === 1) {
            return '1 Product';
        } else {
            return `${count} Products`;
        }
    },

    // Render categories in a grid layout
    renderCategories(categories) {
        const container = document.getElementById('categories-grid-container');
        if (!container) {
            console.error('Categories container not found');
            return;
        }

        // If no categories, show message
        if (!categories || categories.length === 0) {
            this.showNoCategories();
            return;
        }

        // Split categories into two groups for the two-column layout
        const middleIndex = Math.ceil(categories.length / 2);
        const leftCategories = categories.slice(0, middleIndex);
        const rightCategories = categories.slice(middleIndex);

        // Generate HTML for left column
        const leftColumnHtml = this.generateColumnHtml(leftCategories, 'left');
        
        // Generate HTML for right column
        const rightColumnHtml = this.generateColumnHtml(rightCategories, 'right');

        // Combine both columns
        container.innerHTML = `
            <div class="col-lg-6">
                <div class="row">
                    ${leftColumnHtml}
                </div><!-- End .row -->
            </div><!-- End .col-lg-6 -->
            
            <div class="col-lg-6">
                <div class="row">
                    ${rightColumnHtml}
                </div><!-- End .row -->
            </div><!-- End .col-lg-6 -->
        `;
    },

    // Generate HTML for a column of categories
    generateColumnHtml(categories, side) {
        if (!categories || categories.length === 0) {
            return '';
        }

        let html = '';
        
        // Pattern for layout: Large-Small-Small-Large or variations
        categories.forEach((category, index) => {
            const isLarge = (side === 'left' && (index === 0 || index === 3)) || 
                           (side === 'right' && (index === 0 || index === 3));
            const colClass = isLarge ? 'col-sm-8' : 'col-sm-4';
            
            const productCount = this.getProductCount(category);
            const productCountText = this.formatProductCount(productCount);
            
            // Get image URL
            const imageUrl = category.image 
                ? (category.image.startsWith('http') ? category.image : `${API_CONFIG.BASE_URL}${category.image}`)
                : 'assets/images/products/error/error.png';

            html += `
                <div class="${colClass}">
                    <div class="banner banner-cat banner-badge">
                        <a href="category-fullwidth.html?categoryId=${category.id}">
                            <img src="${imageUrl}" 
                                 alt="${category.name}" 
                                 onerror="this.src='assets/images/products/error/error.png'">
                        </a>

                        <a class="banner-link" href="category-fullwidth.html?categoryId=${category.id}">
                            <h3 class="banner-title">${category.name}</h3><!-- End .banner-title -->
                            <h4 class="banner-subtitle">${productCountText}</h4><!-- End .banner-subtitle -->
                            <span class="banner-link-text">Shop Now</span>
                        </a><!-- End .banner-link -->
                    </div><!-- End .banner -->
                </div><!-- End .${colClass} -->
            `;
        });

        return html;
    },

    // Update sidebar filter with categories
    async updateSidebarCategories() {
        try {
            if (!this.categories || this.categories.length === 0) {
                return;
            }

            const filterContainer = document.querySelector('.filter-items.filter-items-count');
            if (!filterContainer) {
                return;
            }

            // Generate filter items HTML
            let html = '';
            this.categories.forEach((category, index) => {
                const productCount = this.getProductCount(category);
                const checkboxId = `cat-filter-${category.id}`;
                
                html += `
                    <div class="filter-item">
                        <div class="custom-control custom-checkbox">
                            <input type="checkbox" 
                                   class="custom-control-input category-filter-checkbox" 
                                   id="${checkboxId}"
                                   data-category-id="${category.id}">
                            <label class="custom-control-label" for="${checkboxId}">${category.name}</label>
                        </div><!-- End .custom-checkbox -->
                        <span class="item-count">${productCount}</span>
                    </div><!-- End .filter-item -->
                `;
            });

            filterContainer.innerHTML = html;

            // Add event listeners for filtering
            document.querySelectorAll('.category-filter-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    this.filterCategoriesBySidebar();
                });
            });
        } catch (error) {
            console.error('Error updating sidebar categories:', error);
        }
    },

    // Filter categories based on sidebar selection
    filterCategoriesBySidebar() {
        const checkedBoxes = document.querySelectorAll('.category-filter-checkbox:checked');
        
        if (checkedBoxes.length === 0) {
            // Show all categories
            this.renderCategories(this.categories);
        } else {
            // Filter categories
            const selectedCategoryIds = Array.from(checkedBoxes).map(cb => 
                parseInt(cb.getAttribute('data-category-id'))
            );
            
            const filteredCategories = this.categories.filter(cat => 
                selectedCategoryIds.includes(cat.id)
            );
            
            this.renderCategories(filteredCategories);
        }
    },

    // Clear all filters
    clearFilters() {
        // Uncheck all category checkboxes
        document.querySelectorAll('.category-filter-checkbox:checked').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Show all categories
        this.renderCategories(this.categories);
    }
};

// Make globally available
window.ProductCategoryManager = ProductCategoryManager;

// Auto-load when document is ready
$(document).ready(async function() {
    // Check if we're on the product category page
    if (document.getElementById('categories-grid-container')) {
        await ProductCategoryManager.loadCategories();
        await ProductCategoryManager.updateSidebarCategories();
        
        // Handle clear filters button
        $('.sidebar-filter-clear').on('click', function(e) {
            e.preventDefault();
            ProductCategoryManager.clearFilters();
        });
    }
});

