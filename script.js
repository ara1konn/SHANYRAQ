//Моб.адаптация - шапка
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenu = document.getElementById('closeMenu');

burger.addEventListener('click', () => {
    mobileMenu.classList.add('active');
});

closeMenu.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
});

//Выбор языка
document.addEventListener("DOMContentLoaded", () => {
    const currentLangEl = document.getElementById("current-lang");
    const langDropdown = document.querySelector(".lang-dropdown");
    const languageSelector = document.querySelector(".language-selector");

    const translations = {
        ru: { welcome: "Добро пожаловать", searchPlaceholder: "Поиск..." },
        kz: { welcome: "Қош келдіңіз", searchPlaceholder: "Іздеу..." }
    };

    let lang = localStorage.getItem("lang") || "ru";
    setLanguage(lang);

    // Клик по dropdown
    langDropdown.querySelectorAll("li").forEach(li => {
        li.addEventListener("click", () => {
            const selectedLang = li.dataset.lang;
            setLanguage(selectedLang);
            localStorage.setItem("lang", selectedLang);
            langDropdown.style.display = "none";
            languageSelector.classList.remove("open");
        });
    });

    // Открытие/закрытие dropdown при клике на селектор
    languageSelector.addEventListener("click", () => {
        const isOpen = langDropdown.style.display === "block";
        langDropdown.style.display = isOpen ? "none" : "block";
        languageSelector.classList.toggle("open", !isOpen);
    });

    // Закрытие dropdown при клике вне
    document.addEventListener("click", e => {
        if(!languageSelector.contains(e.target)) {
            langDropdown.style.display = "none";
            languageSelector.classList.remove("open");
        }
    });

    function setLanguage(lang) {
        currentLangEl.textContent = lang.toUpperCase();
        const otherLang = lang === "ru" ? "kz" : "ru";

        // Обновляем dropdown — только альтернативный язык
        const dropdownLi = langDropdown.querySelector("li");
        dropdownLi.textContent = otherLang.toUpperCase();
        dropdownLi.dataset.lang = otherLang;

        // Перевод текстов на странице
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.dataset.i18n;
            if(translations[lang][key]) el.textContent = translations[lang][key];
        });

        // Placeholder поиска
        const searchInput = document.querySelector(".search-input");
        if(searchInput) searchInput.placeholder = translations[lang].searchPlaceholder;
    }
});


//Опредление города
document.addEventListener("DOMContentLoaded", async () => {
    const modal = document.getElementById("cityModal");
    const detectedCityEl = document.getElementById("detected-city");
    const currentCity = document.getElementById("current-city");
    const changeBtn = document.getElementById("change-city-btn");
    const cityDropdown = document.getElementById("cityDropdown");
    const changeCityBtn = document.getElementById("change-city");

    // Список городов Казахстана
    const cities = [
        "Алматы", "Астана", "Шымкент", "Актобе", 
        "Караганда", "Тараз", "Павлодар", "Усть-Каменогорск",
        "Костанай", "Кызылорда", "Атырау", "Семей",
        "Петропавловск", "Актау", "Экибастуз", "Жезказган"
    ];

    // Заполняем dropdown
    cities.forEach(city => {
        const li = document.createElement("li");
        li.textContent = city;
        cityDropdown.appendChild(li);

        li.addEventListener("click", () => {
            currentCity.textContent = city;
            localStorage.setItem("city", city);
            cityDropdown.style.display = "none";
        });
    });

    function showCityModal(city) {
        detectedCityEl.textContent = city;
        modal.style.display = "flex";
    }

    async function detectCity() {
        try {
            const res = await fetch("https://ipapi.co/json/");
            const data = await res.json();
            return data.city || "Алматы";
        } catch (e) {
            return "Алматы";
        }
    }

    // Проверка localStorage
    const savedCity = localStorage.getItem("city");
    if (savedCity) {
        currentCity.textContent = savedCity;
    } else {
        const city = await detectCity();
        showCityModal(city);

        document.getElementById("confirm-city").onclick = () => {
            currentCity.textContent = city;
            localStorage.setItem("city", city);
            modal.style.display = "none";
        };

        changeCityBtn.onclick = () => {
            modal.style.display = "none";
            cityDropdown.style.display = "block";
        };
    }

    // Кнопка ✎ в шапке
    changeBtn.onclick = () => {
        cityDropdown.style.display = cityDropdown.style.display === "block" ? "none" : "block";
    };

    // Закрываем dropdown, если клик вне него
    document.addEventListener("click", (e) => {
        if (!cityDropdown.contains(e.target) && e.target !== changeBtn) {
            cityDropdown.style.display = "none";
        }
    });
});

//Слайдер
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
let index = 0;

/* Функция показа слайда */
function showSlide(i){
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    slides[i].classList.add('active');
    dots[i].classList.add('active');
}

/* Стрелки */
document.querySelector('.next').onclick = () => {
    index = (index + 1) % slides.length;
    showSlide(index);
}

document.querySelector('.prev').onclick = () => {
    index = (index - 1 + slides.length) % slides.length;
    showSlide(index);
}

/* Индикаторы */
dots.forEach(dot => {
    dot.onclick = () => {
        index = parseInt(dot.dataset.slide);
        showSlide(index);
    }
});

/* Автопрокрутка */
setInterval(() => {
    index = (index + 1) % slides.length;
    showSlide(index);
}, 4000);

const track = document.querySelector('.carousel-track');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const items = Array.from(track.children);

function getItemWidth() {
    const itemStyle = getComputedStyle(items[0]);
    return items[0].offsetWidth + parseFloat(itemStyle.marginRight);
}

let currentIndex = 0;

const visibleItems = 4;

// Функция перемещения
function moveCarousel(animated = true) {
    const itemWidth = getItemWidth();
    if (animated) {
        track.style.transition = 'transform 0.5s ease';
    } else {
        track.style.transition = 'none';
    }
    track.style.transform = `translateX(-${currentIndex * itemWidth}px)`;
}

// Вперёд
nextButton.addEventListener('click', () => {
    if (currentIndex < items.length - visibleItems) {
        currentIndex++;
        moveCarousel();
    } else {
        currentIndex = 0;
        moveCarousel(false);
    }
});

prevButton.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        moveCarousel();
    } else {
        currentIndex = items.length - visibleItems;
        moveCarousel(false);
    }
});