// Функция для проверки авторизации
async function checkAuth() {
    const profileLabel = document.getElementById('profile-label');
    const profileLink = document.getElementById('user-profile-link');

    try {
        // Запрашиваем данные о пользователе
        const response = await fetch('/api/users/me');
        const data = await response.json();

        if (data.authenticated && data.username) {
            // Если пользователь авторизован:
            profileLabel.textContent = data.username; // Меняем "Войти" на имя
            profileLink.href = "/profile";            // Меняем ссылку на страницу профиля
        } else {
            // Если не авторизован (или нажал "Выйти"):
            profileLabel.textContent = "Войти";
            profileLink.href = "/login";
        }
    } catch (error) {
        console.error("Ошибка проверки авторизации:", error);
        profileLabel.textContent = "Войти";
        profileLink.href = "/login";
    }
}

// Запускаем проверку при загрузке страницы
document.addEventListener('DOMContentLoaded', checkAuth);