// API Base URL
const API_BASE_URL = 'http://localhost:7000/api';

// Global variables
let currentProduct = null;
let selectedColor = null;
let selectedSize = null;
let currentQuantity = 1;
let currentImageIndex = 0;
let displayedImages = []; // <--- أضف هذا المتغير

// DOM elements
const mainImage = document.getElementById('main-image');
const thumbnailGallery = document.querySelector('.grid.grid-cols-5.gap-3');
const productTitle = document.querySelector('h1.text-3xl');
const productDescription = document.querySelector('.text-gray-700.leading-relaxed');
const sizeButtons = document.querySelector('.grid.grid-cols-4.gap-3');
const colorButtons = document.querySelector('.flex.space-x-3');
const quantityDisplay = document.querySelector('.px-4.py-2.text-gray-900.font-medium');
const addToCartButton = document.querySelector('button.bg-black.text-white');
const breadcrumbCategory = document.querySelector('ol li:nth-child(3) a');
const breadcrumbProduct = document.querySelector('ol li:nth-child(5)');
const productPrice = document.getElementById('product-price');
const productMeta = document.getElementById('product-meta');
const imageLoading = document.getElementById('image-loading');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadProductDetails();
    setupEventListeners();
});

// Load product details from URL parameter
async function loadProductDetails() {
    try {
        // Show loading state
        showLoadingState();
        
        // Get product ID from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        
        if (!productId) {
            showError('Product ID not found in URL');
            hideLoadingState();
            return;
        }

        // Fetch product details from API
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        const result = await response.json();

        if (!result.success) {
            showError('Failed to load product details');
            hideLoadingState();
            return;
        }

        currentProduct = result.data;
        displayProductDetails();
        hideLoadingState();
        // Record product view for analytics
        try {
            const source = urlParams.get('source');
            await fetch(`${API_BASE_URL}/products/${productId}/view${source ? `?source=${encodeURIComponent(source)}` : ''}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
        } catch (err) {
            // Ignore analytics errors
        }
        
    } catch (error) {
        console.error('Error loading product details:', error);
        showError('Error loading product details');
        hideLoadingState();
    }
}

// Display product details in the UI
function displayProductDetails() {
    if (!currentProduct) return;

    // Update breadcrumb
    if (breadcrumbCategory) {
        breadcrumbCategory.textContent = currentProduct.category_name;
        breadcrumbCategory.href = `categories.html?category=${currentProduct.category_name}`;
    }
    if (breadcrumbProduct) {
        breadcrumbProduct.textContent = currentProduct.name;
    }

    // Update product title
    if (productTitle) {
        productTitle.textContent = currentProduct.name;
    }

    // Update product description
    if (productDescription) {
        productDescription.textContent = currentProduct.description || 'No description available.';
    }

    // Display price
    displayProductPrice();

    // Display product meta info
    displayProductMeta();

    // Display images
    displayProductImages();

    // Display sizes
    displayProductSizes();

    // Display colors
    displayProductColors();

    // Update page title
    document.title = `${currentProduct.name} - AUSAR`;
}

// Display product images
function displayProductImages() {
    if (!currentProduct.colors || currentProduct.colors.length === 0) {
        // No images available, show placeholder
        if (mainImage) {
            mainImage.src = 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=700&fit=crop';
            mainImage.alt = currentProduct.name;
        }
        displayedImages = [];
        return;
    }

    // Get all images from all colors
    const allImages = [];
    currentProduct.colors.forEach(color => {
        if (color.images) {
            const images = color.images.split(',');
            images.forEach(image => {
                allImages.push({
                    path: image,
                    color: color
                });
            });
        }
    });

    if (allImages.length === 0) {
        // No images available, show placeholder
        if (mainImage) {
            mainImage.src = 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=700&fit=crop';
            mainImage.alt = currentProduct.name;
        }
        displayedImages = [];
        return;
    }

    // Display main image
    if (mainImage) {
        mainImage.src = `${API_BASE_URL.replace('/api', '')}/uploads/${allImages[0].path}`;
        mainImage.alt = currentProduct.name;
    }

    // Display thumbnail gallery
    if (thumbnailGallery) {
        thumbnailGallery.innerHTML = '';
        displayedImages = allImages.map(img => img.path); // <--- تحديث displayedImages
        allImages.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'relative cursor-pointer group';
            thumbnail.onclick = () => changeMainImage(index);
            
            thumbnail.innerHTML = `
                <img src="${API_BASE_URL.replace('/api', '')}/uploads/${image.path}" 
                     alt="${currentProduct.name}" 
                     class="w-full h-20 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors">
                ${index === 0 ? '<div class="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg"></div>' : ''}
            `;
            
            thumbnailGallery.appendChild(thumbnail);
        });
    }
}

// Change main image
function changeMainImage(index) {
    if (!displayedImages || displayedImages.length === 0) return;
    if (displayedImages[index]) {
        mainImage.src = `${API_BASE_URL.replace('/api', '')}/uploads/${displayedImages[index]}`;
        currentImageIndex = index;
        
        // Update thumbnail selection
        const thumbnails = thumbnailGallery.querySelectorAll('div');
        thumbnails.forEach((thumb, i) => {
            const overlay = thumb.querySelector('div');
            if (i === index) {
                if (!overlay) {
                    const newOverlay = document.createElement('div');
                    newOverlay.className = 'absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg';
                    thumb.appendChild(newOverlay);
                }
            } else {
                if (overlay) {
                    overlay.remove();
                }
            }
        });
    }
}

// Display product sizes
function displayProductSizes() {
    if (!sizeButtons || !currentProduct.sizes) return;

    sizeButtons.innerHTML = '';
    
    currentProduct.sizes.forEach(size => {
        const sizeButton = document.createElement('button');
        sizeButton.className = 'size-btn px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-colors';
        sizeButton.textContent = size.size_value;
        sizeButton.onclick = () => selectSize(size);
        
        // Add stock indicator
        if (size.stock_quantity <= 0) {
            sizeButton.classList.add('opacity-50', 'cursor-not-allowed');
            sizeButton.disabled = true;
        }
        
        sizeButtons.appendChild(sizeButton);
    });
}

// Select size
function selectSize(size) {
    if (size.stock_quantity <= 0) return;
    
    selectedSize = size;
    
    // Update UI
    const sizeBtns = sizeButtons.querySelectorAll('.size-btn');
    sizeBtns.forEach(btn => {
        btn.classList.remove('border-blue-500', 'text-blue-600', 'bg-blue-50');
        btn.classList.add('border-gray-300', 'text-gray-700');
    });
    
    event.target.classList.remove('border-gray-300', 'text-gray-700');
    event.target.classList.add('border-blue-500', 'text-blue-600', 'bg-blue-50');
    
    updateAddToCartButton();
}

// Display product price
function displayProductPrice() {
    if (!productPrice || !currentProduct) return;

    const price = parseFloat(currentProduct.price);
    const discountPrice = currentProduct.discount_price ? parseFloat(currentProduct.discount_price) : null;
    
    productPrice.innerHTML = '';
    
    if (discountPrice) {
        // Show original price with discount
        productPrice.innerHTML = `
            <span class="text-3xl font-bold text-gray-900">EGP ${discountPrice.toFixed(2)}</span>
            <span class="text-xl text-gray-500 line-through">EGP ${price.toFixed(2)}</span>
            <span class="bg-red-100 text-red-800 text-sm font-medium px-2 py-1 rounded">
                ${Math.round(((price - discountPrice) / price) * 100)}% OFF
            </span>
        `;
    } else {
        // Show regular price
        productPrice.innerHTML = `
            <span class="text-3xl font-bold text-gray-900">EGP ${price.toFixed(2)}</span>
        `;
    }
}

// Display product meta info
function displayProductMeta() {
    if (!productMeta || !currentProduct) return;

    productMeta.innerHTML = `
        <span class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            ${currentProduct.gender}
        </span>
        <span class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
            ${currentProduct.category_name}
        </span>
        <span class="flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Added ${new Date(currentProduct.created_at).toLocaleDateString()}
        </span>
    `;
}

// Display product colors
function displayProductColors() {
    if (!colorButtons || !currentProduct.colors) return;

    colorButtons.innerHTML = '';
    
    currentProduct.colors.forEach(color => {
        const colorButton = document.createElement('button');
        colorButton.className = 'color-btn w-10 h-10 rounded-full border-2 border-gray-200 hover:border-blue-500 transition-colors';
        colorButton.setAttribute('data-color', color.name.toLowerCase());
        colorButton.onclick = () => selectColor(color);
        
        // Set background color
        if (color.hex_code) {
            colorButton.style.backgroundColor = color.hex_code;
        } else {
            // Fallback colors based on name
            const colorMap = {
                'red': '#FF0000',
                'blue': '#0000FF',
                'green': '#00FF00',
                'black': '#000000',
                'white': '#FFFFFF',
                'yellow': '#FFFF00',
                'gray': '#808080',
                'pink': '#FFC0CB'
            };
            colorButton.style.backgroundColor = colorMap[color.name.toLowerCase()] || '#CCCCCC';
        }
        
        colorButtons.appendChild(colorButton);
    });
}

// Select color
function selectColor(color) {
    selectedColor = color;
    
    // Update UI
    const colorBtns = colorButtons.querySelectorAll('.color-btn');
    colorBtns.forEach(btn => {
        btn.classList.remove('border-blue-500');
        btn.classList.add('border-gray-200');
    });
    
    event.target.classList.remove('border-gray-200');
    event.target.classList.add('border-blue-500');
    
    // Update images for selected color
    if (color.images) {
        const images = color.images.split(',');
        if (images.length > 0) {
            mainImage.src = `${API_BASE_URL.replace('/api', '')}/uploads/${images[0]}`;
            currentImageIndex = 0;
            updateThumbnailGallery(images);
        }
    }
    
    updateAddToCartButton();
}

// Update thumbnail gallery for selected color
function updateThumbnailGallery(images) {
    if (!thumbnailGallery) return;
    
    thumbnailGallery.innerHTML = '';
    displayedImages = images; // <--- تحديث displayedImages عند تغيير اللون
    images.forEach((image, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'relative cursor-pointer group';
        thumbnail.onclick = () => changeMainImage(index);
        
        thumbnail.innerHTML = `
            <img src="${API_BASE_URL.replace('/api', '')}/uploads/${image}" 
                 alt="${currentProduct.name}" 
                 class="w-full h-20 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors">
            ${index === 0 ? '<div class="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg"></div>' : ''}
        `;
        
        thumbnailGallery.appendChild(thumbnail);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Quantity buttons
    const quantityBtns = document.querySelectorAll('.quantity-btn');
    quantityBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.textContent === '-') {
                if (currentQuantity > 1) {
                    currentQuantity--;
                }
            } else {
                currentQuantity++;
            }
            
            if (quantityDisplay) {
                quantityDisplay.textContent = currentQuantity;
            }
            
            updateAddToCartButton();
        });
    });

    // Add to cart button
    if (addToCartButton) {
        addToCartButton.addEventListener('click', addToCart);
    }
}

// Update add to cart button state
function updateAddToCartButton() {
    if (!addToCartButton) return;
    
    const canAddToCart = selectedSize && selectedColor && currentQuantity > 0;
    
    if (canAddToCart) {
        addToCartButton.disabled = false;
        addToCartButton.classList.remove('opacity-50', 'cursor-not-allowed');
        addToCartButton.classList.add('hover:bg-gray-800', 'transform', 'hover:scale-105');
    } else {
        addToCartButton.disabled = true;
        addToCartButton.classList.add('opacity-50', 'cursor-not-allowed');
        addToCartButton.classList.remove('hover:bg-gray-800', 'transform', 'hover:scale-105');
    }
}

// Add to cart functionality
function addToCart() {
    if (!selectedSize || !selectedColor || currentQuantity <= 0) {
        showMessage('Please select size and color', 'error');
        return;
    }

    // Check stock availability
    if (selectedSize.stock_quantity < currentQuantity) {
        showMessage(`Only ${selectedSize.stock_quantity} items available in stock`, 'error');
        return;
    }

    // Create cart item
    const cartItem = {
        productId: currentProduct.id,
        productName: currentProduct.name,
        size: selectedSize.size_value,
        color: selectedColor.name,
        quantity: currentQuantity,
        price: currentProduct.discount_price || currentProduct.price,
        image: currentProduct.colors.find(c => c.name === selectedColor.name)?.images?.split(',')[0] || null,
        availableColors: currentProduct.colors.map(c => ({
            name: c.name,
            hex_code: c.hex_code || null,
            image: c.images ? c.images.split(',')[0] : null
        }))
    };

    // Get existing cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => 
        item.productId === cartItem.productId && 
        item.size === cartItem.size && 
        item.color === cartItem.color
    );

    if (existingItemIndex !== -1) {
        // Update existing item quantity
        cart[existingItemIndex].quantity += cartItem.quantity;
    } else {
        // Add new item
        cart.push(cartItem);
    }

    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Dispatch cart-updated event for badge update
    document.dispatchEvent(new Event('cart-updated'));
    if (typeof updateCartBadge === 'function') updateCartBadge();

    showMessage('Item added to cart successfully!', 'success');
}

// Update cart icon with item count
function updateCartIcon() {
    // Removed cart badge functionality as requested
    // Cart items are still stored in localStorage but no visual badge is shown
}

// Show message
function showMessage(message, type = 'info') {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
    
    // Set message type styles
    switch (type) {
        case 'success':
            messageDiv.classList.add('bg-green-500', 'text-white');
            break;
        case 'error':
            messageDiv.classList.add('bg-red-500', 'text-white');
            break;
        case 'warning':
            messageDiv.classList.add('bg-yellow-500', 'text-black');
            break;
        default:
            messageDiv.classList.add('bg-blue-500', 'text-white');
    }
    
    messageDiv.textContent = message;
    
    // Add to page
    document.body.appendChild(messageDiv);
    
    // Animate in
    setTimeout(() => {
        messageDiv.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.classList.add('translate-x-full');
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.parentElement.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// Show loading state
function showLoadingState() {
    if (imageLoading) {
        imageLoading.classList.remove('hidden');
    }
    if (productTitle) {
        productTitle.textContent = 'Loading...';
    }
    if (productDescription) {
        productDescription.textContent = 'Loading product details...';
    }
}

// Hide loading state
function hideLoadingState() {
    if (imageLoading) {
        imageLoading.classList.add('hidden');
    }
}

// Show error
function showError(message) {
    showMessage(message, 'error');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Initialize cart icon on page load
document.addEventListener('DOMContentLoaded', function() {
    // Cart badge functionality removed as requested
}); 