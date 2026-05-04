// Сохраняем / удаляем избранное
function safeIsLoggedIn() {
    return typeof isLoggedIn === "function" && isLoggedIn();
}

async function toggleFavorite(productId) {
    const id = String(productId);

    if (typeof isLoggedIn === "function" && isLoggedIn()) {
        await fetch(`/api/favorites/${id}`, {
            method: "POST",
            credentials: "include"
        });
    } else {
        let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

        if (favorites.includes(id)) {
            favorites = favorites.filter(f => f !== id);
        } else {
            favorites.push(id);
        }

        localStorage.setItem("favorites", JSON.stringify(favorites));
    }

    await syncFavoritesUI();
    await updateFavoritesBadge();
}

// Получить избранное
async function getFavorites() {
    const isAuth = safeIsLoggedIn();

    if (isAuth) {
        try {
            const res = await fetch("/api/favorites", {
                credentials: "include"
            });

            if (res.ok) {
                const data = await res.json();
                return data.map(String);
            }
        } catch { }
    }

    // если не авторизован — берём localStorage
    return JSON.parse(localStorage.getItem("favorites") || "[]");
}


// Обновление бейджа
async function updateFavoritesBadge() {
    const badge = document.getElementById("fav-count");
    if (!badge) return;

    const favorites = await getFavorites();

    badge.textContent = favorites.length;
    badge.style.display = favorites.length ? "flex" : "none";
}


// Проверка пустого состояния (страница favorites)
function checkEmptyFavorites() {
    const grid = document.getElementById("favorites-grid");
    const empty = document.getElementById("empty-favorites");

    if (!grid || !empty) return;

    const hasItems = grid.children.length > 0;

    grid.style.display = hasItems ? "grid" : "none";
    empty.style.display = hasItems ? "none" : "block";
}


// Рендер избранного
async function renderFavorites(products, grid) {
    if (!grid) return;
    grid.innerHTML = "";

    const favorites = await getFavorites();

    products.forEach(product => {
        const isFav = favorites.includes(String(product.id));

        const image = Array.isArray(product.images) && product.images.length
            ? product.images[0]
            : product.images || "/static/images/default.jpg";

        const card = document.createElement("div");
        card.className = "carousel-item";
        card.id = `fav-${product.id}`;

        card.innerHTML = `
            <div class="item-top">
                <img src="${image}" alt="${product.name}">
            </div>

            <button class="favorite-btn ${isFav ? "active" : ""}" data-id="${product.id}" type="button">
                <img src="/static/icons/icon-cards/favorite.svg" class="heart-empty">
                <img src="/static/icons/icon-cards/fav-full.svg" class="heart-full">
            </button>

            <div class="item-bottom">
                <a href="/products/${product.id}" class="product-title-link">
                    <h2 class="product-title">${product.name}</h2>
                </a>

                <div class="price-cart">
                    <span class="price">${Number(product.price).toLocaleString()} ₸</span>
                    <button class="cart-btn" data-id="${product.id}">
                        <img src="/static/icons/icon-cards/basket.svg">
                    </button>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });

    await syncFavoritesUI();
    await updateFavoritesBadge();
    checkEmptyFavorites();
}


// Синхронизация UI сердечек
async function syncFavoritesUI() {
    const favorites = await getFavorites();

    document.querySelectorAll(".favorite-btn").forEach(btn => {
        const id = String(btn.dataset.id);
        btn.classList.toggle("active", favorites.includes(id));
    });
}


// Делегирование клика (ОДИН РАЗ НА ВСЁ ПРИЛОЖЕНИЕ)
document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".favorite-btn");
    if (!btn) return;

    e.preventDefault();

    const productId = btn.dataset.id;

    // 🔥 проверяем: мы на странице избранного?
    const isFavoritesPage = document.getElementById("favorites-grid");

    // 🔥 если карточка уже была в избранном — значит сейчас будет удаление
    const wasActive = btn.classList.contains("active");

    await window.toggleFavorite?.(productId);

    // 💥 если это страница избранного и был удалён
    if (isFavoritesPage && wasActive) {
        const card = document.getElementById(`fav-${productId}`);
        if (card) {
            card.remove(); // 🔥 удаляем сразу из DOM
        }

        checkEmptyFavorites(); // обновляем "пусто"
    }
});




// МЕРДЖ после логина
async function mergeFavoritesAfterLogin() {
    const localFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");

    if (localFavorites.length === 0) return;

    await fetch("/api/favorites/merge", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ ids: localFavorites })
    });

    localStorage.removeItem("favorites");
}


// Инициализация страницы favorites
document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.getElementById("favorites-grid");

    if (!grid) return;

    const favIds = await getFavorites();

    if (favIds.length === 0) {
        checkEmptyFavorites();
        return;
    }

    const response = await fetch(`/products?ids=${favIds.join(",")}`);
    const products = await response.json();

    await renderFavorites(products, grid);
    await updateCartBadge();
});

window.toggleFavorite = toggleFavorite;
window.getFavorites = getFavorites;
window.syncFavoritesUI = syncFavoritesUI;
window.updateFavoritesBadge = updateFavoritesBadge;