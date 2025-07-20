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

// === Export functions for external use ===
window.navbarUtils = {
    loadCategoriesForNavbar,
    updateCollectionDropdown
};


