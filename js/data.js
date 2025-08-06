// Модуль для роботи з даними
import { showNotification } from "./utils.js";

export let categories = [];
export let subcategories = [];
export let documents = [];
export let nextCategoryId = 7;
export let nextSubcategoryId = 1;
export let nextDocumentId = 1;

// Початкові категорії
const initialCategories = [
  {
    id: 1,
    name: "Охорона праці",
    description: "Інструкції та документи з техніки безпеки на робочих місцях",
    icon: "🛡️",
  },
  {
    id: 2,
    name: "Пожежна безпека",
    description: "Правила пожежної безпеки та евакуації",
    icon: "🔥",
  },
  {
    id: 3,
    name: "Бухгалтерія",
    description:
      "Довідники, інструкції та нормативи для бухгалтерського обліку",
    icon: "📊",
  },
  {
    id: 4,
    name: "HR та кадри",
    description: "Документи з управління персоналом, трудові договори",
    icon: "👥",
  },
  {
    id: 5,
    name: "Юридичні документи",
    description: "Договори, положення, регламенти та правові документи",
    icon: "⚖️",
  },
  {
    id: 6,
    name: "Виробництво",
    description: "Технологічні карти, регламенти виробничих процесів",
    icon: "⚙️",
  },
];

// Початкові підкатегорії
const initialSubcategories = [
  {
    id: 1,
    name: "Інструкції з ТБ",
    description: "Інструкції з техніки безпеки для різних видів робіт",
    categoryId: 1,
    icon: "📋",
  },
  {
    id: 2,
    name: "Плани евакуації",
    description: "Плани та схеми евакуації при надзвичайних ситуаціях",
    categoryId: 2,
    icon: "🚪",
  },
  {
    id: 3,
    name: "Податковий облік",
    description: "Документи з податкового обліку та звітності",
    categoryId: 3,
    icon: "💰",
  },
  {
    id: 4,
    name: "Трудові договори",
    description: "Шаблони та приклади трудових договорів",
    categoryId: 4,
    icon: "📄",
  },
  {
    id: 5,
    name: "Договори з контрагентами",
    description: "Типові договори та угоди з партнерами",
    categoryId: 5,
    icon: "🤝",
  },
  {
    id: 6,
    name: "Технологічні карти",
    description: "Технологічні карти виробничих процесів",
    categoryId: 6,
    icon: "🔧",
  },
];

// Початкові документи
const initialDocuments = [
  {
    id: 1,
    title: "Інструкція з охорони праці для офісних працівників",
    description:
      "Загальна інструкція з техніки безпеки для співробітників офісу, включаючи роботу з комп'ютерами та організацію робочого місця",
    categoryId: 1,
    categoryName: "Охорона праці",
    categoryIcon: "🛡️",
    tags: ["інструкція", "офіс", "безпека", "комп'ютери"],
    dateAdded: new Date(2024, 0, 15),
    fileData: null,
    fileType: "document",
  },
  {
    id: 2,
    title: "План евакуації при пожежі",
    description:
      "Детальний план дій та маршрути евакуації персоналу в разі виникнення пожежі в офісній будівлі",
    categoryId: 2,
    categoryName: "Пожежна безпека",
    categoryIcon: "🔥",
    tags: ["евакуація", "пожежа", "план", "безпека"],
    dateAdded: new Date(2024, 1, 22),
    fileData: null,
    fileType: "document",
  },
  {
    id: 3,
    title: "Довідник з податкового обліку",
    description:
      "Практичний довідник для бухгалтерів з актуальними змінами в податковому законодавстві України",
    categoryId: 3,
    categoryName: "Бухгалтерія",
    categoryIcon: "📊",
    tags: ["податки", "облік", "законодавство", "довідник"],
    dateAdded: new Date(2024, 2, 10),
    fileData: null,
    fileType: "document",
  },
  {
    id: 4,
    title: "Положення про відпустки",
    description:
      "Внутрішнє положення компанії про порядок надання та оформлення відпусток співробітників",
    categoryId: 4,
    categoryName: "HR та кадри",
    categoryIcon: "👥",
    tags: ["відпустки", "кадри", "положення", "оформлення"],
    dateAdded: new Date(2024, 2, 28),
    fileData: null,
    fileType: "document",
  },
  {
    id: 5,
    title: "Типовий договір постачання",
    description:
      "Шаблон договору на постачання товарів з основними умовами та вимогами",
    categoryId: 5,
    categoryName: "Юридичні документи",
    categoryIcon: "⚖️",
    tags: ["договір", "постачання", "шаблон", "юридичний"],
    dateAdded: new Date(2024, 3, 5),
    fileData: null,
    fileType: "document",
  },
  {
    id: 6,
    title: "Технологічна карта виробництва",
    description:
      "Пошаговий опис технологічного процесу виробництва основної продукції",
    categoryId: 6,
    categoryName: "Виробництво",
    categoryIcon: "⚙️",
    tags: ["технологія", "виробництво", "процес", "карта"],
    dateAdded: new Date(2024, 3, 18),
    fileData: null,
    fileType: "document",
  },
];

export function loadData() {
  try {
    console.log("Початок завантаження даних...");

    // Завантаження категорій
    const savedCategories = localStorage.getItem("library_categories");
    if (savedCategories) {
      categories = JSON.parse(savedCategories);
      nextCategoryId = Math.max(...categories.map((c) => c.id)) + 1;
      console.log("Категорії завантажено з localStorage:", categories.length);
    } else {
      categories = [...initialCategories];
      saveCategories();
      console.log("Категорії ініціалізовано:", categories.length);
    }

    // Завантаження підкатегорій
    const savedSubcategories = localStorage.getItem("library_subcategories");
    if (savedSubcategories) {
      subcategories = JSON.parse(savedSubcategories);
      nextSubcategoryId = Math.max(...subcategories.map((s) => s.id)) + 1;
      console.log(
        "Підкатегорії завантажено з localStorage:",
        subcategories.length
      );
    } else {
      subcategories = [...initialSubcategories];
      saveSubcategories();
      console.log("Підкатегорії ініціалізовано:", subcategories.length);
    }

    // Завантаження документів
    const savedDocuments = localStorage.getItem("library_documents");
    if (savedDocuments) {
      documents = JSON.parse(savedDocuments);
      // Відновлення об'єктів Date
      documents.forEach((doc) => {
        doc.dateAdded = new Date(doc.dateAdded);
      });
      nextDocumentId = Math.max(...documents.map((d) => d.id)) + 1;
      console.log("Документи завантажено з localStorage:", documents.length);
    } else {
      documents = [...initialDocuments];
      saveDocuments();
      console.log("Документи ініціалізовано:", documents.length);
    }

    console.log("Завантаження завершено успішно");
    showNotification("Дані успішно завантажено", "success");
  } catch (error) {
    console.error("Помилка завантаження даних:", error);
    showNotification("Помилка завантаження даних", "error");

    // Відновлення з резервних даних
    categories = [...initialCategories];
    subcategories = [...initialSubcategories];
    documents = [...initialDocuments];
  }
}

export function saveCategories() {
  try {
    localStorage.setItem("library_categories", JSON.stringify(categories));
  } catch (error) {
    console.error("Помилка збереження категорій:", error);
    showNotification("Помилка збереження категорій", "error");
  }
}

export function saveSubcategories() {
  try {
    localStorage.setItem(
      "library_subcategories",
      JSON.stringify(subcategories)
    );
  } catch (error) {
    console.error("Помилка збереження підкатегорій:", error);
    showNotification("Помилка збереження підкатегорій", "error");
  }
}

export function saveDocuments() {
  try {
    localStorage.setItem("library_documents", JSON.stringify(documents));
  } catch (error) {
    console.error("Помилка збереження документів:", error);
    showNotification("Помилка збереження документів", "error");
  }
}

export function addCategory(category) {
  category.id = nextCategoryId++;
  categories.push(category);
  saveCategories();
  return category;
}

export function updateCategory(id, updatedCategory) {
  const index = categories.findIndex((c) => c.id === id);
  if (index !== -1) {
    categories[index] = { ...categories[index], ...updatedCategory };
    saveCategories();

    // Оновлення документів цієї категорії
    documents.forEach((doc) => {
      if (doc.categoryId === id) {
        doc.categoryName = updatedCategory.name;
        doc.categoryIcon = updatedCategory.icon;
      }
    });
    saveDocuments();

    return categories[index];
  }
  return null;
}

export function deleteCategory(id) {
  const docsInCategory = documents.filter(
    (doc) => doc.categoryId === id
  ).length;
  if (docsInCategory > 0) {
    throw new Error(
      `Неможливо видалити категорію, оскільки в ній є ${docsInCategory} документів`
    );
  }

  categories = categories.filter((cat) => cat.id !== id);
  saveCategories();
}

// CRUD операції для підкатегорій
export function addSubcategory(subcategory) {
  subcategory.id = nextSubcategoryId++;
  subcategories.push(subcategory);
  saveSubcategories();
  return subcategory;
}

export function updateSubcategory(id, updatedSubcategory) {
  const index = subcategories.findIndex((s) => s.id === id);
  if (index !== -1) {
    subcategories[index] = { ...subcategories[index], ...updatedSubcategory };
    saveSubcategories();
    return subcategories[index];
  }
  return null;
}

export function deleteSubcategory(id) {
  const docsInSubcategory = documents.filter(
    (doc) => doc.subcategoryId === id
  ).length;
  if (docsInSubcategory > 0) {
    throw new Error(
      `Неможливо видалити підкатегорію, оскільки в ній є ${docsInSubcategory} документів`
    );
  }

  subcategories = subcategories.filter((sub) => sub.id !== id);
  saveSubcategories();
}

export function getSubcategoriesByCategory(categoryId) {
  return subcategories.filter((sub) => sub.categoryId === categoryId);
}

export function addDocument(document) {
  document.id = nextDocumentId++;
  document.dateAdded = new Date();
  documents.push(document);
  saveDocuments();
  return document;
}

export function updateDocument(id, updatedDocument) {
  const index = documents.findIndex((d) => d.id === id);
  if (index !== -1) {
    documents[index] = { ...documents[index], ...updatedDocument };
    saveDocuments();
    return documents[index];
  }
  return null;
}

export function deleteDocument(id) {
  documents = documents.filter((doc) => doc.id !== id);
  saveDocuments();
}

export function getDocumentsByCategory(categoryId) {
  return documents.filter((doc) => doc.categoryId === categoryId);
}

export function searchDocuments(query, categoryId = null) {
  const searchTerm = query.toLowerCase();

  return documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm) ||
      doc.description.toLowerCase().includes(searchTerm) ||
      doc.categoryName.toLowerCase().includes(searchTerm) ||
      (doc.tags &&
        doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm)));

    const matchesCategory = !categoryId || doc.categoryId === categoryId;

    return matchesSearch && matchesCategory;
  });
}

export function getStats() {
  const totalDocs = documents.length;
  const totalCats = categories.length;
  const totalSubcats = subcategories.length;

  // Документи цього місяця
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const docsThisMonth = documents.filter((doc) => {
    const docDate = new Date(doc.dateAdded);
    return (
      docDate.getMonth() === currentMonth &&
      docDate.getFullYear() === currentYear
    );
  }).length;

  return {
    totalDocuments: totalDocs,
    totalCategories: totalCats,
    totalSubcategories: totalSubcats,
    documentsThisMonth: docsThisMonth,
  };
}
