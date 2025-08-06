// Точка входу застосунку
import {
  setupEventListeners,
  updateCategoryFilters,
  renderCategories,
  renderDocuments,
  updateStats,
  checkAuthStatusWithNav,
} from "./ui.js";
import { loadData } from "./data.js";

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM завантажено, починаємо ініціалізацію...");

  // Завантаження даних
  loadData();

  // Перевірка статусу авторизації та оновлення навігації
  checkAuthStatusWithNav();

  // Налаштування обробників подій
  setupEventListeners();

  // Невелика затримка для забезпечення завантаження даних
  setTimeout(() => {
    console.log("Починаємо рендеринг інтерфейсу...");
    // Оновлення інтерфейсу
    updateCategoryFilters();
    renderCategories();
    renderDocuments();
    updateStats();
    console.log("Рендеринг завершено");
  }, 100);
});
