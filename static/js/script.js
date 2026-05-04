// Глобальные утилиты
function setBadge(id, value) {
    const el = document.getElementById(id);
    if (!el) return;

    el.textContent = value;
    el.style.display = value > 0 ? "inline-flex" : "none";
}

// Корзина
async function updateCartBadge() {
    const res = await fetch("/api/cart/items", { credentials: "include" });
    if (!res.ok) return;

    const items = await res.json();
    const total = items.reduce((sum, i) => sum + i.quantity, 0);

    setBadge("cart-count", total);
}

// Избранное
function updateFavBadge() {
    const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
    setBadge("fav-count", favs.length);
}

document.addEventListener("DOMContentLoaded", () => {
    updateCartBadge();
    updateFavBadge();
});

document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-add-to-cart");
    if (!btn) return;

    const productId = btn.dataset.id;

    const qtyInput = document.getElementById("product-qty");
    const quantity = qtyInput ? Number(qtyInput.value) : 1;

    try {
        const res = await fetch("/api/cart/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                product_id: Number(productId),
                quantity: quantity
            }),
            credentials: "include"
        });

        if (res.status === 401) {
            window.location.href = "/login";
            return;
        }

        if (res.ok) {
            btn.classList.add("in-cart");

            const badge = document.getElementById("cart-count");
            if (badge) {
                const current = Number(badge.textContent || 0);
                setBadge("cart-count", current + quantity);
            }

            syncCartButtons();
            updateCartBadge(); // синхронизация с сервером
        }

    } catch (err) {
        console.error(err);
    }
});

