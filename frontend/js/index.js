// === Dynamic Categories & Products Sections ===

document.addEventListener('DOMContentLoaded', async function() {
    // API Base URL
    const API_BASE = window.API_BASE || 'http://localhost:7000/api';

    // Helper: Create product card (updated with new styling)
    function createProductCard(product) {
        const discount = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price)
            ? Math.round(((parseFloat(product.price) - parseFloat(product.discount_price)) / parseFloat(product.price)) * 100)
            : 0;
        const imageUrl = product.first_image ?
            `${API_BASE.replace('/api', '')}/uploads/${product.first_image}` :
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop';
        
        return `
        <div class="product-card" style="min-width: 220px; max-width: 100%;" onclick="window.location.href='viewdetails.html?id=${product.id}'">
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
    }

    // Helper: Create section for a category (updated with new styling)
    function createCategorySection(category, products) {
        // Section title and description
        const sectionTitle = category.name + ' Collection';
        const sectionDesc = `Discover our latest ${category.name.toLowerCase()} pieces`;
        // Unique class for slider/controls
        const sliderClass = `slider-${category.id}`;
        const prevClass = `prev-${category.id}`;
        const nextClass = `next-${category.id}`;
        // Show only first 8 products
        const limitedProducts = products.slice(0, 8);
        // Build product cards
        const productCards = limitedProducts.map(createProductCard).join('');
        
        return `
        <section class="category-section ${category.id % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="section-header">
              <h2 class="section-title">${sectionTitle}</h2>
              <p class="section-description">${sectionDesc}</p>
            </div>
            
            <div class="flex justify-end">
              <a href="categories.html?category=${encodeURIComponent(category.name)}" class="view-all-link">
                View All ${category.name}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
            
            <div class="slider-container">
              <button class="slider-nav-btn prev-btn ${prevClass}" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div class="${sliderClass}-container overflow-hidden">
                <div class="products-slider ${sliderClass}">
                  ${productCards}
                </div>
              </div>
              
              <button class="slider-nav-btn next-btn ${nextClass}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </section>
        `;
    }

    // Main: Fetch categories, then products for each, then render
    async function loadCategoriesAndProducts() {
        try {
            const catRes = await fetch(`${API_BASE}/categories`);
            const catData = await catRes.json();
            if (!catData.success) throw new Error('Failed to load categories');
            const categories = catData.data;
            // Fetch products for each category in parallel
            const productsByCategory = await Promise.all(categories.map(async (cat) => {
                const prodRes = await fetch(`${API_BASE}/products?category=${encodeURIComponent(cat.name)}`);
                const prodData = await prodRes.json();
                return prodData.success ? prodData.data : [];
            }));
            // Build all sections
            let allSections = '';
            categories.forEach((cat, idx) => {
                allSections += createCategorySection(cat, productsByCategory[idx]);
            });
            // Insert after the hero section
            const heroSection = document.querySelector('section.min-h-screen');
            if (heroSection) {
                heroSection.insertAdjacentHTML('afterend', allSections);
            } else {
                main.insertAdjacentHTML('afterbegin', allSections);
            }
            // Initialize sliders for each section
            categories.forEach((cat) => {
                setupSlider(`slider-${cat.id}`, `prev-${cat.id}`, `next-${cat.id}`, cat.name);
            });
        } catch (err) {
            console.error('Error loading categories/products:', err);
        }
    }

    // Update slider logic to use actual card width and container width for precise scroll
    function setupSlider(sliderClass, prevClass, nextClass, categoryName) {
        const slider = document.querySelector(`.${sliderClass}`);
        const prev = document.querySelector(`.${prevClass}`);
        const next = document.querySelector(`.${nextClass}`);
        let currentIndex = 0;
        const items = slider ? slider.children : [];
        const totalItems = items.length;
        function getItemsPerView() {
            if (!slider) return 1;
            const container = slider.parentElement;
            if (!container) return 1;
            const containerWidth = container.offsetWidth;
            const cardWidth = items[0] ? items[0].offsetWidth : 220;
            return Math.max(1, Math.floor(containerWidth / cardWidth));
        }
        function updateSliderPosition() {
            if (!slider || !items.length) return 0;
            const container = slider.parentElement;
            const containerWidth = container.offsetWidth;
            const cardWidth = items[0] ? items[0].offsetWidth : 220;
            const itemsPerView = Math.max(1, Math.floor(containerWidth / cardWidth));
            // Calculate maxIndex so last card is always flush with the edge
            const maxIndex = Math.max(0, totalItems - itemsPerView);
            const clampedIndex = Math.min(Math.max(0, currentIndex), maxIndex);
            // Calculate translateX in px
            const translateX = -(clampedIndex * cardWidth);
            slider.style.transform = `translateX(${translateX}px)`;
            // Disable/enable prev/next buttons
            if (prev) {
                if (clampedIndex === 0) {
                    prev.disabled = true;
                    prev.classList.add('opacity-50', 'cursor-not-allowed');
                } else {
                    prev.disabled = false;
                    prev.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
            if (next) {
                if (clampedIndex === maxIndex) {
                    next.disabled = true;
                    next.classList.add('opacity-50', 'cursor-not-allowed');
                } else {
                    next.disabled = false;
                    next.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
            return clampedIndex;
        }
        if (prev && next && slider) {
            prev.addEventListener('click', () => {
                const container = slider.parentElement;
                const cardWidth = items[0] ? items[0].offsetWidth : 220;
                const itemsPerView = getItemsPerView();
                const maxIndex = Math.max(0, totalItems - itemsPerView);
                if (currentIndex > 0) {
                    currentIndex = Math.max(0, currentIndex - 1);
                    currentIndex = Math.min(currentIndex, maxIndex);
                    currentIndex = updateSliderPosition();
                }
            });
            next.addEventListener('click', () => {
                const container = slider.parentElement;
                const cardWidth = items[0] ? items[0].offsetWidth : 220;
                const itemsPerView = getItemsPerView();
                const maxIndex = Math.max(0, totalItems - itemsPerView);
                if (currentIndex < maxIndex) {
                    currentIndex = Math.min(currentIndex + 1, maxIndex);
                    currentIndex = updateSliderPosition();
                }
            });
        }
        window.addEventListener('resize', updateSliderPosition);
        updateSliderPosition();
    }

    // Run main
    await loadCategoriesAndProducts();

    // Remove the window resize re-render logic for cards
});

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

window.createProductCard = createProductCard;
