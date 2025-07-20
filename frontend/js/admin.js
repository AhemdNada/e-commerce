// Global variables
let currentTab = 'categories';
let categories = [];
let products = [];
let colors = [];

// API Base URL
const API_BASE = 'http://localhost:7000/api';

// === Update navbar categories ===
function updateNavbarCategories() {
    if (window.navbarUtils && window.navbarUtils.loadCategoriesForNavbar) {
        console.log('Updating navbar after category operation...');
        window.navbarUtils.loadCategoriesForNavbar();
    } else {
        console.log('navbarUtils not available for navbar update');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing application...');
    console.log('API Base URL:', API_BASE);
    
    // Test API connection first
    testAPIConnection().then(() => {
        loadCategories();
        loadColors();
        loadProducts();
        setupEventListeners();
    });
});

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

// Setup event listeners
function setupEventListeners() {
    // Category forms
    document.getElementById('add-category-form').addEventListener('submit', handleAddCategory);
    document.getElementById('edit-category-form').addEventListener('submit', handleEditCategory);
    
    // Product form
    document.getElementById('add-product-form').addEventListener('submit', handleAddProduct);
    
    // Color form
    document.getElementById('add-color-form').addEventListener('submit', handleAddColor);
    
    // Size type change
    document.getElementById('size-type').addEventListener('change', handleSizeTypeChange);
}

// Tab Management
function showTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-primary', 'text-primary');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    
    event.target.classList.add('active', 'border-primary', 'text-primary');
    event.target.classList.remove('border-transparent', 'text-gray-500');
    
    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    
    // Load data for the tab
    if (tabName === 'categories') {
        loadCategories();
    } else if (tabName === 'products') {
        loadProducts();
    } else if (tabName === 'colors') {
        loadColors();
    }
}

// Modal Management
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

// Categories Management
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

function displayCategories() {
    const container = document.getElementById('categories-list');
    
    if (categories.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No categories found</p>';
        return;
    }
    
    container.innerHTML = categories.map(category => `
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div>
                <h3 class="font-semibold text-gray-800">${category.name}</h3>
                <p class="text-sm text-gray-500">Created: ${new Date(category.created_at).toLocaleDateString()}</p>
            </div>
            <div class="flex space-x-2">
                <button onclick="showEditCategoryModal(${JSON.stringify(category).replace(/"/g, '&quot;')})" 
                        class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
                    <i class="fas fa-edit mr-1"></i>Edit
                </button>
                <button onclick="deleteCategory(${category.id})" 
                        class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">
                    <i class="fas fa-trash mr-1"></i>Delete
                </button>
            </div>
        </div>
    `).join('');
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
        } else {
            showNotification(data.message || 'Error deleting category', 'error');
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        showNotification('Error deleting category', 'error');
    }
}

// Colors Management
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
    
    if (colors.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No colors found</p>';
        return;
    }
    
    container.innerHTML = colors.map(color => `
        <div class="bg-white p-4 rounded-lg shadow border">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                    <div class="w-6 h-6 rounded-full border" style="background-color: ${color.hex_code || '#ccc'}"></div>
                    <h3 class="font-semibold text-gray-800">${color.name}</h3>
                </div>
                <div class="flex space-x-1">
                    <button onclick="editColor(${color.id})" class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteColor(${color.id})" class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${color.hex_code ? `<p class="text-xs text-gray-500">${color.hex_code}</p>` : ''}
        </div>
    `).join('');
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

// Products Management
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        const data = await response.json();
        
        if (data.success) {
            products = data.data;
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
    
    if (products.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No products found</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="bg-white p-6 rounded-lg shadow border">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-lg font-semibold text-gray-800">${product.name}</h3>
                    <p class="text-sm text-gray-500">Category: ${product.category_name}</p>
                    <p class="text-sm text-gray-500">Gender: ${product.gender}</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="showEditProductModal(${product.id})" class="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button onclick="deleteProduct(${product.id})" class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <p class="text-sm font-medium text-gray-700">Price</p>
                    <p class="text-lg font-bold text-gray-800">$${product.price}</p>
                    ${product.discount_price ? `<p class="text-sm text-green-600">Sale: $${product.discount_price}</p>` : ''}
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-700">Size Type</p>
                    <p class="text-sm text-gray-600">${product.size_type}</p>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-700">Colors</p>
                    <p class="text-sm text-gray-600">${product.colors || 'None'}</p>
                    ${product.colors ? `<p class="text-xs text-blue-600">${product.color_count || 0} colors, ${product.total_images || 0} images</p>` : ''}
                </div>
            </div>
            ${product.description ? `<p class="text-sm text-gray-600 mt-2">${product.description}</p>` : ''}
        </div>
    `).join('');
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

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notification-message');
    
    messageEl.textContent = message;
    
    // Update styling based on type
    const container = notification.querySelector('div');
    container.className = `bg-white border-l-4 shadow-lg rounded-lg p-4 max-w-sm ${
        type === 'success' ? 'border-green-500' : 'border-red-500'
    }`;
    
    const icon = notification.querySelector('i');
    icon.className = `fas ${
        type === 'success' ? 'fa-check-circle text-green-500' : 'fa-exclamation-circle text-red-500'
    }`;
    
    notification.classList.remove('hidden');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

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