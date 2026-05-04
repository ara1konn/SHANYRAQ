//Фильтрация, сортировка и ссылка на выпадающее меню
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("products-container");
    const filterForm = document.getElementById("filter-form");
    const categoryButtons = document.querySelectorAll(".tab-btn");
    const colorButtons = document.querySelectorAll(".color-circle");
    const sortSelect = document.getElementById("sort-select");
    const subContainer = document.getElementById("sub-categories");

    // Логика для мобилки. Открытие фильтрации сбоку. При нажатии на применить само закрывается
    const openFilters = document.getElementById("open-filters");
    const closeFilters = document.getElementById("close-filters");
    const sidebar = document.getElementById("filters-sidebar");

    if (openFilters && sidebar) {
        openFilters.addEventListener("click", () => {
            sidebar.classList.add("active");
        });
    }

    if (closeFilters && sidebar) {
        closeFilters.addEventListener("click", () => {
            sidebar.classList.remove("active");
        });
    }
    filterForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        await loadFilteredProducts();

        const sidebar = document.getElementById("filters-sidebar");
        if (sidebar) {
            sidebar.classList.remove("active");
        }
    });
    // Логика для сортировки. При нажатии сразу сортируются
    const mobileSortBtn = document.getElementById("mobile-sort");
    const mobileSortMenu = document.getElementById("mobile-sort-menu");
    const closeSort = document.getElementById("close-sort");

    if (mobileSortBtn && mobileSortMenu) {
        mobileSortBtn.addEventListener("click", () => {
            mobileSortMenu.classList.add("active");
        });
    }

    if (closeSort) {
        closeSort.addEventListener("click", () => {
            mobileSortMenu.classList.remove("active");
        });
    }

    document.querySelectorAll("#mobile-sort-menu button").forEach(btn => {
        btn.addEventListener("click", () => {
            sortSelect.value = btn.dataset.sort;
            loadFilteredProducts();
            mobileSortMenu.classList.remove("active");
        });
    });

    let currentCategory = "all";
    let currentSubCategory = null;
    window.selectedColor = null;

    const subCategoryData = {
        "livingroom": [
            { name: "Диваны", value: "sofa" },
            { name: "Кресла", value: "armchair" },
            { name: "Комоды", value: "dresser" },
            { name: "Стеллажи", value: "rack" },
            { name: "Журнальные столики", value: "coffeetable" }
        ],
        "bedroom": [
            { name: "Кровати", value: "bed" },
            { name: "Шкафы", value: "wardrobe" },
            { name: "Прикроватные тумбы", value: "bedsidetable" },
            { name: "Туалетные столики", value: "dressingtable" }
        ],
        "diningroom": [
            { name: "Обеденные столы", value: "diningtable" },
            { name: "Стулья", value: "chair" },
            { name: "Буфеты", value: "buffet" },
            { name: "Барные столы", value: "bartable" },
            { name: "Барные стулья", value: "barstool" }
        ],
        "office": [
            { name: "Рабочие столы", value: "workdesk" },
            { name: "Рабочие кресла", value: "workchair" },
            { name: "Книжные шкафы", value: "bookcase" },
            { name: "Тумбы", value: "cabinet" }
        ],
        "accessories": [
            { name: "Картины", value: "painting" },
            { name: "Зеркала", value: "mirror" },
            { name: "Ковры", value: "carpet" },
            { name: "Вазы", value: "vase" },
            { name: "Лампы", value: "lamp" }
        ]
    };

    if (!container) return;

    // Функция загрузки (собирает ВСЁ: категорию, подкатегорию, цену, цвет, сорт)
    async function loadFilteredProducts() {
        const formData = new FormData(filterForm);
        const params = new URLSearchParams();

        if (currentCategory !== "all") params.append("category", currentCategory);
        if (currentSubCategory) params.append("sub_category", currentSubCategory);
        if (sortSelect?.value) params.append("sort", sortSelect.value);

        const minPrice = formData.get("min_price");
        const maxPrice = formData.get("max_price");

        if (minPrice) params.append("min_price", minPrice);
        if (maxPrice) params.append("max_price", maxPrice);

        formData.getAll("type").forEach(t => params.append("type", t));

        if (selectedColor) params.append("color", selectedColor);

        const res = await fetch(`/products?${params.toString()}`);
        const data = await res.json();

        renderProducts(data);
    }

    //  Функция отрисовки кнопок подкатегорий
    function renderSubCategories(category) {
        if (!subContainer) return;
        subContainer.innerHTML = "";
        currentSubCategory = null;

        if (subCategoryData[category]) {
            subCategoryData[category].forEach(sub => {
                const btn = document.createElement("button");
                btn.className = "sub-tab-btn";
                btn.textContent = sub.name;

                btn.dataset.subCategory = sub.value;

                btn.addEventListener("click", () => {
                    document.querySelectorAll(".sub-tab-btn").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");

                    currentSubCategory = sub.value;
                    loadFilteredProducts();
                });
                subContainer.appendChild(btn);
            });
        }
    }

    // Отрисовка карточек
    async function renderProducts(products) {
        const cartIds = await getCartSet();
        container.innerHTML = "";
        if (products.length === 0) {
            container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 40px; font-family: 'Jost', sans-serif;">
        <p>Товары не найдены</p></div>`;
            return;
        }

        products.forEach(product => {
            const card = document.createElement("div");
            card.className = "carousel-item";

            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            const isFav = favorites.includes(String(product.id));
            const image =
                Array.isArray(product.images) && product.images.length > 0
                    ? product.images[0]
                    : product.images || '/static/images/default.jpg';

            card.innerHTML = `
            <a href="/products/${product.id}" class="main-card-link">
            <div class="item-top">
            <img src="${image}" alt="${product.name}"> ${product.status ? `
                <div class="status-badge available">${product.status}</div>
                ` : ''}
            </div>

            <div class="item-bottom">
                <h2 class="product-title">${product.name}</h2>

            <div class="price-cart">
                <span class="price">${Number(product.price).toLocaleString()} ₸</span>

                <button class="cart-btn" data-id="${product.id}">
                    <img src="../static/icons/icon-cards/basket.svg">
                </button>
                </div>
            </div>
        </a>

        <button class="favorite-btn ${isFav ? 'active' : ''}" data-id="${product.id}">
            <img src="../static/icons/icon-cards/favorite.svg" class="heart-empty">
            <img src="../static/icons/icon-cards/fav-full.svg" class="heart-full">
        </button>
    `;
            container.appendChild(card);
        });
    }

    if (sortSelect) sortSelect.addEventListener("change", loadFilteredProducts);

    categoryButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            categoryButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentCategory = btn.dataset.category;

            renderSubCategories(currentCategory);
            loadFilteredProducts();
        });
    });

    //Логика для цветов
    let selectedColor = null;
    colorButtons.forEach(btn => {
        btn.addEventListener("click", () => {

            const color = btn.dataset.color;

            if (selectedColor === color) {
                selectedColor = null;
                btn.classList.remove("active");
            } else {
                selectedColor = color;

                // убираем active у всех
                colorButtons.forEach(b => b.classList.remove("active"));

                // ставим active текущему
                btn.classList.add("active");
            }

            loadFilteredProducts();
        });
    });

    filterForm.addEventListener("submit", (e) => {
        e.preventDefault();
        loadFilteredProducts();
    });

    // Функция для автоматического применения фильтров из URL
    function checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryFromUrl = urlParams.get('category');
        const subFromUrl = urlParams.get('sub');

        if (categoryFromUrl) {
            const mainBtn = document.querySelector(`.tab-btn[data-category="${categoryFromUrl}"]`);
            if (mainBtn) {
                categoryButtons.forEach(b => b.classList.remove("active"));
                mainBtn.classList.add("active");
                currentCategory = categoryFromUrl;

                renderSubCategories(currentCategory);
            }
        }

        const subBtn = document.querySelector(`.sub-tab-btn[data-sub-category="${subFromUrl}"]`);
        if (subBtn) {
            subBtn.classList.add("active");
            currentSubCategory = subFromUrl;
        }
        loadFilteredProducts();
    }
    checkUrlParameters();

});

async function getCartSet() {
    const res = await fetch("/api/cart/items", { credentials: "include" });
    if (!res.ok) return new Set();

    const items = await res.json();
    return new Set(items.map(i => String(i.product.id)));
}