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

    const API_BASE = 'http://localhost:7000/api';

    // --- Checkout Modal Logic ---
    let enabledPaymentMethods = [];
    let selectedPaymentMethod = null;

    // Show checkout modal on button click
    checkoutBtn.addEventListener('click', function() {
        // Enforce login
        if (!localStorage.getItem('token')) {
            localStorage.setItem('redirectAfterLogin', 'cart.html');
            window.location.href = 'login.html';
            return;
        }
        // Require at least one payment method
        if (!enabledPaymentMethods.length) {
            alert('No payment methods available.');
            return;
        }
        // Require cart not empty
        if (!cart.length) {
            alert('Your cart is empty.');
            return;
        }
        showCheckoutModal();
    });

    function showCheckoutModal() {
        document.getElementById('checkout-modal').classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        renderCheckoutPaymentMethods();
        document.getElementById('checkout-message').textContent = '';
        document.getElementById('checkout-form').reset();
        document.getElementById('checkout-receipt-upload').classList.add('hidden');
        selectedPaymentMethod = null;
    }
    document.getElementById('close-checkout-modal').onclick = function() {
        document.getElementById('checkout-modal').classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    };

    function renderCheckoutPaymentMethods() {
        const container = document.getElementById('checkout-payment-methods');
        container.innerHTML = enabledPaymentMethods.map(m => `
            <label class="flex items-center space-x-2">
                <input type="radio" name="payment_method" value="${m.method_name}" class="payment-method-radio">
                <span>${m.method_name === 'vodafone_cash' ? 'Vodafone Cash' : m.method_name === 'instapay' ? 'InstaPay' : 'Cash on Delivery'}</span>
            </label>
        `).join('');
        // Listen for selection
        container.querySelectorAll('input[type=radio]').forEach(radio => {
            radio.addEventListener('change', function() {
                selectedPaymentMethod = this.value;
                // Show/hide receipt upload
                if (selectedPaymentMethod === 'vodafone_cash' || selectedPaymentMethod === 'instapay') {
                    document.getElementById('checkout-receipt-upload').classList.remove('hidden');
                } else {
                    document.getElementById('checkout-receipt-upload').classList.add('hidden');
                }
            });
        });
    }

    // Handle checkout form submit
    document.getElementById('checkout-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const address = document.getElementById('checkout-address').value.trim();
        const phone = document.getElementById('checkout-phone').value.trim();
        const receiptInput = document.getElementById('checkout-receipt');
        // Validate
        if (!selectedPaymentMethod) {
            showCheckoutMessage('Please select a payment method.', 'error');
            return;
        }
        if (!address || !phone) {
            showCheckoutMessage('Please enter address and phone.', 'error');
            return;
        }
        if ((selectedPaymentMethod === 'vodafone_cash' || selectedPaymentMethod === 'instapay') && !receiptInput.files.length) {
            showCheckoutMessage('Please upload a payment confirmation file.', 'error');
            return;
        }
        // Prepare form data
        const formData = new FormData();
        formData.append('payment_method', selectedPaymentMethod);
        formData.append('address', address);
        formData.append('phone', phone);
        formData.append('items', JSON.stringify(cart.map(item => ({
            product_id: item.productId,
            product_name: item.productName,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: item.price
        }))));
        if (receiptInput.files.length) {
            formData.append('receipt', receiptInput.files[0]);
        }
        // Send to backend
        try {
            const res = await fetch(`${API_BASE}/orders`, {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                showCheckoutMessage('Order placed successfully!', 'success');
                localStorage.removeItem('cart');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1200);
            } else {
                showCheckoutMessage(data.message || 'Order failed.', 'error');
            }
        } catch (err) {
            showCheckoutMessage('Order failed. Please try again.', 'error');
        }
    });

    function showCheckoutMessage(msg, type) {
        const el = document.getElementById('checkout-message');
        el.textContent = msg;
        el.className = 'mb-2 text-sm ' + (type === 'success' ? 'text-green-600' : 'text-red-600');
    }

    // --- End Checkout Modal Logic ---

    // Fetch and display enabled payment methods
    async function loadAndDisplayPaymentMethods() {
        const section = document.getElementById('payment-methods-section');
        section.innerHTML = '<div class="text-gray-500 text-sm">Loading payment methods...</div>';
        try {
            const response = await fetch(`${API_BASE}/payment-methods`);
            const data = await response.json();
            if (!data.success) throw new Error('API error');
            const methods = data.data.filter(m => m.enabled);
            enabledPaymentMethods = methods;
            if (methods.length === 0) {
                section.innerHTML = '<div class="text-red-500 text-sm">No payment methods are currently available.</div>';
                return;
            }
            section.innerHTML = '<h3 class="font-semibold text-gray-800 mb-2">Payment Methods</h3>' +
                methods.map(m => renderPaymentMethod(m)).join('');
        } catch (err) {
            section.innerHTML = '<div class="text-red-500 text-sm">Failed to load payment methods.</div>';
        }
    }

    function renderPaymentMethod(method) {
        if (method.method_name === 'vodafone_cash') {
            return `<div class="mb-2 p-2 border rounded bg-gray-50">
                <span class="font-medium">Vodafone Cash</span><br>
                <span class="text-xs text-gray-600">Phone: ${method.phone_number || 'N/A'}</span>
            </div>`;
        } else if (method.method_name === 'instapay') {
            let details = [];
            if (method.phone_number) details.push('Phone: ' + method.phone_number);
            if (method.visa_card) details.push('Visa: ' + method.visa_card);
            if (method.email) details.push('Email: ' + method.email);
            return `<div class="mb-2 p-2 border rounded bg-gray-50">
                <span class="font-medium">InstaPay</span><br>
                <span class="text-xs text-gray-600">${details.length ? details.join(' | ') : 'No details provided'}</span>
            </div>`;
        } else if (method.method_name === 'cash_on_delivery') {
            return `<div class="mb-2 p-2 border rounded bg-gray-50">
                <span class="font-medium">Cash on Delivery</span><br>
                <span class="text-xs text-gray-600">Pay with cash upon delivery</span>
            </div>`;
        }
        return '';
    }

    renderCart();
    loadAndDisplayPaymentMethods();
});
