// Dynamic Shopping Cart System

document.addEventListener('DOMContentLoaded', function() {
    const cartContainer = document.getElementById('cart-items-container');
    const cartCount = document.getElementById('cart-items-count');
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const totalEl = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const emptyCartEl = document.getElementById('empty-cart');

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');

    function renderCart() {
        // Remove all children except emptyCartEl
        cartContainer.innerHTML = '';
        if (cart.length === 0) {
            emptyCartEl.style.display = '';
            cartCount.textContent = '0';
            subtotalEl.textContent = '$0.00';
            shippingEl.textContent = '$0.00';
            totalEl.textContent = '$0.00';
            checkoutBtn.disabled = true;
            return;
        }
        emptyCartEl.style.display = 'none';
        cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        let subtotal = 0;
        cart.forEach((item, idx) => {
            const itemPrice = parseFloat(item.price) * item.quantity;
            subtotal += itemPrice;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'flex flex-col sm:flex-row items-center gap-6 p-6';
            itemDiv.innerHTML = `
                <img src="${item.image ? 'http://localhost:7000/uploads/' + item.image : 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=100&h=100&fit=crop'}" alt="${item.productName}" class="w-24 h-24 object-cover rounded-lg border border-gray-200">
                <div class="flex-1 w-full">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <div class="font-semibold text-lg text-gray-900">${item.productName}</div>
                            <div class="text-sm text-gray-500">Size: <span>${item.size}</span></div>
                            <div class="text-sm text-gray-500 flex items-center gap-2">Color: ${renderColorSelector(item, idx)}</div>
                        </div>
                        <div class="flex items-center gap-2 mt-2 sm:mt-0">
                            <button class="quantity-btn px-2 py-1 border rounded text-lg" data-idx="${idx}" data-action="decrement">-</button>
                            <input type="number" min="1" class="quantity-input w-12 text-center border rounded" value="${item.quantity}" data-idx="${idx}">
                            <button class="quantity-btn px-2 py-1 border rounded text-lg" data-idx="${idx}" data-action="increment">+</button>
                        </div>
                        <div class="font-semibold text-gray-900">$${parseFloat(item.price).toFixed(2)}</div>
                        <div class="font-bold text-gray-900">$${itemPrice.toFixed(2)}</div>
                        <button class="remove-btn text-red-500 hover:underline ml-4" data-idx="${idx}">Remove</button>
                    </div>
                </div>
            `;
            cartContainer.appendChild(itemDiv);
        });
        // Update summary
        subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        const shipping = subtotal > 0 ? 0 : 0; // Free shipping for now
        shippingEl.textContent = `$${shipping.toFixed(2)}`;
        totalEl.textContent = `$${(subtotal + shipping).toFixed(2)}`;
        checkoutBtn.disabled = false;
    }

    // Enhanced: render color selector as dropdown if availableColors present
    function renderColorSelector(item, idx) {
        if (item.availableColors && Array.isArray(item.availableColors) && item.availableColors.length > 1) {
            let options = item.availableColors.map(colorObj => {
                const selected = colorObj.name === item.color ? 'selected' : '';
                return `<option value="${colorObj.name}" data-idx="${idx}" ${selected}>${colorObj.name}</option>`;
            }).join('');
            return `<select class="color-select border rounded px-2 py-1" data-idx="${idx}">${options}</select>`;
        } else {
            // fallback: just show color name
            return `<span class="inline-block w-4 h-4 rounded-full border border-gray-300 align-middle mr-1" style="background:${getColorHex(item.color)}"></span> <span>${item.color}</span>`;
        }
    }

    function getColorHex(colorName) {
        // Simple color map
        const colorMap = {
            'red': '#FF0000', 'blue': '#0000FF', 'green': '#00FF00', 'black': '#000', 'white': '#fff', 'yellow': '#FF0', 'gray': '#888', 'pink': '#FFC0CB'
        };
        return colorMap[colorName.toLowerCase()] || '#CCC';
    }

    // Event delegation for quantity and remove
    cartContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-btn')) {
            const idx = parseInt(e.target.getAttribute('data-idx'));
            const action = e.target.getAttribute('data-action');
            if (action === 'decrement' && cart[idx].quantity > 1) {
                cart[idx].quantity--;
            } else if (action === 'increment') {
                cart[idx].quantity++;
            }
            saveCart();
            renderCart();
        } else if (e.target.classList.contains('remove-btn')) {
            const idx = parseInt(e.target.getAttribute('data-idx'));
            cart.splice(idx, 1);
            saveCart();
            renderCart();
        }
    });

    // Event delegation for quantity input
    cartContainer.addEventListener('input', function(e) {
        if (e.target.classList.contains('quantity-input')) {
            const idx = parseInt(e.target.getAttribute('data-idx'));
            let val = parseInt(e.target.value);
            if (isNaN(val) || val < 1) val = 1;
            cart[idx].quantity = val;
            saveCart();
            renderCart();
        }
    });

    // Handle color change
    cartContainer.addEventListener('change', function(e) {
        if (e.target.classList.contains('color-select')) {
            const idx = parseInt(e.target.getAttribute('data-idx'));
            const newColor = e.target.value;
            const item = cart[idx];
            if (item.color === newColor) return; // no change
            // Find if another cart item with same productId, size, and newColor exists
            const mergeIdx = cart.findIndex((it, i) => i !== idx && it.productId === item.productId && it.size === item.size && it.color === newColor);
            if (mergeIdx !== -1) {
                // Merge quantities
                cart[mergeIdx].quantity += item.quantity;
                cart.splice(idx, 1);
            } else {
                // Change color
                item.color = newColor;
                // Optionally update image if available
                if (item.availableColors) {
                    const colorObj = item.availableColors.find(c => c.name === newColor);
                    if (colorObj && colorObj.image) item.image = colorObj.image;
                }
            }
            saveCart();
            renderCart();
        }
    });

    // (Optional) Color change logic can be added here if you want to allow changing color in cart

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        document.dispatchEvent(new Event('cart-updated'));
        if (typeof updateCartBadge === 'function') updateCartBadge();
    }

    renderCart();
});
