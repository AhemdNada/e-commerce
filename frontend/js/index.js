// === Dynamic Categories & Products Sections ===

document.addEventListener('DOMContentLoaded', async function() {
    // API Base URL
    const API_BASE = window.API_BASE || 'http://localhost:7000/api';

    // Helper: Create product card (copied/adapted from categories.html)
    function createProductCard(product) {
        const discount = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price)
            ? Math.round(((parseFloat(product.price) - parseFloat(product.discount_price)) / parseFloat(product.price)) * 100)
            : 0;
        const imageUrl = product.first_image ?
            `${API_BASE.replace('/api', '')}/uploads/${product.first_image}` :
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop';
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
                ${product.discount_price ? `<span class="text-gray-500 line-through text-xs">$${parseFloat(product.price).toFixed(2)}</span>` : ''}
                <span class="text-base md:text-lg font-bold text-gray-900">$${parseFloat(product.discount_price ? product.discount_price : product.price).toFixed(2)}</span>
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
              <button class="${prevClass} absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300">
                <svg class="w-6 h-6 text-gray-600 hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              </button>
              <button class="${nextClass} absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300">
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

    // Slider logic (same as existing, but dynamic)
    function setupSlider(sliderClass, prevClass, nextClass, categoryName) {
        const slider = document.querySelector(`.${sliderClass}`);
        const prev = document.querySelector(`.${prevClass}`);
        const next = document.querySelector(`.${nextClass}`);
        let currentIndex = 0;
        const items = slider ? slider.children : [];
        const totalItems = items.length;
        function getItemsPerView() {
            if (window.innerWidth < 640) return 1; // موبايل
            if (window.innerWidth < 1024) return 2; // تابلت
            return 5; // ديسكتوب
        }
        function updateSliderPosition() {
            const itemsPerView = getItemsPerView();
            // السلايدر يقف عند المنتج الثامن فقط
            const maxIndex = totalItems <= itemsPerView ? 0 : Math.max(0, totalItems - itemsPerView);
            const clampedIndex = Math.min(Math.max(0, currentIndex), maxIndex);
            const translateX = -(clampedIndex * (100 / itemsPerView));
            if (slider) slider.style.transform = `translateX(${translateX}%)`;
            return clampedIndex;
        }
        if (prev && next && slider) {
            prev.addEventListener('click', () => {
                currentIndex = Math.max(0, currentIndex - 1);
                currentIndex = updateSliderPosition();
            });
            next.addEventListener('click', () => {
                const itemsPerView = getItemsPerView();
                const maxIndex = totalItems <= itemsPerView ? 0 : Math.max(0, totalItems - itemsPerView);
                currentIndex = Math.min(currentIndex + 1, maxIndex);
                currentIndex = updateSliderPosition();
            });
        }
        window.addEventListener('resize', updateSliderPosition);
        updateSliderPosition();
    }

    // Run main
    await loadCategoriesAndProducts();
});

// Product Slider Navigation
document.addEventListener('DOMContentLoaded', function() {
    // Clothing Slider
    const clothingSlider = document.querySelector('.clothing-slider');
    const clothingPrev = document.querySelector('.clothing-prev');
    const clothingNext = document.querySelector('.clothing-next');
    let clothingCurrentIndex = 0;
    const clothingItems = document.querySelectorAll('.clothing-slider > div');
    const clothingTotalItems = clothingItems.length;

    // Shoes Slider
    const shoesSlider = document.querySelector('.shoes-slider');
    const shoesPrev = document.querySelector('.shoes-prev');
    const shoesNext = document.querySelector('.shoes-next');
    let shoesCurrentIndex = 0;
    const shoesItems = document.querySelectorAll('.shoes-slider > div');
    const shoesTotalItems = shoesItems.length;

    // Accessories Slider
    const accessoriesSlider = document.querySelector('.accessories-slider');
    const accessoriesPrev = document.querySelector('.accessories-prev');
    const accessoriesNext = document.querySelector('.accessories-next');
    let accessoriesCurrentIndex = 0;
    const accessoriesItems = document.querySelectorAll('.accessories-slider > div');
    const accessoriesTotalItems = accessoriesItems.length;

    // Function to get items per view based on screen size
    function getItemsPerView() {
        if (window.innerWidth < 640) return 1; // Mobile: 1 item
        if (window.innerWidth < 1024) return 2; // Tablet: 2 items
        return 5; // Desktop: 5 items
    }

    // Function to update slider position
    function updateSliderPosition(slider, currentIndex, totalItems) {
        const itemsPerView = getItemsPerView();
        const maxIndex = Math.max(0, totalItems - itemsPerView);
        const clampedIndex = Math.min(Math.max(0, currentIndex), maxIndex);
        
        const translateX = -(clampedIndex * (100 / itemsPerView));
        slider.style.transform = `translateX(${translateX}%)`;
        
        return clampedIndex;
    }

    // Clothing Slider Controls
    if (clothingPrev && clothingNext && clothingSlider) {
        clothingPrev.addEventListener('click', () => {
            clothingCurrentIndex = Math.max(0, clothingCurrentIndex - 1);
            clothingCurrentIndex = updateSliderPosition(clothingSlider, clothingCurrentIndex, clothingTotalItems);
        });

        clothingNext.addEventListener('click', () => {
            clothingCurrentIndex = Math.min(clothingCurrentIndex + 1, clothingTotalItems - getItemsPerView());
            clothingCurrentIndex = updateSliderPosition(clothingSlider, clothingCurrentIndex, clothingTotalItems);
        });
    }

    // Shoes Slider Controls
    if (shoesPrev && shoesNext && shoesSlider) {
        shoesPrev.addEventListener('click', () => {
            shoesCurrentIndex = Math.max(0, shoesCurrentIndex - 1);
            shoesCurrentIndex = updateSliderPosition(shoesSlider, shoesCurrentIndex, shoesTotalItems);
        });

        shoesNext.addEventListener('click', () => {
            shoesCurrentIndex = Math.min(shoesCurrentIndex + 1, shoesTotalItems - getItemsPerView());
            shoesCurrentIndex = updateSliderPosition(shoesSlider, shoesCurrentIndex, shoesTotalItems);
        });
    }

    // Accessories Slider Controls
    if (accessoriesPrev && accessoriesNext && accessoriesSlider) {
        accessoriesPrev.addEventListener('click', () => {
            accessoriesCurrentIndex = Math.max(0, accessoriesCurrentIndex - 1);
            accessoriesCurrentIndex = updateSliderPosition(accessoriesSlider, accessoriesCurrentIndex, accessoriesTotalItems);
        });

        accessoriesNext.addEventListener('click', () => {
            accessoriesCurrentIndex = Math.min(accessoriesCurrentIndex + 1, accessoriesTotalItems - getItemsPerView());
            accessoriesCurrentIndex = updateSliderPosition(accessoriesSlider, accessoriesCurrentIndex, accessoriesTotalItems);
        });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        
        if (clothingSlider) {
            clothingCurrentIndex = updateSliderPosition(clothingSlider, clothingCurrentIndex, clothingTotalItems);
        }
        if (shoesSlider) {
            shoesCurrentIndex = updateSliderPosition(shoesSlider, shoesCurrentIndex, shoesTotalItems);
        }
        if (accessoriesSlider) {
            accessoriesCurrentIndex = updateSliderPosition(accessoriesSlider, accessoriesCurrentIndex, accessoriesTotalItems);
        }
    });

    // Initialize sliders
    if (clothingSlider) {
        updateSliderPosition(clothingSlider, clothingCurrentIndex, clothingTotalItems);
    }
    if (shoesSlider) {
        updateSliderPosition(shoesSlider, shoesCurrentIndex, shoesTotalItems);
    }
    if (accessoriesSlider) {
        updateSliderPosition(accessoriesSlider, accessoriesCurrentIndex, accessoriesTotalItems);
    }
});

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}
