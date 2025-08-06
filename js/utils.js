// Допоміжні функції
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  // Анімація появи
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  // Автоматичне видалення
  setTimeout(() => {
    notification.style.transform = "translateX(400px)";
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Байт";
  const k = 1024;
  const sizes = ["Байт", "КБ", "МБ", "ГБ"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getFileIcon(extension) {
  const iconMap = {
    pdf: "📄",
    doc: "📝",
    docx: "📝",
    xls: "📊",
    xlsx: "📊",
    ppt: "📋",
    pptx: "📋",
    txt: "📄",
    jpg: "🖼️",
    jpeg: "🖼️",
    png: "🖼️",
    gif: "🖼️",
    mp3: "🎵",
    mp4: "🎬",
    avi: "🎬",
    zip: "📦",
    rar: "📦",
  };
  return iconMap[extension.toLowerCase()] || "📄";
}

export function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid:
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar,
    errors: {
      length:
        password.length < minLength ? `Мінімум ${minLength} символів` : null,
      uppercase: !hasUpperCase ? "Хоча б одна велика літера" : null,
      lowercase: !hasLowerCase ? "Хоча б одна мала літера" : null,
      numbers: !hasNumbers ? "Хоча б одна цифра" : null,
      special: !hasSpecialChar ? "Хоча б один спеціальний символ" : null,
    },
  };
}

export function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}
