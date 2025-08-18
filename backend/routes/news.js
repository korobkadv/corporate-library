const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const sanitizeHtml = require("sanitize-html");
const contentDisposition = require("content-disposition");
const { db } = require("../database");
const { authMiddleware, requireRoles } = require("../middleware/auth");
const { UPLOADS_DIR, NEWS_UPLOADS_DIR } = require("../config");

const router = express.Router();

// Налаштування для додаткових завантажень зображень/файлів новин
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.ensureDirSync(NEWS_UPLOADS_DIR);
    cb(null, NEWS_UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  // SVG заборонено
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "text/plain",
  "text/markdown",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/zip",
  "application/x-7z-compressed",
  "application/x-rar-compressed",
  "audio/mpeg",
  "audio/wav",
  "video/mp4",
  "video/avi",
  "video/mov",
];

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Непідтримуваний тип файлу"));
  },
});

// Публічний список новин з пагінацією
router.get("/", (req, res) => {
  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "10", 10);
  const offset = (page - 1) * limit;

  db.all(
    `SELECT 
       n.id,
       n.title,
       n.excerpt,
       n.featured_image,
       n.created_at,
       u.username as author_name,
       (
         SELECT COUNT(*) FROM news_comments c WHERE c.news_id = n.id
       ) as comments_count
     FROM news n 
     LEFT JOIN users u ON n.author_id = u.id
     WHERE n.status = 'published'
     ORDER BY n.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Помилка сервера" });
      db.get(
        `SELECT COUNT(*) as total FROM news WHERE status = 'published'`,
        [],
        (err2, row) => {
          if (err2) return res.status(500).json({ message: "Помилка сервера" });
          res.json({
            news: rows,
            total: row.total,
            page,
            totalPages: Math.ceil(row.total / limit),
          });
        }
      );
    }
  );
});

// Публічне отримання однієї новини
// Деталі публічної новини (id лише цифри)
router.get("/:id(\\d+)", (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.get(
    `SELECT n.*, u.username as author_name FROM news n LEFT JOIN users u ON n.author_id = u.id WHERE n.id = ? AND n.status = 'published'`,
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Помилка сервера" });
      if (!row) return res.status(404).json({ message: "Новину не знайдено" });
      // Додаємо кількість коментарів
      db.get(
        `SELECT COUNT(*) as comments FROM news_comments WHERE news_id = ?`,
        [id],
        (e2, cnt) => {
          if (e2) return res.json({ news: row });
          res.json({ news: { ...row, comments_count: cnt?.comments || 0 } });
        }
      );
    }
  );
});

// Додавання новини (editor, admin)
router.post(
  "/",
  authMiddleware,
  requireRoles("editor", "admin"),
  upload.fields([
    { name: "featured", maxCount: 1 },
    { name: "attachments", maxCount: 10 },
  ]),
  (req, res) => {
    const { title, content, excerpt, status } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Назва і контент обов'язкові" });
    }

    // Санітизація контенту (дозволяємо базові теги + img, a)
    const clean = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "img",
        "h1",
        "h2",
        "h3",
        "figure",
        "figcaption",
      ]),
      allowedAttributes: {
        a: ["href", "name", "target", "rel"],
        img: ["src", "alt", "title"],
        "*": ["style"],
      },
      allowedSchemes: ["http", "https", "mailto"],
    });

    const featured = req.files?.featured?.[0]?.filename || null;
    let names = [];
    try {
      names = JSON.parse(req.body.attachments_names || "[]");
    } catch {}
    const atts = (req.files?.attachments || []).map((f, idx) => ({
      filename: f.filename,
      original_name: f.originalname,
      title:
        names[idx] && String(names[idx]).trim()
          ? String(names[idx]).trim()
          : f.originalname,
    }));

    db.run(
      `INSERT INTO news (title, content, excerpt, featured_image, attachments, status, author_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        clean,
        excerpt || null,
        featured,
        JSON.stringify(atts),
        status === "draft" ? "draft" : "published",
        req.user.id,
      ],
      function (err) {
        if (err) return res.status(500).json({ message: "Помилка сервера" });
        res.status(201).json({ id: this.lastID });
      }
    );
  }
);

// Оновлення новини (editor, admin)
router.put(
  "/:id",
  authMiddleware,
  requireRoles("editor", "admin"),
  upload.fields([
    { name: "featured", maxCount: 1 },
    { name: "attachments", maxCount: 10 },
  ]),
  (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { title, content, excerpt, status, keep_featured } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Назва і контент обов'язкові" });
    }

    const clean = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "img",
        "h1",
        "h2",
        "h3",
        "figure",
        "figcaption",
      ]),
      allowedAttributes: {
        a: ["href", "name", "target", "rel"],
        img: ["src", "alt", "title"],
        "*": ["style"],
      },
      allowedSchemes: ["http", "https", "mailto"],
    });

    const newFeatured = req.files?.featured?.[0]?.filename || null;
    let names = [];
    try {
      names = JSON.parse(req.body.attachments_names || "[]");
    } catch {}
    const newAtts = (req.files?.attachments || []).map((f, idx) => ({
      filename: f.filename,
      original_name: f.originalname,
      title:
        names[idx] && String(names[idx]).trim()
          ? String(names[idx]).trim()
          : f.originalname,
    }));

    db.get(
      "SELECT featured_image, attachments FROM news WHERE id = ?",
      [id],
      (err, row) => {
        if (err) return res.status(500).json({ message: "Помилка сервера" });
        if (!row)
          return res.status(404).json({ message: "Новину не знайдено" });

        const existingAtts = (() => {
          try {
            const parsed = JSON.parse(row.attachments || "[]");
            return Array.isArray(parsed)
              ? parsed.map((x) =>
                  typeof x === "string"
                    ? { filename: x, original_name: x, title: x }
                    : x
                )
              : [];
          } catch {
            return [];
          }
        })();
        const mergedAtts = existingAtts.concat(newAtts);

        const featuredToSave = newFeatured
          ? newFeatured
          : keep_featured
          ? row.featured_image
          : null;

        db.run(
          `UPDATE news SET title = ?, content = ?, excerpt = ?, featured_image = ?, attachments = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [
            title,
            clean,
            excerpt || null,
            featuredToSave,
            JSON.stringify(mergedAtts),
            status === "draft" ? "draft" : "published",
            id,
          ],
          function (err2) {
            if (err2)
              return res.status(500).json({ message: "Помилка сервера" });
            if (this.changes === 0)
              return res.status(404).json({ message: "Новину не знайдено" });
            res.json({ message: "Оновлено" });
          }
        );
      }
    );
  }
);

// Видалення новини (editor, admin)
router.delete(
  "/:id",
  authMiddleware,
  requireRoles("editor", "admin"),
  (req, res) => {
    const id = parseInt(req.params.id, 10);
    db.get(
      "SELECT featured_image, attachments FROM news WHERE id = ?",
      [id],
      (err, row) => {
        if (err) return res.status(500).json({ message: "Помилка сервера" });
        if (!row)
          return res.status(404).json({ message: "Новину не знайдено" });

        // Збираємо список файлів для видалення
        const filesToRemove = [];
        if (row.featured_image) filesToRemove.push(row.featured_image);
        try {
          const parsed = JSON.parse(row.attachments || "[]");
          if (Array.isArray(parsed)) {
            parsed.forEach((a) => {
              if (typeof a === "string") filesToRemove.push(a);
              else if (a && a.filename) filesToRemove.push(a.filename);
            });
          }
        } catch {}

        // Унікальні імена
        Array.from(new Set(filesToRemove)).forEach((name) => {
          const p = path.join(NEWS_UPLOADS_DIR, name);
          try {
            fs.removeSync(p);
          } catch {}
        });

        // Видаляємо запис
        db.run("DELETE FROM news WHERE id = ?", [id], function (err2) {
          if (err2) return res.status(500).json({ message: "Помилка сервера" });
          res.json({ message: "Видалено" });
        });
      }
    );
  }
);

module.exports = router;

// Admin management endpoints
router.get(
  "/manage",
  authMiddleware,
  requireRoles("editor", "admin"),
  (req, res) => {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "50", 10);
    const offset = (page - 1) * limit;
    db.all(
      `SELECT id, title, status, excerpt, featured_image, created_at FROM news ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset],
      (err, rows) => {
        if (err) return res.status(500).json({ message: "Помилка сервера" });
        db.get(`SELECT COUNT(*) as total FROM news`, [], (err2, row) => {
          if (err2) return res.status(500).json({ message: "Помилка сервера" });
          res.json({
            news: rows,
            total: row.total,
            page,
            totalPages: Math.ceil(row.total / limit),
          });
        });
      }
    );
  }
);

router.get(
  "/manage/:id",
  authMiddleware,
  requireRoles("editor", "admin"),
  (req, res) => {
    const id = parseInt(req.params.id, 10);
    db.get(`SELECT * FROM news WHERE id = ?`, [id], (err, row) => {
      if (err) return res.status(500).json({ message: "Помилка сервера" });
      if (!row) return res.status(404).json({ message: "Новину не знайдено" });
      res.json({ news: row });
    });
  }
);
