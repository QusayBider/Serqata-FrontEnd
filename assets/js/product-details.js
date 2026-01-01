// Product Details Management System
const ProductDetailsManager = {
    currentProduct: null,
    selectedColor: null,
    selectedSize: null,
    allColors: [],
    allSizes: [],
    
    // Check if product is in wishlist
    isProductInWishlist(productId) {
        if (typeof WishlistManager !== 'undefined' && WishlistManager.loadWishlist) {
            const wishlist = WishlistManager.loadWishlist();
            return wishlist.includes(parseInt(productId));
        }
        return false;
    },
    
    // Show loader for a section
    showLoader(sectionId, message = 'Loading...') {
        const section = document.getElementById(sectionId);
        if (section) {
            section.innerHTML = `
                <div class="loader-section">
                    <div class="loader"></div>
                    <p class="text-center text-muted">${message}</p>
                </div>
            `;
        }
    },
    
    // Hide loader and show content
    hideLoader(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const loader = section.querySelector('.loader-section');
            if (loader) {
                loader.remove();
            }
        }
    },

    // Get product ID from URL
    getProductIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        return productId ? parseInt(productId) : null;
    },

    // Get all colors from API
    async getAllColors() {
        try {
            const response = await fetch(API_CONFIG.getApiUrl('Colors'));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.data) {
                this.allColors = Array.isArray(data.data) ? data.data : [data.data];
            } else if (Array.isArray(data)) {
                this.allColors = data;
            } else {
                this.allColors = [];
            }
            
            return this.allColors;
        } catch (error) {
            console.error("Failed to fetch colors:", error);
            this.allColors = [];
            return [];
        }
    },

    // Get all sizes from API
    async getAllSizes() {
        try {
            const response = await fetch(API_CONFIG.getApiUrl('Sizes'));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success && data.data) {
                this.allSizes = Array.isArray(data.data) ? data.data : [data.data];
            } else if (Array.isArray(data)) {
                this.allSizes = data;
            } else {
                this.allSizes = [];
            }
            
            return this.allSizes;
        } catch (error) {
            console.error("Failed to fetch sizes:", error);
            this.allSizes = [];
            return [];
        }
    },

    // Get product by ID from API
    async getProductById(productId) {
        try {
            // Try to get single product endpoint first
            let response = await fetch(API_CONFIG.getApiUrl(`Products/GetProductById/${productId}`));
            
            // If that doesn't work, get all products and find the one
            if (!response.ok) {
                response = await fetch(API_CONFIG.getApiUrl('Products/GetAllProducts'));
                const data = await response.json();
                
                if (response.ok && data.success) {
                    const products = Array.isArray(data.data) ? data.data : [];
                    const product = products.find(p => p.id === productId);
                    if (product) {
                        return { success: true, data: product };
                    }
                }
                return { success: false, message: 'Product not found' };
            }
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                return { success: true, data: data.data || data };
            } else if (response.ok && Array.isArray(data)) {
                const product = data.find(p => p.id === productId);
                if (product) {
                    return { success: true, data: product };
                }
            }
            
            return { success: false, message: 'Product not found' };
        } catch (error) {
            console.error('Error fetching product:', error);
            return { success: false, message: error.message || 'Failed to fetch product' };
        }
    },

    // Get image URL with error fallback
    getImageUrl(product, imageType = 'main') {
        if (imageType === 'main') {
            return product.mainImageUrl || (product.mainImage ? `${API_CONFIG.BASE_URL}/Images/${product.mainImage}` : 'assets/images/products/error/error.png');
        }
        return 'assets/images/products/error/error.png';
    },
    
    // Build product gallery section
    async buildProductGallery(product) {
        const gallerySection = document.getElementById('product-gallery-section');
        if (!gallerySection) return;
        
        try {
            // Collect all images
            let allImages = [];
            const mainImageUrl = this.getImageUrl(product, 'main');
            if (mainImageUrl && mainImageUrl !== 'assets/images/products/error/error.png') {
                allImages.push(mainImageUrl);
            }

            if (product.subImages && Array.isArray(product.subImages) && product.subImages.length > 0) {
                product.subImages.forEach((subImage) => {
                    const subImageUrl = subImage.url || subImage.imageUrl || (subImage.image ? `${API_CONFIG.BASE_URL}/Images/${subImage.image}` : null);
                    if (subImageUrl && subImageUrl !== mainImageUrl) {
                        allImages.push(subImageUrl);
                    }
                });
            } else if (product.subImagesUrl && Array.isArray(product.subImagesUrl)) {
                product.subImagesUrl.forEach((subImageUrl) => {
                    if (subImageUrl && subImageUrl !== mainImageUrl) {
                        allImages.push(subImageUrl);
                    }
                });
            }

            if (product.images && Array.isArray(product.images)) {
                product.images.forEach((img) => {
                    const imgUrl = img.url || img.imageUrl || (img.image ? `${API_CONFIG.BASE_URL}/Images/${img.image}` : null);
                    if (imgUrl && !allImages.includes(imgUrl)) {
                        allImages.push(imgUrl);
                    }
                });
            }

            if (allImages.length === 0) {
                allImages.push('assets/images/products/error/error.png');
            }

            let galleryHtml = '';
            allImages.forEach((imageUrl, index) => {
                const isActive = index === 0 ? 'active' : '';
                galleryHtml += `
                    <a class="product-gallery-item ${isActive}" href="#" data-image="${imageUrl || 'assets/images/products/error/error.png'}" data-zoom-image="${imageUrl}" style="display: block; height: auto; width: 100%;">
                        <img src="${imageUrl}" alt="${product.name}" style="width: 100%; height: auto; display: block; object-fit: contain;" onerror="this.onerror=null; this.src='assets/images/products/error/error.png';">
                    </a>
                `;
            });

            const zoomImageUrl = allImages[0] || 'assets/images/products/error/error.png';
            const galleryHTML = `
                <div class="row">
                    <figure class="product-main-image">
                        <img id="product-zoom" src="${zoomImageUrl}" data-zoom-image="${zoomImageUrl}" alt="${product.name}" onerror="this.onerror=null; this.src='assets/images/products/error/error.png'; this.setAttribute('data-zoom-image', 'assets/images/products/error/error.png');">
                        <a href="#" id="btn-product-gallery" class="btn-product-gallery">
                            <i class="icon-arrows"></i>
                        </a>
                    </figure>
                    <div id="product-zoom-gallery" class="product-image-gallery" style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${galleryHtml}
                    </div>
                </div>
            `;
            
            gallerySection.innerHTML = galleryHTML;
            
            setTimeout(() => {
                // Check if style already exists
                let existingStyle = document.getElementById('product-gallery-item-style');
                if (!existingStyle) {
                    const style = document.createElement('style');
                    style.id = 'product-gallery-item-style';
                    style.textContent = `
                        .product-image-gallery .product-gallery-item {
                            display: block !important;
                            height: auto !important;
                            width: auto !important;
                            max-width: 100%;
                            flex: 0 0 auto;
                            position: relative;
                        }
                        .product-image-gallery .product-gallery-item::after,
                        .product-image-gallery .product-gallery-item::before {
                            content: none !important;
                            display: none !important;
                            height: 0 !important;
                            width: 0 !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }
                        .product-image-gallery .product-gallery-item img {
                            width: auto !important;
                            height: auto !important;
                            max-width: 100%;
                            max-height: 150px;
                            display: block;
                            object-fit: contain;
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                // Ensure error handler is set on the main image after it's added to DOM
                const mainImage = document.getElementById('product-zoom');
                if (mainImage) {
                    mainImage.onerror = function() {
                        this.onerror = null;
                        const errorImage = 'assets/images/products/error/error.png';
                        this.src = errorImage;
                        this.setAttribute('data-zoom-image', errorImage);
                    };
                }
            }, 50);
        } catch (error) {
            console.error('Error building gallery:', error);
            gallerySection.innerHTML = '<div class="alert alert-warning">Error loading product images</div>';
        }
    },
    
    // Build product details section
    async buildProductDetails(product, categoryName) {
        const detailsSection = document.getElementById('product-details-section');
        if (!detailsSection) return;
        
        try {
            const discount = product.discount || 0;
            const finalPrice = discount > 0 ? product.price * (1 - discount) : product.price;
            
            const rating = product.rating || product.averageRating || 0;
            const ratingPercent = (rating / 5) * 100;
            const reviewsCount = product.reviewsCount || (product.reviews ? product.reviews.length : 0);
            
            const priceHTML = discount > 0 
                ? `<span class="new-price">Now ILs ${finalPrice.toFixed(2)}</span><span class="old-price">Was ILs ${product.price.toFixed(2)}</span>`
                : `ILs ${product.price.toFixed(2)}`;
            
            const detailsHTML = `
                <h1 class="product-title">${product.name || 'Product'}</h1>
                <div class="ratings-container">
                    <div class="ratings">
                        <div class="ratings-val" style="width: ${ratingPercent}%;"></div>
                    </div>
                    <a class="ratings-text" href="#product-review-link" id="review-link">(${reviewsCount} Reviews)</a>
                </div>
                <div class="product-price">${priceHTML}</div>
                <div class="product-content">
                    <p>${product.description || 'No description available.'}</p>
                </div>
                <div class="details-filter-row details-row-size" id="color-selection-row">
                    <label>Color:</label>
                    <div class="product-nav product-nav-thumbs" id="product-colors-container">
                        <div class="text-muted">Loading colors...</div>
                    </div>
                </div>
                <div class="details-filter-row details-row-size">
                    <label for="size">Size:</label>
                    <div class="select-custom">
                        <select name="size" id="size" class="form-control">
                            <option value="">Select a size</option>
                        </select>
                    </div>
                    <a href="#" class="size-guide"><i class="icon-th-list"></i>size guide</a>
                </div>
                <div class="details-filter-row details-row-size">
                    <label for="qty">Qty:</label>
                    <div class="product-details-quantity">
                        <input type="number" id="qty" class="form-control" value="1" min="1" max="10" step="1" data-decimals="0" required>
                    </div>
                </div>
                <div class="product-details-action">
                    <a href="#" class="btn-product btn-cart" data-product-id="${product.id}"><span>add to cart</span></a>
                    <div class="details-action-wrapper">
                        <a href="#" class="btn-product btn-wishlist ${this.isProductInWishlist(product.id) ? 'added' : ''}" title="Wishlist" data-product-id="${product.id}">
                            <i class="${this.isProductInWishlist(product.id) ? 'icon-heart' : 'icon-heart-o'}"></i>
                            <span>${this.isProductInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
                        </a>
                    </div>
                </div>
                <div class="product-details-footer">
                    <div class="product-cat">
                        <span>Category:</span>
                        <a href="category-fullwidth.html?categoryId=${product.categoryId}">${categoryName}</a>
                    </div>
                    <div class="social-icons social-icons-sm">
                        <span class="social-label">Share:</span>
                        <a href="#" class="social-icon" title="Facebook" target="_blank"><i class="icon-facebook-f"></i></a>
                        <a href="#" class="social-icon" title="Twitter" target="_blank"><i class="icon-twitter"></i></a>
                        <a href="#" class="social-icon" title="Instagram" target="_blank"><i class="icon-instagram"></i></a>
                        <a href="#" class="social-icon" title="Pinterest" target="_blank"><i class="icon-pinterest"></i></a>
                    </div>
                </div>
            `;
            
            detailsSection.innerHTML = detailsHTML;
            
            // Add to cart button
            const addToCartBtn = detailsSection.querySelector('.btn-cart');
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleAddToCart(product);
                });
            }
            
            // Wishlist button
            const wishlistBtn = detailsSection.querySelector('.btn-wishlist');
            if (wishlistBtn) {
                wishlistBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleAddToWishlist(product.id);
                });
            }
            
            // Social share buttons
            const socialButtons = detailsSection.querySelectorAll('.social-icon');
            socialButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleSocialShare(btn, product);
                });
            });
        } catch (error) {
            console.error('Error building product details:', error);
            detailsSection.innerHTML = '<div class="alert alert-warning">Error loading product details</div>';
        }
    },
    
    // Build product tabs section
    async buildProductTabs(product, categoryName) {
        const tabsSection = document.getElementById('product-details-tab-section');
        if (!tabsSection) return;
        
        try {
            const descriptionContent = product.description 
                ? `<h3>Product Information</h3><p>${product.description}</p>${product.additionalInfo ? `<p>${product.additionalInfo}</p>` : ''}`
                : `<h3>Product Information</h3><p>No description available for this product.</p>`;
            
            let infoContent = '<h3>Information</h3>';
            if (product.specifications || product.details) {
                const specs = product.specifications || product.details;
                if (typeof specs === 'string') {
                    infoContent += `<p>${specs}</p>`;
                } else if (typeof specs === 'object') {
                    infoContent += '<ul>';
                    Object.keys(specs).forEach(key => {
                        infoContent += `<li><strong>${key}:</strong> ${specs[key]}</li>`;
                    });
                    infoContent += '</ul>';
                }
            } else if (product.additionalInfo) {
                infoContent += `<p>${product.additionalInfo}</p>`;
            } else {
                infoContent += '<p>No additional information available.</p>';
            }
            
            if (product.weight || product.dimensions) {
                infoContent += '<h3>Product Details</h3>';
                if (product.weight) infoContent += `<p><strong>Weight:</strong> ${product.weight}</p>`;
                if (product.dimensions) infoContent += `<p><strong>Dimensions:</strong> ${product.dimensions}</p>`;
            }
            
            const reviewsCount = product.reviewsCount || (product.reviews ? product.reviews.length : 0);
            let reviewsContent = `<h3>Reviews (${reviewsCount})</h3>`;
            if (product.reviews && Array.isArray(product.reviews) && product.reviews.length > 0) {
                product.reviews.forEach(review => {
                    const reviewRating = review.rating || 0;
                    const reviewRatingPercent = (reviewRating / 5) * 100;
                    reviewsContent += `
                        <div class="review">
                            <div class="row no-gutters">
                                <div class="col-auto">
                                    <h4><a href="#">${review.userName || 'Anonymous'}</a></h4>
                                    <div class="ratings-container">
                                        <div class="ratings">
                                            <div class="ratings-val" style="width: ${reviewRatingPercent}%;"></div>
                                        </div>
                                    </div>
                                    <span class="review-date">${review.date || ''}</span>
                                </div>
                                <div class="col">
                                    <h4>${review.title || ''}</h4>
                                    <div class="review-content">
                                        <p>${review.comment || review.content || ''}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
            } else {
                reviewsContent += '<p>No reviews yet. Be the first to review this product!</p>';
            }
            
            const tabsHTML = `
                <ul class="nav nav-pills justify-content-center" role="tablist">
                    <li class="nav-item">
                        <a class="nav-link active" id="product-desc-link" data-toggle="tab" href="#product-desc-tab" role="tab">Description</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="product-info-link" data-toggle="tab" href="#product-info-tab" role="tab">Additional information</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="product-shipping-link" data-toggle="tab" href="#product-shipping-tab" role="tab">Shipping & Returns</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" id="product-review-link" data-toggle="tab" href="#product-review-tab" role="tab">Reviews (${reviewsCount})</a>
                    </li>
                </ul>
                <div class="tab-content">
                    <div class="tab-pane fade show active" id="product-desc-tab" role="tabpanel">
                        <div class="product-desc-content">${descriptionContent}</div>
                    </div>
                    <div class="tab-pane fade" id="product-info-tab" role="tabpanel">
                        <div class="product-desc-content">${infoContent}</div>
                    </div>
                    <div class="tab-pane fade" id="product-shipping-tab" role="tabpanel">
                        <div class="product-desc-content">
                            <h3>Delivery & returns</h3>
                            <p>We deliver to over 100 countries around the world. For full details of the delivery options we offer, please view our <a href="#">Delivery information</a><br>
                            We hope you'll love every purchase, but if you ever need to return an item you can do so within a month of receipt. For full details of how to make a return, please view our <a href="#">Returns information</a></p>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="product-review-tab" role="tabpanel">
                        <div class="reviews">${reviewsContent}</div>
                    </div>
                </div>
            `;
            
            tabsSection.innerHTML = tabsHTML;
        } catch (error) {
            console.error('Error building product tabs:', error);
            tabsSection.innerHTML = '<div class="alert alert-warning">Error loading product information</div>';
        }
    },
    
    // Update sticky bar
    updateStickyBar(product) {
        const stickyImage = document.querySelector('.sticky-bar .product-media img');
        const stickyTitle = document.querySelector('.sticky-bar .product-title a');
        const stickyPrice = document.querySelector('.sticky-bar .product-price');
        const stickyCartBtn = document.querySelector('.sticky-bar .btn-cart');
        
        if (stickyImage) {
            const mainImageUrl = this.getImageUrl(product, 'main');
            stickyImage.src = mainImageUrl;
            stickyImage.onerror = function() {
                this.onerror = null;
                this.src = 'assets/images/products/error/error.png';
            };
        }
        
        if (stickyTitle) {
            stickyTitle.textContent = product.name;
            stickyTitle.href = `product.html?id=${product.id}`;
        }
        
        if (stickyPrice) {
            const discount = product.discount || 0;
            const finalPrice = discount > 0 ? product.price * (1 - discount) : product.price;
            stickyPrice.textContent = `ILs ${finalPrice.toFixed(2)}`;
        }
        
        if (stickyCartBtn) {
            stickyCartBtn.setAttribute('data-product-id', product.id);
            const newStickyBtn = stickyCartBtn.cloneNode(true);
            stickyCartBtn.parentNode.replaceChild(newStickyBtn, stickyCartBtn);
            newStickyBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleAddToCart(product);
            });
        }
    },
    
    // Initialize zoom
    initializeZoom() {
        if (typeof $ !== 'undefined') {
            const $zoomImage = $('#product-zoom');
            if ($zoomImage.length && $zoomImage.data('elevateZoom')) {
                try {
                    $zoomImage.removeData('elevateZoom');
                } catch (e) {
                    console.warn('Error removing zoom data:', e);
                }
            }
            $('.zoomContainer').remove();
            $('.product-gallery-item').off('click');
            $('#btn-product-gallery').off('click');
            
            setTimeout(() => {
                if ($.fn.elevateZoom && $zoomImage.length) {
                    const zoomImageUrl = $zoomImage.attr('data-zoom-image') || $zoomImage.attr('src');
                    $zoomImage.elevateZoom({
                        gallery: 'product-zoom-gallery',
                        galleryActiveClass: 'active',
                        zoomType: "inner",
                        cursor: "crosshair",
                        responsive: true,
                        scrollZoom: true,
                        easing: true,
                        tint: false,
                        tintColour: "#F90",
                        tintOpacity: 0.5,
                        zoomImage: zoomImageUrl
                    });
                }
                
                $('.product-gallery-item').off('click').on('click', function (e) {
                    e.preventDefault();
                    const $this = $(this);
                    let newImage = $this.attr('data-image');
                    let newZoomImage = $this.attr('data-zoom-image') || newImage;
                    
                    // Fallback to error image if URL is empty or invalid
                    if (!newImage || newImage === '' || newImage === 'undefined') {
                        newImage = 'assets/images/products/error/error.png';
                        newZoomImage = 'assets/images/products/error/error.png';
                    }
                    
                    // Set the image source with error handling
                    $zoomImage.attr('src', newImage);
                    $zoomImage.attr('data-zoom-image', newZoomImage);
                    $zoomImage.attr('alt', $this.find('img').attr('alt') || 'Product image');
                    
                    // Add/update onerror handler for the new image
                    $zoomImage.off('error').on('error', function() {
                        const errorImage = 'assets/images/products/error/error.png';
                        $(this).attr('src', errorImage);
                        $(this).attr('data-zoom-image', errorImage);
                        // Prevent infinite loop
                        $(this).off('error');
                    });
                    
                    // Update active class
                    $('#product-zoom-gallery').find('a').removeClass('active');
                    $this.addClass('active');
                    
                    // Update zoom plugin with new image
                    if ($zoomImage.data('elevateZoom')) {
                        const ez = $zoomImage.data('elevateZoom');
                        // Use error image if original fails
                        const finalImage = newImage || 'assets/images/products/error/error.png';
                        const finalZoomImage = newZoomImage || 'assets/images/products/error/error.png';
                        ez.swaptheimage(finalImage, finalZoomImage);
                    }
                });
                
                if ($.fn.magnificPopup) {
                    $('#btn-product-gallery').off('click').on('click', function (e) {
                        e.preventDefault();
                        const ez = $zoomImage.data('elevateZoom');
                        if (ez && $.fn.magnificPopup) {
                            $.magnificPopup.open({
                                items: ez.getGalleryList(),
                                type: 'image',
                                gallery: { enabled: true },
                                fixedContentPos: false,
                                removalDelay: 600,
                                closeBtnInside: false
                            }, 0);
                        }
                    });
                }
            }, 100);
        }
    },

    // Render product details
    async renderProductDetails() {
        const productId = this.getProductIdFromUrl();
        
        if (!productId) {
            const container = document.querySelector('.product-details') || document.querySelector('.product-details-top');
            if (container) {
                container.innerHTML = '<div class="alert alert-danger">Product ID not found in URL</div>';
            }
            return;
        }

        // Clear previous product data and reset state
        this.currentProduct = null;
        this.selectedColor = null;
        this.selectedSize = null;
        
        // Clear any existing zoom instances
        if (typeof $ !== 'undefined' && $('#product-zoom').length) {
            const $zoomImage = $('#product-zoom');
            if ($zoomImage.data('elevateZoom')) {
                $zoomImage.removeData('elevateZoom');
                $('.zoomContainer').remove();
            }
        }

        const productData = await this.getProductById(productId);
        
        if (!productData.success || !productData.data) {
            const container = document.querySelector('.product-details') || document.querySelector('.product-details-top');
            if (container) {
                container.innerHTML = '<div class="alert alert-danger">Product not found</div>';
            }
            return;
        }

        const product = productData.data;
        this.currentProduct = product;
        
        // Show loaders for all sections
        this.showLoader('product-gallery-section', 'Loading product images...');
        this.showLoader('product-details-section', 'Loading product details...');
        this.showLoader('product-details-tab-section', 'Loading product information...');
        
        // Get categories for display
        let categoryName = 'Uncategorized';
        try {
            const categoriesResponse = await fetch(API_CONFIG.getApiUrl('Categories'));
            const categoriesData = await categoriesResponse.json();
            if (categoriesData.success && categoriesData.data) {
                const category = categoriesData.data.find(cat => cat.id === product.categoryId);
                if (category) {
                    categoryName = category.name;
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }

        // Update page title and breadcrumb
        document.title = `${product.name} - Serqata`;
        const breadcrumbActive = document.querySelector('.breadcrumb-item.active');
        if (breadcrumbActive) {
            breadcrumbActive.textContent = product.name;
        }

        // Build all sections dynamically
        await this.buildProductGallery(product);
        await this.buildProductDetails(product, categoryName);
        await this.buildProductTabs(product, categoryName);
        
        // Load colors and sizes from API
        await this.getAllColors();
        await this.getAllSizes();

        // Render colors and sizes
        await this.renderColors(product);
        await this.renderSizes(product);
        
        // Update sticky bar
        this.updateStickyBar(product);
        
        // Initialize zoom
        this.initializeZoom();
        
        // Load "You May Also Like" products
        await this.loadRelatedProducts(product.id);
    },
    
    // Load random products for "You May Also Like" section
    async loadRelatedProducts(currentProductId) {
        const section = document.getElementById('you-may-also-like-section');
        if (!section) return;
        
        this.showLoader('you-may-also-like-section', 'Loading related products...');
        
        try {
            // Fetch all products
            const response = await fetch(API_CONFIG.getApiUrl('Products/GetAllProducts'));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const allProducts = Array.isArray(data) ? data : (data.success ? data.data : []);
            
            // Filter out current product and get random products
            const otherProducts = allProducts.filter(p => p.id !== currentProductId);
            
            // Get random products (up to 8)
            const randomProducts = this.getRandomProducts(otherProducts, 8);
            
            if (randomProducts.length === 0) {
                section.innerHTML = '<p class="text-center text-muted">No related products available.</p>';
                return;
            }
            
            // Fetch categories for display
            let categoryMap = {};
            try {
                const categoriesResponse = await fetch(API_CONFIG.getApiUrl('Categories'));
                const categoriesData = await categoriesResponse.json();
                if (categoriesData.success && categoriesData.data) {
                    categoriesData.data.forEach(cat => {
                        categoryMap[cat.id] = cat.name;
                    });
                }
            } catch (error) {
                console.warn('Error fetching categories for related products:', error);
            }
            
            // Build products HTML
            let productsHTML = '';
            randomProducts.forEach(product => {
                const categoryName = categoryMap[product.categoryId] || product.category || 'Uncategorized';
                const mainImageUrl = product.mainImageUrl || (product.mainImage ? `${API_CONFIG.BASE_URL}/Images/${product.mainImage}` : 'assets/images/products/error/error.png');
                const productId = product.id;
                const discount = product.discount || 0;
                const finalPrice = discount > 0 ? product.price * (1 - discount) : product.price;
                const rating = product.rating || product.averageRating || 0;
                const ratingPercent = (rating / 5) * 100;
                const reviewsCount = product.reviewsCount || (product.reviews ? product.reviews.length : 0);
                
                productsHTML += `
                    <div class="product product-7 text-center">
                        <figure class="product-media">
                            ${discount > 0 ? `<span class="product-label label-primary">Sale</span>` : ''}
                            <a href="product.html?id=${productId}">
                                <img src="${mainImageUrl}" alt="${product.name}" class="product-image" onerror="this.onerror=null; this.src='assets/images/products/error/error.png';">
                            </a>
                            <div class="product-action-vertical">
                                <a href="#" class="btn-product-icon btn-wishlist btn-expandable ${this.isProductInWishlist(productId) ? 'added' : ''}" data-product-id="${productId}" title="${this.isProductInWishlist(productId) ? 'Remove from wishlist' : 'Add to wishlist'}">
                                    <i class="${this.isProductInWishlist(productId) ? 'icon-heart' : 'icon-heart-o'}"></i>
                                    <span>${this.isProductInWishlist(productId) ? 'remove from wishlist' : 'add to wishlist'}</span>
                                </a>
                                <a href="popup/quickView.html" class="btn-product-icon btn-quickview" title="Quick view"><span>Quick view</span></a>
                                <a href="#" class="btn-product-icon btn-compare" title="Compare"><span>Compare</span></a>
                            </div>
                            <div class="product-action">
                                <a href="#" class="btn-product btn-cart" data-product-id="${productId}"><span>add to cart</span></a>
                            </div>
                        </figure>
                        <div class="product-body">
                            <div class="product-cat">
                                <a href="category-fullwidth.html?categoryId=${product.categoryId}">${categoryName}</a>
                            </div>
                            <h3 class="product-title"><a href="product.html?id=${productId}">${product.name}</a></h3>
                            <div class="product-price">
                                ${discount > 0 
                                    ? `<span class="new-price">Now ILs ${finalPrice.toFixed(2)}</span><span class="old-price">Was ILs ${product.price.toFixed(2)}</span>`
                                    : `ILs ${product.price.toFixed(2)}`}
                            </div>
                            <div class="ratings-container">
                                <div class="ratings">
                                    <div class="ratings-val" style="width: ${ratingPercent}%;"></div>
                                </div>
                                <span class="ratings-text">(${reviewsCount} Reviews)</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            // Build carousel HTML
            const carouselHTML = `
                <div class="owl-carousel owl-simple carousel-equal-height carousel-with-shadow" id="related-products-carousel" data-toggle="owl" 
                    data-owl-options='{
                        "nav": false, 
                        "dots": true,
                        "margin": 20,
                        "loop": false,
                        "responsive": {
                            "0": {
                                "items":1
                            },
                            "480": {
                                "items":2
                            },
                            "768": {
                                "items":3
                            },
                            "992": {
                                "items":4
                            },
                            "1200": {
                                "items":4,
                                "nav": true,
                                "dots": false
                            }
                        }
                    }'>
                    ${productsHTML}
                </div>
            `;
            
            section.innerHTML = carouselHTML;
            
            // Add event handlers for buttons in related products
            setTimeout(() => {
                // Wishlist buttons
                section.querySelectorAll('.btn-wishlist').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const productId = parseInt(btn.getAttribute('data-product-id'));
                        if (productId) {
                            ProductDetailsManager.handleAddToWishlist(productId);
                        }
                    });
                });
                
                // Quick view buttons - handled by main.js magnific popup
                // Compare buttons
                section.querySelectorAll('.btn-compare').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        notyf.info('Compare functionality coming soon!');
                    });
                });
            }, 100);
            
            // Initialize owl carousel
            if (typeof $ !== 'undefined' && $.fn.owlCarousel) {
                setTimeout(() => {
                    const $carousel = $('#related-products-carousel');
                    if ($carousel.length) {
                        // Destroy existing carousel if any
                        if ($carousel.data('owl.carousel')) {
                            $carousel.trigger('destroy.owl.carousel').removeClass('owl-carousel owl-loaded');
                            $carousel.find('.owl-stage-outer').children().unwrap();
                        }
                        
                        // Initialize new carousel
                        $carousel.owlCarousel({
                            nav: false,
                            dots: true,
                            margin: 20,
                            loop: false,
                            responsive: {
                                0: { items: 1 },
                                480: { items: 2 },
                                768: { items: 3 },
                                992: { items: 4 },
                                1200: { items: 4, nav: true, dots: false }
                            }
                        });
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error loading related products:', error);
            section.innerHTML = '<div class="alert alert-warning">Error loading related products. Please try again later.</div>';
        }
    },
    
    // Get random products from array
    getRandomProducts(products, count) {
        if (products.length <= count) {
            return products;
        }
        
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    },

    // Render colors
    async renderColors(product) {
        const colorContainer = document.querySelector('#product-colors-container') || document.querySelector('.product-nav .product-nav-thumbs');
        if (!colorContainer) return;

        let productColors = [];
        
        if (product.colors && Array.isArray(product.colors)) {
            productColors = product.colors;
        } else if (product.colorIds && Array.isArray(product.colorIds)) {
            productColors = this.allColors.filter(color => product.colorIds.includes(color.id || color.colorId));
        } else if (product.colorId) {
            const color = this.allColors.find(c => (c.id || c.colorId) === product.colorId);
            if (color) productColors = [color];
        } else {
            productColors = this.allColors;
        }

        if (productColors.length === 0) {
            colorContainer.innerHTML = '<p class="text-muted">No colors available</p>';
            return;
        }

        let colorHtml = '';
        productColors.forEach((color, index) => {
            const colorId = color.id || color.colorId;
            const colorName = color.name || color.colorName || 'Color';
            const hexColor = color.hexCode || color.hex || color.colorCode || '#cccccc';
            const isActive = index === 0;
            
            if (isActive) {
                this.selectedColor = colorId;
            }

            // Try to get color image, otherwise use color swatch
            const colorImage = color.imageUrl || color.image || null;
            
            if (colorImage) {
                colorHtml += `
                    <a href="#" class="product-color-item ${isActive ? 'active' : ''}" 
                       data-color-id="${colorId}" 
                       data-color-name="${colorName}"
                       data-color-hex="${hexColor}"
                       title="${colorName}">
                        <img src="${colorImage}" alt="${colorName}" onerror="this.onerror=null; this.style.backgroundColor='${hexColor}'; this.style.width='25px'; this.style.height='25px';">
                    </a>
                `;
            } else {
                // Use color swatch
                colorHtml += `
                    <a href="#" class="product-color-item ${isActive ? 'active' : ''}" 
                       data-color-id="${colorId}" 
                       data-color-name="${colorName}"
                       data-color-hex="${hexColor}"
                       style="background-color: ${hexColor}; width: 25px; height: 25px; border-radius: 50%; display: inline-block; border: 2px solid ${isActive ? '#333' : '#ddd'};"
                       title="${colorName}">
                        <span class="sr-only">${colorName}</span>
                    </a>
                `;
            }
        });

        colorContainer.innerHTML = colorHtml;

        // Add click handlers for color selection
        colorContainer.querySelectorAll('.product-color-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                // Remove active class from all
                colorContainer.querySelectorAll('.product-color-item').forEach(i => {
                    i.classList.remove('active');
                    if (i.style.border) {
                        i.style.border = '2px solid #ddd';
                    }
                });
                // Add active to clicked
                item.classList.add('active');
                if (item.style.border) {
                    item.style.border = '2px solid #333';
                }
                this.selectedColor = parseInt(item.getAttribute('data-color-id'));
                
                // Update main image if color has specific image
                const colorImage = item.querySelector('img');
                const mainImage = document.querySelector('#product-zoom');
                const gallery = document.querySelector('#product-zoom-gallery');
                
                if (colorImage && colorImage.src && !colorImage.src.includes('error.png') && mainImage) {
                    const newImageSrc = colorImage.src;
                    mainImage.src = newImageSrc;
                    mainImage.setAttribute('data-zoom-image', newImageSrc);
                    
                    // Add error handler for the new image
                    mainImage.onerror = function() {
                        this.onerror = null;
                        const errorImage = 'assets/images/products/error/error.png';
                        this.src = errorImage;
                        this.setAttribute('data-zoom-image', errorImage);
                    };
                    
                    // Update zoom plugin if it exists
                    if (typeof $ !== 'undefined' && $(mainImage).data('elevateZoom')) {
                        const ez = $(mainImage).data('elevateZoom');
                        ez.swaptheimage(newImageSrc, newImageSrc);
                    }
                    
                    // Update active gallery item
                    if (gallery) {
                        const firstGalleryItem = gallery.querySelector('.product-gallery-item');
                        if (firstGalleryItem) {
                            const firstImg = firstGalleryItem.querySelector('img');
                            if (firstImg) {
                                firstImg.src = newImageSrc;
                                firstImg.onerror = function() {
                                    this.onerror = null;
                                    this.src = 'assets/images/products/error/error.png';
                                };
                            }
                            firstGalleryItem.setAttribute('data-image', newImageSrc);
                            firstGalleryItem.setAttribute('data-zoom-image', newImageSrc);
                        }
                    }
                }
            });
        });
    },

    // Render sizes
    async renderSizes(product) {
        const sizeSelect = document.querySelector('#size');
        if (!sizeSelect) return;

        // Get product sizes
        let productSizes = [];
        
        if (product.sizes && Array.isArray(product.sizes)) {
            productSizes = product.sizes;
        } else if (product.sizeIds && Array.isArray(product.sizeIds)) {
            productSizes = this.allSizes.filter(size => product.sizeIds.includes(size.id || size.sizeId));
        } else if (product.sizeId) {
            const size = this.allSizes.find(s => (s.id || s.sizeId) === product.sizeId);
            if (size) productSizes = [size];
        } else {
            // If no specific sizes, show all available sizes
            productSizes = this.allSizes;
        }

        if (productSizes.length === 0) {
            sizeSelect.innerHTML = '<option value="">No sizes available</option>';
            return;
        }

        let sizeHtml = '<option value="">Select a size</option>';
        productSizes.forEach((size) => {
            const sizeId = size.id || size.sizeId;
            const sizeName = size.name || size.sizeName || size.value || 'Size';
            
            // Only auto-select if there's only one size
            const isSelected = productSizes.length === 1;
            
            if (isSelected) {
                this.selectedSize = sizeId;
            }

            sizeHtml += `<option value="${sizeId}" ${isSelected ? 'selected' : ''}>${sizeName}</option>`;
        });

        sizeSelect.innerHTML = sizeHtml;

        // Remove existing listeners and add new change handler for size selection
        const newSizeSelect = sizeSelect.cloneNode(true);
        sizeSelect.parentNode.replaceChild(newSizeSelect, sizeSelect);
        newSizeSelect.addEventListener('change', (e) => {
            this.selectedSize = e.target.value ? parseInt(e.target.value) : null;
        });
    },

    // Handle add to cart with color and size
    async handleAddToCart(product) {
        const quantityInput = document.querySelector('#qty') || document.querySelector('.sticky-bar #sticky-cart-qty');
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

        // Validate color and size if available
        // Only require selection if product has multiple colors/sizes
        const hasMultipleColors = (product.colors && product.colors.length > 1) || 
                                 (product.colorIds && product.colorIds.length > 1) ||
                                 (this.allColors.length > 0 && (!product.colors && !product.colorIds && !product.colorId));
        
        const hasMultipleSizes = (product.sizes && product.sizes.length > 1) || 
                                (product.sizeIds && product.sizeIds.length > 1) ||
                                (this.allSizes.length > 0 && (!product.sizes && !product.sizeIds && !product.sizeId));

        if (hasMultipleColors && !this.selectedColor) {
            notyf.error('Please select a color');
            return;
        }

        if (hasMultipleSizes && !this.selectedSize) {
            notyf.error('Please select a size');
            return;
        }

        // Create cart item with product, color, and size
        const cartItem = {
            productId: product.id,
            quantity: quantity,
            colorId: this.selectedColor,
            sizeId: this.selectedSize
        };

        // Add to cart using CartManager
        try {
            const result = await CartManager.addToCartWithVariants(cartItem);
            
            if (result.success) {
                // Show success notification immediately
                notyf.success(result.message || 'Product added to cart!');
                
                // Update cart count optimistically for immediate feedback
                const cartCountElement = document.querySelector('.cart-count');
                if (cartCountElement) {
                    const currentCount = parseInt(cartCountElement.textContent) || 0;
                    const optimisticCount = currentCount + quantity;
                    cartCountElement.textContent = optimisticCount;
                    cartCountElement.style.display = optimisticCount > 0 ? '' : 'none';
                }
                
                // Update full navbar cart from actual data - delay to ensure cart is saved
                if (CartManager.updateNavbarCart) {
                    setTimeout(async () => {
                        await CartManager.updateNavbarCart();
                    }, 300); // 300ms delay to ensure cart is saved
                }
            } else {
                notyf.error(result.message || 'Failed to add product to cart');
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            notyf.error('An error occurred. Please try again.');
        }
    },
    
    // Update all product information sections with API data
    updateProductInformation(product, categoryName) {
        // Update product SKU if available
        const skuElement = document.querySelector('.product-sku, .sku');
        if (skuElement && product.sku) {
            skuElement.textContent = `SKU: ${product.sku}`;
        }
        
        // Update product stock status if available
        const stockElement = document.querySelector('.product-stock, .stock-status');
        if (stockElement) {
            if (product.stockQuantity !== undefined) {
                if (product.stockQuantity > 0) {
                    stockElement.textContent = `In Stock (${product.stockQuantity} available)`;
                    stockElement.className = 'product-stock in-stock';
                } else {
                    stockElement.textContent = 'Out of Stock';
                    stockElement.className = 'product-stock out-of-stock';
                }
            } else if (product.inStock !== undefined) {
                stockElement.textContent = product.inStock ? 'In Stock' : 'Out of Stock';
                stockElement.className = product.inStock ? 'product-stock in-stock' : 'product-stock out-of-stock';
            }
        }
        
        // Update product brand if available
        const brandElement = document.querySelector('.product-brand, .brand');
        if (brandElement && product.brand) {
            brandElement.textContent = `Brand: ${product.brand}`;
        }
        
        // Update product tags if available
        const tagsElement = document.querySelector('.product-tags, .tags');
        if (tagsElement && product.tags) {
            const tags = Array.isArray(product.tags) ? product.tags : [product.tags];
            tagsElement.innerHTML = tags.map(tag => `<a href="#">${tag}</a>`).join(', ');
        }
        
        // Update additional information tab with product data
        const infoTab = document.querySelector('#product-info-tab .product-desc-content');
        if (infoTab) {
            let infoHtml = '<h3>Information</h3>';
            
            if (product.specifications || product.details) {
                const specs = product.specifications || product.details;
                if (typeof specs === 'string') {
                    infoHtml += `<p>${specs}</p>`;
                } else if (typeof specs === 'object') {
                    infoHtml += '<ul>';
                    Object.keys(specs).forEach(key => {
                        infoHtml += `<li><strong>${key}:</strong> ${specs[key]}</li>`;
                    });
                    infoHtml += '</ul>';
                }
            } else if (product.additionalInfo) {
                infoHtml += `<p>${product.additionalInfo}</p>`;
            } else {
                infoHtml += '<p>No additional information available.</p>';
            }
            
            // Add weight/dimensions if available
            if (product.weight || product.dimensions) {
                infoHtml += '<h3>Product Details</h3>';
                if (product.weight) {
                    infoHtml += `<p><strong>Weight:</strong> ${product.weight}</p>`;
                }
                if (product.dimensions) {
                    infoHtml += `<p><strong>Dimensions:</strong> ${product.dimensions}</p>`;
                }
            }
            
            // Add size information if available
            if (product.sizes && product.sizes.length > 0) {
                infoHtml += '<h3>Available Sizes</h3>';
                infoHtml += `<p>${product.sizes.map(s => s.name || s).join(', ')}</p>`;
            } else if (this.allSizes.length > 0 && product.sizeIds && product.sizeIds.length > 0) {
                const productSizes = this.allSizes.filter(s => product.sizeIds.includes(s.id || s.sizeId));
                if (productSizes.length > 0) {
                    infoHtml += '<h3>Available Sizes</h3>';
                    infoHtml += `<p>${productSizes.map(s => s.name || s.sizeName || s.value).join(', ')}</p>`;
                }
            }
            
            infoTab.innerHTML = infoHtml;
        }
    },
    
    // Handle add to wishlist
    handleAddToWishlist(productId) {
        const isInWishlist = this.isProductInWishlist(productId);
        
        if (isInWishlist) {
            // Remove from wishlist
            if (typeof WishlistManager !== 'undefined' && WishlistManager.removeItem) {
                WishlistManager.removeItem(productId);
                notyf.success('Product removed from wishlist!');
                this.updateWishlistButtonState(productId, false);
                // Update wishlist count if function exists
                if (typeof updateWishlistCount === 'function') {
                    updateWishlistCount();
                }
                // Refresh product displays if on product listing pages
                if (typeof displayALLProducts === 'function') {
                    displayALLProducts();
                }
            } else {
                notyf.error('Wishlist functionality is not available.');
            }
        } else {
            // Add to wishlist
            if (typeof window.addToWishlist === 'function') {
                window.addToWishlist(productId);
                this.updateWishlistButtonState(productId, true);
            } else if (typeof WishlistManager !== 'undefined' && WishlistManager.addItem) {
                const success = WishlistManager.addItem(productId);
                if (success) {
                    notyf.success('Product added to wishlist!');
                    this.updateWishlistButtonState(productId, true);
                    // Update wishlist count if function exists
                    if (typeof updateWishlistCount === 'function') {
                        updateWishlistCount();
                    }
                    // Refresh product displays if on product listing pages
                    if (typeof displayALLProducts === 'function') {
                        displayALLProducts();
                    }
                } else {
                    notyf.error('Product is already in your wishlist!');
                }
            } else {
                notyf.error('Wishlist functionality is not available. Please refresh the page.');
            }
        }
    },
    
    // Update wishlist button state (icon and class)
    updateWishlistButtonState(productId, isInWishlist) {
        const wishlistButtons = document.querySelectorAll(`.btn-wishlist[data-product-id="${productId}"]`);
        wishlistButtons.forEach(btn => {
            // Remove all duplicate icons - ensure only ONE icon exists
            const existingIcons = btn.querySelectorAll('i');
            if (existingIcons.length > 1) {
                // Keep only the first icon, remove all others
                for (let i = 1; i < existingIcons.length; i++) {
                    existingIcons[i].remove();
                }
            }
            
            // Get the existing icon (should always exist from HTML template)
            const icon = btn.querySelector('i');
            if (!icon) {
                // Icon should always exist, but if it doesn't, skip update to prevent creating duplicates
                console.warn(`Wishlist button for product ${productId} is missing icon element`);
                return;
            }
            
            // Update the existing icon only
            if (isInWishlist) {
                btn.classList.add('added');
                icon.className = 'icon-heart';
                const span = btn.querySelector('span');
                if (span) {
                    span.textContent = span.textContent.includes('Remove') ? 'Remove from Wishlist' : 'remove from wishlist';
                }
                btn.setAttribute('title', 'Remove from wishlist');
            } else {
                btn.classList.remove('added');
                icon.className = 'icon-heart-o';
                const span = btn.querySelector('span');
                if (span) {
                    span.textContent = span.textContent.includes('Add') ? 'Add to Wishlist' : 'add to wishlist';
                }
                btn.setAttribute('title', 'Add to wishlist');
            }
        });
    },
    
    // Handle social share
    handleSocialShare(button, product) {
        const platform = button.getAttribute('title') || (button.querySelector('i') ? button.querySelector('i').className : '');
        const productUrl = window.location.href;
        const productName = product.name || 'Product';
        const productDescription = product.description || '';
        const shareText = `${productName} - ${productDescription.substring(0, 100)}...`;
        
        let shareUrl = '';
        
        if (platform.includes('Facebook') || platform.includes('facebook')) {
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
            window.open(shareUrl, 'facebook-share', 'width=600,height=400');
        } else if (platform.includes('Twitter') || platform.includes('twitter')) {
            shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(shareText)}`;
            window.open(shareUrl, 'twitter-share', 'width=600,height=400');
        } else if (platform.includes('Pinterest') || platform.includes('pinterest')) {
            const imageUrl = product.mainImageUrl || (product.mainImage ? `${API_CONFIG.BASE_URL}/Images/${product.mainImage}` : '');
            shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(productUrl)}&description=${encodeURIComponent(shareText)}${imageUrl ? `&media=${encodeURIComponent(imageUrl)}` : ''}`;
            window.open(shareUrl, 'pinterest-share', 'width=600,height=400');
        } else if (platform.includes('Instagram') || platform.includes('instagram')) {
            // Instagram doesn't support direct sharing via URL, show message
            notyf.info('To share on Instagram, copy the product link and paste it in your Instagram story or post.');
            // Copy URL to clipboard
            if (navigator.clipboard) {
                navigator.clipboard.writeText(productUrl).then(() => {
                    notyf.success('Product URL copied to clipboard!');
                });
            }
        } else {
            // Generic share - try Web Share API if available
            if (navigator.share) {
                navigator.share({
                    title: productName,
                    text: shareText,
                    url: productUrl
                }).catch(err => {
                    console.log('Error sharing:', err);
                });
            } else {
                // Fallback: copy to clipboard
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(productUrl).then(() => {
                        notyf.success('Product URL copied to clipboard!');
                    });
                } else {
                    notyf.info('Please copy the URL from your browser address bar to share.');
                }
            }
        }
    }
};

// Make ProductDetailsManager globally available
window.ProductDetailsManager = ProductDetailsManager;

