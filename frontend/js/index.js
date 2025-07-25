// === Dynamic Categories & Products Sections ===

document.addEventListener('DOMContentLoaded', async function() {
    // API Base URL
    const API_BASE = window.API_BASE || 'http://localhost:7000/api';

    // Remove dynamic width helper and restore original card style
    // Helper: Create product card (copied/adapted from categories.html)
    function createProductCard(product) {
        const discount = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price)
            ? Math.round(((parseFloat(product.price) - parseFloat(product.discount_price)) / parseFloat(product.price)) * 100)
            : 0;
        const imageUrl = product.first_image ?
            `${API_BASE.replace('/api', '')}/uploads/${product.first_image}` :
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop';
        // Restore original min-width style
        return `
        <div class="group cursor-pointer product-card transition-transform duration-300" style="min-width:220px;max-width:100%;" onclick="window.location.href='viewdetails.html?id=${product.id}'">
          <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
             <div class="relative overflow-hidden">
              <img src="${imageUrl}" alt="${product.name}" class="w-full h-40 sm:h-48 md:h-56 lg:h-64 object-cover group-hover:scale-105 transition-transform duration-300">
               ${discount > 0 ? `<div class="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">-${discount}%</div>` : ''}
             </div>
             <div class="p-3 md:p-4">
               <h3 class="font-medium text-gray-900 mb-1 sm:mb-2 text-sm md:text-base line-clamp-2">${product.name}</h3>
               <div class="flex items-center space-x-2">
                ${product.discount_price ? `<span class="text-gray-500 line-through text-xs">EGP ${parseFloat(product.price).toFixed(2)}</span>` : ''}
                <span class="text-base md:text-lg font-bold text-gray-900">EGP ${parseFloat(product.discount_price ? product.discount_price : product.price).toFixed(2)}</span>
               </div>
              <p class="text-xs text-gray-500 mt-1">${product.category_name}</p>
             </div>
           </div>
         </div>
       `;
    }

    // Helper: Create section for a category
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
        // Dynamic link to full collection (small, no bg, underline on hover)
        const collectionLink = `<a href="categories.html?category=${encodeURIComponent(category.name)}" class="inline-block text-xs md:text-sm font-semibold text-gray-700 hover:text-black hover:underline hover:underline-offset-4 hover:decoration-2 hover:decoration-black transition-colors duration-200" style="margin-bottom: 1rem;">View All ${category.name}</a>`;
        // Section HTML
        return `
        <section class="py-16 ${category.id % 2 === 0 ? 'bg-gray-50' : 'bg-white'}">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
              <h2 class="text-3xl font-bold text-gray-900 mb-4">${sectionTitle}</h2>
              <p class="text-gray-600 max-w-2xl mx-auto">${sectionDesc}</p>
            </div>
            <div class="flex justify-end items-center mb-4">
              ${collectionLink}
            </div>
            <div class="relative">
              <button class="${prevClass} absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 opacity-50 cursor-not-allowed" disabled>
                <svg class="w-6 h-6 text-gray-600 hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <button class="${nextClass} absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300" >
                <svg class="w-6 h-6 text-gray-600 hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
              <div class="${sliderClass}-container overflow-hidden">
                <div class="${sliderClass} flex gap-6 transition-transform duration-500 ease-in-out">
                  ${productCards}
                </div>
              </div>
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
