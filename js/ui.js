// Модуль для рендерингу інтерфейсу
import {
  categories,
  subcategories,
  documents,
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  getSubcategoriesByCategory,
  addDocument,
  updateDocument,
  deleteDocument,
  searchDocuments,
  getStats,
} from "./data.js";
import {
  checkAdminAccess,
  adminLogin,
  adminLogout,
  isAuthenticated,
} from "./auth.js";
import {
  showNotification,
  debounce,
  formatFileSize,
  getFileIcon,
} from "./utils.js";

export function setupEventListeners() {
  // Пошук
  document
    .getElementById("searchInput")
    .addEventListener("input", debounce(filterDocuments, 300));

  // Фільтр категорій
  document
    .getElementById("categoryFilter")
    .addEventListener("change", filterDocuments);

  // Форми
  document
    .getElementById("adminLoginForm")
    .addEventListener("submit", adminLogin);
  document
    .getElementById("addDocumentForm")
    .addEventListener("submit", handleAddDocument);
  document
    .getElementById("addCategoryForm")
    .addEventListener("submit", handleAddCategory);
  document
    .getElementById("editDocumentForm")
    .addEventListener("submit", handleUpdateDocument);
  document
    .getElementById("editCategoryForm")
    .addEventListener("submit", handleUpdateCategory);
  document
    .getElementById("addSubcategoryForm")
    .addEventListener("submit", handleAddSubcategory);
  document
    .getElementById("editSubcategoryForm")
    .addEventListener("submit", handleUpdateSubcategory);

  // Drag & Drop
  const dragZone = document.getElementById("dragDropZone");
  const fileInput = document.getElementById("fileInput");

  dragZone.addEventListener("click", () => fileInput.click());
  dragZone.addEventListener("dragover", handleDragOver);
  dragZone.addEventListener("dragleave", handleDragLeave);
  dragZone.addEventListener("drop", handleDrop);

  fileInput.addEventListener("change", handleFileSelect);

  // Закриття модальних вікон при кліку поза ними
  window.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none";
      document.body.style.overflow = "auto";
    }
  });
}

export function switchTab(tabName) {
  console.log("Переключення на вкладку:", tabName);

  // Переключення активних вкладок
  document
    .querySelectorAll(".nav-tab")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((content) => content.classList.remove("active"));

  // Знаходимо кнопку за tabName
  const tabButton = document.querySelector(`[onclick*="${tabName}"]`);
  if (tabButton) {
    tabButton.classList.add("active");
  }

  const tabContent = document.getElementById(tabName + "Tab");
  if (tabContent) {
    tabContent.classList.add("active");
  } else {
    console.log("Контейнер вкладки не знайдено:", tabName + "Tab");
  }

  if (tabName === "admin") {
    console.log("Переключення на адмін-панель");
    console.log("Документи:", documents.length);
    console.log("Категорії:", categories.length);
    console.log("Підкатегорії:", subcategories.length);

    updateStats();
    updateCategoryFilters(); // Оновлюємо селектори категорій в адмін-панелі
    renderCategories();
    renderSubcategories();
    renderAdminDocuments();
  } else if (tabName === "library") {
    console.log("Переключення на бібліотеку");
    renderDocuments();
  }
}

export function updateCategoryFilters() {
  const categoryFilter = document.getElementById("categoryFilter");
  const documentCategory = document.getElementById("documentCategory");

  console.log(
    "Оновлення фільтрів категорій, кількість категорій:",
    categories.length
  );

  // Оновлення фільтру категорій
  if (categoryFilter) {
    categoryFilter.innerHTML = '<option value="">Всі категорії</option>';
    categories.forEach((category) => {
      categoryFilter.innerHTML += `<option value="${category.id}">${category.icon} ${category.name}</option>`;
    });
  } else {
    console.log("Фільтр категорій не знайдено");
  }

  // Оновлення селектора категорій в формі додавання документа
  if (documentCategory) {
    documentCategory.innerHTML = '<option value="">Оберіть категорію</option>';
    categories.forEach((category) => {
      documentCategory.innerHTML += `<option value="${category.id}">${category.icon} ${category.name}</option>`;
    });
  } else {
    console.log("Селект категорій для документів не знайдено");
  }
}

export function filterDocuments() {
  const searchTerm = document.getElementById("searchInput").value;
  const categoryId =
    parseInt(document.getElementById("categoryFilter").value) || null;

  const filteredDocuments = searchDocuments(searchTerm, categoryId);
  renderDocuments(filteredDocuments);
}

export function renderDocuments(documentsToRender = documents) {
  const container = document.getElementById("filesContainer");
  const emptyState = document.getElementById("emptyState");

  if (!container) {
    console.log("Контейнер filesContainer не знайдено");
    return;
  }

  console.log("Рендеринг документів, кількість:", documentsToRender.length);

  if (documentsToRender.length === 0) {
    container.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  container.innerHTML = documentsToRender
    .map((doc) => {
      let mediaPlayer = "";

      // Додавання медіаплеєра для аудіо та відео
      if (
        doc.fileData &&
        (doc.fileType === "audio" || doc.fileType === "video")
      ) {
        const tag = doc.fileType === "audio" ? "audio" : "video";
        const controls =
          doc.fileType === "video" ? 'controls poster=""' : "controls";
        mediaPlayer = `
        <div class="media-player">
          <${tag} ${controls}>
            <source src="${doc.fileData.url}" type="${doc.fileData.type}">
            Ваш браузер не підтримує відтворення цього файлу.
          </${tag}>
        </div>
      `;
      }

      const tagsHtml =
        doc.tags && doc.tags.length > 0
          ? `<div style="margin-bottom: 15px;">
        ${doc.tags
          .map(
            (tag) =>
              `<span style="background: #e9ecef; color: #495057; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-right: 5px;">#${tag}</span>`
          )
          .join("")}
      </div>`
          : "";

      return `
      <div class="file-card">
        <div class="file-header">
          <div style="display: flex; align-items: flex-start;">
            <div class="file-icon">${doc.categoryIcon || "📄"}</div>
            <div class="file-info">
              <div class="file-title">${doc.title || "Без назви"}</div>
              <div class="file-type">${
                doc.fileData ? doc.fileData.extension.toUpperCase() : "ДОКУМЕНТ"
              }</div>
            </div>
          </div>
        </div>
        
        ${
          doc.description
            ? `<div class="file-description">${doc.description}</div>`
            : ""
        }
        
        ${tagsHtml}
        
        <div class="file-meta">
          <span class="file-category">${
            doc.categoryName || "Без категорії"
          }</span>
          <span class="file-date">${
            doc.dateAdded
              ? doc.dateAdded.toLocaleDateString("uk-UA")
              : "Дата не вказана"
          }</span>
        </div>
        
        ${mediaPlayer}
        
        <div class="file-actions">
          ${
            doc.fileData
              ? `<button class="btn btn-download" onclick="downloadDocument(${doc.id})">⬇️ Завантажити</button>`
              : ""
          }
        </div>
      </div>
    `;
    })
    .join("");
}

export function renderAdminDocuments() {
  const container = document.getElementById("adminDocumentsContainer");
  console.log("Рендеринг адмін документів, кількість:", documents.length);

  if (!container) {
    console.log("Контейнер adminDocumentsContainer не знайдено");
    return;
  }

  container.innerHTML = documents
    .map((doc) => {
      let mediaPlayer = "";

      if (
        doc.fileData &&
        (doc.fileType === "audio" || doc.fileType === "video")
      ) {
        const tag = doc.fileType === "audio" ? "audio" : "video";
        const controls =
          doc.fileType === "video" ? 'controls poster=""' : "controls";
        mediaPlayer = `
        <div class="media-player">
          <${tag} ${controls}>
            <source src="${doc.fileData.url}" type="${doc.fileData.type}">
            Ваш браузер не підтримує відтворення цього файлу.
          </${tag}>
        </div>
      `;
      }

      const tagsHtml =
        doc.tags && doc.tags.length > 0
          ? `<div style="margin-bottom: 15px;">
        ${doc.tags
          .map(
            (tag) =>
              `<span style="background: #e9ecef; color: #495057; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-right: 5px;">#${tag}</span>`
          )
          .join("")}
      </div>`
          : "";

      return `
      <div class="file-card">
        <div class="file-header">
          <div style="display: flex; align-items: flex-start;">
            <div class="file-icon">${doc.categoryIcon || "📄"}</div>
            <div class="file-info">
              <div class="file-title">${doc.title || "Без назви"}</div>
              <div class="file-type">${
                doc.fileData ? doc.fileData.extension.toUpperCase() : "ДОКУМЕНТ"
              }</div>
            </div>
          </div>
        </div>
        
        ${
          doc.description
            ? `<div class="file-description">${doc.description}</div>`
            : ""
        }
        
        ${tagsHtml}
        
        <div class="file-meta">
          <span class="file-category">${
            doc.categoryName || "Без категорії"
          }</span>
          <span class="file-date">${
            doc.dateAdded
              ? doc.dateAdded.toLocaleDateString("uk-UA")
              : "Дата не вказана"
          }</span>
        </div>
        
        ${mediaPlayer}
        
        <div class="file-actions">
          ${
            doc.fileData
              ? `<button class="btn btn-download" onclick="downloadDocument(${doc.id})">⬇️ Завантажити</button>`
              : ""
          }
          <button class="btn btn-edit" onclick="editDocument(${
            doc.id
          })">✏️ Редагувати</button>
          <button class="btn btn-delete" onclick="deleteDocumentHandler(${
            doc.id
          })">🗑️ Видалити</button>
        </div>
      </div>
    `;
    })
    .join("");
}

export function renderCategories() {
  const container = document.getElementById("categoriesContainer");
  console.log("Рендеринг категорій, кількість:", categories.length);

  if (!container) {
    console.log("Контейнер categoriesContainer не знайдено");
    return;
  }

  container.innerHTML = categories
    .map((category) => {
      const documentsCount = documents.filter(
        (doc) => doc.categoryId === category.id
      ).length;

      return `
      <div class="category-card">
        <div class="category-name">
          ${category.icon || "📁"} ${category.name || "Без назви"}
        </div>
        <div class="category-description">
          ${category.description || "Без опису"}
        </div>
        <div class="category-stats">
          <span>${documentsCount} документів</span>
          <span>ID: ${category.id}</span>
        </div>
        <div class="category-actions">
          <button class="btn btn-edit btn-small" onclick="editCategory(${
            category.id
          })">✏️ Редагувати</button>
          <button class="btn btn-delete btn-small" onclick="deleteCategoryHandler(${
            category.id
          })">🗑️ Видалити</button>
        </div>
      </div>
    `;
    })
    .join("");
}

export function updateStats() {
  const stats = getStats();
  console.log("Оновлення статистики:", stats);

  const totalDocumentsEl = document.getElementById("totalDocuments");
  const totalCategoriesEl = document.getElementById("totalCategories");
  const totalSubcategoriesEl = document.getElementById("totalSubcategories");
  const documentsThisMonthEl = document.getElementById("documentsThisMonth");

  if (totalDocumentsEl) {
    totalDocumentsEl.textContent = stats.totalDocuments;
    console.log("Оновлено totalDocuments:", stats.totalDocuments);
  } else {
    console.log("Елемент totalDocuments не знайдено");
  }

  if (totalCategoriesEl) {
    totalCategoriesEl.textContent = stats.totalCategories;
    console.log("Оновлено totalCategories:", stats.totalCategories);
  } else {
    console.log("Елемент totalCategories не знайдено");
  }

  if (totalSubcategoriesEl) {
    totalSubcategoriesEl.textContent = stats.totalSubcategories;
    console.log("Оновлено totalSubcategories:", stats.totalSubcategories);
  } else {
    console.log("Елемент totalSubcategories не знайдено");
  }

  if (documentsThisMonthEl) {
    documentsThisMonthEl.textContent = stats.documentsThisMonth;
    console.log("Оновлено documentsThisMonth:", stats.documentsThisMonth);
  } else {
    console.log("Елемент documentsThisMonth не знайдено");
  }
}

// Модальні вікна
export function openAddDocumentModal() {
  if (!isAuthenticated()) {
    checkAdminAccess("add");
    return;
  }

  updateCategoryFilters();
  document.getElementById("addDocumentModal").style.display = "block";
  document.body.style.overflow = "hidden";
}

export function openAddCategoryModal() {
  if (!isAuthenticated()) {
    showNotification("Доступ заборонено! Увійдіть як адміністратор.", "error");
    return;
  }

  document.getElementById("addCategoryModal").style.display = "block";
  document.body.style.overflow = "hidden";
}

export function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
  document.body.style.overflow = "auto";

  // Очищення форм
  if (modalId === "addDocumentModal") {
    document.getElementById("addDocumentForm").reset();
  } else if (modalId === "addCategoryModal") {
    document.getElementById("addCategoryForm").reset();
  } else if (modalId === "addSubcategoryModal") {
    document.getElementById("addSubcategoryForm").reset();
  } else if (modalId === "editDocumentModal") {
    document.getElementById("editDocumentForm").reset();
  } else if (modalId === "editCategoryModal") {
    document.getElementById("editCategoryForm").reset();
  } else if (modalId === "editSubcategoryModal") {
    document.getElementById("editSubcategoryForm").reset();
  } else if (modalId === "adminLoginModal") {
    document.getElementById("adminLoginForm").reset();
  }
}

// Обробники форм
function handleAddDocument(e) {
  e.preventDefault();

  if (!isAuthenticated()) {
    showNotification("Доступ заборонено!", "error");
    return;
  }

  const fileInput = document.getElementById("fileInput");
  const title = document.getElementById("documentTitle").value.trim();
  const description = document
    .getElementById("documentDescription")
    .value.trim();
  const categoryId = parseInt(
    document.getElementById("documentCategory").value
  );
  const tags = document.getElementById("documentTags").value.trim();

  if (!title || !categoryId) {
    showNotification("Будь ласка, заповніть всі обов'язкові поля", "error");
    return;
  }

  let fileData = null;
  let fileType = "document";

  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    const extension = file.name.split(".").pop().toLowerCase();

    // Визначення типу файлу
    if (["mp3", "wav", "ogg", "flac"].includes(extension)) {
      fileType = "audio";
    } else if (["mp4", "avi", "mkv", "mov", "webm"].includes(extension)) {
      fileType = "video";
    } else if (["jpg", "jpeg", "png", "gif", "svg"].includes(extension)) {
      fileType = "image";
    }

    fileData = {
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      extension: extension,
    };
  }

  const category = categories.find((c) => c.id === categoryId);

  const newDocument = {
    title: title,
    description: description,
    categoryId: categoryId,
    categoryName: category.name,
    categoryIcon: category.icon,
    tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
    fileData: fileData,
    fileType: fileType,
  };

  addDocument(newDocument);
  renderDocuments();
  renderAdminDocuments();
  updateStats();
  closeModal("addDocumentModal");

  showNotification("Документ успішно додано!", "success");
}

function handleAddCategory(e) {
  e.preventDefault();

  if (!isAuthenticated()) {
    showNotification("Доступ заборонено!", "error");
    return;
  }

  const name = document.getElementById("categoryName").value.trim();
  const description = document
    .getElementById("categoryDescription")
    .value.trim();
  const icon = document.getElementById("categoryIcon").value.trim() || "📁";

  if (!name) {
    showNotification("Будь ласка, введіть назву категорії", "error");
    return;
  }

  const newCategory = {
    name: name,
    description: description,
    icon: icon,
  };

  addCategory(newCategory);
  updateCategoryFilters();
  renderCategories();
  updateStats();
  closeModal("addCategoryModal");

  showNotification("Категорія успішно створена!", "success");
}

function handleUpdateDocument(e) {
  e.preventDefault();

  if (!isAuthenticated()) {
    showNotification("Доступ заборонено!", "error");
    return;
  }

  const id = parseInt(document.getElementById("editDocumentId").value);
  const title = document.getElementById("editDocumentTitle").value.trim();
  const description = document
    .getElementById("editDocumentDescription")
    .value.trim();
  const categoryId = parseInt(
    document.getElementById("editDocumentCategory").value
  );
  const tags = document.getElementById("editDocumentTags").value.trim();

  if (!title || !categoryId) {
    showNotification("Будь ласка, заповніть всі обов'язкові поля", "error");
    return;
  }

  const category = categories.find((c) => c.id === categoryId);

  const updatedDocument = {
    title: title,
    description: description,
    categoryId: categoryId,
    categoryName: category.name,
    categoryIcon: category.icon,
    tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
  };

  updateDocument(id, updatedDocument);
  renderDocuments();
  renderAdminDocuments();
  closeModal("editDocumentModal");

  showNotification("Документ успішно оновлено!", "success");
}

function handleUpdateCategory(e) {
  e.preventDefault();

  if (!isAuthenticated()) {
    showNotification("Доступ заборонено!", "error");
    return;
  }

  const id = parseInt(document.getElementById("editCategoryId").value);
  const name = document.getElementById("editCategoryName").value.trim();
  const description = document
    .getElementById("editCategoryDescription")
    .value.trim();
  const icon = document.getElementById("editCategoryIcon").value.trim() || "📁";

  if (!name) {
    showNotification("Будь ласка, введіть назву категорії", "error");
    return;
  }

  const updatedCategory = {
    name: name,
    description: description,
    icon: icon,
  };

  updateCategory(id, updatedCategory);
  updateCategoryFilters();
  renderCategories();
  renderDocuments();
  renderAdminDocuments();
  closeModal("editCategoryModal");

  showNotification("Категорію успішно оновлено!", "success");
}

// Drag & Drop
function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add("dragover");
}

function handleDragLeave(e) {
  e.preventDefault();
  e.currentTarget.classList.remove("dragover");
}

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove("dragover");

  const droppedFiles = Array.from(e.dataTransfer.files);
  if (droppedFiles.length > 0) {
    processFile(droppedFiles[0]);
  }
}

function handleFileSelect(e) {
  const selectedFiles = Array.from(e.target.files);
  if (selectedFiles.length > 0) {
    processFile(selectedFiles[0]);
  }
}

function processFile(file) {
  // Автозаповнення назви
  const nameWithoutExt =
    file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
  document.getElementById("documentTitle").value = nameWithoutExt;
}

// Глобальні функції для onclick
window.switchTab = switchTab;
window.checkAdminAccess = checkAdminAccess;
window.adminLogout = adminLogout;
window.openAddDocumentModal = openAddDocumentModal;
window.openAddCategoryModal = openAddCategoryModal;
window.closeModal = closeModal;
window.downloadDocument = downloadDocument;
window.editDocument = editDocument;
window.deleteDocumentHandler = deleteDocumentHandler;
window.editCategory = editCategory;
window.deleteCategoryHandler = deleteCategoryHandler;

function downloadDocument(id) {
  const document = documents.find((d) => d.id === id);
  if (document && document.fileData) {
    const link = document.createElement("a");
    link.href = document.fileData.url;
    link.download = document.fileData.name;
    link.click();
  } else {
    showNotification("Файл недоступний для завантаження", "error");
  }
}

function editDocument(id) {
  if (!isAuthenticated()) {
    showNotification("Доступ заборонено!", "error");
    return;
  }

  const doc = documents.find((d) => d.id === id);
  if (!doc) return;

  // Заповнюємо форму редагування
  document.getElementById("editDocumentId").value = doc.id;
  document.getElementById("editDocumentTitle").value = doc.title;
  document.getElementById("editDocumentDescription").value =
    doc.description || "";
  document.getElementById("editDocumentCategory").value = doc.categoryId;
  document.getElementById("editDocumentTags").value = doc.tags
    ? doc.tags.join(", ")
    : "";

  // Оновлюємо селект категорій
  const editCategorySelect = document.getElementById("editDocumentCategory");
  editCategorySelect.innerHTML = '<option value="">Оберіть категорію</option>';
  categories.forEach((category) => {
    editCategorySelect.innerHTML += `<option value="${category.id}" ${
      category.id === doc.categoryId ? "selected" : ""
    }>${category.icon} ${category.name}</option>`;
  });

  document.getElementById("editDocumentModal").style.display = "block";
  document.body.style.overflow = "hidden";
}

function deleteDocumentHandler(id) {
  if (!isAuthenticated()) {
    showNotification("Доступ заборонено!", "error");
    return;
  }

  if (confirm("Ви дійсно хочете видалити цей документ?")) {
    deleteDocument(id);
    renderDocuments();
    renderAdminDocuments();
    updateStats();
    showNotification("Документ видалено", "info");
  }
}

function editCategory(id) {
  if (!isAuthenticated()) {
    showNotification("Доступ заборонено!", "error");
    return;
  }

  const category = categories.find((c) => c.id === id);
  if (!category) return;

  // Заповнюємо форму редагування
  document.getElementById("editCategoryId").value = category.id;
  document.getElementById("editCategoryName").value = category.name;
  document.getElementById("editCategoryDescription").value =
    category.description || "";
  document.getElementById("editCategoryIcon").value = category.icon;

  document.getElementById("editCategoryModal").style.display = "block";
  document.body.style.overflow = "hidden";
}

function deleteCategoryHandler(id) {
  if (!isAuthenticated()) {
    showNotification("Доступ заборонено!", "error");
    return;
  }

  try {
    deleteCategory(id);
    updateCategoryFilters();
    renderCategories();
    updateStats();
    showNotification("Категорію видалено", "info");
  } catch (error) {
    showNotification(error.message, "error");
  }
}

export function addSampleDocuments() {
  // Ця функція тепер не потрібна, оскільки дані завантажуються з localStorage
  // або створюються початкові дані в data.js
}

// Додаємо функції до глобального об'єкта для доступу з HTML
window.downloadDocument = downloadDocument;
window.editDocument = editDocument;
window.deleteDocumentHandler = deleteDocumentHandler;
window.editCategory = editCategory;
window.deleteCategoryHandler = deleteCategoryHandler;
window.editSubcategory = editSubcategory;
window.deleteSubcategoryHandler = deleteSubcategoryHandler;
window.openAddDocumentModal = openAddDocumentModal;
window.openAddCategoryModal = openAddCategoryModal;
window.openAddSubcategoryModal = openAddSubcategoryModal;
window.closeModal = closeModal;
window.checkAdminAccess = checkAdminAccess;
window.adminLogout = adminLogout;
window.switchTab = switchTab;

// Функції для роботи з підкатегоріями
export function openAddSubcategoryModal() {
  if (!isAuthenticated()) {
    showNotification("Доступ заборонено!", "error");
    return;
  }

  // Заповнюємо селект категорій
  const categorySelect = document.getElementById("subcategoryCategory");
  categorySelect.innerHTML = '<option value="">Оберіть категорію</option>';
  categories.forEach((category) => {
    categorySelect.innerHTML += `<option value="${category.id}">${category.icon} ${category.name}</option>`;
  });

  document.getElementById("addSubcategoryModal").style.display = "block";
  document.body.style.overflow = "hidden";
}

export function renderSubcategories() {
  const container = document.getElementById("subcategoriesContainer");
  if (!container) return;

  console.log("Рендеринг підкатегорій, кількість:", subcategories.length);

  container.innerHTML = "";

  subcategories.forEach((subcategory) => {
    const parentCategory = categories.find(
      (c) => c.id === subcategory.categoryId
    );
    const subcategoryElement = document.createElement("div");
    subcategoryElement.className = "category-card";
    subcategoryElement.innerHTML = `
      <div class="category-header">
        <div class="category-icon">${subcategory.icon || "📁"}</div>
        <div class="category-info">
          <h4>${subcategory.name || "Без назви"}</h4>
          <p>${subcategory.description || "Без опису"}</p>
          <small>Категорія: ${
            parentCategory ? parentCategory.name : "Невідома"
          }</small>
        </div>
      </div>
      <div class="category-actions">
        <button class="btn" onclick="editSubcategory(${
          subcategory.id
        })" style="background: #007bff; color: white;">✏️</button>
        <button class="btn" onclick="deleteSubcategoryHandler(${
          subcategory.id
        })" style="background: #dc3545; color: white;">🗑️</button>
      </div>
    `;
    container.appendChild(subcategoryElement);
  });
}

function handleAddSubcategory(e) {
  e.preventDefault();

  const name = document.getElementById("subcategoryName").value.trim();
  const description = document
    .getElementById("subcategoryDescription")
    .value.trim();
  const categoryId = parseInt(
    document.getElementById("subcategoryCategory").value
  );
  const icon = document.getElementById("subcategoryIcon").value.trim() || "📁";

  if (!name || !categoryId) {
    showNotification("Заповніть всі обов'язкові поля", "error");
    return;
  }

  try {
    addSubcategory({
      name,
      description,
      categoryId,
      icon,
    });

    closeModal("addSubcategoryModal");
    renderSubcategories();
    updateStats();
    showNotification("Підкатегорію створено", "success");
  } catch (error) {
    showNotification("Помилка створення підкатегорії", "error");
  }
}

function handleUpdateSubcategory(e) {
  e.preventDefault();

  const id = parseInt(document.getElementById("editSubcategoryId").value);
  const name = document.getElementById("editSubcategoryName").value.trim();
  const description = document
    .getElementById("editSubcategoryDescription")
    .value.trim();
  const categoryId = parseInt(
    document.getElementById("editSubcategoryCategory").value
  );
  const icon =
    document.getElementById("editSubcategoryIcon").value.trim() || "📁";

  if (!name || !categoryId) {
    showNotification("Заповніть всі обов'язкові поля", "error");
    return;
  }

  try {
    updateSubcategory(id, {
      name,
      description,
      categoryId,
      icon,
    });

    closeModal("editSubcategoryModal");
    renderSubcategories();
    showNotification("Підкатегорію оновлено", "success");
  } catch (error) {
    showNotification("Помилка оновлення підкатегорії", "error");
  }
}

function editSubcategory(id) {
  if (!isAuthenticated()) {
    showNotification("Доступ заборонено!", "error");
    return;
  }

  const subcategory = subcategories.find((s) => s.id === id);
  if (!subcategory) return;

  // Заповнюємо форму редагування
  document.getElementById("editSubcategoryId").value = subcategory.id;
  document.getElementById("editSubcategoryName").value = subcategory.name;
  document.getElementById("editSubcategoryDescription").value =
    subcategory.description || "";
  document.getElementById("editSubcategoryIcon").value = subcategory.icon;

  // Оновлюємо селект категорій
  const categorySelect = document.getElementById("editSubcategoryCategory");
  categorySelect.innerHTML = '<option value="">Оберіть категорію</option>';
  categories.forEach((category) => {
    categorySelect.innerHTML += `<option value="${category.id}" ${
      category.id === subcategory.categoryId ? "selected" : ""
    }>${category.icon} ${category.name}</option>`;
  });

  document.getElementById("editSubcategoryModal").style.display = "block";
  document.body.style.overflow = "hidden";
}

function deleteSubcategoryHandler(id) {
  if (!isAuthenticated()) {
    showNotification("Доступ заборонено!", "error");
    return;
  }

  try {
    deleteSubcategory(id);
    renderSubcategories();
    updateStats();
    showNotification("Підкатегорію видалено", "info");
  } catch (error) {
    showNotification(error.message, "error");
  }
}

// Глобальні функції для HTML onclick
window.openAddSubcategoryModal = openAddSubcategoryModal;
window.editSubcategory = editSubcategory;
window.deleteSubcategoryHandler = deleteSubcategoryHandler;

function setupAdminTabs() {
  const tabBtns = document.querySelectorAll(".admin-tab-btn");
  const tabContents = document.querySelectorAll(".admin-tab-content");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((tc) => tc.classList.remove("active"));
      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
    });
  });
}

// Викликати setupAdminTabs при перемиканні на адмінку
const origSwitchTab = switchTab;
export function switchTabWithAdminTabs(tabName) {
  origSwitchTab(tabName);
  if (tabName === "admin") {
    setupAdminTabs();
  }
}
window.switchTab = switchTabWithAdminTabs;

export function updateNavVisibility() {
  const navTabs = document.getElementById("navTabs");
  const adminLoginIconBtn = document.getElementById("adminLoginIconBtn");
  if (isAuthenticated()) {
    navTabs.classList.remove("hidden");
    if (adminLoginIconBtn) adminLoginIconBtn.style.display = "none";
  } else {
    navTabs.classList.add("hidden");
    if (adminLoginIconBtn) adminLoginIconBtn.style.display = "flex";
  }
}

// Викликати updateNavVisibility після перевірки авторизації
import { checkAuthStatus } from "./auth.js";

const origCheckAuthStatus = checkAuthStatus;
export function checkAuthStatusWithNav() {
  origCheckAuthStatus();
  updateNavVisibility();
}
window.updateNavVisibility = updateNavVisibility;
