// Загрузка корзины (Строго серверная)
async function loadCart() {
    const section = document.querySelector(".cart-items");
    if (!section) return;

    const response = await fetch("/api/cart/items", { credentials: "include" });

    if (response.ok) {
        // если все хорошо, показываем товары
        const serverItems = await response.json();
        renderCart(serverItems);
        calculateTotal(serverItems);
    } else if (response.status === 401) {
        // если нет, просим войти
        renderUnauthorizedState(section);
    } else {
        // Ошибка сервера
        console.error("Ошибка API");
    }
}

// Заглушка для не авторизованных пользователей
function renderUnauthorizedState(section) {
    const container = document.querySelector(".cart-products-list");
    if (!container) return;

    container.innerHTML = `
        <div class="empty-state">
            <h2>Нужна авторизация</h2>
            <4>Пожалуйста, войдите в аккаунт</h4>
        </div>
    `;
}

// Добавление в корзину (С проверкой авторизации)
async function addToCart(productId, quantity = 1) {
    const me = await fetch("/api/users/me", { credentials: "include" });
    const user = await me.json();

    if (!user.authenticated) {
        openLoginModal(); // или redirect
        return;
    }

    const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, quantity }),
        credentials: "include"
    });

    if (res.status === 401) {
        openLoginModal();
        return;
    }

    if (!res.ok) return;

    updateCartBadge();
}

// Изменение количества (Только сервер)
async function changeQuantity(productId, delta) {
    try {
        const res = await fetch("/api/cart/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                product_id: productId,
                quantity: delta
            }),
            credentials: "include"
        });

        if (res.status === 401) {
            window.location.href = "/login";
            return;
        }

        if (res.ok) {
            const data = await res.json();

            await loadCart();
            updateCartBadge();
        }
    } catch (err) {
        console.error(err);
    }
}

document.addEventListener("click", async (e) => {
    const cartBtn = e.target.closest(".cart-btn");
    if (!cartBtn) return;

    e.preventDefault();

    const productId = cartBtn.dataset.id;

    // проверка
    const me = await fetch("/api/users/me", {
        credentials: "include"
    });

    const user = await me.json();

    if (!user.authenticated) {
        alert("Войдите в аккаунт");
        window.location.href = "/login";
        return;
    }

    const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            product_id: Number(productId),
            quantity: 1
        }),
        credentials: "include"
    });

    if (res.status === 401) {
        window.location.href = "/login";
        return;
    }

    if (res.ok) {
        updateCartBadge();
    }
});

// Удаление (Только сервер)
let productToDelete = null;

// Функция рендера карточек (как они будут отображаться на страничке корзины)
function renderCart(serverItems) {
    const container = document.querySelector(".cart-products-list");
    const section = document.querySelector(".cart-items");
    if (!container || !section) return;

    // Пустая корзина
    if (!serverItems || serverItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <img src="/static/icons/shop.svg" alt="Корзина">
                <p>Ваша корзина пуста</p>
            </div>
        `;
        return;
    }

    // Рендер товаров
    container.innerHTML = serverItems.map(item => {
        const p = item.product;

        const imgSrc = Array.isArray(p.images)
            ? p.images[0]
            : (p.images || "/static/images/default.jpg");

        return `
            <div class="cart-product-item" data-product-id="${p.id}">
                <div class="product-info">
                    <img src="${imgSrc}" style="width:80px;">
                    <div>
                        <h3>${p.name}</h3>
                        <p>${p.color || ""}</p>
                    </div>
                </div>

                <div class="quantity-controls">
                    <button onclick="changeQuantity(${p.id}, -1, ${item.quantity})"
                    ${item.quantity <= 1 ? "disabled" : ""}> - </button>

                    <input type="text" value="${item.quantity}" disabled>
                    
                    <button onclick="changeQuantity(${p.id}, 1, ${item.quantity})"> + </button>
                    </div>

                <div class="product-price">
                    <span>${(p.price * item.quantity).toLocaleString()}₸</span>

                <button class="remove-item" onclick="openDeleteModal(${p.id})">
                    <img src="/static/icons/delete.svg">
                </button>
                </div>
            </div>
        `;
    }).join('');
}

// Управление модалкой (показываем и закрываем)
function openDeleteModal(productId) {
    productToDelete = String(productId);
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.remove('active');
    productToDelete = null;
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Кнопка подтверждения (Удалить)
    const confirmBtn = document.getElementById('confirm-delete');
    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            if (!productToDelete) return;
            try {
                const res = await fetch(`/api/cart/remove/${productToDelete}`, {
                    method: 'DELETE',
                    credentials: "include"
                });
                if (res.status === 401) {
                    window.location.href = "/login";
                    return;
                }
                if (res.ok) {
                    closeModal();
                    await loadCart();
                    updateCartBadge();
                }
            } catch (err) { console.error("Ошибка при удалении:", err); }
        };
    }

    // Кнопка отмены
    const cancelBtn = document.getElementById('cancel-delete');
    if (cancelBtn) cancelBtn.onclick = closeModal;

    // Закрытие по клику на оверлей
    const modalOverlay = document.getElementById('delete-modal');
    if (modalOverlay) {
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) closeModal();
        };
    }

    // Первичная загрузка
    updateCartBadge();
    if (document.querySelector(".cart-products-list")) loadCart();
});

//Функция для считывания цены
function calculateTotal(items) {
    const total = items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
    const el = document.getElementById("total-price");
    if (el) el.innerText = `${total.toLocaleString()}₸`;
}

// Глобальный доступ
window.openDeleteModal = openDeleteModal;
window.changeQuantity = changeQuantity;