const loader = document.querySelector('.loader');
const ViewMoreProductsBtn = document.querySelector('.ViewMoreProductsBtn');


// Helper function to check if product is in wishlist
const isProductInWishlist = (productId) => {
  if (typeof WishlistManager !== 'undefined' && WishlistManager.loadWishlist) {
    const wishlist = WishlistManager.loadWishlist();
    return wishlist.includes(parseInt(productId));
  }
  return false;
};

const getAllProducts = async () => {
  try {
    const response = await fetch(API_CONFIG.getApiUrl('Products/GetAllProducts?NumberOfPage=1&PageSize=6'));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    throw error;
  }
};

const getAllCategories = async () => {
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
};




const displayALLProducts = async () => {
  const mainContainer = document.getElementById('recent-arrivals-container');
  const loaderElement = mainContainer.querySelector('.loader');

  try {
    // Show loader if it exists
    if (loaderElement) {
      loaderElement.style.display = 'block';
    }

    const allProducts = await getAllProducts();
    const allCategories = await getAllCategories();

    const products = Array.isArray(allProducts) ? allProducts : (allProducts.success ? allProducts.data : []);
    const categories = Array.isArray(allCategories) ? allCategories : (allCategories.success ? allCategories.data : []);

    // Create a map for quick category lookup by ID
    const categoryMap = {};
    if (Array.isArray(categories)) {
      categories.forEach(cat => {
        categoryMap[cat.id] = cat.name;
      });
    }

    // Remove loader from container
    if (loaderElement) {
      loaderElement.remove();
    }

    if (products.length === 0) {
      mainContainer.innerHTML = "<p class='text-center'>No products available.</p>";
      if (ViewMoreProductsBtn) ViewMoreProductsBtn.classList.add('hidden');
      return;
    }

    const result = products
      .map((product) => {
        // Ensure product has an ID
        if (!product.id) {
          console.error('Product missing ID:', product);
          return '';
        }

        const categoryName = categoryMap[product.categoryId] || product.category || 'Uncategorized';
        const mainImageUrl = product.mainImageUrl || (product.mainImage ? `${API_CONFIG.BASE_URL}/Images/${product.mainImage}` : 'assets/images/products/error/error.png');
        const productId = parseInt(product.id);
        const inWishlist = isProductInWishlist(productId);
        const wishlistClass = inWishlist ? 'added' : '';
        const wishlistIcon = inWishlist ? 'icon-heart' : 'icon-heart-o';

          return `
    <div class="col-6 col-md-4 col-lg-3 d-flex">
        <div class="product product-4 product-card w-100" data-product-id="${productId}">
            <figure class="product-media product-media-fixed">
                ${product.discount ? `<span class="product-label label-primary">Sale</span>` : ''}

                <a href="Product_Details.html?id=${productId}" class="product-image-wrapper">
                    <img src="${mainImageUrl}" 
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
                       data-product-id="${productId}"
                       onclick="addToWishlistHandler(event, ${productId})"
                       title="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}">
                        <i class="${wishlistIcon}"></i>
                        <span>${inWishlist ? 'remove from wishlist' : 'add to wishlist'}</span>
                    </a>
                </div>

                <div class="product-action">
                    <a href="#" class="btn-product btn-cart" data-product-id="${productId}">
                        <span>add to cart</span>
                    </a>
                </div>
            </figure>

            <div class="product-body product-body-fixed">
                <div class="product-cat">
                    <a href="./Category.html?id=${product.categoryId}">${categoryName}</a>
                </div>

                <h3 class="product-title product-title-fixed">
                    <a href="Product_Details.html?id=${productId}">${product.name}</a>
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
                                <a href="Product_Details.html?id=${productId}"
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
      })
      .filter(html => html !== '') // Remove empty entries
      .join(" ");
    mainContainer.innerHTML = result;

    if (ViewMoreProductsBtn) {
      ViewMoreProductsBtn.classList.remove('hidden');
    }

    if (typeof $ !== 'undefined') {
      $(document).trigger('productsLoaded');
    }
  }
  catch (error) {
    console.error("Error displaying products:", error);
    mainContainer.innerHTML = "<div class='alert alert-danger text-center'>Error loading products. Please refresh the page.</div>";
    if (ViewMoreProductsBtn) ViewMoreProductsBtn.classList.add('hidden');
  }
};
displayALLProducts();

// Handle wishlist button click (toggle functionality)
function addToWishlistHandler(event, productId) {
  event.preventDefault();
  event.stopPropagation();

  const isInWishlist = isProductInWishlist(productId);

  if (isInWishlist) {
    // Remove from wishlist
    if (typeof WishlistManager !== 'undefined' && WishlistManager.removeItem) {
      WishlistManager.removeItem(productId);
      notyf.success('Product removed from wishlist!');
      updateWishlistButtonUI(productId, false);
      if (typeof updateWishlistCount === 'function') {
        updateWishlistCount();
      }
      // Refresh products to update all wishlist buttons
      if (typeof displayALLProducts === 'function') {
        displayALLProducts();
      }
    }
  } else {
    // Add to wishlist
    if (typeof window.addToWishlist === 'function') {
      window.addToWishlist(productId);
      updateWishlistButtonUI(productId, true);
      // Refresh products to update all wishlist buttons
      if (typeof displayALLProducts === 'function') {
        displayALLProducts();
      }
    } else {
      console.error('Wishlist functionality not loaded. Make sure Wishlist.js is included in your HTML.');
      notyf.error('Wishlist functionality is not available. Please refresh the page.');
    }
  }
}

// Update wishlist button UI
function updateWishlistButtonUI(productId, isInWishlist) {
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
        span.textContent = 'remove from wishlist';
      }
      btn.setAttribute('title', 'Remove from wishlist');
    } else {
      btn.classList.remove('added');
      icon.className = 'icon-heart-o';
      const span = btn.querySelector('span');
      if (span) {
        span.textContent = 'add to wishlist';
      }
      btn.setAttribute('title', 'Add to wishlist');
    }
  });
}