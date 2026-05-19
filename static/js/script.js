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

