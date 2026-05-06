function openCheckout() {
    document.getElementById("checkoutModal").classList.add("show");
}

function closeCheckout() {
    document.getElementById("checkoutModal").classList.remove("show");
}

async function submitOrder() {
    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const address = document.getElementById("address").value;

    if (!name || !phone || !address) {
        alert("Заполните все поля!");
        return;
    }

    const cartRes = await fetch("/api/cart/items", {
        credentials: "include"
    });

    const cartItems = await cartRes.json();

    const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            name,
            phone,
            address,
            items: cartItems
        })
    });

    if (response.ok) {
        showToast("Заказ успешно оформлен!", "success");
        closeCheckout();
        loadCart();
    } else {
        showToast("Ошибка при оформлении", "error");
    }
}

async function loadOrders() {
    const container = document.getElementById("orders-list");

    const response = await fetch("/api/orders/my", {
        credentials: "include"
    });

    if (!response.ok) {
        container.innerHTML = "<p>Ошибка загрузки</p>";
        return;
    }

    const orders = await response.json();
    console.log("ORDERS:", orders); // 🔍 ДЛЯ ДЕБАГА

    if (!orders || orders.length === 0) {
        container.innerHTML = "<p class='order-meta'>У вас пока нет заказов</p>";
        return;
    }


    container.innerHTML = orders.map(order => {

        const itemsHTML = (order.items || []).map(item => {
            const img = item.product?.images?.[0] || "/static/img/no-image.png";
            const name = item.product?.name || "Товар";

            return `
                <div class="order-item">
                    <img src="${img}" width="60">
                    <span>${name}</span>
                    <span>x${item.quantity}</span>
                    <span>${item.price}₸</span>
                </div>
            `;
        }).join("");

        return `
        <div class="order-card">

            <div class="order-header">
                <h3>Заказ #${order.id}</h3>
            </div>

            <p class="order-meta">📅 ${new Date(order.created_at).toLocaleString()}</p>
            <p class="order-meta">📍 ${order.address}</p>
            <p class="order-meta">📞 ${order.phone}</p>

            <div class="order-items">
                ${itemsHTML}
            </div>

            <div class="order-total">
                Итого: <strong>${order.total || 0}₸</strong>
            </div>

            <button class="delete-order-btn" onclick="deleteOrder(${order.id})">
                Удалить заказ
            </button>
        </div>
        `;
    }).join("");
}

loadOrders();

async function deleteOrder(orderId) {
    if (!confirm("Удалить этот заказ?")) return;

    const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        credentials: "include"
    });

    if (res.ok) {
        loadOrders(); // обновляем список
    } else {
        alert("Ошибка удаления");
    }
}

function showToast(message, type = "success") {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

window.openCheckout = openCheckout;
window.closeCheckout = closeCheckout;
window.submitOrder = submitOrder;
window.loadOrders = loadOrders;