
// API Base URL
const API_BASE = window.API_BASE;

// Global variables
let products = [];
let currentPage = 1;
let totalPages = 1;
let totalProducts = 0;
let isLoading = false;

// Current filters
let currentFilters = {
  category: null,
  gender: 'all',
  search: '',
  minPrice: null,
  maxPrice: null,
  sortBy: 'newest'
};

// Function to get URL parameters
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Function to load products from API
async function loadProducts(page = 1) {
  if (isLoading) return;
  
  isLoading = true;
  showLoadingState();
  
  try {
    const params = new URLSearchParams();
    
    if (currentFilters.category) params.append('category', currentFilters.category);
    if (currentFilters.gender !== 'all') params.append('gender', currentFilters.gender);
    if (currentFilters.search) params.append('search', currentFilters.search);
    if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice);
    if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice);
    if (currentFilters.sortBy) params.append('sortBy', currentFilters.sortBy);
    
    const url = `${API_BASE}/products?${params}`;
    console.log('Loading products from:', url);
    console.log('Current filters:', currentFilters);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('API response:', data);
    
    if (data.success) {
      products = data.data;
      totalProducts = products.length;
      
      console.log('Products loaded:', products.length);
      console.log('Products:', products);
      
      renderProducts();
      updateResultsCount();
      updatePagination();
    } else {
      console.error('Error loading products:', data.message);
      showError('Failed to load products');
    }
  } catch (error) {
    console.error('Error loading products:', error);
    showError('Failed to load products');
  } finally {
    isLoading = false;
    hideLoadingState();
  }
}

// Function to show loading state
function showLoadingState() {
  const productsGrid = document.getElementById('products-grid');
  productsGrid.innerHTML = `
    <div class="col-span-full flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
    </div>
  `;
}

// Function to hide loading state
function hideLoadingState() {
  // Loading state is handled in renderProducts
}

// Function to show error
function showError(message) {
  const productsGrid = document.getElementById('products-grid');
  productsGrid.innerHTML = `
    <div class="col-span-full text-center py-12">
      <p class="text-red-500">${message}</p>
    </div>
  `;
}

     // Function to create product card
 function createProductCard(product) {
  console.log('Creating card for product:', product);
  
  const discount = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price)
    ? Math.round(((parseFloat(product.price) - parseFloat(product.discount_price)) / parseFloat(product.price)) * 100)
    : 0;
  
  console.log('Product discount calculation:', {
    name: product.name,
    price: product.price,
    discount_price: product.discount_price,
    calculated_discount: discount
  });
  
  // Use first image from database or fallback to placeholder
  const imageUrl = product.first_image ? 
    `${API_BASE.replace('/api', '')}/uploads/${product.first_image}` : 
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop';
  
  console.log('Product image for', product.name, ':', product.first_image, 'URL:', imageUrl);
  
  const card = `
    <div class="product-card" style="min-width: 160px; max-width: 100%;" onclick="viewProduct(${product.id})">
      <div class="h-full flex flex-col">
        <div class="product-image-container">
          <img src="${imageUrl}" alt="${product.name}" loading="lazy">
          ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
        </div>
        <div class="product-info flex-grow">
          <h3 class="product-title">${product.name}</h3>
          <div class="price-container">
            ${product.discount_price ? `<span class="original-price">EGP ${parseFloat(product.price).toFixed(2)}</span>` : ''}
            <span class="current-price">EGP ${parseFloat(product.discount_price ? product.discount_price : product.price).toFixed(2)}</span>
          </div>
          <p class="product-category">${product.category_name}</p>
        </div>
      </div>
    </div>
   `;
  
  console.log('Generated card for product:', product.name);
  return card;
 }

// Function to render products
function renderProducts() {
  const productsGrid = document.getElementById('products-grid');
  console.log('Rendering products:', products.length);
  
  if (products.length === 0) {
    console.log('No products to render');
    productsGrid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-gray-500">No products found</p>
      </div>
    `;
    return;
  }
  
  const productCards = products.map(product => createProductCard(product)).join('');
  console.log('Generated product cards:', productCards.length);
  
  productsGrid.innerHTML = productCards;
}

// Function to update results count
function updateResultsCount() {
  const resultsCount = document.getElementById('results-count');
  const productCount = document.getElementById('product-count');
  
  if (resultsCount && productCount) {
    productCount.textContent = totalProducts;
    resultsCount.textContent = `Showing ${products.length} of ${totalProducts} products`;
  }
}

// Function to update pagination
function updatePagination() {
  const loadMoreBtn = document.getElementById('load-more');
  
  if (loadMoreBtn) {
    // Hide load more button for now since we show all products
    loadMoreBtn.style.display = 'none';
  }
}

// Function to view product details
function viewProduct(productId) {
  window.location.href = `viewdetails.html?id=${productId}`;
}

// Function to apply filters
function applyFilters() {
  currentPage = 1;
  loadProducts(currentPage);
}

// Function to handle search
function handleSearch() {
  currentFilters.search = document.getElementById('search-input').value;
  applyFilters();
}

// Function to handle gender filter
function handleGenderFilter() {
  const selectedGender = document.querySelector('input[name="gender"]:checked').value;
  currentFilters.gender = selectedGender;
  applyFilters();
}

// Function to handle price filter
function handlePriceFilter() {
  const selectedPrice = document.querySelector('input[name="price"]:checked').value;
  
  if (selectedPrice === 'all') {
    currentFilters.minPrice = null;
    currentFilters.maxPrice = null;
  } else if (selectedPrice === '0-50') {
    currentFilters.minPrice = 0;
    currentFilters.maxPrice = 50;
  } else if (selectedPrice === '50-100') {
    currentFilters.minPrice = 50;
    currentFilters.maxPrice = 100;
  } else if (selectedPrice === '100+') {
    currentFilters.minPrice = 100;
    currentFilters.maxPrice = null;
  }
  
  applyFilters();
}

// Function to handle sort
function handleSort() {
  currentFilters.sortBy = document.getElementById('sort-select').value;
  applyFilters();
}

// Function to clear filters
function clearFilters() {
  document.querySelector('input[name="gender"][value="all"]').checked = true;
  document.querySelector('input[name="price"][value="all"]').checked = true;
  document.getElementById('search-input').value = '';
  document.getElementById('sort-select').value = 'newest';
  
  currentFilters = {
    category: currentFilters.category, // Keep category from URL
    gender: 'all',
    search: '',
    minPrice: null,
    maxPrice: null,
    sortBy: 'newest'
  };
  
  applyFilters();
}

// Function to load more products
function loadMore() {
  // For now, just show all products
  // In the future, we can implement proper pagination
  console.log('Load more functionality can be implemented later');
}

// Function to filter by category from URL
function filterByCategoryFromUrl() {
  const categoryParam = getUrlParameter('category');
  console.log('Category parameter from URL:', categoryParam);
  
  if (categoryParam) {
    currentFilters.category = decodeURIComponent(categoryParam);
    console.log('Set category filter to:', currentFilters.category);
    
    // Update page title and header
    const pageTitle = document.querySelector('h1');
    const pageDescription = document.querySelector('p');
    if (pageTitle) pageTitle.textContent = decodeURIComponent(categoryParam);
    if (pageDescription) pageDescription.textContent = `Discover our ${decodeURIComponent(categoryParam)} collection`;
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Check for category parameter first
  filterByCategoryFromUrl();
  
  // Load initial products
  loadProducts();

  // Gender filter
  document.querySelectorAll('input[name="gender"]').forEach(radio => {
    radio.addEventListener('change', handleGenderFilter);
  });

  // Price filter
  document.querySelectorAll('input[name="price"]').forEach(radio => {
    radio.addEventListener('change', handlePriceFilter);
  });

  // Search with debounce
  let searchTimeout;
  document.getElementById('search-input').addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(handleSearch, 500);
  });

  // Clear filters
  document.getElementById('clear-filters').addEventListener('click', clearFilters);

  // Load more
  document.getElementById('load-more').addEventListener('click', loadMore);

  // Sort
  document.getElementById('sort-select').addEventListener('change', handleSort);
});
