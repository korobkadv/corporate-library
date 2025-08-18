const express = require("express");
const { db } = require("../database");
const { authMiddleware, requireRoles } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

// Отримати коментарі до новини (публічно)
router.get("/:newsId", (req, res) => {
  const newsId = parseInt(req.params.newsId, 10);
  db.all(
    `SELECT c.id, c.content, c.created_at, u.username as author_name, u.id as user_id
     FROM news_comments c LEFT JOIN users u ON c.user_id = u.id
     WHERE c.news_id = ? ORDER BY c.created_at ASC`,
    [newsId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Помилка сервера" });
      res.json({ comments: rows });
    }
  );
});

// Додати коментар (для авторизованих користувачів зі статусом active — це перевіряє authMiddleware)
router.post("/:newsId", authMiddleware, (req, res) => {
  const newsId = parseInt(req.params.newsId, 10);
  const { content } = req.body || {};
  if (!content || !String(content).trim()) {
    return res.status(400).json({ message: "Порожній коментар" });
  }

  // Вимога підтвердженого email
  if (!req.user.email_verified_at) {
    return res
      .status(403)
      .json({ message: "Підтвердіть email, щоб залишати коментарі" });
  }

  db.get(
    `SELECT id FROM news WHERE id = ? AND status = 'published'`,
    [newsId],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Помилка сервера" });
      if (!row) return res.status(404).json({ message: "Новину не знайдено" });

      db.run(
        `INSERT INTO news_comments (news_id, user_id, content) VALUES (?, ?, ?)`,
        [newsId, req.user.id, String(content).trim()],
        function (e2) {
          if (e2) return res.status(500).json({ message: "Помилка сервера" });
          res.status(201).json({ id: this.lastID });
        }
      );
    }
  );
});

module.exports = router;

// Видалення коментаря (editor, admin)
router.delete(
  "/:id",
  authMiddleware,
  requireRoles("editor", "admin"),
  (req, res) => {
    const id = parseInt(req.params.id, 10);
    db.run("DELETE FROM news_comments WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).json({ message: "Помилка сервера" });
      if (this.changes === 0)
        return res.status(404).json({ message: "Коментар не знайдено" });
      res.json({ message: "Коментар видалено" });
    });
  }
);
