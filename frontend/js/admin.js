// admin.js - Clean, modular, production-ready admin panel logic

// ========== GLOBALS & CONSTANTS ==========
const API_BASE = 'http://localhost:7000/api';
let currentTab = 'categories';
let categories = [];
let products = [];
let filteredProducts = []; // New variable for filtered products
let colors = [];
let paymentMethods = {};
let orders = [];
let filteredCategories = []; // متغير جديد للنتائج المفلترة

// ========== SIDEBAR & TAB LOGIC ==========
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}
function closeSidebarOnMobile() {
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.add('-translate-x-full');
        document.getElementById('sidebar-overlay').classList.add('hidden');
    }
}
window.addEventListener('resize', function() {
    if (window.innerWidth >= 768) {
        document.getElementById('sidebar').classList.remove('-translate-x-full');
        document.getElementById('sidebar-overlay').classList.add('hidden');
    } else {
        document.getElementById('sidebar').classList.add('-translate-x-full');
    }
});

function showTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    const tabEl = document.getElementById(`${tabName}-tab`);
    if (tabEl) tabEl.classList.remove('hidden');
    // Update page title
    const titles = {
        categories: 'Categories',
        products: 'Products',
        colors: 'Colors',
        cartSettings: 'Cart Settings',
        orders: 'Orders'
    };
    document.getElementById('page-title').textContent = titles[tabName] || 'Categories';
    // Load data for the tab
    if (tabName === 'categories') loadCategories();
    else if (tabName === 'products') {
        loadProducts();
        loadCategoriesForFilter(); // Load categories for filter dropdown
    }
    else if (tabName === 'colors') loadColors();
    else if (tabName === 'cart-settings') loadPaymentMethods();
    else if (tabName === 'orders') loadOrders();
}
window.showTab = showTab; // For sidebar/tab links

// ========== DOMContentLoaded: INIT ==========
document.addEventListener('DOMContentLoaded', function() {
    // Default tab
    showTab('categories');
    // Sidebar toggle
    document.getElementById('sidebar-toggle').onclick = toggleSidebar;
    document.getElementById('sidebar-overlay').onclick = toggleSidebar;
    // Tab links handled by showTab via global
    // Event listeners for forms/buttons
    setupEventListeners();
     // Add this line to check authentication on page load
    // إضافة event للبحث
    const searchInput = document.getElementById('categories-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const value = e.target.value.trim().toLowerCase();
            if (value === '') {
                filteredCategories = [];
                displayCategories();
            } else {
                filteredCategories = categories.filter(cat => cat.name.toLowerCase().includes(value));
                displayCategories(filteredCategories);
            }
        });
    }
});

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    // Sidebar navigation
    document.getElementById('sidebar-categories-link').addEventListener('click', function(e) {
        e.preventDefault();
        showTab('categories');
        closeSidebarOnMobile();
    });
    document.getElementById('sidebar-products-link').addEventListener('click', function(e) {
        e.preventDefault();
        showTab('products');
        closeSidebarOnMobile();
    });
    document.getElementById('sidebar-colors-link').addEventListener('click', function(e) {
        e.preventDefault();
        showTab('colors');
        closeSidebarOnMobile();
    });
    document.getElementById('sidebar-cart-settings-link').addEventListener('click', function(e) {
        e.preventDefault();
        showTab('cart-settings');
        closeSidebarOnMobile();
    });
    document.getElementById('sidebar-orders-link').addEventListener('click', function(e) {
        e.preventDefault();
        showTab('orders');
        closeSidebarOnMobile();
    });

    // Category modals
    document.getElementById('add-category-btn').addEventListener('click', function() {
        showModal('add-category-modal');
    });
    document.getElementById('add-category-cancel-btn').addEventListener('click', function() {
        closeModal('add-category-modal');
    });
    document.getElementById('edit-category-cancel-btn').addEventListener('click', function() {
        closeModal('edit-category-modal');
    });

    // Product modals
    document.getElementById('add-product-btn').addEventListener('click', async function() {
        await showAddProductModal();
    });
    document.getElementById('add-product-cancel-btn').addEventListener('click', function() {
        closeModal('add-product-modal');
    });
    document.getElementById('edit-product-cancel-btn').addEventListener('click', function() {
        closeModal('edit-product-modal');
    });

    // Color modals
    document.getElementById('add-color-btn').addEventListener('click', function() {
        showModal('add-color-modal');
    });
    document.getElementById('add-color-cancel-btn').addEventListener('click', function() {
        closeModal('add-color-modal');
    });

    // Add size/color field (delegation for dynamic fields)
    document.getElementById('add-size-btn').addEventListener('click', function() {
        addSizeField();
    });
    document.getElementById('add-color-field-btn').addEventListener('click', function() {
        addColorField();
    });

    // Category forms
    document.getElementById('add-category-form').addEventListener('submit', handleAddCategory);
    document.getElementById('edit-category-form').addEventListener('submit', handleEditCategory);
    // Product form
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
    // Color form
    document.getElementById('add-color-form').addEventListener('submit', handleAddColor);
    // Size type change
    document.getElementById('size-type').addEventListener('change', handleSizeTypeChange);
    // Cart Settings
    document.getElementById('payment-methods-form').addEventListener('submit', handleSavePaymentMethods);
    document.getElementById('enable-all-methods').addEventListener('click', enableAllPaymentMethods);
    
    // Product filter
    const productFilter = document.getElementById('product-category-filter');
    if (productFilter) {
        productFilter.addEventListener('change', function(e) {
            filterProductsByCategory(e.target.value);
        });
    }

    // Products search
    const productsSearchInput = document.getElementById('products-search-input');
    if (productsSearchInput) {
        productsSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const categoryFilter = document.getElementById('product-category-filter').value;
            
            if (searchTerm === '') {
                // If no search term, apply only category filter
                if (categoryFilter) {
                    filteredProducts = products.filter(product => product.category_id == categoryFilter);
                } else {
                    filteredProducts = [];
                }
            } else {
                // Apply both search and category filter
                let filtered = products.filter(product => 
                    product.name.toLowerCase().includes(searchTerm) ||
                    product.category_name.toLowerCase().includes(searchTerm) ||
                    product.gender.toLowerCase().includes(searchTerm) ||
                    (product.description && product.description.toLowerCase().includes(searchTerm))
                );
                
                // Apply category filter if selected
                if (categoryFilter) {
                    filtered = filtered.filter(product => product.category_id == categoryFilter);
                }
                
                filteredProducts = filtered;
            }
            displayProducts();
        });
    }
    
    // Edit product form
    const editProductForm = document.getElementById('edit-product-form');
    if (editProductForm) {
        editProductForm.addEventListener('submit', handleEditProduct);
    }
}

// ========== CATEGORY MANAGEMENT ==========
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        const data = await response.json();
        
        if (data.success) {
            categories = data.data;
            displayCategories();
        } else {
            showNotification('Error loading categories', 'error');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showNotification('Error loading categories', 'error');
    }
}

function displayCategories(list = null) {
    const container = document.getElementById('categories-list');
    const countElement = document.getElementById('categories-count');
    const categoriesToDisplay = list || (filteredCategories.length > 0 ? filteredCategories : categories);
    // Update total count
    if (countElement) {
        countElement.textContent = categoriesToDisplay.length;
    }
    if (categoriesToDisplay.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-tags text-gray-400 text-2xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                <p class="text-gray-500 mb-6">Get started by creating your first category</p>
                
            </div>
        `;
        reattachDynamicEventListeners();
        return;
    }
    container.innerHTML = categoriesToDisplay.map(category => `
        <div class="bg-white rounded-xl border border-gray-200 p-6 card-hover">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <i class="fas fa-tags text-white"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">${category.name}</h3>
                        <div class="flex items-center space-x-4 text-sm text-gray-500">
                            <span><i class="fas fa-calendar mr-1"></i>Created ${new Date(category.created_at).toLocaleDateString()}</span>
                            <span><i class="fas fa-clock mr-1"></i>${new Date(category.created_at).toLocaleTimeString()}</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="showEditCategoryModal(${JSON.stringify(category).replace(/\"/g, '&quot;')})" 
                            class="w-10 h-10 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center justify-center transition-all">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCategory(${category.id})" 
                            class="w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-all">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    reattachDynamicEventListeners();
}

async function handleAddCategory(event) {
    event.preventDefault();
    
    const name = document.getElementById('category-name').value.trim();
    
    if (!name) {
        showNotification('Category name is required', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Category added successfully', 'success');
            closeModal('add-category-modal');
            loadCategories();
            updateNavbarCategories();
            // Reload products filter if we're on products tab
            if (currentTab === 'products') {
                loadCategoriesForFilter();
            }
        } else {
            showNotification(data.message || 'Error adding category', 'error');
        }
    } catch (error) {
        console.error('Error adding category:', error);
        showNotification('Error adding category', 'error');
    }
}

async function handleEditCategory(event) {
    event.preventDefault();
    
    const id = document.getElementById('edit-category-id').value;
    const name = document.getElementById('edit-category-name').value.trim();
    
    if (!name) {
        showNotification('Category name is required', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/categories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Category updated successfully', 'success');
            closeModal('edit-category-modal');
            loadCategories();
            updateNavbarCategories();
            // Reload products filter if we're on products tab
            if (currentTab === 'products') {
                loadCategoriesForFilter();
            }
        } else {
            showNotification(data.message || 'Error updating category', 'error');
        }
    } catch (error) {
        console.error('Error updating category:', error);
        showNotification('Error updating category', 'error');
    }
}

async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/categories/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Category deleted successfully', 'success');
            loadCategories();
            updateNavbarCategories();
            // Reload products filter if we're on products tab
            if (currentTab === 'products') {
                loadCategoriesForFilter();
            }
        } else {
            showNotification(data.message || 'Error deleting category', 'error');
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        showNotification('Error deleting category', 'error');
    }
}

// ========== COLOR MANAGEMENT ==========
async function loadColors() {
    try {
        console.log('Loading colors from:', `${API_BASE}/colors`);
        const response = await fetch(`${API_BASE}/colors`);
        const data = await response.json();
        
        console.log('Colors response:', data);
        
        if (data.success) {
            colors = data.data;
            console.log('Colors loaded successfully:', colors);
            displayColors();
        } else {
            console.error('Error loading colors:', data.message);
            showNotification('Error loading colors', 'error');
        }
    } catch (error) {
        console.error('Error loading colors:', error);
        showNotification('Error loading colors', 'error');
    }
}

function displayColors() {
    const container = document.getElementById('colors-list');
    const countElement = document.getElementById('colors-count');
    if (countElement) {
        countElement.textContent = colors.length;
    }
    if (colors.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-palette text-gray-400 text-2xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No colors yet</h3>
                <p class="text-gray-500 mb-6">Get started by adding your first color</p>
                <button id="add-color-btn" class="btn-primary px-6 py-3 rounded-xl text-white font-medium">
                    <i class="fas fa-plus mr-2"></i>
                    Add First Color
                </button>
            </div>
        `;
        reattachDynamicEventListeners();
        return;
    }
    container.innerHTML = colors.map(color => `
        <div class="bg-white rounded-xl border border-gray-200 p-6 card-hover">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 rounded-xl border-2 border-gray-200 flex items-center justify-center" style="background-color: ${color.hex_code || '#e5e7eb'}">
                        ${color.hex_code ? '' : '<i class="fas fa-palette text-gray-400"></i>'}
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">${color.name}</h3>
                        ${color.hex_code ? `<p class="text-sm text-gray-500 font-mono">${color.hex_code}</p>` : '<p class="text-sm text-gray-500">No hex code</p>'}
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    
                    <button onclick="deleteColor(${color.id})" class="w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-all">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="flex items-center justify-between text-sm text-gray-500">
                <span><i class="fas fa-calendar mr-1"></i>Added recently</span>
                <span class="bg-gray-100 px-2 py-1 rounded-full text-xs">Color Variant</span>
            </div>
        </div>
    `).join('');
    reattachDynamicEventListeners();
}

async function handleAddColor(event) {
    event.preventDefault();
    
    const name = document.getElementById('color-name').value.trim();
    const hex_code = document.getElementById('color-hex').value;
    
    if (!name) {
        showNotification('Color name is required', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/colors`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, hex_code: hex_code !== '#000000' ? hex_code : null })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Color added successfully', 'success');
            closeModal('add-color-modal');
            loadColors();
        } else {
            showNotification(data.message || 'Error adding color', 'error');
        }
    } catch (error) {
        console.error('Error adding color:', error);
        showNotification('Error adding color', 'error');
    }
}

async function deleteColor(id) {
    if (!confirm('Are you sure you want to delete this color?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/colors/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Color deleted successfully', 'success');
            loadColors();
        } else {
            showNotification(data.message || 'Error deleting color', 'error');
        }
    } catch (error) {
        console.error('Error deleting color:', error);
        showNotification('Error deleting color', 'error');
    }
}

// ========== PRODUCT MANAGEMENT ==========
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        const data = await response.json();
        
        if (data.success) {
            products = data.data;
            // Clear any existing filter and search when reloading products
            filteredProducts = [];
            const searchInput = document.getElementById('products-search-input');
            if (searchInput) {
                searchInput.value = '';
            }
            displayProducts();
        } else {
            showNotification('Error loading products', 'error');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products', 'error');
    }
}

function displayProducts() {
    const container = document.getElementById('products-list');
    const countElement = document.getElementById('products-count');
    const filteredCountElement = document.getElementById('filtered-products-count');
    
    // Update total count
    if (countElement) {
        countElement.textContent = products.length;
    }
    
    // Use filtered products if available, otherwise use all products
    const productsToDisplay = filteredProducts.length > 0 ? filteredProducts : products;
    
    // Update filtered count
    if (filteredCountElement) {
        filteredCountElement.textContent = productsToDisplay.length;
    }
    if (productsToDisplay.length === 0) {
        if (filteredProducts.length > 0) {
            // No products match the filter
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-search text-gray-400 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p class="text-gray-500 mb-6">No products match your search criteria</p>
                    <button onclick="clearProductSearch()" class="btn-primary px-6 py-3 rounded-xl text-white font-medium">
                        <i class="fas fa-times mr-2"></i>
                        Clear Search
                    </button>
                </div>
            `;
        } else {
            // No products at all
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-box text-gray-400 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                    <p class="text-gray-500 mb-6">Get started by adding your first product</p>
                    <button id="add-product-btn" class="btn-primary px-6 py-3 rounded-xl text-white font-medium">
                        <i class="fas fa-plus mr-2"></i>
                        Add First Product
                    </button>
                </div>
            `;
        }
        reattachDynamicEventListeners();
        return;
    }
    container.innerHTML = productsToDisplay.map(product => `
        <div class="bg-white rounded-xl border border-gray-200 p-6 card-hover">
            <div class="flex justify-between items-start mb-6">
                <div class="flex items-start space-x-4">
                    <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                        <i class="fas fa-box text-white text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">${product.name}</h3>
                        <div class="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span class="flex items-center">
                                <i class="fas fa-tags mr-1 text-blue-500"></i>
                                ${product.category_name}
                            </span>
                            <span class="flex items-center">
                                <i class="fas fa-user mr-1 text-purple-500"></i>
                                ${product.gender}
                            </span>
                        </div>
                        ${product.description ? `<p class="text-sm text-gray-500 line-clamp-2">${product.description}</p>` : ''}
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="showEditProductModal(${product.id})" class="w-10 h-10 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center justify-center transition-all">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct(${product.id})" class="w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-all">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-700">Price</p>
                            <p class="text-lg font-bold text-gray-800">EGP ${product.price}</p>
                        </div>
                        <i class="fas fa-tag text-green-500"></i>
                    </div>
                    ${product.discount_price ? `<p class="text-sm text-green-600 font-medium">Sale: EGP ${product.discount_price}</p>` : ''}
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-700">Size Type</p>
                            <p class="text-sm font-semibold text-gray-800">${product.size_type}</p>
                        </div>
                        <i class="fas fa-ruler text-blue-500"></i>
                    </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-700">Colors</p>
                            <p class="text-sm font-semibold text-gray-800">${product.colors || 'None'}</p>
                        </div>
                        <i class="fas fa-palette text-purple-500"></i>
                    </div>
                    ${product.colors ? `<p class="text-xs text-blue-600 mt-1">${product.color_count || 0} variants, ${product.total_images || 0} images</p>` : ''}
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-700">Status</p>
                            <p class="text-sm font-semibold text-green-600">Active</p>
                        </div>
                        <i class="fas fa-check-circle text-green-500"></i>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    reattachDynamicEventListeners();
}

async function handleAddProduct(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    // Validate required fields
    const requiredFields = ['name', 'price', 'gender', 'category_id', 'size_type'];
    for (const field of requiredFields) {
        if (!formData.get(field)) {
            showNotification(`${field.replace('_', ' ')} is required`, 'error');
            return;
        }
    }
    
    // Get sizes and colors
    const sizes = getSizesFromForm();
    const colors = getColorsFromForm();
    
    // Validate colors have images
    const colorContainers = document.querySelectorAll('#colors-container .border');
    let hasSelectedColors = false;
    
    for (const container of colorContainers) {
        const colorSelect = container.querySelector('.color-select');
        const imageInput = container.querySelector('input[type="file"]');
        if (!colorSelect || !imageInput) {
            // استخدم continue هنا لأنه for...of وليس forEach
            continue;
        }
        if (colorSelect.value && colorSelect.value !== '' && colorSelect.value !== 'Select Color') {
            hasSelectedColors = true;
            
            if (imageInput.files.length < 3) {
                const colorName = colorSelect.options[colorSelect.selectedIndex].text;
                showNotification(`Color ${colorName} must have at least 3 images`, 'error');
                return;
            }
            
            if (imageInput.files.length > 10) {
                const colorName = colorSelect.options[colorSelect.selectedIndex].text;
                showNotification(`Color ${colorName} cannot have more than 10 images`, 'error');
                return;
            }
        }
    }
    
    // If no colors are selected, that's fine - product can be added without colors
    
    // Add form data
    formData.append('sizes', JSON.stringify(sizes));
    formData.append('colors', JSON.stringify(colors));
    
    // Add images with color associations
    let imageIndex = 0;
    colorContainers.forEach((container, colorIndex) => {
        const colorSelect = container.querySelector('.color-select');
        const imageInput = container.querySelector('input[type="file"]');
        if (!colorSelect || !imageInput) return; // استخدم return بدل continue هنا
        
        if (colorSelect.value && colorSelect.value !== '' && colorSelect.value !== 'Select Color' && imageInput.files.length > 0) {
            Array.from(imageInput.files).forEach((file, fileIndex) => {
                formData.append('images', file);
                formData.append(`color_${imageIndex}`, colorSelect.value);
                formData.append(`order_${imageIndex}`, fileIndex);
                imageIndex++;
            });
        }
    });
    
    try {
        const response = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Product added successfully', 'success');
            closeModal('add-product-modal');
            // Clear filter and reload products
            filteredProducts = [];
            loadProducts();
        } else {
            showNotification(data.message || 'Error adding product', 'error');
        }
    } catch (error) {
        console.error('Error adding product:', error);
        showNotification('Error adding product', 'error');
    }
}

function getSizesFromForm() {
    const sizes = [];
    const sizeInputs = document.querySelectorAll('.size-input');
    sizeInputs.forEach(input => {
        if (!input) return;
        const value = input.value ? input.value.trim() : '';
        const quantity = input.nextElementSibling && input.nextElementSibling.value
            ? parseInt(input.nextElementSibling.value) : 0;
        if (value) {
            sizes.push({ value, quantity });
        }
    });
    return sizes;
}

function getEditSizesFromForm() {
    const sizes = [];
    const sizeInputs = document.querySelectorAll('.edit-size-input');
    sizeInputs.forEach(input => {
        if (!input) return;
        const value = input.value ? input.value.trim() : '';
        const quantity = input.nextElementSibling && input.nextElementSibling.value
            ? parseInt(input.nextElementSibling.value) : 0;
        if (value) {
            sizes.push({ value, quantity });
        }
    });
    return sizes;
}

function getColorsFromForm() {
    const colors = [];
    const colorSelects = document.querySelectorAll('.color-select');
    colorSelects.forEach(select => {
        if (!select) return;
        if (select.value && select.value !== '') {
            const existingColor = colors.find(c => c.id === parseInt(select.value));
            if (!existingColor) {
                colors.push({ id: parseInt(select.value), name: select.options[select.selectedIndex].text });
            }
        }
    });
    return colors;
}

function getEditColorsFromForm() {
    const colors = [];
    const colorSelects = document.querySelectorAll('.edit-color-select');
    colorSelects.forEach(select => {
        if (!select) return;
        if (select.value && select.value !== '') {
            const existingColor = colors.find(c => c.id === parseInt(select.value));
            if (!existingColor) {
                const selectedOption = select.options[select.selectedIndex];
                const colorName = selectedOption ? selectedOption.text : 'Unknown';
                colors.push({ id: parseInt(select.value), name: colorName });
            }
        }
    });
    return colors;
}

// Global functions for edit modal
window.addEditColorField = addEditColorField;
window.addEditSizeField = addEditSizeField;
window.handleEditImageUpload = handleEditImageUpload;

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Product deleted successfully', 'success');
            // Clear filter and reload products
            filteredProducts = [];
            loadProducts();
        } else {
            showNotification(data.message || 'Error deleting product', 'error');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Error deleting product', 'error');
    }
}

// Helper functions for product form
function loadCategoriesForSelect() {
    const select = document.getElementById('product-category');
    select.innerHTML = '<option value="">Select Category</option>';
    
    console.log('Loading categories for select. Available categories:', categories.length);
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

function loadColorsForSelect() {
    const colorSelects = document.querySelectorAll('.color-select');
    console.log('Loading colors for selects. Available colors:', colors.length, 'Selects found:', colorSelects.length);
    
    if (colors.length === 0) {
        console.log('No colors available for selects');
        return;
    }
    
    colorSelects.forEach(select => {
        select.innerHTML = '<option value="">Select Color</option>';
        colors.forEach(color => {
            const option = document.createElement('option');
            option.value = color.id;
            option.textContent = color.name;
            select.appendChild(option);
        });
    });
}

function handleSizeTypeChange() {
    const sizeType = document.getElementById('size-type').value;
    const container = document.getElementById('sizes-container');
    container.innerHTML = '';
    
    console.log('Size type changed to:', sizeType);
    
    if (sizeType === 'numeric') {
        // Add numeric size suggestions
        for (let i = 36; i <= 46; i += 2) {
            addSizeField(i.toString());
        }
    } else if (sizeType === 'string') {
        // Add string size suggestions
        ['XS', 'S', 'M', 'L', 'XL', 'XXL'].forEach(size => {
            addSizeField(size);
        });
    }
}

function addSizeField(defaultValue = '') {
    const container = document.getElementById('sizes-container');
    const sizeDiv = document.createElement('div');
    sizeDiv.className = 'flex space-x-2 items-center';
    sizeDiv.innerHTML = `
        <input type="text" class="size-input flex-1 px-3 py-2 border border-gray-300 rounded-md" 
               placeholder="Size" value="${defaultValue}" required>
        <input type="number" class="flex-1 px-3 py-2 border border-gray-300 rounded-md" 
               placeholder="Quantity" value="0" min="0">
        <button type="button" onclick="this.parentElement.remove()" 
                class="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(sizeDiv);
    console.log('Added size field with default value:', defaultValue);
}

async function addColorField() {
    const container = document.getElementById('colors-container');
    const colorDiv = document.createElement('div');
    colorDiv.className = 'border border-gray-300 rounded-lg p-4';
    colorDiv.innerHTML = `
        <div class="flex justify-between items-center mb-3">
            <h5 class="font-medium text-gray-800">Color</h5>
            <button type="button" onclick="this.closest('.border').remove()" 
                    class="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="mb-3">
            <select class="color-select w-full px-3 py-2 border border-gray-300 rounded-md" required>
                <option value="">Select Color</option>
            </select>
        </div>
        <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-2">Images (3-10 required)</label>
            <input type="file" multiple accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md" 
                   onchange="handleImageUpload(this)" required>
        </div>
        <div class="image-preview grid grid-cols-3 gap-2">
            <!-- Image previews will be shown here -->
        </div>
    `;
    container.appendChild(colorDiv);
    console.log('Added new color field container');
    
    // Load colors for the new select
    const select = colorDiv.querySelector('.color-select');
    console.log('Loading colors for new color field. Available colors:', colors.length);
    
    if (colors.length === 0) {
        console.log('No colors available. Loading colors...');
        await loadColors(); // Load colors if not available
    }
    
    console.log('Adding colors to select:', colors);
    colors.forEach(color => {
        const option = document.createElement('option');
        option.value = color.id;
        option.textContent = color.name;
        select.appendChild(option);
        console.log('Added color option:', color.name, 'with value:', color.id);
    });
}

function handleImageUpload(input) {
    const files = Array.from(input.files);
    const previewContainer = input.parentElement.nextElementSibling;
    let colorSelect = input.closest('.border')?.querySelector('.color-select');
    if (!colorSelect) {
        colorSelect = input.parentElement.parentElement.querySelector('.color-select');
    }
    if (!colorSelect) {
        showNotification('Color select not found. Please refresh the page.', 'error');
        input.value = '';
        return;
    }
    if (!colorSelect.value || colorSelect.value === '' || colorSelect.value === 'Select Color') {
        showNotification('Please select a color first', 'error');
        input.value = '';
        return;
    }
    if (files.length < 3) {
        showNotification('At least 3 images are required for each color', 'error');
        input.value = '';
        return;
    }
    if (files.length > 10) {
        showNotification('Maximum 10 images allowed per color', 'error');
        input.value = '';
        return;
    }
    
    previewContainer.innerHTML = '';
    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'w-full h-20 object-cover rounded';
            img.alt = `Preview ${index + 1}`;
            previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

// ========== CART SETTINGS (PAYMENT METHODS & SHIPPING) ==========
let currentShipping = 0;

// Load payment methods and shipping from API and populate form
async function loadPaymentMethods() {
    try {
        // Load payment methods
        const response = await fetch(`${API_BASE}/payment-methods`);
        const data = await response.json();
        if (data.success) {
            paymentMethods = data.data;
            populatePaymentMethodsForm();
        } else {
            showNotification('Error loading payment methods', 'error');
        }
        // Load shipping value
        const shippingRes = await fetch(`${API_BASE}/settings/shipping`);
        const shippingData = await shippingRes.json();
        if (shippingData.success) {
            currentShipping = shippingData.shipping;
            document.getElementById('shipping-cost').value = currentShipping;
        } else {
            document.getElementById('shipping-cost').value = 0;
        }
    } catch (error) {
        showNotification('Error loading payment methods or shipping', 'error');
    }
}

function populatePaymentMethodsForm() {
    const vodafone = paymentMethods.find(m => m.method_name === 'vodafone_cash') || {};
    const instapay = paymentMethods.find(m => m.method_name === 'instapay') || {};
    const cod = paymentMethods.find(m => m.method_name === 'cash_on_delivery') || {};
    // Vodafone Cash
    document.getElementById('vodafone-cash-enabled').checked = !!vodafone.enabled;
    document.getElementById('vodafone-cash-phone').value = vodafone.phone_number || '';
    // InstaPay
    document.getElementById('instapay-enabled').checked = !!instapay.enabled;
    document.getElementById('instapay-phone').value = instapay.phone_number || '';
    document.getElementById('instapay-visa').value = instapay.visa_card || '';
    document.getElementById('instapay-email').value = instapay.email || '';
    // Cash on Delivery
    document.getElementById('cod-enabled').checked = !!cod.enabled;
}

// Save payment methods and shipping handler
async function handleSavePaymentMethods(event) {
    event.preventDefault();
    // Gather values
    const vodafoneEnabled = document.getElementById('vodafone-cash-enabled').checked;
    const vodafonePhone = document.getElementById('vodafone-cash-phone').value.trim();
    const instapayEnabled = document.getElementById('instapay-enabled').checked;
    const instapayPhone = document.getElementById('instapay-phone').value.trim();
    const instapayVisa = document.getElementById('instapay-visa').value.trim();
    const instapayEmail = document.getElementById('instapay-email').value.trim();
    const codEnabled = document.getElementById('cod-enabled').checked;
    const shippingValue = parseFloat(document.getElementById('shipping-cost').value);
    // Prepare requests
    const updates = [
        fetch(`${API_BASE}/payment-methods/vodafone_cash`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: vodafoneEnabled, phone_number: vodafonePhone })
        }),
        fetch(`${API_BASE}/payment-methods/instapay`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: instapayEnabled, phone_number: instapayPhone, visa_card: instapayVisa, email: instapayEmail })
        }),
        fetch(`${API_BASE}/payment-methods/cash_on_delivery`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: codEnabled })
        })
    ];
    let shippingChanged = false;
    if (!isNaN(shippingValue) && shippingValue !== currentShipping) {
        shippingChanged = true;
        updates.push(
            fetch(`${API_BASE}/settings/shipping`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shipping: shippingValue })
            })
        );
    }
    try {
        const results = await Promise.all(updates);
        let allOk = true;
        for (let i = 0; i < results.length; i++) {
            const res = await results[i].json();
            if (!res.success) {
                allOk = false;
                showNotification(res.message || 'Error updating settings', 'error');
            } else if (shippingChanged && i === updates.length - 1) {
                currentShipping = shippingValue;
                showNotification('Shipping cost updated', 'success');
            }
        }
        if (allOk) {
            showNotification('Payment methods updated', 'success');
            loadPaymentMethods();
        }
    } catch (error) {
        showNotification('Error saving payment methods or shipping', 'error');
    }
}

// Enable all payment methods
function enableAllPaymentMethods(event) {
    event.preventDefault();
    document.getElementById('vodafone-cash-enabled').checked = true;
    document.getElementById('instapay-enabled').checked = true;
    document.getElementById('cod-enabled').checked = true;
}

// ========== ORDERS MANAGEMENT ==========
function renderOrdersTable(orders) {
    const statusOptions = [
        'Pending',
        'Confirmed',
        'In Progress',
        'Out for Delivery',
        'Delivered',
        'Cancelled'
    ];
    
    const getStatusColor = (status) => {
        const colors = {
            'Pending': 'bg-yellow-100 text-yellow-800',
            'Confirmed': 'bg-blue-100 text-blue-800',
            'In Progress': 'bg-purple-100 text-purple-800',
            'Out for Delivery': 'bg-orange-100 text-orange-800',
            'Delivered': 'bg-green-100 text-green-800',
            'Cancelled': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };
    
    const getPaymentIcon = (method) => {
        const icons = {
            'vodafone_cash': 'fas fa-mobile-alt',
            'instapay': 'fas fa-credit-card',
            'cash_on_delivery': 'fas fa-money-bill-wave'
        };
        return icons[method] || 'fas fa-credit-card';
    };
    
    return `<div class="space-y-4">
        ${orders.map(order => `
            <div class="bg-white rounded-xl border border-gray-200 p-6 card-hover">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <i class="fas fa-receipt text-white"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-bold text-gray-800">Order #${order.id}</h3>
                            <p class="text-sm text-gray-500">${new Date(order.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span class="px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}">
                            ${order.status}
                        </span>
                        <button class="remove-order-btn w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-all" data-order-id="${order.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                    <!-- Customer Info -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                            <i class="fas fa-user mr-2 text-blue-500"></i>
                            Customer Information
                        </h4>
                        <div class="space-y-2 text-sm">
                            <p><span class="font-medium">Name:</span> ${order.customer_name}</p>
                            <p><span class="font-medium">Email:</span> ${order.customer_email}</p>
                            <p><span class="font-medium">Phone:</span> ${order.phone}</p>
                            <p><span class="font-medium">Address:</span> ${order.address}</p>
                        </div>
                    </div>
                    
                    <!-- Payment Info -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                            <i class="${getPaymentIcon(order.payment_method)} mr-2 text-green-500"></i>
                            Payment Details
                        </h4>
                        <div class="space-y-2 text-sm">
                            <p><span class="font-medium">Method:</span> ${order.payment_method.replace('_', ' ')}</p>
                            <p><span class="font-medium">Shipping:</span> EGP ${(order.shipping_fee == null ? 0.00 : parseFloat(order.shipping_fee)).toFixed(2)}</p>
                            <p><span class="font-medium">Total:</span> <span class="font-bold text-green-600">EGP ${(order.total == null ? 0.00 : parseFloat(order.total)).toFixed(2)}</span></p>
                            ${order.uploaded_file ? `<p><span class="font-medium">Receipt:</span> <a href="/uploads/${order.uploaded_file}" target="_blank" class="text-blue-600 hover:underline">View Receipt</a></p>` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- Products -->
                <div class="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 class="font-semibold text-gray-800 mb-3 flex items-center">
                        <i class="fas fa-shopping-bag mr-2 text-purple-500"></i>
                        Order Items
                    </h4>
                    <div class="space-y-3">
                        ${order.items.map(item => `
                            <div class="flex items-center justify-between bg-white rounded-lg p-3">
                                <div class="flex items-center space-x-3">
                                    <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-box text-white text-sm"></i>
                                    </div>
                                    <div>
                                        <p class="font-medium text-gray-800">${item.product_name}</p>
                                        <p class="text-sm text-gray-500">Size: ${item.size || '-'} | Color: ${item.color || '-'} | Qty: ${item.quantity}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="font-semibold text-gray-800">EGP ${item.price}</p>
                                    <p class="text-sm text-gray-500">Total: EGP ${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Status Update -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <label class="text-sm font-medium text-gray-700">Update Status:</label>
                        <select class="order-status-dropdown border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" data-order-id="${order.id}">
                            ${statusOptions.map(opt => `<option value="${opt}" ${order.status === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                    <div class="text-sm text-gray-500">
                        <i class="fas fa-clock mr-1"></i>
                        Last updated: ${new Date(order.created_at).toLocaleString()}
                    </div>
                </div>
            </div>
        `).join('')}
    </div>`;
}

// Add event listeners for status dropdown and remove button after rendering
function setupOrderActions() {
    document.querySelectorAll('.order-status-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', async function() {
            const orderId = this.getAttribute('data-order-id');
            const newStatus = this.value;
            if (!orderId) return;
            try {
                const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });
                const data = await response.json();
                if (data.success) {
                    showNotification(`Order status updated to ${newStatus}`, 'success');
                    if (newStatus === 'Delivered') {
                        showNotification('Order will be auto-deleted after 30 minutes.', 'success');
                    }
                    loadOrders();
                } else {
                    showNotification(data.message || 'Failed to update status', 'error');
                    loadOrders();
                }
            } catch (err) {
                showNotification('Error updating order status', 'error');
            }
        });
    });
    document.querySelectorAll('.remove-order-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            if (!orderId) return;
            showConfirmationModal('Are you sure you want to delete this order? This cannot be undone.', async function() {
                try {
                    const response = await fetch(`${API_BASE}/orders/${orderId}`, {
                        method: 'DELETE'
                    });
                    const data = await response.json();
                    if (data.success) {
                        showNotification('Order deleted successfully.', 'success');
                        loadOrders();
                    } else {
                        showNotification(data.message || 'Failed to delete order', 'error');
                        loadOrders();
                    }
                } catch (err) {
                    showNotification('Error deleting order', 'error');
                }
            });
        });
    });
}

// Patch loadOrders to call setupOrderActions after rendering
async function loadOrders() {
    const container = document.getElementById('orders-list');
    container.innerHTML = '<div class="text-gray-500 text-center py-4">Loading orders...</div>';
    try {
        const response = await fetch(`${API_BASE}/orders`);
        const data = await response.json();
        if (data.success) {
            if (!data.orders.length) {
                container.innerHTML = '<div class="text-gray-500 text-center py-4">No orders found</div>';
                return;
            }
            container.innerHTML = renderOrdersTable(data.orders);
            setupOrderActions();
        } else {
            container.innerHTML = '<div class="text-red-500 text-center py-4">Error loading orders</div>';
        }
    } catch (err) {
        container.innerHTML = '<div class="text-red-500 text-center py-4">Error loading orders</div>';
    }
}

// ========== MODAL MANAGEMENT ==========
function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    // Reset forms
    if (modalId === 'add-category-modal') {
        document.getElementById('category-name').value = '';
    } else if (modalId === 'edit-category-modal') {
        document.getElementById('edit-category-name').value = '';
        document.getElementById('edit-category-id').value = '';
    } else if (modalId === 'add-product-modal') {
        document.getElementById('add-product-form').reset();
        document.getElementById('sizes-container').innerHTML = '';
        document.getElementById('colors-container').innerHTML = '';
    } else if (modalId === 'add-color-modal') {
        document.getElementById('color-name').value = '';
        document.getElementById('color-hex').value = '#000000';
    } else if (modalId === 'edit-product-modal') {
        document.getElementById('edit-product-form').reset();
        document.getElementById('edit-sizes-container').innerHTML = '';
        document.getElementById('edit-colors-container').innerHTML = '';
    }
}

function showAddCategoryModal() {
    showModal('add-category-modal');
}

function showEditCategoryModal(category) {
    document.getElementById('edit-category-id').value = category.id;
    document.getElementById('edit-category-name').value = category.name;
    showModal('edit-category-modal');
}

async function showAddProductModal() {
    console.log('Opening add product modal. Available categories:', categories.length, 'Available colors:', colors.length);
    
    // Make sure colors are loaded
    if (colors.length === 0) {
        console.log('No colors available. Loading colors...');
        await loadColors();
    }
    
    loadCategoriesForSelect();
    loadColorsForSelect();
    showModal('add-product-modal');
}

function showEditProductModal(productId) {
    console.log('Opening edit product modal for product ID:', productId);
    loadProductForEdit(productId);
    showModal('edit-product-modal');
}

function showAddColorModal() {
    showModal('add-color-modal');
}

// ========== UTILITY/HELPER FUNCTIONS ==========
// Test API connection
async function testAPIConnection() {
    try {
        console.log('Testing API connection...');
        const response = await fetch(`${API_BASE}/colors`);
        console.log('API response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('API is working. Colors response:', data);
        } else {
            console.error('API is not working. Status:', response.status);
            showNotification('Backend server is not running. Please start the server.', 'error');
        }
    } catch (error) {
        console.error('API connection failed:', error);
        showNotification('Cannot connect to backend server. Please start the server.', 'error');
    }
}

// ========== ENHANCED NOTIFICATION SYSTEM ==========
function showNotification(message, type = 'success', description = '') {
    const container = document.getElementById('notification-container');
    const template = document.getElementById('toast-template');
    if (!container || !template) {
        console.error('Notification elements not found');
        return;
    }
    // Clone the template
    const toast = template.content.cloneNode(true);
    const toastElement = toast.querySelector('.notification-toast');
    // Set message and description
    const messageEl = toastElement.querySelector('.toast-message');
    const descriptionEl = toastElement.querySelector('.toast-description');
    const iconEl = toastElement.querySelector('.fas');
    const iconContainer = toastElement.querySelector('.w-8.h-8');
    const progressEl = toastElement.querySelector('.toast-progress');
    messageEl.textContent = message;
    descriptionEl.textContent = description;
    // Set colors based on type
    const colors = {
        success: {
            bg: 'bg-green-500',
            icon: 'fa-check',
            progress: 'bg-green-500'
        },
        error: {
            bg: 'bg-red-500',
            icon: 'fa-exclamation-triangle',
            progress: 'bg-red-500'
        },
        warning: {
            bg: 'bg-yellow-500',
            icon: 'fa-exclamation-circle',
            progress: 'bg-yellow-500'
        },
        info: {
            bg: 'bg-blue-500',
            icon: 'fa-info-circle',
            progress: 'bg-blue-500'
        }
    };
    const colorConfig = colors[type] || colors.success;
    iconContainer.className = `w-8 h-8 rounded-full flex items-center justify-center ${colorConfig.bg}`;
    iconEl.className = `fas ${colorConfig.icon} text-white text-sm`;
    progressEl.className = `toast-progress h-full ${colorConfig.progress} rounded-full transition-all duration-300`;
    container.appendChild(toastElement);
    setTimeout(() => {
        toastElement.style.transform = 'translateX(0)';
        toastElement.style.opacity = '1';
    }, 10);
    const duration = 5000;
    const startTime = Date.now();
    const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.max(0, 100 - (elapsed / duration) * 100);
        progressEl.style.width = `${progress}%`;
        if (progress > 0) {
            requestAnimationFrame(updateProgress);
        }
    };
    updateProgress();
    const removeToast = () => {
        toastElement.style.transform = 'translateX(100%)';
        toastElement.style.opacity = '0';
        setTimeout(() => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
        }, 300);
    };
    setTimeout(removeToast, duration);
    const closeBtn = toastElement.querySelector('button');
    closeBtn.addEventListener('click', removeToast);
    return toastElement;
}

// Helper to re-attach event listeners for dynamically rendered buttons
function reattachDynamicEventListeners() {
    // Add Category
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.onclick = () => showModal('add-category-modal');
    }
    // Add Product
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.onclick = () => showAddProductModal();
    }
    // Add Color
    const addColorBtn = document.getElementById('add-color-btn');
    if (addColorBtn) {
        addColorBtn.onclick = () => showModal('add-color-modal');
    }
    // Cancel buttons for modals
    const cancelButtons = [
        { id: 'add-category-cancel-btn', modal: 'add-category-modal' },
        { id: 'edit-category-cancel-btn', modal: 'edit-category-modal' },
        { id: 'add-product-cancel-btn', modal: 'add-product-modal' },
        { id: 'edit-product-cancel-btn', modal: 'edit-product-modal' },
        { id: 'add-color-cancel-btn', modal: 'add-color-modal' }
    ];
    cancelButtons.forEach(({ id, modal }) => {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = () => closeModal(modal);
    });
    
    // Product filter
    const productFilter = document.getElementById('product-category-filter');
    if (productFilter) {
        productFilter.onchange = function(e) {
            filterProductsByCategory(e.target.value);
        };
    }
}

// Color picker synchronization for color modals
function setupColorPickerSync() {
    const colorHex = document.getElementById('color-hex');
    const colorHexText = document.getElementById('color-hex-text');
    if (colorHex && colorHexText) {
        colorHex.addEventListener('input', function() {
            colorHexText.value = this.value;
        });
        colorHexText.addEventListener('input', function() {
            if (this.value.match(/^#[0-9A-Fa-f]{6}$/)) {
                colorHex.value = this.value;
            }
        });
    }
}
document.addEventListener('DOMContentLoaded', setupColorPickerSync);

// Load product for editing
async function loadProductForEdit(productId) {
    try {
        const response = await fetch(`${API_BASE}/products/${productId}`);
        const data = await response.json();
        
        if (data.success) {
            const product = data.data;
            console.log('Product loaded for editing:', product);
            console.log('Total images for product:', product.total_images);
            console.log('Color count for product:', product.color_count);
            
            // Fill form fields with null checks
            const editProductId = document.getElementById('edit-product-id');
            const editProductName = document.getElementById('edit-product-name');
            const editProductPrice = document.getElementById('edit-product-price');
            const editProductDiscountPrice = document.getElementById('edit-product-discount-price');
            const editProductGender = document.getElementById('edit-product-gender');
            const editProductSizeType = document.getElementById('edit-product-size-type');
            const editProductDescription = document.getElementById('edit-product-description');
            
            if (editProductId) editProductId.value = product.id;
            if (editProductName) editProductName.value = product.name;
            if (editProductPrice) editProductPrice.value = product.price;
            if (editProductDiscountPrice) editProductDiscountPrice.value = product.discount_price || '';
            if (editProductGender) editProductGender.value = product.gender;
            if (editProductSizeType) editProductSizeType.value = product.size_type;
            if (editProductDescription) editProductDescription.value = product.description || '';
            
            // Load categories for select
            const categorySelect = document.getElementById('edit-product-category');
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Select Category</option>';
                console.log('Loading categories for edit. Product category_id:', product.category_id);
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    if (category.id === product.category_id) {
                        option.selected = true;
                    }
                    categorySelect.appendChild(option);
                });
            } else {
                console.error('Edit product category select not found');
            }
            
            // Load sizes
            loadEditSizes(product.sizes);
            
            // Load colors
            loadEditColors(product.colors);
            
        } else {
            showNotification('Error loading product', 'error');
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showNotification('Error loading product', 'error');
    }
}

function loadEditSizes(sizes) {
    const container = document.getElementById('edit-sizes-container');
    if (!container) {
        console.error('Edit sizes container not found');
        return;
    }
    
    container.innerHTML = '';
    
    console.log('Loading edit sizes:', sizes);
    
    if (sizes && sizes.length > 0) {
        sizes.forEach(size => {
            addEditSizeField(size.size_value, size.stock_quantity);
        });
    }
}

function loadEditColors(colors) {
    const container = document.getElementById('edit-colors-container');
    if (!container) {
        console.error('Edit colors container not found');
        return;
    }
    
    container.innerHTML = '';
    
    console.log('Loading edit colors:', colors);
    
    if (colors && colors.length > 0) {
        colors.forEach(color => {
            addEditColorField(color.id, color.name, color.images);
        });
    }
}

function addEditSizeField(defaultValue = '', quantity = 0) {
    const container = document.getElementById('edit-sizes-container');
    if (!container) {
        console.error('Edit sizes container not found');
        return;
    }
    
    const sizeDiv = document.createElement('div');
    sizeDiv.className = 'flex space-x-2 items-center';
    sizeDiv.innerHTML = `
        <input type="text" class="edit-size-input flex-1 px-3 py-2 border border-gray-300 rounded-md" 
               placeholder="Size" value="${defaultValue}" required>
        <input type="number" class="flex-1 px-3 py-2 border border-gray-300 rounded-md" 
               placeholder="Quantity" value="${quantity}" min="0">
        <button type="button" onclick="this.parentElement.remove()" 
                class="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(sizeDiv);
    console.log('Added edit size field with default value:', defaultValue, 'quantity:', quantity);
}

function addEditColorField(colorId = '', colorName = '', existingImages = '') {
    const container = document.getElementById('edit-colors-container');
    if (!container) {
        console.error('Edit colors container not found');
        return;
    }
    
    const colorDiv = document.createElement('div');
    colorDiv.className = 'border border-gray-300 rounded-lg p-4';
    colorDiv.innerHTML = `
        <div class="flex justify-between items-center mb-3">
            <h5 class="font-medium text-gray-800">Color</h5>
            <button type="button" onclick="this.closest('.border').remove()" 
                    class="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="mb-3">
            <select class="edit-color-select w-full px-3 py-2 border border-gray-300 rounded-md" required>
                <option value="">Select Color</option>
            </select>
        </div>
        <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-2">Images (3-10 required)</label>
            <p class="text-xs text-gray-500 mb-2">Blue border = existing images, Green border = new images</p>
            <input type="file" multiple accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-md" 
                   onchange="handleEditImageUpload(this)">
        </div>
        <div class="image-preview grid grid-cols-3 gap-2">
            <!-- Image previews will be shown here -->
        </div>
    `;
    container.appendChild(colorDiv);
    console.log('Added new edit color field container');
    
    // Load colors for the new select
    const select = colorDiv.querySelector('.edit-color-select');
    if (select) {
        console.log('Loading colors for new edit color field. Available colors:', colors.length, 'Pre-selected colorId:', colorId);
        colors.forEach(color => {
            const option = document.createElement('option');
            option.value = color.id;
            option.textContent = color.name;
            if (color.id == colorId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        // Load existing images if available
        if (existingImages) {
            const imagePreview = colorDiv.querySelector('.image-preview');
            const imagePaths = existingImages.split(',');
            
            // Add existing images count label
            const existingCountLabel = document.createElement('p');
            existingCountLabel.className = 'text-xs text-blue-600 mb-2';
            const existingCount = imagePaths.filter(p => p.trim()).length;
            existingCountLabel.textContent = `${existingCount} existing images (click to replace)`;
            imagePreview.parentElement.insertBefore(existingCountLabel, imagePreview);
            
            imagePaths.forEach((imagePath, index) => {
                if (imagePath.trim()) {
                    const img = document.createElement('img');
                    img.src = `http://localhost:7000/uploads/${imagePath.trim()}`;
                    img.className = 'w-full h-20 object-cover rounded';
                    img.alt = `Existing Image ${index + 1}`;
                    img.style.border = '2px solid #3B82F6';
                    imagePreview.appendChild(img);
                }
            });
            
            console.log('Loaded existing images for color:', colorName, 'Images:', imagePaths);
        }
    } else {
        console.error('Color select not found in edit color field');
    }
}

function handleEditImageUpload(input) {
    const files = Array.from(input.files);
    const previewContainer = input.parentElement.nextElementSibling;
    // حاول تلاقي الـ select في نفس الـ parent أو في نفس الـ colorDiv
    let colorSelect = input.closest('.border')?.querySelector('.edit-color-select');
    if (!colorSelect) {
        // fallback: دور في نفس الـ parent
        colorSelect = input.parentElement.parentElement.querySelector('.edit-color-select');
    }
    if (!colorSelect) {
        // fallback: دور في كل الـ parents لحد ما تلاقيه
        let parent = input.parentElement;
        while (parent && !colorSelect) {
            colorSelect = parent.querySelector && parent.querySelector('.edit-color-select');
            parent = parent.parentElement;
        }
    }
    if (!colorSelect) {
        showNotification('حدث خطأ في اختيار اللون. حاول حذف اللون وإضافته من جديد.', 'error');
        input.value = '';
        return;
    }

    console.log('Edit image upload - Color selected:', colorSelect.value, 'Files count:', files.length);

    // Check if a color is selected
    if (!colorSelect.value || colorSelect.value === '' || colorSelect.value === 'Select Color') {
        showNotification('Please select a color first', 'error');
        input.value = '';
        return;
    }

    if (files.length > 0 && files.length < 3) {
        showNotification('At least 3 images are required for each color', 'error');
        input.value = '';
        return;
    }

    if (files.length > 10) {
        showNotification('Maximum 10 images allowed per color', 'error');
        input.value = '';
        return;
    }
    
    previewContainer.innerHTML = '';

    // Add new images count label
    const newCountLabel = document.createElement('p');
    newCountLabel.className = 'text-xs text-green-600 mb-2';
    newCountLabel.textContent = `${files.length} new images selected`;
    previewContainer.parentElement.insertBefore(newCountLabel, previewContainer);

    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'w-full h-20 object-cover rounded';
            img.alt = `New Image ${index + 1}`;
            img.style.border = '2px solid #10B981'; // Green border for new images
            previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}



// Handle edit product form submission
document.addEventListener('DOMContentLoaded', function() {
    const editProductForm = document.getElementById('edit-product-form');
    if (editProductForm) {
        editProductForm.addEventListener('submit', handleEditProduct);
    }
});

async function handleEditProduct(event) {
    event.preventDefault();
    
    console.log('=== Starting handleEditProduct ===');
    
    // Get form elements with null checks
    const productIdElement = document.getElementById('edit-product-id');
    const nameElement = document.getElementById('edit-product-name');
    const priceElement = document.getElementById('edit-product-price');
    const discountPriceElement = document.getElementById('edit-product-discount-price');
    const genderElement = document.getElementById('edit-product-gender');
    const categoryElement = document.getElementById('edit-product-category');
    const sizeTypeElement = document.getElementById('edit-product-size-type');
    const descriptionElement = document.getElementById('edit-product-description');
    
    // Check if all required elements exist
    if (!productIdElement || !nameElement || !priceElement || !genderElement || !categoryElement || !sizeTypeElement) {
        console.error('Required form elements not found');
        showNotification('Form elements not found. Please refresh the page.', 'error');
        return;
    }
    
    const productId = productIdElement.value;
    const formData = new FormData();
    
    // Add basic product data
    formData.append('name', nameElement.value);
    formData.append('price', priceElement.value);
    formData.append('discount_price', discountPriceElement ? discountPriceElement.value : '');
    formData.append('gender', genderElement.value);
    formData.append('category_id', categoryElement.value);
    formData.append('size_type', sizeTypeElement.value);
    formData.append('description', descriptionElement ? descriptionElement.value : '');
    
    // Get sizes and colors
    const sizes = getEditSizesFromForm();
    const colors = getEditColorsFromForm();
    
    // Validate colors have images (only for newly uploaded images)
    const editColorContainers = document.querySelectorAll('#edit-colors-container .border');
    console.log('Total edit color containers found:', editColorContainers.length);
    
    let hasSelectedColors = false;
    let hasNewImages = false;
    
    for (const container of editColorContainers) {
        const colorSelect = container.querySelector('.edit-color-select');
        const imageInput = container.querySelector('input[type="file"]');
        
        // Add null checks for color select and image input
        if (!colorSelect || !imageInput) {
            console.warn('Color select or image input not found in container');
            continue;
        }
        
        console.log('Edit color select value:', colorSelect.value, 'Files count:', imageInput.files.length);
        
        // Check if any color is selected
        if (colorSelect.value && colorSelect.value !== '' && colorSelect.value !== 'Select Color') {
            hasSelectedColors = true;
            
            // Only validate if a color is selected and has new images
            if (imageInput.files.length > 0) {
                hasNewImages = true;
                
                if (imageInput.files.length < 3) {
                    const colorName = colorSelect.options[colorSelect.selectedIndex]?.text || 'Unknown';
                    showNotification(`Color ${colorName} must have at least 3 new images`, 'error');
                    return;
                }
                
                if (imageInput.files.length > 10) {
                    const colorName = colorSelect.options[colorSelect.selectedIndex]?.text || 'Unknown';
                    showNotification(`Color ${colorName} cannot have more than 10 new images`, 'error');
                    return;
                }
            }
        }
    }
    
    // If colors are selected but no new images, that's fine - existing images will be preserved
    console.log('Edit validation - Has selected colors:', hasSelectedColors, 'Has new images:', hasNewImages);
    
    formData.append('sizes', JSON.stringify(sizes));
    formData.append('colors', JSON.stringify(colors));
    
    // Add images (only if new images are uploaded)
    const colorContainers = document.querySelectorAll('#edit-colors-container .border');
    let imageIndex = 0;
    colorContainers.forEach((container, colorIndex) => {
        const colorSelect = container.querySelector('.edit-color-select');
        const imageInput = container.querySelector('input[type="file"]');
        
        // Add null checks for color select and image input
        if (!colorSelect || !imageInput) {
            console.warn('Color select or image input not found in container:', colorIndex);
            return;
        }
        
        console.log('Processing edit color container:', colorIndex, 'Color value:', colorSelect.value, 'Files:', imageInput.files.length);
        
        if (colorSelect.value && colorSelect.value !== '' && colorSelect.value !== 'Select Color' && imageInput.files.length > 0) {
            Array.from(imageInput.files).forEach((file, fileIndex) => {
                formData.append('images', file);
                formData.append(`color_${imageIndex}`, colorSelect.value);
                formData.append(`order_${imageIndex}`, fileIndex);
                imageIndex++;
            });
        }
    });
    
    console.log('Total edit images to be sent:', imageIndex);
    
    try {
        console.log('Sending edit request to:', `${API_BASE}/products/${productId}`);
        const response = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'PUT',
            body: formData
        });
        
        const data = await response.json();
        console.log('Edit response received:', data);
        
        if (data.success) {
            const message = data.message || 'Product updated successfully';
            console.log('Update response message:', message);
            showNotification(message, 'success');
            closeModal('edit-product-modal');
            // Clear filter and reload products
            filteredProducts = [];
            loadProducts();
        } else {
            showNotification(data.message || 'Error updating product', 'error');
        }
    } catch (error) {
        console.error('Error updating product:', error);
        showNotification('Error updating product', 'error');
    }
    
    console.log('=== Finished handleEditProduct ===');
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.add('hidden');
    }
}); 


// ========== CONFIRMATION MODAL ==========
function showConfirmationModal(message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    const msgEl = document.getElementById('confirmation-modal-message');
    const confirmBtn = document.getElementById('confirmation-confirm-btn');
    const cancelBtn = document.getElementById('confirmation-cancel-btn');
    msgEl.textContent = message;
    modal.classList.remove('hidden');

    // Remove previous listeners
    confirmBtn.onclick = null;
    cancelBtn.onclick = null;

    confirmBtn.onclick = function() {
        modal.classList.add('hidden');
        if (typeof onConfirm === 'function') onConfirm();
    };
    cancelBtn.onclick = function() {
        modal.classList.add('hidden');
    };
} 

// ========== IMPROVED ANALYTICS TAB ==========
async function loadAnalytics() {
    await Promise.all([
        renderTopSoldChart(),
        renderTopViewedChart(),
        renderVisitorSourcesChart()
    ]);
}

async function renderTopSoldChart() {
    const ctx = document.getElementById('top-sold-chart').getContext('2d');
    const legendEl = document.getElementById('top-sold-legend');
    try {
        const res = await fetch(`${API_BASE}/products/analytics/top-sold`);
        const data = await res.json();
        if (!data.success || !Array.isArray(data.products)) throw new Error();
        const labels = data.products.map(p => p.name);
        const values = data.products.map(p => p.total_sold);
        const percents = data.products.map(p => p.percent);
        const colors = [
            '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'
        ];
        if (window.topSoldChart) window.topSoldChart.destroy();
        window.topSoldChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Units Sold',
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 8,
                }]
            },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const i = context.dataIndex;
                                return `${labels[i]}: ${values[i]} sold (${percents[i]}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
        // Legend
        legendEl.innerHTML = data.products.map((p, i) =>
            `<div class="flex items-center mb-1"><span class="inline-block w-3 h-3 rounded-full mr-2" style="background:${colors[i]}"></span>${p.name}: <span class="font-semibold ml-1">${p.total_sold}</span> (<span class="text-green-700">${p.percent}%</span>)</div>`
        ).join('');
    } catch {
        legendEl.innerHTML = '<span class="text-red-500">No sales data available.</span>';
    }
}

async function renderTopViewedChart() {
    const ctx = document.getElementById('top-viewed-chart').getContext('2d');
    const legendEl = document.getElementById('top-viewed-legend');
    try {
        const res = await fetch(`${API_BASE}/products/analytics/top-viewed`);
        const data = await res.json();
        if (!data.success || !Array.isArray(data.products)) throw new Error();
        const labels = data.products.map(p => p.name);
        const values = data.products.map(p => p.views);
        const percents = data.products.map(p => p.percent);
        const colors = [
            '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'
        ];
        if (window.topViewedChart) window.topViewedChart.destroy();
        window.topViewedChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Views',
                    data: values,
                    backgroundColor: colors,
                    borderRadius: 8,
                }]
            },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const i = context.dataIndex;
                                return `${labels[i]}: ${values[i]} views (${percents[i]}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
        // Legend
        legendEl.innerHTML = data.products.map((p, i) =>
            `<div class="flex items-center mb-1"><span class="inline-block w-3 h-3 rounded-full mr-2" style="background:${colors[i]}"></span>${p.name}: <span class="font-semibold ml-1">${p.views}</span> (<span class="text-blue-700">${p.percent}%</span>)</div>`
        ).join('');
    } catch {
        legendEl.innerHTML = '<span class="text-red-500">No view data available.</span>';
    }
}

async function renderVisitorSourcesChart() {
    const ctx = document.getElementById('visitor-sources-chart').getContext('2d');
    const legendEl = document.getElementById('visitor-sources-legend');
    try {
        const res = await fetch(`${API_BASE}/products/analytics/visitor-sources`);
        const data = await res.json();
        if (!data.success || !Array.isArray(data.sources)) throw new Error();
        const labels = data.sources.map(s => s.source || 'Direct');
        const values = data.sources.map(s => s.count);
        const percents = data.sources.map(s => s.percent);
        const colors = [
            '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE', '#F472B6', '#FBBF24', '#6EE7B7'
        ];
        if (window.visitorSourcesChart) window.visitorSourcesChart.destroy();
        window.visitorSourcesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                }]
            },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const i = context.dataIndex;
                                return `${labels[i]}: ${values[i]} visits (${percents[i]}%)`;
                            }
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
        // Legend
        legendEl.innerHTML = data.sources.map((s, i) =>
            `<div class="flex items-center mb-1"><span class="inline-block w-3 h-3 rounded-full mr-2" style="background:${colors[i]}"></span>${labels[i]}: <span class="font-semibold ml-1">${s.count}</span> (<span class="text-purple-700">${s.percent}%</span>)</div>`
        ).join('');
    } catch {
        legendEl.innerHTML = '<span class="text-red-500">No visitor data available.</span>';
    }
}

// Add Analytics tab click event
function setupAnalyticsTab() {
    document.getElementById('sidebar-analytics-link').addEventListener('click', function(e) {
        e.preventDefault();
        showTab('analytics');
        closeSidebarOnMobile();
        loadAnalytics();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setupAnalyticsTab();
}); 

// Filter products by category
function filterProductsByCategory(categoryId) {
    const searchTerm = document.getElementById('products-search-input').value.toLowerCase();
    
    if (!categoryId) {
        // Show all products or apply search only
        if (searchTerm === '') {
            filteredProducts = [];
        } else {
            filteredProducts = products.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.category_name.toLowerCase().includes(searchTerm) ||
                product.gender.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm))
            );
        }
    } else {
        // Apply category filter
        let filtered = products.filter(product => product.category_id == categoryId);
        
        // Apply search filter if there's a search term
        if (searchTerm !== '') {
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.category_name.toLowerCase().includes(searchTerm) ||
                product.gender.toLowerCase().includes(searchTerm) ||
                (product.description && product.description.toLowerCase().includes(searchTerm))
            );
        }
        
        filteredProducts = filtered;
    }
    displayProducts();
}

// Clear product filter
function clearProductFilter() {
    const filterSelect = document.getElementById('product-category-filter');
    if (filterSelect) {
        filterSelect.value = '';
    }
    // Re-apply search if exists
    const searchTerm = document.getElementById('products-search-input').value.toLowerCase();
    if (searchTerm !== '') {
        filteredProducts = products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.category_name.toLowerCase().includes(searchTerm) ||
            product.gender.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );
    } else {
        filteredProducts = [];
    }
    displayProducts();
}

// Clear product search
function clearProductSearch() {
    const searchInput = document.getElementById('products-search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    // Re-apply category filter if exists
    const categoryFilter = document.getElementById('product-category-filter').value;
    if (categoryFilter) {
        filteredProducts = products.filter(product => product.category_id == categoryFilter);
    } else {
        filteredProducts = [];
    }
    displayProducts();
}

// Load categories for filter dropdown
async function loadCategoriesForFilter() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        const data = await response.json();
        
        if (data.success) {
            const filterSelect = document.getElementById('product-category-filter');
            if (filterSelect) {
                // Clear existing options except "All Categories"
                filterSelect.innerHTML = '<option value="">All Categories</option>';
                
                // Add category options
                data.data.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    filterSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading categories for filter:', error);
    }
}