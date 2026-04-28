//Получаем избранное
function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
}
//Сохраняем избранное
function saveFavorites(favorites) {
    localStorage.setItem("favorites", JSON.stringify(favorites));
}

function toggleFavorite(productId) {
    const id = String(productId);
    let favorites = getFavorites();

    const isFav = favorites.includes(id);

    if (isFav) {
        favorites = favorites.filter(f => f !== id);
    } else {
        favorites.push(id);
    }

    saveFavorites(favorites);

    syncFavoritesUI();
    updateFavoritesBadge();

    const card = document.getElementById(`fav-${id}`);
    if (card && isFav && card.closest("#favorites-grid")) {
        card.remove();
        checkEmptyFavorites();
    }
}

// Бейдж ТОЛЬКО избранного
function updateFavoritesBadge() {
    const favorites = getFavorites();
    const badge = document.getElementById("fav-count");

    if (!badge) return;

    badge.textContent = favorites.length;
    badge.style.display = favorites.length ? "flex" : "none";
}

// Пустое состояние
function checkEmptyFavorites() {
    const grid = document.getElementById("favorites-grid");
    const empty = document.getElementById("empty-favorites");

    if (!grid) return;

    if (grid.children.length === 0) {
        grid.style.display = "none";
        if (empty) empty.style.display = "block";
    }
}


//Рендер карточек в каталоге
function renderFavorites(products, grid) {
    grid.innerHTML = "";
    const favorites = getFavorites();

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

            <button class="favorite-btn ${isFav ? 'active' : ''}" data-id="${product.id}" type="button"> 
                <img src="../static/icons/icon-cards/favorite.svg" class="heart-empty">
                <img src="../static/icons/icon-cards/fav-full.svg" class="heart-full">
            </button>

            <div class="item-bottom">
                <a href="/products/${product.id}" class="product-title-link">
                    <h2 class="product-title">${product.name}</h2>
                </a>

                <div class="price-cart">
                    <span class="price">
                        ${Number(product.price).toLocaleString()} ₸
                    </span>

                    <button class="cart-btn" data-id="${product.id}">
                        <img src="../static/icons/icon-cards/basket.svg">
                    </button>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
    
    syncFavoritesUI();
}

function syncFavoritesUI() {
    const favorites = getFavorites();

    document.querySelectorAll(".favorite-btn").forEach(btn => {
        const id = String(btn.dataset.id);

        btn.classList.toggle("active", favorites.includes(id));
    });
}

//Делегирование клика
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".favorite-btn");
    if (!btn) return;

    e.preventDefault();

    toggleFavorite(btn.dataset.id);
});

//Страничка продукта: картинки(главная и маленькие) их логика в целом
document.addEventListener("DOMContentLoaded", async () => {
    //Карточки для нескольких фотографии для страницы продукта
    const mainImage = document.querySelector('.main-image img');
    const thumbnails = document.querySelectorAll('.thumb');

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function () {
            const newSrc = this.querySelector('img').src;

            if (mainImage) {
                mainImage.src = newSrc;
            }

            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    //Избранное (инициализация)
    const favorites = getFavorites();

    document.querySelectorAll(".favorite-btn").forEach(btn => {
        const id = btn.dataset.id;
        if (favorites.includes(String(id))) {
            btn.classList.add("active");
        }
    });

    updateFavoritesBadge();


    //Страница избранного
    const grid = document.getElementById("favorites-grid");
    const empty = document.getElementById("empty-favorites");

    if (!grid) return;

    if (favorites.length === 0) {
        if (empty) empty.style.display = "block";
        grid.style.display = "none";
        return;
    }

    const res = await fetch(`/products?ids=${favorites.join(",")}`);
    const products = await res.json();

    if (!products.length) {
        if (empty) empty.style.display = "block";
        grid.style.display = "none";
        return;
    }

    if (empty) empty.style.display = "none";
    grid.style.display = "grid";

    renderFavorites(products, grid);
    updateFavoritesBadge();
});
