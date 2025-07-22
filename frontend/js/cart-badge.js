// Cart Badge Updater
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    document.querySelectorAll('#cart-count').forEach(el => {
        el.textContent = total;
    });
}

// Listen for localStorage changes (cross-tab)
window.addEventListener('storage', function(e) {
    if (e.key === 'cart') updateCartBadge();
});

// Listen for custom cart update events (same tab)
document.addEventListener('cart-updated', updateCartBadge);

// Initial update on page load
document.addEventListener('DOMContentLoaded', updateCartBadge); 