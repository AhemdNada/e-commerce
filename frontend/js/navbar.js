// === Cache DOM elements ===
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const dropdownBtn = document.getElementById('desktop-collection-btn');
const dropdownMenu = document.getElementById('desktop-dropdown-menu');

// === API Base URL ===
// Now loaded from config.js - fallback for backward compatibility
window.API_BASE = window.API_BASE || 'http://localhost:7000/api';

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
    searchOverlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 999999 !important; display: flex; flex-direction: column;';
    searchOverlay.innerHTML = `
      <div class="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-60 z-[9999] flex flex-col" style="top: 80px;">
        <div class="bg-white w-full h-full flex flex-col">
          <div class="p-4 border-b border-gray-200">
            <div class="flex items-center justify-between mb-3">
              <input id="search-overlay-input" type="text" placeholder="Search for products..." autofocus class="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-black mr-4" />
              <button id="close-search-overlay" class="text-gray-500 hover:text-black text-2xl font-bold">&times;</button>
            </div>
            <div id="search-keywords" class="flex flex-wrap gap-2">
              <button class="keyword-btn px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors duration-200" data-keyword="headphone">🎧 Headphone</button>
              <button class="keyword-btn px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors duration-200" data-keyword="watch">⌚ Watch</button>
              <button class="keyword-btn px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors duration-200" data-keyword="accessories">🔧 Accessories</button>
              <button class="keyword-btn px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors duration-200" data-keyword="wireless">📶 Wireless</button>
            </div>
          </div>
          <div id="search-overlay-results" class="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto"></div>
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
    
    // Add keyword buttons functionality
    const keywordBtns = searchOverlay.querySelectorAll('.keyword-btn');
    keywordBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const keyword = btn.getAttribute('data-keyword');
        searchInput.value = keyword;
        handleGlobalSearchInput({ target: { value: keyword } });
        
        // Highlight the clicked button
        keywordBtns.forEach(b => b.classList.remove('bg-blue-500', 'text-white'));
        btn.classList.add('bg-blue-500', 'text-white');
      });
    });
    
    setTimeout(() => searchInput.focus(), 100);
  } else {
    searchOverlay.style.display = 'flex';
    
    // Reset keyword buttons state
    const keywordBtns = searchOverlay.querySelectorAll('.keyword-btn');
    keywordBtns.forEach(btn => {
      btn.classList.remove('bg-blue-500', 'text-white');
      btn.classList.add('bg-gray-100', 'text-gray-700');
    });
    
    // Clear search input and results
    searchInput.value = '';
    searchResultsContainer.innerHTML = '<div class="text-gray-400 text-center py-8">Type to search for products or click a keyword...</div>';
    
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
    searchResultsContainer.innerHTML = '<div class="text-gray-400 text-center py-8">Type to search for products or click a keyword...</div>';
    return;
  }
  searchResultsContainer.innerHTML = '<div class="text-gray-400 text-center py-8">Searching...</div>';
  searchTimeout = setTimeout(async () => {
    try {
              const API_BASE = window.API_BASE;
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
  const searchBtns = document.querySelectorAll('#navbar-search-btn');
  searchBtns.forEach(searchBtn => {
    if (searchBtn) {
      searchBtn.addEventListener('click', showSearchOverlay);
    }
  });
}

// === Initialize navbar ===
function initializeNavbar() {
    console.log('Initializing navbar...');
    
    // Check authentication state
    checkAuthState();
    
    // Load categories when page loads
    loadCategoriesForNavbar();
    
    // Set up polling to refresh categories every 30 seconds
    setInterval(loadCategoriesForNavbar, 30000);
    
    // Also refresh when window gains focus (user comes back to tab)
    window.addEventListener('focus', () => {
        console.log('Window focused, refreshing categories...');
        loadCategoriesForNavbar();
        checkAuthState(); // Also check auth state when window gains focus
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
    updateCollectionDropdown,
    checkAuthState,
    updateAuthIcons,
    handleLogout
};

// === Authentication State Management ===
function checkAuthState() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    // User is logged in - show logout icon
    updateAuthIcons('logout');
  } else {
    // User is not logged in - show login icon
    updateAuthIcons('login');
  }
}

function updateAuthIcons(state) {
  const desktopIcon = document.getElementById('auth-icon-desktop-i');
  const mobileIcon = document.getElementById('auth-icon-mobile-i');
  const desktopLink = document.getElementById('auth-icon-desktop');
  const mobileLink = document.getElementById('auth-icon-mobile');
  
  if (state === 'logout') {
    // Show logout icon
    if (desktopIcon) desktopIcon.className = 'fa-solid fa-arrow-right-from-bracket w-5 h-5';
    if (mobileIcon) mobileIcon.className = 'fa-solid fa-arrow-right-from-bracket w-6 h-6';
    
    // Remove href and add click handler for logout
    if (desktopLink) {
      desktopLink.removeAttribute('href');
      desktopLink.onclick = handleLogout;
    }
    if (mobileLink) {
      mobileLink.removeAttribute('href');
      mobileLink.onclick = handleLogout;
    }
  } else {
    // Show login icon
    if (desktopIcon) desktopIcon.className = 'fa-solid fa-user w-5 h-5';
    if (mobileIcon) mobileIcon.className = 'fa-solid fa-user w-6 h-6';
    
    // Add href back and remove click handler
    if (desktopLink) {
      desktopLink.href = 'login.html';
      desktopLink.onclick = null;
    }
    if (mobileLink) {
      mobileLink.href = 'login.html';
      mobileLink.onclick = null;
    }
  }
}

function handleLogout(e) {
  e.preventDefault();
  
  // Remove auth data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Update icons immediately without page refresh
  updateAuthIcons('login');
  
  // Show success message (optional)
  showLogoutMessage();
}

function showLogoutMessage() {
  // Create a temporary success message
  const message = document.createElement('div');
  message.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
  message.textContent = 'Logged out successfully';
  document.body.appendChild(message);
  
  // Remove message after 3 seconds
  setTimeout(() => {
    message.style.opacity = '0';
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 300);
  }, 3000);
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Expose createProductCard globally if available from index.js
if (window.createProductCard === undefined && window.navbarUtils === undefined) {
  window.createProductCard = undefined;
}

// === Highlight active nav link ===
function setActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('.nav-underline-animate');
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') && link.getAttribute('href').split('/').pop() === currentPage) {
      link.classList.add('active');
    }
    if ((currentPage === '' || currentPage === 'index.html') && link.getAttribute('href') === 'index.html') {
      link.classList.add('active');
    }
  });

  // لو الصفحة هي categories.html أو يوجد باراميتر category
  if (
    currentPage === 'categories.html' ||
    new URLSearchParams(window.location.search).has('category')
  ) {
    // زر Collection في الديسكتوب
    const collectionBtn = document.getElementById('desktop-collection-btn');
    if (collectionBtn) collectionBtn.classList.add('active');
    // زر Collection في الموبايل
    const mobileCollectionBtn = document.querySelector('#mobile-menu button');
    if (mobileCollectionBtn) mobileCollectionBtn.classList.add('active');
  }
}
document.addEventListener('DOMContentLoaded', setActiveNavLink);

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a.nav-underline-animate').forEach(link => {
    if (link.getAttribute('href') && link.getAttribute('href').includes('#reviews')) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        // لو أنت بالفعل في index.html
        if (
          window.location.pathname.endsWith('index.html') ||
          window.location.pathname === '/' ||
          window.location.pathname === ''
        ) {
          const reviewsSection = document.getElementById('reviews');
          if (reviewsSection) {
            reviewsSection.scrollIntoView({ behavior: 'smooth' });
          }
          // حدث الـ hash في الـ URL بدون reload
          history.replaceState(null, '', '#reviews');
        } else {
          // لو في صفحة تانية، حول عادي
          window.location.href = 'index.html#reviews';
        }
      });
    }
  });

  // عند تحميل الصفحة، لو في #reviews في الـ URL، نفذ smooth scroll تلقائيًا
  if (window.location.hash === '#reviews') {
    setTimeout(() => {
      const reviewsSection = document.getElementById('reviews');
      if (reviewsSection) {
        reviewsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  // مراقبة ظهور واختفاء section reviews
  const reviewsSection = document.getElementById('reviews');
  const reviewsNavLinks = Array.from(document.querySelectorAll('a.nav-underline-animate')).filter(link =>
    link.getAttribute('href') && link.getAttribute('href').includes('#reviews')
  );

  if (reviewsSection && reviewsNavLinks.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          reviewsNavLinks.forEach(link => {
            if (entry.isIntersecting) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        });
      },
      {
        root: null,
        threshold: 0.3 // يظهر الخط إذا كان 30% من section ظاهر
      }
    );
    observer.observe(reviewsSection);
  }
});


