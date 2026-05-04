document.addEventListener("DOMContentLoaded", async () => {
    // Находим элементы по ID из хтмл
    const usernameDisplay = document.getElementById("display-username");
    const emailDisplay = document.getElementById("display-email");
    const logoutBtn = document.getElementById("logout-btn");

    try {
        // Запрашиваем данные у сервера
        const response = await fetch("/api/users/me");
        const data = await response.json();

        if (data.authenticated) {
            // Подставляем данные в карточку что бы вместе "имя пользователя" был имя из базы
            if (usernameDisplay) usernameDisplay.textContent = data.username;
            if (emailDisplay) emailDisplay.textContent = data.email;
        } else {
            // Если пользователь не залогинен, отправляем на вход
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Ошибка при загрузке профиля:", error);
    }
});

// Функция выхода из аккаунта
async function logout() {
    try {
        const response = await fetch("/api/auth/logout", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Ошибка при выходе:", error);
        window.location.href = "/login";
    }
}