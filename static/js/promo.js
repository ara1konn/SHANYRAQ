document.addEventListener("DOMContentLoaded", () => {
    const promoContainer = document.getElementById("promo-products-container");
    if (!promoContainer) return;

    fetch("/products?is_promo=true")
        .then(res => res.json())
        .then(data => renderPromoCards(data, promoContainer));
});

function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
}

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

        const image =
            Array.isArray(product.images) && product.images.length
                ? product.images[0]
                : product.images || "../static/images/placeholder.jpg";

        const price = Number(product.price).toLocaleString();
        const oldPrice = product.old_price
            ? Number(product.old_price).toLocaleString()
            : null;

        const discount = product.discount_percent;

        const priceHTML = oldPrice
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
                onclick="event.preventDefault(); toggleFavorite(${product.id}, this)">
                <img src="../static/icons/icon-cards/favorite.svg" class="heart-empty">
                <img src="../static/icons/icon-cards/fav-full.svg" class="heart-full">
            </button>
        `;

        target.appendChild(card);
    });
}