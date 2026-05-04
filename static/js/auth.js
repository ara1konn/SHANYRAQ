document.addEventListener('click', (e) => {

    const loginTab = e.target.closest('#tab-login');
    const registerTab = e.target.closest('#tab-register');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    const forgotLink = e.target.closest('#forgot-password');
    const backToLogin = e.target.closest('#back-to-login');
    const tabsContainer = document.querySelector('.auth-tabs');
    const forgotForm = document.getElementById('forgot-password-form');

    // вкладка регистрации
    if (registerTab) {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');

        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }

    // вкладка логина
    if (loginTab) {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');

        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    }

    // вкладка (забыли пароль) на него у меня стоит заглушка
    if (forgotLink) {
        e.preventDefault();

        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        tabsContainer.style.display = 'none';
        forgotForm.style.display = 'block';
    }
});

const registerForm = document.getElementById('register-form');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(registerForm);
        const payload = Object.fromEntries(formData.entries());

        // Простая проверка паролей на стороне пользователя
        if (payload.password && payload.password.length < 6) {
            showToast("Қате: Құпия сөз кемінде 6 таңбадан тұруы керек. Ошибка: Пароль должен состоят мин. из 6 цифр", "error");
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showToast("Керемет! Тіркелу сәтті аяқталды. Отлично! Регистрация прошла успешно", "success");

                setTimeout(() => {
                    const loginTab = document.getElementById('tab-login');
                    if (loginTab) loginTab.click();
                    registerForm.reset();
                }, 1500);

            } else {
                const error = await response.json();
                // Если ошибка, показываем красное уведомление
                showToast("Қате: " + (error.detail || "Тіркелу кезінде қате кетті. Ошибка при регистрации"), "error");
            }
        } catch (err) {
            showToast("Желі қатесі. Ошибка сервера.", "error");
        }
    });
}

// Функция для создания уведомления
function showToast(message, type = 'success') {
    // Это контейнер для уведомлений которые выходят с боку
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';

        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(container);
    }

    // Это уведомления которые выходят когда осущств. вход или регистрация. Корич - прошел, красн - ошибка
    const toast = document.createElement('div');
    const color = type === 'success' ? '#7d5e4a' : '#e74c3c';

    toast.style.cssText = `
        background: white;
        color: #333;
        padding: 16px 24px;
        border-radius: 10px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-left: 5px solid ${color};
        font-family: sans-serif;
        min-width: 250px;
        transition: all 0.5s ease;
        opacity: 0;
        transform: translateX(20px);
    `;

    toast.textContent = message;
    container.appendChild(toast);

    // Плавное появление уведомления
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10);

    // Удаление через 5 секунд
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

// Обработчик формы
const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {

                if (typeof syncAuthUI === "function") {
                    await syncAuthUI();
                }

                if (typeof mergeCartAfterLogin === 'function') {
                    await mergeCartAfterLogin();
                }

                if (typeof mergeFavoritesAfterLogin === 'function') {
                    await mergeFavoritesAfterLogin();
                }

                if (typeof syncFavoritesUI === 'function') {
                    await syncFavoritesUI();
                }

                if (typeof updateFavoritesBadge === 'function') {
                    await updateFavoritesBadge();
                }

                showToast("Қош келдіңіз! Добро пожаловать!", "success");

                setTimeout(() => {
                    window.location.href = "/profile";
                }, 1000);
            } else {
                const error = await response.json();
                showToast("Қате: " + (error.detail || "Вход не удался"), "error");
            }
        } catch (err) {
            showToast("Сервермен байланыс жоқ", "error");
        }
    });
}
async function logout() {
    await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
    });
    window.location.href = "/";
}

