const loader = document.querySelector('.loader');
const ViewMoreProductsBtn = document.querySelector('.ViewMoreProductsBtn');


const getAllProducts = async () => {
  try {
    const response = await fetch(API_CONFIG.getApiUrl('Products/GetAllProducts'));
    console.log("Response from products API:", response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json(); 
    console.log("Fetched products:", data);
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
    console.log("Fetched categories:", data);
    return data;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw error;
  }
};


 /* async function loadProducts() {
    try {
        const sidebarContainer = document.getElementById('best-selling-container');
       sidebarContainer.innerHTML = data.bestSellers.map(product => `
            <div class="product product-sm">
                <figure class="product-media">
                    <a href="product.html?id=${product.id}">
                        <img src="${product.smallImage}" alt="${product.name}" class="product-image">
                    </a>
                </figure>
                <div class="product-body">
                    <div class="product-cat">
                        <a href="#">${product.category}</a>
                    </div>
                    <h5 class="product-title"><a href="product.html?id=${product.id}">${product.name}</a></h5>
                    <div class="product-price">$${product.price}</div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Error fetching products:", error);
        loader.classList.remove('hidden');
        ViewMoreProductsBtn.classList.add('hidden');
    }
}*/

const displayALLProducts = async () => {
  const mainContainer = document.getElementById('recent-arrivals-container');
  try{
    console.log("Starting to fetch products...");
    const allProducts = await getAllProducts();
    console.log("Raw allProducts response:", allProducts);
    
    const allCategories = await getAllCategories();
    console.log("Raw allCategories response:", allCategories);
    
    const products = Array.isArray(allProducts) ? allProducts : (allProducts.data || []);
    const categories = Array.isArray(allCategories) ? allCategories : (allCategories.data || []);
    
    console.log("Parsed products array:", products);
    console.log("Parsed categories array:", categories);
    
    // Create a map for quick category lookup by ID
    const categoryMap = {};
    if (Array.isArray(categories)) {
      categories.forEach(cat => {
        categoryMap[cat.id] = cat.name;
      });
    }
      console.log("Category map:", categoryMap);
      console.log("Displaying products:", products);
    const result = products
      .map((product) => {
        const categoryName = categoryMap[product.categoryId] || product.category || 'Uncategorized';
        return `
        <div class="col-6 col-md-4">
                <div class="product product-4">
                    <figure class="product-media">
                        ${product.discount ? `<span class="product-label label-primary">Sale</span>` : ''}
                        <a href="product.html?id=${product.id}">
                            <img src="${product.mainImageUrl}" alt="${product.name}" class="product-image">
                            ${product.subImagesUrl?.map(img => `<img src="${img}" alt="${product.name}" class="product-image-hover">`).join('')}
                        </a>
                        <div class="product-action-vertical">
                            <a href="#" class="btn-product-icon btn-wishlist" data-product-id="${product.id}" onclick="addToWishlistHandler(event, ${product.id})"><span>add to wishlist</span></a>
                            <a href="popup/quickView.html" class="btn-product-icon btn-quickview"><span>Quick view</span></a>
                        </div>
                        <div class="product-action">
                            <a href="#" class="btn-product btn-cart"><span>add to cart</span></a>
                        </div>
                    </figure>
                    <div class="product-body">
                        <div class="product-cat">
                            <a href="#">${categoryName}</a>
                        </div>
                        <h3 class="product-title"><a href="product.html?id=${product.id}">${product.name}</a></h3>
                        <div class="product-price">
                            ${product.discount
                                ? `<span class="new-price">Now ILs ${(product.price)*(1 - product.discount)}</span><span class="old-price">Was ILs ${product.price}</span>` 
                                : `ILs ${product.price}`}
                        </div>
                    </div>
                </div>
            </div>
      `;
      })
      .join(" ");
    mainContainer.insertAdjacentHTML('afterbegin', result);
    if (products.length === 0) {
      mainContainer.innerHTML = "<p>No products available.</p>";
      ViewMoreProductsBtn.classList.add('hidden');
    }
    ViewMoreProductsBtn.classList.remove('hidden');
  }
  catch(error ){
    mainContainer.innerHTML = "<div class=\"loader\">Loading...</div>";
    console.error("Error displaying products:", error);
    loader.classList.remove("hidden");
    ViewMoreProductsBtn.classList.add('hidden');

}
  finally {
    loader.classList.add("hidden");
  }
};
displayALLProducts();

// Handle wishlist button click
function addToWishlistHandler(event, productId) {
  event.preventDefault();
  
  // Check if WishlistManager is available
  if(typeof window.addToWishlist === 'function') {
    window.addToWishlist(productId);
  } else {
    console.error('Wishlist functionality not loaded. Make sure Wishlist.js is included in your HTML.');
    notyf.error('Wishlist functionality is not available. Please refresh the page.');
  }
}