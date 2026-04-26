//Страничка продукта: картинки(главная и маленькие) их логика в целом
document.addEventListener('DOMContentLoaded', () => {
    const mainImage = document.querySelector('.main-image img');
    const thumbnails = document.querySelectorAll('.thumb');

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function () {
            const newSrc = this.querySelector('img').src;

            mainImage.src = newSrc;

            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
}

function saveFavorites(fav) {
    localStorage.setItem("favorites", JSON.stringify(fav));
}

function toggleFavorite(productId, btn = null) {
    const id = String(productId);
    let favorites = getFavorites();

    const isFav = favorites.includes(id);

    if (isFav) {
        favorites = favorites.filter(f => f !== id);
    } else {
        favorites.push(id);
    }

    saveFavorites(favorites);

    document.querySelectorAll(`.favorite-btn[data-id="${id}"]`)
        .forEach(el => el.classList.toggle("active", !isFav));

    updateBadges();

    const card = document.getElementById(`fav-${id}`);
    if (card && isFav) {
        card.remove();
        checkEmptyFavorites();
    }

    // синхронизация между вкладками
    localStorage.setItem("favorites_updated", Date.now());
}

function updateBadges() {
    const favorites = getFavorites();
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    const favBadge = document.getElementById("fav-count");
    const cartBadge = document.getElementById("cart-count");

    if (favBadge) {
        favBadge.textContent = favorites.length;
        favBadge.style.display = favorites.length ? "flex" : "none";
    }

    if (cartBadge) {
        cartBadge.textContent = cart.length;
        cartBadge.style.display = cart.length ? "flex" : "none";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const favorites = getFavorites();

    document.querySelectorAll(".favorite-btn").forEach(btn => {
        const id = btn.dataset.id;
        if (favorites.includes(String(id))) {
            btn.classList.add("active");
        }
    });

    updateBadges();
});

function checkEmptyFavorites() {
    const grid = document.getElementById("favorites-grid");
    const empty = document.getElementById("empty-favorites");

    if (!grid) return;

    if (grid.children.length === 0) {
        grid.style.display = "none";
        if (empty) empty.style.display = "block";
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.getElementById("favorites-grid");
    const empty = document.getElementById("empty-favorites");

    if (!grid) return;

    const favorites = getFavorites();

    if (favorites.length === 0) {
        if (empty) empty.style.display = "block";
        grid.style.display = "none";
        return;
    }

    const res = await fetch("/products");
    const products = await res.json();

    const favProducts = products.filter(p =>
        favorites.includes(String(p.id))
    );

    if (!favProducts.length) {
        if (empty) empty.style.display = "block";
        grid.style.display = "none";
        return;
    }

    if (empty) empty.style.display = "none";
    grid.style.display = "grid";

    renderFavorites(favProducts, grid);
});

function renderFavorites(products, grid) {
    grid.innerHTML = "";

    const favorites = getFavorites();

    products.forEach(product => {
        const isFav = favorites.includes(String(product.id));

        const image =
            Array.isArray(product.images) && product.images.length
                ? product.images[0]
                : product.images || "/static/images/default.jpg";

        const card = document.createElement("div");
        card.className = "carousel-item";
        card.id = `fav-${product.id}`;

        card.innerHTML = `
            <a href="/products/${product.id}" class="main-card-link">

                <div class="item-top">
                    <img src="${image}" alt="${product.name}">
                    ${product.status ? `
                        <div class="status-badge available">${product.status}</div>
                    ` : ""}
                </div>

                <div class="item-bottom">
                    <h2 class="product-title">${product.name}</h2>

                    <div class="price-cart">
                        <span class="price">
                            ${Number(product.price).toLocaleString()} ₸
                        </span>

                        <button class="cart-btn"
                            onclick="event.preventDefault(); addToCart(${product.id})">
                            <img src="../static/icons/icon-cards/basket.svg">
                        </button>
                    </div>
                </div>

            </a>

            <button class="favorite-btn ${isFav ? "active" : ""}"
                data-id="${product.id}"
                onclick="event.preventDefault(); toggleFavorite(${product.id}, this)">
                <img src="../static/icons/icon-cards/favorite.svg" class="heart-empty">
                <img src="../static/icons/icon-cards/fav-full.svg" class="heart-full">
            </button>
        `;

        grid.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const promoContainer = document.getElementById("promo-products-container");

    if (!promoContainer) return;

    fetch("/products?is_promo=true")
        .then(res => res.json())
        .then(data => renderPromoCards(data, promoContainer));
});

function renderPromoCards(products, target) {
    target.innerHTML = "";

    if (!products.length) {
        target.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1;text-align:center;padding:40px;">
                <p>Товары не найдены</p>
            </div>
        `;
        return;
    }

    const favorites = getFavorites();

    products.forEach(product => {

        const isFav = favorites.includes(String(product.id));

        const image = Array.isArray(product.images) && product.images.length
            ? product.images[0]
            : product.images || "../static/images/placeholder.jpg";

        const price = Number(product.price).toLocaleString();
        const oldPrice = product.old_price ? Number(product.old_price).toLocaleString() : null;

        const discount = product.discount_percent;

        let priceHTML = oldPrice
            ? `
                <div class="price-wrapper">
                    <span class="old-price">${oldPrice} ₸</span>
                    <span class="price current-promo">${price} ₸</span>
                </div>
            `
            : `<span class="price">${price} ₸</span>`;

        const card = document.createElement("div");
        card.className = "carousel-item";

        card.innerHTML = `
            <a href="/products/${product.id}" class="main-card-link">

                <div class="item-top">
                    ${discount ? `<div class="discount-badge">-${discount}%</div>` : ""}
                    <img src="${image}" alt="${product.name}">
                </div>

                <div class="item-bottom">
                    <h2 class="product-title">${product.name}</h2>

                    <div class="price-cart">
                        ${priceHTML}

                        <button class="cart-btn"
                            onclick="event.preventDefault(); addToCart(${product.id})">
                            <img src="../static/icons/icon-cards/basket.svg">
                        </button>
                    </div>
                </div>

            </a>

            <button class="favorite-btn ${isFav ? "active" : ""}"
                data-id="${product.id}"
                onclick="event.preventDefault(); event.stopPropagation(); toggleFavorite(${product.id}, this)">
                <img src="../static/icons/icon-cards/favorite.svg" class="heart-empty">
                <img src="../static/icons/icon-cards/fav-full.svg" class="heart-full">
            </button>
        `;

        target.appendChild(card);
    });
}
