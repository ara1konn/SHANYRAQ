document.addEventListener("DOMContentLoaded", () => {
    const promoContainer = document.getElementById("promo-products-container");

    if (!promoContainer) {
        console.warn("Контейнер promo-products-container не найден на этой странице.");
        return;
    }

    // Загрузка только акционных товаров
    fetch("http://127.0.0.1:8000/products?is_promo=true")
        .then(res => {
            if (!res.ok) throw new Error("Ошибка API: " + res.status);
            return res.json();
        })
        .then(data => {
            console.log("Данные для акций загружены:", data);
            renderHomeCards(data, promoContainer);
        })
        .catch(err => console.error("Ошибка при загрузке акций:", err));
});

function renderHomeCards(products, target) {
    target.innerHTML = "";

    if (products.length === 0) {
        target.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 40px; font-family: 'Jost', sans-serif;">
                            <p>Товары не найдены</p></div>`;
        return;
    }

    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "carousel-item";

        // 1. Логика бейджа (красный кружок)
        const discount = product.discount_percent;
        const badgeHTML = discount ? `<div class="discount-badge">-${discount}%</div>` : "";

        // 2. Логика цен (перечеркнутая и основная)
        const price = product.price ? Number(product.price).toLocaleString() : "0";
        const oldPrice = product.old_price ? Number(product.old_price).toLocaleString() : null;

        let priceHTML = "";
        if (oldPrice) {
            priceHTML = `
                <div class="price-wrapper">
                    <span class="old-price">${oldPrice} ₸</span>
                    <span class="price current-promo">${price} ₸</span>
                </div>`;
        } else {
            priceHTML = `<span class="price">${price} ₸</span>`;
        }

        // 3. Твоя родная HTML структура
        card.innerHTML = `
            <div class="item-top">
                ${badgeHTML}
                <img src="${product.image || product.image_url || '../static/images/placeholder.jpg'}" alt="${product.name}">
            </div>
            <button class="favorite-btn">
                <img src="../static/icons/icon-cards/favorite.svg" class="heart-empty">
                <img src="../static/icons/icon-cards/fav-full.svg" class="heart-full">
            </button>
            <div class="item-bottom">
                <h2 class="product-title">${product.name}</h2> 
                <div class="price-cart">
                    ${priceHTML}
                    <button class="cart-btn"><img src="../static/icons/icon-cards/basket.svg"></button>
                </div>
            </div>`;

        target.appendChild(card);
    });
}