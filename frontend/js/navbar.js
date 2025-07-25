// === Cache DOM elements ===
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const dropdownBtn = document.getElementById('desktop-collection-btn');
const dropdownMenu = document.getElementById('desktop-dropdown-menu');

// === API Base URL ===
window.API_BASE = 'http://localhost:7000/api';

// === Load categories for navbar ===
async function loadCategoriesForNavbar() {
    try {
        console.log('Loading categories for navbar...');
        const response = await fetch(`${window.API_BASE}/categories`);
        
        if (!response.ok) {
            console.warn('Failed to load categories for navbar:', response.status);
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Categories loaded for navbar:', data.data);
            updateCollectionDropdown(data.data);
        } else {
            console.error('Error loading categories for navbar:', data.message);
        }
    } catch (error) {
        console.error('Error loading categories for navbar:', error);
        // Show fallback message if server is not available
        updateCollectionDropdown([]);
    }
}

// === Update collection dropdown menu ===
function updateCollectionDropdown(categories) {
    const desktopDropdown = document.getElementById('desktop-dropdown-menu');
    const mobileDropdown = document.getElementById('dropdown-menu');
    
    if (desktopDropdown) {
        if (categories.length === 0) {
            desktopDropdown.innerHTML = '<div class="px-4 py-3 text-gray-500 text-sm">No categories available</div>';
        } else {
            desktopDropdown.innerHTML = categories.map(category => 
                `<a href="categories.html?category=${encodeURIComponent(category.name)}" class="block px-4 py-3 text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors duration-200">${category.name}</a>`
            ).join('');
            
            // Remove border from last item
            const lastItem = desktopDropdown.lastElementChild;
            if (lastItem) {
                lastItem.classList.remove('border-b', 'border-gray-100');
            }
        }
    }
    
    if (mobileDropdown) {
        if (categories.length === 0) {
            mobileDropdown.innerHTML = '<div class="px-4 py-2 text-gray-500 text-sm">No categories available</div>';
        } else {
            mobileDropdown.innerHTML = categories.map(category => 
                `<a href="categories.html?category=${encodeURIComponent(category.name)}" class="block py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200">${category.name}</a>`
            ).join('');
        }
    }
}

// === Mobile menu toggle ===
function toggleMobileMenu() {
  mobileMenu.classList.toggle('hidden');
}

// === Desktop Collection dropdown toggle ===
function toggleDesktopDropdown(event) {
  event.stopPropagation();
  if (dropdownMenu.classList.contains('show')) {
    dropdownMenu.classList.remove('show');
  } else {
    dropdownMenu.classList.add('show');
  }
}

// === Close dropdown when clicking outside ===
function closeDesktopDropdown(event) {
  if (!dropdownBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
    dropdownMenu.classList.remove('show');
  }
}

// === Mobile dropdown toggle ===
function toggleMobileDropdown() {
  const mobileDropdown = document.getElementById('dropdown-menu');
  mobileDropdown.classList.toggle('hidden');
}

// === GLOBAL SEARCH OVERLAY ===
let searchOverlay = null;
let searchInput = null;
let searchResultsContainer = null;

function showSearchOverlay() {
  if (!searchOverlay) {
    searchOverlay = document.createElement('div');
    searchOverlay.id = 'global-search-overlay';
    searchOverlay.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-60 z-[9999] flex items-start justify-center p-4 overflow-y-auto">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mt-24 relative">
          <button id="close-search-overlay" class="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl font-bold">&times;</button>
          <div class="p-6 pb-2">
            <input id="search-overlay-input" type="text" placeholder="Search for products..." autofocus class="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <div id="search-overlay-results" class="p-6 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto"></div>
        </div>
      </div>
    `;
    document.body.appendChild(searchOverlay);
    searchInput = document.getElementById('search-overlay-input');
    searchResultsContainer = document.getElementById('search-overlay-results');
    document.getElementById('close-search-overlay').onclick = hideSearchOverlay;
    searchOverlay.addEventListener('click', (e) => {
      if (e.target === searchOverlay) hideSearchOverlay();
    });
    searchInput.addEventListener('input', handleGlobalSearchInput);
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideSearchOverlay(); });
    setTimeout(() => searchInput.focus(), 100);
  } else {
    searchOverlay.style.display = 'flex';
    setTimeout(() => searchInput.focus(), 100);
  }
}

function hideSearchOverlay() {
  if (searchOverlay) searchOverlay.style.display = 'none';
}

let searchTimeout;
async function handleGlobalSearchInput(e) {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();
  if (!query) {
    searchResultsContainer.innerHTML = '<div class="text-gray-400 text-center py-8">Type to search for products...</div>';
    return;
  }
  searchResultsContainer.innerHTML = '<div class="text-gray-400 text-center py-8">Searching...</div>';
  searchTimeout = setTimeout(async () => {
    try {
      const API_BASE = window.API_BASE || 'http://localhost:7000/api';
      const res = await fetch(`${API_BASE}/products?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        if (typeof window.createProductCard === 'function') {
          searchResultsContainer.innerHTML = data.data.map(window.createProductCard).join('');
        } else {
          // fallback: render a card with image, name, and price, all clickable
          searchResultsContainer.innerHTML = data.data.map(p => {
            const imageUrl = p.first_image ? `${API_BASE.replace('/api', '')}/uploads/${p.first_image}` : 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop';
            const hasDiscount = p.discount_price && parseFloat(p.discount_price) < parseFloat(p.price);
            const discount = hasDiscount ? Math.round(((parseFloat(p.price) - parseFloat(p.discount_price)) / parseFloat(p.price)) * 100) : 0;
            return `
              <div class="group cursor-pointer product-card transition-transform duration-300" style="min-width:220px;max-width:100%;" onclick="window.location.href='viewdetails.html?id=${p.id}'">
                <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                  <div class="relative overflow-hidden">
                    <img src="${imageUrl}" alt="${p.name}" class="w-full h-40 sm:h-48 md:h-56 lg:h-64 object-cover group-hover:scale-105 transition-transform duration-300">
                    ${discount > 0 ? `<div class='absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full'>-${discount}%</div>` : ''}
                  </div>
                  <div class="p-3 md:p-4">
                    <h3 class="font-medium text-gray-900 mb-1 sm:mb-2 text-sm md:text-base line-clamp-2">${p.name}</h3>
                    <div class="flex items-center space-x-2">
                      ${hasDiscount ? `<span class='text-gray-500 line-through text-xs'>EGP ${parseFloat(p.price).toFixed(2)}</span>` : ''}
                      <span class="text-base md:text-lg font-bold text-gray-900">EGP ${parseFloat(hasDiscount ? p.discount_price : p.price).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('');
        }
      } else {
        searchResultsContainer.innerHTML = '<div class="text-gray-400 text-center py-8">No products found.</div>';
      }
    } catch (err) {
      searchResultsContainer.innerHTML = '<div class="text-red-400 text-center py-8">Error searching products.</div>';
    }
  }, 400);
}

// Bind search icon in navbar
function bindGlobalSearchIcon() {
  const searchBtn = document.getElementById('navbar-search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', showSearchOverlay);
  }
}

// === Initialize navbar ===
function initializeNavbar() {
    console.log('Initializing navbar...');
    
    // Load categories when page loads
    loadCategoriesForNavbar();
    
    // Set up polling to refresh categories every 30 seconds
    setInterval(loadCategoriesForNavbar, 30000);
    
    // Also refresh when window gains focus (user comes back to tab)
    window.addEventListener('focus', () => {
        console.log('Window focused, refreshing categories...');
        loadCategoriesForNavbar();
    });
}

// === Bind events ===
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', toggleMobileMenu);
}

if (dropdownBtn) {
    dropdownBtn.addEventListener('click', toggleDesktopDropdown);
}

document.addEventListener('click', closeDesktopDropdown);

// Mobile dropdown button event listener
const mobileCollectionBtn = document.querySelector('#mobile-menu button');
if (mobileCollectionBtn) {
  mobileCollectionBtn.addEventListener('click', toggleMobileDropdown);
}

// === Initialize when DOM is loaded ===
document.addEventListener('DOMContentLoaded', initializeNavbar);
document.addEventListener('DOMContentLoaded', () => {
  bindGlobalSearchIcon();
});

// === Export functions for external use ===
window.navbarUtils = {
    loadCategoriesForNavbar,
    updateCollectionDropdown
};

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Expose createProductCard globally if available from index.js
if (window.createProductCard === undefined && window.navbarUtils === undefined) {
  window.createProductCard = undefined;
}


