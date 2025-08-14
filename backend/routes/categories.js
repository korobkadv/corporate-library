const express = require("express");
const { db } = require("../database");
const { authMiddleware, requireRoles } = require("../middleware/auth");

const router = express.Router();

// Публічний список категорій
router.get("/", (req, res) => {
  db.all("SELECT * FROM categories ORDER BY name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Помилка сервера" });
    res.json({ categories: rows });
  });
});

// Створити категорію (editor, admin)
router.post(
  "/",
  authMiddleware,
  requireRoles("editor", "admin"),
  (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Назва обов'язкова" });
    db.run(
      "INSERT INTO categories (name, slug) VALUES (?, ?)",
      [name, null],
      function (err) {
        if (err) {
          return res.status(500).json({ message: "Помилка сервера" });
        }
        res.status(201).json({ id: this.lastID, name });
      }
    );
  }
);

// Оновити категорію (editor, admin)
router.put(
  "/:id",
  authMiddleware,
  requireRoles("editor", "admin"),
  (req, res) => {
    const { name } = req.body;
    const id = req.params.id;
    db.run(
      "UPDATE categories SET name = ? WHERE id = ?",
      [name, id],
      function (err) {
        if (err) return res.status(500).json({ message: "Помилка сервера" });
        if (this.changes === 0)
          return res.status(404).json({ message: "Категорію не знайдено" });
        res.json({ message: "Категорію оновлено" });
      }
    );
  }
);

// Видалити категорію (editor, admin)
router.delete(
  "/:id",
  authMiddleware,
  requireRoles("editor", "admin"),
  (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM categories WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).json({ message: "Помилка сервера" });
      if (this.changes === 0)
        return res.status(404).json({ message: "Категорію не знайдено" });
      res.json({ message: "Категорію видалено" });
    });
  }
);

module.exports = router;
