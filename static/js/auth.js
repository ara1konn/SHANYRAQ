document.addEventListener('DOMContentLoaded', () => {
    const tabLogin = document.getElementById('tab-login');
    if (!tabLogin) return;
    const tabRegister = document.getElementById('tab-register');
    const forgotLink = document.getElementById('forgot-password');
    const backToLogin = document.getElementById('back-to-login');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm = document.getElementById('forgot-password-form');
    const tabsContainer = document.querySelector('.auth-tabs');

    // Переключение на "Забыли пароль"
    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        tabsContainer.style.display = 'none';
        forgotForm.style.display = 'block';
    });

    // Возврат к логину
    backToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        forgotForm.style.display = 'none';
        tabsContainer.style.display = 'flex';
        loginForm.style.display = 'block';
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    });

    // Твоя логика переключения табов (уже была)
    tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });
});

const registerForm = document.getElementById('register-form');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(registerForm);
        const payload = Object.fromEntries(formData.entries());

        // Простая проверка паролей на стороне клиента (опционально)
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
                // Если ошибка — показываем красное уведомление
                showToast("Қате: " + (error.detail || "Тіркелу кезінде қате кетті. Ошибка при регистрации"), "error");
            }
        } catch (err) {
            showToast("Желі қатесі. Ошибка сервера.", "error");
        }
    });
}

// Обработчик входа (Login)
// 1. Функция для создания уведомления (добавь её в начало файла)
function showToast(message, type = 'success') {
    // Создаем контейнер для уведомлений, если его нет
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

    // Создаем само уведомление
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

    // Плавное появление
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10);

    // Удаление через 3 секунды
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 500);
    }, 5000);
}

// 2. Твой обработчик формы
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
                if (typeof mergeCartAfterLogin === 'function') {
                    await mergeCartAfterLogin();
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


// Запускаем проверку при каждой загрузке страницы
document.addEventListener('DOMContentLoaded', checkAuth);

// showNotification (если хочешь)
function showNotification(text) {
    alert(text);
}

async function updateAuthUI() {
    try {
        const response = await fetch('/api/users/me', {
            method: 'GET',
            credentials: 'include' // Это позволяет браузеру брать куки
        });

        if (!response.ok) throw new Error("Ошибка сервера");

        const data = await response.json();
        const profileLink = document.getElementById('user-profile-link');
        const profileLabel = document.getElementById('profile-label');
        const profileIcon = document.getElementById('profile-icon');

        if (data.authenticated) {
            profileLink.href = "/profile";
            profileLabel.textContent = data.username;
            profileIcon.src = data.avatar_url || "/static/icons/user.svg";
        } else {
            profileLink.href = "/login";
            profileLabel.textContent = "Войти";
            profileIcon.src = "/static/icons/voiti.svg";
        }
    } catch (error) {
        console.error("Авторизация не удалась:", error);
    }
}

// Запускаем строго после загрузки документа и только один раз!
document.addEventListener('DOMContentLoaded', updateAuthUI);

async function checkAuth() {
    try {
        const res = await fetch('/api/users/me', {
            credentials: 'include'
        });

        if (!res.ok) return;

        const data = await res.json();

        const profileLink = document.getElementById('user-profile-link');
        const profileIcon = document.getElementById('profile-icon');
        const profileLabel = document.getElementById('profile-label');

        if (!profileLink || !profileIcon || !profileLabel) return;

        if (data.authenticated) {
            profileLink.href = "/profile";
            profileLabel.textContent = data.username;
        } else {
            profileLink.href = "/login";
            profileLabel.textContent = "Войти";
        }

    } catch (e) {
        console.log("auth skip");
    }
}