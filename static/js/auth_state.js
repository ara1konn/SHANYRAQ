// Функция для проверки авторизации
async function checkAuth() {
    const profileLabel = document.getElementById('profile-label');
    const profileLink = document.getElementById('user-profile-link');

    try {
        const response = await fetch('/api/users/me');
        const data = await response.json();

        if (data.authenticated && data.username) {
            profileLabel.textContent = data.username;
            profileLink.href = "/profile";
        } else {
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