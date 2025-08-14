const express = require("express");
const { db } = require("../database");
const { authMiddleware, requireRoles } = require("../middleware/auth");

const router = express.Router();

// Список користувачів (тільки admin)
router.get("/", authMiddleware, requireRoles("admin"), (req, res) => {
  db.all(
    "SELECT id, username, email, role, status, created_at FROM users ORDER BY created_at DESC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Помилка сервера" });
      res.json({ users: rows });
    }
  );
});

// Оновити роль (admin)
router.put("/:id/role", authMiddleware, requireRoles("admin"), (req, res) => {
  const id = req.params.id;
  const { role } = req.body;
  if (!role) return res.status(400).json({ message: "Роль обов'язкова" });
  db.run("UPDATE users SET role = ? WHERE id = ?", [role, id], function (err) {
    if (err) return res.status(500).json({ message: "Помилка сервера" });
    if (this.changes === 0)
      return res.status(404).json({ message: "Користувача не знайдено" });
    res.json({ message: "Роль оновлено" });
  });
});

// Активувати/деактивувати користувача (admin)
router.put("/:id/status", authMiddleware, requireRoles("admin"), (req, res) => {
  const id = req.params.id;
  const { status } = req.body; // 'active' | 'pending' | 'blocked'
  if (!status) return res.status(400).json({ message: "Статус обов'язковий" });
  db.run(
    "UPDATE users SET status = ? WHERE id = ?",
    [status, id],
    function (err) {
      if (err) return res.status(500).json({ message: "Помилка сервера" });
      if (this.changes === 0)
        return res.status(404).json({ message: "Користувача не знайдено" });
      res.json({ message: "Статус оновлено" });
    }
  );
});

// Видалити користувача (admin)
router.delete("/:id", authMiddleware, requireRoles("admin"), (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ message: "Помилка сервера" });
    if (this.changes === 0)
      return res.status(404).json({ message: "Користувача не знайдено" });
    res.json({ message: "Користувача видалено" });
  });
});

module.exports = router;
