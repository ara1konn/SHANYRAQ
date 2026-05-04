// Функция адаптирования навигации под тек. сессию пользователя
async function syncAuthUI() {
    try {
        const res = await fetch("/api/users/me", {
            credentials: "include"
        });

        const data = await res.json().catch(() => ({}));

        const isAuth = data.authenticated === true;

        //Для Пк
        const profileLink = document.getElementById("user-profile-link");
        const profileLabel = document.getElementById("profile-label");

        //Для мобилки
        const bottomAuth = document.getElementById("bottom-auth");
        const bottomText = document.getElementById("bottom-auth-text");
        const bottomIcon = document.getElementById("bottom-auth-icon");

        if (isAuth) {

            if (profileLink) profileLink.href = "/profile";
            if (profileLabel) profileLabel.textContent = data.username || "User";

            if (bottomAuth) bottomAuth.href = "/profile";
            if (bottomText) bottomText.textContent = data.username || "User";
            if (bottomIcon) bottomIcon.src = "/static/icons/user.svg";

        } else {

            if (profileLink) profileLink.href = "/login";
            if (profileLabel) profileLabel.textContent = "Войти";

            if (bottomAuth) bottomAuth.href = "/login";
            if (bottomText) bottomText.textContent = "Войти";
            if (bottomIcon) bottomIcon.src = "/static/icons/voiti.svg";
        }

    } catch (e) {
        console.error("Auth UI error:", e);
    }
}
document.addEventListener("DOMContentLoaded", syncAuthUI);
window.addEventListener("pageshow", syncAuthUI);