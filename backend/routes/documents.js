const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const contentDisposition = require("content-disposition");
const { db } = require("../database");
const {
  authMiddleware,
  adminMiddleware,
  requireRoles,
} = require("../middleware/auth");

const router = express.Router();

// Налаштування Multer для завантаження файлів
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, "../uploads");
    fs.ensureDirSync(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    // Дозволені типи файлів
    const allowedTypes = [
      // Документи
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/rtf",
      "text/plain",
      "text/markdown",
      "application/vnd.oasis.opendocument.text",

      // Таблиці
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "application/vnd.oasis.opendocument.spreadsheet",

      // Презентації
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
      "application/vnd.oasis.opendocument.presentation",

      // Visio
      "application/vnd.visio",
      "application/vnd.ms-visio.drawing",
      "application/vnd.ms-visio.template",
      "application/vnd.ms-visio.stencil",

      // Зображення
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/svg+xml",

      // Аудіо
      "audio/mpeg",
      "audio/wav",

      // Відео
      "video/mp4",
      "video/avi",
      "video/mov",

      // Архіви
      "application/zip",
      "application/x-7z-compressed",
      "application/x-rar-compressed",

      // Інше
      "application/json",
      "application/xml",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Непідтримуваний тип файлу"), false);
    }
  },
});

// Helper to fix Windows/latin1 filenames to UTF-8
function decodeToUtf8IfNeeded(name) {
  if (!name) return name;
  // Heuristic: presence of typical mojibake chars
  if (/[ÃÂÐÑ]/.test(name)) {
    try {
      return Buffer.from(name, "latin1").toString("utf8");
    } catch (e) {
      return name;
    }
  }
  return name;
}

// Отримання всіх документів (публічно)
router.get("/", (req, res) => {
  const category = req.query.category || undefined;
  const categoryId = parseInt(
    req.query.categoryId || req.query.category_id || "",
    10
  );
  const search = req.query.search || undefined;
  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "10", 10);
  const offset = (page - 1) * limit;

  // Базовий запит (без пошукового фільтру — для коректної нечутливості до регістру у JS)
  let baseQuery = `
    SELECT d.*, u.username as uploaded_by_name, c.name as category_name
    FROM documents d 
    LEFT JOIN users u ON d.uploaded_by = u.id 
    LEFT JOIN categories c ON d.category_id = c.id
    WHERE 1=1
  `;
  let baseParams = [];

  if (!isNaN(categoryId)) {
    baseQuery += " AND d.category_id = ?";
    baseParams.push(categoryId);
  } else if (category) {
    baseQuery += " AND (d.category = ? OR c.name = ?)";
    baseParams.push(category, category);
  }

  baseQuery += " ORDER BY d.created_at DESC";

  db.all(baseQuery, baseParams, (err, allRows) => {
    if (err) {
      return res.status(500).json({ message: "Помилка сервера" });
    }

    // Кейс-інсенситивний пошук по кирилиці у JS
    let filtered = allRows;
    if (search) {
      const needle = String(search).toLocaleLowerCase("uk-UA");
      filtered = allRows.filter((r) => {
        const title = (r.title || "").toLocaleLowerCase("uk-UA");
        const desc = (r.description || "").toLocaleLowerCase("uk-UA");
        const tags = (r.tags || "").toLocaleLowerCase("uk-UA");
        return (
          title.includes(needle) ||
          desc.includes(needle) ||
          tags.includes(needle)
        );
      });
    }

    const total = filtered.length;
    const start = offset;
    const end = offset + parseInt(limit);
    const pageRows = filtered.slice(start, end);

    const normalized = pageRows.map((r) => ({
      ...r,
      original_name: decodeToUtf8IfNeeded(r.original_name),
    }));

    res.json({
      documents: normalized,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  });
});

// Завантаження документу (тільки адміни)
router.post(
  "/upload",
  authMiddleware,
  requireRoles("editor", "admin"),
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Файл не завантажено" });
    }

    const { title, description, category, category_id, tags, view_until } =
      req.body;
    const MAX_DESC = 2000;

    if (!title) {
      return res.status(400).json({ message: "Назва обов'язкова" });
    }

    if (description && String(description).length > MAX_DESC) {
      return res
        .status(400)
        .json({ message: `Опис перевищує ${MAX_DESC} символів` });
    }

    const originalName = decodeToUtf8IfNeeded(req.file.originalname);

    db.run(
      `INSERT INTO documents 
     (title, description, filename, original_name, file_type, file_size, category, category_id, tags, uploaded_by, view_until) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        req.file.filename,
        originalName,
        req.file.mimetype,
        req.file.size,
        category,
        category_id || null,
        tags,
        req.user.id,
        view_until || null,
      ],
      function (err) {
        if (err) {
          return res.status(500).json({ message: "Помилка сервера" });
        }

        res.status(201).json({
          message: "Документ завантажено",
          document: {
            id: this.lastID,
            title,
            description,
            filename: req.file.filename,
            original_name: originalName,
            file_type: req.file.mimetype,
            file_size: req.file.size,
            category,
            category_id: category_id || null,
            tags,
            view_until: view_until || null,
          },
        });
      }
    );
  }
);

// Скачування документу (публічно)
router.get("/download/:id", (req, res) => {
  const documentId = req.params.id;

  db.get(
    "SELECT * FROM documents WHERE id = ?",
    [documentId],
    (err, document) => {
      if (err) {
        return res.status(500).json({ message: "Помилка сервера" });
      }

      if (!document) {
        return res.status(404).json({ message: "Документ не знайдено" });
      }

      const filePath = path.join(__dirname, "../uploads", document.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Файл не знайдено" });
      }

      res.setHeader(
        "Content-Type",
        document.file_type || "application/octet-stream"
      );
      res.setHeader(
        "Content-Disposition",
        contentDisposition(document.original_name, { type: "attachment" })
      );
      res.sendFile(path.resolve(filePath));
    }
  );
});

// Видалення документу (тільки адміни)
router.delete(
  "/:id",
  authMiddleware,
  requireRoles("editor", "admin"),
  (req, res) => {
    const documentId = req.params.id;

    db.get(
      "SELECT * FROM documents WHERE id = ?",
      [documentId],
      (err, document) => {
        if (err) {
          return res.status(500).json({ message: "Помилка сервера" });
        }

        if (!document) {
          return res.status(404).json({ message: "Документ не знайдено" });
        }

        // Видалення файлу
        const filePath = path.join(__dirname, "../uploads", document.filename);
        fs.removeSync(filePath);

        // Видалення з бази даних
        db.run("DELETE FROM documents WHERE id = ?", [documentId], (err) => {
          if (err) {
            return res.status(500).json({ message: "Помилка сервера" });
          }
          res.json({ message: "Документ видалено" });
        });
      }
    );
  }
);

// Редагування документу
router.put(
  "/:id",
  authMiddleware,
  requireRoles("editor", "admin"),
  (req, res) => {
    const documentId = req.params.id;
    const { title, description, category, category_id, tags, view_until } =
      req.body;
    const MAX_DESC = 2000;

    if (description && String(description).length > MAX_DESC) {
      return res
        .status(400)
        .json({ message: `Опис перевищує ${MAX_DESC} символів` });
    }

    db.run(
      "UPDATE documents SET title = ?, description = ?, category = ?, category_id = ?, tags = ?, view_until = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [
        title,
        description,
        category,
        category_id || null,
        tags,
        view_until || null,
        documentId,
      ],
      function (err) {
        if (err) {
          return res.status(500).json({ message: "Помилка сервера" });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: "Документ не знайдено" });
        }

        res.json({ message: "Документ оновлено" });
      }
    );
  }
);

module.exports = router;
