//Моб.адаптивность - бургер
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenu = document.getElementById('closeMenu');

//При клике на бургер открывается "выезжающее" моб.меню
burger.addEventListener('click', () => {
    mobileMenu.classList.add('active');
});
//При клике на крестик моб "выезжающее" меню закрывается
closeMenu.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
});

let currentLang = localStorage.getItem("language") || "ru";

async function loadProducts() {
    const res = await fetch(`/products?lang=${currentLang}`, {
        credentials: "include",
        cache: "no-store"
    });

    const data = await res.json();
    renderProducts(data);
}

//Переключатель языка
async function loadLanguage(lang) {

    const response = await fetch(`/static/locales/${lang}.json`);
    const translations = await response.json();

    function getTranslation(obj, path) {
        return path.split('.').reduce((acc, part) => {
            return acc ? acc[part] : null;
        }, obj);
    }

    // Текст перевод
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.dataset.i18n;
        const value = getTranslation(translations, key);
        if (value) {
            el.textContent = value;
        }
    });

    // Поиск перевод
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        const value = getTranslation(translations, key);
        if (value) {
            el.placeholder = value;
        }
    });

    // сохранить язык
    localStorage.setItem("language", lang);

    document.cookie = `lang=${lang}; path=/`;

    setTimeout(() => {
        loadProducts();
    }, 50);

    // Для Пк
    const currentLang = document.getElementById("current-lang");
    if (currentLang) {
        currentLang.textContent = lang === "ru" ? "RUS" : "KAZ";
    }

    // Для мобилки
    const mobileLang = document.getElementById("mobile-current-lang");
    if (mobileLang) {
        mobileLang.textContent = lang === "ru" ? "RUS" : "KAZ";
    }
    // Обновляем товар после смены языка
    if (typeof loadProducts === "function") {
        loadProducts();
    }
}

document.addEventListener("DOMContentLoaded", () => {

    // загрузка сохранённого языка
    const savedLang = localStorage.getItem("language") || "ru";
    loadLanguage(savedLang);

    // Выпад.меню для пк
    const languageSelector = document.querySelector(".language-selector");
    const langDropdown = document.querySelector(".lang-dropdown");

    if (languageSelector && langDropdown) {

        languageSelector.addEventListener("click", (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle("active");
        });

        document.addEventListener("click", (e) => {
            if (!languageSelector.contains(e.target)) {
                langDropdown.classList.remove("active");
            }
        });

        document.querySelectorAll(".lang-dropdown li").forEach(item => {
            item.addEventListener("click", () => {
                loadLanguage(item.dataset.lang);
                langDropdown.classList.remove("active");
            });
        });
    }

    // Выпад.меню для мобилки
    const mobileToggle = document.getElementById("mobileLangToggle");
    const mobileDropdown = document.getElementById("mobileLangDropdown");

    if (mobileToggle && mobileDropdown) {

        mobileToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            mobileDropdown.classList.toggle("show");
        });

        document.addEventListener("click", (e) => {
            if (!mobileToggle.contains(e.target)) {
                mobileDropdown.classList.remove("show");
            }
        });

        document.querySelectorAll("#mobileLangDropdown li").forEach(item => {
            item.addEventListener("click", () => {
                loadLanguage(item.dataset.lang);
                mobileDropdown.classList.remove("show");
            });
        });

    }

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

    //Находим элементы по айди
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
    //Стрелки на слайдере
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

    if (!track) return;

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

//Логика поиска для Пк
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("search-input");
    const suggestions = document.getElementById("search-suggestions");

    if (!input || !suggestions) return;

    let timeout = null;

    input.addEventListener("input", () => {
        const query = input.value.trim();

        clearTimeout(timeout);

        if (query.length < 2) {
            suggestions.innerHTML = "";
            return;
        }

        timeout = setTimeout(() => {
            fetch(`/api/products/search?query=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => {
                    renderSuggestions(data);
                })
                .catch(err => console.error(err));
        }, 300);
    });

    function renderSuggestions(products) {
        suggestions.innerHTML = "";

        if (!products || !products.length) {
            suggestions.innerHTML = "<div class='no-results'>Ничего не найдено</div>";
            return;
        }

        products.slice(0, 5).forEach(p => {
            const item = document.createElement("div");
            item.classList.add("suggestion-item");

            item.innerHTML = `
                <img src="${p.images}" width="40">
                <span>${p.name}</span>
            `;

            item.addEventListener("click", () => {
                window.location.href = `/products/${p.id}`;
            });

            suggestions.appendChild(item);
        });
    }
});

//Логика для мобильного поиска
document.addEventListener("DOMContentLoaded", () => {
    const trigger = document.getElementById("search-trigger");
    const box = document.getElementById("mobile-search");
    const input = document.getElementById("mobile-search-input");
    const suggestions = document.getElementById("mobile-search-suggestions");

    let timeout;

    // При клике что бы открывался и закрывался
    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        box.classList.toggle("active");

        if (box.classList.contains("active")) {
            input.focus();
        }
    });

    // Чтобы закрывался вне клика иконки
    document.addEventListener("click", (e) => {
        if (!box.contains(e.target) && e.target !== trigger) {
            box.classList.remove("active");
            suggestions.innerHTML = "";
            input.value = "";
        }
    });

    // Живой поиск
    input.addEventListener("input", () => {
        const query = input.value.trim();

        clearTimeout(timeout);

        if (query.length < 2) {
            suggestions.innerHTML = "";
            return;
        }

        timeout = setTimeout(() => {
            fetch(`/api/products/search?query=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => render(data))
                .catch(err => console.error(err));
        }, 300);
    });

    // Рендер подсказок при поиске
    function render(products) {
        suggestions.innerHTML = "";

        if (!products || products.length === 0) {
            suggestions.innerHTML = `<div class="no-results">Ничего не найдено</div>`;
            return;
        }

        products.slice(0, 6).forEach(p => {
            const item = document.createElement("div");
            item.className = "mobile-suggestion-item";

            item.innerHTML = `
                <img src="${p.image}" alt="">
                <span>${p.name}</span>
            `;

            item.addEventListener("click", () => {
                window.location.href = `/products/${p.id}`;
            });

            suggestions.appendChild(item);
        });
    }
});