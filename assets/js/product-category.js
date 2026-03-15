// Product Category Page Manager
// Product Category Page Manager
const ProductCategoryManager = {
    categories: [],

    async loadCategories() {
        try {
            this.showLoading();

            const categoriesData = await CategoryManager.getAllCategories();

            if (categoriesData.success && categoriesData.data && categoriesData.data.length > 0) {
                this.categories = categoriesData.data;

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

    async fetchProductCounts() {
        try {
            const productCountPromises = this.categories.map(async (category) => {
                try {
                    const productsData = await CategoryManager.getProductsByCategory(category.id);
                    category.productCount = (
                        productsData.success && Array.isArray(productsData.data)
                    ) ? productsData.data.length : 0;
                } catch (error) {
                    console.error(`Error fetching products for category ${category.id}:`, error);
                    category.productCount = 0;
                }
            });

            await Promise.all(productCountPromises);
        } catch (error) {
            console.error('Error fetching product counts:', error);
        }
    },

    showLoading() {
        const container = document.getElementById('categories-grid-container');
        if (!container) return;

        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="loader" style="margin: 50px auto;">
                    <i class="icon-refresh" style="font-size: 48px; animation: spin 1s linear infinite;"></i>
                    <p class="mt-3">Loading categories...</p>
                </div>
            </div>
        `;
    },

    showNoCategories() {
        const container = document.getElementById('categories-grid-container');
        if (!container) return;

        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="text-muted">No categories available at the moment.</p>
            </div>
        `;
    },

    showError() {
        const container = document.getElementById('categories-grid-container');
        if (!container) return;

        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="text-danger">Error loading categories. Please try again later.</p>
            </div>
        `;
    },

    getProductCount(category) {
        if (category.productCount !== undefined) return category.productCount;
        if (Array.isArray(category.products)) return category.products.length;
        return 0;
    },

    formatProductCount(count) {
        if (count === 1) return '1 Product';
        return `${count} Products`;
    },

    getImageUrl(category) {
        if (category.image) {
            return category.image.startsWith('http')
                ? category.image
                : `${API_CONFIG.BASE_URL}${category.image}`;
        }
        return 'assets/images/products/error/error.png';
    },

    renderCategories(categories) {
        const container = document.getElementById('categories-grid-container');
        if (!container) {
            console.error('Categories container not found');
            return;
        }

        if (!categories || categories.length === 0) {
            this.showNoCategories();
            return;
        }

        const html = categories.map((category, index) => {
            const productCountText = this.formatProductCount(this.getProductCount(category));
            const imageUrl = this.getImageUrl(category);
            const isFirst = index === 0;

            return `
                <div class="category-card : ''}">
                    <div class="category-card-image-wrapper">
                        <img 
                            src="${imageUrl}" 
                            alt="${category.name}"
                            class="category-card-image"
                            loading="lazy"
                            onerror="this.src='assets/images/products/error/error.png'"
                        >
                    </div>
                    <div class="category-card-content">
                        <h3 class="category-card-title">${category.name}</h3>
                        <p class="category-card-desc">${productCountText}</p>
                        <a href="All_products.html?categoryId=${category.id}" class="category-card-link">
                            View Products →
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
        
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
        container.style.gap = '2rem';
        container.style.padding = '2rem 0';
    },

    async updateSidebarCategories() {
        try {
            if (!this.categories || this.categories.length === 0) return;

            const filterContainer = document.querySelector('.filter-items.filter-items-count');
            if (!filterContainer) return;

            let html = '';

            this.categories.forEach((category) => {
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
                        </div>
                        <span class="item-count">${productCount}</span>
                    </div>
                `;
            });

            filterContainer.innerHTML = html;

            document.querySelectorAll('.category-filter-checkbox').forEach((checkbox) => {
                checkbox.addEventListener('change', () => {
                    this.filterCategoriesBySidebar();
                });
            });
        } catch (error) {
            console.error('Error updating sidebar categories:', error);
        }
    },

    filterCategoriesBySidebar() {
        const checkedBoxes = document.querySelectorAll('.category-filter-checkbox:checked');

        if (checkedBoxes.length === 0) {
            this.renderCategories(this.categories);
            return;
        }

        const selectedCategoryIds = Array.from(checkedBoxes).map((cb) =>
            parseInt(cb.getAttribute('data-category-id'), 10)
        );

        const filteredCategories = this.categories.filter((cat) =>
            selectedCategoryIds.includes(cat.id)
        );

        this.renderCategories(filteredCategories);
    },

    clearFilters() {
        document.querySelectorAll('.category-filter-checkbox:checked').forEach((checkbox) => {
            checkbox.checked = false;
        });

        this.renderCategories(this.categories);
    }
};

window.ProductCategoryManager = ProductCategoryManager;

$(document).ready(async function () {
    if (document.getElementById('categories-grid-container')) {
        await ProductCategoryManager.loadCategories();
       // applyDynamicTextColor();
        await ProductCategoryManager.updateSidebarCategories();

        $('.sidebar-filter-clear').on('click', function (e) {
            e.preventDefault();
            ProductCategoryManager.clearFilters();
        });
    }
});
function applyDynamicTextColor() {
    document.querySelectorAll('.block1 img').forEach(img => {

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = function () {

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

            let brightness = 0;
            let pixels = imageData.length / 4;

            for (let i = 0; i < imageData.length; i += 4) {
                brightness += (imageData[i] + imageData[i+1] + imageData[i+2]) / 3;
            }

            brightness = brightness / pixels;

            const text = img.closest('.block1').querySelector('.block1-txt');

            if (brightness > 140) {
                text.classList.add('dynamic-dark-text');
            } else {
                text.classList.add('dynamic-light-text');
            }

        }

        if (img.complete) img.onload();
    });
}

