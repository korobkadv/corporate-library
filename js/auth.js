// Модуль авторизації адміністратора
import { showNotification } from "./utils.js";

let isAdminLoggedIn = false;

// Хешований пароль (в реальному застосунку це має бути на сервері)
const ADMIN_PASSWORD_HASH = "admin123"; // В продакшені використовуйте bcrypt або інші хеш-функції

export function checkAdminAccess(action = null) {
  if (isAdminLoggedIn) {
    if (action === "add") {
      // Імпортуємо функцію динамічно
      import("./ui.js").then((ui) => {
        ui.openAddDocumentModal();
      });
    } else {
      // Імпортуємо функцію динамічно
      import("./ui.js").then((ui) => {
        ui.switchTab("admin");
      });
    }
  } else {
    document.getElementById("adminLoginModal").style.display = "block";
    document.body.style.overflow = "hidden";
  }
}

export function adminLogin(e) {
  e.preventDefault();

  const password = document.getElementById("adminPassword").value;

  if (password === ADMIN_PASSWORD_HASH) {
    isAdminLoggedIn = true;
    // Використовуємо динамічний імпорт для UI функцій
    import("./ui.js").then((ui) => {
      ui.closeModal("adminLoginModal");
      ui.switchTab("admin");
    });
    showNotification("Успішний вхід в адмін-панель!", "success");
    document.getElementById("adminPassword").value = "";

    // Зберігаємо стан авторизації в sessionStorage
    sessionStorage.setItem("admin_logged_in", "true");
  } else {
    showNotification("Невірний пароль!", "error");
    document.getElementById("adminPassword").value = "";
  }
}

export function adminLogout() {
  if (confirm("Ви дійсно хочете вийти з адмін-панелі?")) {
    isAdminLoggedIn = false;
    // Використовуємо динамічний імпорт для UI функцій
    import("./ui.js").then((ui) => {
      ui.switchTab("library");
    });
    showNotification("Вихід з адмін-панелі", "info");

    // Видаляємо стан авторизації
    sessionStorage.removeItem("admin_logged_in");
  }
}

export function checkAuthStatus() {
  const savedAuth = sessionStorage.getItem("admin_logged_in");
  if (savedAuth === "true") {
    isAdminLoggedIn = true;
  }
}

export function isAuthenticated() {
  return isAdminLoggedIn;
}

// Додаємо функцію до глобального об'єкта для доступу з HTML
window.checkAdminAccess = checkAdminAccess;
