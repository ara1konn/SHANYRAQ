//Моб.адаптивность - бургер. Находим по айди элементы
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenu = document.getElementById('closeMenu');

//При клике на бургер открывается "выезжающее" моб.меню (добавляет псевдокласс)
burger.addEventListener('click', () => {
    mobileMenu.classList.add('active');
});
//При клике на крестик моб "выезжающее" меню закрывается (удаляет псевдокласс)
closeMenu.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
});

//Плавающий круглый виджет. Ждем полной загрузки ДОМ и проверяем есть ли виджет, что бы не создать дубликат
document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('.widget-container')) return;

    // Создание самого виджета
    const widgetHTML = `
        <div class="widget-container">
            <div class="contact-card" id="contactCard" style="display: none;">
                <div class="card-header">Связаться с нами</div>
                <div class="card-body">
                    <a href="https://wa.me/77026154906" target="_blank" class="contact-link wa">
                        <img src="../static/images/whatsapp-icon.svg" alt="WhatsApp">
                        <span>WhatsApp</span>
                    </a>
                    <a href="tel:+77026154906" class="contact-link phone">
                        <img src="../static/images/tel-icon.svg" alt="telephone">
                        <span>+7 (702) 615-49-06</span>
                    </a>
                </div>
            </div>
            <div class="widget-button" id="mainWidgetBtn">
                <img src="../static/images/operator.png" alt="Contact">
            </div>
        </div>
    `;
    //Вставляем виджет в конец
    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    //Находим элементы по айди на странице
    const btn = document.getElementById('mainWidgetBtn');
    const card = document.getElementById('contactCard');

    //При клике на виджет карточка показывается
    btn.addEventListener('click', function (e) {
        e.stopPropagation();
        card.style.display = (card.style.display === 'none') ? 'block' : 'none';
    });
    //При клике в место вне виджета карточка закрывается
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.widget-container')) {
            card.style.display = 'none';
        }
    });
});

//Выбор языка. ЖДем полной загрузки ДОМ
document.addEventListener("DOMContentLoaded", () => {
    const currentLangEls = document.querySelectorAll("#current-lang, #mobile-current-lang");
    const langDropdowns = document.querySelectorAll(".lang-dropdown, #mobileLangDropdown");

    const translations = {
        ru: {
            catalog: "КАТАЛОГ",
            promotions: "Акции",
            about: "О нас",
            contacts: "Контакты",
            favorites: "Избранное",
            mobfavs: "Избранное",
            login: "Мой аккаунт",
            moblogin: "Мой аккаунт",
            main: "Главная",
            livingroom: "Гостиная",
            searchPlaceholder: "Поиск..."
        },
        kz: {
            catalog: "КАТАЛОГ",
            promotions: "АКЦИЯЛАР",
            about: "Біз туралы",
            contacts: "БАЙЛАНЫС",
            favorites: "Таңдаулылар",
            mobfavs: "Таңдаулылар",
            login: "Менің аккаунтым",
            moblogin: "Менің аккаунтым",
            main: "Басты бет",
            livingroom: "Қонақ бөлме",
            searchPlaceholder: "Іздеу..."
        }
    };

    let lang = localStorage.getItem("lang") || "ru";
    setLanguage(lang);
    //Определяем текущий и противоположный язык
    function setLanguage(selectedLang) {
        const otherLang = selectedLang === "ru" ? "kz" : "ru";

        // Обновляем текст RUS/KAZ во всех местах
        currentLangEls.forEach(el => el.textContent = selectedLang.toUpperCase());

        // Обновляем все списки
        langDropdowns.forEach(dropdown => {
            const li = dropdown.querySelector("li");
            if (li) {
                li.textContent = otherLang.toUpperCase();
                li.dataset.lang = otherLang;
            }
        });

        //Переводим все элементы с атрибутом data-i18n
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.dataset.i18n;
            if (translations[selectedLang] && translations[selectedLang][key]) {
                // Если внутри есть span, меняем его, если нет - весь текст
                const target = el.querySelector('span') || el;
                target.textContent = translations[selectedLang][key];
            }
        });

        // Placeholder поиска
        document.querySelectorAll(".search-input").forEach(input => {
            input.placeholder = translations[selectedLang].searchPlaceholder;
        });
    }

    // Логика кликов для всех селекторов языка
    document.addEventListener("click", (e) => {
        // Клик по селектору (открыть/закрыть)
        const selector = e.target.closest(".language-selector, #mobileLangToggle");
        if (selector) {
            e.stopPropagation();
            langDropdowns.forEach(d => d.style.display = (d.style.display === "block" ? "none" : "block"));
        } else {
            // Клик вне меню - закрываем всё
            langDropdowns.forEach(d => d.style.display = "none");
        }

        // Клик по самому языку (li)
        if (e.target.dataset.lang) {
            const selectedLang = e.target.dataset.lang;
            setLanguage(selectedLang);
            localStorage.setItem("lang", selectedLang);
        }
    });
});

//Опредление города
document.addEventListener("DOMContentLoaded", () => {
    const currentCityEls = document.querySelectorAll("#current-city, #mobile-current-city");
    const cityDropdowns = document.querySelectorAll("#cityDropdown, #mobileCityDropdown");
    const cityToggles = document.querySelectorAll("#change-city-btn, #mobileCityToggle, .edit-city-btn");

    const cities = [
        "Алматы", "Астана", "Шымкент", "Актобе",
        "Караганда", "Тараз", "Павлодар", "Усть-Каменогорск",
        "Костанай", "Кызылорда", "Атырау", "Семей",
        "Петропавловск", "Актау", "Экибастуз", "Жезказган"
    ];

    // Функция заполнения всех списков городов
    cityDropdowns.forEach(dropdown => {
        dropdown.innerHTML = "";
        cities.forEach(city => {
            const li = document.createElement("li");
            li.textContent = city;
            li.addEventListener("click", (e) => {
                e.stopPropagation();

                // Обновляем текст во всех местах сразу
                currentCityEls.forEach(el => el.textContent = city);
                localStorage.setItem("city", city);

                // Закрываем все выпадашки
                cityDropdowns.forEach(d => d.style.display = "none");
            });
            dropdown.appendChild(li);
        });
    });

    // Логика открытия выпадающего списка
    cityToggles.forEach(toggle => {
        toggle.addEventListener("click", (e) => {
            e.stopPropagation();

            // Находим выпадашку, которая находится в том же блоке, что и нажатая кнопка
            const parent = toggle.closest(".location, .mobile-option");
            const dropdown = parent.querySelector(".city-dropdown, .mobile-dropdown");

            const isVisible = dropdown.style.display === "block";

            // Сначала закроем вообще все открытые списки городов на странице
            cityDropdowns.forEach(d => d.style.display = "none");

            // Открываем нужный
            if (dropdown) {
                dropdown.style.display = isVisible ? "none" : "block";
            }
        });
    });

    // Клик в любое место экрана закрывает списки
    document.addEventListener("click", () => {
        cityDropdowns.forEach(d => d.style.display = "none");
    });

    // Загрузка сохраненного города
    const savedCity = localStorage.getItem("city");
    if (savedCity) {
        currentCityEls.forEach(el => el.textContent = savedCity);
    }
});

//Слайдер
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');

if (slides.length && dots.length && nextBtn && prevBtn) {
    let index = 0;

    //Функция показа слайда
    function showSlide(i) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        slides[i].classList.add('active');
        dots[i].classList.add('active');
    }
    //Стрелки на слайдере. 
    nextBtn.onclick = () => {
        index = (index + 1) % slides.length;
        showSlide(index);
    }
    prevBtn.onclick = () => {
        index = (index - 1 + slides.length) % slides.length;
        showSlide(index)
    }
    dots.forEach(dot => {
        dot.onclick = () => {
            index = parseInt(dot.dataset.slide)
            showSlide(index);
        }
    })
    setInterval(() => {
        index = (index + 1) % slides.length;
        showSlide(index);
    }, 5400)
}

//Карусель товаров
document.addEventListener("DOMContentLoaded", () => {

    const track = document.querySelector('.carousel-track');

    if (!track) return; // 🔥 ключ

    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');

    const items = Array.from(track.children);

    let currentIndex = 0;
    const visibleItems = 4;

    function getItemWidth() {
        const itemStyle = getComputedStyle(items[0]);
        return items[0].offsetWidth + parseFloat(itemStyle.marginRight);
    }

    function moveCarousel(animated = true) {
        const itemWidth = getItemWidth();

        track.style.transition = animated ? 'transform 0.5s ease' : 'none';
        track.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
    }

    nextButton?.addEventListener('click', () => {
        if (currentIndex < items.length - visibleItems) {
            currentIndex++;
        } else {
            currentIndex = 0;
        }
        moveCarousel();
    });

    prevButton?.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = items.length - visibleItems;
        }
        moveCarousel();
    });

});


//Фильтрация, сортировка и ссылка на выпадающее меню
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("products-container");
    const filterForm = document.getElementById("filter-form");
    const categoryButtons = document.querySelectorAll(".tab-btn");
    const colorButtons = document.querySelectorAll(".color-circle");
    const sortSelect = document.getElementById("sort-select");
    const subContainer = document.getElementById("sub-categories");

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
    function loadFilteredProducts() {
        const formData = new FormData(filterForm);
        const params = new URLSearchParams();

        if (currentCategory !== "all") params.append("category", currentCategory);

        if (currentSubCategory) params.append("sub_category", currentSubCategory);

        if (sortSelect && sortSelect.value) params.append("sort", sortSelect.value);

        const minPrice = formData.get("min_price");
        const maxPrice = formData.get("max_price");
        if (minPrice) params.append("min_price", minPrice);
        if (maxPrice) params.append("max_price", maxPrice);

        const types = formData.getAll("type");
        types.forEach(t => params.append("type", t));

        if (window.selectedColor) params.append("color", window.selectedColor);

        console.log("Запрос:", params.toString());

        fetch(`http://127.0.0.1:8000/products?${params.toString()}`)
            .then(res => res.json())
            .then(data => renderProducts(data))
            .catch(err => console.error("Ошибка:", err));
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
    function renderProducts(products) {
        container.innerHTML = "";
        if (products.length === 0) {
            container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 40px; font-family: 'Jost", sans-serif;>
            <p>Товары не найдены</p></div>`;
            return;
        }

        products.forEach(product => {
            const card = document.createElement("div");
            card.className = "carousel-item";
            card.innerHTML = `
                <div class="item-top"><img src="${product.image_url}" alt="${product.name}"></div>
                <button class="favorite-btn">
                    <img src="../static/icons/icon-cards/favorite.svg" class="heart-empty">
                    <img src="../static/icons/icon-cards/fav-full.svg" class="heart-full">
                </button>
                <div class="item-bottom">
                    <h2 class="product-title">${product.name}</h2> 
                    <div class="price-cart">
                        <span class="price">${Number(product.price).toLocaleString()} ₸</span>
                        <button class="cart-btn"><img src="../static/icons/icon-cards/basket.svg"></button>
                    </div>
                </div>`;
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

    colorButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (btn.classList.contains("active")) {
                btn.classList.remove("active");
                window.selectedColor = null;
            } else {
                colorButtons.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                window.selectedColor = btn.dataset.color;
            }
            loadFilteredProducts();
        });
    });

    filterForm.addEventListener("submit", (e) => {
        e.preventDefault();
        loadFilteredProducts();
    });

    loadFilteredProducts();
    // Функция для автоматического применения фильтров из URL
    function checkUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryFromUrl = urlParams.get('category');
        const subFromUrl = urlParams.get('sub');

        if (categoryFromUrl) {
            const mainBtn = document.querySelector(`.tab-btn[data-category="${categoryFromUrl}"]`);
            if (mainBtn) {
                // Убираем активный класс у всех и ставим этой
                categoryButtons.forEach(b => b.classList.remove("active"));
                mainBtn.classList.add("active");
                currentCategory = categoryFromUrl;

                renderSubCategories(currentCategory);
            }
        }

        if (subFromUrl) {
            setTimeout(() => {
                const subBtn = document.querySelector(`.sub-tab-btn[data-sub-category="${subFromUrl}"]`);
                if (subBtn) {
                    subBtn.classList.add("active");
                    currentSubCategory = subFromUrl;
                    loadFilteredProducts();
                }
            }, 300);
        } else {
            loadFilteredProducts();
        }
    }
    checkUrlParameters();
});